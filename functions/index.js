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
