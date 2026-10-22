
// Import Express, which helps us build the backend API
const express = require('express');

// Create an Express application
const app = express();


// Import Mongoose models to interact with MongoDB collections
const Doctor = require('./models/Doctor');
const Appointment = require('./models/Appointment');

const User = require('./models/User');
const bcrypt = require('bcryptjs');
const saltRounds = 10; // Number of salt rounds for bcrypt hashing
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
// Load environment variables from .env file
dotenv.config();
const authMiddleware = require('./middleware/auth');
// Middleware: parse incoming JSON request bodies into req.body
// Without this, JSON data sent by the frontend may not be accessible
app.use(express.json());


// ==================================================
// 1. HEALTH CHECK
// GET /api/health
// Checks whether the API is running
// ==================================================

app.get('/api/health', (req, res) => {

    // Send a JSON response containing the server status and current timestamp
    res.json({
        status: 'ok',
        message: 'api is running',
        timestamp: new Date().toISOString()
    });
});
app.get('/api/profile', authMiddleware, (req, res) => {
    res.json({
        message: 'You are authenticated!',
        userId: req.user.userId
    });
});

// ==================================================
// 2. GET ALL DOCTORS
// GET /api/doctors
// Retrieves every doctor from MongoDB
// ==================================================

app.get('/api/doctors', async (req, res) => {
    try {
        // Find all doctor documents in the database
        // await waits for the database operation to finish
        const doctors = await Doctor.find();

        // Return HTTP 200 (success) and the list of doctors
        return res.status(200).json(doctors);

    } catch (error) {
        // Print the error in the server terminal for debugging
        console.error('Error fetching all doctors:', error.message);

        // Return HTTP 500 if an unexpected server/database error occurs
        return res.status(500).json({
            error: 'Internal server error while fetching doctors'
        });
    }
});


// ==================================================
// 3. GET ONE DOCTOR BY ID
// GET /api/doctors/:id
// Retrieves a specific doctor using the ID in the URL
// ==================================================

app.get('/api/doctors/:id', async (req, res) => {
    try {
        // Extract the ID from the URL
        // Example: /api/doctors/123 -> req.params.id is "123"
        const doctorId = req.params.id;

        // Search MongoDB for a doctor with this ID
        const foundDoctor = await Doctor.findById(doctorId);

        // If no doctor exists with this ID, return 404 Not Found
        if (!foundDoctor) {
            return res.status(404).json({
                error: 'Doctor not found'
            });
        }

        // Return HTTP 200 and the matching doctor
        return res.status(200).json(foundDoctor);

    } catch (error) {
        // Log the failed request and the ID that caused the error
        console.error(
            `Error fetching doctor with ID ${req.params.id}:`,
            error.message
        );

        // CastError usually means the supplied ID has an invalid format
        if (error.name === 'CastError') {
            return res.status(400).json({
                error: 'Invalid ID format provided'
            });
        }

        // Handle other unexpected errors
        return res.status(500).json({
            error: 'Internal server error while fetching the doctor'
        });
    }
});


// ==================================================
// 4. CREATE A DOCTOR
// POST /api/doctors
// Receives doctor details and saves a new doctor
// ==================================================

app.post('/api/doctors', async (req, res) => {
    try {
        // Extract fields from the incoming JSON request body
        // This is JavaScript object destructuring
        const {
            name,
            specialty,
            clinic,
            consultationFee,
            available
        } = req.body;

        // Check that required fields have been provided
        // consultationFee === undefined allows a fee of 0 through this check
        if (
            !name ||
            !specialty ||
            consultationFee === undefined
        ) {
            // HTTP 400 means the client sent invalid or incomplete input
            return res.status(400).json({
                error: 'Name, specialty, and consultationFee are required.'
            });
        }

        // Create a new doctor document and save it to MongoDB
        // The Doctor model applies its schema rules and defaults
        const newDoctor = await Doctor.create({
            name,
            specialty,
            clinic,
            consultationFee,
            available
        });

        // HTTP 201 means a new resource was successfully created
        // Send the saved doctor, including its generated ID
        return res.status(201).json(newDoctor);

    } catch (error) {
        // Log the error to help identify the cause
        console.error('Error creating doctor:', error.message);

        // Handle errors caused by Mongoose schema validation
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                error: error.message
            });
        }

        // Handle unexpected server or database errors
        return res.status(500).json({
            error: 'Internal server error while creating doctor'
        });
    }
});


// ==================================================
// 5. UPDATE A DOCTOR'S SPECIALTY
// PATCH /api/doctors/:id
// Updates only the specialty field of a doctor
// ==================================================

app.patch('/api/doctors/:id', async (req, res) => {

    // Extract the doctor's ID from the URL
    const id = req.params.id;

    try {
        // Extract the new specialty from the request body
        const { specialty } = req.body;

        // Ensure specialty is a non-empty string
        // trim() removes spaces from the beginning and end
        if (typeof specialty !== 'string' || !specialty.trim()) {
            return res.status(400).json({
                success: false,
                error: 'A valid specialty is required'
            });
        }

        // Find the doctor by ID and update its specialty
        const updatedDoctor = await Doctor.findByIdAndUpdate(
            id, // Which doctor to update

            { specialty: specialty.trim() }, // Field and new value

            {
                new: true,          // Return the updated document
                runValidators: true // Run applicable schema validators
            }
        );

        // If no doctor matches the ID, return 404
        if (!updatedDoctor) {
            return res.status(404).json({
                success: false,
                error: 'Doctor not found'
            });
        }

        // Return HTTP 200 and the updated doctor
        return res.status(200).json({
            success: true,
            data: updatedDoctor
        });

    } catch (error) {
        // Handle malformed MongoDB IDs
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                error: 'Invalid ID format provided'
            });
        }

        // Handle schema validation errors
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                error: error.message
            });
        }

        // Log any other unexpected errors
        console.error('Error updating doctor:', error.message);

        // Return a generic server error
        return res.status(500).json({
            success: false,
            error: 'Internal server error while updating doctor'
        });
    }
});


// ==================================================
// 6. DELETE A DOCTOR
// DELETE /api/doctors/:id
// Deletes a doctor using the ID in the URL
// ==================================================

app.delete('/api/doctors/:id', async (req, res) => {

    // Get the doctor's ID from the URL
    const id = req.params.id;

    try {
        // Find the doctor and delete it from MongoDB
        // Returns the deleted document, or null if not found
        const deletedDoctor = await Doctor.findByIdAndDelete(id);

        // Check whether a doctor was actually deleted
        if (!deletedDoctor) {
            return res.status(404).json({
                success: false,
                error: 'Doctor not found'
            });
        }

        // Return HTTP 200 and the deleted document
        return res.status(200).json({
            success: true,
            data: deletedDoctor
        });

    } catch (error) {
        // Return 400 if the supplied ID has an invalid format
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                error: 'Invalid ID format provided'
            });
        }

        // Log unexpected errors
        console.error('Error deleting doctor:', error.message);

        // Return HTTP 500 for unexpected failures
        return res.status(500).json({
            success: false,
            error: 'Internal server error while deleting doctor'
        });
    }
});


// ==================================================
// 7. CREATE AN APPOINTMENT
// POST /api/appointments
// Receives appointment details and saves an appointment
// ==================================================

app.post('/api/appointments', authMiddleware, async (req, res) => {
    try {
        // Extract appointment details from the request body
        const {
            patient,
            doctor,
            scheduledAt,
            reason
        } = req.body;

        // Ensure the required appointment fields are present
        if ( !doctor || !scheduledAt) {
            return res.status(400).json({
                error: ' doctor, and scheduledAt are required.'
            });
        }

        // Create the appointment and save it to MongoDB
        const newAppointment = await Appointment.create({
            patient:req.user.userId,
            doctor,
            scheduledAt,
            reason
        });

        // Return HTTP 201 and the newly created appointment
        return res.status(201).json({
            success: true,
            data: newAppointment
        });

    } catch (error) {
        // Log the error for debugging
        console.error('Error creating appointment:', error.message);

        // Handle schema validation errors
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                error: error.message
            });
        }

        // Handle malformed IDs or other casting errors
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                error: 'Invalid ID or field format'
            });
        }

        // Return a generic error for unexpected failures
        return res.status(500).json({
            success: false,
            error: 'Internal server error while creating appointment'
        });
    }
});


// ==================================================
// 8. GET APPOINTMENTS
// GET /api/appointments
// Gets all appointments or filters them by status
// ==================================================

app.get('/api/appointments', authMiddleware, async (req, res) => {
    try {
        // Always restrict appointment results to the logged-in patient.
        // The optional status filter narrows this patient's results further.
        const filter = { patient: req.user.userId };
        const { status } = req.query;
        if (status) filter.status = status;

        const records = await Appointment.find(filter);

        return res.status(200).json({
            success: true,
            data: records
        });
    } catch (error) {
        console.error('Error fetching appointments:', error.message);
        return res.status(500).json({
            success: false,
            error: 'Internal server error while fetching appointments'
        });
    }
});

app.post('/api/auth/register', async(req, res)=> {
    try{
        const {name, email, password}=req.body;
        if(!name || !email || !password){
            return res.status(400).json({error:'Name, email, and password are required.'});
        }
       
        const newemail=email.trim().toLowerCase();
        if(await User.findOne({ email: newemail })){
            return res.status(409).json({error:'User with that email already exists.'});
        }
        if(password.length<6){
            return res.status(400).json({error:'Password must be at least 6 characters long.'});
        }
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        const newUser=await User.create({name, email: newemail, password: hashedPassword});
        return res.status(201).json({success:true});
    }catch(error){
        // Log the error for debugging
        console.error('Error creating user:', error.message);

        // Handle schema validation errors
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                error: error.message
            });
        }


        // Return a generic error for unexpected failures
        return res.status(500).json({
            success: false,
            error: 'Internal server error while creating appointment'
        });
    }
    
})
app.post('/api/auth/login', async (req, res) => {
    try {
        // 1. Extract email and password
        const {email, password}=req.body;
        // 2. Validate input
        if(!email || !password){
            return res.status(400).json({error:'Email and password are required.'});
        }
        // 3. Find user by normalized email
        const newEmail=email.trim().toLowerCase();
        const user=await User.findOne({email:newEmail});
        // 4. Compare submitted password with stored hash
        if(! user){
            return res.status(401).json({error:'Invalid email or password.'});
        }
        const isMatch=await bcrypt.compare(password, user.password);
        if(! isMatch){
            return res.status(401).json({error:'Invalid email or password.'});
        }
        // 5. Generate JWT
        const token=jwt.sign({userId:user._id}, process.env.JWT_SECRET, {expiresIn:'1h'});
        // 6. Return token and safe user details
        return res.status(200).json({
            success:true,
            token,
            user:{
                _id:user._id,
                name:user.name,
                email:user.email
            }
        });
    } catch (error) {
        // Handle unexpected errors
        console.error('Error during login:', error.message);
        return res.status(500).json({
            success: false,
            error: 'Internal server error during login'
        });
    }
});
// ==================================================
// 9. EXPORT THE APP
// Allows another file to import this Express application
// and start the server using app.listen()
// ==================================================

module.exports = app;
