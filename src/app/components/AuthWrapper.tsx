import { useEffect, useState, ReactNode } from 'react';
import { initializeUser } from '@/lib/db';

interface AuthWrapperProps {
  children: ReactNode;
}

export default function AuthWrapper({ children }: AuthWrapperProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const authenticate = async () => {
      // Local development bypass
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        const mockUserId = 'mock-user-123';
        sessionStorage.setItem('user_id', mockUserId);
        
        // Ensure database is initialized for the mock user
        try {
          await initializeUser(mockUserId);
        } catch (e) {
          console.warn('Mock user db init failed. Ensure VITE_NEON_DATABASE_URL is set in .env:', e);
        }
        
        setIsAuthenticated(true);
        return;
      }

      // Allow the /token route to render without an infinite loop
      if (window.location.pathname === '/token') {
        setIsAuthenticated(true);
        return;
      }

      // 1. Extraction: Check URL query parameters for token
      const params = new URLSearchParams(window.location.search);
      const token = params.get('token');

      // Check if we already have a session
      const existingUserId = sessionStorage.getItem('user_id');

      if (!token && existingUserId) {
        // If no token in URL but we have a session, we are authenticated
        setIsAuthenticated(true);
        return;
      }

      if (!token) {
        // Failure/Missing: redirect
        window.location.href = '/token';
        return;
      }

      try {
        // 2. Validation: POST request to mantracare API
        const response = await fetch('https://api.mantracare.com/user/user-info', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });

        if (!response.ok) {
          throw new Error('Authentication failed');
        }

        const data = await response.json();
        
        // Assuming the response structure contains user_id directly or nested.
        const userId = data.user_id || (data.data && data.data.user_id);

        if (!userId) {
          throw new Error('No user ID found in response');
        }

        // 3. Resolution: Store user_id in sessionStorage
        sessionStorage.setItem('user_id', userId.toString());

        // Clean the URL using history.replaceState to remove token
        const newUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);

        // 4. Database Persistence (Neon)
        // Ensure the database is initialized with the incoming identity
        await initializeUser(userId.toString());

        setIsAuthenticated(true);
      } catch (error) {
        console.error('Handshake error:', error);
        window.location.href = '/token';
      }
    };

    authenticate();
  }, []);

  if (!isAuthenticated) {
    // Blocking Navigation: Full-screen loading state
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-50 dark:bg-zinc-950">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-black dark:border-white border-t-transparent"></div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 animate-pulse">Preparing...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
