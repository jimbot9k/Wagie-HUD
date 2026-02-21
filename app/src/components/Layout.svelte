<script lang="ts">
  import type { Snippet } from 'svelte';
  import SnackbarContainer from '$components/SnackbarContainer.svelte';

  interface Props {
    children: Snippet;
  }

  let { children }: Props = $props();
</script>

<div class="layout">
  <SnackbarContainer />
  {@render children()}
</div>

<style>
  .layout {
    height: 100vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    background: var(--color-background);
  }

  @media (max-width: 1024px) {
    .layout {
      height: auto;
      min-height: 100vh;
      overflow-y: auto;
    }
  }
</style>
