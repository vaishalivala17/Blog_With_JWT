const express = require('express');
const router = express.Router();
const blogController = require('../controllers/blogController');
const { authMiddleware, adminMiddleware, authorize } = require('../controllers/authController');

// Public routes
router.get('/', blogController.getAllBlogs);
router.get('/view/:id', blogController.viewBlog);

// Protected routes - requires authentication
router.get('/my-blogs', authMiddleware, blogController.getMyBlogs);
router.get('/create', authMiddleware, blogController.getCreateBlog);
router.post('/create', authMiddleware, blogController.createBlog);
router.get('/edit/:id', authMiddleware, blogController.getEditBlog);
router.post('/edit/:id', authMiddleware, blogController.updateBlog);
router.post('/delete/:id', authMiddleware, blogController.deleteBlog);

// Admin only routes - requires admin role
router.get('/admin', authMiddleware, adminMiddleware, (req, res) => {
    res.render('blogs/admin', { title: 'Admin Panel' });
});

// Role-based example: authorize('admin', 'user')
router.get('/dashboard', authMiddleware, authorize('admin', 'user'), (req, res) => {
    res.render('blogs/dashboard', { title: 'Dashboard' });
});

module.exports = router;
