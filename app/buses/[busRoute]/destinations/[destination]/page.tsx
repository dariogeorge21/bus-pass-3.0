"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageTransition } from '@/components/ui/page-transition';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { useBooking } from '@/contexts/BookingContext';

interface Params { params: { busRoute: string; destination: string } }

export default function BookingDetailsPage({ params }: Params) {
  const { bookingData, updateBookingData } = useBooking();
  const [bus, setBus] = useState<any>(null);
  const [stop, setStop] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const routeCode = decodeURIComponent(params.busRoute);
  const destinationName = decodeURIComponent(params.destination);

  useEffect(() => {
    // If student details aren't available, redirect to details page
    if (!bookingData.studentName || !bookingData.admissionNumber) {
      redirect('/details');
    }

    const fetchData = async () => {
      try {
        // Get bus details
        const { data: busData } = await supabase
          .from('buses')
          .select('name, route_code')
          .eq('route_code', routeCode)
          .single();

        // Get destination details
        const { data: stopData } = await supabase
          .from('route_stops')
          .select('stop_name, fare')
          .eq('route_code', routeCode)
          .eq('stop_name', destinationName)
          .single();

        // Get travel dates from admin settings
        const { data: settingsData } = await supabase
          .from('admin_settings')
          .select('go_date, return_date')
          .single();

        if (!busData || !stopData || !settingsData) {
          notFound();
        }

        setBus(busData);
        setStop(stopData);
        setSettings(settingsData);

        // Update booking context with bus and destination info
        updateBookingData({
          busRoute: routeCode,
          busName: busData.name,
          destination: stopData.stop_name,
          fare: stopData.fare
        });

      } catch (error) {
        console.error('Error fetching data:', error);
        notFound();
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [routeCode, destinationName, bookingData.studentName, bookingData.admissionNumber, updateBookingData]);

  if (loading) {
    return (
      <PageTransition>
        <div className="min-h-screen p-4 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading booking details...</p>
          </div>
        </div>
      </PageTransition>
    );
  }

  if (!bus || !stop || !settings) {
    return notFound();
  }

  const price = stop.fare;
  
  // Format dates for display
  const goDate = settings.go_date ? new Date(settings.go_date).toLocaleDateString('en-IN') : 'Not set';
  const returnDate = settings.return_date ? new Date(settings.return_date).toLocaleDateString('en-IN') : 'Not set';

  return (
    <PageTransition>
      <div className="min-h-screen p-4">
        <div className="max-w-xl mx-auto">
          <Card>
            <CardContent className="p-6 space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">Confirm Your Booking</h1>
                <p className="text-gray-600 text-sm">Please review your booking details</p>
              </div>
              
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h3 className="font-medium text-gray-700 mb-2">Student Details</h3>
                  <p className="text-gray-700">Name: <span className="font-semibold">{bookingData.studentName}</span></p>
                  <p className="text-gray-700">Admission Number: <span className="font-semibold">{bookingData.admissionNumber}</span></p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h3 className="font-medium text-gray-700 mb-2">Bus Details</h3>
                  <p className="text-gray-700">Bus: <span className="font-semibold">{bus.name}</span></p>
                  <p className="text-gray-700">Route: <span className="font-semibold">{bus.route_code}</span></p>
                  <p className="text-gray-700">Destination: <span className="font-semibold">{stop.stop_name}</span></p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h3 className="font-medium text-gray-700 mb-2">Travel Dates</h3>
                  <p className="text-gray-700">Go Date: <span className="font-semibold">{goDate}</span></p>
                  <p className="text-gray-700">Return Date: <span className="font-semibold">{returnDate}</span></p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h3 className="font-medium text-gray-700 mb-2">Payment Details</h3>
                  <p className="text-gray-700">Price: <span className="font-semibold text-lg text-green-700">₹{price}</span></p>
                </div>
              </div>
              
              <Link href="/payment">
                <Button className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700">
                  Confirm and Make Payment
                </Button>
              </Link>
              
              <p className="text-xs text-gray-500 text-center">
                By confirming, you agree to the terms and conditions for bus pass booking.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageTransition>
  );
}