'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { PageTransition } from '@/components/ui/page-transition';
import { useAdmin, withAdminAuth } from '@/contexts/AdminContext';
import { Settings, Bus, Calendar, Users, LogOut, Plus, Edit, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

interface AdminData {
  bookingEnabled: boolean;
  goDate: string;
  returnDate: string;
  busAvailability: { [key: string]: number };
}

interface Bus {
  id: number;
  name: string;
  route_code: string;
  capacity: number;
  is_active: boolean;
}

interface BookingStats {
  totalBookings: number;
  paidBookings: number;
  pendingBookings: number;
  recentBookings: number;
  estimatedRevenue: number;
}

function AdminDashboard() {
  const { user, logout } = useAdmin();
  const [adminData, setAdminData] = useState<AdminData>({
    bookingEnabled: false,
    goDate: '',
    returnDate: '',
    busAvailability: {},
  });
  const [buses, setBuses] = useState<Bus[]>([]);
  const [bookingStats, setBookingStats] = useState<BookingStats>({
    totalBookings: 0,
    paidBookings: 0,
    pendingBookings: 0,
    recentBookings: 0,
    estimatedRevenue: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      await Promise.all([
        fetchAdminData(),
        fetchBuses(),
        fetchBookingStats()
      ]);
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAdminData = async () => {
    try {
      const response = await fetch('/api/admin/settings');
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setAdminData(result.data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
    }
  };

  const fetchBuses = async () => {
    try {
      const response = await fetch('/api/admin/buses');
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setBuses(result.data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch buses:', error);
    }
  };

  const fetchBookingStats = async () => {
    try {
      const response = await fetch('/api/admin/bookings/stats');
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setBookingStats(result.data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch booking stats:', error);
    }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);

    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(adminData),
        credentials: 'include'
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success('Settings updated successfully');
      } else {
        toast.error(result.error || 'Failed to update settings');
      }
    } catch (error) {
      toast.error('Failed to update settings');
    } finally {
      setIsSaving(false);
    }
  };

  const updateBusAvailability = (busRoute: string, seats: number) => {
    setAdminData(prev => ({
      ...prev,
      busAvailability: {
        ...prev.busAvailability,
        [busRoute]: Math.max(0, seats),
      },
    }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen p-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex justify-between items-center mb-8"
          >
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Admin Dashboard</h1>
              <p className="text-gray-600">Welcome back, {user?.full_name}</p>
            </div>
            <Button
              variant="outline"
              className="text-red-600 border-red-600 hover:bg-red-50"
              onClick={logout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Booking Control */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Booking Control
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="booking-toggle">Enable Booking</Label>
                    <Switch
                      id="booking-toggle"
                      checked={adminData.bookingEnabled}
                      onCheckedChange={(checked) =>
                        setAdminData(prev => ({ ...prev, bookingEnabled: checked }))
                      }
                    />
                  </div>
                  <Badge
                    variant={adminData.bookingEnabled ? "default" : "secondary"}
                    className={`mt-2 ${adminData.bookingEnabled ? 'bg-green-600' : 'bg-red-600'}`}
                  >
                    {adminData.bookingEnabled ? 'Active' : 'Inactive'}
                  </Badge>
                </CardContent>
              </Card>
            </motion.div>

            {/* Travel Dates */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Travel Dates
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="go-date">Go Date</Label>
                    <Input
                      id="go-date"
                      type="date"
                      value={adminData.goDate}
                      onChange={(e) =>
                        setAdminData(prev => ({ ...prev, goDate: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="return-date">Return Date</Label>
                    <Input
                      id="return-date"
                      type="date"
                      value={adminData.returnDate}
                      onChange={(e) =>
                        setAdminData(prev => ({ ...prev, returnDate: e.target.value }))
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Quick Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Quick Stats
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total Buses:</span>
                      <span className="font-semibold">{buses.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total Bookings:</span>
                      <span className="font-semibold">{bookingStats.totalBookings}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Paid Bookings:</span>
                      <span className="font-semibold text-green-600">{bookingStats.paidBookings}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Pending:</span>
                      <span className="font-semibold text-orange-600">{bookingStats.pendingBookings}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Available Seats:</span>
                      <span className="font-semibold">
                        {Object.values(adminData.busAvailability).reduce((sum, seats) => sum + seats, 0)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Bus Management */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bus className="w-5 h-5" />
                  Bus Seat Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {buses.map((bus) => (
                    <Card key={bus.id} className="border-gray-200">
                      <CardContent className="p-4">
                        <h4 className="font-semibold text-gray-800 mb-2">{bus.name}</h4>
                        <Label htmlFor={`seats-${bus.route}`} className="text-sm text-gray-600">
                          Available Seats
                        </Label>
                        <Input
                          id={`seats-${bus.route}`}
                          type="number"
                          min="0"
                          max="60"
                          value={adminData.busAvailability[bus.route] || 0}
                          onChange={(e) =>
                            updateBusAvailability(bus.route, parseInt(e.target.value) || 0)
                          }
                          className="mt-1"
                        />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Save Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mt-8 text-center"
          >
            <Button
              onClick={handleSaveSettings}
              disabled={isSaving}
              size="lg"
              className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-semibold px-8 py-3 rounded-lg transition-all duration-300 transform hover:scale-105"
            >
              {isSaving ? 'Saving...' : 'Save All Settings'}
            </Button>
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
}

export default withAdminAuth(AdminDashboard);