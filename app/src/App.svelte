<script lang="ts">
  import { onMount } from 'svelte';
  import Layout from '$components/Layout.svelte';
  import Card from '$components/Card.svelte';
  import Button from '$components/Button.svelte';
  import TopBar from '$components/TopBar.svelte';
  import WagieStats from '$components/WagieStats.svelte';
  import LineChart from '$components/LineChart.svelte';
  import BossScreen from '$components/BossScreen.svelte';
  import SetWagieModal from '$components/SetWagieModal.svelte';
  import SetCagieModal from '$components/SetCagieModal.svelte';
  import { notifications } from '$lib/notifications.svelte';
  import { appState } from '$lib/appState.svelte';

  let cagieModalOpen = $state(false);
  let wagieModalOpen = $state(false);
  let bossMode = $state(false);

  // Load persisted state, catch up any offline earnings, then tick every second
  onMount(() => {
    const catchupEarned = appState.load();
    if (catchupEarned > 0) {
      notifications.add(
        `Welcome back! You earned ${appState.fmt(catchupEarned)} while you were away.`,
        'success'
      );
    }
    const id = setInterval(() => appState.tick(), 1000);
    return () => clearInterval(id);
  });

  // Chart period selector
  type ChartPeriod = 'today' | '7d' | '30d' | 'lifetime';
  const PERIOD_LABELS: Record<ChartPeriod, string> = {
    today: 'Today',
    '7d': 'Last 7 Days',
    '30d': 'Last Month',
    lifetime: 'Lifetime',
  };
  let chartPeriod = $state<ChartPeriod>('7d');

  // Chart data — recomputed on every tick via appState reactive reads
  let chartData = $derived(appState.chartDataForPeriod(chartPeriod));
  let chartDatasets = $derived([
    {
      label: `Cumulative Earnings (${appState.currency})`,
      data: chartData.earned,
      color: '#a1cc71',
    },
  ]);

  function handleCope() {
    appState.cope();
    notifications.add("☕ $5 coffee purchased. That's why you can't afford a house.", 'error');
  }

  function handlePoop() {
    appState.poop();
    notifications.add('💩 5 minutes flushed. No refunds.', 'success');
  }
</script>

<SetWagieModal bind:open={wagieModalOpen} />
<SetCagieModal bind:open={cagieModalOpen} />

{#if bossMode}
  <BossScreen onReturn={() => (bossMode = false)} />
{:else}
  <Layout>
    <TopBar
      title="Wagie HUD"
      earning={appState.isEarning}
      rightButtons={[
        {
          label: 'SET MY CAGIE',
          color: 'var(--color-negative-interactive)',
          onclick: () => (cagieModalOpen = true),
          title: 'Configure your work schedule',
        },
        {
          label: 'SET MY WAGIE',
          color: 'var(--color-positive-interactive)',
          onclick: () => (wagieModalOpen = true),
          title: 'Configure your salary',
        },
      ]}
    />
    <main>
      <aside aria-label="Statistics and actions">
        <Card scrollable>
          <WagieStats />
        </Card>
        <div class="sidebar-buttons" role="group" aria-label="Quick actions">
          <Button
            color="var(--color-negative-interactive)"
            onclick={() => (bossMode = true)}
            title="Activate boss mode: switch to a fake spreadsheet"
            ariaLabel="Boss button: activate boss mode">BOSS BUTTON</Button
          >
          <Button
            color="var(--color-negative-interactive)"
            onclick={handleCope}
            title="Buy a coffee: deduct $5 from today's earnings"
            ariaLabel="Coffee button: buy a $5 coffee">COFFEE BUTTON</Button
          >
          <Button
            color="var(--color-negative-interactive)"
            onclick={handlePoop}
            title="Poop: lose 5 minutes of earnings"
            ariaLabel="Poop button: deduct 5 minutes of earnings">POOP BUTTON</Button
          >
        </div>
      </aside>

      <section aria-label="Earnings chart">
        <Card>
          {#snippet header()}
            <div class="chart-header">
              <h3 id="chart-heading">Earnings</h3>
              <div class="period-selector" role="group" aria-label="Chart time period">
                {#each Object.entries(PERIOD_LABELS) as [p, label] (p)}
                  <button
                    class="period-btn"
                    class:active={chartPeriod === p}
                    onclick={() => (chartPeriod = p as ChartPeriod)}
                    aria-pressed={chartPeriod === p}
                    aria-label="Show {label} earnings"
                    title="Show {label} earnings">{label}</button
                  >
                {/each}
              </div>
            </div>
          {/snippet}
          <LineChart
            labels={chartData.labels}
            datasets={chartDatasets}
            ariaLabel="Earnings over {PERIOD_LABELS[chartPeriod].toLowerCase()}"
          />
        </Card>
      </section>
    </main>
  </Layout>
{/if}

<style>
  main {
    display: grid;
    grid-template-columns: 360px 1fr;
    /* Explicit row height so the grid item fills main's constrained height
       rather than auto-sizing to content (which breaks all flex:1 children). */
    grid-template-rows: minmax(0, 1fr);
    gap: 0.625rem;
    padding: 0.625rem;
    flex: 1;
    min-height: 0;
    overflow: hidden;
    box-sizing: border-box;
  }

  /* Tablet: narrower sidebar */
  @media (max-width: 1024px) {
    main {
      grid-template-columns: 240px 1fr;
      overflow: visible;
    }

    aside {
      overflow: visible;
    }

    aside > :global(.card) {
      flex: none;
      overflow: visible;
    }
  }

  /* Phone: single column, scrollable */
  @media (max-width: 640px) {
    main {
      grid-template-columns: 1fr;
      grid-template-rows: auto;
      overflow: visible;
      padding: 0.4rem;
      gap: 0.4rem;
    }
    aside {
      overflow: visible;
      min-height: auto;
    }
    aside > :global(.card) {
      flex: none;
      overflow: visible;
    }
  }

  aside {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    overflow: hidden;
    min-height: 0;
  }

  aside > :global(.card) {
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }

  section {
    display: flex;
    flex-direction: column;
    gap: 0.41rem;
    min-height: 0;
  }

  section > :global(.card) {
    flex: 1;
    min-height: 0;
  }

  .sidebar-buttons {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    flex-shrink: 0;
  }

  .chart-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .chart-header h3 {
    margin: 0;
  }

  .period-selector {
    display: flex;
    gap: 0.25rem;
    flex-wrap: wrap;
  }

  .period-btn {
    font-family: var(--font-family);
    font-size: 13px;
    padding: 0.3rem 0.75rem;
    border: 2px solid var(--color-text);
    border-radius: 8px;
    background: transparent;
    color: var(--color-text);
    cursor: pointer;
    transition:
      background 0.15s,
      color 0.15s;
    box-shadow: none;
    line-height: 1.3;
    white-space: nowrap;
  }

  .period-btn:hover {
    background: rgba(0, 0, 0, 0.08);
  }

  .period-btn:focus-visible {
    outline: 3px solid var(--color-text);
    outline-offset: 2px;
  }

  .period-btn.active {
    background: var(--color-secondary);
    color: var(--color-text-light);
    border-color: var(--color-secondary);
  }

  @media (max-width: 1024px) {
    .sidebar-buttons {
      flex-direction: row;
      flex-wrap: wrap;
    }
    .sidebar-buttons :global(button) {
      flex: 1;
    }
  }
</style>
