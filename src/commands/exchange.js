import { Markup } from "telegraf";
import { giveExchangeMenu } from "../keyboards/giveExchangeMenu.js";
import { receiveExchangeMenu } from "../keyboards/receiveExchangeMenu.js";
import { config } from "../../config.js";
import { getExchangeRate } from "../utils/api.js";
import { banksMenu } from "../keyboards/banksMenu.js";

const {
  backBtn,
  mainMenuBtn,
  banksRub,
  banksCny,
  banksUah,
  banksRubRecieve,
  banksCnyRecieve,
  banksUahRecieve,
} = config;

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
      console.log(ctx.session.receiveCurrency);
      switch (ctx.session.receiveCurrency) {
        case "Получить 🇷🇺 RUB":
          if (ctx.session.sendCurrency === "🇨🇳 CNY") {
            limitFrom = 100;
            limitTo = 25000;
            currencyName = "🇷🇺 RUB";
          }
          break;
        case "Получить 🇺🇦 UAH":
          if (ctx.session.sendCurrency === "🇨🇳 CNY") {
            limitFrom = 100;
            limitTo = 25000;
            currencyName = "🇺🇦 UAH";
          }
          break;
        case "Получить 🇨🇳 CNY":
          if (ctx.session.sendCurrency === "🇷🇺 RUB") {
            limitFrom = 1000;
            limitTo = 300000;
            currencyName = "🇨🇳 CNY";
          }
          if (ctx.session.sendCurrency === "🇺🇦 UAH") {
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

  bot.hears(
    [
      "🟢Сбер",
      "🟡Райффайзен",
      "🔹AliPay",
      "💬WeChat",
      "🏦ПриватБанк",
      "⬛️МоноБанк",
    ],
    (ctx) => {
      if (ctx.session.state === "chooseSendBank") {
        const { recieveBanks, sendCard } = chooseBankToRecieve(ctx);
        ctx.session.sendCard = sendCard;
        ctx.session.sendBank = ctx.message.text;
        ctx.reply(
          `Теперь выбери удобный способ получения средств в ${ctx.session.currencyName}`,
          Markup.keyboard([recieveBanks, [mainMenuBtn, backBtn]]).resize()
        );
        ctx.session.state = "chooseRecieveBank";
      }
    }
  );

  bot.hears(
    [
      "🟢Sber",
      "🟡Raiffeisen",
      "🔷AliPay",
      "💭WeChat",
      "🏫PrivatBank",
      "◾️MonoBank",
    ],
    (ctx) => {
      if (ctx.session.state === "chooseRecieveBank") {
        if (ctx.session.currencyName === "🇨🇳 CNY") {
          if (ctx.message.text === "🔷AliPay") {
            ctx.reply(
              `✍️ Напиши аккаунт 🔷Alipay в формате
12345678 (номер 🔷Alipay)
Или
example@live.cn (почта 🔷Alipay)
            
Или отправь🧾фото или скриншот QR кода кошелька сюда в чат👇`,
              Markup.keyboard([mainMenuBtn]).resize()
            );
            ctx.session.state = "chooseRecieveData";
          }
          if (ctx.message.text === "💭WeChat") {
            ctx.reply(
              "Теперь отправь QR-code на оплату 💬 WeChat сюда в чат👇",
              Markup.keyboard([mainMenuBtn]).resize()
            );
            ctx.session.state = "chooseRecieveData";
          }
        } else if (
          ctx.session.currencyName === "🇷🇺 RUB" ||
          ctx.session.currencyName === "🇺🇦 UAH"
        ) {
          ctx.reply(
            `✍️ Напиши номер 💳карты ${
              ctx.session.currencyName === "🇷🇺 RUB" ? "🇷🇺 RUB" : "🇺🇦 UAH"
            } в формате

2202123456781234567 или 5320123456781234`,
            Markup.keyboard([mainMenuBtn]).resize()
          );
          ctx.session.state = "chooseRecieveData";
        }
      }
      ctx.session.recieveBank = ctx.message.text;
    }
  );

  bot.on("text", async (ctx) => {
    let limitToRecieve;
    let limitFromRecieve;

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
          limitToRecieve = 300000;
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
        ctx.session.howToSend = ctx.message.text;
        const howToRecieve = getExchangeFormula(ctx, rate);
        console.log(howToRecieve);
        ctx.session.howToRecieve = howToRecieve;
        ctx.session.state = "chooseSendBank";
        ctx.reply(
          `Вы отправляете ${ctx.session.howToSend} ${ctx.session.sendCurrency}
К получению ${howToRecieve} ${ctx.session.currencyName}
Выберите с какого банка Вам удобнее отправить ${ctx.session.sendCurrency} 👇`,
          banksMenu(ctx)
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
          }
`
        );
      }
    } else if (ctx.session.state === "enteringReceiveAmount") {
      const rate = await getExchangeRate(ctx);
      if (!isNaN(rate) && !isNaN(parseFloat(ctx.message.text))) {
        const howToSend = getExchangeFormula(ctx, rate);
        ctx.session.howToSend = howToSend;
        ctx.session.howToRecieve = ctx.message.text;
        ctx.session.state = "chooseSendBank";
        ctx.reply(
          `Для получения ${ctx.session.howToRecieve} ${ctx.session.currencyName} вам нужно отправить ${howToSend} ${ctx.session.sendCurrency}Выберите на какой банк удобнее отправить ${ctx.session.sendCurrency} 👇`,
          banksMenu(ctx)
        );
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
    }
    if (ctx.session.state === "chooseRecieveData") {
      ctx.session.ownerData = ctx.message.text;
      ctx
        .reply(
          `✍️ Теперь укажи 👤Имя владельца ${ctx.session.recieveBank}, в формате IVANOV IVAN или на языке страны получения`,
          Markup.keyboard([mainMenuBtn]).resize()
        )
        
      ctx.session.state = "chooseRecieveDataOwner";
    }
    if (ctx.session.state === "chooseRecieveDataOwner") {
      if (isNaN(ctx.message.text)) {
        ctx.session.ownerName = ctx.message.text;
        ctx
          .reply(
            `🕵️‍♂️А теперь давай проверим что все делаем правильно!
Детали обмена:
➡️Отдаешь ${ctx.session.howToSend} ${ctx.session.sendCurrency} на ${ctx.session.sendBank}  
⬅️ Получаешь ${ctx.session.howToRecieve} ${ctx.session.currencyName} на ${ctx.session.recieveBank}  

Получатель:
${ctx.session.recieveBank}: ${ctx.session.ownerData}  
👤Имя владельца: ${ctx.session.ownerName}  
            `,
            Markup.keyboard(["✅ Всё верно, создать заявку!", mainMenuBtn]).resize()
          )
          
        ctx.session.state = "chooseRecieveDataOwner";
      }
    }
    // Обработка других состояний
  });

  function isWithinLimits(amount, min, max) {
    return amount >= min && amount <= max;
  }

  const howMuchComission = (ctx, rate) => {
    let comission = 0;
    console.log(ctx.message.text);
    const amount =
      ctx.session.state === "enteringAmount"
        ? ctx.message.text
        : ctx.session.state === "enteringReceiveAmount"
        ? ctx.message.text / rate
        : 0;
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
      if (0 < amount && amount < 5000) {
        comission = 0.15;
      } else if (5000 <= amount && amount < 50000) {
        comission = 0.1;
      } else if (50000 <= amount && amount <= 300000) {
        comission = 0.07;
      }
    }
    if (ctx.session.sendCurrency === "🇨🇳 CNY") {
      if (0 < amount && amount < 3500) {
        comission = 0.08;
      } else if (3500 <= amount && amount < 10000) {
        comission = 0.06;
      } else if (10000 <= amount && amount <= 25000) {
        comission = 0.04;
      }
    }
    if (ctx.session.sendCurrency === "🇺🇦 UAH") {
      if (0 < amount && amount < 2000) {
        comission = 0.17;
      } else if (2000 <= amount && amount < 20000) {
        comission = 0.11;
      } else if (20000 <= amount && amount <= 50000) {
        comission = 0.1;
      }
    }

    return comission;
  };

  function getExchangeFormula(ctx, rate) {
    let receiveSum = 0;
    // let desiredReceiveAmount = 0
    if (ctx.session.state === "enteringAmount") {
      if (ctx.session.sendCurrency === "🇷🇺 RUB" || "🇺🇦 UAH") {
        const initialReceiveSum = rate * ctx.message.text;
        receiveSum = Math.floor(
          initialReceiveSum - initialReceiveSum * howMuchComission(ctx, rate)
        );
        return receiveSum;
      } else if (ctx.session.sendCurrency === "🇨🇳 CNY") {
        const initialReceiveSum = rate * ctx.message.text;
        receiveSum = Math.floor(
          initialReceiveSum + initialReceiveSum * howMuchComission(ctx, rate)
        );
        return receiveSum;
      }
    } else if (ctx.session.state === "enteringReceiveAmount") {
      const comissionRate = howMuchComission(ctx, rate);
      // Рассчитываем сумму к отправке с учетом комиссии
      receiveSum = Math.floor(ctx.message.text / (rate * (1 - comissionRate)));
      return receiveSum;
    }
  }

  function chooseBankToRecieve(ctx) {
    let sendCard = 0;
    let recieveBanks =
      ctx.session.currencyName === "🇨🇳 CNY"
        ? banksCnyRecieve
        : ctx.session.currencyName === "🇷🇺 RUB"
        ? banksRubRecieve
        : ctx.session.currencyName === "🇺🇦 UAH"
        ? banksUahRecieve
        : 0;

    if (ctx.message.text === "🟢Сбер") {
      sendCard = 2202206296854099;
    } else if (ctx.message.text === "🟡Райффайзен") {
      sendCard = 2000000000000009;
    } else if (ctx.message.text === "🔹AliPay") {
      sendCard = 2000000000000008;
    } else if (ctx.message.text === "💬WeChat") {
      sendCard = 2000000000000007;
    } else if (ctx.message.text === "🏦ПриватБанк") {
      sendCard = 2000000000000006;
    } else if (ctx.message.text === "⬛️МоноБанк") {
      sendCard = 2000000000000005;
    }
    return { sendCard, recieveBanks };
  }
};
