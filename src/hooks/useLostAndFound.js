import { useState, useEffect } from 'react';
import { supabase } from '../supabase';

// Student: my lost item complaints
export const useStudentComplaints = (studentId) => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!studentId) { setLoading(false); return; }

    const fetch = async () => {
      const { data } = await supabase
        .from('lost_and_found')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });
      setComplaints((data || []).map(mapLostItem));
      setLoading(false);
    };
    fetch();

    const channel = supabase
      .channel(`student-laf-${studentId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lost_and_found', filter: `student_id=eq.${studentId}` }, () => fetch())
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [studentId]);

  return { complaints, loading };
};

// Staff/admin: all lost item complaints
export const useAllComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('lost_and_found')
        .select('*')
        .order('created_at', { ascending: false });
      setComplaints((data || []).map(mapLostItem));
      setLoading(false);
    };
    fetch();

    const channel = supabase
      .channel('all-laf')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lost_and_found' }, () => fetch())
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  return { complaints, loading };
};

// Get complaint timeline events
export const getComplaintTimeline = async (complaintId) => {
  const { data, error } = await supabase
    .from('lost_and_found_timeline')
    .select('*')
    .eq('complaint_id', complaintId)
    .order('timestamp', { ascending: true });

  if (error) throw error;
  return (data || []).map(row => ({
    id: row.id,
    event: row.event,
    by: row.by,
    note: row.note,
    timestamp: row.timestamp,
  }));
};

function mapLostItem(row) {
  return {
    id: row.id,
    studentId: row.student_id,
    studentName: row.student_name,
    studentPhone: row.student_phone,
    studentRoom: row.student_room,
    hostelBlock: row.hostel_block,
    relatedOrderId: row.related_order_id,
    relatedTokenId: row.related_token_id,
    collectionDate: row.collection_date,
    itemType: row.item_type,
    itemColor: row.item_color,
    itemBrand: row.item_brand,
    itemDescription: row.item_description,
    itemPhoto: row.item_photo,
    quantity: row.quantity,
    status: row.status,
    priority: row.priority,
    assignedDhobiId: row.assigned_dhobi_id,
    staffNotes: row.staff_notes,
    foundLocation: row.found_location,
    resolvedAt: row.resolved_at,
    resolutionNote: row.resolution_note,
    notificationLog: row.notification_log,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
