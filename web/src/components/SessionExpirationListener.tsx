import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const SessionExpirationListener = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleSessionExpired = (event: CustomEvent) => {
      const reason = event.detail?.reason || 'Session expired';
      
      // Show toast notification using a simple approach
      // Create a simple toast notification
      const toast = document.createElement('div');
      toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #ef4444;
        color: white;
        padding: 16px;
        border-radius: 8px;
        z-index: 9999;
        font-family: system-ui, sans-serif;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      `;
      toast.innerHTML = `
        <div style="font-weight: 600; margin-bottom: 4px;">Session Expired</div>
        <div>Your session has expired. Please log in again.</div>
      `;
      
      document.body.appendChild(toast);
      
      // Remove toast after 5 seconds
      setTimeout(() => {
        if (document.body.contains(toast)) {
          document.body.removeChild(toast);
        }
      }, 5000);
      
      // Navigate to login page
      navigate('/');
    };

    // Listen for session expiration events
    window.addEventListener('session-expired', handleSessionExpired as EventListener);

    // Cleanup
    return () => {
      window.removeEventListener('session-expired', handleSessionExpired as EventListener);
    };
  }, [navigate]);

  // This component doesn't render anything
  return null;
};

export default SessionExpirationListener;
