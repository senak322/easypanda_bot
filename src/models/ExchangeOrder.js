import mongoose from 'mongoose'

const orderSchema = new mongoose.Schema({
    userId: String,
    sendCurrency: String,
    receiveCurrency: String,
    amountToSend: Number,
    amountToReceive: Number,
    sendBank: String,
    receiveBank: String,
    ownerData: String,
    ownerName: String,
    status: { type: String, default: 'pending' }, // pending, completed, cancelled
    qrCodeFileId: String, // Опционально для QR кодов
    createdAt: { type: Date, default: Date.now },
    updatedAt: Date,
  });
  
  const Order = mongoose.model('Order', orderSchema);
  
  export default Order;