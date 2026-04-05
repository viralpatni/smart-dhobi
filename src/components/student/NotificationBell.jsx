import React, { useState, useRef, useEffect } from 'react';
import { useNotifications } from '../../hooks/useNotifications';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { formatTimeAgo } from '../../utils/formatDate';

const NotificationBell = ({ userId }) => {
  const { notifications, loading } = useNotifications(userId);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (notificationId) => {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), { read: true });
    } catch (error) {
      console.error('Error marking notification as read', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    const unread = notifications.filter(n => !n.read);
    for (const n of unread) {
      handleMarkAsRead(n.id);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-500 hover:text-teal-600 hover:bg-teal-50 transition-colors relative"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
        
        {unreadCount > 0 && (
          <span className="absolute 1 top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 z-50 overflow-hidden text-left origin-top-right animate-fade-in-up">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              Notifications
              {unreadCount > 0 && <span className="bg-teal-100 text-teal-700 text-xs py-0.5 px-2 rounded-full font-bold">{unreadCount} new</span>}
            </h3>
            {unreadCount > 0 && (
              <button 
                onClick={handleMarkAllAsRead}
                className="text-xs text-teal-600 font-medium hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>
          
          <div className="max-h-[360px] overflow-y-auto">
            {loading ? (
              <div className="p-8 flex justify-center">
                <div className="w-6 h-6 border-2 border-teal-100 border-t-teal-600 rounded-full animate-spin"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">
                No notifications yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {notifications.map((notif) => (
                  <div 
                    key={notif.id} 
                    className={`p-4 transition-colors ${!notif.read ? 'bg-teal-50/30' : 'hover:bg-slate-50'} flex gap-3 cursor-pointer`}
                    onClick={() => !notif.read && handleMarkAsRead(notif.id)}
                  >
                    <div className="mt-0.5">
                      {notif.message.includes('🧼') ? <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm">🧼</div> :
                       notif.message.includes('✨') ? <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-sm">✨</div> :
                       notif.message.includes('✅') ? <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-sm">✅</div> :
                       notif.message.includes('⚠️') ? <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-sm">⚠️</div> :
                       <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-sm">🔔</div>}
                    </div>
                    <div>
                      <p className={`text-sm ${!notif.read ? 'text-gray-900 font-medium' : 'text-slate-600'}`}>
                        {notif.message}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">{formatTimeAgo(notif.createdAt)}</p>
                    </div>
                    {!notif.read && (
                      <div className="w-2 h-2 rounded-full bg-teal-500 shrink-0 ml-auto mt-1"></div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
