import cron from "node-cron";
import Order from "../models/ExchangeOrder.js"; // Убедитесь, что путь к модели верный
import { config } from "../../config.js";
// import axios from "axios";
import { User } from "../models/User.js";

const { adminChatId, groupChatId } = config;

const checkExpiredOrders = async (bot) => {
  try {
    const now = new Date();
    const expiredOrders = await Order.find({
      status: "pending",
      expiresAt: { $lt: now },
    });

    expiredOrders.forEach(async (order) => {
      order.status = "cancelledByTimer";
      await order.save();
      // Найти пользователя этой заявки
      let user = await User.findOne({ userId: order.userId });
      if (user) {
        // Добавить неоплаченный ордер в историю пользователя
        user.unpaidOrders.push({ orderId: order._id, createdAt: new Date() });
        await user.save();
      }
      let messageText = `Время на оплату истекло. Заявка #${order.hash} отменена.\n`;
      let userText = `❕Если ты оплатил заявку после отмены скорее пиши номер заявки в службу поддержки @easypandamoney и прикрепляй чек об оплате 🧾Я не гарантирую, но постараюсь помочь ✊

⚠️ Если в течение суток мне прийдется отменить твою заявку более трех раз, твой аккаунт может быть заблокирован
      
Пожалуйста, не создавай заявку, если не готов оплатить её в отведенное время 🙏🏻`;

      let textForUser = messageText + userText;

      // Здесь логика отправки сообщения пользователю
      bot.telegram.sendMessage(order.userId, textForUser);
      bot.telegram.sendMessage(adminChatId, messageText, {
        parse_mode: "Markdown",
      });
    });
  } catch (error) {
    console.error("Error running cron job: ", error);
  }
};

// Функция для получения курсов валют и добавления вашего процента
// async function getCustomExchangeRates() {
//   const rubCurr = await axios.get(`${baseCurrencyUrl}rub.json`);
//   const uahCurr = await axios.get(`${baseCurrencyUrl}uah.json`);
//   const cnyCurr = await axios.get(`${baseCurrencyUrl}cny.json`);

//   return {
//     RUB_CNY: (rubCurr.data.rub.cny * 0.96).toFixed(10),
//     UAH_CNY: (uahCurr.data.uah.cny * 0.91).toFixed(10),
//     CNY_RUB: (cnyCurr.data.cny.rub * 0.94).toFixed(10),
//     CNY_UAH: (cnyCurr.data.cny.uah * 0.94).toFixed(10),
//     // Добавьте другие пары валют по аналогии
//   };
// }

// Функция для отправки сообщения с приветствием и курсами валют
async function sendGreetingAndRates(bot) {
  const message = `Доброго времени суток\\!

🤖 \\@EasyPandaMoney\\_bot 🐼
Сервис для быстрого и удобного обмена валют💸
Горячий курс🔥
У нас можно обменять:
RUB🇷🇺 \\-\\> CNY🇨🇳
UAH🇺🇦 \\-\\> CNY🇨🇳
CNY🇨🇳 \\-\\> RUB🇷🇺
CNY🇨🇳 \\-\\> UAH🇺🇦

Проверь актуальный курс в боте\\!
[🐼 Основная группа](https://t.me/EasyPandaMoney_Chat)
[🤖 Бот](https://t.me/EasyPandaMoney_bot)
[👨‍⚕️Тех\\.Поддержка](https://t.me/easypandamoney)`;

  bot.telegram.sendMessage(groupChatId, message, {
    parse_mode: "MarkdownV2",
    disable_web_page_preview: true,
  });
}

// [🌎 Сайт](https://easypandamoney.com/)\n

export const startCronJobs = (bot) => {
  // Задача на проверку каждую минуту
  cron.schedule("* * * * *", () => checkExpiredOrders(bot));

  // Отправка приветствия и курсов валют три раза в день
  cron.schedule("0 9 * * *", () => sendGreetingAndRates(bot), {
    scheduled: true,
    timezone: "Europe/Moscow",
  });
  // cron.schedule("0 12 * * *", () => sendGreetingAndRates(bot), {
  //   scheduled: true,
  //   timezone: "Europe/Moscow",
  // });
  // cron.schedule("0 18 * * *", () => sendGreetingAndRates(bot), {
  //   scheduled: true,
  //   timezone: "Europe/Moscow",
  // });
};
