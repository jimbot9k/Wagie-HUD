<script lang="ts">
  import { appState } from '$lib/appState.svelte';

  function fmtHours(minutes: number): string {
    const h = minutes / 60;
    if (h < 1) return `${Math.round(minutes)}m`;
    return `${h.toFixed(1)}h`;
  }

  function fmtDays(days: number): string {
    return days.toFixed(2);
  }

  let yearPct = $derived(
    appState.yearWorkDaysTotal > 0
      ? Math.round((appState.yearWorkDaysWorked / appState.yearWorkDaysTotal) * 100)
      : 0
  );

  let lifeSoldPct = $derived(
    ((appState.lifetimeDaysWorked / appState.lifetimeExpectancyDays) * 100).toFixed(2)
  );
</script>

<div class="wagie-stats" role="region" aria-label="Wagie earnings statistics">
  <h2>Wagie Stats</h2>

  {#if !appState.wagieConfig}
    <p class="no-config" role="status">Set your wagie &amp; cagie to start tracking.</p>
  {/if}

  <section aria-label="Today's earnings">
    <h3>Today</h3>
    <p>Hours Slaved: <span aria-live="polite">{fmtHours(appState.dailyMinutesWorked)}</span></p>
    <p>Dollars Earned: <span aria-live="polite">{appState.fmt(appState.dailyEarned)}</span></p>
  </section>

  <section aria-label="This week's earnings">
    <h3>This Week</h3>
    <p>Hours Slaved: <span aria-live="polite">{fmtHours(appState.weeklyMinutesWorked)}</span></p>
    <p>Dollars Earned: <span aria-live="polite">{appState.fmt(appState.weeklyEarned)}</span></p>
  </section>

  <section aria-label="This month's earnings">
    <h3>This Month</h3>
    <p>Hours Slaved: <span aria-live="polite">{fmtHours(appState.monthlyMinutesWorked)}</span></p>
    <p>Dollars Earned: <span aria-live="polite">{appState.fmt(appState.monthlyEarned)}</span></p>
  </section>

  <section aria-label="This year's earnings">
    <h3>This Year</h3>
    <p>
      Days Sold: <span aria-live="polite"
        >{fmtDays(appState.yearWorkDaysWorked)}/{appState.yearWorkDaysTotal} ({yearPct}%)</span
      >
    </p>
    <p>Dollars Earned: <span aria-live="polite">{appState.fmt(appState.yearlyEarned)}</span></p>
  </section>

  <section aria-label="Lifetime earnings">
    <h3>Lifetime</h3>
    <p>Days Sold: <span aria-live="polite">{fmtDays(appState.lifetimeDaysWorked)}</span></p>
    <p>Life Expectancy: {appState.lifetimeExpectancyDays.toLocaleString()} days</p>
    <p>Life Sold: <span aria-live="polite">{lifeSoldPct}%</span></p>
    <p>
      Total Earned: <span aria-live="polite">{appState.fmt(appState.earnings.totalEarned)}</span>
    </p>
  </section>
</div>

<style>
  .wagie-stats {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    text-align: center;
  }

  section {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    padding-top: 0.5rem;
  }
</style>
