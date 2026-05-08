const express = require("express");
const router = express.Router();
const { createProduct, getProducts, searchProducts, getAllProducts, getProduct, updateProduct } = require("../controllers/product");
const auth = require("../middleware/auth");

// Temporarily remove auth for testing
router.post("/create", createProduct);
router.get("/all", getAllProducts);
router.get("/:id", getProduct);
router.put("/:id", updateProduct);
router.get("/", getProducts);
router.get("/search", searchProducts);

module.exports = router;