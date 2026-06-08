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
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes("node_modules")) return;

            // Supabase is standalone — safe to split.
            if (id.includes("@supabase")) return "supabase-vendor";

            // Keep every React-dependent package in ONE chunk. Splitting framer-motion,
            // react-query, or Radix into separate vendor chunks caused React.createContext
            // to run before React was initialised (white screen on Vercel).
            if (
              id.includes("/react") ||
              id.includes("framer-motion") ||
              /node_modules[\\/]motion[\\/]/.test(id) ||
              id.includes("scheduler")
            ) {
              return "react-vendor";
            }
          },
        },
      },
      sourcemap: false,
      minify: 'esbuild',
      target: 'esnext',
      cssCodeSplit: true,
    },
  };
});
