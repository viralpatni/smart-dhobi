-- SmartDhobi: Firebase → Supabase Migration Schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New Query)

-- ============================================================
-- 1. PROFILES (replaces Firestore 'users' collection)
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT DEFAULT '',
  role TEXT NOT NULL CHECK (role IN ('student', 'staff', 'admin', 'paidStaff')),
  unique_id TEXT DEFAULT '',
  hostel_block TEXT DEFAULT '',
  room_no TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Public profiles readable" ON profiles FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================================
-- 2. ORDERS (free laundry orders)
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id TEXT NOT NULL,
  student_id UUID REFERENCES profiles(id),
  student_name TEXT DEFAULT '',
  student_room TEXT DEFAULT '',
  hostel_block TEXT DEFAULT '',
  clothes_count INTEGER DEFAULT 0,
  items JSONB DEFAULT '[]',
  status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting','washing','ready','collected','cancelled')),
  rack_number TEXT DEFAULT '',
  missing_items JSONB DEFAULT '[]',
  on_my_way BOOLEAN DEFAULT false,
  on_my_way_at TIMESTAMPTZ,
  collected_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_orders_student ON orders(student_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Orders readable by all authenticated" ON orders FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Orders insertable by authenticated" ON orders FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Orders updatable by authenticated" ON orders FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Orders deletable by authenticated" ON orders FOR DELETE USING (auth.role() = 'authenticated');

-- ============================================================
-- 3. PAID_ORDERS
-- ============================================================
CREATE TABLE IF NOT EXISTS paid_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id TEXT NOT NULL,
  student_id UUID REFERENCES profiles(id),
  student_name TEXT DEFAULT '',
  student_room TEXT DEFAULT '',
  student_phone TEXT DEFAULT '',
  hostel_block TEXT DEFAULT '',
  schedule_id TEXT DEFAULT '',
  items JSONB DEFAULT '[]',
  total_amount NUMERIC DEFAULT 0,
  actual_items_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'scheduled',
  payment_status TEXT DEFAULT 'pending',
  payment_collected_at TIMESTAMPTZ,
  staff_notes TEXT DEFAULT '',
  pickup_notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_paid_orders_student ON paid_orders(student_id);
CREATE INDEX idx_paid_orders_status ON paid_orders(status);
CREATE INDEX idx_paid_orders_created ON paid_orders(created_at DESC);

ALTER TABLE paid_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Paid orders readable by authenticated" ON paid_orders FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Paid orders insertable by authenticated" ON paid_orders FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Paid orders updatable by authenticated" ON paid_orders FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Paid orders deletable by authenticated" ON paid_orders FOR DELETE USING (auth.role() = 'authenticated');

-- ============================================================
-- 4. ANALYTICS (daily analytics)
-- ============================================================
CREATE TABLE IF NOT EXISTS analytics (
  id TEXT PRIMARY KEY,  -- date string like '2026-04-04'
  total_drop_offs INTEGER DEFAULT 0,
  total_washed INTEGER DEFAULT 0,
  total_collected INTEGER DEFAULT 0,
  total_items_processed INTEGER DEFAULT 0,
  peak_hour TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Analytics readable by authenticated" ON analytics FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Analytics insertable by authenticated" ON analytics FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Analytics updatable by authenticated" ON analytics FOR UPDATE USING (auth.role() = 'authenticated');

-- ============================================================
-- 5. NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(user_id, read);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Notifications insertable by authenticated" ON notifications FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================
-- 6. MONTHLY_SCHEDULES
-- ============================================================
CREATE TABLE IF NOT EXISTS monthly_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  hostel_block TEXT NOT NULL,
  schedule_data JSONB DEFAULT '{}',
  room_range TEXT DEFAULT '',
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE monthly_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Schedules readable by authenticated" ON monthly_schedules FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Schedules insertable by authenticated" ON monthly_schedules FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Schedules updatable by authenticated" ON monthly_schedules FOR UPDATE USING (auth.role() = 'authenticated');

-- ============================================================
-- 7. RACKS
-- ============================================================
CREATE TABLE IF NOT EXISTS racks (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  capacity INTEGER DEFAULT 20,
  current_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE racks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Racks readable by authenticated" ON racks FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Racks insertable by authenticated" ON racks FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Racks updatable by authenticated" ON racks FOR UPDATE USING (auth.role() = 'authenticated');

-- ============================================================
-- 8. PAID_PRICING
-- ============================================================
CREATE TABLE IF NOT EXISTS paid_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_name TEXT NOT NULL,
  category TEXT DEFAULT '',
  price_per_piece NUMERIC DEFAULT 0,
  unit TEXT DEFAULT 'piece',
  icon_emoji TEXT DEFAULT '👕',
  is_available BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  last_updated_by UUID REFERENCES profiles(id),
  last_updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE paid_pricing ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Pricing readable by authenticated" ON paid_pricing FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Pricing insertable by authenticated" ON paid_pricing FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Pricing updatable by authenticated" ON paid_pricing FOR UPDATE USING (auth.role() = 'authenticated');

-- ============================================================
-- 9. PAID_SCHEDULES
-- ============================================================
CREATE TABLE IF NOT EXISTS paid_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_label TEXT DEFAULT '',
  pickup_day TEXT DEFAULT '',
  pickup_date TEXT DEFAULT '',
  pickup_time_slot TEXT DEFAULT '',
  delivery_date TEXT DEFAULT '',
  delivery_time_slot TEXT DEFAULT '',
  hostel_blocks JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE paid_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Paid schedules readable by authenticated" ON paid_schedules FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Paid schedules insertable by authenticated" ON paid_schedules FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Paid schedules updatable by authenticated" ON paid_schedules FOR UPDATE USING (auth.role() = 'authenticated');

-- ============================================================
-- 10. COMPLAINTS
-- ============================================================
CREATE TABLE IF NOT EXISTS complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT DEFAULT 'complaint' CHECK (type IN ('complaint', 'feedback')),
  student_id UUID REFERENCES profiles(id),
  student_name TEXT DEFAULT '',
  student_phone TEXT DEFAULT '',
  student_room TEXT DEFAULT '',
  hostel_block TEXT DEFAULT '',
  title TEXT DEFAULT '',
  description TEXT DEFAULT '',
  category TEXT DEFAULT '',
  service_type TEXT DEFAULT 'freeLaundry',
  related_token_id TEXT DEFAULT '',
  suggested_solution TEXT DEFAULT '',
  attachment_url TEXT DEFAULT '',
  is_anonymous BOOLEAN DEFAULT false,
  against_staff_id TEXT DEFAULT '',
  against_staff_name TEXT DEFAULT '',
  against_staff_role TEXT DEFAULT '',
  status TEXT DEFAULT 'submitted',
  priority TEXT DEFAULT 'medium',
  rating INTEGER,
  staff_response TEXT DEFAULT '',
  resolution_summary TEXT DEFAULT '',
  staff_responded_at TIMESTAMPTZ,
  staff_responded_by UUID,
  admin_response TEXT DEFAULT '',
  admin_responded_at TIMESTAMPTZ,
  admin_responded_by UUID,
  is_escalated BOOLEAN DEFAULT false,
  escalated_at TIMESTAMPTZ,
  student_satisfied BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_complaints_student ON complaints(student_id);
CREATE INDEX idx_complaints_status ON complaints(status);
CREATE INDEX idx_complaints_created ON complaints(created_at DESC);

ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Complaints readable by authenticated" ON complaints FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Complaints insertable by authenticated" ON complaints FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Complaints updatable by authenticated" ON complaints FOR UPDATE USING (auth.role() = 'authenticated');

-- ============================================================
-- 11. COMPLAINT_THREADS (replaces complaints/{id}/thread subcollection)
-- ============================================================
CREATE TABLE IF NOT EXISTS complaint_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id UUID REFERENCES complaints(id) ON DELETE CASCADE,
  author_id UUID REFERENCES profiles(id),
  author_name TEXT DEFAULT '',
  author_role TEXT DEFAULT '',
  message TEXT DEFAULT '',
  is_internal BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_threads_complaint ON complaint_threads(complaint_id);

ALTER TABLE complaint_threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Threads readable by authenticated" ON complaint_threads FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Threads insertable by authenticated" ON complaint_threads FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ============================================================
-- 12. LOST_AND_FOUND
-- ============================================================
CREATE TABLE IF NOT EXISTS lost_and_found (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES profiles(id),
  student_name TEXT DEFAULT '',
  student_phone TEXT DEFAULT '',
  student_room TEXT DEFAULT '',
  hostel_block TEXT DEFAULT '',
  related_order_id TEXT DEFAULT '',
  related_token_id TEXT DEFAULT '',
  collection_date TIMESTAMPTZ,
  item_type TEXT DEFAULT '',
  item_color TEXT DEFAULT '',
  item_brand TEXT DEFAULT '',
  item_description TEXT DEFAULT '',
  item_photo TEXT DEFAULT '',
  quantity INTEGER DEFAULT 1,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'underReview', 'found', 'notFound', 'closed')),
  priority TEXT DEFAULT 'medium',
  assigned_dhobi_id TEXT DEFAULT '',
  staff_notes TEXT DEFAULT '',
  found_location TEXT DEFAULT '',
  resolved_at TIMESTAMPTZ,
  resolution_note TEXT DEFAULT '',
  notification_log JSONB DEFAULT '{"complaintReceived": true, "statusUpdated": false, "itemFound": false}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_laf_student ON lost_and_found(student_id);
CREATE INDEX idx_laf_status ON lost_and_found(status);

ALTER TABLE lost_and_found ENABLE ROW LEVEL SECURITY;
CREATE POLICY "LAF readable by authenticated" ON lost_and_found FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "LAF insertable by authenticated" ON lost_and_found FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "LAF updatable by authenticated" ON lost_and_found FOR UPDATE USING (auth.role() = 'authenticated');

-- ============================================================
-- 13. LOST_AND_FOUND_TIMELINE (replaces lostAndFound/{id}/timeline)
-- ============================================================
CREATE TABLE IF NOT EXISTS lost_and_found_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id UUID REFERENCES lost_and_found(id) ON DELETE CASCADE,
  event TEXT DEFAULT '',
  by TEXT DEFAULT '',
  note TEXT DEFAULT '',
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_laf_timeline ON lost_and_found_timeline(complaint_id);

ALTER TABLE lost_and_found_timeline ENABLE ROW LEVEL SECURITY;
CREATE POLICY "LAF timeline readable by authenticated" ON lost_and_found_timeline FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "LAF timeline insertable by authenticated" ON lost_and_found_timeline FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ============================================================
-- 14. COMPLAINT_ANALYTICS
-- ============================================================
CREATE TABLE IF NOT EXISTS complaint_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  month TEXT NOT NULL,
  total_complaints INTEGER DEFAULT 0,
  total_feedback INTEGER DEFAULT 0,
  category_breakdown JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE complaint_analytics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Complaint analytics readable by authenticated" ON complaint_analytics FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Complaint analytics insertable by authenticated" ON complaint_analytics FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Complaint analytics updatable by authenticated" ON complaint_analytics FOR UPDATE USING (auth.role() = 'authenticated');

-- ============================================================
-- ENABLE REALTIME on key tables
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE paid_orders;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE complaints;
ALTER PUBLICATION supabase_realtime ADD TABLE complaint_threads;
ALTER PUBLICATION supabase_realtime ADD TABLE lost_and_found;
ALTER PUBLICATION supabase_realtime ADD TABLE lost_and_found_timeline;
ALTER PUBLICATION supabase_realtime ADD TABLE analytics;
ALTER PUBLICATION supabase_realtime ADD TABLE paid_pricing;
ALTER PUBLICATION supabase_realtime ADD TABLE paid_schedules;
ALTER PUBLICATION supabase_realtime ADD TABLE monthly_schedules;

-- ============================================================
-- STORAGE BUCKET for attachments
-- ============================================================
INSERT INTO storage.buckets (id, name, public) VALUES ('attachments', 'attachments', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'attachments' AND auth.role() = 'authenticated');

CREATE POLICY "Public read access" ON storage.objects
FOR SELECT USING (bucket_id = 'attachments');
