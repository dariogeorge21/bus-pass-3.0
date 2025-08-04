'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageTransition } from '@/components/ui/page-transition';
import { useBooking } from '@/contexts/BookingContext';
import { CreditCard, Wallet, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function PaymentPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { bookingData, updateBookingData } = useBooking();

  const handlePaymentMethod = async (method: 'online' | 'upfront') => {
    setIsLoading(true);

    try {
      const bookingPayload = {
        studentName: bookingData.studentName,
        admissionNumber: bookingData.admissionNumber,
        busRoute: bookingData.busRoute,
        destination: bookingData.destination,
        paymentStatus: method === 'online',
        timestamp: new Date().toISOString(),
      };

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingPayload),
      });

      if (response.ok) {
        updateBookingData({ paymentStatus: method === 'online' });
        
        if (method === 'online') {
          // Redirect to Razorpay (placeholder)
          toast.info('Redirecting to payment gateway...');
          setTimeout(() => {
            router.push('/ticket');
          }, 2000);
        } else {
          router.push('/ticket');
        }
      } else {
        throw new Error('Booking failed');
      }
    } catch (error) {
      toast.error('Booking failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageTransition direction="right">
      <div className="min-h-screen p-4">
        <div className="max-w-md mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6"
          >
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="mb-4 text-blue-600 hover:text-blue-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            
            <h1 className="text-3xl font-bold text-blue-900 mb-2">
              Payment Method
            </h1>
            <p className="text-gray-600">Choose your payment option</p>
          </motion.div>

          <div className="space-y-6">
            {/* Booking Summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card className="bg-blue-50 border-blue-200">
                <CardHeader>
                  <CardTitle className="text-lg text-blue-900">Booking Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Bus:</span>
                      <span className="font-semibold">{bookingData.busName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Destination:</span>
                      <span className="font-semibold">{bookingData.destination}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold text-blue-900 pt-2 border-t">
                      <span>Total Fare:</span>
                      <span>₹{bookingData.fare}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Payment Options */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="space-y-4"
            >
              <Card
                className="cursor-pointer transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:bg-gradient-to-r hover:from-blue-50 hover:to-green-50"
                onClick={() => handlePaymentMethod('online')}
              >
                <CardContent className="p-6 text-center">
                  <CreditCard className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-800 mb-2">
                    Online Payment
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Pay securely using Razorpay
                  </p>
                  <div className="flex justify-center">
                    <img
                      src="https://razorpay.com/assets/razorpay-logo.svg"
                      alt="Razorpay"
                      className="h-8"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card
                className="cursor-pointer transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:bg-gradient-to-r hover:from-orange-50 hover:to-yellow-50"
                onClick={() => handlePaymentMethod('upfront')}
              >
                <CardContent className="p-6 text-center">
                  <Wallet className="w-12 h-12 text-orange-600 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-800 mb-2">
                    Upfront Payment
                  </h3>
                  <p className="text-gray-600">
                    Pay directly at the college
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}