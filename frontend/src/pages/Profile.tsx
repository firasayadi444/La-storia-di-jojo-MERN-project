import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { 
  User, 
  Edit3, 
  Save, 
  X, 
  Calendar,
  CheckCircle,
  Shield,
  Trash2,
  AlertTriangle
} from 'lucide-react';


const Profile: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState({ name: '', email: '', phone: '', address: '' });
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setProfile({ name: user.name, email: user.email, phone: user.phone || '', address: user.address || '' });
    }
  }, [user]);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleProfileSave = async () => {
    setLoading(true);
    try {
      const res = await apiService.updateProfile(profile);
      if (res.user) {
        localStorage.setItem('user', JSON.stringify(res.user));
        refreshUser();
      }
      toast({ title: 'Profile updated successfully!', description: 'Your profile has been updated.' });
      setIsEditing(false);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to update profile', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    try {
      // Note: You'll need to implement this API endpoint in your backend
      await apiService.deleteAccount();
      
      // Clear user data and redirect
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      toast({ 
        title: 'Account Deleted', 
        description: 'Your account has been permanently deleted.',
        variant: 'destructive'
      });
      
      // Redirect to home page
      window.location.href = '/';
    } catch (error: any) {
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to delete account', 
        variant: 'destructive' 
      });
    } finally {
      setDeleteLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-italian-cream-50 to-white py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
              <p className="text-gray-600 mt-1">Manage your account settings and preferences</p>
            </div>
            <Badge variant="outline" className="text-italian-green-600 border-italian-green-200">
              <CheckCircle className="h-3 w-3 mr-1" />
              Verified Account
            </Badge>
          </div>
        </div>

        {/* Profile Overview Card */}
        <Card className="mb-8 overflow-hidden">
          <div className="bg-gradient-to-r from-italian-green-500 to-italian-green-600 p-6 text-white">
            <div className="flex items-center space-x-6">
              <Avatar className="h-20 w-20 border-4 border-white">
                <AvatarImage src="" alt={profile.name} />
                <AvatarFallback className="text-2xl font-bold bg-white text-italian-green-600">
                  {getInitials(profile.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-2xl font-bold">{profile.name}</h2>
                <p className="text-italian-green-100">{profile.email}</p>
                <div className="flex items-center mt-2 space-x-4">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm">Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>


        {/* Profile Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input 
                  id="name" 
                  name="name" 
                  value={profile.name} 
                  onChange={handleProfileChange}
                  disabled={!isEditing}
                  className={!isEditing ? 'bg-gray-50' : ''}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input 
                  id="email" 
                  name="email" 
                  type="email"
                  value={profile.email} 
                  onChange={handleProfileChange}
                  disabled={!isEditing}
                  className={!isEditing ? 'bg-gray-50' : ''}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input 
                  id="phone" 
                  name="phone" 
                  value={profile.phone} 
                  onChange={handleProfileChange}
                  disabled={!isEditing}
                  className={!isEditing ? 'bg-gray-50' : ''}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input 
                  id="address" 
                  name="address" 
                  value={profile.address} 
                  onChange={handleProfileChange}
                  disabled={!isEditing}
                  className={!isEditing ? 'bg-gray-50' : ''}
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              {!isEditing ? (
                <Button onClick={() => setIsEditing(true)} className="bg-italian-green-600 hover:bg-italian-green-700">
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              ) : (
                <>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button onClick={handleProfileSave} disabled={loading} className="bg-italian-green-600 hover:bg-italian-green-700">
                    <Save className="h-4 w-4 mr-2" />
                    {loading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Change Password Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              Change Password
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Want to change your password? Click the button below to update it.
              </p>
              <Button asChild className="bg-italian-green-600 hover:bg-italian-green-700">
                <a href="/change-password">Change Password</a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Delete Account Section */}
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center text-red-700">
              <Trash2 className="h-5 w-5 mr-2" />
              Delete Account
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-red-100 rounded-lg border border-red-200">
                <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="font-semibold text-red-800 mb-2">⚠️ Permanent Action</h4>
                  <p className="text-sm text-red-700 mb-2">
                    Deleting your account will permanently remove all your data, order history, and preferences. 
                    This action cannot be undone.
                  </p>
                  <ul className="text-xs text-red-600 space-y-1">
                    <li>• All your orders and order history will be deleted</li>
                    <li>• Your profile information will be permanently removed</li>
                    <li>• You will no longer be able to access this account</li>
                  </ul>
                </div>
              </div>
              
              {!showDeleteConfirm ? (
                <Button 
                  variant="destructive" 
                  onClick={() => setShowDeleteConfirm(true)}
                  className="bg-red-600 hover:bg-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete My Account
                </Button>
              ) : (
                <div className="space-y-3 p-4 bg-white rounded-lg border border-red-200">
                  <h4 className="font-semibold text-red-800">Are you absolutely sure?</h4>
                  <p className="text-sm text-gray-600">
                    Type <strong className="text-red-600">DELETE</strong> in the box below to confirm account deletion.
                  </p>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button 
                      variant="destructive" 
                      onClick={handleDeleteAccount}
                      disabled={deleteLoading}
                      className="flex-1 bg-red-600 hover:bg-red-700"
                    >
                      {deleteLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Deleting...
                        </>
                      ) : (
                        <>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Yes, Delete Account
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile; 