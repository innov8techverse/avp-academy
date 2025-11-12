import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Shield, BookOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useVerifyOTP } from '@/hooks/api/useAuth';
import { authService } from '@/services/auth/authService';

const VerifyOTP: React.FC = () => {
  const [otp, setOtp] = useState('');
  const [email, setEmail] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  
  const verifyOTPMutation = useVerifyOTP();

  // Get email and other data from location state
  React.useEffect(() => {
    const stateEmail = location.state?.email;
    const isPasswordReset = location.state?.isPasswordReset;
    const newPassword = location.state?.newPassword;
    
    if (stateEmail) {
      setEmail(stateEmail);
    }
    
    // If this is for password reset, we'll handle it differently
    if (isPasswordReset && newPassword) {
      // Store the password temporarily for the reset flow
      sessionStorage.setItem('tempNewPassword', newPassword);
    }
  }, [location.state]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyOTPMutation.isPending) return;

    if (!email) {
      toast({
        title: 'Error',
        description: 'Email is required',
        variant: 'destructive',
      });
      return;
    }

    if (!otp || otp.length !== 6) {
      toast({
        title: 'Error',
        description: 'Please enter a valid 6-digit OTP',
        variant: 'destructive',
      });
      return;
    }

    try {
      const result = await verifyOTPMutation.mutateAsync({ email, otp });
      if (result.success) {
        // Check if this is for password reset
        const tempPassword = sessionStorage.getItem('tempNewPassword');
        if (tempPassword) {
          // This is for password reset, call the reset API directly
          try {
            const resetResult = await authService.resetPassword({ otp, password: tempPassword });
            if (resetResult.success) {
              // Clear temporary password
              sessionStorage.removeItem('tempNewPassword');
              toast({
                title: 'Success',
                description: 'Password reset successfully!',
              });
              // Redirect to login
              setTimeout(() => {
                navigate('/');
              }, 2000);
            }
          } catch (resetError: any) {
            toast({
              title: 'Error',
              description: resetError.message || 'Failed to reset password',
              variant: 'destructive',
            });
          }
        } else {
          // Regular OTP verification, store OTP for one-time password reset without re-entry
          try {
            sessionStorage.setItem('verifiedOtp', otp);
          } catch {}
          navigate('/reset-password', { 
            state: { 
              email, 
              otpVerified: true 
            } 
          });
        }
      }
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const handleResendOTP = () => {
    // Navigate back to forgot password to resend OTP
    navigate('/forgot-password', { 
      state: { email } 
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">AVP Siddha Academy</h1>
          <p className="text-gray-600">Enter the OTP sent to your email</p>
        </div>

        <Card className="shadow-lg border-0">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl font-semibold text-gray-900">
              Verify OTP
            </CardTitle>
            <p className="text-sm text-gray-600 mt-2">
              We've sent a 6-digit OTP to <span className="font-medium text-blue-600">{email || 'your email'}</span>
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp" className="text-sm font-medium text-gray-700">
                  OTP Code
                </Label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="otp"
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Enter 6-digit OTP"
                    className="h-12 pl-10 border-gray-200 focus:border-blue-500 rounded-xl text-center text-lg font-mono tracking-widest"
                    maxLength={6}
                    required
                    disabled={verifyOTPMutation.isPending}
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Enter the 6-digit code sent to your email
                </p>
              </div>
              
              <Button
                type="submit"
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium"
                disabled={verifyOTPMutation.isPending || !otp || otp.length !== 6}
              >
                {verifyOTPMutation.isPending ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Verifying...</span>
                  </div>
                ) : (
                  'Verify OTP'
                )}
              </Button>

              <div className="text-center space-y-3">
                <button
                  type="button"
                  onClick={handleResendOTP}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Didn't receive OTP? Resend
                </button>
                
                <div>
                  <Link
                    to="/login"
                    className="inline-flex items-center text-sm text-gray-600 hover:text-gray-700 font-medium"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Back to Login
                  </Link>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            Remember your password?{' '}
            <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerifyOTP;
