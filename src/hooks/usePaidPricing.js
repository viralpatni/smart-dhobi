import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

export const usePaidPricing = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'paidPricing'),
      where('isAvailable', '==', true)
    );
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
      setItems(data);
      setLoading(false);
    }, (err) => { console.error('usePaidPricing error:', err); setLoading(false); });
    return unsub;
  }, []);

  return { items, loading };
};

export const useAllPaidPricing = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = collection(db, 'paidPricing');
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
      setItems(data);
      setLoading(false);
    }, (err) => { console.error('useAllPaidPricing error:', err); setLoading(false); });
    return unsub;
  }, []);

  return { items, loading };
};
