# Troubleshooting Environment Variables

If you're seeing "Missing Supabase environment variables" error, follow these steps:

## Step 1: Verify .env File Location
The `.env` file MUST be in the project root (same folder as `package.json` and `vite.config.ts`).

## Step 2: Check .env File Format
Your `.env` file should look exactly like this (no spaces, no quotes):

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Common mistakes:**
- ❌ `VITE_SUPABASE_URL = https://...` (spaces around =)
- ❌ `VITE_SUPABASE_URL="https://..."` (quotes)
- ❌ `VITE_SUPABASE_URL=https://...` (trailing spaces)
- ✅ `VITE_SUPABASE_URL=https://...` (correct)

## Step 3: Clear Vite Cache and Restart

1. **Stop your dev server** (Ctrl+C)

2. **Clear Vite cache:**
   ```bash
   # Windows PowerShell
   Remove-Item -Recurse -Force node_modules\.vite
   
   # Or manually delete: node_modules/.vite folder
   ```

3. **Restart dev server:**
   ```bash
   npm run dev
   ```

## Step 4: Check Browser Console

After restarting, check the browser console. You should see:
```
Environment check: {
  hasUrl: true,
  hasKey: true,
  ...
}
```

If you still see `hasUrl: false` or `hasKey: false`, continue troubleshooting.

## Step 5: Verify File Encoding

The `.env` file should be UTF-8 encoded. Some editors save with BOM (Byte Order Mark) which can cause issues.

**To fix:**
1. Open `.env` in a text editor (VS Code, Notepad++)
2. Save as UTF-8 (without BOM)
3. Restart dev server

## Step 6: Check for Multiple .env Files

Vite loads environment files in this order (later files override earlier):
1. `.env`
2. `.env.local`
3. `.env.[mode]`
4. `.env.[mode].local`

Make sure you don't have conflicting values in other `.env` files.

## Step 7: Hard Refresh Browser

After restarting the dev server:
- Press `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
- Or open DevTools and right-click refresh → "Empty Cache and Hard Reload"

## Step 8: Verify in Vite Config (Optional)

You can add explicit env loading in `vite.config.ts`:

```typescript
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    // ... your config
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY),
    },
  };
});
```

## Still Not Working?

1. **Check if .env is in .gitignore** (it should be)
2. **Verify file permissions** - make sure the file is readable
3. **Try creating a new .env file** from scratch
4. **Check for hidden characters** - copy values from `.env.example` and replace placeholders

## Quick Test

Add this temporarily to `src/lib/supabase.ts` to see what Vite sees:

```typescript
console.log('All import.meta.env:', import.meta.env);
console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY);
```

This will show you exactly what Vite is reading.
