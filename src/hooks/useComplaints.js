import { useState, useEffect } from 'react';
import { supabase } from '../supabase';

// ──────────────────────────────────────────────
// Student: my submitted complaints/feedback
// ──────────────────────────────────────────────
export const useStudentSubmissions = (studentId) => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!studentId) { setLoading(false); return; }

    const fetch = async () => {
      const { data } = await supabase
        .from('complaints')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });
      setSubmissions((data || []).map(mapComplaint));
      setLoading(false);
    };
    fetch();

    const channel = supabase
      .channel(`student-complaints-${studentId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'complaints', filter: `student_id=eq.${studentId}` }, () => fetch())
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [studentId]);

  return { submissions, loading };
};

// ──────────────────────────────────────────────
// Staff: complaints meant for this staff member
// ──────────────────────────────────────────────
export const useStaffComplaints = (staffId, staffRole) => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!staffId) { setLoading(false); return; }

    const fetch = async () => {
      // Get complaints against this staff + general complaints of same service type
      const serviceType = staffRole === 'paidStaff' ? 'paidLaundry' : 'freeLaundry';

      const { data: againstMe } = await supabase
        .from('complaints')
        .select('*')
        .eq('against_staff_id', staffId)
        .order('created_at', { ascending: false });

      const { data: general } = await supabase
        .from('complaints')
        .select('*')
        .eq('service_type', serviceType)
        .eq('against_staff_id', '')
        .order('created_at', { ascending: false });

      // Merge and deduplicate
      const map = new Map();
      [...(againstMe || []), ...(general || [])].forEach(c => map.set(c.id, c));
      const merged = Array.from(map.values())
        .map(mapComplaint)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setComplaints(merged);
      setLoading(false);
    };
    fetch();

    const channel = supabase
      .channel(`staff-complaints-${staffId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'complaints' }, () => fetch())
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [staffId, staffRole]);

  return { complaints, loading };
};

// ──────────────────────────────────────────────
// Admin: all complaints 
// ──────────────────────────────────────────────
export const useAllComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('complaints')
        .select('*')
        .order('created_at', { ascending: false });
      setComplaints((data || []).map(mapComplaint));
      setLoading(false);
    };
    fetch();

    const channel = supabase
      .channel('all-complaints')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'complaints' }, () => fetch())
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  return { complaints, loading };
};

// ──────────────────────────────────────────────
// Complaint discussion thread
// ──────────────────────────────────────────────
export const useComplaintThread = (complaintId, includeInternal = false) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!complaintId) { setLoading(false); return; }

    const fetch = async () => {
      let q = supabase
        .from('complaint_threads')
        .select('*')
        .eq('complaint_id', complaintId)
        .order('created_at', { ascending: true });

      if (!includeInternal) {
        q = q.eq('is_internal', false);
      }

      const { data } = await q;
      setMessages((data || []).map(mapThread));
      setLoading(false);
    };
    fetch();

    const channel = supabase
      .channel(`thread-${complaintId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'complaint_threads',
        filter: `complaint_id=eq.${complaintId}`,
      }, (payload) => {
        const msg = mapThread(payload.new);
        if (!includeInternal && msg.isInternal) return;
        setMessages(prev => [...prev, msg]);
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [complaintId, includeInternal]);

  return { messages, loading };
};

// ──────────────────────────────────────────────
// Add a thread message
// ──────────────────────────────────────────────
export const addThreadMessage = async (complaintId, { authorId, authorName, authorRole, message, isInternal }) => {
  const { error } = await supabase
    .from('complaint_threads')
    .insert({
      complaint_id: complaintId,
      author_id: authorId,
      author_name: authorName,
      author_role: authorRole,
      message,
      is_internal: isInternal || false,
    });
  if (error) throw error;
};

// ──────────────────────────────────────────────
// Mappers
// ──────────────────────────────────────────────
function mapComplaint(row) {
  return {
    id: row.id,
    type: row.type,
    studentId: row.student_id,
    studentName: row.student_name,
    studentPhone: row.student_phone,
    studentRoom: row.student_room,
    hostelBlock: row.hostel_block,
    title: row.title,
    description: row.description,
    category: row.category,
    serviceType: row.service_type,
    relatedTokenId: row.related_token_id,
    suggestedSolution: row.suggested_solution,
    attachmentUrl: row.attachment_url,
    isAnonymous: row.is_anonymous,
    againstStaffId: row.against_staff_id,
    againstStaffName: row.against_staff_name,
    againstStaffRole: row.against_staff_role,
    status: row.status,
    priority: row.priority,
    rating: row.rating,
    staffResponse: row.staff_response,
    resolutionSummary: row.resolution_summary,
    staffRespondedAt: row.staff_responded_at,
    staffRespondedBy: row.staff_responded_by,
    adminResponse: row.admin_response,
    adminRespondedAt: row.admin_responded_at,
    adminRespondedBy: row.admin_responded_by,
    isEscalated: row.is_escalated,
    escalatedAt: row.escalated_at,
    studentSatisfied: row.student_satisfied,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapThread(row) {
  return {
    id: row.id,
    complaintId: row.complaint_id,
    authorId: row.author_id,
    authorName: row.author_name,
    authorRole: row.author_role,
    message: row.message,
    isInternal: row.is_internal,
    createdAt: row.created_at,
  };
}
