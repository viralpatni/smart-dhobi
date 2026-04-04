import { useState, useEffect } from 'react';
import { supabase } from '../supabase';

// Active paid schedules (student-facing)
export const useActivePaidSchedules = () => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('paid_schedules')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      setSchedules((data || []).map(mapSchedule));
      setLoading(false);
    };
    fetch();

    const channel = supabase
      .channel('active-paid-schedules')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'paid_schedules' }, () => fetch())
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  return { schedules, loading };
};

// All paid schedules (staff-facing)
export const useAllPaidSchedules = () => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('paid_schedules')
        .select('*')
        .order('created_at', { ascending: false });
      setSchedules((data || []).map(mapSchedule));
      setLoading(false);
    };
    fetch();

    const channel = supabase
      .channel('all-paid-schedules')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'paid_schedules' }, () => fetch())
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  return { schedules, loading };
};

function mapSchedule(row) {
  return {
    id: row.id,
    weekLabel: row.week_label,
    pickupDay: row.pickup_day,
    pickupDate: row.pickup_date,
    pickupTimeSlot: row.pickup_time_slot,
    deliveryDate: row.delivery_date,
    deliveryTimeSlot: row.delivery_time_slot,
    hostelBlocks: row.hostel_blocks || [],
    isActive: row.is_active,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}
