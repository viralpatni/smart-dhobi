import { useState, useEffect } from 'react';
import {
  collection, query, where, onSnapshot, orderBy,
  getDocs
} from 'firebase/firestore';
import { db } from '../firebase';

export const useStudentComplaints = (studentId) => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!studentId) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'lostAndFound'),
      where('studentId', '==', studentId),
      orderBy('createdAt', 'desc')
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setComplaints(data);
      setLoading(false);
    }, (err) => {
      console.error('Error fetching student complaints:', err);
      setError(err);
      setLoading(false);
    });

    return () => unsub();
  }, [studentId]);

  return { complaints, loading, error };
};

export const useAllComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const q = query(
      collection(db, 'lostAndFound'),
      orderBy('createdAt', 'desc')
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setComplaints(data);
      setLoading(false);
    }, (err) => {
      console.error('Error fetching all complaints:', err);
      setError(err);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  return { complaints, loading, error };
};

export const getComplaintTimeline = async (complaintId) => {
  if (!complaintId) return [];
  const timelineRef = collection(db, 'lostAndFound', complaintId, 'timeline');
  const q = query(timelineRef, orderBy('timestamp', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};
