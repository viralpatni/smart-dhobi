import { useState, useEffect } from 'react';
import { supabase } from '../supabase';

// Hook: get the latest order for a specific student
export const useStudentOrder = (studentId) => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!studentId) { setLoading(false); return; }

    const fetchOrder = async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (!error && data?.length > 0) {
        setOrder(mapOrder(data[0]));
      }
      setLoading(false);
    };
    fetchOrder();

    // Real-time subscription
    const channel = supabase
      .channel(`student-order-${studentId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'orders',
        filter: `student_id=eq.${studentId}`,
      }, (payload) => {
        if (payload.eventType === 'DELETE') {
          setOrder(null);
        } else {
          setOrder(mapOrder(payload.new));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [studentId]);

  return { order, loading };
};

// Hook: get all active (non-collected) orders
export const useAllActiveOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .neq('status', 'collected')
        .order('created_at', { ascending: false });

      if (!error) setOrders((data || []).map(mapOrder));
      setLoading(false);
    };
    fetchOrders();

    const channel = supabase
      .channel('active-orders')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'orders',
      }, () => {
        // Re-fetch on any change
        fetchOrders();
      })
      .subscribe();

    // Need to define fetchOrders outside or use a ref; simplify:
    return () => { supabase.removeChannel(channel); };
  }, []);

  return { orders, loading };
};

// Map snake_case to camelCase for component compatibility
function mapOrder(row) {
  if (!row) return null;
  return {
    id: row.id,
    tokenId: row.token_id,
    studentId: row.student_id,
    studentName: row.student_name,
    studentRoom: row.student_room,
    hostelBlock: row.hostel_block,
    clothesCount: row.clothes_count,
    items: row.items,
    status: row.status,
    rackNumber: row.rack_number,
    missingItems: row.missing_items,
    onMyWay: row.on_my_way,
    onMyWayAt: row.on_my_way_at,
    collectedTime: row.collected_time,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
