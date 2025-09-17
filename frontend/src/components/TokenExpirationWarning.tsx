import { useEffect, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { getTokenRemainingTime, logoutUser } from '../utils/tokenUtils';

const TokenExpirationWarning = () => {
  const [showWarning, setShowWarning] = useState(false);
  const [remainingTime, setRemainingTime] = useState<number>(0);

  useEffect(() => {
    const checkTokenExpiration = () => {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) return;

      const remaining = getTokenRemainingTime(token);
      setRemainingTime(remaining);

      // Show warning if token expires in less than 10 minutes
      if (remaining < 600 && remaining > 0) {
        setShowWarning(true);
      } else {
        setShowWarning(false);
      }
    };

    // Check immediately
    checkTokenExpiration();

    // Check every 2 minutes
    const interval = setInterval(checkTokenExpiration, 120000);

    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    logoutUser();
  };

  const handleDismiss = () => {
    setShowWarning(false);
  };

  if (!showWarning) return null;

  const minutes = Math.floor(remainingTime / 60);
  const seconds = Math.floor(remainingTime % 60);

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <Alert className="border-orange-200 bg-orange-50">
        <AlertDescription className="text-orange-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Session expirera bientôt</p>
              <p className="text-sm">
                Votre session expire dans {minutes}m {seconds}s
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleDismiss}
                className="text-orange-700 border-orange-300 hover:bg-orange-100"
              >
                Ignorer
              </Button>
              <Button
                size="sm"
                onClick={handleLogout}
                className="bg-orange-600 hover:bg-orange-700"
              >
                Se reconnecter
              </Button>
            </div>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default TokenExpirationWarning; 