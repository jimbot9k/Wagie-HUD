import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  AppStateClass,
  formatMoney,
  PRESET_SCHEDULES,
  DAYS,
  type WagieConfig,
  type CagieConfig,
} from '../appState.svelte';

// ── Storage mock ──────────────────────────────────────────────────────────────
vi.mock('../storage', () => ({
  storage: {
    get: vi.fn().mockReturnValue(null),
    set: vi.fn(),
    remove: vi.fn(),
  },
}));

import { storage } from '../storage';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const WAGIE: WagieConfig = { salary: 72_000, period: 'annually', currency: 'USD' };
const CAGIE: CagieConfig = { type: 'mon-fri-9-5', customSchedule: {} };

// Mon-Fri 9-5: 8h × 5 = 40 weekly hours
const WEEKLY_HOURS = 40;
const HOURLY_RATE = WAGIE.salary / (WEEKLY_HOURS * 52); // ≈ 34.615

// Monday Feb 23 2026 at 10:30am (within 9-17 window)
const MONDAY_10_30 = new Date(2026, 1, 23, 10, 30, 0);
// Monday Feb 23 2026 at 08:00am (before work)
const MONDAY_08_00 = new Date(2026, 1, 23, 8, 0, 0);
// Saturday Feb 21 2026 at 10:00am (non-work day)
const SATURDAY_10_00 = new Date(2026, 1, 28, 10, 0, 0);
// Date key for Monday Feb 23 2026 — derived the same way the todayKey getter
// does (new Date().toISOString().split('T')[0]) so it is timezone-safe.
const KEY_MON = MONDAY_10_30.toISOString().split('T')[0];

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Mirrors the day-key derivation inside catchup(): local-calendar date → UTC
 * string via toISOString().  Required for assertions that check per-day totals
 * written by the catch-up logic, because the cursor uses local midnight.
 */
function localDateKey(d: Date): string {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString().split('T')[0];
}

function makeState(wagie = WAGIE, cagie = CAGIE): AppStateClass {
  const s = new AppStateClass();
  s.wagieConfig = wagie;
  s.cagieConfig = cagie;
  return s;
}

// =============================================================================
// formatMoney
// =============================================================================

describe('formatMoney()', () => {
  it('formats whole dollars with 2 decimal places', () => {
    expect(formatMoney(1000)).toBe('$1,000.00');
  });

  it('formats fractional amounts', () => {
    expect(formatMoney(1.5)).toBe('$1.50');
  });

  it('formats zero', () => {
    expect(formatMoney(0)).toBe('$0.00');
  });

  it('formats a non-USD currency', () => {
    const result = formatMoney(500, 'EUR');
    // locale result contains 500 and EUR symbol/code — just check it's truthy
    expect(result).toContain('500');
  });
});

// =============================================================================
// effectiveSchedule
// =============================================================================

describe('effectiveSchedule', () => {
  it('defaults to mon-fri-9-5 when no cagieConfig is set', () => {
    const s = new AppStateClass();
    expect(s.effectiveSchedule).toEqual(PRESET_SCHEDULES['mon-fri-9-5']);
  });

  it('returns the preset for type mon-fri-9-5', () => {
    const s = makeState();
    expect(s.effectiveSchedule).toEqual(PRESET_SCHEDULES['mon-fri-9-5']);
  });

  it('returns the preset for type 996', () => {
    const s = makeState(WAGIE, { type: '996', customSchedule: {} });
    expect(s.effectiveSchedule).toEqual(PRESET_SCHEDULES['996']);
  });

  it('returns the customSchedule when type is custom', () => {
    const custom = {
      mon: { enabled: true, start: 8, end: 18 },
      tue: { enabled: false, start: 9, end: 17 },
      // … other days omitted for brevity
    };
    const s = makeState(WAGIE, { type: 'custom', customSchedule: custom });
    expect(s.effectiveSchedule).toEqual(custom);
  });
});

// =============================================================================
// weeklyHours / workDaysPerWeek / scheduledHoursPerDay
// =============================================================================

describe('weeklyHours', () => {
  it('is 40 for Mon-Fri 9-5', () => {
    expect(makeState().weeklyHours).toBe(40);
  });

  it('is 72 for 996 (Mon-Sat 9-21)', () => {
    const s = makeState(WAGIE, { type: '996', customSchedule: {} });
    expect(s.weeklyHours).toBe(72);
  });
});

describe('workDaysPerWeek', () => {
  it('is 5 for Mon-Fri', () => {
    expect(makeState().workDaysPerWeek).toBe(5);
  });

  it('is 6 for 996', () => {
    const s = makeState(WAGIE, { type: '996', customSchedule: {} });
    expect(s.workDaysPerWeek).toBe(6);
  });
});

describe('scheduledHoursPerDay', () => {
  it('is 8 for Mon-Fri 9-5', () => {
    expect(makeState().scheduledHoursPerDay).toBe(8);
  });

  it('falls back to 8 when no days are enabled', () => {
    const noDays: CagieConfig = {
      type: 'custom',
      customSchedule: Object.fromEntries(
        DAYS.map((d) => [d, { enabled: false, start: 9, end: 17 }])
      ),
    };
    const s = makeState(WAGIE, noDays);
    expect(s.scheduledHoursPerDay).toBe(8);
  });
});

// =============================================================================
// hourlyRate / ratePerSecond
// =============================================================================

describe('hourlyRate', () => {
  it('returns 0 when wagieConfig is null', () => {
    const s = new AppStateClass();
    expect(s.hourlyRate).toBe(0);
  });

  it('returns the salary directly for period "hourly"', () => {
    const s = makeState({ salary: 50, period: 'hourly', currency: 'USD' });
    expect(s.hourlyRate).toBe(50);
  });

  it('divides salary by weekly hours for period "weekly"', () => {
    const s = makeState({ salary: 800, period: 'weekly', currency: 'USD' });
    expect(s.hourlyRate).toBeCloseTo(800 / WEEKLY_HOURS, 6);
  });

  it('divides salary by two weeks of hours for period "fortnightly"', () => {
    const s = makeState({ salary: 1600, period: 'fortnightly', currency: 'USD' });
    expect(s.hourlyRate).toBeCloseTo(1600 / (WEEKLY_HOURS * 2), 6);
  });

  it('divides salary by annual hours for period "annually"', () => {
    const s = makeState();
    expect(s.hourlyRate).toBeCloseTo(HOURLY_RATE, 6);
  });
});

describe('ratePerSecond', () => {
  it('equals hourlyRate / 3600', () => {
    const s = makeState();
    expect(s.ratePerSecond).toBeCloseTo(HOURLY_RATE / 3600, 10);
  });
});

// =============================================================================
// isEarning
// =============================================================================

describe('isEarning', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('returns false when wagieConfig is null', () => {
    vi.setSystemTime(MONDAY_10_30);
    const s = new AppStateClass();
    s.cagieConfig = CAGIE;
    expect(s.isEarning).toBe(false);
  });

  it('returns false when cagieConfig is null', () => {
    vi.setSystemTime(MONDAY_10_30);
    const s = new AppStateClass();
    s.wagieConfig = WAGIE;
    expect(s.isEarning).toBe(false);
  });

  it('returns true on a Monday at 10:30am (within 9-17)', () => {
    vi.setSystemTime(MONDAY_10_30);
    expect(makeState().isEarning).toBe(true);
  });

  it('returns false on a Monday before work (8:00am)', () => {
    vi.setSystemTime(MONDAY_08_00);
    expect(makeState().isEarning).toBe(false);
  });

  it('returns false on a Saturday (non-work day)', () => {
    vi.setSystemTime(SATURDAY_10_00);
    expect(makeState().isEarning).toBe(false);
  });

  it('returns false at exactly work-end time (schedule is exclusive)', () => {
    vi.setSystemTime(new Date(2026, 1, 23, 17, 0, 0)); // 17:00:00 = start of end hour
    expect(makeState().isEarning).toBe(false);
  });

  it('returns true just before work-end (16:59:59)', () => {
    vi.setSystemTime(new Date(2026, 1, 23, 16, 59, 59));
    expect(makeState().isEarning).toBe(true);
  });
});

// =============================================================================
// todayKey / weekKeys
// =============================================================================

describe('todayKey', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('returns YYYY-MM-DD for today', () => {
    vi.setSystemTime(MONDAY_10_30);
    expect(new AppStateClass().todayKey).toBe(KEY_MON);
  });
});

describe('weekKeys()', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('returns 7 keys starting from the Monday of the current week', () => {
    vi.setSystemTime(MONDAY_10_30); // Monday Feb 23
    const keys = new AppStateClass().weekKeys();
    expect(keys).toHaveLength(7);
    expect(keys[0]).toBe('2026-02-23'); // Monday
    expect(keys[6]).toBe('2026-03-01'); // Sunday
  });

  it('starts from the correct Monday when today is mid-week (Wednesday)', () => {
    vi.setSystemTime(new Date(2026, 1, 25, 10, 0, 0)); // Wednesday Feb 25
    const keys = new AppStateClass().weekKeys();
    expect(keys[0]).toBe('2026-02-23'); // Still Monday Feb 23
  });

  it('starts from the correct Monday when today is Sunday', () => {
    vi.setSystemTime(new Date(2026, 1, 22, 10, 0, 0)); // Sunday Feb 22
    const keys = new AppStateClass().weekKeys();
    expect(keys[0]).toBe('2026-02-16'); // Previous Monday
  });
});

// =============================================================================
// Earnings stats
// =============================================================================

describe('earnings stats', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('dailyEarned returns 0 with no data', () => {
    vi.setSystemTime(MONDAY_10_30);
    expect(new AppStateClass().dailyEarned).toBe(0);
  });

  it('dailyEarned returns the amount for today', () => {
    vi.setSystemTime(MONDAY_10_30);
    const s = new AppStateClass();
    s.earnings.dailyTotals[KEY_MON] = 50;
    expect(s.dailyEarned).toBe(50);
  });

  it('weeklyEarned sums all days in the current week', () => {
    vi.setSystemTime(MONDAY_10_30);
    const s = new AppStateClass();
    // Seed Mon + Tue of the same week
    s.earnings.dailyTotals['2026-02-23'] = 40;
    s.earnings.dailyTotals['2026-02-24'] = 35;
    expect(s.weeklyEarned).toBeCloseTo(75, 2);
  });

  it('weeklyMinutesWorked sums daily minutes across the week', () => {
    vi.setSystemTime(MONDAY_10_30);
    const s = new AppStateClass();
    s.earnings.dailyMinutes['2026-02-23'] = 480;
    s.earnings.dailyMinutes['2026-02-24'] = 240;
    expect(s.weeklyMinutesWorked).toBe(720);
  });

  it('monthlyEarned sums entries for the current month', () => {
    vi.setSystemTime(MONDAY_10_30);
    const s = new AppStateClass();
    s.earnings.dailyTotals['2026-02-01'] = 20;
    s.earnings.dailyTotals['2026-02-23'] = 30;
    s.earnings.dailyTotals['2026-01-15'] = 999; // different month — excluded
    expect(s.monthlyEarned).toBeCloseTo(50, 2);
  });

  it('yearlyEarned sums entries for the current year', () => {
    vi.setSystemTime(MONDAY_10_30);
    const s = new AppStateClass();
    s.earnings.dailyTotals['2026-01-01'] = 100;
    s.earnings.dailyTotals['2026-12-31'] = 200;
    s.earnings.dailyTotals['2025-12-31'] = 999; // different year — excluded
    expect(s.yearlyEarned).toBeCloseTo(300, 2);
  });

  it('lifetimeDaysWorked converts total minutes to working days', () => {
    const s = makeState();
    // 8h per day, 40h/week, scheduledHoursPerDay = 8
    s.earnings.dailyMinutes['2026-02-23'] = 480; // 8 hours = 1 day
    expect(s.lifetimeDaysWorked).toBeCloseTo(1, 4);
  });

  it('yearWorkDaysTotal reflects hours from Jan 1 to Dec 31 in current year', () => {
    vi.setSystemTime(MONDAY_10_30); // Year = 2026
    const s = makeState();
    // 2026 has 261 Mon–Fri weekdays (Jan 1 = Thursday)
    expect(s.yearWorkDaysTotal).toBe(261);
  });

  it('yearWorkDaysWorked converts year minutes to days', () => {
    vi.setSystemTime(MONDAY_10_30);
    const s = makeState(); // scheduledHoursPerDay = 8
    s.earnings.dailyMinutes['2026-02-23'] = 480; // 8h = 1 day
    expect(s.yearWorkDaysWorked).toBeCloseTo(1, 4);
  });
});

// =============================================================================
// chartData() and chartDataForPeriod()
// =============================================================================

describe('chartData(n)', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('returns n entries in each array', () => {
    vi.setSystemTime(MONDAY_10_30);
    const s = new AppStateClass();
    const result = s.chartData(7);
    expect(result.labels).toHaveLength(7);
    expect(result.earned).toHaveLength(7);
    expect(result.hoursWorked).toHaveLength(7);
  });

  it("includes today's earnings in the last slot", () => {
    vi.setSystemTime(MONDAY_10_30);
    const s = new AppStateClass();
    s.earnings.dailyTotals[KEY_MON] = 77.5;
    const result = s.chartData(7);
    expect(result.earned[6]).toBe(77.5);
  });
});

describe("chartDataForPeriod('today')", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('returns a single "Today" point when no schedule is configured', () => {
    vi.setSystemTime(MONDAY_10_30);
    const s = new AppStateClass(); // no cagie config
    s.wagieConfig = WAGIE;
    const result = s.chartDataForPeriod('today');
    expect(result.labels).toEqual(['Today']);
  });

  it('returns a single point when nothing has been earned yet', () => {
    vi.setSystemTime(MONDAY_10_30);
    const s = makeState();
    // dailyMinutesWorked = 0 → triggers the early return
    const result = s.chartDataForPeriod('today');
    expect(result.labels).toEqual(['Today']);
    expect(result.earned[0]).toBe(0);
  });

  it('returns bucketed data once the worker has started earning', () => {
    // 10:30am, worked 90 min (started at 9am)
    vi.setSystemTime(MONDAY_10_30);
    const s = makeState();
    s.earnings.dailyTotals[KEY_MON] = 100;
    s.earnings.dailyMinutes[KEY_MON] = 90;
    const result = s.chartDataForPeriod('today');
    // Buckets from 9:00 to 10:30 in 5-min slots = 18 buckets
    expect(result.labels.length).toBe(18);
    expect(result.labels[0]).toBe('9:00 AM');
    // Last cumulative value should ≈ total earned (may have tiny floating-point drift)
    const total = result.earned[result.earned.length - 1];
    expect(total).toBeCloseTo(100, 1);
  });

  it('returns "Now" point when firstBucket >= lastBucketEnd', () => {
    // Set time to 9:00:00am exactly — no full 5-min bucket has elapsed yet.
    // Compute the key from the test time so the lookup is timezone-safe.
    const testTime = new Date(2026, 1, 23, 9, 0, 0);
    vi.setSystemTime(testTime);
    const testKey = testTime.toISOString().split('T')[0];
    const s = makeState();
    s.earnings.dailyTotals[testKey] = 5;
    s.earnings.dailyMinutes[testKey] = 0.5;
    const result = s.chartDataForPeriod('today');
    expect(result.labels).toEqual(['Now']);
  });
});

describe("chartDataForPeriod('7d') and '30d'", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("'7d' returns 7 labels", () => {
    vi.setSystemTime(MONDAY_10_30);
    const result = new AppStateClass().chartDataForPeriod('7d');
    expect(result.labels).toHaveLength(7);
  });

  it("'30d' returns 30 labels", () => {
    vi.setSystemTime(MONDAY_10_30);
    const result = new AppStateClass().chartDataForPeriod('30d');
    expect(result.labels).toHaveLength(30);
  });
});

describe("chartDataForPeriod('lifetime')", () => {
  it('returns a No-data point when earnings are empty', () => {
    const result = new AppStateClass().chartDataForPeriod('lifetime');
    expect(result.labels).toEqual(['No data']);
    expect(result.earned).toEqual([0]);
  });

  it('aggregates daily totals into monthly buckets', () => {
    const s = new AppStateClass();
    s.earnings.dailyTotals['2026-01-10'] = 100;
    s.earnings.dailyTotals['2026-01-20'] = 50;
    s.earnings.dailyTotals['2026-02-05'] = 200;
    const result = s.chartDataForPeriod('lifetime');
    expect(result.labels).toHaveLength(2);
    expect(result.earned[0]).toBeCloseTo(150, 2); // Jan cumulative
    expect(result.earned[1]).toBeCloseTo(350, 2); // Jan + Feb cumulative
  });

  it('computes hoursWorked per monthly bucket from dailyMinutes', () => {
    const s = new AppStateClass();
    s.earnings.dailyTotals['2026-01-10'] = 100;
    s.earnings.dailyMinutes['2026-01-10'] = 480; // 8h
    const result = s.chartDataForPeriod('lifetime');
    expect(result.hoursWorked[0]).toBeCloseTo(8, 2);
  });
});

// =============================================================================
// Actions: tick / cope / poop
// =============================================================================

describe('tick()', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('increments _tick', () => {
    const s = makeState();
    const before = s._tick;
    vi.setSystemTime(MONDAY_10_30);
    s.tick();
    expect(s._tick).toBe(before + 1);
  });

  it('records lastTickAt as a recent timestamp', () => {
    vi.setSystemTime(MONDAY_10_30);
    const s = makeState();
    s.tick();
    expect(s.lastTickAt).toBe(MONDAY_10_30.getTime());
  });

  it('adds ratePerSecond to earnings when isEarning is true', () => {
    vi.setSystemTime(MONDAY_10_30);
    const s = makeState();
    expect(s.isEarning).toBe(true);
    s.tick();
    expect(s.earnings.totalEarned).toBeCloseTo(HOURLY_RATE / 3600, 8);
    expect(s.earnings.dailyTotals[KEY_MON]).toBeCloseTo(HOURLY_RATE / 3600, 8);
    expect(s.earnings.dailyMinutes[KEY_MON]).toBeCloseTo(1 / 60, 8);
  });

  it('does not add earnings when outside work hours', () => {
    vi.setSystemTime(MONDAY_08_00); // before work
    const s = makeState();
    s.tick();
    expect(s.earnings.totalEarned).toBe(0);
  });

  it('does not add earnings when wagieConfig is null', () => {
    vi.setSystemTime(MONDAY_10_30);
    const s = new AppStateClass();
    s.cagieConfig = CAGIE;
    s.tick();
    expect(s.earnings.totalEarned).toBe(0);
  });

  it('accumulates earnings across multiple ticks', () => {
    vi.setSystemTime(MONDAY_10_30);
    const s = makeState();
    s.tick();
    s.tick();
    s.tick();
    expect(s.earnings.totalEarned).toBeCloseTo((HOURLY_RATE / 3600) * 3, 8);
  });
});

describe('cope()', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('deducts $5 from total and daily earnings', () => {
    vi.setSystemTime(MONDAY_10_30);
    const s = makeState();
    s.earnings.totalEarned = 20;
    s.earnings.dailyTotals[KEY_MON] = 15;
    s.cope();
    expect(s.earnings.totalEarned).toBeCloseTo(15, 6);
    expect(s.earnings.dailyTotals[KEY_MON]).toBeCloseTo(10, 6);
  });

  it('does not drive earnings below 0', () => {
    vi.setSystemTime(MONDAY_10_30);
    const s = makeState();
    s.earnings.totalEarned = 3;
    s.earnings.dailyTotals[KEY_MON] = 3;
    s.cope();
    expect(s.earnings.totalEarned).toBe(0);
    expect(s.earnings.dailyTotals[KEY_MON]).toBe(0);
  });

  it('handles cope when there is no daily entry yet', () => {
    vi.setSystemTime(MONDAY_10_30);
    const s = makeState();
    s.earnings.totalEarned = 10;
    expect(() => s.cope()).not.toThrow();
    expect(s.earnings.totalEarned).toBe(5);
    expect(s.earnings.dailyTotals[KEY_MON]).toBe(0);
  });
});

describe('poop()', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('deducts 5 minutes of earnings', () => {
    vi.setSystemTime(MONDAY_10_30);
    const s = makeState();
    const fiveMinEarned = HOURLY_RATE * (5 / 60);
    s.earnings.totalEarned = 100;
    s.earnings.dailyTotals[KEY_MON] = 100;
    s.earnings.dailyMinutes[KEY_MON] = 60;
    s.poop();
    expect(s.earnings.totalEarned).toBeCloseTo(100 - fiveMinEarned, 4);
    expect(s.earnings.dailyMinutes[KEY_MON]).toBe(55);
  });

  it('does not drive any value below 0', () => {
    vi.setSystemTime(MONDAY_10_30);
    const s = makeState();
    s.earnings.totalEarned = 0.01;
    s.earnings.dailyTotals[KEY_MON] = 0.01;
    s.earnings.dailyMinutes[KEY_MON] = 1;
    s.poop();
    expect(s.earnings.totalEarned).toBe(0);
    expect(s.earnings.dailyTotals[KEY_MON]).toBe(0);
    expect(s.earnings.dailyMinutes[KEY_MON]).toBe(0);
  });
});

// =============================================================================
// setWagie / setCagie
// =============================================================================

describe('setWagie()', () => {
  it('updates wagieConfig and persists', () => {
    const s = new AppStateClass();
    const cfg: WagieConfig = { salary: 50_000, period: 'weekly', currency: 'GBP' };
    s.setWagie(cfg);
    expect(s.wagieConfig).toEqual(cfg);
    expect(vi.mocked(storage.set)).toHaveBeenCalled();
  });
});

describe('setCagie()', () => {
  it('updates cagieConfig and persists', () => {
    const s = new AppStateClass();
    const cfg: CagieConfig = { type: '996', customSchedule: {} };
    s.setCagie(cfg);
    expect(s.cagieConfig).toEqual(cfg);
    expect(vi.mocked(storage.set)).toHaveBeenCalled();
  });
});

// =============================================================================
// Persistence: save / load / reset
// =============================================================================

describe('save()', () => {
  it('calls storage.set with the current state', () => {
    vi.mocked(storage.set).mockClear();
    const s = makeState();
    s.lastTickAt = 12345;
    s.save();
    const [key, payload] = vi.mocked(storage.set).mock.calls[0] as [string, unknown];
    expect(key).toBe('wagie-hud-state');
    expect(payload).toMatchObject({
      wagieConfig: WAGIE,
      cagieConfig: CAGIE,
      lastTickAt: 12345,
    });
  });
});

describe('reset()', () => {
  it('clears wagieConfig, cagieConfig, earnings, and lastTickAt', () => {
    const s = makeState();
    s.earnings.totalEarned = 99;
    s.lastTickAt = 12345;
    s.reset();
    expect(s.wagieConfig).toBeNull();
    expect(s.cagieConfig).toBeNull();
    expect(s.earnings.totalEarned).toBe(0);
    expect(s.lastTickAt).toBeNull();
  });

  it('calls storage.remove', () => {
    vi.mocked(storage.remove).mockClear();
    makeState().reset();
    expect(vi.mocked(storage.remove)).toHaveBeenCalledWith('wagie-hud-state');
  });
});

describe('load()', () => {
  afterEach(() => vi.useRealTimers());

  it('returns 0 and leaves state untouched when nothing is persisted', () => {
    vi.mocked(storage.get).mockReturnValueOnce(null);
    const s = new AppStateClass();
    const result = s.load();
    expect(result).toBe(0);
    expect(s.wagieConfig).toBeNull();
  });

  it('restores wagieConfig, cagieConfig, and earnings from storage', () => {
    vi.mocked(storage.get).mockReturnValueOnce({
      wagieConfig: WAGIE,
      cagieConfig: CAGIE,
      earnings: { totalEarned: 500, dailyTotals: { '2026-01-01': 500 }, dailyMinutes: {} },
      lastTickAt: null,
    });
    const s = new AppStateClass();
    s.load();
    expect(s.wagieConfig).toEqual(WAGIE);
    expect(s.cagieConfig).toEqual(CAGIE);
    expect(s.earnings.totalEarned).toBe(500);
  });

  it('returns 0 when lastTickAt is null (no catch-up possible)', () => {
    vi.mocked(storage.get).mockReturnValueOnce({
      wagieConfig: WAGIE,
      cagieConfig: CAGIE,
      earnings: { totalEarned: 0, dailyTotals: {}, dailyMinutes: {} },
      lastTickAt: null,
    });
    expect(new AppStateClass().load()).toBe(0);
  });

  it('returns 0 when less than 5 seconds have elapsed since last tick', () => {
    vi.useFakeTimers();
    const now = MONDAY_10_30.getTime();
    vi.setSystemTime(now);
    vi.mocked(storage.get).mockReturnValueOnce({
      wagieConfig: WAGIE,
      cagieConfig: CAGIE,
      earnings: { totalEarned: 0, dailyTotals: {}, dailyMinutes: {} },
      lastTickAt: now - 3_000, // only 3s ago
    });
    const result = new AppStateClass().load();
    expect(result).toBe(0);
  });
});

// =============================================================================
// catchup() — tested via load()
// =============================================================================

describe('catchup() (via load())', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('credits earnings for time spent within work hours during the offline window', () => {
    // lastTickAt = Monday 10:00am; now = Monday 12:00pm → 2h earned
    const lastTick = new Date(2026, 1, 23, 10, 0, 0).getTime();
    const now = new Date(2026, 1, 23, 12, 0, 0);
    vi.setSystemTime(now);

    vi.mocked(storage.get).mockReturnValueOnce({
      wagieConfig: WAGIE,
      cagieConfig: CAGIE,
      earnings: { totalEarned: 0, dailyTotals: {}, dailyMinutes: {} },
      lastTickAt: lastTick,
    });

    const s = new AppStateClass();
    const result = s.load();

    const expected = HOURLY_RATE * 2;
    expect(result).toBeCloseTo(expected, 2);
    expect(s.earnings.totalEarned).toBeCloseTo(expected, 2);
    // Verify the per-day key using the same local-midnight derivation that catchup() uses
    const fromKey = localDateKey(new Date(lastTick));
    expect(s.earnings.dailyTotals[fromKey]).toBeCloseTo(expected, 2);
  });

  it('does not credit earnings for time outside work hours', () => {
    // lastTickAt = Monday 18:00 (after work); now = Monday 20:00
    const lastTick = new Date(2026, 1, 23, 18, 0, 0).getTime();
    const now = new Date(2026, 1, 23, 20, 0, 0);
    vi.setSystemTime(now);

    vi.mocked(storage.get).mockReturnValueOnce({
      wagieConfig: WAGIE,
      cagieConfig: CAGIE,
      earnings: { totalEarned: 0, dailyTotals: {}, dailyMinutes: {} },
      lastTickAt: lastTick,
    });

    const result = new AppStateClass().load();
    expect(result).toBe(0);
  });

  it('spans multiple working days (Friday 4pm → Monday 10am)', () => {
    // Friday Feb 20, 4pm → Mon Feb 23, 10am
    // Friday 4pm-5pm = 1h; Sat/Sun = 0h; Monday 9am-10am = 1h → total 2h
    const lastTick = new Date(2026, 1, 20, 16, 0, 0).getTime(); // Fri 4pm
    const nowTime = new Date(2026, 1, 23, 10, 0, 0); // Mon 10am
    vi.setSystemTime(nowTime);

    vi.mocked(storage.get).mockReturnValueOnce({
      wagieConfig: WAGIE,
      cagieConfig: CAGIE,
      earnings: { totalEarned: 0, dailyTotals: {}, dailyMinutes: {} },
      lastTickAt: lastTick,
    });

    const s = new AppStateClass();
    const result = s.load();

    const expected = HOURLY_RATE * 2;
    expect(result).toBeCloseTo(expected, 2);
    // Only Friday and Monday should have earned amounts — not Saturday or Sunday
    const earnedDays = Object.entries(s.earnings.dailyTotals).filter(([, v]) => v > 0);
    expect(earnedDays).toHaveLength(2);
    // Use localDateKey to match how catchup() writes its keys
    const friKey = localDateKey(new Date(2026, 1, 20, 16, 0, 0));
    const monKey = localDateKey(nowTime);
    expect(s.earnings.dailyTotals[friKey]).toBeCloseTo(HOURLY_RATE * 1, 2);
    expect(s.earnings.dailyTotals[monKey]).toBeCloseTo(HOURLY_RATE * 1, 2);
  });

  it('credits earnings starting from lastTickAt even if it is mid-schedule', () => {
    // lastTickAt = Monday 13:00; now = Monday 15:00 → 2h within work window
    const lastTick = new Date(2026, 1, 23, 13, 0, 0).getTime();
    const now = new Date(2026, 1, 23, 15, 0, 0);
    vi.setSystemTime(now);

    vi.mocked(storage.get).mockReturnValueOnce({
      wagieConfig: WAGIE,
      cagieConfig: CAGIE,
      earnings: { totalEarned: 0, dailyTotals: {}, dailyMinutes: {} },
      lastTickAt: lastTick,
    });

    const result = new AppStateClass().load();
    expect(result).toBeCloseTo(HOURLY_RATE * 2, 2);
  });

  it('adds catch-up on top of existing earnings', () => {
    const lastTick = new Date(2026, 1, 23, 10, 0, 0).getTime();
    const now = new Date(2026, 1, 23, 11, 0, 0);
    vi.setSystemTime(now);

    vi.mocked(storage.get).mockReturnValueOnce({
      wagieConfig: WAGIE,
      cagieConfig: CAGIE,
      earnings: {
        totalEarned: 100,
        dailyTotals: { [KEY_MON]: 100 },
        dailyMinutes: {},
      },
      lastTickAt: lastTick,
    });

    const s = new AppStateClass();
    s.load();
    expect(s.earnings.totalEarned).toBeCloseTo(100 + HOURLY_RATE, 2);
    // Sum of all per-day values must equal totalEarned
    const daySum = Object.values(s.earnings.dailyTotals).reduce((a, b) => a + b, 0);
    expect(daySum).toBeCloseTo(100 + HOURLY_RATE, 2);
  });
});

// =============================================================================
// currency helpers
// =============================================================================

describe('currency / fmt()', () => {
  it('returns "USD" when wagieConfig is null', () => {
    expect(new AppStateClass().currency).toBe('USD');
  });

  it('returns the configured currency code', () => {
    const s = makeState({ ...WAGIE, currency: 'JPY' });
    expect(s.currency).toBe('JPY');
  });

  it('fmt() formats using the configured currency', () => {
    const s = makeState({ ...WAGIE, currency: 'USD' });
    expect(s.fmt(1000)).toBe('$1,000.00');
  });
});
