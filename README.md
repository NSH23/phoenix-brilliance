# Phoenix Events & Production

Event planning and production company website — Pune, Maharashtra.

## Tech stack

- **Frontend:** Vite, TypeScript, React 18, React Router, Tailwind CSS, Radix UI / shadcn-ui, Framer Motion, Swiper
- **Backend / Data:** Supabase (Auth, Database, Storage, Realtime)
- **Forms / UX:** React Hook Form, Zod, Sonner (toasts)

See **[TECH_STACK.md](./TECH_STACK.md)** for full project structure and features.

## Local development

```sh
npm i
npm run dev
```

## Build

```sh
npm run build
npm run preview
```

## Deploy

Build the project and deploy the `dist` output to your hosting (Vercel, Netlify, or custom). Ensure environment variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set in production.
