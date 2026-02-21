import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { NotificationStore } from '../notifications.svelte';

describe('NotificationStore', () => {
  let store: NotificationStore;

  beforeEach(() => {
    store = new NotificationStore();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('add()', () => {
    it('adds a notification to the items list', () => {
      store.add('hello', 'success');
      expect(store.items).toHaveLength(1);
      expect(store.items[0].text).toBe('hello');
      expect(store.items[0].type).toBe('success');
    });

    it('adds an error notification', () => {
      store.add('bad thing', 'error');
      expect(store.items[0].type).toBe('error');
    });

    it('defaults to type "success"', () => {
      store.add('default type');
      expect(store.items[0].type).toBe('success');
    });

    it('defaults autoDismiss to true and autoDismissDelay to 4000', () => {
      store.add('msg');
      expect(store.items[0].autoDismiss).toBe(true);
      expect(store.items[0].autoDismissDelay).toBe(4000);
    });

    it('respects custom autoDismiss and delay', () => {
      store.add('sticky', 'success', false, 1000);
      expect(store.items[0].autoDismiss).toBe(false);
      expect(store.items[0].autoDismissDelay).toBe(1000);
    });

    it('accumulates multiple notifications', () => {
      store.add('a');
      store.add('b');
      store.add('c');
      expect(store.items).toHaveLength(3);
    });

    it('auto-dismisses after the configured delay', () => {
      store.add('auto', 'success', true, 2000);
      expect(store.items).toHaveLength(1);
      vi.advanceTimersByTime(2000);
      expect(store.items).toHaveLength(0);
    });

    it('does not auto-dismiss when autoDismiss is false', () => {
      store.add('sticky', 'success', false);
      vi.advanceTimersByTime(10_000);
      expect(store.items).toHaveLength(1);
    });

    it('trims to 5 notifications when more than 5 are added', () => {
      for (let i = 0; i < 7; i++) store.add(`msg ${i}`);
      expect(store.items).toHaveLength(5);
      // Oldest two should have been removed — last item should be the most recent
      expect(store.items[4].text).toBe('msg 6');
    });

    it('keeps exactly 5 items when exactly 5 are added', () => {
      for (let i = 0; i < 5; i++) store.add(`msg ${i}`);
      expect(store.items).toHaveLength(5);
    });
  });

  describe('dismiss()', () => {
    it('removes the notification with the matching id', () => {
      store.add('to keep');
      store.add('to remove');
      const removeId = store.items[1].id;
      store.dismiss(removeId);
      expect(store.items).toHaveLength(1);
      expect(store.items[0].text).toBe('to keep');
    });

    it('is a no-op when the id does not exist', () => {
      store.add('keep');
      store.dismiss(99999);
      expect(store.items).toHaveLength(1);
    });

    it('removes all notifications when called for each id', () => {
      store.add('a');
      store.add('b');
      const ids = store.items.map((n) => n.id);
      ids.forEach((id) => store.dismiss(id));
      expect(store.items).toHaveLength(0);
    });
  });
});
