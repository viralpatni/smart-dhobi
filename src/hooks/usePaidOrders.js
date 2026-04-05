import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

export const useStudentPaidOrders = (studentId) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!studentId) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'paidOrders'),
      where('studentId', '==', studentId),
      orderBy('createdAt', 'desc')
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOrders(data);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching paid orders:", error);
      setLoading(false);
    });

    return () => unsub();
  }, [studentId]);

  return { orders, loading };
};

export const useActivePaidOrder = (studentId) => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!studentId) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'paidOrders'),
      where('studentId', '==', studentId),
      where('status', 'in', ['scheduled', 'onTheWay', 'pickedUp', 'washing', 'readyForDelivery', 'outForDelivery'])
    );

    const unsub = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setOrder({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
      } else {
        setOrder(null);
      }
      setLoading(false);
    });

    return () => unsub();
  }, [studentId]);

  return { order, loading };
};

export const useAllPaidOrders = (statusFilter) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = statusFilter && statusFilter !== 'all'
      ? query(collection(db, 'paidOrders'), where('status', '==', statusFilter))
      : query(collection(db, 'paidOrders'), orderBy('createdAt', 'desc'));

    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOrders(data);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching all paid orders:", error);
      setLoading(false);
    });

    return () => unsub();
  }, [statusFilter]);

  return { orders, loading };
};
