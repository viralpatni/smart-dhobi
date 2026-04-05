import { doc, writeBatch, collection, setDoc, query, where, getDocs, addDoc } from 'firebase/firestore';
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

    // ────────────────────────────────────────
    // 6. Lost & Found Seed Data (5 complaints)
    // ────────────────────────────────────────
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);

    const lostItems = [
      {
        studentId: studentUid,
        studentName: 'Demo Student',
        studentPhone: '+919876543210',
        studentRoom: 'A-101',
        hostelBlock: 'Block A',
        relatedOrderId: 'demo-order-1',
        relatedTokenId: 'DH-2047',
        collectionDate: dayAgo,
        itemType: 'T-Shirt',
        itemColor: 'Blue',
        itemBrand: 'H&M',
        itemDescription: 'Dark blue cotton T-shirt with a small logo on the left chest. Size L.',
        itemPhoto: null,
        quantity: 1,
        status: 'open',
        priority: 'medium',
        assignedDhobiId: null,
        staffNotes: '',
        foundLocation: '',
        resolvedAt: null,
        resolutionNote: '',
        notificationLog: { complaintReceived: true, statusUpdated: false, itemFound: false },
        createdAt: dayAgo,
        updatedAt: dayAgo,
        timeline: [
          { event: 'Complaint filed by student', by: 'student', note: 'Missing blue T-Shirt reported for order DH-2047', timestamp: dayAgo },
        ]
      },
      {
        studentId: studentUid,
        studentName: 'Demo Student',
        studentPhone: '+919876543210',
        studentRoom: 'A-101',
        hostelBlock: 'Block A',
        relatedOrderId: 'demo-order-2',
        relatedTokenId: 'DH-1982',
        collectionDate: twoDaysAgo,
        itemType: 'Jeans',
        itemColor: 'Black',
        itemBrand: 'Levi\'s',
        itemDescription: 'Black slim-fit jeans, size 32, slight fade near pockets. No visible brand tag.',
        itemPhoto: null,
        quantity: 1,
        status: 'underReview',
        priority: 'high',
        assignedDhobiId: staffUid,
        staffNotes: 'Checking sorting pile',
        foundLocation: '',
        resolvedAt: null,
        resolutionNote: '',
        notificationLog: { complaintReceived: true, statusUpdated: true, itemFound: false },
        createdAt: twoDaysAgo,
        updatedAt: dayAgo,
        timeline: [
          { event: 'Complaint filed by student', by: 'student', note: 'Missing black Jeans reported for order DH-1982', timestamp: twoDaysAgo },
          { event: 'Status changed to Under Review', by: 'Dhobi Ram', note: 'Checking sorting pile and lost rack', timestamp: dayAgo },
        ]
      },
      {
        studentId: studentUid,
        studentName: 'Demo Student',
        studentPhone: '+919876543210',
        studentRoom: 'A-101',
        hostelBlock: 'Block A',
        relatedOrderId: 'demo-order-3',
        relatedTokenId: 'DH-1845',
        collectionDate: threeDaysAgo,
        itemType: 'Towel',
        itemColor: 'White',
        itemBrand: 'No brand',
        itemDescription: 'Plain white cotton bath towel, medium size, no markings.',
        itemPhoto: null,
        quantity: 1,
        status: 'found',
        priority: 'low',
        assignedDhobiId: staffUid,
        staffNotes: 'Found in laundry area near dryer',
        foundLocation: 'Rack 12',
        resolvedAt: dayAgo,
        resolutionNote: 'Good news! We found your towel in Rack 12. Please collect it.',
        notificationLog: { complaintReceived: true, statusUpdated: true, itemFound: true },
        createdAt: threeDaysAgo,
        updatedAt: dayAgo,
        timeline: [
          { event: 'Complaint filed by student', by: 'student', note: 'Missing white Towel reported for order DH-1845', timestamp: threeDaysAgo },
          { event: 'Status changed to Under Review', by: 'Dhobi Ram', note: 'Searching drying area', timestamp: twoDaysAgo },
          { event: 'Item found at Rack 12', by: 'Dhobi Ram', note: 'Towel was mixed with Block B laundry', timestamp: dayAgo },
        ]
      },
      {
        studentId: studentUid,
        studentName: 'Demo Student',
        studentPhone: '+919876543210',
        studentRoom: 'A-101',
        hostelBlock: 'Block A',
        relatedOrderId: 'demo-order-4',
        relatedTokenId: 'DH-1703',
        collectionDate: fiveDaysAgo,
        itemType: 'Socks',
        itemColor: 'Red',
        itemBrand: 'No brand',
        itemDescription: 'Red ankle-length sports socks with white stripes. 3 pairs missing from the same order.',
        itemPhoto: null,
        quantity: 3,
        status: 'notFound',
        priority: 'low',
        assignedDhobiId: staffUid,
        staffNotes: 'Checked all racks, sorting area, and dryer lint traps.',
        foundLocation: '',
        resolvedAt: threeDaysAgo,
        resolutionNote: 'Could not locate after thorough search. Please visit the laundry office.',
        notificationLog: { complaintReceived: true, statusUpdated: true, itemFound: false },
        createdAt: fiveDaysAgo,
        updatedAt: threeDaysAgo,
        timeline: [
          { event: 'Complaint filed by student', by: 'student', note: 'Missing red Socks (3 pairs) reported for order DH-1703', timestamp: fiveDaysAgo },
          { event: 'Status changed to Under Review', by: 'Dhobi Ram', note: 'Will check all areas', timestamp: new Date(fiveDaysAgo.getTime() + 12 * 3600 * 1000) },
          { event: 'Item marked as Not Found', by: 'Dhobi Ram', note: 'Checked all racks, sorting area, and dryer lint traps.', timestamp: threeDaysAgo },
        ]
      },
      {
        studentId: studentUid,
        studentName: 'Demo Student',
        studentPhone: '+919876543210',
        studentRoom: 'A-101',
        hostelBlock: 'Block A',
        relatedOrderId: 'demo-order-5',
        relatedTokenId: 'DH-1520',
        collectionDate: fiveDaysAgo,
        itemType: 'Kurta',
        itemColor: 'Navy',
        itemBrand: 'FabIndia',
        itemDescription: 'Navy blue cotton kurta with Chikankari embroidery, size M.',
        itemPhoto: null,
        quantity: 1,
        status: 'closed',
        priority: 'high',
        assignedDhobiId: staffUid,
        staffNotes: 'High-value item, prioritized search',
        foundLocation: 'Sorting pile area',
        resolvedAt: threeDaysAgo,
        resolutionNote: 'Item was found and collected by student.',
        notificationLog: { complaintReceived: true, statusUpdated: true, itemFound: true },
        createdAt: fiveDaysAgo,
        updatedAt: twoDaysAgo,
        timeline: [
          { event: 'Complaint filed by student', by: 'student', note: 'Missing navy Kurta reported for order DH-1520', timestamp: fiveDaysAgo },
          { event: 'Item found at Sorting pile area', by: 'Dhobi Ram', note: 'Kurta was misplaced in Block B laundry batch', timestamp: threeDaysAgo },
          { event: 'Student confirmed collection', by: 'student', note: 'Item picked up from laundry counter.', timestamp: twoDaysAgo },
        ]
      },
    ];

    // Write each complaint + timeline sub-collection
    for (const item of lostItems) {
      const { timeline, ...complaintData } = item;
      const complaintRef = doc(collection(db, 'lostAndFound'));
      await setDoc(complaintRef, complaintData);

      // Seed timeline events
      for (const event of timeline) {
        await addDoc(collection(db, 'lostAndFound', complaintRef.id, 'timeline'), event);
      }
    }

    // ────────────────────────────────────────
    // 7. General Complaints & Feedback Seed Data
    // ────────────────────────────────────────
    const generalSubmissions = [
      {
        type: 'complaint',
        studentId: studentUid,
        studentName: 'Demo Student',
        studentPhone: '+919876543210',
        studentRoom: 'A-101',
        hostelBlock: 'Block A',
        category: 'Delivery / Pickup Issue',
        serviceType: 'freeLaundry',
        relatedOrderId: 'demo-order-1',
        relatedTokenId: 'DH-2047',
        againstStaffId: null,
        title: 'Delayed pickup for 2 days',
        description: 'The guy never showed up for my scheduled pickup.',
        rating: null,
        status: 'submitted',
        priority: 'medium',
        isAnonymous: false,
        createdAt: dayAgo,
        updatedAt: dayAgo,
        notificationLog: {}
      },
      {
        type: 'complaint',
        studentId: studentUid,
        studentName: 'Demo Student',
        studentPhone: '+919876543210',
        studentRoom: 'A-101',
        hostelBlock: 'Block A',
        category: 'Staff Behavior',
        serviceType: 'paidLaundry',
        relatedOrderId: null,
        relatedTokenId: null,
        againstStaffId: staffUid,
        title: 'Rude response when asked for bag',
        description: 'Told me to find it myself.',
        rating: null,
        status: 'escalatedToAdmin',
        priority: 'urgent',
        isEscalated: true,
        isAnonymous: true,
        createdAt: fiveDaysAgo,
        updatedAt: twoDaysAgo,
        notificationLog: {}
      },
      {
        type: 'feedback',
        studentId: studentUid,
        studentName: 'Demo Student',
        studentPhone: '+919876543210',
        studentRoom: 'A-101',
        hostelBlock: 'Block A',
        category: 'Pricing Feedback',
        serviceType: 'paidLaundry',
        relatedOrderId: null,
        title: 'Great prices on dry cleaning',
        description: 'Loved the service.',
        rating: 5,
        status: 'closed',
        priority: 'low',
        isAnonymous: false,
        createdAt: threeDaysAgo,
        updatedAt: threeDaysAgo,
        notificationLog: {}
      }
    ];

    for (const item of generalSubmissions) {
      await addDoc(collection(db, 'complaints'), item);
    }

    toast.success('Database seeded successfully!');
  } catch (error) {
    console.error('Error seeding data:', error);
    toast.error('Failed to seed database');
  }
};
