import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { authService } from '@/services/auth';

interface SessionContextType {
  isValidating: boolean;
  isValid: boolean;
  refreshValidation: () => Promise<void>;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

interface SessionProviderProps {
  children: ReactNode;
}

const MIN_VALIDATION_GAP = 60 * 1000; // 1 min

export const SessionProvider: React.FC<SessionProviderProps> = ({ children }) => {
  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // Refs for throttling + locking
  const lastValidatedAtRef = useRef(0);
  const validatingRef = useRef(false);

  const handleSessionExpiration = useCallback(
    (reason: string) => {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      navigate('/');
    },
    [navigate]
  );

  const validateSessionOnLoad = useCallback(async () => {
    setIsValidating(true);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setIsValid(false);
        return;
      }

      const response = await authService.validateSession();
      if (response.success) {
        setIsValid(true);
      } else {
        setIsValid(false);
        handleSessionExpiration('Session validation failed');
      }
    } catch (error: any) {
      const errorMessage = error.message || '';
      if (
        errorMessage.includes('Session expired') ||
        errorMessage.includes('SESSION_EXPIRED') ||
        errorMessage.includes('No active session found') ||
        errorMessage.includes('Session timed out') ||
        errorMessage.includes('Session validation failed')
      ) {
        setIsValid(false);
        handleSessionExpiration(errorMessage);
      }
    } finally {
      setIsValidating(false);
    }
  }, [handleSessionExpiration]);

  // ---- Throttled wrapper ----
  const validateSessionThrottled = useCallback(
    async (reason: string = 'unknown') => {
      const now = Date.now();
      if (validatingRef.current) return; // already running
      if (now - lastValidatedAtRef.current < MIN_VALIDATION_GAP) return;

      validatingRef.current = true;
      lastValidatedAtRef.current = now;

      try {
        await validateSessionOnLoad();
      } finally {
        validatingRef.current = false;
      }
    },
    [validateSessionOnLoad]
  );

  const refreshValidation = useCallback(async () => {
    setIsValidating(true);
    try {
      const response = await authService.validateSession();
      setIsValid(response.success);
      if (!response.success) {
        handleSessionExpiration('Session refresh failed');
      }
    } catch {
      setIsValid(false);
      handleSessionExpiration('Session refresh error');
    } finally {
      setIsValidating(false);
    }
  }, [handleSessionExpiration]);

  useEffect(() => {
    const publicRoutes = ['/', '/forgot-password', '/verify-otp', '/reset-password'];
    if (publicRoutes.includes(location.pathname)) {
      setIsValid(true);
      setIsValidating(false);
      return;
    }

    const token = localStorage.getItem('authToken');
    if (!token) {
      setIsValid(false);
      setIsValidating(false);
      return;
    }

    // Initial validation
    validateSessionThrottled('initial load');

    // Interval validation
    const interval = location.pathname.includes('/student/test/')
      ? 30 * 1000 // 30s for test routes
      : 2 * 60 * 1000; // 2 min otherwise
    const intervalId = setInterval(() => validateSessionThrottled('interval'), interval);

    // Idle timeout validation
    let idleTimer: NodeJS.Timeout;
    const resetIdleTimer = () => {
      clearTimeout(idleTimer);
      const idleTimeout = location.pathname.includes('/student/test/')
        ? 2 * 60 * 1000 // 2 min idle for test
        : 5 * 60 * 1000; // 5 min otherwise
      idleTimer = setTimeout(() => validateSessionThrottled('idle timeout'), idleTimeout);
    };

    ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'].forEach((ev) =>
      document.addEventListener(ev, resetIdleTimer)
    );
    resetIdleTimer();

    // Stable handlers for critical events
    const handleFocus = () => validateSessionThrottled('focus');
    const handleOnline = () => validateSessionThrottled('online');
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'authToken' && e.newValue === null) {
        handleSessionExpiration('Logged out from another tab');
      }
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('online', handleOnline);
    window.addEventListener('storage', handleStorage);

    return () => {
      clearInterval(intervalId);
      clearTimeout(idleTimer);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('storage', handleStorage);
      ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'].forEach((ev) =>
        document.removeEventListener(ev, resetIdleTimer)
      );
    };
  }, [location.pathname, validateSessionThrottled, handleSessionExpiration]);

  useEffect(() => {
    const publicRoutes = ['/', '/forgot-password', '/verify-otp', '/reset-password'];
    if (!isValidating && !isValid && !publicRoutes.includes(location.pathname)) {
      localStorage.removeItem('authToken');
      navigate('/');
    }
  }, [isValidating, isValid, navigate, location.pathname]);

  return (
    <SessionContext.Provider value={{ isValidating, isValid, refreshValidation }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = (): SessionContextType => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};
