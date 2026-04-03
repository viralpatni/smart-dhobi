import { getFunctions, httpsCallable } from 'firebase/functions';
import toast from 'react-hot-toast';

export const sendNotification = async (phone, message) => {
  const useMock = import.meta.env.VITE_USE_MOCK_NOTIFICATIONS === 'true';
  
  if (useMock) {
    console.log(`[MOCK WHATSAPP to ${phone}]: ${message}`);
    toast(`📱 [WhatsApp Mock]\n${message}`, {
      duration: 6000,
      icon: '💬',
      style: {
        background: '#0F172A',
        color: '#fff',
        maxWidth: '400px'
      }
    });
    return true;
  }

  try {
    const functions = getFunctions();
    const sendWhatsAppNotification = httpsCallable(functions, 'sendWhatsAppNotification');
    await sendWhatsAppNotification({ to: phone, message });
    return true;
  } catch (error) {
    console.error('Notification error:', error);
    toast.error('Failed to send WhatsApp notification');
    return false;
  }
};
