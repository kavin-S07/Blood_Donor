import React, { useState, useEffect, useCallback } from 'react';
import { hospitalService } from '../services/hospitalService';
import type { Notification } from '../types/donor';
import type { NotificationLog } from '../types/analytics';

interface NotificationPanelProps {
  inAppNotifications?: Notification[];
  inAppUnread?: number;
  onMarkRead?: (id: number) => void;
  onMarkAllRead?: () => void;
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({
  inAppNotifications,
  inAppUnread = 0,
  onMarkRead,
  onMarkAllRead,
}) => {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'in-app' | 'logs'>('in-app');
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  const loadLogs = useCallback(async () => {
    setLogsLoading(true);
    try {
      const data = await hospitalService.getNotificationLogs(50);
      setLogs(Array.isArray(data) ? data : []);
    } catch {
      setLogs([]);
    } finally {
      setLogsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open && tab === 'logs') loadLogs();
  }, [open, tab, loadLogs]);

  const typeIcon: Record<string, string> = {
    new_request: '🆕',
    donor_accepted: '✅',
    donor_travelling: '🚗',
    donor_arrived: '📍',
    donation_completed: '🎉',
    auto_notify: '📨',
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-xl hover:bg-slate-100 transition-colors"
      >
        <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {inAppUnread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {inAppUnread > 9 ? '9+' : inAppUnread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-2xl border border-slate-100 shadow-xl z-50 max-h-[500px] flex flex-col">
            {/* Tabs */}
            <div className="flex border-b border-slate-100 shrink-0">
              <button
                onClick={() => setTab('in-app')}
                className={`flex-1 text-xs font-semibold py-3 text-center transition-colors ${
                  tab === 'in-app' ? 'text-rose-600 border-b-2 border-rose-600' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                Notifications {inAppUnread > 0 && `(${inAppUnread})`}
              </button>
              <button
                onClick={() => setTab('logs')}
                className={`flex-1 text-xs font-semibold py-3 text-center transition-colors ${
                  tab === 'logs' ? 'text-rose-600 border-b-2 border-rose-600' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                Activity Log
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto flex-1">
              {tab === 'in-app' && (
                <div>
                  {inAppUnread > 0 && onMarkAllRead && (
                    <div className="px-4 pt-3">
                      <button
                        onClick={onMarkAllRead}
                        className="text-xs font-semibold text-rose-600 hover:text-rose-700"
                      >
                        Mark all as read
                      </button>
                    </div>
                  )}
                  {(!inAppNotifications || inAppNotifications.length === 0) ? (
                    <div className="text-center py-8">
                      <p className="text-slate-400 text-sm">No notifications</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-50">
                      {inAppNotifications.map((n) => (
                        <div
                          key={n.id}
                          className={`px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors ${!n.is_read ? 'bg-rose-50/30' : ''}`}
                          onClick={() => onMarkRead?.(n.id)}
                        >
                          <div className="flex items-start gap-2">
                            <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${!n.is_read ? 'bg-rose-500' : 'bg-transparent'}`} />
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-slate-900">{n.title}</div>
                              <div className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</div>
                              <div className="text-[10px] text-slate-400 mt-1">
                                {new Date(n.created_at).toLocaleDateString()} {new Date(n.created_at).toLocaleTimeString()}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {tab === 'logs' && (
                <div>
                  {logsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="w-5 h-5 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : logs.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-slate-400 text-sm">No activity logs yet</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-50">
                      {logs.map((log) => (
                        <div key={log.id} className="px-4 py-3">
                          <div className="flex items-start gap-2">
                            <span className="text-base shrink-0">{typeIcon[log.type] || '📄'}</span>
                            <div className="min-w-0">
                              <div className="text-xs text-slate-700">
                                <span className="font-medium">{log.sender_name}</span>
                                {' → '}
                                <span className="font-medium">{log.recipient_name}</span>
                              </div>
                              <div className="text-xs text-slate-500 mt-0.5 line-clamp-2">{log.message}</div>
                              <div className="text-[10px] text-slate-400 mt-1">
                                {new Date(log.created_at).toLocaleDateString()} {new Date(log.created_at).toLocaleTimeString()}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationPanel;
