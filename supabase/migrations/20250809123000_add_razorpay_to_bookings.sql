/*
  # Add Razorpay fields to bookings
*/

ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS razorpay_payment_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS razorpay_order_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS razorpay_signature VARCHAR(512);

CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at); 