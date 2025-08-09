'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AnimatedBus } from '@/components/ui/animated-bus';
import { PageTransition } from '@/components/ui/page-transition';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertCircle, Settings } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();

  const handleNext = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/booking-status');
      const data = await response.json();
      
      if (data.enabled) {
        router.push('/details');
      } else {
        setShowModal(true);
      }
    } catch (error) {
      toast.error('Failed to check booking status. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        {/* Admin Panel Link */}
        <div className="absolute top-4 right-4">
          <Button
            onClick={() => router.push('/admin')}
            variant="outline"
            size="sm"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
          >
            <Settings className="w-4 h-4" />
            Admin
          </Button>
        </div>
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl md:text-6xl font-bold text-blue-900 mb-4 leading-tight">
            St. Joseph's College of<br />
            Engineering and Technology
          </h1>
          <p className="text-xl md:text-2xl text-green-700 font-semibold">Palai</p>
        </motion.div>

        <AnimatedBus />

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Card className="w-full max-w-md shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                Bus Pass Booking System
              </h2>
              <p className="text-gray-600 mb-8">
                Book your bus pass quickly and easily. Click next to get started.
              </p>
              <Button
                onClick={handleNext}
                disabled={isLoading}
                size="lg"
                className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white font-semibold py-3 rounded-lg transition-all duration-300 transform hover:scale-105"
              >
                {isLoading ? 'Checking...' : 'Next'}
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-orange-600">
                <AlertCircle className="w-5 h-5" />
                Booking Not Available
              </DialogTitle>
            </DialogHeader>
            <div className="text-center py-4">
              <p className="text-gray-600">
                Sorry! Booking has not started yet!
              </p>
              <Button
                onClick={() => setShowModal(false)}
                className="mt-4"
                variant="outline"
              >
                OK
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </PageTransition>
  );
}