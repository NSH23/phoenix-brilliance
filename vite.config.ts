import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    server: {
      host: "::",
      port: 8080,
      hmr: {
        overlay: false,
      },
    },
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    // Explicitly define environment variables
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY),
    },
    build: {
      chunkSizeWarningLimit: 500,
      rollupOptions: {
        output: {
          manualChunks: {
            "react-vendor": ["react", "react-dom", "react-router-dom"],
            "supabase-vendor": ["@supabase/supabase-js"],
            "motion-vendor": ["framer-motion"],
            "query-vendor": ["@tanstack/react-query"],
          },
        },
      },
      // Enable source maps for production debugging (set to false for smaller builds)
      sourcemap: false,
      // Minify with esbuild (faster than terser)
      minify: 'esbuild',
      // Target modern browsers for smaller bundle
      target: 'esnext',
      // CSS code splitting
      cssCodeSplit: true,
    },
  };
});
