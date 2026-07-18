import React from 'react';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import { useNotificationStore, type NotificationType } from '../../store/notificationStore';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs: (string | undefined | null | false)[]) => {
  return twMerge(clsx(inputs));
};

const icons: Record<NotificationType, React.ReactNode> = {
  success: <CheckCircle className="w-5 h-5 text-green-500" />,
  error: <XCircle className="w-5 h-5 text-red-500" />,
  info: <Info className="w-5 h-5 text-blue-500" />,
  warning: <AlertTriangle className="w-5 h-5 text-yellow-500" />
};

const bgColors: Record<NotificationType, string> = {
  success: 'bg-green-50 border-green-200',
  error: 'bg-red-50 border-red-200',
  info: 'bg-blue-50 border-blue-200',
  warning: 'bg-yellow-50 border-yellow-200'
};

export const NotificationProvider = () => {
  const { notifications, removeNotification } = useNotificationStore();

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={cn(
            'flex items-start gap-3 p-4 border rounded-xl shadow-lg pointer-events-auto transition-all duration-300 transform translate-y-0 opacity-100',
            bgColors[notification.type]
          )}
          style={{ minWidth: '300px', maxWidth: '400px' }}
        >
          <div className="flex-shrink-0 mt-0.5">
            {icons[notification.type]}
          </div>
          <p className="text-sm font-medium text-gray-800 flex-1 break-words">{notification.message}</p>
          <button
            onClick={() => removeNotification(notification.id)}
            className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
