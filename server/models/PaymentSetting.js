const mongoose = require('mongoose');

const PaymentSettingSchema = new mongoose.Schema({
  upiId: {
    type: String,
    default: 'coolstay@ybl'
  },
  bankName: {
    type: String,
    default: 'CoolStay Cooperative Bank'
  },
  accountNumber: {
    type: String,
    default: '123456789012'
  },
  ifscCode: {
    type: String,
    default: 'CSCB0000001'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('PaymentSetting', PaymentSettingSchema);
