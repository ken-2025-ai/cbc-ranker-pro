import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { 
  Smartphone, 
  Monitor, 
  Tablet,
  Search,
  RefreshCw,
  Ban,
  CheckCircle,
  Clock,
  MapPin,
  Calendar,
  Wifi,
  WifiOff
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Device {
  id: string;
  device_id: string;
  device_name: string;
  device_type: string;
  institution_id: string;
  institution_name: string;
  last_active: string;
  is_active: boolean;
  registered_at: string;
  ip_address: string | null;
  location: string | null;
}

const SupportDevices = () => {
  const { toast } = useToast();
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    try {
      setLoading(true);
      // Mock data - replace with actual query when device tracking is implemented
      const mockDevices: Device[] = [
        {
          id: '1',
          device_id: 'dev_001',
          device_name: 'Chrome - Windows 10',
          device_type: 'desktop',
          institution_id: 'inst_001',
          institution_name: 'ABC Primary School',
          last_active: new Date().toISOString(),
          is_active: true,
          registered_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          ip_address: '192.168.1.100',
          location: 'Nairobi, Kenya'
        },
        {
          id: '2',
          device_id: 'dev_002',
          device_name: 'Safari - iOS 16',
          device_type: 'mobile',
          institution_id: 'inst_001',
          institution_name: 'ABC Primary School',
          last_active: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          is_active: true,
          registered_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
          ip_address: '41.90.123.45',
          location: 'Mombasa, Kenya'
        },
        {
          id: '3',
          device_id: 'dev_003',
          device_name: 'Firefox - Windows 11',
          device_type: 'desktop',
          institution_id: 'inst_002',
          institution_name: 'XYZ Secondary School',
          last_active: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          is_active: false,
          registered_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
          ip_address: '197.248.10.20',
          location: 'Kisumu, Kenya'
        }
      ];
      
      setDevices(mockDevices);
    } catch (error) {
      console.error('Error fetching devices:', error);
      toast({
        title: "Error",
        description: "Failed to fetch devices",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleDeviceStatus = async (deviceId: string) => {
    try {
      // Implementation for toggling device status
      toast({
        title: "Success",
        description: "Device status updated"
      });
      fetchDevices();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update device status",
        variant: "destructive"
      });
    }
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'mobile':
        return <Smartphone className="w-4 h-4" />;
      case 'tablet':
        return <Tablet className="w-4 h-4" />;
      default:
        return <Monitor className="w-4 h-4" />;
    }
  };

  const getLastActiveText = (lastActive: string) => {
    const now = new Date();
    const last = new Date(lastActive);
    const diffMs = now.getTime() - last.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const filteredDevices = devices.filter(device =>
    device.device_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    device.institution_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    device.device_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: devices.length,
    active: devices.filter(d => d.is_active).length,
    inactive: devices.filter(d => !d.is_active).length,
    mobile: devices.filter(d => d.device_type === 'mobile').length,
    desktop: devices.filter(d => d.device_type === 'desktop').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Device Management</h1>
          <p className="text-muted-foreground">Monitor and manage registered devices across institutions</p>
        </div>
        <Button onClick={fetchDevices} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Devices</CardTitle>
            <Monitor className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Wifi className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats.active}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive</CardTitle>
            <WifiOff className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">{stats.inactive}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mobile</CardTitle>
            <Smartphone className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{stats.mobile}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Desktop</CardTitle>
            <Monitor className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-500">{stats.desktop}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>Search Devices</CardTitle>
          <CardDescription>Filter devices by name, institution, or device ID</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search devices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </CardContent>
      </Card>

      {/* Devices Table */}
      <Card>
        <CardHeader>
          <CardTitle>Registered Devices ({filteredDevices.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
            </div>
          ) : filteredDevices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No devices found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Device</TableHead>
                  <TableHead>Institution</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Registered</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDevices.map((device) => (
                  <TableRow key={device.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getDeviceIcon(device.device_type)}
                        <div>
                          <div className="font-medium">{device.device_name}</div>
                          <div className="text-xs text-muted-foreground font-mono">{device.device_id}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{device.institution_name}</TableCell>
                    <TableCell>
                      {device.is_active ? (
                        <Badge className="bg-green-600">
                          <Wifi className="w-3 h-3 mr-1" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <WifiOff className="w-3 h-3 mr-1" />
                          Inactive
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        {getLastActiveText(device.last_active)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <MapPin className="w-3 h-3 text-muted-foreground" />
                        {device.location || 'Unknown'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="w-3 h-3 text-muted-foreground" />
                        {new Date(device.registered_at).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleDeviceStatus(device.id)}
                      >
                        {device.is_active ? (
                          <><Ban className="w-3 h-3 mr-1" /> Block</>
                        ) : (
                          <><CheckCircle className="w-3 h-3 mr-1" /> Activate</>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SupportDevices;
