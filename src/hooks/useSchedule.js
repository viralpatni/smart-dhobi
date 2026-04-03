import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

export const useStudentSchedule = (userId) => {
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const q = query(
      collection(db, 'schedules'),
      where('studentId', '==', userId),
      where('slotDate', '==', today)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setSchedule({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
      } else {
        setSchedule(null);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching schedule:", error);
      setLoading(false);
    });

    return () => unsub();
  }, [userId]);

  return { schedule, loading };
};
