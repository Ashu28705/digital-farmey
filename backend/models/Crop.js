const mongoose = require('mongoose');

const CropSchema = new mongoose.Schema({
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sellerName: { type: String, required: true }, // Denormalized for faster reads in marketplace
  location: { type: String, required: true },   // Denormalized
  cropName: { type: String, required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  grade: { type: String, default: 'Standard' },
  status: { type: String, enum: ['Active', 'Pending', 'Sold Out'], default: 'Active' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Crop', CropSchema);
