import React from 'react';
import { useSession } from '@/contexts/SessionContext';

/**
 * @deprecated This component is deprecated. Use the SessionProvider in App.tsx instead.
 * The SessionProvider now handles all session validation centrally.
 */
interface SessionValidatorProps {
  children: React.ReactNode;
}

const SessionValidator: React.FC<SessionValidatorProps> = ({ children }) => {
  const { isValidating, isValid } = useSession();

  // Show loading while validating
  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Validating session...</p>
        </div>
      </div>
    );
  }

  // If session is invalid, the SessionProvider will handle redirect
  if (!isValid) {
    return null;
  }

  return <>{children}</>;
};

export default SessionValidator;
