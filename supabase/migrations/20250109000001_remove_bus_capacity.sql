/*
  # Remove Capacity Column from Buses Table
  
  This migration removes the capacity column from the buses table since
  capacity is now only managed through the bus_availability table.
*/

-- Remove the capacity column from buses table
ALTER TABLE buses DROP COLUMN IF EXISTS capacity;

-- Update the updated_at timestamp
UPDATE buses SET updated_at = NOW(); 