import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    address: '',
    phone: '',
    vehicleType: '',
    vehiclePhoto: null as File | null,
    facePhoto: null as File | null,
    cinPhoto: null as File | null
  });
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isDeliveryMan, setIsDeliveryMan] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleDeliveryManSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append('name', formData.name);
    fd.append('email', formData.email);
    fd.append('phone', formData.phone || '');
    fd.append('vehicleType', formData.vehicleType);
    if (formData.vehiclePhoto) fd.append('vehiclePhoto', formData.vehiclePhoto);
    if (formData.facePhoto) fd.append('facePhoto', formData.facePhoto);
    if (formData.cinPhoto) fd.append('cinPhoto', formData.cinPhoto);
    // Call backend endpoint for delivery man application
    try {
      await fetch('/api/deliveryman/apply', {
        method: 'POST',
        body: fd,
      });
      setSubmitted(true);
    } catch (error) {
      // handle error
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Password mismatch",
        description: "Passwords do not match. Please try again.",
        variant: "destructive"
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const success = await register(formData.name, formData.email, formData.password, formData.confirmPassword, formData.address);
      if (success) {
        toast({
          title: "Account created!",
          description: "Welcome to FoodieDelight! You can now start ordering.",
        });
        navigate('/');
      } else {
        toast({
          title: "Registration failed",
          description: "An error occurred during registration. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Registration failed",
        description: error.message || "An error occurred during registration. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-food-teal-50 to-food-orange-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-scale-in">
        <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
          <CardHeader className="text-center pb-6">
            <div className="w-16 h-16 bg-gradient-secondary rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-2xl">F</span>
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">Join FoodieDelight</CardTitle>
            <CardDescription className="text-gray-600">
              Create your account to start ordering delicious food
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="mb-4 flex items-center gap-2">
              <input type="checkbox" id="isDeliveryMan" checked={isDeliveryMan} onChange={e => setIsDeliveryMan(e.target.checked)} />
              <Label htmlFor="isDeliveryMan">Apply as Delivery Man</Label>
            </div>
            {isDeliveryMan ? (
              submitted ? (
                <div className="text-green-600 font-bold mt-4">You will be notified after acceptance.</div>
              ) : (
                <form onSubmit={handleDeliveryManSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" name="name" type="text" value={formData.name} onChange={handleChange} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" name="phone" type="text" value={formData.phone} onChange={handleChange} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vehicleType">Vehicle Type (bike/car)</Label>
                    <Input id="vehicleType" name="vehicleType" type="text" value={formData.vehicleType} onChange={handleChange} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Vehicle Photo</Label>
                    <Input type="file" accept="image/*" required onChange={e => setFormData(prev => ({ ...prev, vehiclePhoto: e.target.files?.[0] || null }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Face Photo</Label>
                    <Input type="file" accept="image/*" required onChange={e => setFormData(prev => ({ ...prev, facePhoto: e.target.files?.[0] || null }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>CIN Card Photo</Label>
                    <Input type="file" accept="image/*" required onChange={e => setFormData(prev => ({ ...prev, cinPhoto: e.target.files?.[0] || null }))} />
                  </div>
                  <Button type="submit" className="w-full btn-gradient text-white py-3 text-lg font-semibold mt-6">Submit Application</Button>
                </form>
              )
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                    Full Name
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-food-teal-500 focus:border-transparent"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-food-teal-500 focus:border-transparent"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                    Password
                  </Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Create a password"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-food-teal-500 focus:border-transparent"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                    Confirm Password
                  </Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm your password"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-food-teal-500 focus:border-transparent"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="address" className="text-sm font-medium text-gray-700">
                    Address (Optional)
                  </Label>
                  <Input
                    id="address"
                    name="address"
                    type="text"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Enter your delivery address"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-food-teal-500 focus:border-transparent"
                  />
                </div>
                
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-secondary text-white py-2 px-4 rounded-md font-medium hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50"
                >
                  {isLoading ? 'Creating Account...' : 'Create Account'}
                </Button>
              </form>
            )}
            
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link to="/login" className="text-food-teal-600 hover:text-food-teal-700 font-medium">
                  Sign in here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Register;
