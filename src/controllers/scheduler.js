import cron from "node-cron";
import Order from "../models/ExchangeOrder.js"; // Убедитесь, что путь к модели верный
import { config } from "../../config.js";
const { adminChatId } = config;

const checkExpiredOrders = async (bot) => {
  try {
    const now = new Date();
    const expiredOrders = await Order.find({
      status: "pending",
      expiresAt: { $lt: now },
    });

    expiredOrders.forEach(async (order) => {
      order.status = "cancelled";
      let messageText = `Время на оплату истекло. Заявка #${order.hash} отменена.`;
      await order.save();
      // Здесь должна быть логика отправки сообщения пользователю
      // Например, bot.telegram.sendMessage(...)
      bot.telegram.sendMessage(order.userId, messageText);
      bot.telegram.sendMessage(adminChatId, messageText, {
        parse_mode: "Markdown",
      });
    });
  } catch (error) {
    console.error("Error running cron job: ", error);
  }
};

export const startCronJobs = (bot) => {
  // Задача на проверку каждую минуту
  cron.schedule("* * * * *", () => checkExpiredOrders(bot));
};

// module.exports = startCronJobs;
