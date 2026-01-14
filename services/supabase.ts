import { createClient } from '@supabase/supabase-js';

// SECURITY NOTE:
// Para produção no Vercel, defina as variáveis de ambiente:
// VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY

const FALLBACK_URL = 'https://yajusmgvndomnzbkwlvt.supabase.co';
// Nota: Esta chave parece ser um token específico ou chave de projeto. 
// O ideal é usar a chave 'anon' pública (geralmente começa com eyJ...) encontrada em Project Settings > API.
const FALLBACK_KEY = 'sb_publishable_dZTu19j0hUnWzZa9NwdK8Q_-dSdQY_Z';

// Helper seguro para variáveis de ambiente
const getEnv = (key: string) => {
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
      // @ts-ignore
      return import.meta.env[key];
    }
  } catch (e) {}

  try {
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key];
    }
  } catch (e) {}

  return undefined;
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL') || getEnv('SUPABASE_URL') || FALLBACK_URL;
const supabaseKey = getEnv('VITE_SUPABASE_ANON_KEY') || getEnv('SUPABASE_ANON_KEY') || FALLBACK_KEY;

let client;

try {
  if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase Credentials Missing');
  }
  client = createClient(supabaseUrl, supabaseKey);
} catch (error) {
  console.error('Supabase Initialization Error:', error);
  // Fallback seguro para não quebrar a tela (white screen)
  client = {
    from: () => ({
      select: () => ({ data: [], error: { message: 'Supabase not initialized properly' } }),
      insert: () => ({ error: { message: 'Supabase not initialized properly' } }),
      update: () => ({ error: { message: 'Supabase not initialized properly' } }),
      delete: () => ({ error: { message: 'Supabase not initialized properly' } }),
    })
  } as any;
}

export const supabase = client;