const mongoose = require('mongoose');

const VisitorSchema = new mongoose.Schema({
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: false,
    default: null
  },
  purpose: {
    type: String,
    default: 'General'
  },
  name: {
    type: String,
    required: [true, 'Please add the visitor name']
  },
  relationship: {
    type: String,
    default: ''
  },
  contact: {
    type: String,
    default: ''
  },
  entryTime: {
    type: Date,
    default: Date.now
  },
  exitTime: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Visitor', VisitorSchema);
