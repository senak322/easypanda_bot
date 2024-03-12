import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    userId: Number,
    isBlocked: { type: Boolean, default: false },
    paidOrders: Number,
    unpaidOrders: [{
        orderId: mongoose.Schema.Types.ObjectId,
        createdAt: Date
      }],
  });
  
export const User = mongoose.model('User', userSchema);