const Product = require("../models/product");
const { createNotification } = require("./notification");

const createProduct = async (req, res) => {
    try {
        const { name, price, description, image } = req.body;

        // Check if required fields are present
        if (!name || !price) {
            return res.status(400).json({ error: "Name and price are required" });
        }

        // Use user ID if authenticated, otherwise use null
        const ownerId = req.user?._id || null;

        const product = new Product({ name, price, description, owner: ownerId, image });
        await product.save();

        console.log(" Product created successfully:", product);

        // Create notification for admin
        await createNotification(
            'product_created',
            'New Product Created',
            `Product "${name}" has been created by ${req.user?.username || 'anonymous user'}`,
            product._id,
            ownerId
        );

        res.json(product);
    } catch (error) {
        console.error("Error creating product:", error);
        res.status(500).json({ error: error.message });
    }
};

const updateProduct = async (req, res) => {
    try {
        // Check if product exists
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ error: "Product not found" });
        }

        // If user is authenticated and product has owner, check authorization
        if (req.user?._id && product.owner && product.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: "User not authorized to update product" });
        }

        const updatedProduct = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updatedProduct);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getAllProducts = async (req, res) => {
    try {
        const products = await Product.find();
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        res.json(product);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getProducts = async (req, res) => {
    try {
        // If user is authenticated, get their products, otherwise get all
        const products = req.user?._id
            ? await Product.find({ owner: req.user._id })
            : await Product.find();
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const searchProducts = async (req, res) => {
    try {
        const { query } = req.params;
        const products = await Product.find({ name: { $regex: query, $options: "i" } });
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};



module.exports = {
    createProduct,
    getProducts,
    searchProducts,
    getAllProducts,
    getProduct,
    updateProduct
};