import { giveExchangeMenu } from "../keyboards/giveExchangeMenu.js";
import { receiveExchangeMenu } from "../keyboards/receiveExchangeMenu.js";

export const exchangeCommand = (bot) => {
  bot.hears("💸 Новый обмен", (ctx) => {
    ctx.session.state = 'selectingSendCurrency';
    ctx.reply("Выберите валюту отправки", giveExchangeMenu);
  });

  bot.hears(["🇷🇺 RUB", "🇨🇳 CNY", "🇺🇦 UAH"], (ctx) => {
    // Логика для выбора валюты отправки
    // Сохраняем выбранную валюту отправки в сессии
    ctx.session.state = 'selectingReceiveCurrency';
    ctx.session.sendCurrency = ctx.message.text;
    
    // Логика для выбора валюты получения
    let menu;
    switch (ctx.session.sendCurrency) {
      case "🇷🇺 RUB":
      case "🇺🇦 UAH":
        menu = receiveExchangeMenu(["Получить 🇨🇳 CNY"]); // Только CNY
        break;
      case "🇨🇳 CNY":
        menu = receiveExchangeMenu(["Получить 🇷🇺 RUB", "Получить 🇺🇦 UAH"]); // RUB и UAH
        break;
    }
    ctx.reply("Выберите валюту Получения", menu);
  });

  bot.hears(["Получить 🇨🇳 CNY", "Получить 🇷🇺 RUB", "Получить 🇺🇦 UAH"], (ctx) => {
    ctx.session.state = 'selectingSendBank';
    // Логика для выбора валюты получения
  });
};
