<script lang="ts">
  import { untrack } from 'svelte';
  import Modal from './Modal.svelte';
  import Button from './Button.svelte';
  import { notifications } from '$lib/notifications.svelte';
  import {
    appState,
    DAYS,
    DAY_LABELS,
    PRESET_SCHEDULES,
    type ScheduleType,
    type DaySchedule,
    type Day,
  } from '$lib/appState.svelte';

  interface Props {
    open?: boolean;
  }

  let { open = $bindable(false) }: Props = $props();

  type ScheduleMap = Record<Day, DaySchedule>;

  const SCHEDULE_LABELS: Record<ScheduleType, string> = {
    'mon-fri-9-5': 'Mon–Fri 9–5',
    '996': '996 (9–9, 6 days)',
    custom: 'Custom',
  };

  let scheduleType = $state<ScheduleType>('mon-fri-9-5');
  let customSchedule = $state<ScheduleMap>(structuredClone(PRESET_SCHEDULES['mon-fri-9-5']));

  // Sync from store when modal opens.
  // untrack appState reads so that saving (which mutates cagieConfig) doesn't
  // re-trigger this effect mid-close and fight with open = false.
  $effect(() => {
    if (!open) return;
    const config = untrack(() => appState.cagieConfig);
    scheduleType = config?.type ?? 'mon-fri-9-5';
    const source =
      config?.type === 'custom'
        ? (config.customSchedule as ScheduleMap)
        : PRESET_SCHEDULES[config?.type ?? 'mon-fri-9-5'];
    customSchedule = JSON.parse(JSON.stringify(source)) as ScheduleMap;
  });

  // When switching types pre-populate custom with that preset
  function handleTypeChange(t: ScheduleType) {
    scheduleType = t;
    if (t !== 'custom') {
      customSchedule = structuredClone(PRESET_SCHEDULES[t]);
    }
  }

  let previewSchedule = $derived<ScheduleMap>(
    scheduleType === 'custom' ? customSchedule : PRESET_SCHEDULES[scheduleType]
  );

  let weeklyHoursPreview = $derived(
    Object.values(previewSchedule)
      .filter((d) => d.enabled)
      .reduce((s, d) => s + (d.end - d.start), 0)
  );

  let workDaysPreview = $derived(Object.values(previewSchedule).filter((d) => d.enabled).length);

  function save() {
    appState.setCagie({
      type: scheduleType,
      customSchedule: JSON.parse(JSON.stringify(customSchedule)) as Record<string, DaySchedule>,
    });
    notifications.add('Cagie schedule saved!', 'success');
    open = false;
  }

  function fmtHour(h: number): string {
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${h12}:00 ${ampm}`;
  }
</script>

<Modal bind:open title="Set My Cagie">
  <div class="form">
    <!-- Preset selector -->
    <div class="field">
      <span id="schedule-type-label" class="field-label">Work Schedule</span>
      <div class="type-grid" role="group" aria-labelledby="schedule-type-label">
        {#each Object.entries(SCHEDULE_LABELS) as [t, label] (t)}
          <button
            class="type-btn"
            class:active={scheduleType === t}
            onclick={() => handleTypeChange(t as ScheduleType)}
            type="button"
            aria-pressed={scheduleType === t}
            title="Use {label} schedule"
            aria-label="{label} schedule">{label}</button
          >
        {/each}
      </div>
    </div>

    <!-- Day table — read-only for presets, editable for custom -->
    <div class="schedule-table">
      <div class="schedule-header">
        <span>Day</span>
        <span>On</span>
        <span>Start</span>
        <span>End</span>
        <span>Hours</span>
      </div>
      {#each DAYS as day (day)}
        {@const sched = scheduleType === 'custom' ? customSchedule[day] : previewSchedule[day]}
        <div class="schedule-row" class:disabled={!sched.enabled}>
          <span class="day-label">{DAY_LABELS[day].slice(0, 3)}</span>

          {#if scheduleType === 'custom'}
            <input
              type="checkbox"
              class="day-check"
              bind:checked={customSchedule[day].enabled}
              aria-label="{DAY_LABELS[day]} enabled"
              title="Toggle {DAY_LABELS[day]}"
            />
            <input
              type="number"
              class="hour-input"
              min="0"
              max="23"
              bind:value={customSchedule[day].start}
              disabled={!customSchedule[day].enabled}
              aria-label="{DAY_LABELS[day]} start hour"
              title="{DAY_LABELS[day]} start hour (0–23)"
            />
            <input
              type="number"
              class="hour-input"
              min="1"
              max="24"
              bind:value={customSchedule[day].end}
              disabled={!customSchedule[day].enabled}
              aria-label="{DAY_LABELS[day]} end hour"
              title="{DAY_LABELS[day]} end hour (1–24)"
            />
          {:else}
            <span class="pill" class:on={sched.enabled}>{sched.enabled ? '✓' : '—'}</span>
            <span class="time-text">{sched.enabled ? fmtHour(sched.start) : '—'}</span>
            <span class="time-text">{sched.enabled ? fmtHour(sched.end) : '—'}</span>
          {/if}

          <span class="hours-val">
            {sched.enabled ? `${sched.end - sched.start}h` : '—'}
          </span>
        </div>
      {/each}
    </div>

    <!-- Weekly summary -->
    <div class="summary" role="status" aria-live="polite" aria-label="Schedule summary">
      <span>{workDaysPreview} day{workDaysPreview !== 1 ? 's' : ''} / week</span>
      <span class="sep">·</span>
      <span>{weeklyHoursPreview} hours / week</span>
    </div>

    <div class="actions">
      <Button
        color="var(--color-positive-interactive)"
        onclick={save}
        ariaLabel="Save schedule settings"
        title="Save schedule settings">Save</Button
      >
      <Button
        color="var(--color-negative-interactive)"
        onclick={() => (open = false)}
        ariaLabel="Cancel and close"
        title="Cancel and close">Cancel</Button
      >
    </div>
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

  .field-label {
    font-size: 14px;
    font-weight: 600;
    color: var(--color-text);
    font-family: var(--font-family);
  }

  .type-grid {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 0.4rem;
  }

  .type-btn {
    font-family: var(--font-family);
    font-size: 13px;
    padding: 0.5rem 0.4rem;
    border: 2px solid var(--color-text);
    border-radius: 8px;
    background: transparent;
    color: var(--color-text);
    cursor: pointer;
    transition: background 0.15s;
    box-shadow: none;
    text-align: center;
    line-height: 1.3;
  }

  .type-btn:hover {
    background: rgba(0, 0, 0, 0.08);
  }
  .type-btn:focus-visible {
    outline: 3px solid var(--color-text);
    outline-offset: 2px;
  }

  .type-btn.active {
    background: var(--color-background);
    color: var(--color-text-light);
    border-color: var(--color-background);
  }

  /* Schedule table */
  .schedule-table {
    display: flex;
    flex-direction: column;
    gap: 2px;
    font-family: var(--font-family);
    font-size: 13px;
  }

  .schedule-header {
    display: grid;
    grid-template-columns: 48px 36px 1fr 1fr 40px;
    gap: 0.4rem;
    padding: 0 0.25rem 0.25rem;
    font-weight: 600;
    color: var(--color-text);
    border-bottom: 1px solid rgba(0, 0, 0, 0.15);
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .schedule-row {
    display: grid;
    grid-template-columns: 48px 36px 1fr 1fr 40px;
    align-items: center;
    gap: 0.4rem;
    padding: 0.3rem 0.25rem;
    border-radius: 6px;
    transition: background 0.1s;
  }

  .schedule-row:not(.disabled) {
    background: rgba(0, 0, 0, 0.04);
  }
  .schedule-row.disabled {
    opacity: 0.45;
  }

  .day-label {
    font-weight: 600;
  }

  .day-check {
    width: 16px;
    height: 16px;
    cursor: pointer;
    accent-color: var(--color-background);
  }

  .hour-input {
    font-family: var(--font-family);
    font-size: 13px;
    padding: 0.25rem 0.4rem;
    border: 1px solid rgba(0, 0, 0, 0.3);
    border-radius: 5px;
    background: var(--color-text-light);
    color: var(--color-text);
    width: 100%;
    outline: none;
  }

  .hour-input:focus {
    border-color: var(--color-background);
  }
  .hour-input:disabled {
    background: rgba(0, 0, 0, 0.05);
  }

  .pill {
    display: inline-block;
    font-size: 13px;
    color: var(--color-text);
  }
  .pill.on {
    color: #217346;
    font-weight: 700;
  }

  .time-text {
    color: var(--color-text);
  }

  .hours-val {
    text-align: right;
    font-weight: 600;
    color: var(--color-text);
  }

  /* Summary */
  .summary {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    font-family: var(--font-family);
    font-size: 14px;
    color: var(--color-text);
    background: rgba(0, 0, 0, 0.06);
    padding: 0.5rem 0.75rem;
    border-radius: 8px;
  }

  .sep {
    opacity: 0.4;
  }

  .actions {
    display: flex;
    gap: 0.5rem;
    justify-content: flex-end;
  }
</style>
