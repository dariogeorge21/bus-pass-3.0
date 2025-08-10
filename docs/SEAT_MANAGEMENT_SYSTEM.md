# Seat Management and Booking Tracking System

## Overview

The Seat Management and Booking Tracking System provides comprehensive functionality for managing bus seat availability and tracking booking statistics in the bus booking application.

## Features

### 1. Database Schema Changes

#### Buses Table
- **`total_seats`**: New column to store the fixed maximum capacity for each bus route
- **Default Value**: 50 seats
- **Constraint**: Must be greater than 0

#### Admin Settings Table
- **`current_bookings`**: New column to track the total number of successful bookings since the last reset
- **Default Value**: 0
- **Constraint**: Must be greater than or equal to 0

### 2. Seat Reset Functionality

#### Automatic Reset
- Restores `available_seats` to match `total_seats` for all active buses
- Resets `admin_settings.current_bookings` back to 0
- Uses the `reset_all_bus_seats()` database function

#### Manual Reset
- Available through the admin dashboard "Reset Seating" button
- Requires confirmation before execution
- Provides immediate feedback on success/failure

### 3. Booking Counter Integration

#### Automatic Increment
- Triggers when a new booking is inserted with `payment_status = true`
- Uses database trigger `increment_booking_counter_trigger`
- Only counts successful/paid bookings, not failed or pending payments

#### Counter Reset
- Automatically resets to 0 when seat reset is performed
- Can be manually reset through the seat reset functionality

### 4. Statistics Dashboard

#### Four Key Metrics
1. **Total Buses**: Count of active buses
2. **Total Bookings**: All-time booking count from bookings table
3. **Current Bookings**: From admin_settings.current_bookings
4. **Available Seats**: Sum of available_seats across all buses

#### Real-time Updates
- Statistics refresh automatically when data changes
- Uses the `get_booking_statistics()` database function

## Database Functions

### `reset_all_bus_seats()`
```sql
-- Resets all bus seats to their total capacity and resets booking counter
SELECT reset_all_bus_seats();
```

### `increment_booking_counter()`
```sql
-- Increments the current_bookings counter by 1
SELECT increment_booking_counter();
```

### `get_booking_statistics()`
```sql
-- Returns booking statistics for the dashboard
SELECT * FROM get_booking_statistics();
```

## API Endpoints

### Reset Seats
```
POST /api/admin/reset-seats
```
- Requires admin authentication
- Calls `reset_all_bus_seats()` function
- Returns success/error response

### Get Statistics
```
GET /api/admin/statistics
```
- Requires admin authentication
- Calls `get_booking_statistics()` function
- Returns formatted statistics data

## Admin Dashboard Features

### Statistics Card
- Displays four key metrics in a grid layout
- Color-coded for easy identification
- Real-time data from database functions

### Reset Seating Button
- Positioned under the statistics card
- Orange-themed button with confirmation dialog
- Shows loading state during operation
- Provides success/error feedback

### Bus Management Updates
- Added `total_seats` field to bus creation/editing forms
- Updated bus display cards to show both total and available seats
- Maintains backward compatibility with existing data

## Implementation Details

### Database Migration
The system uses migration file `20250110000000_seat_management_system.sql` which:
- Adds new columns to existing tables
- Creates database functions for seat management
- Sets up triggers for automatic booking counting
- Updates existing data with default values

### Atomic Operations
All database operations are designed to be atomic:
- Seat reset updates both bus availability and booking counter in a single transaction
- Booking counter increment is handled by database triggers
- Statistics are calculated using database functions for consistency

### Concurrent Access
The system handles concurrent access properly:
- Database functions use appropriate locking mechanisms
- Triggers ensure consistent data updates
- API endpoints use proper error handling

## Testing

### Test Script
Run the test script to verify system functionality:
```bash
node scripts/test-seat-management.js
```

The test script checks:
- Database schema changes
- Function availability
- Current data state
- Booking statistics

### Manual Testing
1. **Create a new bus** with total seats
2. **Make a booking** and verify counter increments
3. **Reset seats** and verify availability restoration
4. **Check statistics** update correctly

## Security Considerations

### Admin Authentication
- All seat management operations require admin authentication
- API endpoints use `withAuth` middleware
- Database functions use `SECURITY DEFINER` for proper permissions

### Data Validation
- Input validation on all forms
- Database constraints prevent invalid data
- Error handling for all operations

## Troubleshooting

### Common Issues

#### Functions Not Found
```
Error: Could not find the function public.get_booking_statistics
```
**Solution**: Run `npx supabase db push` to apply the migration

#### Missing Columns
```
Error: column "total_seats" does not exist
```
**Solution**: Check that the migration was applied correctly

#### Counter Not Incrementing
- Verify that bookings have `payment_status = true`
- Check that the trigger is properly installed
- Ensure admin_settings table has a record with id = 1

### Debug Steps
1. Run the test script to identify issues
2. Check database logs for function errors
3. Verify migration status with `npx supabase migration list`
4. Test individual functions in the database console

## Future Enhancements

### Potential Improvements
1. **Scheduled Resets**: Automatic seat reset at specific times
2. **Booking History**: Track booking counter changes over time
3. **Advanced Statistics**: More detailed analytics and reporting
4. **Email Notifications**: Alert admins when seats are running low
5. **Audit Logging**: Track all seat management operations

### Scalability Considerations
- Database functions are optimized for performance
- Statistics are calculated on-demand
- Triggers are lightweight and efficient
- API endpoints use proper caching where appropriate

## Support

For issues or questions about the Seat Management System:
1. Check the troubleshooting section above
2. Review the test script output
3. Verify database migration status
4. Check admin dashboard functionality 