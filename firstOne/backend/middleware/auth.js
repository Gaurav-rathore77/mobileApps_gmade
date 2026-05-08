const jwt = require("jsonwebtoken");

const auth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.substring(7);
        try {
            const user = jwt.verify(token, "secret");
            console.log(' Token verified successfully:', user);
            req.user = user;
            next();
        } catch (err) {
            console.log(' Token verification failed:', err.message);
            res.status(401).json({ error: "Invalid token" });
        }
    } else {
        console.log(' No auth header or wrong format');
        res.status(401).json({ error: "Unauthorized" });
    }
};

module.exports = auth;