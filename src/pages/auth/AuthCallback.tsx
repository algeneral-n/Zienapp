import React, { useEffect } from 'react';
import { supabase } from '../../services/supabase';

/**
 * Handles OAuth redirects (/auth/callback).
 * Supabase puts the tokens in the URL hash; this page
 * exchanges them for a session then redirects to /portal.
 */
export default function AuthCallback() {
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        window.history.replaceState({}, '', '/portal');
        window.dispatchEvent(new PopStateEvent('popstate'));
      } else {
        window.history.replaceState({}, '', '/login');
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
    });
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="w-8 h-8 mx-auto border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-500">Completing authentication...</p>
      </div>
    </div>
  );
}
