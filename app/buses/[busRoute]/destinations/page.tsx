'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageTransition } from '@/components/ui/page-transition';
import { MapPin, ArrowRight, User } from 'lucide-react';
import Link from 'next/link';
import { useBooking } from '@/contexts/BookingContext';

interface Params {
  params: { busRoute: string };
}

export default function DestinationsPage({ params }: Params) {
  const { bookingData } = useBooking();
  const [bus, setBus] = useState<any>(null);
  const [stops, setStops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const routeCode = decodeURIComponent(params.busRoute);

  useEffect(() => {
    // Check if student details are available
    if (!bookingData.studentName || !bookingData.admissionNumber) {
      router.push('/');
      return;
    }

    const fetchData = async () => {
      try {
        const { data: busData } = await supabase
          .from('buses')
          .select('name, route_code, available_seats')
          .eq('route_code', routeCode)
          .eq('is_active', true)
          .single();

        const { data: stopsData } = await supabase
          .from('route_stops')
          .select('id, stop_name, fare, stop_order')
          .eq('route_code', routeCode)
          .eq('is_active', true)
          .order('stop_order');

        setBus(busData);
        setStops(stopsData || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [routeCode, bookingData.studentName, bookingData.admissionNumber, router]);

  if (loading) {
    return (
      <PageTransition>
        <div className="min-h-screen p-4 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading destinations...</p>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen p-4">
        <div className="max-w-4xl mx-auto">
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

          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">{bus?.name}</h1>
            <p className="text-gray-600">Route: {bus?.route_code}</p>
            <Badge variant="outline" className="mt-2">Available Seats: {bus?.available_seats ?? 0}</Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {stops?.map((stop) => (
              <Link key={stop.id} href={`/buses/${routeCode}/destinations/${encodeURIComponent(stop.stop_name)}`}>
                <Card className="hover:bg-gray-50">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-red-600" />
                        <h3 className="font-semibold text-gray-800">{stop.stop_name}</h3>
                      </div>
                      <p className="text-sm text-gray-500">Fare: ₹{stop.fare}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </PageTransition>
  );
} 