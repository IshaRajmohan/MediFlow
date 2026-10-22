# MediFlow Frontend — connected to Express

React + Vite + Tailwind CSS patient portal. The UI now calls the Express API instead of using demo doctor, authentication, and appointment data.

## Run locally

1. Start MongoDB / ensure your existing backend `.env` is configured.
2. Start the backend from its existing `backend` folder (default: `http://localhost:3000`).
3. In this frontend folder, run:

   ```bash
   npm install
   npm run dev
   ```

4. Open the URL Vite prints (usually `http://localhost:5173`).

The Vite dev server proxies `/api/*` to `http://localhost:3000`, so you don't need to configure CORS just for local development. If you change the backend port, update `server.proxy` in `vite.config.js`.

## API endpoints used

- `GET /api/doctors` — load doctors from MongoDB.
- `POST /api/auth/register` — create an account.
- `POST /api/auth/login` — sign in and receive a JWT.
- `POST /api/appointments` — create an appointment using the signed-in user's token.
- `GET /api/appointments` — load the signed-in user's appointments.

The JWT is stored in `localStorage` under `mediflow_token` and sent in the `Authorization: Bearer ...` header for API requests. This is a straightforward learning-project setup; for a production healthcare application, use a security-reviewed session/token strategy and HTTPS.

## Important backend requirements

- The login route must return `{ success: true, token, user: { name, email, ... } }`.
- The register route currently returns success only; the frontend signs in immediately after registration to get a JWT.
- `POST /api/appointments` should read `doctor` and `scheduledAt` from the body and set `patient` from the verified token (`req.user.userId`). Do not trust a patient ID sent by the browser.
- `GET /api/appointments` must filter records by `patient: req.user.userId` (and optionally status). Never return all patients' appointments to a normal patient.
- The current backend does not expose an appointment-cancellation route. The UI therefore tells the user cancellation is not connected rather than pretending to cancel in the database.

## Troubleshooting

- If doctors don't load, confirm `GET http://localhost:3000/api/doctors` works in the browser or curl.
- If requests fail, confirm the backend is running on port 3000 and restart Vite after editing `.env` or `vite.config.js`.
- If login fails, check that the backend loads `.env`, `JWT_SECRET` is set, and both JWT signing and verification use the same secret.
