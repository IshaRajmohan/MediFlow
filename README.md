# MediFlow

MediFlow is a patient appointment booking application with a React
frontend and an Express/MongoDB backend. The frontend communicates with
the backend through API endpoints and uses JWT authentication for
protected actions.

## Tech Stack

### Frontend

-   React
-   Vite
-   Tailwind CSS
-   JavaScript
-   Fetch API for HTTP requests

### Backend

-   Node.js
-   Express.js
-   MongoDB with Mongoose
-   JSON Web Tokens (JWT) for authentication
-   bcryptjs for password hashing

## Features

-   View doctors fetched from the backend
-   Register a new patient account
-   Log in and receive a JWT
-   Book an appointment with a doctor
-   View appointments belonging to the logged-in patient
-   Search and filter doctor listings
-   Responsive dashboard and navigation

**Note:** Appointment cancellation is not fully connected because the
current backend does not provide a cancellation endpoint. The interface
should not report a cancellation as successful until that endpoint is
implemented.

## Project Structure

``` text
mediflow-connected-package/
├── mediflow-frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── api.js
│   │   ├── main.jsx
│   │   ├── index.css
│   │   └── data/
│   │       └── mockData.js
│   ├── .env
│   ├── .env.example
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── backend-integration/
│   └── app.js
└── README.md
```

`backend-integration/app.js` is the updated backend entry file supplied
for integration. Keep your existing backend models, middleware,
dependencies, and environment file.

## Prerequisites

Install the following before running the application:

-   Node.js and npm
-   MongoDB connection (local MongoDB or MongoDB Atlas)
-   Your existing backend environment variables, including the database
    connection string and `JWT_SECRET`

## Setup and Run

### 1. Configure the backend

1.  Open your existing backend project.
2.  Back up your current `app.js`.
3.  Copy `backend-integration/app.js` from this package into your
    backend project, replacing the old `app.js`.
4.  Keep your existing `.env`, models, middleware, and other backend
    files.
5.  Confirm your backend `.env` contains the variables expected by your
    existing backend code, especially the MongoDB connection string and
    `JWT_SECRET`.
6.  Start the backend using the command configured in your backend
    project, for example:

``` bash
npm install
npm start
```

If your project uses a different start script, use that script instead.
The backend is expected to listen on port `3000` for the included
frontend proxy configuration.

### 2. Configure and run the frontend

Open a terminal in the `mediflow-frontend` directory:

``` bash
npm install
npm run dev
```

Open the local URL shown by Vite, usually:

``` text
http://localhost:5173
```

The included `vite.config.js` forwards frontend `/api` requests to
`http://localhost:3000` during local development. This avoids the need
for separate CORS configuration for this setup.

If your backend runs on a different port, update the proxy target in
`vite.config.js` to match.

## API Endpoints Used

  ----------------------------------------------------------------------------
  Method            Endpoint               Purpose           Authentication
  ----------------- ---------------------- ----------------- -----------------
  `GET`             `/api/health`          Check that the    No
                                           API is running    

  `GET`             `/api/doctors`         Fetch the doctor  No
                                           list              

  `GET`             `/api/doctors/:id`     Fetch one doctor  No

  `POST`            `/api/auth/register`   Create a patient  No
                                           account           

  `POST`            `/api/auth/login`      Log in and        No
                                           receive a JWT     

  `POST`            `/api/appointments`    Book an           Yes
                                           appointment       

  `GET`             `/api/appointments`    List the          Yes
                                           signed-in         
                                           patient's         
                                           appointments      

  `GET`             `/api/profile`         Fetch the         Yes
                                           signed-in user's  
                                           profile           
  ----------------------------------------------------------------------------

Protected endpoints expect an authorization header in this format:

``` http
Authorization: Bearer YOUR_JWT_TOKEN
```

## Booking an Appointment

The booking request sends the selected doctor, scheduled date/time, and
reason to the backend. The backend derives the patient identity from the
authenticated JWT rather than trusting a patient ID supplied by the
frontend.

Example request body:

``` json
{
  "doctor": "DOCTOR_MONGODB_ID",
  "scheduledAt": "2026-10-23T10:30:00.000Z",
  "reason": "Routine consultation"
}
```

Replace `DOCTOR_MONGODB_ID` with a real doctor document ID from your
database. The timestamp should be a valid ISO 8601 date-time value.

## Troubleshooting

### Doctors are not appearing

-   Make sure MongoDB is connected and the doctors collection contains
    records.
-   Confirm the backend is running on port `3000`.
-   Open `http://localhost:3000/api/doctors` directly to check the API
    response.
-   Check the browser console and backend terminal for errors.

### Login or registration fails

-   Confirm the backend `.env` contains a valid `JWT_SECRET`.
-   Confirm the user model and password hashing dependencies are
    installed.
-   Check the response in the browser's Network panel and the backend
    terminal.

### Requests return `401 Unauthorized`

-   Log in again to obtain a valid token.
-   Ensure protected requests include `Authorization: Bearer <token>`.
-   Tokens may expire; the current backend token configuration uses a
    one-hour expiry.

### Frontend cannot reach the backend

-   Start the backend before testing API features.
-   Verify the proxy target in `mediflow-frontend/vite.config.js`.
-   Restart the Vite development server after changing configuration.

## Security Notes

-   Do not commit `.env` files or secrets to a public repository.
-   Never place the backend `JWT_SECRET` in a frontend environment
    variable.
-   Keep protected appointment queries scoped to the authenticated
    patient.
-   Validate and authorize all sensitive operations on the backend.

## Future Improvements

-   Add a backend endpoint for appointment cancellation.
-   Add stronger validation and consistent API error responses.
-   Add automated tests for authentication, doctor retrieval, and
    appointment booking.
-   Configure production API URLs and deployment settings.
-   Review authorization on doctor create, update, and delete endpoints
    before production use.

## License

Add a license file if you intend to distribute this project publicly.
