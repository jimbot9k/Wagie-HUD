<script lang="ts">
  import Button from '$components/Button.svelte';
  import wagieUrl from '$assets/wagie.svg';

  interface NavButton {
    label: string;
    onclick?: () => void;
    color?: string;
    title?: string;
  }

  interface Props {
    title?: string;
    earning?: boolean;
    rightButtons?: NavButton[];
  }

  let {
    title = 'Wagie HUD',
    earning = false,
    rightButtons = [{ label: 'One' }, { label: 'Two' }, { label: 'Three' }],
  }: Props = $props();

  const COLOR_SUCCESS = '#a1cc71';
  const COLOR_ERROR = '#ec2850';
  const COLOR_TEXT = '#000000';
  const COLOR_TEXT_LIGHT = '#ffffff';

  let statusBg = $derived(earning ? COLOR_SUCCESS : COLOR_ERROR);
  let statusColor = $derived(earning ? COLOR_TEXT : COLOR_TEXT_LIGHT);

  let headerEl: HTMLElement;

  $effect(() => {
    if (!headerEl) return;
    const update = () =>
      document.documentElement.style.setProperty('--topbar-height', `${headerEl.offsetHeight}px`);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(headerEl);
    return () => ro.disconnect();
  });
</script>

<header class="top-bar" bind:this={headerEl} aria-label="Application header">
  <div class="top-bar-left">
    <img src={wagieUrl} alt="Wagie HUD logo" class="logo" />
    <h1>{title}</h1>
  </div>

  <div class="top-bar-center">
    <div
      class="status"
      style="background-color: {statusBg}; color: {statusColor};"
      role="status"
      aria-live="polite"
      aria-label={earning ? 'Currently earning: Wagie is slaving' : 'Not currently earning'}
      title={earning ? 'You are currently earning money' : 'You are not currently earning'}
    >
      {earning ? 'WAGIE SLAVING' : 'WAGIE NOT EARNING'}
    </div>
  </div>

  <nav class="top-bar-right" aria-label="App controls">
    {#each rightButtons as btn (btn.label)}
      <Button
        color={btn.color}
        onclick={btn.onclick}
        ariaLabel={btn.label}
        title={btn.title ?? btn.label}
      >
        {btn.label}
      </Button>
    {/each}
  </nav>
</header>

<style>
  .top-bar {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    gap: 0.5rem;
    padding: 0.25rem 1rem;
    background-color: var(--color-secondary);
    position: sticky;
    top: 0;
    z-index: 100;
  }

  /* Tablet: shrink logo/h1 font size */
  @media (max-width: 1024px) {
    .top-bar-left {
      font-size: 32px;
    }
    .status {
      font-size: 18px;
      padding: 0.4rem 0.75rem;
    }
  }

  /* Phone: row 1 = title + status, row 2 = buttons */
  @media (max-width: 640px) {
    .top-bar {
      grid-template-columns: 1fr auto;
      grid-template-rows: auto auto;
      padding: 0.25rem 0.5rem;
      gap: 0.25rem 0.5rem;
    }
    .top-bar-left {
      font-size: 22px;
      grid-column: 1;
      grid-row: 1;
    }
    .top-bar-center {
      grid-column: 2;
      grid-row: 1;
      justify-content: flex-end;
    }
    .top-bar-right {
      grid-column: 1 / -1;
      grid-row: 2;
      justify-content: stretch;
      gap: 0.25rem;
    }
    .top-bar-right :global(button) {
      flex: 1;
    }
    .status {
      font-size: 13px;
      padding: 0.3rem 0.5rem;
    }
  }

  .top-bar-left :global(h1) {
    font-weight: 600;
    color: var(--color-text-light);
  }

  .top-bar-left {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 48px; /* match global h1 so 1em on .logo = 48px */
  }

  .logo {
    height: 1em;
    width: auto;
    display: block;
  }

  .top-bar-center {
    display: flex;
    justify-content: center;
  }

  .status {
    font-family: var(--font-family);
    font-size: 24px;
    font-weight: 400;
    padding: 0.5rem 1.5rem;
    border-radius: 0;
    box-shadow: var(--drop-shadow);
    user-select: none;
    text-align: center;
  }

  .top-bar-right {
    display: flex;
    justify-content: flex-end;
    gap: 0.25rem;
  }

  /* Remove drop shadow from buttons inside the top bar */
  .top-bar :global(button) {
    box-shadow: none;
  }
</style>
