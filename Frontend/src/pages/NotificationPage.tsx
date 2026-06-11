import React, { useEffect, useState } from 'react';
import { notificationService } from '../services/Profileservice';
import type { Notification } from '../types/donor';

const NotificationPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const load = async () => {
    try {
      const data = await notificationService.getAll();
      setNotifications(Array.isArray(data) ? data : []);
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleMarkRead = async (id: number) => {
    try {
      await notificationService.markRead(id);
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
    } catch {}
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch {}
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await notificationService.delete(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch {} finally {
      setDeletingId(null);
    }
  };

  const unread = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
          <p className="text-slate-400 text-sm mt-1">{unread} unread</p>
        </div>
        {unread > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="text-sm text-rose-600 hover:text-rose-500 border border-slate-200 px-4 py-1.5 rounded-lg transition-colors"
          >
            Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-20 bg-white border border-slate-200 rounded-xl">
          <div className="text-5xl mb-4">🔔</div>
          <p className="text-slate-900 font-semibold">All caught up</p>
          <p className="text-slate-400 text-sm mt-2">You have no notifications</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`bg-white border rounded-xl px-5 py-4 transition-colors ${!n.is_read ? 'border-red-800/40' : 'border-slate-100'}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  {!n.is_read && (
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-1.5 flex-shrink-0" />
                  )}
                  <div className={!n.is_read ? '' : 'ml-5'}>
                    <p className="text-slate-900 text-sm font-medium">{n.title}</p>
                    <p className="text-slate-400 text-sm mt-0.5">{n.message}</p>
                    <p className="text-slate-500 text-xs mt-1.5">
                      {new Date(n.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {!n.is_read && (
                    <button
                      onClick={() => handleMarkRead(n.id)}
                      className="text-xs text-rose-600 hover:text-rose-500 transition-colors"
                    >
                      Mark read
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(n.id)}
                    disabled={deletingId === n.id}
                    className="text-xs text-slate-500 hover:text-rose-600 transition-colors"
                  >
                    {deletingId === n.id ? '…' : '✕'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationPage;