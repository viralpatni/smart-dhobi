/**
 * Firestore composite indexes required:
 *   paidOrders: (studentId ASC, createdAt DESC)
 *   paidOrders: (status ASC, pickupDate ASC)
 *   paidOrders: (paidDhobiId ASC, status ASC)
 */
import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

export const useStudentPaidOrders = (studentId) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!studentId) { setLoading(false); return; }
    const q = query(
      collection(db, 'paidOrders'),
      where('studentId', '==', studentId)
    );
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
      setOrders(data);
      setLoading(false);
    }, (err) => { console.error('usePaidOrders error:', err); setLoading(false); });
    return unsub;
  }, [studentId]);

  return { orders, loading };
};

export const useActivePaidOrder = (studentId) => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!studentId) { setLoading(false); return; }
    const activeStatuses = ['scheduled', 'onTheWay', 'pickedUp', 'washing', 'readyForDelivery', 'outForDelivery'];
    const q = query(
      collection(db, 'paidOrders'),
      where('studentId', '==', studentId),
      where('status', 'in', activeStatuses)
    );
    const unsub = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        const doc = snap.docs[0];
        setOrder({ id: doc.id, ...doc.data() });
      } else {
        setOrder(null);
      }
      setLoading(false);
    }, (err) => { console.error('useActivePaidOrder error:', err); setLoading(false); });
    return unsub;
  }, [studentId]);

  return { order, loading };
};

export const useAllPaidOrders = (statusFilter) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let q;
    if (statusFilter && statusFilter !== 'all') {
      q = query(
        collection(db, 'paidOrders'),
        where('status', '==', statusFilter)
      );
    } else {
      q = query(collection(db, 'paidOrders'), orderBy('createdAt', 'desc'));
    }
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
      setOrders(data);
      setLoading(false);
    }, (err) => { console.error('useAllPaidOrders error:', err); setLoading(false); });
    return unsub;
  }, [statusFilter]);

  return { orders, loading };
};
