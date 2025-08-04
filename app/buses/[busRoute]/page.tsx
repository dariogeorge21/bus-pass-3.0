'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageTransition } from '@/components/ui/page-transition';
import { useBooking } from '@/contexts/BookingContext';
import { routeStops, buses } from '@/lib/data';
import { MapPin, IndianRupee, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

interface RoutePageProps {
  params: {
    busRoute: string;
  };
}

export default function RoutePage({ params }: RoutePageProps) {
  const router = useRouter();
  const { updateBookingData } = useBooking();
  const [selectedStop, setSelectedStop] = useState<number | null>(null);

  const bus = buses.find(b => b.route === params.busRoute);
  const stops = routeStops[params.busRoute] || [];

  useEffect(() => {
    if (bus) {
      updateBookingData({
        busRoute: bus.route,
        busName: bus.name,
      });
    }
  }, [bus, updateBookingData]);

  const handleStopSelect = (stop: typeof stops[0]) => {
    updateBookingData({
      destination: stop.name,
      fare: stop.fare,
    });
    router.push('/payment');
  };

  if (!bus) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Bus not found</p>
      </div>
    );
  }

  return (
    <PageTransition direction="right">
      <div className="min-h-screen p-4">
        <div className="max-w-2xl mx-auto">
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
              Back to Buses
            </Button>
            
            <h1 className="text-3xl font-bold text-blue-900 mb-2">
              {bus.name} - Route Selection
            </h1>
            <p className="text-gray-600">Select your destination</p>
          </motion.div>

          <div className="space-y-4">
            {stops.map((stop, index) => (
              <motion.div
                key={stop.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card
                  className="cursor-pointer transition-all duration-300 transform hover:scale-102 hover:shadow-lg hover:bg-blue-50"
                  onClick={() => handleStopSelect(stop)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <MapPin className="w-5 h-5 text-blue-600" />
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800">
                            {stop.name}
                          </h3>
                          <p className="text-sm text-gray-600">
                            Destination
                          </p>
                        </div>
                      </div>
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                        <IndianRupee className="w-3 h-3 mr-1" />
                        {stop.fare}
                      </Badge>
                    </div>
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