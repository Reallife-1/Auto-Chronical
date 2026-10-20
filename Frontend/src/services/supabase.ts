import { createClient } from '@supabase/supabase-js';
import { getAccessToken } from './api';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabase =
  supabaseUrl && supabasePublishableKey
    ? createClient(supabaseUrl, supabasePublishableKey, {
        auth: {
          autoRefreshToken: false,
          detectSessionInUrl: false,
          persistSession: false,
        },
        accessToken: async () => {
          const accessToken = getAccessToken();
          if (!accessToken) {
            throw new Error('Sign in before uploading a profile image.');
          }
          return accessToken;
        },
      })
    : null;
