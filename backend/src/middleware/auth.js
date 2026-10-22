
const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    try {
        // Read the Authorization header from the request
        const authHeader = req.headers.authorization;

        // Check whether the header exists and uses Bearer authentication
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                error: 'Access denied. Token required.'
            });
        }

        // Extract the token after "Bearer "
        const token = authHeader.split(' ')[1];

        // Verify the token using the secret from .env
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Store decoded user information for the next route
        req.user = decoded;

        // Continue to the next middleware or route handler
        next();

    } catch (error) {
        // Print the real error in your server terminal while debugging
        console.log('JWT error:', error.name, error.message);

        return res.status(401).json({
            error: 'Invalid or expired token.'
        });
    }
};

module.exports = authMiddleware;
