# Website Admin

Admin dashboard for events, employees, participants, and analytics.

## Tech Stack
- React 19
- Vite 7
- Lucide React

## Prerequisites
- Node.js 18+
- npm 9+

## Install
```bash
npm install
```

## Environment Variables
Create `.env` in this folder:

```env
VITE_API_URL=<YOUR_BACKEND_API_BASE>
VITE_ADMIN_EMAIL=<YOUR_ADMIN_EMAIL>
VITE_ADMIN_PASS=<YOUR_ADMIN_PASSWORD>
VITE_EMPLOYEE_VERIFY_URL=<YOUR_EMPLOYEE_VERIFY_ROUTE>
```

Example:
```env
VITE_API_URL=http://localhost:5001/api
VITE_EMPLOYEE_VERIFY_URL=http://localhost:5173/employee-card
```

## Run
```bash
npm run dev
```

## Build
```bash
npm run build
npm run preview
```

## Features Included
- Dashboard stats
- Event management
- Employee management (QR preview/download, photo-safe URL display)
- Participants management
- Analytics

## Panel Policy
- Cloner/Explorer pages are intentionally not exposed in website admin UI.

## Notes
- Keep all secrets in `.env` only.
- Do not commit admin credentials.
