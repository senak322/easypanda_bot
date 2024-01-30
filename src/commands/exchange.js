import { Markup } from "telegraf";
import { giveExchangeMenu } from "../keyboards/giveExchangeMenu.js";
import { receiveExchangeMenu } from "../keyboards/receiveExchangeMenu.js";

export const exchangeCommand = (bot) => {
  bot.hears("💸 Новый обмен", (ctx) => {
    ctx.session.state = "selectingSendCurrency";
    ctx.reply("Выберите валюту отправки 👇", giveExchangeMenu);
  });

  bot.hears(["🇷🇺 RUB", "🇨🇳 CNY", "🇺🇦 UAH"], (ctx) => {
    // Логика для выбора валюты отправки
    // Сохраняем выбранную валюту отправки в сессии
    ctx.session.state = "selectingReceiveCurrency";
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
    ctx.reply(
      `Вы отдаёте ${ctx.session.sendCurrency}
Выберите валюту Получения 👇`,
      menu
    );
  });

  bot.hears(
    ["Получить 🇨🇳 CNY", "Получить 🇷🇺 RUB", "Получить 🇺🇦 UAH"],
    (ctx) => {
      ctx.session.state = "enteringAmount";
      ctx.session.receiveCurrency = ctx.message.text;

      // Логика для выбора суммы получения
      let limitFrom;
      let limitTo;
      let currencyName = "";
      switch (ctx.session.receiveCurrency) {
        case "Получить 🇷🇺 RUB":
          // menu = receiveExchangeMenu(["Сбер", "Райффайзен"]);
          limitFrom = 1000;
          limitTo = 300000;
          currencyName = "🇷🇺 RUB";
          break;
        case "Получить 🇺🇦 UAH":
          // menu = receiveExchangeMenu(["ПриватБанк", "МоноБанк"]);
          limitFrom = 1000;
          limitTo = 50000;
          currencyName = "🇺🇦 UAH";
          break;
        case "Получить 🇨🇳 CNY":
          // menu = receiveExchangeMenu(["AliPay", "WeChat"]);
          limitFrom = 500;
          limitTo = 25000;
          currencyName = "🇨🇳 CNY";
          break;
      }
      ctx.session.currencyName = currencyName;
      ctx.reply(
        `✍️ Напиши мне сумму, которую хочешь обменять от ${limitFrom} до ${limitTo} ${ctx.session.sendCurrency}
Если тебе нужно получить конкретную сумму в ${ctx.session.currencyName} жми «Указать сумму в ${ctx.session.currencyName}»`,
        Markup.keyboard([
          `Указать сумму в ${ctx.session.currencyName}`,
          ["📲 Главное меню", "🔙 Назад"],
        ]).resize()
      );
    }
  );
  bot.on("text", (ctx) => {
    if (ctx.session.state === "enteringAmount") {
      if (ctx.message.text === `Указать сумму в ${ctx.session.currencyName}`) {
        // Логика переключения валюты
        ctx.session.state = "switchingCurrency";
        console.log(ctx.message.text);
        // ...
      } else if (
        !isNaN(ctx.message.text) &&
        isWithinLimits(ctx.message.text, limitFrom, limitTo)
      ) {
        // Пользователь ввел корректную сумму
        ctx.session.amount = ctx.message.text;
        // Далее логика обработки обмена
      } else {
        // Пользователь ввел некорректные данные
        ctx.reply(`⚠️ Введите число от ${limitFrom} до ${limitTo}`);
      }
    }
    // Обработка других состояний
  });

  function isWithinLimits(amount, min, max) {
    return amount >= min && amount <= max;
  }
};
