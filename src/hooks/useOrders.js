import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';

export const useStudentOrder = (userId) => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'orders'),
      where('studentId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(1)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setOrder({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
      } else {
        setOrder(null);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching order:", error);
      setLoading(false);
    });

    return () => unsub();
  }, [userId]);

  return { order, loading };
};

export const useAllActiveOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'orders'),
      where('status', '!=', 'collected')
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const activeOrders = [];
      snapshot.forEach((doc) => {
        activeOrders.push({ id: doc.id, ...doc.data() });
      });
      // Sort manually since inequality filter requires first orderBy to be same field
      activeOrders.sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis());
      setOrders(activeOrders);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching active orders:", error);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  return { orders, loading };
};
