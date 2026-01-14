import { createClient } from '@supabase/supabase-js';

// SECURITY NOTE:
// As chaves abaixo foram adicionadas para garantir o funcionamento imediato do frontend.
// Para produção no Vercel, recomenda-se mover estes valores para "Environment Variables":
// VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY
//
// Certifique-se de que o Row Level Security (RLS) esteja ativado no Supabase.

const FALLBACK_URL = 'https://yajusmgvndomnzbkwlvt.supabase.co';
const FALLBACK_KEY = 'sb_publishable_dZTu19j0hUnWzZa9NwdK8Q_-dSdQY_Z';

// Helper function to safely access environment variables
const getEnv = (key: string) => {
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
      // @ts-ignore
      return import.meta.env[key];
    }
  } catch (e) {
    // Ignore error
  }

  try {
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key];
    }
  } catch (e) {
    // Ignore error
  }

  return undefined;
};

// Priority: Environment Variable > Hardcoded Fallback
const supabaseUrl = getEnv('VITE_SUPABASE_URL') || getEnv('SUPABASE_URL') || FALLBACK_URL;
const supabaseKey = getEnv('VITE_SUPABASE_ANON_KEY') || getEnv('SUPABASE_ANON_KEY') || FALLBACK_KEY;

// Validation to prevent "supabaseUrl is required" error
if (!supabaseUrl || typeof supabaseUrl !== 'string') {
    throw new Error('Supabase URL is missing. Please check your configuration.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);