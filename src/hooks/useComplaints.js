import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';

export const useStudentSubmissions = (studentId) => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!studentId) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'complaints'),
      where('studentId', '==', studentId)
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      data.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
      setSubmissions(data);
      setLoading(false);
    }, (err) => {
      console.error("useStudentSubmissions error:", err);
      setError(err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [studentId]);

  return { submissions, loading, error };
};

export const useStaffComplaints = (staffId, staffRole) => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!staffId || !staffRole) {
      setLoading(false);
      return;
    }

    const restrictedStatuses = ["escalatedToAdmin", "resolvedByAdmin", "closed"];
    const serviceFilter = staffRole === 'paidStaff' ? 'paidLaundry' : 'freeLaundry';

    const qAgainstMe = query(
      collection(db, 'complaints'),
      where('againstStaffId', '==', staffId)
    );

    const qGeneral = query(
      collection(db, 'complaints'),
      where('againstStaffId', '==', null),
      where('serviceType', '==', serviceFilter)
    );

    let unsubMe = null;
    let unsubGeneral = null;

    let meData = [];
    let generalData = [];

    const handleMerge = () => {
      const mergedMap = new Map();
      [...meData, ...generalData].forEach(doc => {
        if (!restrictedStatuses.includes(doc.status)) {
          mergedMap.set(doc.id, doc);
        }
      });
      const mergedArray = Array.from(mergedMap.values()).sort((a, b) => {
        const timeA = a.createdAt?.toMillis() || 0;
        const timeB = b.createdAt?.toMillis() || 0;
        return timeB - timeA;
      });
      setComplaints(mergedArray);
      setLoading(false);
    };

    unsubMe = onSnapshot(qAgainstMe, (snap) => {
      meData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      handleMerge();
    }, (err) => {
      console.error(err);
      setError(err);
    });

    unsubGeneral = onSnapshot(qGeneral, (snap) => {
      generalData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      handleMerge();
    }, (err) => {
      console.error(err);
      setError(err);
    });

    return () => {
      if (unsubMe) unsubMe();
      if (unsubGeneral) unsubGeneral();
    };
  }, [staffId, staffRole]);

  return { complaints, loading, error };
};

export const useAllComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const q = query(
      collection(db, 'complaints'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      setComplaints(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (err) => {
      console.error("useAllComplaints error:", err);
      setError(err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { complaints, loading, error };
};

export const useComplaintThread = (complaintId, isStaffOrAdmin) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!complaintId) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, `complaints/${complaintId}/thread`),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      let data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if (!isStaffOrAdmin) {
        data = data.filter(msg => !msg.isInternal);
      }
      setMessages(data);
      setLoading(false);
    }, (err) => {
      console.error("useComplaintThread error:", err);
      setError(err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [complaintId, isStaffOrAdmin]);

  return { messages, loading, error };
};

export const addThreadMessage = async (complaintId, msgPayload) => {
  if (!complaintId || !msgPayload.authorId) throw new Error("Missing thread requirements");
  return await addDoc(collection(db, `complaints/${complaintId}/thread`), {
    ...msgPayload,
    isInternal: !!msgPayload.isInternal,
    attachmentUrl: msgPayload.attachmentUrl || null,
    createdAt: serverTimestamp()
  });
};
