# Frontend

The Next.js app-router client for the Online Learning Platform. See the repository [README](../README.md) for setup, database safety notes, features, and validation commands.

Run `npm install` and `npm run dev` from this directory. To use a different API address, set `NEXT_PUBLIC_API_URL` in `.env.local` (see `.env.example`).

The root `src/app/page.js` serves `/`. `src/app/courses/[id]/page.js` serves `/courses/:id`; the files share a name because they belong to distinct app-router segments.
