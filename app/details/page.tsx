'use client';

import { useState } from 'react';
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
import { User, CreditCard } from 'lucide-react';

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
  const router = useRouter();
  const { updateBookingData } = useBooking();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      studentName: '',
      admissionNumber: '',
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    
    // Update booking context
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
                          Format: Year followed by department and registrtion number
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