const mongoose = require('mongoose');

// A single drawing element on the canvas
const ElementSchema = new mongoose.Schema({
  type:   { type: String, enum: ['pen','rect','circle','arrow','diamond','text'], required: true },
  color:  { type: String, default: '#e8e8f0' },
  sw:     { type: Number, default: 2 },
  // pen strokes
  path:   [{ x: Number, y: Number }],
  // shape bounds
  x1: Number, y1: Number, x2: Number, y2: Number,
  // text
  text: String, fontSize: Number,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
}, { _id: true });

const BoardSchema = new mongoose.Schema({
  title: {
    type:     String,
    required: [true, 'Board title is required'],
    trim:     true,
    maxlength: 100,
    default:  'Untitled Board',
  },
  description: { type: String, maxlength: 500, default: '' },

  owner: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      'User',
    required: true,
  },

  collaborators: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: { type: String, enum: ['editor', 'viewer'], default: 'editor' },
  }],

  elements: [ElementSchema],

  // Snapshot of the board as base64 PNG (thumbnail)
  thumbnail: { type: String, default: '' },

  // Version history — last 20 states
  history: [{
    elements:  { type: Array, default: [] },
    savedAt:   { type: Date, default: Date.now },
    savedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  }],

  isPublic: { type: Boolean, default: false },

  shareCode: {
    type:   String,
    unique: true,
    default: () => Math.random().toString(36).slice(2, 8).toUpperCase(),
  },

  generatedTasks: [{
    title:     String,
    priority:  { type: String, enum: ['High','Medium','Low'] },
    category:  String,
    completed: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  }],

}, { timestamps: true });

// Index for share-code lookups
BoardSchema.index({ shareCode: 1 });
BoardSchema.index({ owner: 1 });

module.exports = mongoose.model('Board', BoardSchema);
