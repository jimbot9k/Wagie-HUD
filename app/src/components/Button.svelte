<script lang="ts">
  interface Props {
    color?: string;
    onclick?: () => void;
    disabled?: boolean;
    type?: 'button' | 'submit' | 'reset';
    title?: string;
    ariaLabel?: string;
    ariaCurrent?: boolean | 'page' | 'step' | 'location' | 'date' | 'time';
    ariaPressed?: boolean;
    children: import('svelte').Snippet;
  }

  let {
    color = 'var(--color-primary)',
    onclick,
    disabled = false,
    type = 'button',
    title,
    ariaLabel,
    ariaCurrent,
    ariaPressed,
    children,
  }: Props = $props();
</script>

<button
  {type}
  {disabled}
  {onclick}
  {title}
  aria-label={ariaLabel}
  aria-current={ariaCurrent}
  aria-pressed={ariaPressed}
  style="--btn-color: {color};"
>
  {@render children()}
</button>

<style>
  button {
    background-color: var(--btn-color);
    color: var(--color-text);
    border: none;
    padding: 0.5rem 1.5rem;
    cursor: pointer;
    transition: filter 0.2s;
  }

  button:hover:not(:disabled) {
    filter: brightness(1.1);
  }

  button:active:not(:disabled) {
    filter: brightness(0.9);
  }

  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  button:focus-visible {
    outline: 3px solid var(--color-text);
    outline-offset: 2px;
  }
</style>
