const express = require('express');
const router = express.Router();
const User = require('../models/user');
const auth = require('../middleware/auth');

// Update user profile image
router.put('/image', auth, async (req, res) => {
  try {
    const { imageUrl } = req.body;
    // Get userId from authenticated token
    const targetUserId = req.user.userId || req.user.id || req.user._id;

    console.log('🔍 Full req.user object:', req.user);
    console.log('🔍 Extracted userId:', targetUserId);

    if (!imageUrl) {
      return res.status(400).json({ error: 'Image URL is required' });
    }

    console.log('🔍 Updating profile image for user:', targetUserId);

    const updatedUser = await User.findByIdAndUpdate(
      targetUserId,
      { profileImage: imageUrl },
      { returnDocument: 'after' }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      user: {
        id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        profileImage: updatedUser.profileImage
      }
    });

  } catch (error) {
    console.error('Profile image update error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update user email
router.put('/email', auth, async (req, res) => {
  try {
    const { email } = req.body;
    // Get userId from authenticated token
    const targetUserId = req.user.userId || req.user.id || req.user._id;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    console.log('🔍 Updating email for user:', targetUserId);

    const updatedUser = await User.findByIdAndUpdate(
      targetUserId,
      { email: email },
      { returnDocument: 'after' }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      user: {
        id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        profileImage: updatedUser.profileImage
      }
    });

  } catch (error) {
    console.error('Email update error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get current user profile
router.get('/me', auth, async (req, res) => {
  try {
    // Get userId from authenticated token
    const targetUserId = req.user.userId || req.user.id || req.user._id;
    
    console.log('🔍 Fetching profile for user:', targetUserId);
    
    const user = await User.findById(targetUserId).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profileImage: user.profileImage
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
