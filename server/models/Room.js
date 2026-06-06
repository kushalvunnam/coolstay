const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema({
  roomNumber: {
    type: String,
    required: [true, 'Please add a room number'],
    unique: true
  },
  bedCapacity: {
    type: Number,
    required: [true, 'Please add a bed capacity']
  },
  floor: {
    type: Number,
    required: [true, 'Please add a floor number']
  },
  rentPerBed: {
    type: Number,
    required: [true, 'Please add rent per bed amount']
  },
  tenants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant'
  }],
  occupancyStatus: {
    type: String,
    enum: ['vacant', 'partially_occupied', 'fully_occupied'],
    default: 'vacant'
  }
}, {
  timestamps: true
});

// Calculate occupancy status before saving
RoomSchema.pre('save', function (next) {
  const tenantCount = this.tenants ? this.tenants.length : 0;
  if (tenantCount === 0) {
    this.occupancyStatus = 'vacant';
  } else if (tenantCount < this.bedCapacity) {
    this.occupancyStatus = 'partially_occupied';
  } else {
    this.occupancyStatus = 'fully_occupied';
  }
  next();
});

module.exports = mongoose.model('Room', RoomSchema);
