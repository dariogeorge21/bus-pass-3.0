'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageTransition } from '@/components/ui/page-transition';
import { useBooking } from '@/contexts/BookingContext';
import { Ticket, Printer, Plus, Calendar, MapPin, User, CreditCard, Bus } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

export default function TicketPage() {
  const [travelDates, setTravelDates] = useState({ goDate: '', returnDate: '' });
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { bookingData, resetBookingData } = useBooking();

  useEffect(() => {
    // Check if booking data is available
    if (!bookingData.studentName || !bookingData.admissionNumber) {
      console.log('Missing student data in booking context, redirecting to details page');
      router.push('/details');
      return;
    }

    if (!bookingData.busRoute || !bookingData.destination) {
      console.log('Missing booking data, redirecting to buses page');
      router.push('/buses');
      return;
    }

    fetchTravelDates();
  }, [bookingData, router]);

  const fetchTravelDates = async () => {
    try {
      const [goResponse, returnResponse] = await Promise.all([
        fetch('/api/travel-dates/go'),
        fetch('/api/travel-dates/return'),
      ]);

      const goData = await goResponse.json();
      const returnData = await returnResponse.json();

      setTravelDates({
        goDate: goData.date || 'Not set',
        returnDate: returnData.date || 'Not set',
      });
    } catch (error) {
      console.error('Failed to fetch travel dates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleBookAnother = () => {
    resetBookingData();
    router.push('/');
  };

  // Show loading state while checking data or fetching travel dates
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Generating ticket...</p>
        </div>
      </div>
    );
  }

  // If no booking data, don't render anything (will redirect)
  if (!bookingData.studentName || !bookingData.admissionNumber || !bookingData.busRoute || !bookingData.destination) {
    return null;
  }

  return (
    <PageTransition direction="right">
      <div className="min-h-screen p-4">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl font-bold text-green-600 mb-2">
              Booking Confirmed!
            </h1>
            <p className="text-gray-600">Your bus pass has been booked successfully</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="shadow-2xl border-0 bg-white overflow-hidden print:shadow-none">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-green-600 text-white">
                <CardTitle className="text-center text-2xl font-bold flex items-center justify-center gap-2">
                  <Ticket className="w-6 h-6" />
                  Bus Pass Ticket
                </CardTitle>
                <p className="text-center text-blue-100 text-sm">
                  St. Joseph's College of Engineering and Technology, Palai
                </p>
              </CardHeader>
              
              <CardContent className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    {/* Student Information from BookingContext */}
                    <div className="flex items-center gap-3">
                      <User className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="text-sm text-gray-600">Student Name</p>
                        <p className="font-semibold">{bookingData.studentName}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <CreditCard className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="text-sm text-gray-600">Admission Number</p>
                        <p className="font-semibold">{bookingData.admissionNumber}</p>
                      </div>
                    </div>

                    {/* Booking Information from BookingContext */}
                    <div className="flex items-center gap-3">
                      <Bus className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="text-sm text-gray-600">Bus Route</p>
                        <p className="font-semibold">{bookingData.busName}</p>
                        {bookingData.busName && (
                          <p className="text-sm text-gray-500">{bookingData.busRoute}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="text-sm text-gray-600">Destination</p>
                        <p className="font-semibold">{bookingData.destination}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="text-sm text-gray-600">Travel Date (Go)</p>
                        <p className="font-semibold">{travelDates.goDate}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="text-sm text-gray-600">Return Date</p>
                        <p className="font-semibold">{travelDates.returnDate}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Fare:</span>
                        <span className="font-bold text-lg">₹{bookingData.fare}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Payment Status:</span>
                        <Badge
                          variant={bookingData.paymentStatus ? "default" : "secondary"}
                          className={bookingData.paymentStatus ? "bg-green-600" : "bg-orange-600"}
                        >
                          {bookingData.paymentStatus ? "PAID" : "NOT PAID"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <p className="text-xs text-gray-500 text-center">
                    Booked on: {format(new Date(), 'PPpp')}
                  </p>
                  {bookingData.paymentStatus && (
                    <p className="text-xs text-green-600 text-center mt-1">
                      ✓ Payment completed successfully
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex gap-4 mt-8 print:hidden"
          >
            <Button
              onClick={handlePrint}
              variant="outline"
              className="flex-1 border-blue-600 text-blue-600 hover:bg-blue-50"
            >
              <Printer className="w-4 h-4 mr-2" />
              Print Ticket
            </Button>
            <Button
              onClick={handleBookAnother}
              className="flex-1 bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Book Another Ticket
            </Button>
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
}