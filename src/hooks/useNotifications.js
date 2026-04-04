import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import toast from 'react-hot-toast';

export const useNotifications = (userId) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }

    const fetchNotifications = async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .eq('read', false)
        .order('created_at', { ascending: false });

      if (!error) setNotifications((data || []).map(mapNotification));
      setLoading(false);
    };
    fetchNotifications();

    const channel = supabase
      .channel(`notifications-${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      }, (payload) => {
        const n = mapNotification(payload.new);
        setNotifications(prev => [n, ...prev]);
        toast(n.message, { icon: '🔔', duration: 5000 });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  const markAsRead = async (notifId) => {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notifId);
    setNotifications(prev => prev.filter(n => n.id !== notifId));
  };

  const markAllAsRead = async () => {
    if (!userId) return;
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);
    setNotifications([]);
  };

  return { notifications, loading, markAsRead, markAllAsRead };
};

function mapNotification(row) {
  return {
    id: row.id,
    userId: row.user_id,
    message: row.message,
    read: row.read,
    createdAt: row.created_at,
  };
}
