import { useState, useEffect } from 'react';
import { supabase } from '../supabase';

// Student: my paid orders
export const useStudentPaidOrders = (studentId) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!studentId) { setLoading(false); return; }

    const fetch = async () => {
      const { data } = await supabase
        .from('paid_orders')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });
      setOrders((data || []).map(mapPaidOrder));
      setLoading(false);
    };
    fetch();

    const channel = supabase
      .channel(`student-paid-${studentId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'paid_orders', filter: `student_id=eq.${studentId}` }, () => fetch())
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [studentId]);

  return { orders, loading };
};

// Staff: active paid orders (not delivered)
export const useActivePaidOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('paid_orders')
        .select('*')
        .neq('status', 'delivered')
        .order('created_at', { ascending: false });
      setOrders((data || []).map(mapPaidOrder));
      setLoading(false);
    };
    fetch();

    const channel = supabase
      .channel('active-paid-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'paid_orders' }, () => fetch())
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  return { orders, loading };
};

// Staff: all paid orders
export const useAllPaidOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('paid_orders')
        .select('*')
        .order('created_at', { ascending: false });
      setOrders((data || []).map(mapPaidOrder));
      setLoading(false);
    };
    fetch();

    const channel = supabase
      .channel('all-paid-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'paid_orders' }, () => fetch())
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  return { orders, loading };
};

// Student: current active paid order
export const useActivePaidOrder = (studentId) => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!studentId) { setLoading(false); return; }

    const fetch = async () => {
      const { data, error } = await supabase
        .from('paid_orders')
        .select('*')
        .eq('student_id', studentId)
        .neq('status', 'delivered')
        .order('created_at', { ascending: false })
        .maybeSingle();

      if (data) {
        setOrder(mapPaidOrder(data));
      } else {
        setOrder(null);
      }
      setLoading(false);
    };
    fetch();

    const channel = supabase
      .channel(`active-order-${studentId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'paid_orders', filter: `student_id=eq.${studentId}` }, () => fetch())
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [studentId]);

  return { order, loading };
};

function mapPaidOrder(row) {
  return {
    id: row.id,
    tokenId: row.token_id,
    studentId: row.student_id,
    studentName: row.student_name,
    studentRoom: row.student_room,
    studentPhone: row.student_phone,
    hostelBlock: row.hostel_block,
    scheduleId: row.schedule_id,
    items: row.items,
    totalAmount: row.total_amount,
    actualItemsCount: row.actual_items_count,
    status: row.status,
    paymentStatus: row.payment_status,
    paymentCollectedAt: row.payment_collected_at,
    staffNotes: row.staff_notes,
    pickupNotes: row.pickup_notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

