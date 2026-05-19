const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String }, // optional
  password: { type: String, required: true },
  location: { type: String, required: true },
  crop: { type: String, required: true },
  farmSize: { type: Number },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);
