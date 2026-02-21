<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import {
    Chart,
    LineController,
    LineElement,
    PointElement,
    LinearScale,
    CategoryScale,
    Tooltip,
    Legend,
    Filler,
    type ChartData,
    type ChartOptions,
  } from 'chart.js';

  Chart.register(
    LineController,
    LineElement,
    PointElement,
    LinearScale,
    CategoryScale,
    Tooltip,
    Legend,
    Filler
  );

  interface Dataset {
    label: string;
    data: number[];
    color?: string;
  }

  interface Props {
    labels?: string[];
    datasets?: Dataset[];
    ariaLabel?: string;
  }

  let {
    labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets = [
      {
        label: 'Dollars Earned',
        data: [80, 95, 70, 110, 130, 60, 40],
        color: '#a1cc71',
      },
    ],
    ariaLabel = 'Earnings chart',
  }: Props = $props();

  let canvas: HTMLCanvasElement;
  let chart: Chart | null = null;

  function buildData(): ChartData<'line'> {
    return {
      labels,
      datasets: datasets.map((ds, i) => ({
        label: ds.label,
        data: ds.data,
        borderColor: ds.color ?? '#71b9cc',
        backgroundColor: (ds.color ?? '#71b9cc') + '33',
        pointBackgroundColor: ds.color ?? '#71b9cc',
        pointRadius: 0,
        pointHoverRadius: 4,
        fill: true,
        tension: 0.4,
        yAxisID: i === 0 ? 'y' : `y${i}`,
      })),
    };
  }

  function buildOptions(): ChartOptions<'line'> {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: '#000000',
            font: { family: "'Geist Mono', monospace", size: 13 },
          },
        },
        tooltip: {
          bodyFont: { family: "'Geist Mono', monospace" },
          titleFont: { family: "'Geist Mono', monospace" },
        },
      },
      scales: {
        x: {
          ticks: {
            color: '#000000',
            font: { family: "'Geist Mono', monospace", size: 11 },
            maxRotation: 45,
            autoSkip: true,
            maxTicksLimit: 12,
          },
          grid: { color: 'rgba(0,0,0,0.1)' },
        },
        y: {
          position: 'left',
          ticks: { color: '#000000', font: { family: "'Geist Mono', monospace" } },
          grid: { color: 'rgba(0,0,0,0.1)' },
          title: datasets[0]
            ? {
                display: true,
                text: datasets[0].label,
                color: '#000000',
                font: { family: "'Geist Mono', monospace", size: 12 },
              }
            : { display: false },
        },
        ...Object.fromEntries(
          datasets.slice(1).map((ds, i) => [
            `y${i + 1}`,
            {
              position: 'right' as const,
              ticks: { color: '#000000', font: { family: "'Geist Mono', monospace" } },
              grid: { drawOnChartArea: false },
              title: {
                display: true,
                text: ds.label,
                color: '#000000',
                font: { family: "'Geist Mono', monospace", size: 12 },
              },
            },
          ])
        ),
      },
    };
  }

  onMount(() => {
    chart = new Chart(canvas, { type: 'line', data: buildData(), options: buildOptions() });
  });

  onDestroy(() => {
    chart?.destroy();
  });

  $effect(() => {
    if (chart) {
      chart.data = buildData();
      chart.options = buildOptions();
      chart.update('none');
    }
  });
</script>

<div class="chart-wrapper" role="img" aria-label={ariaLabel}>
  <canvas bind:this={canvas} aria-hidden="true"></canvas>
</div>

<style>
  .chart-wrapper {
    position: relative;
    width: 100%;
    flex: 1;
    min-height: 0;
  }
</style>
