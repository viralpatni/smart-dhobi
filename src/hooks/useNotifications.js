import { useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import toast from 'react-hot-toast';

export const useNotifications = (userId) => {
  useEffect(() => {
    if (!userId) return;

    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', userId),
      where('read', '==', false)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const notification = change.doc.data();
          
          // Show toast on the student's screen
          toast(`🔔 Alert\n${notification.message}`, {
            duration: 8000,
            style: {
              background: '#0F172A',
              color: '#fff',
              maxWidth: '400px',
              borderLeft: '4px solid #0EA5E9'
            }
          });

          // Mark as read immediately so it doesn't fire again
          const docRef = doc(db, 'notifications', change.doc.id);
          updateDoc(docRef, { read: true }).catch(console.error);
        }
      });
    }, (error) => {
      console.error('Error listening to notifications:', error);
    });

    return () => unsubscribe();
  }, [userId]);
};
