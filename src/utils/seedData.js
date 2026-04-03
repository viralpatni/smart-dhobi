import { doc, writeBatch, collection, setDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { generateToken } from './generateToken';
import toast from 'react-hot-toast';

export const seedFirestore = async () => {
  try {
    const batch = writeBatch(db);

    // 1. Racks (1-20)
    for (let i = 1; i <= 20; i++) {
      const rackRef = doc(collection(db, 'racks'));
      batch.set(rackRef, {
        rackNumber: i.toString(),
        isOccupied: false,
        currentOrderId: null,
        hostelBlock: 'Block A'
      });
    }

    // 2. Demo Users UIDs
    const studentsSnap = await getDocs(query(collection(db, 'users'), where('email', '==', 'student@smartdhobi.com')));
    const studentUid = !studentsSnap.empty ? studentsSnap.docs[0].id : 'demo-student-uid';

    const staffSnap = await getDocs(query(collection(db, 'users'), where('email', '==', 'dhobi@smartdhobi.com')));
    const staffUid = !staffSnap.empty ? staffSnap.docs[0].id : 'demo-staff-uid';

    // 3. Demo Analytics for Today
    const today = new Date().toISOString().split('T')[0];
    const analyticsRef = doc(db, 'analytics', today);
    batch.set(analyticsRef, {
      date: today,
      totalDropOffs: 5,
      totalCollected: 2,
      totalMissingReports: 0,
      hourlyDropOffs: { "08": 1, "09": 2, "10": 1, "11": 1, "12": 0, "13": 0, "14": 0, "15": 0, "16": 0, "17": 0, "18": 0 }
    });

    // 4. Demo Schedule for tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDateStr = tomorrow.toISOString().split("T")[0];
    
    const scheduleRef = doc(collection(db, 'schedules'));
    batch.set(scheduleRef, {
      studentId: studentUid,
      studentName: 'Demo Student',
      hostelBlock: 'Block A',
      slotDate: tomorrowDateStr,
      slotTime: '10:00 AM - 11:00 AM',
      reminderSent: false,
      status: 'upcoming'
    });

    // 5. Demo Order (Incoming)
    const orderRef = doc(collection(db, 'orders'));
    batch.set(orderRef, {
      tokenId: generateToken(),
      studentId: studentUid,
      studentName: 'Demo Student',
      studentPhone: '+919876543210',
      studentRoom: 'A-101',
      dhobiId: staffUid,
      clothesCount: 15,
      rackNo: null,
      status: 'onTheWay',
      dropOffTime: null,
      rackAssignedTime: null,
      collectedTime: null,
      missingItemReported: false,
      missingItemDesc: '',
      notificationLog: { dropOffAlert: false, rackReadyAlert: false },
      createdAt: new Date()
    });

    await batch.commit();
    toast.success('Database seeded successfully!');
  } catch (error) {
    console.error('Error seeding data:', error);
    toast.error('Failed to seed database');
  }
};
