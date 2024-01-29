import { giveExchangeMenu } from "../keyboards/giveExchangeMenu.js";
import { backToMainMenu } from "../middlewares/backToMainMenu.js";

export const exchangeCommand = (bot) => {
  bot.hears("💸 Новый обмен", (ctx) => {
    ctx.reply("Выберите валюту отправки:", giveExchangeMenu);
  });

  // Дополнительные обработчики для выбора валюты
  bot.hears("🇷🇺 RUB", (ctx) => {
    // Логика для обмена рублей
  });

  bot.hears("🇨🇳 CNY", (ctx) => {
    // Логика для обмена юаней
  });

  bot.hears("🇺🇦 UAH", (ctx) => {
    // Логика для обмена гривен
  });

  bot.hears("🔙 Главное меню", backToMainMenu);
};
