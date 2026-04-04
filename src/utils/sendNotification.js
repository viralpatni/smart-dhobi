import { supabase } from '../supabase';

/**
 * Send an in-app notification to a user.
 * Replaces the old Firestore addDoc(collection(db, 'notifications'), ...).
 */
export const sendNotification = async (userId, message) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        message,
        read: false,
      });
    if (error) throw error;
  } catch (err) {
    console.error('sendNotification error:', err);
  }
};
