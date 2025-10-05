import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiService } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, 
  CreditCard, 
  CheckCircle, 
  Shield, 
  Lock, 
  Sparkles, 
  X, 
  ArrowRight,
  Clock,
  MapPin,
  ShoppingBag,
  Star
} from 'lucide-react';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder_key');

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  totalAmount: number;
  onPaymentSuccess: (order: any) => void;
  onPaymentError: (error: string) => void;
}

const PaymentForm: React.FC<PaymentModalProps> = ({
  orderId,
  totalAmount,
  onPaymentSuccess,
  onPaymentError,
  onClose
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      console.error('❌ Stripe or Elements not available');
      return;
    }

    setIsProcessing(true);
    setCurrentStep(2);

    try {
      // Create payment intent
      const response = await apiService.createPaymentIntent(orderId);
      
      // Check if Stripe is not configured
      if (response.message && response.message.includes('Stripe is not configured')) {
        console.error('❌ Stripe not configured on backend');
        onPaymentError('Stripe payment is not configured. Please contact support or use cash payment.');
        return;
      }
      
      const { clientSecret } = response;
      setCurrentStep(3);
      
      // Confirm payment with Stripe
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
        }
      });

      if (error) {
        console.error('❌ Payment failed:', error);
        onPaymentError(error.message || 'Payment failed');
        toast({
          title: "Payment Failed",
          description: error.message || 'Payment could not be processed',
          variant: "destructive"
        });
        setCurrentStep(1);
      } else if (paymentIntent.status === 'succeeded') {
        setCurrentStep(4);
        
        // Confirm payment on backend
        const confirmResponse = await apiService.confirmPayment(paymentIntent.id);
        
        setIsSuccess(true);
        
        // Auto close after success
        setTimeout(() => {
          onPaymentSuccess(confirmResponse.order);
        }, 2000);
        
        toast({
          title: "Payment Successful",
          description: "Your order has been confirmed and payment processed",
        });
      }
    } catch (error: any) {
      console.error('❌ Payment error:', error);
      onPaymentError(error.message || 'Payment failed');
      toast({
        title: "Payment Error",
        description: error.message || 'An error occurred during payment',
        variant: "destructive"
      });
      setCurrentStep(1);
    } finally {
      setIsProcessing(false);
    }
  };

  // Success state
  if (isSuccess) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full mx-4 transform transition-all duration-500 scale-100">
          <div className="relative">
            {/* Success Animation */}
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
            </div>
            
            <CardContent className="pt-12 pb-8 px-8">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  Payment Successful! 🎉
                </h3>
                <p className="text-gray-600 mb-6">
                  Your order has been confirmed and payment processed securely.
                </p>
                
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 mb-6">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Sparkles className="h-5 w-5 text-yellow-500" />
                    <span className="font-semibold text-green-800">Order Confirmed</span>
                  </div>
                  <p className="text-2xl font-bold text-green-600">
                    €{totalAmount.toFixed(2)}
                  </p>
                </div>
                
                <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                  <Clock className="h-4 w-4" />
                  <span>Redirecting to orders...</span>
                </div>
              </div>
            </CardContent>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full mx-4 transform transition-all duration-500 scale-100">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-t-3xl p-6">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
          
          <div className="text-center text-white">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Shield className="h-6 w-6" />
              <span className="text-lg font-semibold">Secure Payment</span>
            </div>
            <p className="text-white/90 text-sm">Powered by Stripe</p>
          </div>
        </div>

        <CardContent className="p-8">
          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center space-x-4">
              {[1, 2, 3, 4].map((step) => (
                <div key={step} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                    currentStep >= step 
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white' 
                      : 'bg-gray-200 text-gray-500'
                  }`}>
                    {step}
                  </div>
                  {step < 4 && (
                    <div className={`w-8 h-0.5 mx-2 transition-all duration-300 ${
                      currentStep > step ? 'bg-gradient-to-r from-blue-500 to-purple-500' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Security Notice */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Lock className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-blue-900">Bank-Level Security</h4>
                  <p className="text-sm text-blue-700">Your payment is encrypted and secure</p>
                </div>
              </div>
            </div>

            {/* Card Input */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <CreditCard className="h-4 w-4" />
                Card Information
              </label>
              <div className="p-4 border-2 border-gray-200 rounded-2xl hover:border-blue-300 focus-within:border-blue-500 transition-all duration-300 bg-gray-50/50">
                <CardElement
                  options={{
                    style: {
                      base: {
                        fontSize: '16px',
                        color: '#374151',
                        fontFamily: 'system-ui, sans-serif',
                        '::placeholder': {
                          color: '#9CA3AF',
                        },
                      },
                      invalid: {
                        color: '#EF4444',
                      },
                    },
                  }}
                />
              </div>
            </div>
            
            {/* Amount Display */}
            <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <ShoppingBag className="h-5 w-5 text-orange-600" />
                <span className="text-lg font-semibold text-gray-700">Total Amount</span>
              </div>
              <p className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                €{totalAmount.toFixed(2)}
              </p>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={!stripe || isProcessing}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-4 text-lg font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  {currentStep === 2 && "Creating Payment..."}
                  {currentStep === 3 && "Processing Payment..."}
                  {currentStep === 4 && "Confirming Order..."}
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-5 w-5" />
                  Pay €{totalAmount.toFixed(2)}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>

            {/* Security Badges */}
            <div className="flex items-center justify-center gap-6 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <Shield className="h-4 w-4 text-green-500" />
                <span>SSL Encrypted</span>
              </div>
              <div className="flex items-center gap-1">
                <Lock className="h-4 w-4 text-blue-500" />
                <span>PCI Compliant</span>
              </div>
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 text-yellow-500" />
                <span>Stripe Secure</span>
              </div>
            </div>
          </form>
        </CardContent>
      </div>
    </div>
  );
};

const PaymentModal: React.FC<PaymentModalProps> = (props) => {
  const { isOpen } = props;
  
  // Check if we have a valid Stripe key
  const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
  
  if (!stripeKey || stripeKey === 'pk_test_placeholder_key') {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full mx-4">
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="h-8 w-8 text-yellow-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Payment Not Available</h3>
            <p className="text-gray-600 mb-6">
              Stripe payment is not configured. Please contact support or use cash payment.
            </p>
            <Button onClick={props.onClose} className="w-full">
              Close
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!isOpen) return null;

  return (
    <Elements stripe={stripePromise}>
      <PaymentForm {...props} />
    </Elements>
  );
};

export default PaymentModal;
