# FinLens

Family-centered financial management & education app. Vite + React + TypeScript + Supabase, with EN/AR i18n and full RTL support.

## Stack

- **Build:** Vite 5 + React 18 + TypeScript
- **Routing:** react-router-dom v6
- **i18n:** i18next + react-i18next (EN / AR with RTL switching)
- **Backend:** Supabase (auth + Postgres) — schema in `../FinLens/SUPABASE_SCHEMA.md`

## Getting started

```bash
cd finlens-app
cp .env.example .env       # then fill VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm install
npm run dev
```

Open http://localhost:5173. The app starts on `/login`. Sign up creates a Supabase auth user (the household admin).

# Hackathon Project Links

## Demo Video
[Watch the YouTube Demo](https://youtu.be/DSwvUO4lqYo)

## Live Website
Parent account
email: vafawa7891@donumart.com
password: 12345678

Child account
email: ahmad@gmail.com
password: 12345678

[Open the Project on Render](https://finlens-o207.onrender.com)
