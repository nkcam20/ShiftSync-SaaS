# ShiftSync Setup Guide

## 1. Database (Supabase)
1. Ensure you have a Supabase project at [Supabase](https://supabase.com/).
2. Access the **SQL Editor** in your Supabase Dashboard.
3. Open `database/schema.sql` located in this repository.
4. Run the entire SQL file to create the tables, indexes, and Row Level Security (RLS) policies.

## 2. Backend Environment Setup (Railway / Local)
1. Ensure Node.js 18+ is installed.
2. In the `backend` folder, duplicate `.env.example` and name it `.env`.
3. In `.env`, provide:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_KEY`
   - Random string for `JWT_SECRET` and `JWT_REFRESH_SECRET`
   - SMTP credentials for emails.
   - Frontend URL.
4. Run `npm install` and then `npm start` to run the backend.
5. Provide these same env variables on Railway configurations for deployment.

## 3. Frontend Environment Setup (Netlify / Local)
1. Ensure you are in the `frontend` folder.
2. Create `.env` from the provided example or defaults.
3. Provide `VITE_API_URL` pointing to backend (e.g. Railway URL like `https://shiftsync-api.up.railway.app/api`).
4. Provide `VITE_SOCKET_URL` pointing to the backend root (e.g. `https://shiftsync-api.up.railway.app`).
5. Run `npm install`, then `npm run build` to compile the app.
6. Serve `dist` folder on Netlify (or just connect Netlify to the Github repository).

## 4. First Run
1. Go to the registered Frontend URL -> `/register`
2. Create a Manager account by filling in the business details.
3. Access your dashboard, go to Team, and invite an employee by their email!
