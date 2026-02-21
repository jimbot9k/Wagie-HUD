<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    title?: string;
    header?: Snippet;
    children: Snippet;
    scrollable?: boolean;
  }

  let { title, header, children, scrollable = false }: Props = $props();
</script>

<div class="card">
  {#if header}
    <div class="card-header">
      {@render header()}
    </div>
  {:else if title}
    <div class="card-header">
      <h3>{title}</h3>
    </div>
  {/if}
  <div class="card-body" class:scrollable>
    {@render children()}
  </div>
</div>

<style>
  .card {
    background-color: var(--color-primary);
    color: var(--color-text);
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    box-sizing: border-box;
  }

  .card-header {
    border-bottom: 1px solid rgba(0, 0, 0, 0.15);
    padding-bottom: 0.75rem;
    color: var(--color-text);
    display: flex;
    align-items: center;
  }

  .card-body {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    color: var(--color-text);
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }

  .card-body.scrollable {
    overflow-y: auto;
  }
</style>
