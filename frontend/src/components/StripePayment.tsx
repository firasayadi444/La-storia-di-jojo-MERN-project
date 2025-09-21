import React, { useState } from 'react';
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
import { Loader2, CreditCard, CheckCircle, Shield, Lock, Sparkles } from 'lucide-react';

// Log environment variable loading

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder_key');

interface StripePaymentProps {
  orderId: string;
  totalAmount: number;
  onPaymentSuccess: (order: any) => void;
  onPaymentError: (error: string) => void;
}

const PaymentForm: React.FC<StripePaymentProps> = ({
  orderId,
  totalAmount,
  onPaymentSuccess,
  onPaymentError
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();


    if (!stripe || !elements) {
      console.error('❌ Stripe or Elements not available');
      return;
    }

    setIsProcessing(true);

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
      } else if (paymentIntent.status === 'succeeded') {
        // Confirm payment on backend
        const confirmResponse = await apiService.confirmPayment(paymentIntent.id);
        
        setIsSuccess(true);
        onPaymentSuccess(confirmResponse.order);
        
        toast({
          title: "Payment Successful",
          description: "Your order has been confirmed and payment processed",
        });
      }
    } catch (error: any) {
      console.error('❌ Payment error:', error);
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack,
        response: error.response?.data
      });
      onPaymentError(error.message || 'Payment failed');
      toast({
        title: "Payment Error",
        description: error.message || 'An error occurred during payment',
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (isSuccess) {
    return (
      <Card className="w-full max-w-lg mx-auto shadow-2xl border-0 bg-gradient-to-br from-green-50 to-blue-50">
        <CardContent className="pt-8 pb-8">
          <div className="text-center">
            <div className="relative mb-6">
              <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-4 animate-bounce" />
              <Sparkles className="h-6 w-6 text-yellow-400 absolute -top-2 -right-2 animate-pulse" />
            </div>
            <h3 className="text-2xl font-bold text-green-700 mb-3">
              Payment Successful! 🎉
            </h3>
            <p className="text-gray-600 text-lg mb-4">
              Your order has been confirmed and payment processed securely.
            </p>
            <div className="bg-white rounded-lg p-4 shadow-md">
              <p className="text-sm text-gray-700">
                <strong>Amount Paid:</strong> €{totalAmount.toFixed(2)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-lg mx-auto shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
      <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-t-lg">
        <CardTitle className="flex items-center gap-2 text-xl">
          <CreditCard className="h-6 w-6" />
          Secure Payment
        </CardTitle>
      </CardHeader>
      <CardContent className="p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Security Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-5 w-5 text-blue-600" />
              <span className="font-semibold text-blue-800">Secure Payment</span>
            </div>
            <p className="text-sm text-blue-700">
              Your payment information is encrypted and processed securely by Stripe.
            </p>
          </div>

          {/* Card Input */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <Lock className="h-4 w-4" />
              Card Information
            </label>
            <div className="p-4 border-2 border-gray-200 rounded-xl hover:border-blue-300 focus-within:border-blue-500 transition-colors">
              <CardElement
                options={{
                  style: {
                    base: {
                      fontSize: '18px',
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
          <div className="text-center bg-gray-50 rounded-lg p-4">
            <p className="text-lg text-gray-700 mb-1">
              Total Amount
            </p>
            <p className="text-3xl font-bold text-orange-600">
              €{totalAmount.toFixed(2)}
            </p>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={!stripe || isProcessing}
            className="w-full btn-gradient text-white py-4 text-lg font-bold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Processing Payment...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-5 w-5" />
                Pay €{totalAmount.toFixed(2)}
              </>
            )}
          </Button>

          {/* Security Badges */}
          <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Shield className="h-3 w-3" />
              <span>SSL Encrypted</span>
            </div>
            <div className="flex items-center gap-1">
              <Lock className="h-3 w-3" />
              <span>PCI Compliant</span>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

const StripePayment: React.FC<StripePaymentProps> = (props) => {
  // Check if we have a valid Stripe key
  const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
  
  if (!stripeKey || stripeKey === 'pk_test_placeholder_key') {
    return (
      <div className="w-full max-w-lg mx-auto p-8 text-center">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">Payment Not Available</h3>
          <p className="text-yellow-700">
            Stripe payment is not configured. Please contact support or use cash payment.
          </p>
        </div>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      <PaymentForm {...props} />
    </Elements>
  );
};

export default StripePayment;
