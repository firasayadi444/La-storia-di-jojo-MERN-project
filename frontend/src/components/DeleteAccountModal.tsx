import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { 
  AlertTriangle, 
  X, 
  Eye, 
  EyeOff, 
  Trash2,
  Shield,
  Info
} from 'lucide-react';

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (password?: string) => Promise<void>;
  isLoading?: boolean;
}

const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [isConfirmed, setIsConfirmed] = useState(false);
  const { toast } = useToast();

  const handleConfirmTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setConfirmText(value);
    setIsConfirmed(value === 'DELETE');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConfirmed) {
      toast({
        title: "Confirmation Required",
        description: "Please type 'DELETE' to confirm account deletion",
        variant: "destructive"
      });
      return;
    }

    try {
      await onConfirm(password || undefined);
    } catch (error) {
      // Error handling is done in the parent component
    }
  };

  const handleClose = () => {
    setPassword('');
    setConfirmText('');
    setIsConfirmed(false);
    setShowPassword(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full mx-4 transform transition-all duration-500 scale-100">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-red-500 to-red-600 rounded-t-3xl p-6">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
          
          <div className="text-center text-white">
            <div className="flex items-center justify-center gap-2 mb-2">
              <AlertTriangle className="h-6 w-6" />
              <span className="text-lg font-semibold">Delete Account</span>
            </div>
            <p className="text-red-100 text-sm">This action cannot be undone</p>
          </div>
        </div>

        <CardContent className="p-6">
          {/* Warning Section */}
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-red-900 mb-2">Warning: Permanent Action</h4>
                <ul className="text-sm text-red-700 space-y-1">
                  <li>• All your personal data will be permanently deleted</li>
                  <li>• Your order history will be removed</li>
                  <li>• This action cannot be reversed</li>
                  <li>• You will need to create a new account to use our services again</li>
                </ul>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Password Verification */}
            <div className="space-y-3">
              <Label htmlFor="password" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Password (Optional)
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password for extra security"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-gray-500">
                Providing your password adds an extra layer of security
              </p>
            </div>

            {/* Confirmation Text */}
            <div className="space-y-3">
              <Label htmlFor="confirmText" className="flex items-center gap-2">
                <Info className="h-4 w-4" />
                Type "DELETE" to confirm
              </Label>
              <Input
                id="confirmText"
                type="text"
                value={confirmText}
                onChange={handleConfirmTextChange}
                placeholder="Type DELETE to confirm"
                className={isConfirmed ? 'border-green-500 bg-green-50' : 'border-red-300'}
              />
              {confirmText && !isConfirmed && (
                <p className="text-xs text-red-600">
                  Please type exactly "DELETE" to confirm
                </p>
              )}
              {isConfirmed && (
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  Confirmation text matches
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="flex-1"
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!isConfirmed || isLoading}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Account
                  </>
                )}
              </Button>
            </div>
          </form>

          {/* Additional Info */}
          <div className="mt-6 p-4 bg-gray-50 rounded-xl">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-gray-600">
                <p className="font-medium text-gray-800 mb-1">Need help?</p>
                <p>
                  If you're having issues with your account, consider contacting our support team 
                  before deleting your account. We're here to help!
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </div>
    </div>
  );
};

export default DeleteAccountModal;
