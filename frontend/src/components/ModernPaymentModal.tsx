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
  Star,
  Zap,
  Heart,
  Crown,
  Gem,
  Flame,
  Moon,
  Sun,
  Cloud,
  Rainbow,
  Eye,
  EyeOff,
  Save,
  Trash2,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Info
} from 'lucide-react';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder_key');

interface ModernPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  totalAmount: number;
  onPaymentSuccess: (order: any) => void;
  onPaymentError: (error: string) => void;
}

const PaymentForm: React.FC<ModernPaymentModalProps> = ({
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
  const [showParticles, setShowParticles] = useState(false);
  const [saveCard, setSaveCard] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);
  const [isCardComplete, setIsCardComplete] = useState(false);
  const [showSecurityInfo, setShowSecurityInfo] = useState(false);

  // Particle animation for success state
  useEffect(() => {
    if (isSuccess) {
      setShowParticles(true);
      const timer = setTimeout(() => setShowParticles(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isSuccess]);

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
        }, 3000);
        
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

  // Particle component for success animation
  const Particle = ({ delay, duration, children }: { delay: number; duration: number; children: React.ReactNode }) => (
    <div
      className="absolute animate-bounce"
      style={{
        animationDelay: `${delay}ms`,
        animationDuration: `${duration}ms`,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
      }}
    >
      {children}
    </div>
  );

  // Success state with particles
  if (isSuccess) {
    return (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-lg flex items-center justify-center p-4 z-50">
        {/* Animated background for success */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-yellow-400/20 to-orange-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-pink-400/20 to-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-blue-400/10 to-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>

        {/* Particles */}
        {showParticles && (
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(20)].map((_, i) => (
              <Particle key={i} delay={i * 100} duration={2000 + Math.random() * 1000}>
                <div className="w-2 h-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full opacity-80"></div>
              </Particle>
            ))}
            {[...Array(10)].map((_, i) => (
              <Particle key={`star-${i}`} delay={i * 150} duration={2500 + Math.random() * 1000}>
                <Sparkles className="h-4 w-4 text-yellow-400" />
              </Particle>
            ))}
          </div>
        )}

        <div className="relative bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl max-w-md w-full mx-4 border border-white/20 transform transition-all duration-1000 scale-100">
          <div className="relative p-8 text-center">
            {/* Success Animation */}
            <div className="relative mb-8">
              <div className="w-24 h-24 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-2xl animate-bounce">
                <CheckCircle className="h-12 w-12 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center animate-pulse">
                <Crown className="h-4 w-4 text-white" />
              </div>
            </div>
            
            <h3 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent mb-4">
              Payment Successful! 🎉
            </h3>
            <p className="text-white/90 text-lg mb-6">
              Your order has been confirmed and payment processed securely.
            </p>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-white/20">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Gem className="h-5 w-5 text-yellow-400" />
                <span className="font-semibold text-white">Order Confirmed</span>
              </div>
              <p className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                €{totalAmount.toFixed(2)}
              </p>
            </div>
            
            <div className="flex items-center justify-center gap-2 text-sm text-white/70">
              <Clock className="h-4 w-4" />
              <span>Redirecting to orders...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-lg flex items-center justify-center p-4 z-50">
      {/* Subtle overlay for better contrast */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/10 via-purple-900/10 to-indigo-900/10"></div>

      <div className="relative bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl max-w-lg w-full mx-4 border border-white/20 transform transition-all duration-500 scale-100">
        {/* Header with glassmorphism */}
        <div className="relative bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-indigo-600/20 backdrop-blur-sm rounded-t-3xl p-6 border-b border-white/20">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-all duration-300 hover:scale-110"
          >
            <X className="h-6 w-6" />
          </button>
          
          <div className="text-center text-white">
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Secure Payment</h2>
                <p className="text-white/80 text-sm">Powered by Stripe</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8">
          {/* Progress Steps with glassmorphism */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center space-x-4">
              {[1, 2, 3, 4].map((step) => (
                <div key={step} className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-500 ${
                    currentStep >= step 
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg scale-110' 
                      : 'bg-white/20 text-white/60 backdrop-blur-sm'
                  }`}>
                    {step}
                  </div>
                  {step < 4 && (
                    <div className={`w-12 h-1 mx-3 transition-all duration-500 rounded-full ${
                      currentStep > step 
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600' 
                        : 'bg-white/20'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Security Notice with glassmorphism */}
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                  <Lock className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-white">Bank-Level Security</h4>
                  <p className="text-sm text-white/80">Your payment is encrypted and secure</p>
                </div>
              </div>
            </div>

            {/* Card Input with glassmorphism */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-semibold text-white">
                <CreditCard className="h-4 w-4" />
                Card Information
              </label>
              <div className="p-4 border-2 border-white/20 rounded-2xl hover:border-blue-400/50 focus-within:border-blue-400 transition-all duration-300 bg-white/5 backdrop-blur-sm">
                <CardElement
                  options={{
                    style: {
                      base: {
                        fontSize: '16px',
                        color: '#ffffff',
                        fontFamily: 'system-ui, sans-serif',
                        '::placeholder': {
                          color: '#a1a1aa',
                        },
                      },
                      invalid: {
                        color: '#ef4444',
                      },
                    },
                  }}
                />
              </div>
            </div>
            
            {/* Amount Display with glassmorphism */}
            <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 backdrop-blur-sm border border-orange-400/30 rounded-2xl p-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <ShoppingBag className="h-5 w-5 text-orange-400" />
                <span className="text-lg font-semibold text-white">Total Amount</span>
              </div>
              <p className="text-4xl font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
                €{totalAmount.toFixed(2)}
              </p>
            </div>

            {/* Submit Button with glassmorphism */}
            <Button
              type="submit"
              disabled={!stripe || isProcessing}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-4 text-lg font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none backdrop-blur-sm border border-white/20"
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

            {/* Security Badges with glassmorphism */}
            <div className="flex items-center justify-center gap-6 text-xs text-white/70">
              <div className="flex items-center gap-1 bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full border border-white/20">
                <Shield className="h-4 w-4 text-green-400" />
                <span>SSL Encrypted</span>
              </div>
              <div className="flex items-center gap-1 bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full border border-white/20">
                <Lock className="h-4 w-4 text-blue-400" />
                <span>PCI Compliant</span>
              </div>
              <div className="flex items-center gap-1 bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full border border-white/20">
                <Star className="h-4 w-4 text-yellow-400" />
                <span>Stripe Secure</span>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const ModernPaymentModal: React.FC<ModernPaymentModalProps> = (props) => {
  const { isOpen } = props;
  
  // Check if we have a valid Stripe key
  const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
  
  if (!stripeKey || stripeKey === 'pk_test_placeholder_key') {
    return (
      <div className="fixed inset-0 bg-black/30 backdrop-blur-lg flex items-center justify-center p-4 z-50">
        <div className="relative bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl max-w-md w-full mx-4 border border-white/20">
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Payment Not Available</h3>
            <p className="text-white/80 mb-6">
              Stripe payment is not configured. Please contact support or use cash payment.
            </p>
            <Button onClick={props.onClose} className="w-full bg-gradient-to-r from-blue-600 to-purple-600">
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

export default ModernPaymentModal;
