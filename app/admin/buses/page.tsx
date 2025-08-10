'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { PageTransition } from '@/components/ui/page-transition';
import { useAdmin, withAdminAuth } from '@/contexts/AdminContext';
import { Bus, Plus, Edit, Trash2, Save, X, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import Link from 'next/link';

interface BusData {
  id?: number;
  name: string;
  route_code: string;
  available_seats?: number;
  total_seats?: number;
  is_active: boolean;
}

function BusManagement() {
  const { user } = useAdmin();
  const [buses, setBuses] = useState<BusData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingBus, setEditingBus] = useState<BusData | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<BusData>({
    name: '',
    route_code: '',
    available_seats: 10,
    total_seats: 10,
    is_active: true
  });

  useEffect(() => {
    fetchBuses();
  }, []);

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
      toast.error('Failed to fetch buses');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      const response = await fetch('/api/admin/buses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
        credentials: 'include'
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success('Bus created successfully');
        setBuses([...buses, result.data]);
        setIsCreating(false);
        setFormData({ name: '', route_code: '', available_seats: 10, total_seats: 10, is_active: true });
      } else {
        toast.error(result.error || 'Failed to create bus');
      }
    } catch (error) {
      toast.error('Failed to create bus');
    }
  };

  const handleUpdate = async () => {
    if (!editingBus) return;

    try {
      const response = await fetch('/api/admin/buses', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingBus),
        credentials: 'include'
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success('Bus updated successfully');
        setBuses(buses.map(bus => bus.id === editingBus.id ? result.data : bus));
        setEditingBus(null);
      } else {
        toast.error(result.error || 'Failed to update bus');
      }
    } catch (error) {
      toast.error('Failed to update bus');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this bus? This will also delete all associated route stops.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/buses?id=${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success('Bus deleted successfully');
        setBuses(buses.filter(bus => bus.id !== id));
      } else {
        toast.error(result.error || 'Failed to delete bus');
      }
    } catch (error) {
      toast.error('Failed to delete bus');
    }
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
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Bus Management</h1>
                <p className="text-gray-600">Manage your bus fleet</p>
              </div>
            </div>
            <Button 
              onClick={() => setIsCreating(true)}
              className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New Bus
            </Button>
          </motion.div>

          {/* Create Form */}
          {isCreating && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-6"
            >
              <Card>
                <CardHeader>
                  <CardTitle>Create New Bus</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <Label htmlFor="name">Bus Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., Bus 1 - Kottayam Route"
                      />
                    </div>
                    <div>
                      <Label htmlFor="route_code">Route Code</Label>
                      <Input
                        id="route_code"
                        value={formData.route_code}
                        onChange={(e) => setFormData({ ...formData, route_code: e.target.value })}
                        placeholder="e.g., bus-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="total_seats">Total Seats</Label>
                      <Input
                        id="total_seats"
                        type="number"
                        min="1"
                        max="200"
                        value={formData.total_seats}
                        onChange={(e) => setFormData({ ...formData, total_seats: parseInt(e.target.value) || 10 })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="available_seats">Available Seats</Label>
                      <Input
                        id="available_seats"
                        type="number"
                        min="0"
                        max="200"
                        value={formData.available_seats}
                        onChange={(e) => setFormData({ ...formData, available_seats: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="is_active"
                        checked={formData.is_active}
                        onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                      />
                      <Label htmlFor="is_active">Active</Label>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button onClick={handleCreate}>
                      <Save className="w-4 h-4 mr-2" />
                      Create Bus
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
          {editingBus && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-6"
            >
              <Card>
                <CardHeader>
                  <CardTitle>Edit Bus</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <Label htmlFor="edit-name">Bus Name</Label>
                      <Input
                        id="edit-name"
                        value={editingBus.name}
                        onChange={(e) => setEditingBus({ ...editingBus, name: e.target.value })}
                        placeholder="e.g., Bus 1 - Kottayam Route"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-route_code">Route Code</Label>
                      <Input
                        id="edit-route_code"
                        value={editingBus.route_code}
                        disabled
                        className="bg-gray-100"
                        title="Route code cannot be changed"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-total_seats">Total Seats</Label>
                      <Input
                        id="edit-total_seats"
                        type="number"
                        min="1"
                        max="200"
                        value={editingBus.total_seats}
                        onChange={(e) => setEditingBus({ ...editingBus, total_seats: parseInt(e.target.value) || 10 })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-available_seats">Available Seats</Label>
                      <Input
                        id="edit-available_seats"
                        type="number"
                        min="0"
                        max="200"
                        value={editingBus.available_seats}
                        onChange={(e) => setEditingBus({ ...editingBus, available_seats: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="edit-is_active"
                        checked={editingBus.is_active}
                        onCheckedChange={(checked) => setEditingBus({ ...editingBus, is_active: checked })}
                      />
                      <Label htmlFor="edit-is_active">Active</Label>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button onClick={handleUpdate}>
                      <Save className="w-4 h-4 mr-2" />
                      Update Bus
                    </Button>
                    <Button variant="outline" onClick={() => setEditingBus(null)}>
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Buses List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {buses.map((bus, index) => (
              <motion.div
                key={bus.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{bus.name}</CardTitle>
                        <p className="text-sm text-gray-600">{bus.route_code}</p>
                      </div>
                      <Badge variant={bus.is_active ? "default" : "secondary"}>
                        {bus.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Total Seats:</span>
                        <Badge variant="outline" className="font-semibold">
                          {bus.total_seats ?? 50}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Available Seats:</span>
                        <Badge variant="outline" className="font-semibold">
                          {bus.available_seats ?? 0}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingBus(bus)}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 border-red-600 hover:bg-red-50"
                        onClick={() => handleDelete(bus.id!)}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {buses.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="text-center py-12"
            >
              <Bus className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No buses found</h3>
              <p className="text-gray-500 mb-4">Get started by adding your first bus</p>
              <Button 
                onClick={() => setIsCreating(true)}
                className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add New Bus
              </Button>
            </motion.div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}

export default withAdminAuth(BusManagement);
