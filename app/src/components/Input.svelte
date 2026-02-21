<script lang="ts">
  interface Props {
    value?: string;
    placeholder?: string;
    type?: 'text' | 'password' | 'email' | 'number' | 'search';
    disabled?: boolean;
    id?: string;
    name?: string;
    ariaLabel?: string;
    ariaDescribedby?: string;
    required?: boolean;
  }

  let {
    value = $bindable(''),
    placeholder = '',
    type = 'text',
    disabled = false,
    id,
    name,
    ariaLabel,
    ariaDescribedby,
    required = false,
  }: Props = $props();
</script>

<input
  {id}
  {name}
  {type}
  {placeholder}
  {disabled}
  {required}
  aria-label={ariaLabel}
  aria-describedby={ariaDescribedby}
  aria-required={required || undefined}
  bind:value
/>

<style>
  input {
    background-color: var(--color-text-light);
    color: var(--color-text);
    border: 2px solid var(--color-text);
    border-radius: 6px;
    padding: 0.5rem 1rem;
    font-family: var(--font-family);
    font-size: 1rem;
    width: 100%;
    transition:
      border-color 0.2s,
      box-shadow 0.2s;
  }

  input:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(113, 185, 204, 0.3);
  }

  input:focus-visible {
    outline: 3px solid var(--color-text);
    outline-offset: 2px;
  }

  input:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  input::placeholder {
    color: rgba(0, 0, 0, 0.4);
  }
</style>
