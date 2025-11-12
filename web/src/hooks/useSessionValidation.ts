import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { authService } from '@/services/auth';

/**
 * @deprecated This hook is deprecated. Use the SessionProvider and useSession hook instead.
 * This hook creates multiple intervals and event listeners when used in multiple components.
 * The SessionProvider provides centralized session management.
 */
export const useSessionValidation = () => {
  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // console.log('useSessionValidation - Hook initialized');

  const handleSessionExpiration = useCallback((reason: string) => {
    // Get current location to determine if user is on student or admin side
    const isStudentRoute = location.pathname.startsWith('/student');
    
    // Clear local storage
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    
    // Redirect to login page
    navigate('/');
  }, [navigate, location.pathname]);

  const validateSessionOnLoad = useCallback(async () => {
    try {
      setIsValidating(true);
      
      // Check if token exists
      const token = localStorage.getItem('authToken');
      // console.log('Session validation - Token exists:', !!token);
      if (!token) {
        // console.log('Session validation - No token found, setting invalid');
        setIsValid(false);
        setIsValidating(false);
        return;
      }

      // Validate session immediately
      // console.log('Session validation - Calling authService.validateSession()');
      const response = await authService.validateSession();
      // console.log('Session validation - Response:', response);
      if (response.success) {
        // console.log('Session validation - Session is valid');
        setIsValid(true);
      } else {
        setIsValid(false);
        // Immediately remove the invalid token to trigger logout
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        handleSessionExpiration('Session validation failed');
      }
    } catch (error: any) {
      // Check if it's a session-related error
      const errorMessage = error.message || '';
      if (errorMessage.includes('Session expired') || 
          errorMessage.includes('SESSION_EXPIRED') || 
          errorMessage.includes('No active session found') || 
          errorMessage.includes('Session timed out') ||
          errorMessage.includes('Session validation failed')) {
        
        setIsValid(false);
        // Immediately remove the invalid token to trigger logout
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        handleSessionExpiration(errorMessage);
      } else {
        // For network errors or other issues, don't immediately invalidate the session
        // Don't change isValid state for network errors
      }
    } finally {
      setIsValidating(false);
    }
  }, [handleSessionExpiration]);

  useEffect(() => {
    // console.log('useSessionValidation - Main effect running');
    
    const token = localStorage.getItem('authToken');
    if (!token) {
      // console.log('useSessionValidation - No token, setting invalid immediately');
      setIsValid(false);
      setIsValidating(false);
      return;
    }

    const testApiConnection = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
        // console.log('useSessionValidation - Testing API connection to:', apiUrl);
        
        const response = await fetch(`${apiUrl}/auth/validate-session`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
          // console.log('useSessionValidation - API test response status:', response.status);
        
        if (response.status === 401) {
          // console.log('useSessionValidation - API returned 401, session invalid');
          setIsValid(false);
          // Immediately remove the invalid token to trigger logout
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          // console.log('useSessionValidation - Invalid token removed from localStorage due to 401 response');
          handleSessionExpiration('Session invalid');
          return;
        }
        
        if (response.ok) {
          // console.log('useSessionValidation - API connection successful');
          setIsValid(true);
          setIsValidating(false);
          validateSessionOnLoad();
        } else {
          // console.log('useSessionValidation - API connection failed with status:', response.status);
          setIsValid(true);
          setIsValidating(false);
        }
      } catch (error) {
        // console.error('useSessionValidation - API connection test failed:', error);
        setIsValid(true);
        setIsValidating(false);
      }
    };

    testApiConnection();

    // Set up periodic validation every 2 minutes
    const intervalId = setInterval(async () => {
      // console.log('Session validation - Periodic validation running');
      try {
        await validateSessionOnLoad();
      } catch (error) {
        // console.error('Session validation - Periodic validation failed:', error);
        // If periodic validation fails, remove token to trigger logout
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        // console.log('Session validation - Token removed due to periodic validation failure');
        handleSessionExpiration('Periodic validation failed');
      }
    }, 2 * 60 * 1000); // 2 minutes

    // Additional monitoring for student routes - more frequent checks
    let studentIntervalId: NodeJS.Timeout | null = null;
    if (location.pathname.startsWith('/student')) {
      // console.log('Session validation - Setting up enhanced monitoring for student routes');
      studentIntervalId = setInterval(async () => {
        // console.log('Session validation - Enhanced student session check');
        try {
          await validateSessionOnLoad();
        } catch (error) {
          // console.error('Session validation - Student periodic validation failed:', error);
          // If student periodic validation fails, remove token to trigger logout
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          // console.log('Session validation - Student token removed due to periodic validation failure');
          handleSessionExpiration('Student periodic validation failed');
        }
      }, 5 * 60 * 1000); // Every 1 minute for students
      
      // Even more frequent checks for students taking tests
      if (location.pathname.includes('/student/test/')) {
        // console.log('Session validation - Setting up ultra-frequent monitoring for student test');
        const testIntervalId = setInterval(async () => {
          // console.log('Session validation - Student test session check');
          try {
            await validateSessionOnLoad();
          } catch (error) {
            // console.error('Session validation - Student test periodic validation failed:', error);
            // If student test periodic validation fails, remove token to trigger logout
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
            // console.log('Session validation - Student test token removed due to periodic validation failure');
            handleSessionExpiration('Student test periodic validation failed');
          }
        }, 30 * 1000); // Every 30 seconds for students in tests
        
        // Add to cleanup
        setTimeout(() => {
          if (testIntervalId) {
            clearInterval(testIntervalId);
          }
        }, 0);
      }
    }

    // Validate on user activity after being idle
    let idleTimer: NodeJS.Timeout;
    const resetIdleTimer = () => {
      clearTimeout(idleTimer);
      
      // Shorter idle timeout for students taking tests
      const isStudentTest = location.pathname.includes('/student/test/');
      const idleTimeout = isStudentTest ? 2 * 60 * 1000 : 5 * 60 * 1000; // 2 min for tests, 5 min otherwise
      
      idleTimer = setTimeout(async () => {
        if (isStudentTest) {
          // console.log('Session validation - Student test idle timeout reached');
        } else {
          // console.log('Session validation - User idle timeout reached');
        }
        try {
          await validateSessionOnLoad();
        } catch (error) {
          // console.error('Session validation - Idle timeout validation failed:', error);
          // If idle timeout validation fails, remove token to trigger logout
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          // console.log('Session validation - Token removed due to idle timeout validation failure');
          handleSessionExpiration('Idle timeout validation failed');
        }
      }, idleTimeout);
    };

    // Reset idle timer on user activity
    const handleUserActivity = async () => {
      const isStudentRoute = location.pathname.startsWith('/student');
      
      if (isStudentRoute) {
        // console.log('Session validation - Student user activity detected');
        // For students, reset idle timer and validate session
        resetIdleTimer();
        // Also validate session on user activity for students
        try {
          await validateSessionOnLoad();
        } catch (error) {
          // console.error('Session validation - Student user activity validation failed:', error);
          // If student user activity validation fails, remove token to trigger logout
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          // console.log('Session validation - Student token removed due to user activity validation failure');
          handleSessionExpiration('Student user activity validation failed');
        }
      } else {
        resetIdleTimer();
      }
    };

    // Set up idle timer
    resetIdleTimer();

    // Listen for user activity
    document.addEventListener('mousemove', handleUserActivity);
    document.addEventListener('keydown', handleUserActivity);
    document.addEventListener('click', handleUserActivity);
    document.addEventListener('scroll', handleUserActivity);
    document.addEventListener('touchstart', handleUserActivity);

    // Also validate on window focus (when user returns to tab)
    const handleWindowFocus = () => {
      const isStudentRoute = location.pathname.startsWith('/student');
      
      if (isStudentRoute) {
        //  console.log('Session validation - Student tab focused, validating session');
        // For students, validate immediately when they return to the tab
        validateSessionOnLoad();
      } else {
        validateSessionOnLoad();
      }
    };

    // Validate on browser back/forward navigation
    const handlePopState = () => {
      const isStudentRoute = location.pathname.startsWith('/student');
      
      if (isStudentRoute) {
        //  console.log('Session validation - Student browser navigation, validating session');
        // For students, validate immediately on browser navigation
        validateSessionOnLoad();
      } else {
        validateSessionOnLoad();
      }
    };

    // Validate when page becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        const isStudentRoute = location.pathname.startsWith('/student');
        
        if (isStudentRoute) {
          // console.log('Session validation - Student page became visible');
          // For students, validate immediately when they return to the tab
          validateSessionOnLoad();
        } else {
          validateSessionOnLoad();
        }
      }
    };

    // Validate when network comes back online
    const handleOnline = () => {
      const isStudentRoute = location.pathname.startsWith('/student');
      
      if (isStudentRoute) {
        // console.log('Session validation - Student network recovered, validating session');
        // For students, validate immediately when network comes back
        validateSessionOnLoad();
      } else {
        validateSessionOnLoad();
      }
    };

    // Validate when localStorage changes (logout from other tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'authToken' && e.newValue === null) {
        // Token was removed from another tab
        const isStudentRoute = location.pathname.startsWith('/student');
        
        if (isStudentRoute) {
          // console.log('Session validation - Student session removed from another tab');
          // For students, show a more urgent message if they're in a test
          if (location.pathname.includes('/test/')) {
            // console.log('Session validation - Student test session interrupted');
          }
        }
        
        // Ensure token is removed from current tab as well
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        // console.log('Session validation - Token removed from current tab due to storage change');
        
        handleSessionExpiration('Logged out from another tab');
      }
    };

    window.addEventListener('focus', handleWindowFocus);
    window.addEventListener('popstate', handlePopState);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnline);
    window.addEventListener('storage', handleStorageChange);

    // Cleanup
    return () => {
      window.removeEventListener('focus', handleWindowFocus);
      window.removeEventListener('popstate', handlePopState);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('mousemove', handleUserActivity);
      document.removeEventListener('keydown', handleUserActivity);
      document.removeEventListener('click', handleUserActivity);
      document.removeEventListener('scroll', handleUserActivity);
      document.removeEventListener('touchstart', handleUserActivity);
      clearTimeout(idleTimer);
      clearInterval(intervalId);
      if (studentIntervalId) {
        clearInterval(studentIntervalId);
      }
    };
  }, [validateSessionOnLoad, handleSessionExpiration]);

  // Validate session on route changes
  useEffect(() => {
    if (location.pathname !== '/') {
      //  console.log('Session validation - Route changed to:', location.pathname);
      
      // Enhanced validation for student routes
      if (location.pathname.startsWith('/student')) {
        // console.log('Session validation - Student route detected, running immediate validation');
        validateSessionOnLoad();
      } else {
        // console.log('Session validation - Other route detected, running standard validation');
        validateSessionOnLoad();
      }
    }
  }, [location.pathname, validateSessionOnLoad]);

  const refreshValidation = async () => {
    setIsValidating(true);
    try {
      const response = await authService.validateSession();
      setIsValid(response.success);
      if (!response.success) {
        handleSessionExpiration('Session refresh failed');
      }
    } catch (error) {
      setIsValid(false);
      handleSessionExpiration('Session refresh error');
    } finally {
      setIsValidating(false);
    }
  };

  return {
    isValidating,
    isValid,
    refreshValidation
  };
};
