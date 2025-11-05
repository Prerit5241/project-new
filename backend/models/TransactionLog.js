const mongoose = require('mongoose');

const transactionLogSchema = new mongoose.Schema({
  userId: {
    type: Number,
    required: true,
    ref: 'User'
  },
  amount: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    enum: ['credit', 'debit'],
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  referenceId: {
    type: Number,
    required: false
  },
  referenceType: {
    type: String,
    enum: ['course_enrollment', 'purchase', 'refund', 'admin_adjustment', 'other'],
    default: 'other'
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes for faster queries
transactionLogSchema.index({ userId: 1, createdAt: -1 });
transactionLogSchema.index({ referenceId: 1, referenceType: 1 });

const TransactionLog = mongoose.model('TransactionLog', transactionLogSchema);

module.exports = TransactionLog;
