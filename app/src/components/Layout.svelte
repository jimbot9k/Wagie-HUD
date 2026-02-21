<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    children: Snippet;
  }

  let { children }: Props = $props();
</script>

<div class="layout">
  {@render children()}
</div>

<style>
  .layout {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background: var(--color-background);
  }
</style>
