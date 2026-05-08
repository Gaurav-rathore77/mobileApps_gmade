const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
// Email temporarily disabled to avoid authentication errors
// const { sendWelcomeEmail, sendAdminNotification } = require("../config/email");

const JWT_SECRET = process.env.JWT_SECRET || "secret";

const register = async (req, res) => {
    try {
        const { username, email, password, profileImage } = req.body;
        if (!username || !password) {
            return res.status(400).json({ error: "Username and password required" });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ 
            username, 
            email: email || null,
            password: hashedPassword,
            profileImage: profileImage || null
        });
        await user.save();
        
        // Generate token for immediate login
        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: "1h" });
        
        res.json({ 
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                profileImage: user.profileImage
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const login = async (req, res) => {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (user) {
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (isPasswordValid) {
            const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: "1h" });
            
            res.json({ 
                token,
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    profileImage: user.profileImage
                }
            });
        } else {
            res.status(401).json({ error: "Invalid password" });
        }
    } else {
        res.status(404).json({ error: "User not found" });
    }
};

module.exports = {
    register,
    login
};