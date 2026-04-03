import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

export const useTodayAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const docRef = doc(db, 'analytics', today);

    const unsub = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setAnalytics({ id: docSnap.id, ...docSnap.data() });
      } else {
        setAnalytics({
          totalDropOffs: 0,
          totalCollected: 0,
          totalMissingReports: 0,
          hourlyDropOffs: { "08": 0, "09": 0, "10": 0, "11": 0, "12": 0, "13": 0, "14": 0, "15": 0, "16": 0, "17": 0, "18": 0 }
        });
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching analytics:", error);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  return { analytics, loading };
};
