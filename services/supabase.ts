import { createClient } from '@supabase/supabase-js';

// Helper to get env vars safely in different environments (Vite, Next.js, etc)
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

// Try to get credentials
const supabaseUrl = getEnv('VITE_SUPABASE_URL') || getEnv('SUPABASE_URL');
const supabaseKey = getEnv('VITE_SUPABASE_ANON_KEY') || getEnv('SUPABASE_ANON_KEY');

let client;

// Only attempt to initialize if we have values that look remotely valid
if (supabaseUrl && supabaseKey) {
  try {
    client = createClient(supabaseUrl, supabaseKey);
  } catch (error) {
    console.warn('Supabase initialization warning:', error);
  }
}

// Fallback Mock Client if initialization failed or keys are missing
if (!client) {
  console.warn('⚠️ Supabase not connected. Using mock client. Please check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  
  const mockSuccess = { data: [], error: null };
  const mockError = { data: null, error: { message: 'Supabase credentials missing. App is in read-only mock mode.' } };

  // Helper to create a chainable mock object that mimics Supabase QueryBuilder
  const createMockChain = (response: any) => {
    return {
      select: () => createMockChain(mockSuccess),
      insert: () => createMockChain(mockError),
      update: () => createMockChain(mockError),
      delete: () => createMockChain(mockError),
      upsert: () => createMockChain(mockError),
      order: () => createMockChain(response),
      eq: () => createMockChain(response),
      single: () => createMockChain(response),
      limit: () => createMockChain(response),
      range: () => createMockChain(response),
      // Make it awaitable so it behaves like a Promise
      then: (resolve: any, reject: any) => Promise.resolve(response).then(resolve, reject)
    };
  };

  client = {
    from: (table: string) => createMockChain(mockSuccess),
    storage: {
      from: () => ({
        upload: () => Promise.resolve(mockError),
        getPublicUrl: () => ({ data: { publicUrl: '' } })
      })
    }
  } as any;
}

export const supabase = client;