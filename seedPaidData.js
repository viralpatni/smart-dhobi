const admin = require("firebase-admin");

// Note: Ensure you have your serviceAccountKey.json in this directory 
// or use GOOGLE_APPLICATION_CREDENTIALS before running.
// You can also run this script via emulator if preferred.

admin.initializeApp({
  // replace with your projectId if testing locally without credentials
  projectId: "smartdhobi-demo-project" 
});

const db = admin.firestore();

const seedPaidPricing = async () => {
  const items = [
    { itemName: "Formal Shirt", category: "Topwear", pricePerPiece: 25, unit: "per piece", isAvailable: true, iconEmoji: "👕", displayOrder: 1 },
    { itemName: "T-Shirt", category: "Topwear", pricePerPiece: 20, unit: "per piece", isAvailable: true, iconEmoji: "🎽", displayOrder: 2 },
    { itemName: "Trousers / Jeans", category: "Bottomwear", pricePerPiece: 35, unit: "per piece", isAvailable: true, iconEmoji: "👖", displayOrder: 3 },
    { itemName: "Shorts", category: "Bottomwear", pricePerPiece: 20, unit: "per piece", isAvailable: true, iconEmoji: "🩳", displayOrder: 4 },
    { itemName: "Bedsheet (Single)", category: "Bedding", pricePerPiece: 40, unit: "per piece", isAvailable: true, iconEmoji: "🛏️", displayOrder: 5 },
    { itemName: "Sweater / Hoodie", category: "Topwear", pricePerPiece: 50, unit: "per piece", isAvailable: true, iconEmoji: "🧥", displayOrder: 6 }
  ];

  let count = 0;
  for (const item of items) {
    await db.collection("paidPricing").add({
      ...item,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastUpdatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    count++;
  }
  console.log(`Seeded ${count} paid pricing items.`);
};

// Assuming you've already created the paidStaff user via the login demo button, 
// there is no strict need to seed the staff profile here, but we can seed pricing.
seedPaidPricing().then(() => {
  console.log("Seeding complete.");
  process.exit(0);
}).catch(e => {
  console.error("Seeding failed:", e);
  process.exit(1);
});
