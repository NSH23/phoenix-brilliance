import { createClient } from '@supabase/supabase-js';

// Get environment variables
// Try multiple ways to access env vars (for debugging)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() || 
                     (import.meta.env as any).VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() || 
                        (import.meta.env as any).VITE_SUPABASE_ANON_KEY?.trim();

// Debug logs removed for cleaner console

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  const errorMessage = `
Missing Supabase environment variables!

Found:
- VITE_SUPABASE_URL: ${supabaseUrl ? '✓ Set' : '✗ Missing'}
- VITE_SUPABASE_ANON_KEY: ${supabaseAnonKey ? '✓ Set' : '✗ Missing'}

Please ensure:
1. Your .env file exists in the project root
2. Variables are prefixed with VITE_
3. No spaces around the = sign
4. Restart your dev server after creating/modifying .env

Example .env format:
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
  `.trim();
  
  throw new Error(errorMessage);
}

// Validate URL format
if (!supabaseUrl.startsWith('http://') && !supabaseUrl.startsWith('https://')) {
  throw new Error(`VITE_SUPABASE_URL must be a valid HTTP/HTTPS URL. Got: ${supabaseUrl.substring(0, 50)}...`);
}

// Create and export Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// Type definitions for database (optional - helps with TypeScript autocomplete)
// You can generate these types using: npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/supabase.ts
export type Database = {
  // Add your database types here after generating them
};
