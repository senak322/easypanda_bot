import cron from "node-cron";
import Order from "../models/ExchangeOrder.js"; // Убедитесь, что путь к модели верный
import { config } from "../../config.js";
import axios from "axios";
const { adminChatId, currencyRubUrl, currencyCnyUrl, currencyUahUrl } = config;

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

// Функция для получения курсов валют и добавления вашего процента
async function getCustomExchangeRates() {
  const rubCurr = await axios.get(currencyRubUrl);
  const uahCurr = await axios.get(currencyUahUrl);
  const cnyCurr = await axios.get(currencyCnyUrl);

  return {
    RUB_CNY: (rubCurr.data.rub.cny * 0.93).toFixed(10),
    UAH_CNY: (uahCurr.data.uah.cny * 0.9).toFixed(10),
    CNY_RUB: (cnyCurr.data.cny.rub * 0.96).toFixed(10),
    CNY_UAH: (cnyCurr.data.cny.uah * 0.96).toFixed(10),
    // Добавьте другие пары валют по аналогии
  };
}

// Функция для отправки сообщения с приветствием и курсами валют
async function sendGreetingAndRates(bot) {
  const greetings = [
    "Доброе утро! Хорошего начала дня!🎉",
    "Добрый день! Желаем продуктивной второй половины дня!",
    "Доброй ночи, желаем крепкого сна!",
  ];

  // Получаем текущий час для определения нужного приветствия
  const currentHour = new Date().getHours();
  const greetingIndex = currentHour < 12 ? 0 : currentHour < 18 ? 1 : 2;

  const rates = await getCustomExchangeRates();
  const ratesMessage = `RUB🇷🇺 -> CNY🇨🇳 ${rates.RUB_CNY}\nUAH🇺🇦 -> CNY🇨🇳 ${rates.UAH_CNY}\nCNY🇨🇳 -> RUB🇷🇺 ${rates.CNY_RUB}\nCNY🇨🇳 -> UAH🇺🇦 ${rates.CNY_UAH}\n`;

  const message = `${greetings[greetingIndex]}\n\n🚀Экспресс обмен валют💸\nГорячий курс🔥\nКурс на момент публикации:\n${ratesMessage}\n\nПроверь актуальный курс в боте, либо на сайте!\n[🐼 Основная группа](https://t.me/EasyPandaMoney_Chat)\n[🌎 Сайт](https://easypandamoney.com/)\n[🤖 Бот](https://t.me/EasyPandaMoney_bot)\n[📒Отзывы](https://t.me/EasyPandaMoney_otzivi/5)\n[👨‍⚕️Тех.Поддержка](https://t.me/easypandamoney)`;

  bot.telegram.sendMessage(config.adminChatId, message, {
    parse_mode: "Markdown",
    disable_web_page_preview: true,
  });
}

export const startCronJobs = (bot) => {
  // Задача на проверку каждую минуту
  cron.schedule("* * * * *", () => checkExpiredOrders(bot));

  // Отправка приветствия и курсов валют три раза в день
  cron.schedule("0 9 * * *", () => sendGreetingAndRates(bot), {
    scheduled: true,
    timezone: "Europe/Moscow",
  });
  cron.schedule("0 12 * * *", () => sendGreetingAndRates(bot), {
    scheduled: true,
    timezone: "Europe/Moscow",
  });
  cron.schedule("0 18 * * *", () => sendGreetingAndRates(bot), {
    scheduled: true,
    timezone: "Europe/Moscow",
  });
};
