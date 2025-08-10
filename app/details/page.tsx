'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { PageTransition } from '@/components/ui/page-transition';
import { useBooking } from '@/contexts/BookingContext';
import { motion } from 'framer-motion';
import { User } from 'lucide-react';
import { toast } from 'sonner';

const formSchema = z.object({
  studentName: z.string()
    .min(2, 'Name must be at least 2 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces'),
  admissionNumber: z.string()
    .regex(/^[A-Z0-9]{7}$/, 'Admission number must be exactly 7 uppercase letters or numbers (e.g., 24CS094)'),
});

type FormData = z.infer<typeof formSchema>;

export default function DetailsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingBooking, setIsCheckingBooking] = useState(true);
  const router = useRouter();
  const { updateBookingData } = useBooking();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      studentName: '',
      admissionNumber: '',
    },
  });

  // Check booking status on component mount
  useEffect(() => {
    const checkBookingStatus = async () => {
      try {
        const response = await fetch('/api/booking-status');
        const data = await response.json();

        if (!data.enabled) {
          toast.error('Booking is currently disabled. Please try again later.');
          router.push('/');
          return;
        }

        setIsCheckingBooking(false);
      } catch (error) {
        console.error('Error checking booking status:', error);
        toast.error('Unable to check booking status. Please try again.');
        router.push('/');
      }
    };

    checkBookingStatus();
  }, [router]);

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);

    // Update booking context with student information
    updateBookingData({
      studentName: data.studentName,
      admissionNumber: data.admissionNumber,
    });

    // Simulate API delay
    setTimeout(() => {
      setIsLoading(false);
      router.push('/buses');
    }, 500);
  };

  const handleAdmissionNumberChange = (value: string) => {
    value = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (value.length > 7) {
      value = value.slice(0, 7);
    }
    return value;
  };

  // Show loading state while checking booking status
  if (isCheckingBooking) {
    return (
      <PageTransition direction="right">
        <div className="min-h-screen flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md"
          >
            <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
              <CardContent className="p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Checking booking availability...</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition direction="right">
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader className="text-center bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-t-lg">
              <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
                <User className="w-6 h-6" />
                Student Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="studentName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 font-semibold">Student Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter your full name"
                            {...field}
                            className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="admissionNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 font-semibold">Admission Number</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Eg. 24CS094"
                            {...field}
                            onChange={(e) => {
                              const value = handleAdmissionNumberChange(e.target.value);
                              field.onChange(value);
                            }}
                            className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                          />
                        </FormControl>
                        <FormMessage />
                        <p className="text-sm text-gray-500 mt-1">
                          Format: Year followed by department and registration number
                        </p>
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white font-semibold py-3 rounded-lg transition-all duration-300 transform hover:scale-105"
                  >
                    {isLoading ? 'Processing...' : 'Continue to Bus Selection'}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </PageTransition>
  );
}