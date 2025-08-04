'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageTransition } from '@/components/ui/page-transition';
import { buses } from '@/lib/data';
import { Bus, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

interface BusAvailability {
  [busRoute: string]: number;
}

export default function BusesPage() {
  const [availability, setAvailability] = useState<BusAvailability>({});
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchBusAvailability();
  }, []);

  const fetchBusAvailability = async () => {
    try {
      const response = await fetch('/api/buses/availability');
      const data = await response.json();
      setAvailability(data);
    } catch (error) {
      toast.error('Failed to load bus availability');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBusSelect = (bus: typeof buses[0]) => {
    if (availability[bus.route] === 0) {
      toast.error('This bus is fully booked');
      return;
    }
    router.push(`/buses/${bus.route}`);
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
                    availability[bus.route] === 0
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:bg-blue-50'
                  }`}
                  onClick={() => handleBusSelect(bus)}
                >
                  <CardContent className="p-6 text-center relative">
                    <div className="absolute top-2 right-2">
                      <Badge
                        variant={availability[bus.route] > 10 ? "default" : availability[bus.route] > 0 ? "secondary" : "destructive"}
                        className="text-xs"
                      >
                        <Users className="w-3 h-3 mr-1" />
                        {availability[bus.route] || 0}
                      </Badge>
                    </div>
                    
                    <Bus className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-800 mb-2">
                      {bus.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {availability[bus.route] === 0 ? 'Fully Booked' : `${availability[bus.route]} seats available`}
                    </p>
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