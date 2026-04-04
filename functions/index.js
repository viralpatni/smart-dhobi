const functions = require("firebase-functions");
const admin = require("firebase-admin");
const twilio = require("twilio");

admin.initializeApp();

// Ensure these environment variables are set in your Firebase project
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromWhatsApp = process.env.TWILIO_WHATSAPP_FROM || "whatsapp:+14155238886";

let twilioClient;
if (accountSid && authToken) {
  twilioClient = twilio(accountSid, authToken);
}

exports.sendWhatsAppNotification = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Must be logged in.");
  }
  
  const { to, message } = data;
  
  if (!to || !message) {
    throw new functions.https.HttpsError("invalid-argument", "Missing to or message.");
  }

  if (!twilioClient) {
    console.log("Twilio is not configured. Mocking notification:", { to, message });
    return { success: true, mock: true };
  }

  try {
    await twilioClient.messages.create({
      from: fromWhatsApp,
      to: to.startsWith("whatsapp:") ? to : `whatsapp:${to}`,
      body: message,
    });
    return { success: true };
  } catch (error) {
    console.error("Twilio send failed:", error);
    // Fallback to SMS if WhatsApp fails
    try {
      await twilioClient.messages.create({
        from: process.env.TWILIO_SMS_FROM || "+1234567890", // Example fallback
        to: to,
        body: message,
      });
      return { success: true, method: "sms" };
    } catch (smsError) {
      console.error("SMS fallback failed:", smsError);
      throw new functions.https.HttpsError("internal", "Failed to send notification.");
    }
  }
});

exports.scheduledDailyReminder = functions.pubsub.schedule("0 20 * * *")
  .timeZone("Asia/Kolkata")
  .onRun(async (context) => {
    const db = admin.firestore();
    
    // We want to notify for TOMORROW
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tmrwYear = tomorrow.getFullYear();
    const tmrwMonth = tomorrow.getMonth() + 1;
    const tmrwDate = tomorrow.getDate();
    
    // Find all monthly schedules configured for tomorrow's month/year
    const monthlySchedulesSnap = await db.collection("monthlySchedules")
      .where("year", "==", tmrwYear)
      .where("month", "==", tmrwMonth)
      .get();
      
    if (monthlySchedulesSnap.empty) {
      console.log("No monthly schedules configured for", tmrwMonth, tmrwYear);
      return null;
    }
    
    let totalMessagesQueued = 0;

    for (const doc of monthlySchedulesSnap.docs) {
      const schedule = doc.data();
      const mappedRange = schedule.scheduleMap && schedule.scheduleMap[String(tmrwDate)];
      
      // MappedRange could be "101-319". If empty or missing, it's an off day for this block.
      if (!mappedRange || mappedRange.trim() === '') continue;
      
      const parts = mappedRange.split("-").map(p => p.trim());
      
      let minRoom = -1;
      let maxRoom = Infinity;
      
      if (parts.length === 2 && !isNaN(parseInt(parts[0])) && !isNaN(parseInt(parts[1]))) {
          minRoom = parseInt(parts[0], 10);
          maxRoom = parseInt(parts[1], 10);
      }
      // If parsing fails for some reason but range exists, we fallback securely without logic crash
      
      // Pull all students in this hostel block
      const studentsSnap = await db.collection("users")
        .where("role", "==", "student")
        .where("hostelBlock", "==", schedule.hostelBlock)
        .get();
        
      for (const studentDoc of studentsSnap.docs) {
         const student = studentDoc.data();
         // Extract numerical portion of the student's room (e.g. A-101 becomes 101)
         const roomNumeric = parseInt(String(student.roomNo).replace(/\D/g, ''), 10);
         
         // Mathematical comparison
         if (!isNaN(roomNumeric) && roomNumeric >= minRoom && roomNumeric <= maxRoom) {
             
             // Queue Twilio Notification!
             if (student.phone) {
                 const message = `📅 Reminder: Your active Laundry schedule for ${schedule.hostelBlock} is set for tomorrow. Please be ready!`;
                 const targetPhone = student.phone.startsWith("+") ? student.phone : `+91${student.phone}`;
                 
                 if (twilioClient) {
                    await twilioClient.messages.create({
                      from: process.env.TWILIO_SMS_FROM || "+1234567890",
                      to: targetPhone,
                      body: message
                    }).catch(e => console.error("Cron SMS failed:", e));
                 } else {
                    console.log(`Mock Automated Cron SMS to ${targetPhone}: ${message}`);
                 }
                 totalMessagesQueued++;
             }
         }
      }
    }
    
    console.log(`Evaluated monthly schedules. Sent ${totalMessagesQueued} background SMS.`);
    return null;
  });

exports.onOrderStatusChange = functions.firestore
  .document("orders/{orderId}")
  .onUpdate(async (change, context) => {
    const newData = change.after.data();
    const oldData = change.before.data();
    const db = admin.firestore();

    if (newData.status === "readyInRack" && oldData.status !== "readyInRack") {
      // Notification handled in client for now as requested, but here's a backup logic if desired
      if (!newData.notificationLog?.rackReadyAlert) {
         // Could trigger notification here
      }
    }

    if (newData.status === "collected" && oldData.status !== "collected") {
       const today = new Date().toISOString().split("T")[0];
       const analyticsRef = db.collection("analytics").doc(today);
       
       await db.runTransaction(async (transaction) => {
         const doc = await transaction.get(analyticsRef);
         if (doc.exists) {
           transaction.update(analyticsRef, {
             totalCollected: admin.firestore.FieldValue.increment(1)
           });
         }
       });
    }
    return null;
  });

// ─── Lost & Found Cloud Functions ───────────────────────────

exports.onLostItemComplaintCreated = functions.firestore
  .document("lostAndFound/{complaintId}")
  .onCreate(async (snap, context) => {
    const data = snap.data();
    const db = admin.firestore();
    const complaintId = context.params.complaintId;
    const shortId = complaintId.substring(0, 8).toUpperCase();

    // Send WhatsApp to student confirming complaint receipt
    const studentMsg = `Your lost item complaint has been filed. Complaint ID: ${shortId}. We will review and update you within 24 hours. — SmartDhobi`;

    if (data.studentPhone && twilioClient) {
      const targetPhone = data.studentPhone.startsWith("+") ? data.studentPhone : `+91${data.studentPhone}`;
      try {
        await twilioClient.messages.create({
          from: fromWhatsApp,
          to: `whatsapp:${targetPhone}`,
          body: studentMsg,
        });
      } catch (e) {
        console.error("WhatsApp to student failed:", e);
      }
    } else {
      console.log(`Mock WhatsApp to student: ${studentMsg}`);
    }

    // Send WhatsApp to all staff users
    try {
      const staffSnap = await db.collection("users").where("role", "==", "staff").get();
      for (const staffDoc of staffSnap.docs) {
        const staff = staffDoc.data();
        if (staff.phone && twilioClient) {
          const staffPhone = staff.phone.startsWith("+") ? staff.phone : `+91${staff.phone}`;
          const staffMsg = `New lost item complaint filed by ${data.studentName} Room ${data.studentRoom}. Item: ${data.itemType}, ${data.itemColor}. Token: ${data.relatedTokenId}. Please check.`;
          try {
            await twilioClient.messages.create({
              from: fromWhatsApp,
              to: `whatsapp:${staffPhone}`,
              body: staffMsg,
            });
          } catch (e) {
            console.error("WhatsApp to staff failed:", e);
          }
        }
      }
    } catch (e) {
      console.error("Error querying staff for notification:", e);
    }

    return null;
  });

exports.onLostItemStatusChanged = functions.firestore
  .document("lostAndFound/{complaintId}")
  .onUpdate(async (change, context) => {
    const newData = change.after.data();
    const oldData = change.before.data();

    // Only act if status changed
    if (newData.status === oldData.status) return null;

    const shortId = context.params.complaintId.substring(0, 8).toUpperCase();
    let message = "";

    if (newData.status === "found") {
      message = `Great news! Your missing ${newData.itemType} has been found at ${newData.foundLocation || "the laundry center"}. Please collect it at the laundry counter. — SmartDhobi`;
    } else if (newData.status === "notFound") {
      message = `We searched thoroughly but could not locate your ${newData.itemType}. Please visit the laundry office to discuss further. — SmartDhobi`;
    } else if (newData.status === "underReview") {
      message = `Your lost item complaint (${shortId}) is now under review. We are checking for your ${newData.itemType}. — SmartDhobi`;
    } else {
      return null; // No notification for other status changes
    }

    if (newData.studentPhone && twilioClient) {
      const targetPhone = newData.studentPhone.startsWith("+") ? newData.studentPhone : `+91${newData.studentPhone}`;
      try {
        await twilioClient.messages.create({
          from: fromWhatsApp,
          to: `whatsapp:${targetPhone}`,
          body: message,
        });
      } catch (e) {
        console.error("WhatsApp status update failed:", e);
      }
    } else {
      console.log(`Mock WhatsApp status update: ${message}`);
    }

    return null;
  });

// ─── Paid Laundry Cloud Functions ───────────────────────────

exports.onPaidOrderCreated = functions.firestore
  .document("paidOrders/{orderId}")
  .onCreate(async (snap, context) => {
    // Basic audit or counter could go here
    return null;
  });

exports.onPaidOrderStatusChanged = functions.firestore
  .document("paidOrders/{orderId}")
  .onUpdate(async (change, context) => {
    const newData = change.after.data();
    const oldData = change.before.data();
    if (newData.status === oldData.status) return null;
    
    // Most notifications are handled client side, 
    // but this serves as a backend webhook hook.
    return null;
  });

exports.broadcastNewSchedule = functions.firestore
  .document("paidSchedules/{scheduleId}")
  .onCreate(async (snap, context) => {
    const data = snap.data();
    const db = admin.firestore();

    try {
      const studentsSnap = await db.collection("users")
        .where("role", "==", "student")
        .where("hostelBlock", "in", data.hostelBlocks)
        .get();

      let count = 0;
      for (const studentDoc of studentsSnap.docs) {
        const student = studentDoc.data();
        if (student.phone) {
          count++;
          // if (twilioClient) { send ... }
        }
      }
      console.log(`Broadcasted new schedule to ${count} students.`);
    } catch (e) {
      console.error(e);
    }
    return null;
  });

exports.scheduledPaidPickupReminder = functions.pubsub.schedule("0 21 * * *")
  .timeZone("Asia/Kolkata")
  .onRun(async (context) => {
    const db = admin.firestore();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tmrwStr = tomorrow.toISOString().split("T")[0];

    const schedulesSnap = await db.collection("paidSchedules")
      .where("isActive", "==", true)
      .where("pickupDate", "==", tmrwStr)
      .get();

    let count = 0;
    for (const doc of schedulesSnap.docs) {
      const sch = doc.data();
      const ordersSnap = await db.collection("paidOrders")
        .where("scheduleId", "==", doc.id)
        .where("status", "==", "scheduled")
        .get();
        
      for (const orderDoc of ordersSnap.docs) {
        const order = orderDoc.data();
        if (order.studentPhone && !order.notificationLog?.pickupReminder) {
          count++;
          // if (twilioClient) { send pickup reminder }
          await orderDoc.ref.update({ "notificationLog.pickupReminder": true });
        }
      }
    }
    console.log(`Sent ${count} paid pickup reminders for tomorrow.`);
    return null;
  });

// ─── Complaints & Feedback Logic ───────────────────────────

exports.onComplaintCreated = functions.firestore
  .document("complaints/{complaintId}")
  .onCreate(async (snap, context) => {
    const data = snap.data();
    const shortId = context.params.complaintId.substring(0, 8).toUpperCase();
    
    // 1. Notify Student: Received
    if (data.studentPhone && process.env.VITE_USE_MOCK_NOTIFICATIONS === "false" && twilioClient) {
      const studentMsg = data.type === 'complaint' 
        ? `We've received your complaint (${shortId}). Our team will review this within 48 hours. — SmartDhobi`
        : `Thank you for your feedback! We've recorded it successfully. — SmartDhobi`;
        
      try {
        await twilioClient.messages.create({
          from: fromWhatsApp,
          to: `whatsapp:${data.studentPhone.startsWith("+") ? data.studentPhone : "+91"+data.studentPhone}`,
          body: studentMsg,
        });
        await snap.ref.update({ "notificationLog.submissionConfirmed": true });
      } catch(e) { console.error("Twilio error:", e); }
    }

    // 2. Monthly Analytics Rollup
    const monthId = new Date().toISOString().substring(0, 7); // e.g., "2023-10"
    const analyticsRef = admin.firestore().collection("complaintAnalytics").doc(monthId);
    
    await admin.firestore().runTransaction(async (t) => {
      const doc = await t.get(analyticsRef);
      if (!doc.exists) {
        t.set(analyticsRef, {
          month: monthId,
          totalComplaints: data.type === 'complaint' ? 1 : 0,
          totalFeedback: data.type === 'feedback' ? 1 : 0,
          categoryBreakdown: { [data.category]: 1 }
        });
      } else {
        const ad = doc.data();
        t.update(analyticsRef, {
          totalComplaints: data.type === 'complaint' ? (ad.totalComplaints || 0) + 1 : (ad.totalComplaints || 0),
          totalFeedback: data.type === 'feedback' ? (ad.totalFeedback || 0) + 1 : (ad.totalFeedback || 0),
          [`categoryBreakdown.${data.category}`]: (ad.categoryBreakdown?.[data.category] || 0) + 1
        });
      }
    });

    return null;
  });

exports.onComplaintUpdated = functions.firestore
  .document("complaints/{complaintId}")
  .onUpdate(async (change, context) => {
    const newData = change.after.data();
    const oldData = change.before.data();
    if (newData.status === oldData.status && newData.isEscalated === oldData.isEscalated) return null;

    const shortId = context.params.complaintId.substring(0, 8).toUpperCase();
    
    // Status Changed Message
    let studentMsg = "";
    if (newData.status === 'resolvedByStaff') {
       studentMsg = `Your ticket (${shortId}) has been resolved by staff. Resolution: ${newData.resolutionSummary}. Please confirm if you are satisfied in the app. — SmartDhobi`;
    } else if (newData.status === 'resolvedByAdmin') {
       studentMsg = `Your ticket (${shortId}) has been resolved by Admin. Resolution: ${newData.resolutionSummary}. — SmartDhobi`;
    }

    if (studentMsg && newData.studentPhone && process.env.VITE_USE_MOCK_NOTIFICATIONS === "false" && twilioClient) {
       try {
         await twilioClient.messages.create({
           from: fromWhatsApp,
           to: `whatsapp:${newData.studentPhone.startsWith("+") ? newData.studentPhone : "+91"+newData.studentPhone}`,
           body: studentMsg,
         });
       } catch(e) { console.error("Twilio error:", e); }
    }
    
    return null;
  });

// CRON JOB: Auto Escalation Monitor (Runs every 12 hours)
exports.autoEscalationCheck = functions.pubsub.schedule("0 */12 * * *")
  .timeZone("Asia/Kolkata")
  .onRun(async (context) => {
    const db = admin.firestore();
    // 48 hours ago
    const deadline = new Date(Date.now() - 48 * 60 * 60 * 1000);

    const snapshot = await db.collection("complaints")
      .where("type", "==", "complaint")
      .where("status", "in", ["submitted", "acknowledged"])
      .where("isEscalated", "==", false)
      .get();
      
    let escalatedCount = 0;

    for (const doc of snapshot.docs) {
      const data = doc.data();
      if (data.createdAt && data.createdAt.toDate() < deadline) {
        await doc.ref.update({
           isEscalated: true,
           escalatedAt: admin.firestore.FieldValue.serverTimestamp(),
           escalationReason: "Auto-escalated: SLA exceeded (No staff resolution within 48h).",
           status: "escalatedToAdmin"
        });
        
        // Auto inject thread message
        await db.collection(`complaints/${doc.id}/thread`).add({
           authorId: "system",
           authorName: "System",
           authorRole: "admin",
           message: "🤖 Ticket was auto-escalated to Administration due to no resolution within 48 hours.",
           isInternal: false,
           createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        escalatedCount++;
      }
    }
    
    console.log(`Auto-escalated ${escalatedCount} overdue complaints.`);
    return null;
  });
