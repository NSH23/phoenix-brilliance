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
          manualChunks(id) {
            if (id.includes("/src/pages/admin/") || id.includes("/src/components/admin/")) {
              return "admin";
            }
            if (!id.includes("node_modules")) return;

            // React-dependent libs must share the react-vendor chunk (framer-motion
            // in a separate chunk caused React.createContext to be undefined at runtime).
            if (id.includes("@tanstack/react-query")) return "query-vendor";
            if (id.includes("@supabase")) return "supabase-vendor";
            if (id.includes("recharts") || id.includes("@radix-ui")) return "ui-vendor";
            if (
              id.includes("framer-motion") ||
              /node_modules[\\/]motion[\\/]/.test(id) ||
              id.includes("react-router") ||
              id.includes("react-dom") ||
              /node_modules[\\/]react[\\/]/.test(id) ||
              id.includes("scheduler")
            ) {
              return "react-vendor";
            }
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
