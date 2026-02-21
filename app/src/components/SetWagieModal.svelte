<script lang="ts">
  import { untrack } from 'svelte';
  import Modal from './Modal.svelte';
  import Button from './Button.svelte';
  import { notifications } from '$lib/notifications.svelte';
  import { appState, formatMoney, type SalaryPeriod } from '$lib/appState.svelte';

  interface Props {
    open?: boolean;
  }

  let { open = $bindable(false) }: Props = $props();

  const CURRENCIES = ['USD', 'AUD', 'GBP', 'EUR', 'CAD', 'NZD', 'JPY', 'INR', 'SGD', 'HKD'];

  const PERIOD_LABELS: Record<SalaryPeriod, string> = {
    hourly: 'Hourly',
    weekly: 'Weekly',
    fortnightly: 'Fortnightly',
    annually: 'Annually',
  };

  let salary = $state('');
  let period = $state<SalaryPeriod>('annually');
  let currency = $state('USD');
  let error = $state('');
  let confirmingReset = $state(false);

  // Sync fields from store when modal opens.
  // Use untrack so saving (which mutates wagieConfig) doesn't re-trigger this
  // effect mid-close and fight with open = false.
  $effect(() => {
    if (!open) return;
    const config = untrack(() => appState.wagieConfig);
    salary = config?.salary.toString() ?? '';
    period = config?.period ?? 'annually';
    currency = config?.currency ?? 'USD';
    error = '';
    confirmingReset = false;
  });

  let salaryNum = $derived(parseFloat(salary));

  let preview = $derived.by(() => {
    if (isNaN(salaryNum) || salaryNum <= 0) return null;
    const wh = appState.weeklyHours || 40;
    let hourly: number;
    switch (period) {
      case 'hourly':
        hourly = salaryNum;
        break;
      case 'weekly':
        hourly = salaryNum / wh;
        break;
      case 'fortnightly':
        hourly = salaryNum / (wh * 2);
        break;
      case 'annually':
        hourly = salaryNum / (wh * 52);
        break;
    }
    const perSecond = hourly / 3600;
    return {
      hourly,
      perSecond,
      weekly: hourly * wh,
      annually: hourly * (wh * 52),
    };
  });

  function save() {
    if (isNaN(salaryNum) || salaryNum <= 0) {
      error = 'Please enter a valid salary greater than 0.';
      return;
    }
    appState.setWagie({ salary: salaryNum, period, currency });
    notifications.add('Wagie salary saved!', 'success');
    open = false;
  }

  function confirmReset() {
    appState.reset();
    notifications.add('All data has been reset.', 'error');
    open = false;
  }
</script>

<Modal bind:open title="Set My Wagie">
  <div class="form">
    <div class="field">
      <label for="salary">Salary Amount</label>
      <div class="salary-row">
        <select
          bind:value={currency}
          id="currency"
          class="currency-select"
          aria-label="Select currency"
        >
          {#each CURRENCIES as c (c)}
            <option value={c}>{c}</option>
          {/each}
        </select>
        <input
          id="salary"
          type="number"
          min="0"
          step="0.01"
          placeholder="e.g. 80000"
          bind:value={salary}
          class="salary-input"
          aria-required="true"
          aria-describedby={error ? 'salary-error' : undefined}
        />
      </div>
    </div>

    <div class="field">
      <span id="period-label" class="field-label">Pay Period</span>
      <div class="period-grid" role="group" aria-labelledby="period-label">
        {#each Object.entries(PERIOD_LABELS) as [p, label] (p)}
          <button
            class="period-btn"
            class:active={period === p}
            onclick={() => (period = p as SalaryPeriod)}
            type="button"
            aria-pressed={period === p}
            title="Set pay period to {label}"
            aria-label="{label} pay period">{label}</button
          >
        {/each}
      </div>
    </div>

    {#if error}
      <p class="error" role="alert" id="salary-error">{error}</p>
    {/if}

    {#if preview}
      <div class="preview">
        <h3>Earning Breakdown</h3>
        <div class="preview-grid">
          <span>Per Second</span><span>{formatMoney(preview.perSecond, currency)}</span>
          <span>Per Hour</span> <span>{formatMoney(preview.hourly, currency)}</span>
          <span>Per Week</span> <span>{formatMoney(preview.weekly, currency)}</span>
          <span>Per Year</span> <span>{formatMoney(preview.annually, currency)}</span>
        </div>
      </div>
    {/if}

    <div class="actions">
      <Button
        color="var(--color-positive-interactive)"
        onclick={save}
        ariaLabel="Save salary settings"
        title="Save salary settings">Save</Button
      >
      <Button
        color="var(--color-negative-interactive)"
        onclick={() => (open = false)}
        ariaLabel="Cancel and close"
        title="Cancel and close">Cancel</Button
      >
    </div>

    {#if confirmingReset}
      <div class="reset-confirm">
        <p class="reset-warning">
          ⚠ This will permanently delete all earnings, hours, and configuration. This cannot be
          undone.
        </p>
        <div class="reset-actions">
          <Button
            color="var(--color-error)"
            onclick={confirmReset}
            ariaLabel="Confirm reset all data"
            title="Permanently delete all earnings and settings">Yes, Reset Everything</Button
          >
          <Button
            color="var(--color-negative-interactive)"
            onclick={() => (confirmingReset = false)}
            ariaLabel="Cancel reset"
            title="Cancel and go back">Go Back</Button
          >
        </div>
      </div>
    {:else}
      <div class="reset-row">
        <button
          class="reset-link"
          onclick={() => (confirmingReset = true)}
          type="button"
          aria-label="Reset all data"
          title="Permanently delete all earnings and settings">Reset all data…</button
        >
      </div>
    {/if}
  </div>
</Modal>

<style>
  .form {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  label,
  .field-label {
    font-size: 14px;
    font-weight: 600;
    color: var(--color-text);
    font-family: var(--font-family);
  }

  .salary-row {
    display: flex;
    gap: 0.5rem;
  }

  .currency-select {
    font-family: var(--font-family);
    font-size: 15px;
    padding: 0.5rem 0.6rem;
    border: 2px solid var(--color-text);
    border-radius: 8px;
    background: var(--color-text-light);
    color: var(--color-text);
    cursor: pointer;
    flex-shrink: 0;
    width: 80px;
  }

  .salary-input {
    flex: 1;
    font-family: var(--font-family);
    font-size: 15px;
    padding: 0.5rem 0.75rem;
    border: 2px solid var(--color-text);
    border-radius: 8px;
    background: var(--color-text-light);
    color: var(--color-text);
    outline: none;
  }

  .salary-input:focus {
    border-color: var(--color-background);
    box-shadow: 0 0 0 3px rgba(0, 137, 185, 0.25);
  }

  .period-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.4rem;
  }

  .period-btn {
    font-family: var(--font-family);
    font-size: 14px;
    padding: 0.5rem;
    border: 2px solid var(--color-text);
    border-radius: 8px;
    background: transparent;
    color: var(--color-text);
    cursor: pointer;
    transition:
      background 0.15s,
      color 0.15s;
    box-shadow: none;
  }

  .period-btn:hover {
    background: rgba(0, 0, 0, 0.08);
  }

  .period-btn:focus-visible {
    outline: 3px solid var(--color-text);
    outline-offset: 2px;
  }

  .period-btn.active {
    background: var(--color-background);
    color: var(--color-text-light);
    border-color: var(--color-background);
  }

  .error {
    color: #ec2850;
    font-size: 13px;
    margin: 0;
    font-family: var(--font-family);
  }

  .preview {
    background: rgba(0, 0, 0, 0.06);
    border-radius: 8px;
    padding: 0.75rem 1rem;
  }

  .preview h3 {
    margin: 0 0 0.5rem;
    font-size: 14px;
    color: var(--color-text);
  }

  .preview-grid {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 0.25rem 1rem;
    font-size: 14px;
    font-family: var(--font-family);
    color: var(--color-text);
  }

  .preview-grid span:nth-child(even) {
    text-align: right;
    font-weight: 600;
  }

  .actions {
    display: flex;
    gap: 0.5rem;
    justify-content: flex-end;
  }

  .reset-row {
    display: flex;
    justify-content: center;
    padding-top: 0.25rem;
    border-top: 1px solid rgba(0, 0, 0, 0.1);
  }

  .reset-link {
    background: none;
    border: none;
    box-shadow: none;
    font-family: var(--font-family);
    font-size: 12px;
    color: var(--color-error);
    cursor: pointer;
    padding: 0.2rem 0.4rem;
    border-radius: 4px;
    opacity: 0.7;
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  .reset-link:hover {
    opacity: 1;
  }

  .reset-confirm {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    border-radius: 8px;
    background: rgba(236, 40, 80, 0.08);
    border: 1px solid rgba(236, 40, 80, 0.3);
  }

  .reset-warning {
    font-size: 13px;
    color: var(--color-error);
    font-family: var(--font-family);
    line-height: 1.5;
    margin: 0;
  }

  .reset-actions {
    display: flex;
    gap: 0.5rem;
    justify-content: flex-end;
  }
</style>
