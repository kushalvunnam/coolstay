const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  billingMonth: {
    type: String,
    required: [true, 'Please add a billing month (YYYY-MM)']
  },
  amountDue: {
    type: Number,
    required: [true, 'Please add an amount due']
  },
  amountPaid: {
    type: Number,
    default: 0
  },
  dueDate: {
    type: Date,
    required: [true, 'Please add a due date']
  },
  paymentDate: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['paid', 'pending', 'overdue'],
    default: 'pending'
  },
  lateFee: {
    type: Number,
    default: 0
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'upi', 'card', 'bank_transfer'],
    default: 'upi'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Payment', PaymentSchema);
