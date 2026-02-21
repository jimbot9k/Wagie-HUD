<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    open?: boolean;
    title?: string;
    children: Snippet;
    onclose?: () => void;
  }

  let { open = $bindable(false), title = '', children, onclose }: Props = $props();

  let dialogId = $derived(`modal-title-${Math.random().toString(36).slice(2)}`);

  let dialog: HTMLDialogElement;

  $effect(() => {
    if (!dialog) return;
    if (open) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  });

  function handleClose() {
    open = false;
    onclose?.();
  }

  function handleBackdropClick(e: MouseEvent) {
    if (e.target === dialog) handleClose();
  }
</script>

<dialog
  bind:this={dialog}
  onclick={handleBackdropClick}
  onclose={handleClose}
  aria-modal="true"
  aria-labelledby={title ? dialogId : undefined}
>
  <div class="modal" role="document">
    <div class="modal-header">
      {#if title}
        <h2 id={dialogId}>{title}</h2>
      {/if}
      <button class="close-btn" onclick={handleClose} aria-label="Close dialog" title="Close dialog"
        >✕</button
      >
    </div>
    <div class="modal-body">
      {@render children()}
    </div>
  </div>
</dialog>

<style>
  dialog {
    position: fixed;
    inset: 0;
    margin: auto;
    border: none;
    border-radius: 10px;
    padding: 0;
    background: transparent;
    box-shadow: var(--drop-shadow);
    max-width: 90vw;
    width: 480px;
  }

  dialog::backdrop {
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(2px);
  }

  .modal {
    background-color: var(--color-primary);
    border-radius: 10px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.5rem;
    border-bottom: 1px solid rgba(0, 0, 0, 0.15);
    gap: 1rem;
  }

  .modal-header :global(h2) {
    margin: 0;
    color: var(--color-text);
  }

  .close-btn {
    background: none;
    border: none;
    box-shadow: none;
    font-size: 1.25rem;
    cursor: pointer;
    color: var(--color-text);
    padding: 0.25rem 0.5rem;
    border-radius: 6px;
    line-height: 1;
    flex-shrink: 0;
  }

  .close-btn:hover {
    background: rgba(0, 0, 0, 0.1);
  }

  .modal-body {
    padding: 1.5rem;
    color: var(--color-text);
  }

  @media (max-width: 640px) {
    dialog {
      width: 95vw;
    }
  }
</style>
