const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// Generate JWT Token
const generateToken = ({ id, role }) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Register page
exports.getRegister = (req, res) => {
    res.render('register');
};

// Register user - Hash password in controller
exports.register = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.render('register', { error: 'User already exists with this email or username' });
        }

        // Hash password in controller
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user with hashed password
        const user = new User({ username, email, password: hashedPassword });
        await user.save();

        res.redirect('/login');
    } catch (err) {
        console.error(err);
        res.render('register', { error: 'Error registering user' });
    }
};

// Login page
exports.getLogin = (req, res) => {
    res.render('login');
};

// Login user
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.render('login', { error: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.render('login', { error: 'Invalid credentials' });
        }

        // Generate token with user id and role
        const token = generateToken({ id: user._id, role: user.role });
        
        // Store token in cookie (httpOnly for security)
        res.cookie('token', token, { 
            httpOnly: true, 
            maxAge: 7 * 24 * 60 * 60 * 1000,
            secure: process.env.NODE_ENV === 'production'
        });
        
        res.redirect('/blogs');
    } catch (err) {
        console.error(err);
        res.render('login', { error: 'Error logging in' });
    }
};

// Logout user
exports.logout = (req, res) => {
    res.clearCookie('token');
    res.redirect('/login');
};

// Middleware to verify token and get user info
const verifyToken = (token) => {
    return jwt.verify(token, process.env.JWT_SECRET);
};

// Auth Middleware - Verify user is logged in
exports.authMiddleware = (req, res, next) => {
    // Get token from cookie or Authorization header
    let token = req.cookies.token;
    
    // Also support Authorization: Bearer <token>
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
    }

    if (!token) {
        return res.redirect('/login');
    }

    try {
        const decoded = verifyToken(token);
        req.userId = decoded.id;
        req.userRole = decoded.role;
        next();
    } catch (err) {
        return res.redirect('/login');
    }
};

// Role-based middleware factory
exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.userRole)) {
            return res.render('error', { error: 'Access denied. You do not have permission.' });
        }
        next();
    };
};

// Admin middleware - shortcut for admin-only routes
exports.adminMiddleware = (req, res, next) => {
    if (req.userRole !== 'admin') {
        return res.render('error', { error: 'Access denied. Admin only.' });
    }
    next();
};

// Get current user info
exports.getCurrentUser = async (req, res, next) => {
    try {
        const token = req.cookies.token || (req.headers.authorization && req.headers.authorization.split(' ')[1]);
        
        if (token) {
            const decoded = verifyToken(token);
            const user = await User.findById(decoded.id).select('-password');
            res.locals.currentUser = user;
        }
        next();
    } catch (err) {
        res.locals.currentUser = null;
        next();
    }
};
