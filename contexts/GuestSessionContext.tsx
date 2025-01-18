import React, { createContext, useContext, useEffect, useState } from 'react';

const GuestSessionContext = createContext<string | null>(null);

export const GuestSessionProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [guestSessionId, setGuestSessionId] = useState<string | null>(null);

  useEffect(() => {
    const initializeGuestSession = async () => {
      try {
        const storedSessionId = localStorage.getItem('guest_session_id');
        if (storedSessionId && storedSessionId === guestSessionId) {
          console.log('Reusing existing guest session:', storedSessionId);
          return; // Avoid reinitializing the session
        }

        // Create a new session only if no valid session exists
        const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
        if (!API_KEY) {
          throw new Error(
            'API key is missing. Please check your environment variables.'
          );
        }

        const response = await fetch(
          `https://api.themoviedb.org/3/authentication/guest_session/new?api_key=${API_KEY}`
        );

        if (!response.ok) {
          throw new Error(
            `Failed to create guest session: ${response.statusText}`
          );
        }

        const data = await response.json();

        if (data.success && data.guest_session_id) {
          setGuestSessionId(data.guest_session_id);
          localStorage.setItem('guest_session_id', data.guest_session_id);
          console.log('New guest session created:', data.guest_session_id);
        } else {
          throw new Error('Failed to create a valid guest session.');
        }
      } catch (error) {
        console.error('Error creating guest session:', error);
      }
    };

    if (!guestSessionId) {
      initializeGuestSession();
    }
  }, [guestSessionId]);

  return (
    <GuestSessionContext.Provider value={guestSessionId}>
      {children}
    </GuestSessionContext.Provider>
  );
};

export const useGuestSession = () => useContext(GuestSessionContext);
