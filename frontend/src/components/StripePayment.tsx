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
import { Loader2, CreditCard, CheckCircle } from 'lucide-react';

// Log environment variable loading
console.log('🔑 Environment check:');
console.log('- VITE_STRIPE_PUBLISHABLE_KEY:', import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
console.log('- Key starts with pk_test:', import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY?.startsWith('pk_test'));
console.log('- Key length:', import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY?.length);

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

    console.log('🚀 Payment process started');
    console.log('- Stripe object:', !!stripe);
    console.log('- Elements object:', !!elements);
    console.log('- Order ID:', orderId);
    console.log('- Total Amount:', totalAmount);

    if (!stripe || !elements) {
      console.error('❌ Stripe or Elements not available');
      return;
    }

    setIsProcessing(true);

    try {
      console.log('📞 Creating payment intent...');
      // Create payment intent
      const response = await apiService.createPaymentIntent(orderId);
      console.log('📞 Payment intent response:', response);
      
      // Check if Stripe is not configured
      if (response.message && response.message.includes('Stripe is not configured')) {
        console.error('❌ Stripe not configured on backend');
        onPaymentError('Stripe payment is not configured. Please contact support or use cash payment.');
        return;
      }
      
      const { clientSecret } = response;
      console.log('🔐 Client secret received:', clientSecret ? 'Yes' : 'No');

      console.log('💳 Confirming payment with Stripe...');
      // Confirm payment with Stripe
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
        }
      });

      console.log('💳 Stripe confirmation result:');
      console.log('- Error:', error);
      console.log('- Payment Intent:', paymentIntent);

      if (error) {
        console.error('❌ Payment failed:', error);
        onPaymentError(error.message || 'Payment failed');
        toast({
          title: "Payment Failed",
          description: error.message || 'Payment could not be processed',
          variant: "destructive"
        });
      } else if (paymentIntent.status === 'succeeded') {
        console.log('✅ Payment succeeded, confirming on backend...');
        // Confirm payment on backend
        const confirmResponse = await apiService.confirmPayment(paymentIntent.id);
        console.log('✅ Backend confirmation response:', confirmResponse);
        
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
      console.log('🏁 Payment process completed');
    }
  };

  if (isSuccess) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-green-700 mb-2">
              Payment Successful!
            </h3>
            <p className="text-gray-600">
              Your order has been confirmed and payment processed.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Payment Details
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-4 border rounded-lg">
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: '16px',
                    color: '#424770',
                    '::placeholder': {
                      color: '#aab7c4',
                    },
                  },
                },
              }}
            />
          </div>
          
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">
              Total Amount: <span className="font-semibold">${totalAmount.toFixed(2)}</span>
            </p>
          </div>

          <Button
            type="submit"
            disabled={!stripe || isProcessing}
            className="w-full"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing Payment...
              </>
            ) : (
              `Pay $${totalAmount.toFixed(2)}`
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

const StripePayment: React.FC<StripePaymentProps> = (props) => {
  return (
    <Elements stripe={stripePromise}>
      <PaymentForm {...props} />
    </Elements>
  );
};

export default StripePayment;
