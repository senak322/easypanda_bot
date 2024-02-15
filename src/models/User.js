const userSchema = new mongoose.Schema({
    userId: Number,
    isBlocked: { type: Boolean, default: false },
    unpaidOrders: [{
        orderId: mongoose.Schema.Types.ObjectId,
        createdAt: Date
      }],
    role: { type: String, default: 'user' },
    isAdmin: { type: Boolean, default: false },
  });
  
  const User = mongoose.model('User', userSchema);