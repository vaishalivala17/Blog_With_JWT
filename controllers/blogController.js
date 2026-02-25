const Blog = require('../models/Blog');
const User = require('../models/User');
const path = require('path');
const fs = require('fs');

// Get all blogs (for landing page or blog list)
exports.getAllBlogs = async (req, res) => {
    try {
        const blogs = await Blog.find().populate('author', 'username').sort({ createdAt: -1 });
        res.render('blogs/index', { blogs });
    } catch (err) {
        console.error(err);
        res.render('error', { error: 'Error fetching blogs' });
    }
};

// Get user's blogs
exports.getMyBlogs = async (req, res) => {
    try {
        const blogs = await Blog.find({ author: req.userId }).sort({ createdAt: -1 });
        res.render('blogs/my-blogs', { blogs });
    } catch (err) {
        console.error(err);
        res.render('error', { error: 'Error fetching your blogs' });
    }
};

// Create blog page
exports.getCreateBlog = (req, res) => {
    res.render('blogs/create');
};

// Create blog
exports.createBlog = async (req, res) => {
    try {
        const { title, content, imageUrl, videoUrl } = req.body;
        
        const blog = new Blog({
            title,
            content,
            image: imageUrl || '',
            video: videoUrl || '',
            author: req.userId
        });

        await blog.save();
        res.redirect('/blogs/my-blogs');
    } catch (err) {
        console.error(err);
        res.render('blogs/create', { error: 'Error creating blog' });
    }
};

// Edit blog page
exports.getEditBlog = async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);
        if (!blog) {
            return res.render('error', { error: 'Blog not found' });
        }
        
        // Check if user is the author
        if (blog.author.toString() !== req.userId) {
            return res.render('error', { error: 'Unauthorized' });
        }
        
        res.render('blogs/edit', { blog });
    } catch (err) {
        console.error(err);
        res.render('error', { error: 'Error fetching blog' });
    }
};

// Update blog
exports.updateBlog = async (req, res) => {
    try {
        const { title, content, imageUrl, videoUrl } = req.body;
        
        const blog = await Blog.findById(req.params.id);
        if (!blog) {
            return res.render('error', { error: 'Blog not found' });
        }
        
        // Check if user is the author
        if (blog.author.toString() !== req.userId) {
            return res.render('error', { error: 'Unauthorized' });
        }

        blog.title = title;
        blog.content = content;
        blog.image = imageUrl || '';
        blog.video = videoUrl || '';
        blog.updatedAt = Date.now();

        await blog.save();
        res.redirect('/blogs/my-blogs');
    } catch (err) {
        console.error(err);
        res.render('error', { error: 'Error updating blog' });
    }
};

// Delete blog
exports.deleteBlog = async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);
        if (!blog) {
            return res.render('error', { error: 'Blog not found' });
        }
        
        // Check if user is the author
        if (blog.author.toString() !== req.userId) {
            return res.render('error', { error: 'Unauthorized' });
        }

        await Blog.findByIdAndDelete(req.params.id);
        res.redirect('/blogs/my-blogs');
    } catch (err) {
        console.error(err);
        res.render('error', { error: 'Error deleting blog' });
    }
};

// View single blog
exports.viewBlog = async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id).populate('author', 'username');
        if (!blog) {
            return res.render('error', { error: 'Blog not found' });
        }
        res.render('blogs/view', { blog });
    } catch (err) {
        console.error(err);
        res.render('error', { error: 'Error fetching blog' });
    }
};
