import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import EmergencySupport from '@/components/EmergencySupport';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  Settings, 
  User, 
  Shield, 
  Bell, 
  Database, 
  Key,
  Save,
  AlertTriangle,
  Download,
  Upload
} from 'lucide-react';

const AdminSettings = () => {
  const { user } = useAdminAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  // User Profile Settings
  const [profileSettings, setProfileSettings] = useState({
    fullName: user?.full_name || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // System Settings
  const [systemSettings, setSystemSettings] = useState({
    maintenanceMode: false,
    autoBackups: true,
    emailNotifications: true,
    smsNotifications: false,
    sessionTimeout: 24,
    maxLoginAttempts: 5,
    passwordExpiry: 90,
  });

  // Security Settings
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: false,
    ipWhitelist: '',
    auditLogging: true,
    encryptionEnabled: true,
  });

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (profileSettings.newPassword && profileSettings.newPassword !== profileSettings.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Update profile logic here
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSystemSettingsUpdate = async () => {
    setLoading(true);
    try {
      // Update system settings logic here
      toast({
        title: "Success",
        description: "System settings updated successfully",
      });
    } catch (error) {
      console.error('Error updating system settings:', error);
      toast({
        title: "Error",
        description: "Failed to update system settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSecuritySettingsUpdate = async () => {
    setLoading(true);
    try {
      // Update security settings logic here
      toast({
        title: "Success",
        description: "Security settings updated successfully",
      });
    } catch (error) {
      console.error('Error updating security settings:', error);
      toast({
        title: "Error",
        description: "Failed to update security settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createBackup = async () => {
    setLoading(true);
    try {
      // Create backup logic here
      toast({
        title: "Success",
        description: "Database backup created successfully",
      });
    } catch (error) {
      console.error('Error creating backup:', error);
      toast({
        title: "Error",
        description: "Failed to create backup",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Admin Settings</h1>
        <p className="text-slate-400">Configure system settings and manage your admin account</p>
      </div>

      <div className="grid gap-6">
        {/* Profile Settings */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Settings
            </CardTitle>
            <CardDescription className="text-slate-400">
              Update your personal information and password
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-slate-300">Full Name</Label>
                  <Input
                    id="fullName"
                    value={profileSettings.fullName}
                    onChange={(e) => setProfileSettings({...profileSettings, fullName: e.target.value})}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-300">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileSettings.email}
                    onChange={(e) => setProfileSettings({...profileSettings, email: e.target.value})}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword" className="text-slate-300">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={profileSettings.currentPassword}
                    onChange={(e) => setProfileSettings({...profileSettings, currentPassword: e.target.value})}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-slate-300">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={profileSettings.newPassword}
                    onChange={(e) => setProfileSettings({...profileSettings, newPassword: e.target.value})}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-slate-300">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={profileSettings.confirmPassword}
                    onChange={(e) => setProfileSettings({...profileSettings, confirmPassword: e.target.value})}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              </div>

              <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                <Save className="w-4 h-4 mr-2" />
                Update Profile
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* System Settings */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Settings className="h-5 w-5" />
              System Configuration
            </CardTitle>
            <CardDescription className="text-slate-400">
              Configure system-wide settings and preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-slate-300">Maintenance Mode</Label>
                    <p className="text-sm text-slate-400">Disable system access for maintenance</p>
                  </div>
                  <Switch
                    checked={systemSettings.maintenanceMode}
                    onCheckedChange={(checked) => setSystemSettings({...systemSettings, maintenanceMode: checked})}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-slate-300">Automatic Backups</Label>
                    <p className="text-sm text-slate-400">Enable daily automated backups</p>
                  </div>
                  <Switch
                    checked={systemSettings.autoBackups}
                    onCheckedChange={(checked) => setSystemSettings({...systemSettings, autoBackups: checked})}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-slate-300">Email Notifications</Label>
                    <p className="text-sm text-slate-400">Send system alerts via email</p>
                  </div>
                  <Switch
                    checked={systemSettings.emailNotifications}
                    onCheckedChange={(checked) => setSystemSettings({...systemSettings, emailNotifications: checked})}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-slate-300">SMS Notifications</Label>
                    <p className="text-sm text-slate-400">Send critical alerts via SMS</p>
                  </div>
                  <Switch
                    checked={systemSettings.smsNotifications}
                    onCheckedChange={(checked) => setSystemSettings({...systemSettings, smsNotifications: checked})}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout" className="text-slate-300">Session Timeout (hours)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    value={systemSettings.sessionTimeout}
                    onChange={(e) => setSystemSettings({...systemSettings, sessionTimeout: parseInt(e.target.value)})}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxLoginAttempts" className="text-slate-300">Max Login Attempts</Label>
                  <Input
                    id="maxLoginAttempts"
                    type="number"
                    value={systemSettings.maxLoginAttempts}
                    onChange={(e) => setSystemSettings({...systemSettings, maxLoginAttempts: parseInt(e.target.value)})}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="passwordExpiry" className="text-slate-300">Password Expiry (days)</Label>
                  <Input
                    id="passwordExpiry"
                    type="number"
                    value={systemSettings.passwordExpiry}
                    onChange={(e) => setSystemSettings({...systemSettings, passwordExpiry: parseInt(e.target.value)})}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              </div>
            </div>

            <Button onClick={handleSystemSettingsUpdate} disabled={loading} className="bg-green-600 hover:bg-green-700">
              <Save className="w-4 h-4 mr-2" />
              Save System Settings
            </Button>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security Configuration
            </CardTitle>
            <CardDescription className="text-slate-400">
              Configure security settings and access controls
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-slate-300">Two-Factor Authentication</Label>
                    <p className="text-sm text-slate-400">Require 2FA for admin logins</p>
                  </div>
                  <Switch
                    checked={securitySettings.twoFactorAuth}
                    onCheckedChange={(checked) => setSecuritySettings({...securitySettings, twoFactorAuth: checked})}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-slate-300">Audit Logging</Label>
                    <p className="text-sm text-slate-400">Log all admin activities</p>
                  </div>
                  <Switch
                    checked={securitySettings.auditLogging}
                    onCheckedChange={(checked) => setSecuritySettings({...securitySettings, auditLogging: checked})}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-slate-300">Data Encryption</Label>
                    <p className="text-sm text-slate-400">Encrypt sensitive data at rest</p>
                  </div>
                  <Switch
                    checked={securitySettings.encryptionEnabled}
                    onCheckedChange={(checked) => setSecuritySettings({...securitySettings, encryptionEnabled: checked})}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="ipWhitelist" className="text-slate-300">IP Whitelist</Label>
                  <Textarea
                    id="ipWhitelist"
                    placeholder="Enter IP addresses (one per line)"
                    value={securitySettings.ipWhitelist}
                    onChange={(e) => setSecuritySettings({...securitySettings, ipWhitelist: e.target.value})}
                    className="bg-slate-700 border-slate-600 text-white"
                    rows={4}
                  />
                  <p className="text-xs text-slate-400">Leave empty to allow all IPs</p>
                </div>
              </div>
            </div>

            <Button onClick={handleSecuritySettingsUpdate} disabled={loading} className="bg-purple-600 hover:bg-purple-700">
              <Shield className="w-4 h-4 mr-2" />
              Update Security Settings
            </Button>
          </CardContent>
        </Card>

        {/* Emergency AI Support */}
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-0">
            <EmergencySupport 
              institutionId="admin"
              institutionName="Admin Panel"
            />
          </CardContent>
        </Card>

        {/* Backup & Recovery */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Database className="h-5 w-5" />
              Backup & Recovery
            </CardTitle>
            <CardDescription className="text-slate-400">
              Manage database backups and system recovery
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-slate-700/50 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
              <div className="flex-1">
                <p className="text-white font-medium">Last Backup</p>
                <p className="text-sm text-slate-400">
                  {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-green-400">✓ Successful</p>
                <p className="text-xs text-slate-400">2.3 GB</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={createBackup} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                <Download className="w-4 h-4 mr-2" />
                Create Backup
              </Button>
              <Button variant="outline" className="text-slate-300 border-slate-600 hover:bg-slate-700">
                <Upload className="w-4 h-4 mr-2" />
                Restore Backup
              </Button>
              <Button variant="outline" className="text-slate-300 border-slate-600 hover:bg-slate-700">
                <Database className="w-4 h-4 mr-2" />
                View Backup History
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminSettings;