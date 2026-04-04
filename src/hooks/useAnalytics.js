import { useState, useEffect } from 'react';
import { supabase } from '../supabase';

export const useTodayAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const todayStr = new Date().toISOString().split('T')[0];

    const fetchAnalytics = async () => {
      const { data, error } = await supabase
        .from('analytics')
        .select('*')
        .eq('id', todayStr)
        .single();

      if (!error && data) {
        setAnalytics(mapAnalytics(data));
      } else {
        // No analytics for today yet — return defaults
        setAnalytics({
          id: todayStr,
          totalDropOffs: 0,
          totalWashed: 0,
          totalCollected: 0,
          totalItemsProcessed: 0,
          peakHour: '',
        });
      }
      setLoading(false);
    };
    fetchAnalytics();

    const channel = supabase
      .channel('today-analytics')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'analytics',
        filter: `id=eq.${todayStr}`,
      }, (payload) => {
        if (payload.new) setAnalytics(mapAnalytics(payload.new));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return { analytics, loading };
};

function mapAnalytics(row) {
  return {
    id: row.id,
    totalDropOffs: row.total_drop_offs || 0,
    totalWashed: row.total_washed || 0,
    totalCollected: row.total_collected || 0,
    totalItemsProcessed: row.total_items_processed || 0,
    peakHour: row.peak_hour || '',
  };
}
