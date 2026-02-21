export interface Notification {
  id: number;
  text: string;
  type: 'success' | 'error';
  autoDismiss: boolean;
  autoDismissDelay: number;
}

const MAX_SNACKBARS = 5;
let nextId = 0;

class NotificationStore {
  items = $state<Notification[]>([]);

  add(
    text: string,
    type: 'success' | 'error' = 'success',
    autoDismiss = true,
    autoDismissDelay = 4000
  ) {
    const notification: Notification = { id: nextId++, text, type, autoDismiss, autoDismissDelay };

    this.items = [...this.items, notification];

    // Trim oldest if over max
    if (this.items.length > MAX_SNACKBARS) {
      this.items = this.items.slice(this.items.length - MAX_SNACKBARS);
    }

    if (autoDismiss) {
      setTimeout(() => this.dismiss(notification.id), autoDismissDelay);
    }
  }

  dismiss(id: number) {
    this.items = this.items.filter((n) => n.id !== id);
  }
}

export { NotificationStore };
export const notifications = new NotificationStore();
