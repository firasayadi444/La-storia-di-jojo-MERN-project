import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import StripePayment from '@/components/StripePayment';
import { CheckCircle, CreditCard, Banknote, ArrowLeft, Shield, Clock, MapPin, User, Phone, Mail, Sparkles } from 'lucide-react';

const Checkout: React.FC = () => {
  const { items, getTotalPrice, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [orderData, setOrderData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    address: user?.address || '',
    phone: user?.phone || '',
    notes: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash'>('card');
  const [orderId, setOrderId] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [customerLocation, setCustomerLocation] = useState<{ lat: number; lng: number; accuracy?: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'pending'>('pending');
  const [manualLocation, setManualLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [showManualLocation, setShowManualLocation] = useState<boolean>(false);
  const [locationRetryCount, setLocationRetryCount] = useState<number>(0);

  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  if (user?.role !== 'user') {
    navigate('/');
    return null;
  }

  if (items.length === 0) {
    navigate('/cart');
    return null;
  }

  const total = getTotalPrice();

  // Automatically request location on component mount
  useEffect(() => {
    requestLocation();
    
    // Fallback: show manual location dialog after 10 seconds if no location is obtained
    // Only show if phone number is provided (validation order: Phone → Location)
    const fallbackTimer = setTimeout(() => {
      if (locationPermission !== 'granted' && !getCurrentLocation() && orderData.phone?.trim()) {
        setShowManualLocation(true);
      }
    }, 10000);
    
    return () => clearTimeout(fallbackTimer);
  }, []);

  // Monitor location state changes
  useEffect(() => {
    if (hasLocation()) {
      console.log('Location available:', getCurrentLocation());
      // Force UI update by triggering a re-render
      setLocationPermission('granted');
      // Close manual location dialog if GPS location is captured
      setShowManualLocation(false);
    }
  }, [customerLocation, manualLocation]);

  // Update phone number when user data changes
  useEffect(() => {
    if (user?.phone && !orderData.phone) {
      setOrderData(prev => ({
        ...prev,
        phone: user.phone
      }));
    }
  }, [user?.phone, orderData.phone]);


  const requestLocation = () => {
    // Check if we're on a secure origin (HTTPS or localhost)
    const isSecureOrigin = window.location.protocol === 'https:' || 
                          window.location.hostname === 'localhost' || 
                          window.location.hostname === '127.0.0.1' ||
                          window.location.hostname === '::1';
    
    // For development, allow localhost even on HTTP
    const isLocalhost = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1' ||
                       window.location.hostname === '::1';
    
    if (!isSecureOrigin && !isLocalhost) {
      setLocationPermission('denied');
      setLocationError('Location access requires HTTPS. Please use a secure connection or enter location manually.');
      // Only show manual location dialog if phone number is provided
      if (orderData.phone?.trim()) {
        setShowManualLocation(true);
      }
      return;
    }
    
    if (navigator.geolocation) {
      setLocationPermission('pending');
      
      try {
        navigator.geolocation.getCurrentPosition(
        (position) => {
          const accuracy = position.coords.accuracy;
          const isAccurateEnough = accuracy <= 500; // Within 500 meters (more flexible)
          
          // Debug logging
          console.log('GPS Position received:', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude,
            speed: position.coords.speed,
            heading: position.coords.heading
          });
          
          setCustomerLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
          setLocationPermission('granted');
          setLocationError(null);
          // Close manual location dialog if it's open
          setShowManualLocation(false);
          
          if (!isAccurateEnough) {
            toast({
              title: "Location Captured",
              description: `Location accuracy is ±${Math.round(accuracy)}m. This is acceptable for delivery.`,
              variant: "default"
            });
          } else {
            toast({
              title: "Location Access Granted",
              description: `Your location has been captured (accuracy: ±${Math.round(accuracy)}m)`,
            });
          }
        },
        (error) => {
          setLocationPermission('denied');
          let errorMessage = 'Location access is required for delivery tracking';
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied. Please enable location permissions in your browser settings.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information is unavailable. Please check your GPS settings.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out. Please try again.';
              break;
            default:
              // Check for secure origin error
              if (error.message && error.message.includes('secure origins')) {
                errorMessage = 'Location access requires HTTPS. Please use a secure connection or enter location manually.';
              } else {
                errorMessage = 'An unknown error occurred while retrieving location.';
              }
              break;
          }
          
          setLocationError(errorMessage);
          // Log error details for debugging (only in development)
          if (process.env.NODE_ENV === 'development') {
            console.error('Location error:', {
              code: error?.code || 'unknown',
              message: error?.message || 'No message available',
              timestamp: new Date().toISOString(),
              userAgent: navigator.userAgent
            });
          }
          
          // Only show manual location dialog if location is actually missing
          // Don't show it if phone number is missing
          if (orderData.phone?.trim()) {
            setShowManualLocation(true);
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 300000 // 5 minutes
        }
        );
      } catch (error) {
        console.error('Geolocation API error:', error);
        setLocationPermission('denied');
        setLocationError('Geolocation API error occurred');
        // Only show manual location dialog if phone number is provided
        if (orderData.phone?.trim()) {
          setShowManualLocation(true);
        }
      }
    } else {
      setLocationPermission('denied');
      setLocationError('Geolocation is not supported by this browser');
      // Only show manual location dialog if phone number is provided
      if (orderData.phone?.trim()) {
        setShowManualLocation(true);
      }
    }
  };

  const retryLocation = () => {
    // Check if we're on a secure origin (HTTPS or localhost)
    const isSecureOrigin = window.location.protocol === 'https:' || 
                          window.location.hostname === 'localhost' || 
                          window.location.hostname === '127.0.0.1' ||
                          window.location.hostname === '::1';
    
    // For development, allow localhost even on HTTP
    const isLocalhost = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1' ||
                       window.location.hostname === '::1';
    
    if (!isSecureOrigin && !isLocalhost) {
      setLocationPermission('denied');
      setLocationError('Location access requires HTTPS. Please use a secure connection or enter location manually.');
      // Only show manual location dialog if phone number is provided
      if (orderData.phone?.trim()) {
        setShowManualLocation(true);
      }
      return;
    }
    
    // Prevent excessive retries
    if (locationRetryCount >= 3) {
      // Only show manual location dialog if phone number is provided
      if (orderData.phone?.trim()) {
        setShowManualLocation(true);
      }
      return;
    }
    
    if (navigator.geolocation) {
      setLocationPermission('pending');
      setLocationError(null);
      setLocationRetryCount(prev => prev + 1);
      
      // Increase timeout for retries
      const timeout = Math.min(15000 + (locationRetryCount * 5000), 30000);
      
      try {
        navigator.geolocation.getCurrentPosition(
        (position) => {
          const accuracy = position.coords.accuracy;
          const isAccurateEnough = accuracy <= 500; // More flexible accuracy requirement
          
          setCustomerLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
          setLocationPermission('granted');
          setLocationError(null);
          setLocationRetryCount(0); // Reset retry count on success
          // Close manual location dialog if it's open
          setShowManualLocation(false);
          
          if (!isAccurateEnough) {
            toast({
              title: "Location Updated",
              description: `Location refreshed (accuracy: ±${Math.round(accuracy)}m). This is acceptable for delivery.`,
              variant: "default"
            });
          } else {
            toast({
              title: "Location Updated",
              description: `Location refreshed (accuracy: ±${Math.round(accuracy)}m)`,
            });
          }
        },
        (error) => {
          setLocationPermission('denied');
          let errorMessage = 'Unable to get your location';
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied. Please enable location permissions.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information is unavailable. Please check your GPS.';
              break;
            case error.TIMEOUT:
              errorMessage = `Location request timed out after ${timeout/1000}s. Please try again.`;
              break;
            default:
              // Check for secure origin error
              if (error.message && error.message.includes('secure origins')) {
                errorMessage = 'Location access requires HTTPS. Please use a secure connection or enter location manually.';
              } else {
                errorMessage = 'An unknown error occurred while retrieving location.';
              }
              break;
          }
          
          setLocationError(errorMessage);
          // Log error details for debugging (only in development)
          if (process.env.NODE_ENV === 'development') {
            console.error('Location retry error:', {
              code: error?.code || 'unknown',
              message: error?.message || 'No message available',
              retryCount: locationRetryCount,
              timeout: timeout,
              timestamp: new Date().toISOString()
            });
          }
          
          // Only show manual location dialog if location is actually missing
          // Don't show it if phone number is missing
          if (orderData.phone?.trim()) {
            setShowManualLocation(true);
          }
        },
        {
          enableHighAccuracy: true,
          timeout: timeout,
          maximumAge: 0 // Force fresh location
        }
        );
      } catch (error) {
        console.error('Geolocation retry API error:', error);
        setLocationPermission('denied');
        setLocationError('Geolocation API error occurred during retry');
        // Only show manual location dialog if phone number is provided
        if (orderData.phone?.trim()) {
          setShowManualLocation(true);
        }
      }
    } else {
      setLocationError('Geolocation is not supported by this browser');
      // Only show manual location dialog if phone number is provided
      if (orderData.phone?.trim()) {
        setShowManualLocation(true);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOrderData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleManualLocationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const lat = parseFloat(formData.get('lat') as string);
    const lng = parseFloat(formData.get('lng') as string);
    
    if (isNaN(lat) || isNaN(lng)) {
      toast({
        title: "Invalid Coordinates",
        description: "Please enter valid latitude and longitude values.",
        variant: "destructive"
      });
      return;
    }
    
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      toast({
        title: "Invalid Coordinates",
        description: "Latitude must be between -90 and 90, longitude between -180 and 180.",
        variant: "destructive"
      });
      return;
    }
    
    setManualLocation({ lat, lng });
    setLocationPermission('granted');
    setLocationError(null);
    setShowManualLocation(false);
    
    toast({
      title: "Location Set",
      description: `Manual location set: ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
    });
  };

  const getCurrentLocation = () => {
    return customerLocation || manualLocation;
  };

  const hasLocation = () => {
    const location = getCurrentLocation();
    const hasValidLocation = location && 
                           location.lat && 
                           location.lng && 
                           !isNaN(location.lat) && 
                           !isNaN(location.lng);
    console.log('hasLocation check:', { location, hasValidLocation });
    return hasValidLocation;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if phone number is provided first
    if (!orderData.phone || orderData.phone.trim() === '') {
      toast({
        title: "Phone Number Required",
        description: "Please enter your phone number to place your order",
        variant: "destructive"
      });
      return;
    }
    
    // Check if location is required (only after phone validation passes)
    const currentLocation = getCurrentLocation();
    console.log('Submit check:', { currentLocation, hasLocation: hasLocation() });
    
    if (!currentLocation || !currentLocation.lat || !currentLocation.lng) {
      toast({
        title: "Location Required",
        description: "Please allow location access or enter your location manually to place your order",
        variant: "destructive"
      });
      setShowManualLocation(true);
      return;
    }

    setIsLoading(true);

    try {
      // Create order data for backend
      const orderDataForBackend = {
        items: items.map(item => ({
          food: item.food._id,
          quantity: item.quantity,
          price: item.food.price
        })),
        totalAmount: total,
        deliveryAddress: orderData.address,
        paymentMethod,
        customerLocation: {
          latitude: currentLocation.lat,
          longitude: currentLocation.lng,
          accuracy: customerLocation?.accuracy ? Math.round(customerLocation.accuracy) : 10 // Use GPS accuracy if available, otherwise default to 10m
        }
      };

      // Debug logging
      console.log('Order data being sent to backend:', {
        customerLocation: orderDataForBackend.customerLocation,
        originalAccuracy: customerLocation?.accuracy,
        roundedAccuracy: customerLocation?.accuracy ? Math.round(customerLocation.accuracy) : 10
      });

      // Call backend API to create order
      const response = await apiService.makeOrder(orderDataForBackend);
      
      if (paymentMethod === 'card') {
        // For card payments, show Stripe payment form
        setOrderId(response.order._id);
        setShowPayment(true);
      } else {
        // For cash payments, complete the order
        clearCart();
        toast({
          title: "Order placed successfully!",
          description: `Your order for €${total.toFixed(2)} has been confirmed. You will pay cash on delivery.`,
        });
        navigate('/orders');
      }
    } catch (error: any) {
      toast({
        title: "Order failed",
        description: error.message || "There was an error placing your order. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentSuccess = (order: any) => {
    clearCart();
    setShowPayment(false);
    toast({
      title: "Payment Successful!",
      description: `Your order for €${total.toFixed(2)} has been confirmed and paid.`,
    });
    navigate('/orders');
  };

  const handlePaymentError = (error: string) => {
    toast({
      title: "Payment Failed",
      description: error,
      variant: "destructive"
    });
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles className="h-8 w-8 text-orange-600" />
            <h1 className="text-4xl font-bold text-gray-900">Checkout</h1>
            <Shield className="h-8 w-8 text-green-600" />
          </div>
          <p className="text-gray-600 text-lg">Complete your order securely</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Form */}
          <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2 text-xl">
                <MapPin className="h-6 w-6" />
                Delivery Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="flex items-center gap-2 text-sm font-semibold">
                      <User className="h-4 w-4" />
                      Full Name
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      value={orderData.name}
                      onChange={handleInputChange}
                      className="h-12 text-lg"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-2 text-sm font-semibold">
                      <Mail className="h-4 w-4" />
                      Email
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={orderData.email}
                      onChange={handleInputChange}
                      className="h-12 text-lg"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address" className="flex items-center gap-2 text-sm font-semibold">
                    <MapPin className="h-4 w-4" />
                    Delivery Address
                  </Label>
                  <Input
                    id="address"
                    name="address"
                    value={orderData.address}
                    onChange={handleInputChange}
                    placeholder="Enter your full delivery address"
                    className="h-12 text-lg"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2 text-sm font-semibold">
                    <Phone className="h-4 w-4" />
                    Phone Number
                    {user?.phone && orderData.phone === user.phone && (
                      <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                        Auto-filled from profile
                      </span>
                    )}
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={orderData.phone}
                    onChange={handleInputChange}
                    placeholder="Your contact number"
                    className="h-12 text-lg"
                    required
                  />
                  {user?.phone && orderData.phone === user.phone && (
                    <p className="text-xs text-gray-600">
                      Phone number loaded from your profile. You can change it if needed.
                    </p>
                  )}
                </div>

                {/* Location Section */}
                <div className={`space-y-4 p-4 rounded-lg border ${
                  hasLocation() 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-blue-50 border-blue-200'
                }`}>
                  <div className="flex items-center gap-2">
                    <MapPin className={`h-5 w-5 ${
                      hasLocation() ? 'text-green-600' : 'text-blue-600'
                    }`} />
                    <Label className={`text-lg font-semibold ${
                      hasLocation() ? 'text-green-800' : 'text-blue-800'
                    }`}>
                      {hasLocation() ? 'Location Captured' : 'Location Access Required'}
                    </Label>
                  </div>
                  {!hasLocation() && (
                    <p className="text-sm text-blue-700">
                      We need your location to provide accurate delivery tracking and estimated arrival times.
                      {window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && (
                        <span className="block mt-1 text-orange-600 font-medium">
                          Note: Location access requires HTTPS. If automatic detection fails, please enter coordinates manually.
                        </span>
                      )}
                    </p>
                  )}
                  
                  {locationPermission === 'pending' && (
                    <div className="flex items-center gap-2 text-blue-600">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span className="text-sm">Requesting location access...</span>
                    </div>
                  )}
                  
                  {hasLocation() && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          {customerLocation ? 'GPS Location captured' : 'Manual location set'}
                        </span>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-green-200">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-gray-600">Coordinates:</span>
                            <div className="font-mono text-green-800">
                              {getCurrentLocation()!.lat.toFixed(6)}, {getCurrentLocation()!.lng.toFixed(6)}
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-600">Source:</span>
                            <div className="font-medium text-blue-600">
                              {customerLocation ? 'GPS' : 'Manual Entry'}
                            </div>
                          </div>
                        </div>
                        {customerLocation?.accuracy && (
                          <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="text-gray-600">Accuracy:</span>
                              <div className={`font-medium ${
                                customerLocation.accuracy <= 10 ? 'text-green-600' :
                                customerLocation.accuracy <= 100 ? 'text-yellow-600' :
                                'text-blue-600'
                              }`}>
                                ±{Math.round(customerLocation.accuracy)}m
                                {customerLocation.accuracy > 500 && (
                                  <span className="ml-1 text-xs">📍 Approximate location</span>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                        {customerLocation?.accuracy && customerLocation.accuracy > 500 && (
                          <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
                            📍 Location accuracy is approximate (±{Math.round(customerLocation.accuracy)}m). This is acceptable for delivery purposes.
                          </div>
                        )}
                        {!customerLocation && (
                          <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
                            ℹ️ Using manually entered location. Make sure the coordinates are accurate for proper delivery.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {!hasLocation() && locationPermission === 'denied' && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-red-600">
                        <MapPin className="h-4 w-4" />
                        <span className="text-sm font-medium">Location access denied</span>
                      </div>
                      <p className="text-sm text-red-600">{locationError}</p>
                      <div className="flex gap-2">
                        {(() => {
                          const isSecureOrigin = window.location.protocol === 'https:' || 
                                                window.location.hostname === 'localhost' || 
                                                window.location.hostname === '127.0.0.1';
                          return isSecureOrigin ? (
                            <Button
                              type="button"
                              onClick={retryLocation}
                              variant="outline"
                              size="sm"
                              className="text-blue-600 border-blue-600 hover:bg-blue-50"
                            >
                              <MapPin className="h-4 w-4 mr-2" />
                              Try Again
                            </Button>
                          ) : null;
                        })()}
                        <Button
                          type="button"
                          onClick={() => setShowManualLocation(true)}
                          variant="outline"
                          size="sm"
                          className="text-green-600 border-green-600 hover:bg-green-50"
                        >
                          <User className="h-4 w-4 mr-2" />
                          Enter Manually
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes" className="flex items-center gap-2 text-sm font-semibold">
                    <Clock className="h-4 w-4" />
                    Special Instructions (Optional)
                  </Label>
                  <Input
                    id="notes"
                    name="notes"
                    value={orderData.notes}
                    onChange={handleInputChange}
                    placeholder="Any special delivery instructions..."
                    className="h-12 text-lg"
                  />
                </div>

                <div className="space-y-4">
                  <Label className="text-lg font-semibold">Payment Method</Label>
                  <div className="grid grid-cols-1 gap-4">
                    <label className={`flex items-center gap-4 cursor-pointer p-4 border-2 rounded-xl transition-all duration-300 ${
                      paymentMethod === 'card' 
                        ? 'border-orange-500 bg-orange-50 shadow-md' 
                        : 'border-gray-200 hover:border-orange-300 hover:bg-orange-25'
                    }`}>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="card"
                        checked={paymentMethod === 'card'}
                        onChange={() => setPaymentMethod('card')}
                        className="accent-orange-600 w-5 h-5"
                      />
                      <CreditCard className="h-6 w-6 text-blue-600" />
                      <div>
                        <span className="text-lg font-semibold">Pay with Card</span>
                        <p className="text-sm text-gray-600">Secure payment with Stripe</p>
                      </div>
                    </label>
                    <label className={`flex items-center gap-4 cursor-pointer p-4 border-2 rounded-xl transition-all duration-300 ${
                      paymentMethod === 'cash' 
                        ? 'border-orange-500 bg-orange-50 shadow-md' 
                        : 'border-gray-200 hover:border-orange-300 hover:bg-orange-25'
                    }`}>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="cash"
                        checked={paymentMethod === 'cash'}
                        onChange={() => setPaymentMethod('cash')}
                        className="accent-orange-600 w-5 h-5"
                      />
                      <Banknote className="h-6 w-6 text-green-600" />
                      <div>
                        <span className="text-lg font-semibold">Pay with Cash</span>
                        <p className="text-sm text-gray-600">Pay when your order arrives</p>
                      </div>
                    </label>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading || !orderData.phone?.trim() || !getCurrentLocation() || !getCurrentLocation()?.lat || !getCurrentLocation()?.lng}
                  className="w-full btn-gradient text-white py-4 text-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 mt-8 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isLoading ? (
                    <>
                      <Clock className="h-5 w-5 mr-2 animate-spin" />
                      Placing Order...
                    </>
                  ) : !orderData.phone?.trim() ? (
                    <>
                      <Phone className="h-5 w-5 mr-2" />
                      Phone Required
                    </>
                  ) : !getCurrentLocation() || !getCurrentLocation()?.lat || !getCurrentLocation()?.lng ? (
                    <>
                      <MapPin className="h-5 w-5 mr-2" />
                      Location Required
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5 mr-2" />
                      Place Order - €{total.toFixed(2)}
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm h-fit">
            <CardHeader className="bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Sparkles className="h-6 w-6" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                {/* Items List */}
                <div className="space-y-4 max-h-80 overflow-y-auto">
                  {items.map((item, index) => (
                    <div 
                      key={item.food._id} 
                      className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="relative">
                        <img
                          src={item.food.image}
                          alt={item.food.name}
                          className="w-20 h-20 object-cover rounded-lg shadow-md"
                          onError={(e) => {
                            e.currentTarget.src = `https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=80&h=80&fit=crop`;
                          }}
                        />
                        <div className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                          {item.quantity}
                        </div>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900 text-lg">{item.food.name}</h4>
                        <p className="text-sm text-gray-600 capitalize">{item.food.category}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-orange-600 font-bold text-lg">
                            €{(item.food.price * item.quantity).toFixed(2)}
                          </span>
                          <span className="text-gray-400 text-sm">
                            (€{item.food.price.toFixed(2)} each)
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total Section */}
                <div className="border-t-2 border-orange-200 pt-6">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-lg">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-semibold">€{total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-lg">
                      <span className="text-gray-600">Delivery:</span>
                      <span className="font-semibold text-green-600">Free</span>
                    </div>
                    <div className="flex justify-between items-center text-2xl font-bold border-t pt-3">
                      <span className="text-gray-900">Total:</span>
                      <span className="text-orange-600">€{total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Security Features */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-5 w-5 text-green-600" />
                    <span className="font-semibold text-green-800">Secure Checkout</span>
                  </div>
                  <p className="text-sm text-green-700">
                    Your payment information is encrypted and secure. We never store your card details.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payment Form */}
        {showPayment && orderId && (
          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle>Complete Payment</CardTitle>
              </CardHeader>
              <CardContent>
                {paymentMethod === 'card' ? (
                  <StripePayment
                    orderId={orderId}
                    totalAmount={total}
                    onPaymentSuccess={handlePaymentSuccess}
                    onPaymentError={handlePaymentError}
                  />
                ) : (
                  <div className="text-center py-8">
                    <div className="mb-4">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="h-8 w-8 text-green-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Order Placed Successfully!
                      </h3>
                      <p className="text-gray-600 mb-4">
                        Your order has been placed and will be paid for in cash upon delivery.
                      </p>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm text-blue-800">
                          <strong>Order ID:</strong> #{orderId.slice(-6)}<br/>
                          <strong>Total Amount:</strong> €{total.toFixed(2)}<br/>
                          <strong>Payment Method:</strong> Cash on Delivery
                        </p>
                      </div>
                    </div>
                    <Button 
                      onClick={() => {
                        clearCart();
                        navigate('/orders');
                      }}
                      className="w-full"
                    >
                      View My Orders
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Manual Location Input Dialog */}
        {showManualLocation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="max-w-lg mx-4 bg-white">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-orange-600">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Location Required for Delivery
                  </div>
                  <button
                    onClick={() => setShowManualLocation(false)}
                    className="text-gray-400 hover:text-gray-600 text-xl font-bold"
                  >
                    ×
                  </button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleManualLocationSubmit} className="space-y-4">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Automatic location detection failed.</strong> This may be due to HTTPS requirements or GPS issues. Please enter your coordinates manually for accurate delivery.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="lat" className="text-sm font-semibold">
                        Latitude
                      </Label>
                      <Input
                        id="lat"
                        name="lat"
                        type="number"
                        step="any"
                        placeholder="e.g., 40.7128"
                        required
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lng" className="text-sm font-semibold">
                        Longitude
                      </Label>
                      <Input
                        id="lng"
                        name="lng"
                        type="number"
                        step="any"
                        placeholder="e.g., -74.0060"
                        required
                        className="h-10"
                      />
                    </div>
                  </div>
                  
                  <div className="bg-green-50 p-3 rounded-lg">
                    <h4 className="font-medium text-green-900 mb-2">Quick way to get coordinates:</h4>
                    <p className="text-sm text-green-800">
                      Open Google Maps → Right-click on your location → Click the coordinates that appear
                    </p>
                  </div>
                  
                  <div className="flex gap-3">
                    <Button
                      type="submit"
                      className="flex-1 bg-orange-600 hover:bg-orange-700"
                    >
                      Continue with Location
                    </Button>
                    {(() => {
                      const isSecureOrigin = window.location.protocol === 'https:' || 
                                            window.location.hostname === 'localhost' || 
                                            window.location.hostname === '127.0.0.1';
                      return (
                        <Button
                          type="button"
                          onClick={retryLocation}
                          variant="outline"
                          className="flex-1"
                          disabled={!isSecureOrigin}
                          title={!isSecureOrigin ? "GPS requires HTTPS connection" : ""}
                        >
                          Try GPS Again
                        </Button>
                      );
                    })()}
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
    </>
  );
};

export default Checkout;
