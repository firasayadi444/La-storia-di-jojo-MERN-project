import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const success = await login(email, password);
      if (success) {
        // Check if user must change password
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        if (currentUser.mustChangePassword) {
          toast({
            title: "Welcome!",
            description: "Please change your temporary password to continue.",
          });
          navigate('/change-password');
        } else {
          toast({
            title: "Welcome back!",
            description: "You have successfully logged in.",
          });
          navigate('/');
        }
      } else {
        toast({
          title: "Login failed",
          description: "Invalid email or password. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "An error occurred during login. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        backgroundImage: 'url(/background.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Overlay pour améliorer la lisibilité */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"></div>
      
      {/* Effet de particules flottantes améliorées */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="particle absolute top-1/4 left-1/4 w-2 h-2 bg-white/30"></div>
        <div className="particle absolute top-1/3 right-1/3 w-1 h-1 bg-white/40"></div>
        <div className="particle absolute bottom-1/4 left-1/3 w-1.5 h-1.5 bg-white/20"></div>
        <div className="particle absolute bottom-1/3 right-1/4 w-1 h-1 bg-white/30"></div>
        <div className="particle absolute top-1/2 left-1/2 w-1 h-1 bg-white/25"></div>
      </div>
      
      <div className="w-full max-w-md animate-scale-in relative z-10">
        <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-md ring-1 ring-white/20 animate-glow">
          <CardHeader className="text-center pb-6 animate-slide-up">
            <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4 animate-float">
              <span className="text-white font-bold text-2xl">F</span>
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900 animate-fade-in">Welcome Back</CardTitle>
            <CardDescription className="text-gray-700 animate-fade-in">
              Sign in to your FoodieDelight account
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold text-gray-800">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="w-full px-3 py-3 border-2 border-gray-300 rounded-md focus:ring-2 focus:ring-food-orange-500 focus:border-food-orange-500 bg-white/90 text-gray-900 placeholder-gray-500"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold text-gray-800">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full px-3 py-3 border-2 border-gray-300 rounded-md focus:ring-2 focus:ring-food-orange-500 focus:border-food-orange-500 bg-white/90 text-gray-900 placeholder-gray-500"
                />
              </div>
              
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full btn-gradient text-white py-2 px-4 rounded-md font-medium disabled:opacity-50"
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
            
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-800">
                Don't have an account?{' '}
                <Link to="/register" className="text-food-orange-600 hover:text-food-orange-700 font-semibold underline">
                  Sign up here
                </Link>
              </p>
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
