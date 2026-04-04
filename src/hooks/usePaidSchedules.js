/**
 * Firestore composite indexes required:
 *   paidSchedules: (isActive ASC, pickupDate ASC)
 */
import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

export const useActivePaidSchedules = (hostelBlock) => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    let q;
    if (hostelBlock) {
      q = query(
        collection(db, 'paidSchedules'),
        where('isActive', '==', true),
        where('hostelBlocks', 'array-contains', hostelBlock)
      );
    } else {
      q = query(
        collection(db, 'paidSchedules'),
        where('isActive', '==', true)
      );
    }
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(s => s.pickupDate >= today)
        .sort((a, b) => a.pickupDate.localeCompare(b.pickupDate)); // Sorted in memory to avoid composite indexes
      setSchedules(data);
      setLoading(false);
    }, (err) => { console.error('usePaidSchedules error:', err); setLoading(false); });
    return unsub;
  }, [hostelBlock]);

  return { schedules, loading };
};

export const useAllPaidSchedules = () => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'paidSchedules'), orderBy('pickupDate', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setSchedules(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, (err) => { console.error('useAllPaidSchedules error:', err); setLoading(false); });
    return unsub;
  }, []);

  return { schedules, loading };
};
