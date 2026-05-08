const { Schema, model } = require("mongoose");

const productSchema = new Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    owner: { type: Schema.Types.ObjectId, ref: "User", default: null },
    description: String,
    image: String
}, { timestamps: true });

module.exports = model("Product", productSchema);