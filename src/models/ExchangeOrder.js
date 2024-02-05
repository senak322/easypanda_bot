import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  userId: Number,
  sendCurrency: String,
  receiveCurrency: String,
  sendAmount: Number,
  receiveAmount: Number,
  sendBank: String,
  receiveBank: String,
  ownerName: String,
  ownerData: String,
  status: {
    type: String,
    default: "pending",// pending, completed, cancelled
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  expiresAt: {
    type: Date,
    default: () => Date.now() + 30 * 60000,
  }, 
  qrCodeFileId: String, // Опционально для QR кодов
});

const Order = mongoose.model("Order", orderSchema);

export default Order;
