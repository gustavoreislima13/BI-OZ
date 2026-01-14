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

// Credentials provided by configuration
const DEFAULT_URL = 'https://yajusmgvndomnzbkwlvt.supabase.co';
const DEFAULT_KEY = 'sb_publishable_dZTu19j0hUnWzZa9NwdK8Q_-dSdQY_Z';

// Try to get credentials (Env vars take precedence, then hardcoded defaults)
const supabaseUrl = getEnv('VITE_SUPABASE_URL') || getEnv('SUPABASE_URL') || DEFAULT_URL;
const supabaseKey = getEnv('VITE_SUPABASE_ANON_KEY') || getEnv('SUPABASE_ANON_KEY') || DEFAULT_KEY;

let client;

// Only attempt to initialize if we have values that look remotely valid
if (supabaseUrl && supabaseKey) {
  try {
    client = createClient(supabaseUrl, supabaseKey);
  } catch (error) {
    console.warn('Supabase initialization warning:', error);
  }
}

// Global in-memory store for the session (Mock Database)
let mockStore: any[] = [];

// Fallback Mock Client if initialization failed or keys are missing
if (!client) {
  console.warn('⚠️ Supabase not connected. Using in-memory mock client.');
  
  client = {
    from: (table: string) => {
       const query = {
          data: null as any,
          error: null as any,
          filters: [] as any[],
          orderConfig: null as any,
          op: 'select' as 'select' | 'insert' | 'update' | 'delete',
          payload: null as any,
          
          select: function(columns = '*') {
             this.op = 'select';
             return this;
          },
          insert: function(rows: any) {
             this.op = 'insert';
             this.payload = Array.isArray(rows) ? rows : [rows];
             return this;
          },
          update: function(row: any) {
             this.op = 'update';
             this.payload = row;
             return this;
          },
          delete: function() {
             this.op = 'delete';
             return this;
          },
          eq: function(column: string, value: any) {
             this.filters.push({ column, value });
             return this;
          },
          order: function(column: string, config: { ascending: boolean }) {
             this.orderConfig = { column, config };
             return this;
          },
          then: function(resolve: any, reject: any) {
             // Execute operation against in-memory store
             try {
                if (this.op === 'select') {
                   let results = [...mockStore];
                   // Apply filters (basic eq support)
                   this.filters.forEach(f => {
                      results = results.filter(r => r[f.column] === f.value);
                   });
                   // Apply order
                   if (this.orderConfig) {
                      const { column, config } = this.orderConfig;
                      results.sort((a, b) => {
                         if (a[column] < b[column]) return config.ascending ? -1 : 1;
                         if (a[column] > b[column]) return config.ascending ? 1 : -1;
                         return 0;
                      });
                   }
                   this.data = results;
                } else if (this.op === 'insert') {
                   if (this.payload) {
                      this.payload.forEach((row: any) => {
                         // Generate ID if missing (simple random string)
                         if (!row.id) row.id = Math.random().toString(36).substring(2, 9);
                         mockStore.push(row);
                      });
                   }
                } else if (this.op === 'update') {
                    mockStore = mockStore.map(row => {
                       let match = true;
                       this.filters.forEach(f => {
                          if (row[f.column] !== f.value) match = false;
                       });
                       if (match) return { ...row, ...this.payload };
                       return row;
                    });
                } else if (this.op === 'delete') {
                    mockStore = mockStore.filter(row => {
                       let match = true;
                       this.filters.forEach(f => {
                          if (row[f.column] !== f.value) match = false;
                       });
                       return !match; // Keep if not match (i.e. remove if match)
                    });
                }
             } catch (e: any) {
                this.error = { message: e.message || 'Unknown mock error' };
             }
             
             return Promise.resolve({ data: this.data, error: this.error }).then(resolve, reject);
          }
       };
       // Support 'await supabase.from().select()' directly by returning the thenable object
       return query;
    },
    storage: {
      from: () => ({
        upload: () => Promise.resolve({ data: null, error: { message: 'Storage not supported in mock' } }),
        getPublicUrl: () => ({ data: { publicUrl: '' } })
      })
    }
  } as any;
}

export const supabase = client;