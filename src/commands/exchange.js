import { Markup } from "telegraf";
import { giveExchangeMenu } from "../keyboards/giveExchangeMenu.js";
import { receiveExchangeMenu } from "../keyboards/receiveExchangeMenu.js";
import { config } from "../../config.js";
import { getExchangeRate } from "../utils/api.js";

const { backBtn, mainMenuBtn } = config;

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
    ctx.session.menuReceiveCurrency = menu;
    ctx.reply(
      `Вы отдаёте ${ctx.session.sendCurrency}
Выберите валюту Получения 👇`,
      ctx.session.menuReceiveCurrency
    );
  });

  bot.hears(
    ["Получить 🇨🇳 CNY", "Получить 🇷🇺 RUB", "Получить 🇺🇦 UAH"],
    (ctx) => {
      ctx.session.state = "enteringAmount";
      ctx.session.receiveCurrency = ctx.message.text;

      // Логика для выбора суммы получения
      let limitFrom = 0;
      let limitTo = 0;
      let currencyName = "";
      console.log(ctx.session.sendCurrency);
      switch (ctx.session.receiveCurrency) {
        case "Получить 🇷🇺 RUB":
          if (ctx.session.sendCurrency === "🇨🇳 CNY") {
            // menu = receiveExchangeMenu(["Сбер", "Райффайзен"]);
            limitFrom = 100;
            limitTo = 25000;
            currencyName = "🇷🇺 RUB";
          }
          break;
        case "Получить 🇺🇦 UAH":
          if (ctx.session.sendCurrency === "🇨🇳 CNY") {
            // menu = receiveExchangeMenu(["ПриватБанк", "МоноБанк"]);
            limitFrom = 100;
            limitTo = 25000;
            currencyName = "🇺🇦 UAH";
          }
          break;
        case "Получить 🇨🇳 CNY":
          if (ctx.session.sendCurrency === "🇷🇺 RUB") {
            // menu = receiveExchangeMenu(["AliPay", "WeChat"]);
            limitFrom = 1000;
            limitTo = 300000;
            currencyName = "🇨🇳 CNY";
          }
          break;
        case "Получить 🇨🇳 CNY":
          if (ctx.session.sendCurrency === "🇺🇦 UAH") {
            // menu = receiveExchangeMenu(["AliPay", "WeChat"]);
            limitFrom = 500;
            limitTo = 50000;
            currencyName = "🇨🇳 CNY";
          }
          break;
      }
      ctx.session.currencyName = currencyName;
      ctx.session.limitFrom = limitFrom;
      ctx.session.limitTo = limitTo;
      ctx.reply(
        `✍️ Напиши мне сумму, в ${ctx.session.sendCurrency} которую хочешь обменять от ${ctx.session.limitFrom} до ${ctx.session.limitTo} 
Если тебе нужно получить конкретную сумму в ${ctx.session.currencyName} жми «Указать сумму в ${ctx.session.currencyName}»`,
        Markup.keyboard([
          [`Указать сумму в ${ctx.session.currencyName}`],
          [mainMenuBtn, backBtn],
        ]).resize()
      );
    }
  );

  bot.on("text", async (ctx) => {
    let limitToRecieve;
    let limitFromRecieve;
    // let comission = 0;
    if (ctx.session.state === "enteringAmount") {
      const rate = await getExchangeRate(ctx);
      if (ctx.message.text === backBtn) {
        // Пропускаем обработку, чтобы позволить middleware обработать это
        return;
      }
      if (ctx.message.text === `Указать сумму в ${ctx.session.currencyName}`) {
        // Логика переключения валюты
        ctx.session.state = "enteringReceiveAmount";
        if (ctx.session.currencyName === "🇨🇳 CNY") {
          limitFromRecieve = 100;
          limitToRecieve = 25000;
        }
        if (ctx.session.currencyName === "🇷🇺 RUB") {
          limitFromRecieve = 1000;
          limitToRecieve = 30000;
        }
        if (ctx.session.currencyName === "🇺🇦 UAH") {
          limitFromRecieve = 500;
          limitToRecieve = 50000;
        }
        ctx.session.limitFromRecieve = limitFromRecieve;
        ctx.session.limitToRecieve = limitToRecieve;
        ctx.reply(
          `Введите сумму, которую хотите получить
Укажите сумму от ${ctx.session.limitFromRecieve} до ${ctx.session.limitToRecieve} в ${ctx.session.currencyName}`,
          Markup.keyboard([
            [`Указать сумму в ${ctx.session.sendCurrency}`],
            [mainMenuBtn, backBtn],
          ]).resize()
        );
        // ...
      } else if (
        !isNaN(ctx.message.text) &&
        isWithinLimits(
          ctx.message.text,
          ctx.session.limitFrom,
          ctx.session.limitTo
        )
      ) {
        // Пользователь ввел корректную сумму
        // Далее логика обработки обмена
        ctx.session.amount = ctx.message.text;
        // let comission = howMuchComission(ctx)
        const initialReceiveSum = rate * ctx.session.amount;
        const receiveSum = Math.floor(
          initialReceiveSum - initialReceiveSum * howMuchComission(ctx)
        );
        ctx.reply(
          `Вы отправляете ${ctx.session.amount} ${ctx.session.sendCurrency}
К получению ${receiveSum} ${ctx.session.currencyName}`
        );
      } else {
        // Пользователь ввел некорректные данные
        ctx.reply(
          `⚠️ Введите число от ${
            ctx.session.state === "enteringAmount"
              ? ctx.session.limitFrom
              : ctx.session.limitFromRecieve
          } до ${
            ctx.session.state === "enteringAmount"
              ? ctx.session.limitTo
              : ctx.session.limitToRecieve
          }`
        );
      }
    } else if (
      ctx.message.text === `Указать сумму в ${ctx.session.sendCurrency}`
    ) {
      ctx.session.state = "enteringAmount";
      ctx.reply(
        `Введите сумму, которую хотите отправить от ${ctx.session.limitFrom} до ${ctx.session.limitTo} в ${ctx.session.sendCurrency}`,
        Markup.keyboard([
          [`Указать сумму в ${ctx.session.currencyName}`],
          [mainMenuBtn, backBtn],
        ]).resize()
      );
    }
    // Обработка других состояний
  });

  function isWithinLimits(amount, min, max) {
    return amount >= min && amount <= max;
  }

  const howMuchComission = (ctx) => {
    let comission = 0;
    if (0 >= ctx.session.amount) {
      ctx.reply(
        `⚠️ Введите число от ${
          ctx.session.state === "enteringAmount"
            ? ctx.session.limitFrom
            : ctx.session.limitFromRecieve
        } до ${
          ctx.session.state === "enteringAmount"
            ? ctx.session.limitTo
            : ctx.session.limitToRecieve
        }`
      );
      return;
    }
    if (ctx.session.sendCurrency === "🇷🇺 RUB") {
      if (0 < ctx.session.amount && ctx.session.amount < 5000) {
        comission = 0.15;
      } else if (5000 <= ctx.session.amount && ctx.session.amount < 50000) {
        comission = 0.1;
      } else if (50000 <= ctx.session.amount && ctx.session.amount <= 300000) {
        comission = 0.07;
      }
    }
    if (ctx.session.sendCurrency === "🇨🇳 CNY") {
      if (0 < ctx.session.amount && ctx.session.amount < 3500) {
        comission = 0.08;
      } else if (3500 <= ctx.session.amount && ctx.session.amount < 10000) {
        comission = 0.1;
      } else if (10000 <= ctx.session.amount && ctx.session.amount <= 25000) {
        comission = 0.07;
      }
    }
    if (ctx.session.sendCurrency === "🇺🇦 UAH") {
      if (0 < ctx.session.amount && ctx.session.amount < 2000) {
        comission = 0.17;
      } else if (2000 <= ctx.session.amount && ctx.session.amount < 20000) {
        comission = 0.1;
      } else if (20000 <= ctx.session.amount && ctx.session.amount <= 50000) {
        comission = 0.07;
      }
    }
    return comission
  };
  
};
