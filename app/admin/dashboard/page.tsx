'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageTransition } from '@/components/ui/page-transition';
import { useAdmin, withAdminAuth } from '@/contexts/AdminContext';
import { Settings, Bus, Calendar, Users, LogOut, Plus, Edit, Trash2, Route, MapPin, BookOpen, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

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
  is_active: boolean;
}



interface NewBookingStats {
  totalBuses: number;
  totalBookings: number;
  currentBookings: number;
  paidBookings: number;
  unpaidBookings: number;
  availableSeats: number;
  totalCapacity: number;
  occupancyRate: string;
}

interface Booking {
  id: number;
  admission_number: string;
  student_name: string;
  bus_route: string;
  destination: string;
  payment_status: boolean;
  created_at: string;
}

function AdminDashboard() {
  const { user, logout } = useAdmin();
  const router = useRouter();
  const [adminData, setAdminData] = useState<AdminData>({
    bookingEnabled: false,
    goDate: '',
    returnDate: '',
    busAvailability: {},
  });

  const [newBookingStats, setNewBookingStats] = useState<NewBookingStats>({
    totalBuses: 0,
    totalBookings: 0,
    currentBookings: 0,
    paidBookings: 0,
    unpaidBookings: 0,
    availableSeats: 0,
    totalCapacity: 0,
    occupancyRate: '0.0',
  });
  const [buses, setBuses] = useState<Bus[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingsPage, setBookingsPage] = useState(1);
  const [bookingsTotalPages, setBookingsTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    fetchAllData();
    fetchBookings();
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [bookingsPage]);

  const fetchAllData = async () => {
    try {
      await Promise.all([
        fetchAdminData(),
        fetchBuses(),
        fetchNewBookingStats()
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



  const fetchNewBookingStats = async () => {
    try {
      // Use the new detailed statistics endpoint for comprehensive data
      const response = await fetch('/api/admin/analytics/detailed-stats');
      const result = await response.json();

      if (result.success && result.data) {
        setNewBookingStats(result.data);
      } else {
        // Fallback to individual endpoints if detailed stats fail
        const [totalBusesRes, totalBookingsRes, currentBookingsRes, availableSeatsRes] = await Promise.all([
          fetch('/api/admin/analytics/total-buses'),
          fetch('/api/admin/analytics/total-bookings'),
          fetch('/api/admin/analytics/current-bookings'),
          fetch('/api/admin/analytics/available-seats')
        ]);

        const [totalBusesData, totalBookingsData, currentBookingsData, availableSeatsData] = await Promise.all([
          totalBusesRes.json(),
          totalBookingsRes.json(),
          currentBookingsRes.json(),
          availableSeatsRes.json()
        ]);

        // Update state with individual endpoint results
        setNewBookingStats({
          totalBuses: totalBusesData.success ? totalBusesData.data : 0,
          totalBookings: totalBookingsData.success ? totalBookingsData.data : 0,
          currentBookings: currentBookingsData.success ? currentBookingsData.data : 0,
          paidBookings: 0, // Not available from individual endpoints
          unpaidBookings: 0, // Not available from individual endpoints
          availableSeats: availableSeatsData.success ? availableSeatsData.data : 0,
          totalCapacity: 0, // Not available from individual endpoints
          occupancyRate: '0.0'
        });
      }
    } catch (error) {
      console.error('Failed to fetch new booking stats:', error);
      // Set default values on error
      setNewBookingStats({
        totalBuses: 0,
        totalBookings: 0,
        currentBookings: 0,
        paidBookings: 0,
        unpaidBookings: 0,
        availableSeats: 0,
        totalCapacity: 0,
        occupancyRate: '0.0'
      });
    }
  };

  const fetchBookings = async () => {
    try {
      const response = await fetch(`/api/admin/bookings?page=${bookingsPage}&limit=25`, {
        credentials: 'include'
      });
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setBookings(result.data.bookings);
          setBookingsTotalPages(result.data.pagination.totalPages);
        }
      }
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
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

  const handleResetSeats = async () => {
    if (!confirm('Are you sure you want to reset all booking data? This will delete all bookings and restore all seats to their maximum capacity.')) {
      return;
    }

    setIsResetting(true);

    try {
      const response = await fetch('/api/admin/analytics/reset', {
        method: 'POST',
        credentials: 'include'
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success('Booking data reset successfully');
        // Refresh data to show updated statistics
        await fetchAllData();
      } else {
        toast.error(result.error || 'Failed to reset booking data');
      }
    } catch (error) {
      toast.error('Failed to reset booking data');
    } finally {
      setIsResetting(false);
    }
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

          {/* Navigation Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="mb-8"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Quick Navigation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    onClick={() => router.push('/admin/buses')}
                    variant="outline"
                    className="flex items-center gap-2 h-12"
                  >
                    <Bus className="w-5 h-5" />
                    Bus Management
                  </Button>
                  <Button
                    onClick={() => router.push('/admin/routes')}
                    variant="outline"
                    className="flex items-center gap-2 h-12"
                  >
                    <Route className="w-5 h-5" />
                    Route Management
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* New Statistics Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-8"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Booking Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{newBookingStats.totalBuses}</div>
                    <div className="text-sm text-gray-600">Total Buses</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{newBookingStats.totalBookings}</div>
                    <div className="text-sm text-gray-600">Total Bookings</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">{newBookingStats.currentBookings}</div>
                    <div className="text-sm text-gray-600">Current Bookings</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{newBookingStats.availableSeats}</div>
                    <div className="text-sm text-gray-600">Available Seats</div>
                  </div>
                </div>

                {/* Enhanced Statistics */}
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6 pt-4 border-t border-gray-200">
                  <div className="text-center p-3 bg-emerald-50 rounded-lg">
                    <div className="text-xl font-bold text-emerald-600">{newBookingStats.paidBookings}</div>
                    <div className="text-sm text-gray-600">Paid Bookings</div>
                  </div>
                  <div className="text-center p-3 bg-amber-50 rounded-lg">
                    <div className="text-xl font-bold text-amber-600">{newBookingStats.unpaidBookings}</div>
                    <div className="text-sm text-gray-600">Unpaid Bookings</div>
                  </div>
                  <div className="text-center p-3 bg-indigo-50 rounded-lg">
                    <div className="text-xl font-bold text-indigo-600">{newBookingStats.occupancyRate}%</div>
                    <div className="text-sm text-gray-600">Occupancy Rate</div>
                  </div>
                </div>

                {/* Capacity Information */}
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Total Capacity:</span>
                    <span className="font-semibold text-gray-800">{newBookingStats.totalCapacity} seats</span>
                  </div>
                  <div className="flex justify-between items-center text-sm mt-2">
                    <span className="text-gray-600">Occupied Seats:</span>
                    <span className="font-semibold text-gray-800">{newBookingStats.totalCapacity - newBookingStats.availableSeats} seats</span>
                  </div>
                  <div className="mt-3">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${newBookingStats.occupancyRate}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                
                {/* Reset Seats Button */}
                <div className="text-center">
                  <Button
                    onClick={handleResetSeats}
                    disabled={isResetting}
                    variant="outline"
                    className="border-red-600 text-red-600 hover:bg-red-50"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    {isResetting ? 'Resetting...' : 'Reset All Data'}
                  </Button>
                  <p className="text-xs text-gray-500 mt-2">
                    This will delete all bookings and restore all seats to maximum capacity
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Booking Control */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
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
                      onCheckedChange={async (checked) => {
                        const newData = { ...adminData, bookingEnabled: checked };
                        setAdminData(newData);
                        
                        // Auto-save when toggled
                        try {
                          const response = await fetch('/api/admin/settings', {
                            method: 'PATCH',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                            body: JSON.stringify(newData),
                            credentials: 'include'
                          });

                          const result = await response.json();

                          if (response.ok && result.success) {
                            toast.success(`Booking ${checked ? 'enabled' : 'disabled'} successfully`);
                          } else {
                            // Revert on error
                            setAdminData(adminData);
                            toast.error(result.error || 'Failed to update booking status');
                          }
                        } catch (error) {
                          // Revert on error
                          setAdminData(adminData);
                          toast.error('Failed to update booking status');
                        }
                      }}
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
                  <Button
                    onClick={handleSaveSettings}
                    disabled={isSaving}
                    size="lg"
                    className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-semibold px-8 py-3 rounded-lg transition-all duration-300 transform hover:scale-105 mx-auto block"
                  >
                    {isSaving ? 'Saving...' : 'Update Dates'}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>


          </div>

          {/* Bus Availability Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bus className="w-5 h-5" />
                  Bus Availability Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {buses.map((bus) => (
                    <Card key={bus.id} className="border-gray-200">
                      <CardContent className="p-4">
                        <h4 className="font-semibold text-gray-800 mb-2">{bus.name}</h4>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Available Seats:</span>
                          <Badge variant="outline" className="text-lg font-semibold">
                            {adminData.busAvailability[bus.route_code] || 0}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Bookings Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-8"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Recent Bookings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student Name</TableHead>
                        <TableHead>Admission Number</TableHead>
                        <TableHead>Bus Route</TableHead>
                        <TableHead>Destination</TableHead>
                        <TableHead>Payment Status</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bookings.map((booking) => (
                        <TableRow key={booking.id}>
                          <TableCell className="font-medium">{booking.student_name}</TableCell>
                          <TableCell>{booking.admission_number}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{booking.bus_route}</Badge>
                          </TableCell>
                          <TableCell>{booking.destination}</TableCell>
                          <TableCell>
                            <Badge variant={booking.payment_status ? "default" : "secondary"}>
                              {booking.payment_status ? "Paid" : "Pending"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(booking.created_at).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                
                {/* Pagination */}
                {bookingsTotalPages > 1 && (
                  <div className="flex items-center justify-between space-x-2 py-4">
                    <div className="text-sm text-gray-500">
                      Page {bookingsPage} of {bookingsTotalPages}
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setBookingsPage(Math.max(1, bookingsPage - 1))}
                        disabled={bookingsPage === 1}
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setBookingsPage(Math.min(bookingsTotalPages, bookingsPage + 1))}
                        disabled={bookingsPage === bookingsTotalPages}
                      >
                        Next
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {bookings.length === 0 && (
                  <div className="text-center py-8">
                    <BookOpen className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500">No bookings found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
}

export default withAdminAuth(AdminDashboard);