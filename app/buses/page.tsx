'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageTransition } from '@/components/ui/page-transition';
import { Bus as BusIcon, Users, Activity, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useBooking } from '@/contexts/BookingContext';

interface BusRow {
  id: number;
  name: string;
  route_code: string;
  available_seats: number;
  is_active: boolean;
}

export default function BusesPage() {
  const [buses, setBuses] = useState<BusRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { bookingData, updateBookingData } = useBooking();

  useEffect(() => {
    // Check if student details are available
    if (!bookingData.studentName || !bookingData.admissionNumber) {
      router.push('/');
      return;
    }
    fetchBuses();
  }, [bookingData.studentName, bookingData.admissionNumber, router]);

  const fetchBuses = async () => {
    try {
      const { data, error } = await supabase
        .from('buses')
        .select('id, name, route_code, available_seats, is_active')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      setBuses(data || []);
    } catch (error) {
      toast.error('Failed to load buses');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBusSelect = (bus: BusRow) => {
    if ((bus.available_seats ?? 0) === 0) {
      toast.error('This bus is fully booked');
      return;
    }
    router.push(`/buses/${bus.route_code}/destinations`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading buses...</p>
        </div>
      </div>
    );
  }

  return (
    <PageTransition direction="right">
      <div className="min-h-screen p-4">
        <div className="max-w-6xl mx-auto">
          {/* Student Info Display */}
          <div className="mb-6 bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <User className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-blue-900">Student Information</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Name: </span>
                <span className="font-semibold text-gray-800">{bookingData.studentName}</span>
              </div>
              <div>
                <span className="text-gray-600">Admission Number: </span>
                <span className="font-semibold text-gray-800">{bookingData.admissionNumber}</span>
              </div>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl md:text-4xl font-bold text-blue-900 mb-2">
              Select Your Bus
            </h1>
            <p className="text-gray-600">Choose from available buses below</p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {buses.map((bus, index) => (
              <motion.div
                key={bus.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
              >
                <Card
                  className={`cursor-pointer transition-all duration-300 transform hover:scale-105 hover:shadow-xl ${
                    (bus.available_seats ?? 0) === 0
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:bg-blue-50'
                  }`}
                  onClick={() => handleBusSelect(bus)}
                >
                  <CardContent className="p-6 relative">
                    <div className="absolute top-2 right-2 flex gap-2">
                      <Badge
                        variant={(bus.available_seats ?? 0) > 10 ? 'default' : (bus.available_seats ?? 0) > 0 ? 'secondary' : 'destructive'}
                        className="text-xs"
                      >
                        <Users className="w-3 h-3 mr-1" />
                        {bus.available_seats ?? 0}
                      </Badge>
                      <Badge variant={bus.is_active ? 'default' : 'secondary'} className="text-xs">
                        <Activity className="w-3 h-3 mr-1" />
                        {bus.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>

                    <BusIcon className="w-12 h-12 text-blue-600 mb-4" />
                    <h3 className="text-xl font-bold text-gray-800">{bus.name}</h3>
                    <p className="text-sm text-gray-600">Route: {bus.route_code}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}