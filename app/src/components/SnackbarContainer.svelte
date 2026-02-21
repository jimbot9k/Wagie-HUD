<script lang="ts">
  import { notifications } from '$lib/notifications.svelte';
</script>

<div class="snackbar-container" aria-live="assertive" aria-atomic="false">
  {#each notifications.items as n (n.id)}
    <div
      class="snackbar"
      style="background-color: {n.type === 'success' ? '#a1cc71' : '#ec2850'}; color: {n.type ===
      'success'
        ? '#000000'
        : '#ffffff'};"
      role="alert"
      aria-atomic="true"
    >
      <span class="snackbar-text">{n.text}</span>
      <button
        class="snackbar-dismiss"
        style="color: {n.type === 'success' ? '#000000' : '#ffffff'};"
        onclick={() => notifications.dismiss(n.id)}
        aria-label="Dismiss notification"
        title="Dismiss notification">✕</button
      >
    </div>
  {/each}
</div>

<style>
  .snackbar-container {
    position: fixed;
    top: calc(var(--topbar-height, 70px) + 0.5rem);
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    z-index: 200;
    pointer-events: none;
    width: max-content;
    max-width: min(560px, 90vw);
  }

  .snackbar {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.75rem 1.25rem;
    border-radius: 10px;
    box-shadow: var(--drop-shadow);
    pointer-events: all;
    font-family: var(--font-family);
    font-size: 16px;
    animation: slide-in 0.2s ease-out;
  }

  .snackbar-text {
    flex: 1;
  }

  .snackbar-dismiss {
    background: none;
    border: none;
    box-shadow: none;
    font-size: 1rem;
    cursor: pointer;
    padding: 0.1rem 0.3rem;
    border-radius: 4px;
    line-height: 1;
    opacity: 0.7;
    flex-shrink: 0;
  }

  .snackbar-dismiss:hover {
    opacity: 1;
    background: rgba(0, 0, 0, 0.1);
  }

  @keyframes slide-in {
    from {
      opacity: 0;
      transform: translateY(-8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>
