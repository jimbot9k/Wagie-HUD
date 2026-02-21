import { storage } from './storage';

// ─── Types ────────────────────────────────────────────────────────────────────

export type SalaryPeriod = 'hourly' | 'weekly' | 'fortnightly' | 'annually';
export type ScheduleType = 'mon-fri-9-5' | '996' | 'custom';

export interface DaySchedule {
  enabled: boolean;
  /** Hour of day, 0-23 */
  start: number;
  /** Hour of day, 0-23 (exclusive) */
  end: number;
}

export interface WagieConfig {
  salary: number;
  period: SalaryPeriod;
  /** ISO 4217 currency code, e.g. 'USD' */
  currency: string;
}

export interface CagieConfig {
  type: ScheduleType;
  /** Only used when type === 'custom' */
  customSchedule: Record<string, DaySchedule>;
}

export interface EarningsData {
  totalEarned: number;
  /** 'YYYY-MM-DD' → dollars earned that day */
  dailyTotals: Record<string, number>;
  /** 'YYYY-MM-DD' → minutes worked that day */
  dailyMinutes: Record<string, number>;
}

interface PersistedState {
  wagieConfig: WagieConfig | null;
  cagieConfig: CagieConfig | null;
  earnings: EarningsData;
  /** Unix timestamp (ms) of the last recorded tick */
  lastTickAt: number | null;
}

// ─── Schedule presets ─────────────────────────────────────────────────────────

export const DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;
export type Day = (typeof DAYS)[number];

export const DAY_LABELS: Record<Day, string> = {
  sun: 'Sunday',
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
};

export const PRESET_SCHEDULES: Record<ScheduleType, Record<Day, DaySchedule>> = {
  'mon-fri-9-5': Object.fromEntries(
    DAYS.map((d, i) => [d, { enabled: i >= 1 && i <= 5, start: 9, end: 17 }])
  ) as Record<Day, DaySchedule>,
  '996': Object.fromEntries(
    DAYS.map((d, i) => [d, { enabled: i >= 1 && i <= 6, start: 9, end: 21 }])
  ) as Record<Day, DaySchedule>,
  custom: Object.fromEntries(
    DAYS.map((d, i) => [d, { enabled: i >= 1 && i <= 5, start: 9, end: 17 }])
  ) as Record<Day, DaySchedule>,
};

// ─── Currency helpers ─────────────────────────────────────────────────────────

export function formatMoney(amount: number, currency = 'USD'): string {
  return amount.toLocaleString('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// ─── App State ────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'wagie-hud-state';
const LIFE_EXPECTANCY_DAYS = Math.round(73 * 365.25);

class AppStateClass {
  wagieConfig = $state<WagieConfig | null>(null);
  cagieConfig = $state<CagieConfig | null>(null);
  earnings = $state<EarningsData>({
    totalEarned: 0,
    dailyTotals: {},
    dailyMinutes: {},
  });
  /** Increments every second — allows time-sensitive getters to stay reactive. */
  _tick = $state(0);
  /** Unix timestamp (ms) of the most recent tick — persisted so we can catch up on resume. */
  lastTickAt = $state<number | null>(null);

  // ── Schedule ────────────────────────────────────────────────────────────────

  get effectiveSchedule(): Record<Day, DaySchedule> {
    if (!this.cagieConfig) return PRESET_SCHEDULES['mon-fri-9-5'];
    if (this.cagieConfig.type === 'custom') {
      return this.cagieConfig.customSchedule as Record<Day, DaySchedule>;
    }
    return PRESET_SCHEDULES[this.cagieConfig.type];
  }

  /** Total scheduled hours per week */
  get weeklyHours(): number {
    return Object.values(this.effectiveSchedule)
      .filter((d) => d.enabled)
      .reduce((sum, d) => sum + (d.end - d.start), 0);
  }

  /** Number of scheduled work days per week */
  get workDaysPerWeek(): number {
    return Object.values(this.effectiveSchedule).filter((d) => d.enabled).length;
  }

  get scheduledHoursPerDay(): number {
    return this.workDaysPerWeek > 0 ? this.weeklyHours / this.workDaysPerWeek : 8;
  }

  // ── Rate ─────────────────────────────────────────────────────────────────────

  get hourlyRate(): number {
    if (!this.wagieConfig) return 0;
    const { salary, period } = this.wagieConfig;
    const wh = this.weeklyHours || 40;
    switch (period) {
      case 'hourly':
        return salary;
      case 'weekly':
        return salary / wh;
      case 'fortnightly':
        return salary / (wh * 2);
      case 'annually':
        return salary / (wh * 52);
    }
  }

  get ratePerSecond(): number {
    return this.hourlyRate / 3600;
  }

  // ── Is earning now? ──────────────────────────────────────────────────────────

  get isEarning(): boolean {
    void this._tick; // track the tick so this re-evaluates every second
    if (!this.cagieConfig || !this.wagieConfig) return false;
    const now = new Date();
    const day = DAYS[now.getDay()];
    const sched = this.effectiveSchedule[day];
    if (!sched?.enabled) return false;
    const hourFloat = now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600;
    return hourFloat >= sched.start && hourFloat < sched.end;
  }

  // ── Date helpers ─────────────────────────────────────────────────────────────

  get todayKey(): string {
    return new Date().toISOString().split('T')[0];
  }

  weekKeys(): string[] {
    const today = new Date();
    const dow = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1));
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d.toISOString().split('T')[0];
    });
  }

  // ── Stats ────────────────────────────────────────────────────────────────────

  get dailyEarned(): number {
    return this.earnings.dailyTotals[this.todayKey] ?? 0;
  }
  get dailyMinutesWorked(): number {
    return this.earnings.dailyMinutes[this.todayKey] ?? 0;
  }

  get weeklyEarned(): number {
    return this.weekKeys().reduce((s, k) => s + (this.earnings.dailyTotals[k] ?? 0), 0);
  }
  get weeklyMinutesWorked(): number {
    return this.weekKeys().reduce((s, k) => s + (this.earnings.dailyMinutes[k] ?? 0), 0);
  }

  get monthlyEarned(): number {
    const p = this.todayKey.slice(0, 7);
    return Object.entries(this.earnings.dailyTotals)
      .filter(([k]) => k.startsWith(p))
      .reduce((s, [, v]) => s + v, 0);
  }
  get monthlyMinutesWorked(): number {
    const p = this.todayKey.slice(0, 7);
    return Object.entries(this.earnings.dailyMinutes)
      .filter(([k]) => k.startsWith(p))
      .reduce((s, [, v]) => s + v, 0);
  }

  get yearlyEarned(): number {
    const p = this.todayKey.slice(0, 4);
    return Object.entries(this.earnings.dailyTotals)
      .filter(([k]) => k.startsWith(p))
      .reduce((s, [, v]) => s + v, 0);
  }
  get yearlyMinutesWorked(): number {
    const p = this.todayKey.slice(0, 4);
    return Object.entries(this.earnings.dailyMinutes)
      .filter(([k]) => k.startsWith(p))
      .reduce((s, [, v]) => s + v, 0);
  }

  get lifetimeDaysWorked(): number {
    const totalMin = Object.values(this.earnings.dailyMinutes).reduce((s, v) => s + v, 0);
    const hpd = this.scheduledHoursPerDay || 8;
    return totalMin / 60 / hpd;
  }

  get lifetimeExpectancyDays(): number {
    return LIFE_EXPECTANCY_DAYS;
  }

  get yearWorkDaysTotal(): number {
    const yr = new Date().getFullYear();
    const start = new Date(yr, 0, 1);
    const end = new Date(yr, 11, 31);
    let count = 0;
    const d = new Date(start);
    while (d <= end) {
      if (this.effectiveSchedule[DAYS[d.getDay()]]?.enabled) count++;
      d.setDate(d.getDate() + 1);
    }
    return count;
  }

  get yearWorkDaysWorked(): number {
    const p = this.todayKey.slice(0, 4);
    const totalMin = Object.entries(this.earnings.dailyMinutes)
      .filter(([k]) => k.startsWith(p))
      .reduce((s, [, v]) => s + v, 0);
    const hpd = this.scheduledHoursPerDay || 8;
    return totalMin / 60 / hpd;
  }

  // ── Chart data ───────────────────────────────────────────────────────────────

  private cumulativeSum(arr: number[]): number[] {
    let sum = 0;
    return arr.map((v) => +(sum += v).toFixed(4));
  }

  chartData(days = 7): { labels: string[]; earned: number[]; hoursWorked: number[] } {
    const labels: string[] = [];
    const earned: number[] = [];
    const hoursWorked: number[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      labels.push(
        d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
      );
      earned.push(+(this.earnings.dailyTotals[key] ?? 0).toFixed(2));
      hoursWorked.push(+((this.earnings.dailyMinutes[key] ?? 0) / 60).toFixed(2));
    }
    return {
      labels,
      earned: this.cumulativeSum(earned),
      hoursWorked: this.cumulativeSum(hoursWorked),
    };
  }

  chartDataForPeriod(period: 'today' | '7d' | '30d' | 'lifetime'): {
    labels: string[];
    earned: number[];
    hoursWorked: number[];
  } {
    void this._tick;

    if (period === 'today') {
      const now = new Date();
      const day = DAYS[now.getDay()];
      const sched = this.effectiveSchedule[day];
      const totalEarned = this.dailyEarned;
      const elapsedMinutes = this.dailyMinutesWorked;

      if (!sched?.enabled || this.hourlyRate === 0 || elapsedMinutes === 0) {
        return {
          labels: ['Today'],
          earned: [+totalEarned.toFixed(2)],
          hoursWorked: [+(elapsedMinutes / 60).toFixed(2)],
        };
      }

      const BUCKET = 5; // minutes per bucket

      // Current time in minutes-since-midnight, clamped to schedule end
      const nowMin = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
      const schedStartMin = sched.start * 60;
      const schedEndMin = sched.end * 60;
      const effectiveNowMin = Math.min(nowMin, schedEndMin);

      // Infer tracking start by working backwards from current position
      const trackingStartMin = Math.max(schedStartMin, effectiveNowMin - elapsedMinutes);

      // Snap bucket start to the nearest 5-min boundary at or after sched start
      const firstBucket = Math.ceil(schedStartMin / BUCKET) * BUCKET;

      // Only generate buckets up to (but not past) now
      const lastBucketEnd = Math.floor(effectiveNowMin / BUCKET) * BUCKET;

      if (firstBucket >= lastBucketEnd) {
        return {
          labels: ['Now'],
          earned: [+totalEarned.toFixed(2)],
          hoursWorked: [+(elapsedMinutes / 60).toFixed(2)],
        };
      }

      const labels: string[] = [];
      const earned: number[] = [];
      const hoursWorked: number[] = [];

      for (let bStart = firstBucket; bStart < lastBucketEnd; bStart += BUCKET) {
        const bEnd = bStart + BUCKET;

        // Format label as "H:MM AM/PM" for every bucket
        const h = Math.floor(bStart / 60);
        const m = bStart % 60;
        const ampm = h >= 12 ? 'PM' : 'AM';
        const h12 = h % 12 === 0 ? 12 : h % 12;
        labels.push(`${h12}:${String(m).padStart(2, '0')} ${ampm}`);

        // Intersect this bucket with the tracked window
        const trackedStart = Math.max(bStart, trackingStartMin);
        const trackedEnd = Math.min(bEnd, effectiveNowMin);
        const trackedMin = Math.max(0, trackedEnd - trackedStart);

        if (trackedMin <= 0) {
          earned.push(0);
          hoursWorked.push(0);
        } else {
          const fraction = trackedMin / elapsedMinutes;
          earned.push(+(totalEarned * fraction).toFixed(4));
          hoursWorked.push(+(trackedMin / 60).toFixed(4));
        }
      }

      return {
        labels,
        earned: this.cumulativeSum(earned),
        hoursWorked: this.cumulativeSum(hoursWorked),
      };
    }

    if (period === 'lifetime') {
      const monthly: Record<string, { earned: number; minutes: number }> = {};
      for (const [k, v] of Object.entries(this.earnings.dailyTotals)) {
        const m = k.slice(0, 7);
        if (!monthly[m]) monthly[m] = { earned: 0, minutes: 0 };
        monthly[m].earned += v;
      }
      for (const [k, v] of Object.entries(this.earnings.dailyMinutes)) {
        const m = k.slice(0, 7);
        if (!monthly[m]) monthly[m] = { earned: 0, minutes: 0 };
        monthly[m].minutes += v;
      }
      const sortedMonths = Object.keys(monthly).sort();
      if (sortedMonths.length === 0) {
        return { labels: ['No data'], earned: [0], hoursWorked: [0] };
      }
      const monthlyEarned = sortedMonths.map((m) => +monthly[m].earned.toFixed(2));
      const monthlyHoursWorked = sortedMonths.map((m) => +(monthly[m].minutes / 60).toFixed(2));
      return {
        labels: sortedMonths.map((m) => {
          const [y, mo] = m.split('-');
          return new Date(+y, +mo - 1, 1).toLocaleDateString('en-US', {
            month: 'short',
            year: '2-digit',
          });
        }),
        earned: this.cumulativeSum(monthlyEarned),
        hoursWorked: this.cumulativeSum(monthlyHoursWorked),
      };
    }

    return this.chartData(period === '30d' ? 30 : 7);
  }

  // ── Currency ─────────────────────────────────────────────────────────────────

  get currency(): string {
    return this.wagieConfig?.currency ?? 'USD';
  }

  fmt(amount: number): string {
    return formatMoney(amount, this.currency);
  }

  // ── Actions ──────────────────────────────────────────────────────────────────

  tick(): void {
    this._tick += 1;
    this.lastTickAt = Date.now();
    if (!this.isEarning || this.ratePerSecond === 0) return;
    const amount = this.ratePerSecond;
    const key = this.todayKey;
    this.earnings.totalEarned += amount;
    this.earnings.dailyTotals[key] = (this.earnings.dailyTotals[key] ?? 0) + amount;
    this.earnings.dailyMinutes[key] = (this.earnings.dailyMinutes[key] ?? 0) + 1 / 60;
    this.save();
  }

  cope(): void {
    const key = this.todayKey;
    this.earnings.totalEarned = Math.max(0, this.earnings.totalEarned - 5);
    this.earnings.dailyTotals[key] = Math.max(0, (this.earnings.dailyTotals[key] ?? 0) - 5);
    this.save();
  }

  poop(): void {
    // Lose 5 minutes of earnings
    const amount = this.hourlyRate * (5 / 60);
    const key = this.todayKey;
    this.earnings.totalEarned = Math.max(0, this.earnings.totalEarned - amount);
    this.earnings.dailyTotals[key] = Math.max(0, (this.earnings.dailyTotals[key] ?? 0) - amount);
    this.earnings.dailyMinutes[key] = Math.max(0, (this.earnings.dailyMinutes[key] ?? 0) - 5);
    this.save();
  }

  setWagie(config: WagieConfig): void {
    this.wagieConfig = config;
    this.save();
  }

  setCagie(config: CagieConfig): void {
    this.cagieConfig = config;
    this.save();
  }

  // ── Persistence ──────────────────────────────────────────────────────────────

  /**
   * Restores persisted state and calculates any earnings accumulated while the
   * app was closed (based on the saved `lastTickAt` timestamp vs. now).
   * Returns the total catch-up amount earned so the caller can surface it.
   */
  load(): number {
    const saved = storage.get<PersistedState>(STORAGE_KEY);
    if (!saved) return 0;
    if (saved.wagieConfig) this.wagieConfig = saved.wagieConfig;
    if (saved.cagieConfig) this.cagieConfig = saved.cagieConfig;
    if (saved.earnings) this.earnings = saved.earnings;
    if (saved.lastTickAt) this.lastTickAt = saved.lastTickAt;
    return this.catchup();
  }

  /**
   * Calculates earnings for the window between `lastTickAt` and now, respecting
   * the work schedule for each calendar day in the range.  Mutates `earnings`
   * in place and saves, then returns the total amount credited.
   */
  private catchup(): number {
    if (!this.lastTickAt || !this.wagieConfig || !this.cagieConfig) return 0;

    const from = new Date(this.lastTickAt);
    const to = new Date();

    // Skip if less than 5 seconds have passed (normal startup lag)
    if (to.getTime() - from.getTime() < 5_000) return 0;

    const rate = this.ratePerSecond;
    if (rate === 0) return 0;

    let totalCatchup = 0;

    // Walk each calendar day from `from` to `to`
    const cursor = new Date(from.getFullYear(), from.getMonth(), from.getDate());
    const endDate = new Date(to.getFullYear(), to.getMonth(), to.getDate());

    while (cursor <= endDate) {
      const dayKey = cursor.toISOString().split('T')[0];
      const dayOfWeek = DAYS[cursor.getDay()];
      const sched = this.effectiveSchedule[dayOfWeek];

      if (sched?.enabled) {
        const workStart = new Date(
          cursor.getFullYear(),
          cursor.getMonth(),
          cursor.getDate(),
          sched.start,
          0,
          0
        );
        const workEnd = new Date(
          cursor.getFullYear(),
          cursor.getMonth(),
          cursor.getDate(),
          sched.end,
          0,
          0
        );

        // Clamp the work window to the offline window [from, to]
        const clampStart = Math.max(workStart.getTime(), from.getTime());
        const clampEnd = Math.min(workEnd.getTime(), to.getTime());

        if (clampEnd > clampStart) {
          const earnedSecs = (clampEnd - clampStart) / 1000;
          const earned = earnedSecs * rate;
          const minutes = earnedSecs / 60;

          this.earnings.totalEarned += earned;
          this.earnings.dailyTotals[dayKey] = (this.earnings.dailyTotals[dayKey] ?? 0) + earned;
          this.earnings.dailyMinutes[dayKey] = (this.earnings.dailyMinutes[dayKey] ?? 0) + minutes;
          totalCatchup += earned;
        }
      }

      cursor.setDate(cursor.getDate() + 1);
    }

    if (totalCatchup > 0) this.save();
    return totalCatchup;
  }

  save(): void {
    storage.set<PersistedState>(STORAGE_KEY, {
      wagieConfig: this.wagieConfig,
      cagieConfig: this.cagieConfig,
      earnings: this.earnings,
      lastTickAt: this.lastTickAt,
    });
  }

  reset(): void {
    this.wagieConfig = null;
    this.cagieConfig = null;
    this.earnings = { totalEarned: 0, dailyTotals: {}, dailyMinutes: {} };
    this.lastTickAt = null;
    storage.remove(STORAGE_KEY);
  }
}

export { AppStateClass };
export const appState = new AppStateClass();
