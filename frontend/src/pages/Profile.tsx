import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface Address {
  _id?: string;
  label: string;
  address: string;
  googleMapLink?: string;
  isDefault?: boolean;
}

const Profile: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState({ name: '', email: '', phone: '', address: '' });
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [newAddress, setNewAddress] = useState<Address>({ label: '', address: '', googleMapLink: '', isDefault: false });
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [loading, setLoading] = useState(false);

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
      toast({ title: 'Profile updated!' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to update profile', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewAddress({ ...newAddress, [e.target.name]: e.target.value });
  };

  const handleAddAddress = async () => {
    if (!newAddress.label || !newAddress.address) return;
    setLoading(true);
    try {
      await apiService.addAddress(newAddress);
      toast({ title: 'Address added!' });
      setNewAddress({ label: '', address: '', googleMapLink: '', isDefault: false });
      refreshUser();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to add address', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleEditAddress = (address: Address) => {
    setEditingAddress(address);
  };

  const handleUpdateAddress = async () => {
    if (!editingAddress || !editingAddress._id) return;
    setLoading(true);
    try {
      await apiService.updateAddress(editingAddress._id, editingAddress);
      toast({ title: 'Address updated!' });
      setEditingAddress(null);
      refreshUser();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to update address', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    setLoading(true);
    try {
      await apiService.deleteAddress(addressId);
      toast({ title: 'Address deleted!' });
      refreshUser();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to delete address', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefault = async (address: Address) => {
    if (!address._id) return;
    setLoading(true);
    try {
      await apiService.updateAddress(address._id, { ...address, isDefault: true });
      toast({ title: 'Default address set!' });
      refreshUser();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to set default address', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-italian-cream-50 to-white py-8">
      <div className="max-w-2xl mx-auto px-4">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" value={profile.name} onChange={handleProfileChange} />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" value={profile.email} onChange={handleProfileChange} />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" name="phone" value={profile.phone} onChange={handleProfileChange} />
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Input id="address" name="address" value={profile.address} onChange={handleProfileChange} />
              </div>
              <Button onClick={handleProfileSave} disabled={loading} className="btn-gradient text-white mt-2">Save Profile</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
          </CardHeader>
          <CardContent>
            <Button asChild className="btn-gradient text-white mt-2">
              <a href="/change-password">Change Password</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile; 