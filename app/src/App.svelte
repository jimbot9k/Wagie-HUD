<script lang="ts">
  import { isWails } from '$lib/platform';
  import Layout from '$components/Layout.svelte';

  let greeting = $state('');
  let name = $state('World');

  async function greet() {
    if (isWails() && window.go?.main?.App) {
      greeting = await window.go.main.App.Greet(name);
    } else {
      greeting = `Hello, ${name}! (Web Mode)`;
    }
  }
</script>

<Layout>
  <main>
    <h1>Wagie HUD</h1>

    <div class="greeting-form">
      <input type="text" bind:value={name} placeholder="Enter your name" />
      <button onclick={greet}>Greet</button>
    </div>

    {#if greeting}
      <p class="greeting">{greeting}</p>
    {/if}

    <p class="mode-indicator">
      Running in: <strong>{isWails() ? 'Wails Desktop' : 'Web Browser'}</strong>
    </p>
  </main>
</Layout>

<style>
  main {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.5rem;
    padding: 2rem;
  }

  h1 {
    font-size: 2.5rem;
    color: var(--color-primary);
    margin: 0;
  }

  .greeting-form {
    display: flex;
    gap: 0.5rem;
  }

  input {
    padding: 0.5rem 1rem;
    border: 1px solid var(--color-border);
    border-radius: 4px;
    font-size: 1rem;
    background-color: var(--color-surface);
    color: var(--color-text);
  }

  button {
    padding: 0.5rem 1.5rem;
    background-color: var(--color-primary);
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
    transition: background-color 0.2s;
  }

  button:hover {
    background-color: var(--color-primary-dark);
  }

  .greeting {
    font-size: 1.25rem;
    color: var(--color-text);
    padding: 1rem;
    background-color: var(--color-surface);
    border-radius: 8px;
    border: 1px solid var(--color-border);
  }

  .mode-indicator {
    font-size: 0.875rem;
    color: var(--color-text-muted);
  }
</style>
