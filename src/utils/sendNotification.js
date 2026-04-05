import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export const sendNotification = async (userId, message) => {
  if (!userId) {
    console.warn('sendNotification requires a valid userId. Notification dropped:', message);
    return false;
  }
  
  try {
    const notificationsRef = collection(db, 'notifications');
    await addDoc(notificationsRef, {
      userId,
      message,
      read: false,
      createdAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Notification error:', error);
    return false;
  }
};
