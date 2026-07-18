import { useNotificationStore } from '../store/notificationStore';

export const toast = {
  success: (message: string) => useNotificationStore.getState().addNotification('success', message),
  error: (message: string) => useNotificationStore.getState().addNotification('error', message),
  info: (message: string) => useNotificationStore.getState().addNotification('info', message),
  warning: (message: string) => useNotificationStore.getState().addNotification('warning', message),
};
