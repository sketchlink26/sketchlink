const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: {
    type:     String,
    required: [true, 'Name is required'],
    trim:     true,
    maxlength: 50,
  },
  email: {
    type:      String,
    required:  [true, 'Email is required'],
    unique:    true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
  },
  password: {
    type:     String,
    required: [true, 'Password is required'],
    minlength: 6,
    select:   false,       // never returned by default
  },
  role: {
    type:    String,
    enum:    ['admin', 'member', 'viewer'],
    default: 'member',
  },
  avatar: {
    type:    String,
    default: '',
  },
  createdAt: {
    type:    Date,
    default: Date.now,
  },
});

// Hash password before save
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare plain password with hash
UserSchema.methods.matchPassword = async function (entered) {
  return await bcrypt.compare(entered, this.password);
};

module.exports = mongoose.model('User', UserSchema);
