'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageTransition } from '@/components/ui/page-transition';
import { useAdmin, withAdminAuth } from '@/contexts/AdminContext';
import { Route, Plus, Edit, Trash2, Save, X, ArrowLeft, MapPin, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import Link from 'next/link';

interface Bus {
  id: number;
  name: string;
  route_code: string;
  is_active: boolean;
}

interface RouteStop {
  id?: number;
  route_code: string;
  stop_name: string;
  fare: number;
  stop_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

function RouteManagement() {
  const { user } = useAdmin();
  const [buses, setBuses] = useState<Bus[]>([]);
  const [routeStops, setRouteStops] = useState<RouteStop[]>([]);
  const [selectedBus, setSelectedBus] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [editingStop, setEditingStop] = useState<RouteStop | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<Omit<RouteStop, 'id'>>({
    route_code: '',
    stop_name: '',
    fare: 0,
    stop_order: 1,
    is_active: true
  });

  useEffect(() => {
    fetchBuses();
  }, []);

  useEffect(() => {
    if (selectedBus) {
      fetchRouteStops(selectedBus);
    } else {
      setRouteStops([]);
    }
  }, [selectedBus]);

  const fetchBuses = async () => {
    try {
      const response = await fetch('/api/admin/buses');
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setBuses(result.data.filter((bus: Bus) => bus.is_active));
        }
      }
    } catch (error) {
      toast.error('Failed to fetch buses');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRouteStops = async (routeCode: string) => {
    try {
      const response = await fetch(`/api/admin/route-stops?route_code=${routeCode}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setRouteStops(result.data.sort((a: RouteStop, b: RouteStop) => a.stop_order - b.stop_order));
        }
      }
    } catch (error) {
      toast.error('Failed to fetch route stops');
    }
  };

  const handleCreate = async () => {
    if (!selectedBus) {
      toast.error('Please select a bus route first');
      return;
    }

    try {
      const createData = { ...formData, route_code: selectedBus };
      const response = await fetch('/api/admin/route-stops', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(createData),
        credentials: 'include'
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success('Route stop created successfully');
        fetchRouteStops(selectedBus);
        setIsCreating(false);
        setFormData({ route_code: '', stop_name: '', fare: 0, stop_order: 1, is_active: true });
      } else {
        toast.error(result.error || 'Failed to create route stop');
      }
    } catch (error) {
      toast.error('Failed to create route stop');
    }
  };

  const handleUpdate = async () => {
    if (!editingStop) return;

    try {
      const response = await fetch('/api/admin/route-stops', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingStop),
        credentials: 'include'
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success('Route stop updated successfully');
        fetchRouteStops(selectedBus);
        setEditingStop(null);
      } else {
        toast.error(result.error || 'Failed to update route stop');
      }
    } catch (error) {
      toast.error('Failed to update route stop');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this route stop?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/route-stops?id=${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success('Route stop deleted successfully');
        fetchRouteStops(selectedBus);
      } else {
        toast.error(result.error || 'Failed to delete route stop');
      }
    } catch (error) {
      toast.error('Failed to delete route stop');
    }
  };

  const getNextStopOrder = () => {
    if (routeStops.length === 0) return 1;
    return Math.max(...routeStops.map(stop => stop.stop_order)) + 1;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen p-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex justify-between items-center mb-8"
          >
            <div className="flex items-center gap-4">
              <Link href="/admin/dashboard">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Route Management</h1>
                <p className="text-gray-600">Manage bus routes and stops</p>
              </div>
            </div>
          </motion.div>

          {/* Bus Selection */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-6"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Route className="w-5 h-5" />
                  Select Bus Route
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 items-end">
                  <div className="flex-1">
                    <Label htmlFor="bus-select">Bus Route</Label>
                    <Select value={selectedBus} onValueChange={setSelectedBus}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a bus route to manage" />
                      </SelectTrigger>
                      <SelectContent>
                        {buses.map((bus) => (
                          <SelectItem key={bus.route_code} value={bus.route_code}>
                            {bus.name} ({bus.route_code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {selectedBus && (
                    <Button 
                      onClick={() => {
                        setIsCreating(true);
                        setFormData(prev => ({ ...prev, route_code: selectedBus, stop_order: getNextStopOrder() }));
                      }}
                      className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Stop
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Create Form */}
          {isCreating && selectedBus && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-6"
            >
              <Card>
                <CardHeader>
                  <CardTitle>Add New Route Stop</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="stop-name">Stop Name</Label>
                      <Input
                        id="stop-name"
                        value={formData.stop_name}
                        onChange={(e) => setFormData({ ...formData, stop_name: e.target.value })}
                        placeholder="e.g., Kottayam"
                      />
                    </div>
                    <div>
                      <Label htmlFor="fare">Fare (₹)</Label>
                      <Input
                        id="fare"
                        type="number"
                        min="0"
                        step="1"
                        value={formData.fare}
                        onChange={(e) => setFormData({ ...formData, fare: parseInt(e.target.value) || 0 })}
                        placeholder="50"
                      />
                    </div>
                    <div>
                      <Label htmlFor="stop-order">Stop Order</Label>
                      <Input
                        id="stop-order"
                        type="number"
                        min="1"
                        value={formData.stop_order}
                        onChange={(e) => setFormData({ ...formData, stop_order: parseInt(e.target.value) || 1 })}
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 mt-4">
                    <Switch
                      id="is-active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                    <Label htmlFor="is-active">Active</Label>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button onClick={handleCreate}>
                      <Save className="w-4 h-4 mr-2" />
                      Add Stop
                    </Button>
                    <Button variant="outline" onClick={() => setIsCreating(false)}>
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Edit Form */}
          {editingStop && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-6"
            >
              <Card>
                <CardHeader>
                  <CardTitle>Edit Route Stop</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="edit-stop-name">Stop Name</Label>
                      <Input
                        id="edit-stop-name"
                        value={editingStop.stop_name}
                        onChange={(e) => setEditingStop({ ...editingStop, stop_name: e.target.value })}
                        placeholder="e.g., Kottayam"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-fare">Fare (₹)</Label>
                      <Input
                        id="edit-fare"
                        type="number"
                        min="0"
                        step="1"
                        value={editingStop.fare}
                        onChange={(e) => setEditingStop({ ...editingStop, fare: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-stop-order">Stop Order</Label>
                      <Input
                        id="edit-stop-order"
                        type="number"
                        min="1"
                        value={editingStop.stop_order}
                        onChange={(e) => setEditingStop({ ...editingStop, stop_order: parseInt(e.target.value) || 1 })}
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 mt-4">
                    <Switch
                      id="edit-is-active"
                      checked={editingStop.is_active}
                      onCheckedChange={(checked) => setEditingStop({ ...editingStop, is_active: checked })}
                    />
                    <Label htmlFor="edit-is-active">Active</Label>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button onClick={handleUpdate}>
                      <Save className="w-4 h-4 mr-2" />
                      Update Stop
                    </Button>
                    <Button variant="outline" onClick={() => setEditingStop(null)}>
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Route Stops List */}
          {selectedBus && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Route Stops - {buses.find(b => b.route_code === selectedBus)?.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {routeStops.length > 0 ? (
                    <div className="space-y-4">
                      {routeStops.map((stop, index) => (
                        <motion.div
                          key={stop.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                        >
                          <div className="flex items-center gap-4">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-100 text-red-600 font-semibold text-sm">
                              {stop.stop_order}
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-800">{stop.stop_name}</h4>
                              <div className="flex items-center gap-4 text-sm text-gray-600">
                                <span className="flex items-center gap-1">
                                  <DollarSign className="w-3 h-3" />
                                  ₹{stop.fare}
                                </span>
                                <Badge variant={stop.is_active ? "default" : "secondary"} className="text-xs">
                                  {stop.is_active ? "Active" : "Inactive"}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingStop(stop)}
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 border-red-600 hover:bg-red-50"
                              onClick={() => handleDelete(stop.id!)}
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <MapPin className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-semibold text-gray-600 mb-2">No stops found</h3>
                      <p className="text-gray-500 mb-4">Add stops to this route to get started</p>
                      <Button 
                        onClick={() => {
                          setIsCreating(true);
                          setFormData(prev => ({ ...prev, route_code: selectedBus, stop_order: getNextStopOrder() }));
                        }}
                        className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add First Stop
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* No Bus Selected */}
          {!selectedBus && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-center py-12"
            >
              <Route className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">Select a Bus Route</h3>
              <p className="text-gray-500">Choose a bus route above to manage its stops and fares</p>
            </motion.div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}

export default withAdminAuth(RouteManagement); 