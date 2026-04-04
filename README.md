# SmartDhobi — Campus Laundry Management System

SmartDhobi is a full-stack web application for managing campus laundry operations. Built with React, Firebase (Firestore, Auth, Storage, Cloud Functions), and Tailwind CSS.

## Features

### 🧺 Student Dashboard
- View laundry schedule, active orders, and live status tracking
- QR code for drop-off identification
- "I'm On My Way" one-tap notification to staff
- Order history with missing item detection

### 🔧 Dhobi Staff Dashboard
- Kanban board for managing laundry orders
- QR scanner to receive student drop-offs
- Schedule uploader for monthly laundry timetables
- Analytics panel with daily metrics

### 🔍 Lost & Found Feature
A complete lost item complaint system integrated into both student and staff interfaces.

**Student Side** (`/student/lost-and-found`):
- **File Complaint**: 3-step wizard to link a collected order, describe the missing item (type, color, brand, quantity, description), and optionally upload a photo
- **Track Complaints**: Real-time status updates via Firestore `onSnapshot` — see status changes instantly
- **Status badges**: Open → Under Review → Found / Not Found → Closed
- **Mark as Collected**: When staff marks an item as found, students can confirm collection

**Staff Side** (`/dhobi/lost-and-found`):
- **Dashboard Stats**: Open complaints, under review, found today, closed this week
- **Filter & Search**: Filter by status, search by student name/token/item type, sort by date or priority
- **Complaint Management**: Start review, set priority, add staff notes, mark as found/not found
- **Found/Not Found Modals**: Enter location and message to student, triggers notifications
- **Timeline View**: Full event timeline per complaint showing all actions taken

**Notifications** (Mock mode for demo):
- When `VITE_USE_MOCK_NOTIFICATIONS=true`: notifications appear as toast messages and console logs
- In production: Twilio WhatsApp via Cloud Functions for complaint filed, status updates, and item found

**Firestore Collections**:
- `lostAndFound/{complaintId}` — main complaint documents
- `lostAndFound/{complaintId}/timeline/{eventId}` — event timeline sub-collection

**Required Firestore Indexes**:
- `lostAndFound`: (studentId ASC, createdAt DESC)
- `lostAndFound`: (status ASC, createdAt DESC)

### 🔔 Notifications
- Real-time in-app notifications via Firestore listeners
- WhatsApp notifications via Twilio Cloud Functions
- Mock mode for development/demo without Twilio credentials

## Tech Stack

- **Frontend**: React 19, React Router 7, Tailwind CSS 3, Recharts
- **Backend**: Firebase (Firestore, Auth, Storage, Cloud Functions)
- **Notifications**: Twilio WhatsApp API (with mock mode)
- **Build Tool**: Vite 8

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

## Environment Variables

Create a `.env` file with:
```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_USE_MOCK_NOTIFICATIONS=true
```

## Demo Accounts

| Role    | Email                    | Password |
|---------|--------------------------|----------|
| Student | student@smartdhobi.com   | demo1234 |
| Staff   | dhobi@smartdhobi.com     | demo1234 |
| Admin   | admin@smartdhobi.com     | demo1234 |

## Seed Data

The app includes a `seedFirestore()` function in `src/utils/seedData.js` that populates:
- 20 racks
- Demo analytics data
- Demo schedule
- Demo order
- 5 Lost & Found complaints (one in each status) with timeline events
