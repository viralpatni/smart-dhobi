/**
 * Lost & Found Firestore Hooks
 *
 * Required composite indexes (create in Firebase Console):
 *   1. Collection: lostAndFound — Fields: studentId ASC, createdAt DESC
 *   2. Collection: lostAndFound — Fields: status ASC, createdAt DESC
 */

import { useState, useEffect } from 'react';
import {
  collection, query, where, onSnapshot, orderBy,
  getDocs
} from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Subscribe to complaints filed by a specific student (real-time).
 */
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

/**
 * Subscribe to ALL complaints (for staff dashboard — real-time).
 */
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

/**
 * One-time fetch of a complaint's timeline sub-collection sorted by timestamp.
 */
export const getComplaintTimeline = async (complaintId) => {
  if (!complaintId) return [];

  const timelineRef = collection(db, 'lostAndFound', complaintId, 'timeline');
  const q = query(timelineRef, orderBy('timestamp', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};
