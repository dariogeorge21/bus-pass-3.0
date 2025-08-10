'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageTransition } from '@/components/ui/page-transition';
import { useBooking } from '@/contexts/BookingContext';
import { CreditCard, Wallet, ArrowLeft, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function PaymentPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { bookingData, updateBookingData } = useBooking();

  useEffect(() => {
    // Check if booking data is available
    if (!bookingData.studentName || !bookingData.admissionNumber || !bookingData.fare) {
      router.push('/details');
      return;
    }

    // Load Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => {
      console.log('Razorpay script loaded successfully');
      setRazorpayLoaded(true);
    };
    script.onerror = (error) => {
      console.error('Failed to load Razorpay script:', error);
      setError('Payment gateway failed to load. Please refresh the page.');
      toast.error('Payment gateway failed to load');
    };
    document.body.appendChild(script);

    return () => {
      const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
      if (existingScript) {
        document.body.removeChild(existingScript);
      }
    };
  }, [bookingData, router]);

  const handleRazorpayPayment = async () => {
    if (!razorpayLoaded) {
      toast.error('Payment gateway is loading. Please try again.');
      return;
    }

    if (!bookingData.fare || bookingData.fare <= 0) {
      toast.error('Invalid fare amount. Please try again.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('Initiating payment with fare:', bookingData.fare);
      
      // Create order
      const orderResponse = await fetch('/api/payment/order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Math.round(bookingData.fare * 100), // Convert to paise and ensure it's an integer
          currency: 'INR',
          receipt: `bus_booking_${Date.now()}`,
        }),
      });

      console.log('Order response status:', orderResponse.status);
      
      const orderData = await orderResponse.json();
      console.log('Order response data:', orderData);

      if (!orderResponse.ok) {
        throw new Error(orderData.error || 'Failed to create order');
      }

      if (!orderData.order || !orderData.order.id) {
        throw new Error('Invalid order response from server');
      }

      const options = {
        key: orderData.keyId,
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: 'St. Joseph\'s College Bus Pass',
        description: `Bus Pass - ${bookingData.destination}`,
        order_id: orderData.order.id,
        handler: async (response: any) => {
          console.log('Payment successful, verifying...', response);
          try {
            // Verify payment
            const verifyResponse = await fetch('/api/payment/verify', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyResponse.json();
            console.log('Verification response:', verifyData);

            if (verifyResponse.ok && verifyData.success) {
              // Save booking
              await saveBooking(true, response);
              toast.success('Payment successful!');
              router.push('/ticket');
            } else {
              throw new Error('Payment verification failed');
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            toast.error('Payment verification failed. Please contact support.');
          }
        },
        prefill: {
          name: bookingData.studentName,
          email: `${bookingData.admissionNumber}@sjcet.ac.in`,
        },
        theme: {
          color: '#2563eb',
        },
        modal: {
          ondismiss: () => {
            setIsLoading(false);
            toast.info('Payment cancelled');
          },
        },
        onError: (error: any) => {
          console.error('Razorpay error:', error);
          setIsLoading(false);
          toast.error('Payment failed. Please try again.');
        },
      };

      console.log('Opening Razorpay with options:', options);
      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error('Payment error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to initiate payment';
      setError(errorMessage);
      toast.error(errorMessage);
      setIsLoading(false);
    }
  };

  const saveBooking = async (paymentStatus: boolean, razorpayData?: {
    razorpay_payment_id?: string | null;
    razorpay_order_id?: string | null;
    razorpay_signature?: string | null;
  }) => {
    try {
      const bookingPayload = {
        // Database schema order
        admissionNumber: bookingData.admissionNumber,
        studentName: bookingData.studentName,
        busRoute: bookingData.busRoute,
        destination: bookingData.destination,
        paymentStatus,
        timestamp: new Date().toISOString(),
        // Razorpay fields - include for online payments, null for upfront payments
        razorpay_payment_id: razorpayData?.razorpay_payment_id || null,
        razorpay_order_id: razorpayData?.razorpay_order_id || null,
        razorpay_signature: razorpayData?.razorpay_signature || null,
      };

      console.log('Saving booking with payload:', bookingPayload);

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingPayload),
      });

      if (response.ok) {
        updateBookingData({ paymentStatus });
      } else {
        const errorData = await response.json();
        console.error('Booking API error:', errorData);
        throw new Error(errorData.error || 'Booking failed');
      }
    } catch (error) {
      console.error('Booking error:', error);
      throw error;
    }
  };

  const handlePaymentMethod = async (method: 'online' | 'upfront') => {
    if (method === 'online') {
      await handleRazorpayPayment();
    } else {
      setIsLoading(true);
      setError(null);
      try {
        // For upfront payments, explicitly pass null values for Razorpay fields
        await saveBooking(false, {
          razorpay_payment_id: null,
          razorpay_order_id: null,
          razorpay_signature: null,
        });
        toast.success('Booking confirmed! Pay at college.');
        router.push('/ticket');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Booking failed. Please try again.';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
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

          {/* Error Display */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg"
            >
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                <span className="text-red-700 text-sm">{error}</span>
              </div>
            </motion.div>
          )}

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
                className={`cursor-pointer transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:bg-gradient-to-r hover:from-blue-50 hover:to-green-50 ${
                  isLoading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                onClick={() => !isLoading && handlePaymentMethod('online')}
              >
                <CardContent className="p-6 text-center">
                  <CreditCard className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-800 mb-2">
                    {isLoading ? 'Processing...' : 'Online Payment'}
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

              {/* Upfront Payment */}

              <Card
                className={`cursor-pointer transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:bg-gradient-to-r hover:from-orange-50 hover:to-yellow-50 ${
                  isLoading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                onClick={() => !isLoading && handlePaymentMethod('upfront')}
              >
                <CardContent className="p-6 text-center">
                  <Wallet className="w-12 h-12 text-orange-600 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-800 mb-2">
                    {isLoading ? 'Processing...' : 'Pay at College'}
                  </h3>
                  <p className="text-gray-600">
                    Reserve seat and pay at college
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