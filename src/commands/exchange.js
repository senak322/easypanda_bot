import { Markup } from "telegraf";
import crypto from "crypto";
import { giveExchangeMenu } from "../keyboards/giveExchangeMenu.js";
import { receiveExchangeMenu } from "../keyboards/receiveExchangeMenu.js";
import { config } from "../../config.js";
import { getExchangeRate } from "../utils/api.js";
import { banksMenu } from "../keyboards/banksMenu.js";
import Order from "../models/ExchangeOrder.js";
import { mainMenu } from "../keyboards/mainMenu.js";
// import { sendEmail } from "../controllers/emailsender.js";

const {
  backBtn,
  mainMenuBtn,
  banksRubRecieve,
  banksCnyRecieve,
  banksUahRecieve,
  closeOrderBtn,
  adminChatId,
  waitingOrder,
  completedOrder,
} = config;

export const exchangeCommand = (bot) => {
  bot.hears("💸 Новый обмен", (ctx) => {
    const { isOpen, hoursUntilOpen } = isWorkingTime();

    ctx.session = {};
    ctx.session.state = "selectingSendCurrency";
    if (!isOpen) {
      ctx.reply(
        `К сожалению, сейчас нерабочее время. 
Вы можете оставить заявку сейчас и получить средства через ${hoursUntilOpen} ${
          hoursUntilOpen === 1 ? "час" : "часов"
        }. Рабочее время бота: 9:00-23:00 по Пекинскому времени.`
      );
    }
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
    ["🟢Сбер", "🟡Райффайзен", "🔹AliPay", "💬WeChat", "⬛️МоноБанк"],
    (ctx) => {
      if (ctx.session.state === "chooseSendBank") {
        const { recieveBanks, sendCard, sendCardOwner } =
          chooseBankToRecieve(ctx);
        ctx.session.sendCard = sendCard;
        ctx.session.sendBank = ctx.message.text;
        ctx.session.sendCardOwner = sendCardOwner;
        ctx.reply(
          `Теперь выбери удобный способ получения средств в ${ctx.session.currencyName}`,
          Markup.keyboard([recieveBanks, [mainMenuBtn, backBtn]]).resize()
        );
        ctx.session.state = "chooseRecieveBank";
      }
    }
  );

  bot.hears(
    ["🟢Sber", "🟡Raiffeisen", "🔷AliPay", "💭WeChat", "◾️MonoBank"],
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

22021234567812345 или 5320123456781234`,
            Markup.keyboard([mainMenuBtn]).resize()
          );
          ctx.session.state = "chooseRecieveData";
        }

        ctx.session.recieveBank = ctx.message.text;
      }
    }
  );

  bot.hears("✅ Всё верно, создать заявку!", async (ctx) => {
    if (ctx.session.state === "submitExchange") {
      const hash = crypto
        .createHash("sha256")
        .update(new Date().toISOString()) // Используйте текущую дату и время для уникальности
        .digest("hex")
        .substring(0, 6)
        .toUpperCase();
      // Создание объекта заявки
      const order = new Order({
        userId: ctx.from.id, // ID пользователя в Telegram
        sendCurrency: ctx.session.sendCurrency,
        receiveCurrency: ctx.session.currencyName,
        sendAmount: ctx.session.howToSend,
        receiveAmount: ctx.session.howToRecieve,
        sendBank: ctx.session.sendBank,
        receiveBank: ctx.session.recieveBank,
        ownerName: ctx.session.ownerName,
        ownerData: ctx.session.ownerData,
        qrCodeFileId: ctx.session.qrCodeFileId,
        status: "pending", // Статус заявки
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 60000), // Устанавливаем время истечения срока заявки
        hash: hash,
      });

      // Сохранение заявки в базу данных
      try {
        const savedOrder = await order.save();
        ctx.session.orderId = savedOrder._id; // Сохраните идентификатор заявки в сессию

        // // Отправка данных администраторам
        ctx.session.hash = hash;

        let messageText = `✅Новая заявка #${hash} от пользователя [${ctx.from.first_name}](tg://user?id=${ctx.from.id}).\n\n`;
        messageText += `Пользователь отправляет: ${savedOrder.sendAmount} ${savedOrder.sendCurrency} на ${savedOrder.sendBank} на ${ctx.session.sendCard},\n`;
        messageText += `Пользователь получает: ${savedOrder.receiveAmount} ${savedOrder.receiveCurrency} на ${savedOrder.receiveBank}\n`;
        messageText += `Имя владельца счета получения: ${savedOrder.ownerName}\n`;
        messageText += `Данные счета получения: ${savedOrder.ownerData}\n`;
        messageText += `Дата создания заявки: ${savedOrder.createdAt}\n`;

        if (savedOrder.qrCodeFileId) {
          await bot.telegram.sendPhoto(adminChatId, savedOrder.qrCodeFileId, {
            caption: messageText,
            parse_mode: "Markdown",
          });
        } else {
          await bot.telegram.sendMessage(adminChatId, messageText, {
            parse_mode: "Markdown",
          });
        }

        // Отправка реквизитов для оплаты пользователю
        if (ctx.session.qrCodePath) {
          // Отправка QR-кода для оплаты через WeChat
          await ctx.replyWithPhoto({ source: ctx.session.qrCodePath });
        }

        // const emailMessage = messageText;
        // await sendEmail({
        //   to: "ranpokofficial@gmail.com, senak9883@gmail.com, easypanda247@gmail.com", // Замените на реальный адрес электронной почты администратора
        //   subject: "Новая заявка на обмен",
        //   text: emailMessage,
        //   html: `<p>${emailMessage.replace(/\n/g, "<br>")}</p>`, // Преобразование новых строк в теги <br> для HTML
        // });

        ctx.reply(
          `Ваша заявка #${hash} принята⏱. 

Сумма оплаты: ${ctx.session.howToSend} ${ctx.session.sendCurrency} на ${
            ctx.session.sendBank
          }
Реквизиты для оплаты: ${ctx.session.sendCard}
${ctx.session.sendCardOwner ? `Получатель: ${ctx.session.sendCardOwner}` : ""}
Ниже будут продублированы сумма к оплате и реквизиты для копирования
Пожалуйста, произведите оплату в течение 30 минут и отправьте скриншот в этот чат 👇. 
`,
          Markup.keyboard([
            ["❌Закрыть заявку", "🆘 Поддержка"],
            [mainMenuBtn],
          ]).resize()
        );
        ctx.reply(`${ctx.session.howToSend}`);
        ctx.reply(`${ctx.session.sendCard}`);
      } catch (error) {
        console.error(error);
        ctx.reply("Произошла ошибка при создании заявки.", mainMenu);
      }
      ctx.session.state = "waitingForPaymentProof";
    }
  });

  bot.hears(closeOrderBtn, async (ctx) => {
    // Тут логика для закрытия заявки
    let messageText = `❌Заявка #${ctx.session.hash} от пользователя [${ctx.from.first_name}](tg://user?id=${ctx.from.id}) была закрыта\n\n`;

    if (ctx.session.orderId) {
      try {
        const order = await Order.findById(ctx.session.orderId);
        if (
          order &&
          (order.status === "pending" || order.status === "waitingAccept")
        ) {
          order.status = "cancelled";
          await order.save();
          ctx.reply("Ваша заявка была закрыта.", mainMenu);
          await bot.telegram.sendMessage(adminChatId, messageText, {
            parse_mode: "Markdown",
          });
          ctx.session = {};
        } else {
          ctx.reply("Не удалось найти активную заявку для закрытия.");
        }
      } catch (error) {
        console.error(error);
        ctx.reply("Произошла ошибка при попытке закрыть заявку.");
      }
    } else {
      ctx.reply("Нет активной заявки для закрытия.");
    }
  });

  bot.hears("📚 История заказов", async (ctx) => {
    try {
      const orders = await Order.find({ userId: ctx.from.id }).sort({
        createdAt: -1,
      });
      if (orders.length === 0) {
        return ctx.reply("У вас еще нет заявок.");
      }

      let messageText = "История ваших заявок:\n";
      orders.forEach((order) => {
        const statusIcon =
          order.status === "pending" || order.status === "waitingAccept"
            ? "🔄"
            : order.status === "completed"
            ? "✅"
            : order.status === "cancelled" || order.status === undefined
            ? "❌"
            : "";
        const formattedDate = formatDate(new Date(order.createdAt));

        messageText += `${statusIcon} ${formattedDate} #${order.hash}\n`;
        messageText += `${order.sendAmount.toFixed(2)}${
          order.sendCurrency
        }➡️${order.receiveAmount.toFixed(2)}${order.receiveCurrency}\n\n`;
      });

      ctx.reply(messageText);
    } catch (error) {
      console.error(error);
      ctx.reply("Произошла ошибка при получении истории заказов.");
    }
  });

  bot.hears("🆘 Поддержка", (ctx) => {
    ctx.reply(
      "Если у вас возникли вопросы, вы можете связаться с поддержкой:",
      Markup.inlineKeyboard([
        Markup.button.url(
          "Написать в поддержку",
          "https://t.me/easypandamoney"
        ),
      ])
    );
  });

  bot.hears("❓ FAQ", (ctx) => {
    ctx.reply(
      `👇Ниже ты можешь ознакомиться с часто задаваемыми вопросами:

/1 🐼 О компании EasyPandaMoney
/2 ✅Какие гарантии?
/3 💰Как обменять крупную сумму?
/4 🔍Поиск по номеру заявки
/5 💳Как отправить 🇨🇳CNY с WeChat на карту?
/6 🤖 Мой график работы
      
❓Не нашёл ответа на свой вопрос? 
✍️Напиши его в личку @easypandamoney и специалист обязательно на него ответит 👍`
    );
  });

  //  ⁃ 👩‍❤️‍👨более 7000 постоянных клиентов
//  ⁃ 🚀свыше 100’000 обменов произведено за 5 лет работы
//  ⁃ ❤️10’000+ отзывов от любимых клиентов

  bot.hears("/1", (ctx) => {
    ctx.reply(
      `🐼 О компании EasyPandaMoney

🌟EasyPandaMoney - компания созданная профессионалами, которые всегда готовы помочь и предоставить лучший сервис по обмену валют

Пользуясь нашими услугами, клиенты EasyPandaMoney с лёгкостью могут:
-🏭оплачивать товары поставщикам и на фабрики через 🔹Alipay и карту Китая
-👨‍👩‍👦‍👦 отправлять деньги родным и близким в другую страну
-💱 менять 🇨🇳Юани, 🇷🇺Рубли, 🇺🇦Гривны в любом направлении и в любое удобное время, ведь мы работаем 365 дней в году 🌏
      
📬Наши официальные контакты:
 1. @EasyPandaMoney_bot - Телеграм бот 🤖
 2. @easypandamoney - Администратор бота
 3. easypandamoney - WeChat ID
 4. https://easypandamoney.com/ - Website
‼️Будьте внимательны и всегда проверяйте username ID и адресную строку сайта‼️`
    );
  });

  bot.hears("/2", (ctx) => {
    ctx.reply(
      `✅Какие гарантии?

✅Гарантией нашей качественной работы служит многолетняя репутация и тысячи довольных клиентов. Что бы убедится в подлинности нашего аккаунта и не попасть на мошенников, рекомендуем проверять всегда @username бота (@EasyPandaMoney_bot) и добавить наш рабочий аккаунт в WeChat, обязательно сверив WeChat ID: EasyPandaMoney
❗️(WeChat ID задаются единоразово и являются уникальными именами аккаунтов, которые невозможно изменить) ❗️
💕Также, ты всегда можешь разбить свою сумму на любые удобные части, отправляя следующую, после зачисления предыдущей`
    );
  });

  bot.hears("/3", (ctx) => {
    ctx.reply(
      `💰Как обменять крупную сумму?

💰Чтобы обменять сумму свыше лимитов указанных в боте ✍️ напиши запрос админу @easypandamoney указав сумму и направление перевода
      
Например:
Привет👋 Нужно обменять Х 🇨🇳CNY, на 🇷🇺RUB, хочу спецкурс.
      
Где «Х» предполагаемая сумма обмена.`
    );
  });

  bot.hears("/4", (ctx) => {
    ctx.reply(
      `🔍Поиск по номеру заявки

🔍Чтобы осуществить поиск по номеру заявки достаточно кликнуть в чате на #хэштег заявки
⬆️⬇️Используя стрелки снизу ты можешь легко перемещайся по информации в чате, касающейся конкретной заявки`
    );
  });

  bot.hears("/5", (ctx) => {
    ctx.reply(
      `💳Как отправить 🇨🇳CNY с WeChat на карту?

📄Инструкция отправки с WeChat на карту Зайдите в свой WeChat и нажмите:
Кошелек➡️Деньги➡️Перевод на банковскую карту
Затем вставьте данные карты
Например:
👤Имя: IVANOV IVAN
💳Номер карты: 6230583000011082148
Банк (平安银行) (обычно подтягивается автоматически)
Введите сумму и нажмите «отправить»`
    );
  });

  bot.hears("/6", (ctx) => {
    ctx.reply(
      `🤖 Мой график работы

Создание и приём заявок - Круглосуточно 24/7 365 дней в году
Обработка заявок - 
09:00-23:00 по Пекину
04:00-18:00 по МСК
03:00-17:00 по Киеву
07:00-21:00 по Астане
Без выходных`
    );
  });

  bot.command("approve", async (ctx) => {
    let chatId = "" + ctx.chat.id;

    // Проверяем, отправлена ли команда из группы администраторов
    if (chatId !== adminChatId) {
      return ctx.reply("Эта команда доступна только в группе администраторов.");
    }

    const args = ctx.message.text.split(" ").slice(1);
    if (args.length === 0) {
      return ctx.reply(
        "Пожалуйста, укажите hash заявки. Например: /approve ABC123"
      );
    }

    const hash = args[0];
    try {
      const order = await Order.findOne({ hash: hash });
      if (!order) {
        return ctx.reply(`Заявка с hash ${hash} не найдена.`);
      }

      // Изменение статуса заявки на "завершено"
      order.status = "completed";
      await order.save();

      // Отправка уведомления пользователю
      bot.telegram.sendMessage(
        order.userId,
        `✅Ваша заявка #${hash} успешно завершена. Спасибо, что воспользовались нашим сервисом!`
      );

      ctx.reply(`✅Заявка #${hash} успешно подтверждена и завершена.`);
    } catch (error) {
      console.error("Ошибка при обработке команды /approve:", error);
      ctx.reply("Произошла ошибка при подтверждении заявки.");
    }
  });

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
      const enteredAmount = parseFloat(ctx.message.text);
      if (
        !isNaN(rate) &&
        !isNaN(enteredAmount) &&
        isWithinLimits(
          enteredAmount,
          ctx.session.limitFromRecieve,
          ctx.session.limitToRecieve
        )
      ) {
        const howToSend = getExchangeFormula(ctx, rate);
        ctx.session.howToSend = howToSend;
        ctx.session.howToRecieve = enteredAmount;
        ctx.session.state = "chooseSendBank";
        ctx.reply(
          `Для получения ${ctx.session.howToRecieve} ${ctx.session.currencyName} вам нужно отправить ${howToSend} ${ctx.session.sendCurrency}
Выберите на какой банк удобнее отправить ${ctx.session.sendCurrency} 👇`,
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
      } else {
        // Сообщаем пользователю об ошибке и просим ввести сумму заново
        ctx.reply(
          `⚠️ Введенная сумма должна быть числом от ${ctx.session.limitFromRecieve} до ${ctx.session.limitToRecieve} в ${ctx.session.currencyName}. Пожалуйста, попробуйте снова:`,
          Markup.keyboard([
            [`Указать сумму в ${ctx.session.sendCurrency}`],
            [mainMenuBtn, backBtn],
          ]).resize()
        );
      }
    }
    if (ctx.session.state === "chooseRecieveData") {
      const input = ctx.message.text;
      if (!isNaN(input) || input.includes("@")) {
        ctx.session.ownerData = input;
        ctx.reply(
          `✍️ Теперь укажи 👤Имя владельца ${ctx.session.recieveBank}, в формате IVANOV IVAN или на языке страны получения`,
          Markup.keyboard([mainMenuBtn]).resize()
        );

        ctx.session.state = "chooseRecieveOwner";
      } else {
        ctx.reply("Укажите корректные данные");
      }
    } else if (ctx.session.state === "chooseRecieveOwner") {
      if (isNaN(ctx.message.text)) {
        ctx.session.ownerName = ctx.message.text;
        ctx.reply(
          `🕵️‍♂️А теперь давай проверим что все делаем правильно!
Детали обмена:
➡️Отдаешь ${ctx.session.howToSend} ${ctx.session.sendCurrency} на ${ctx.session.sendBank}  
⬅️ Получаешь ${ctx.session.howToRecieve} ${ctx.session.currencyName} на ${ctx.session.recieveBank}  

Получатель:
${ctx.session.recieveBank}: ${ctx.session.ownerData}  
👤Имя владельца: ${ctx.session.ownerName}  
            `,
          Markup.keyboard([
            "✅ Всё верно, создать заявку!",
            mainMenuBtn,
          ]).resize()
        );

        ctx.session.state = "submitExchange";
      }
    }

    // Обработка других состояний
  });

  bot.on("photo", async (ctx) => {
    if (
      ctx.session.state === "chooseRecieveData" &&
      ctx.session.currencyName === "🇨🇳 CNY"
    ) {
      // Получаем file_id первого фото в массиве
      const fileId = ctx.message.photo[0].file_id;
      // Сохраняем file_id в сессии
      ctx.session.qrCodeFileId = fileId;
      ctx.session.ownerData = "Данные отправлены в формате фото";

      // Просим пользователя подтвердить отправку фото или предложить отправить другое
      ctx.reply(
        `✍️ Теперь укажи 👤Имя владельца ${ctx.session.recieveBank}, в формате IVANOV IVAN или на языке страны получения`,
        Markup.keyboard([mainMenuBtn]).resize()
      );
      ctx.session.state = "chooseRecieveOwner"; // Переходим к следующему шагу
    } else if (ctx.session.state === "waitingForPaymentProof") {
      const fileId =
        ctx.message.photo.length > 1
          ? ctx.message.photo[0].file_id
          : ctx.message.photo[1].file_id;

      // Обновляем статус заявки в базе данных
      const orderToUpdate = await Order.findById(ctx.session.orderId);
      if (orderToUpdate) {
        orderToUpdate.status = "waitingAccept";
        await orderToUpdate.save();
      }

      // Отправляем чек администраторам
      await bot.telegram.sendPhoto(adminChatId, fileId, {
        caption: `Получен чек об оплате от пользователя [${ctx.from.first_name}](tg://user?id=${ctx.from.id}) для заявки #${ctx.session.hash}.`,
        parse_mode: "Markdown",
      });

      // Сообщаем пользователю, что чек получен и ожидает подтверждения
      ctx.reply(
        `${completedOrder}Ваш чек получен и отправлен на подтверждение администратору.

После подтверждения вы получаете средства на указанные Вами данные для получения

${waitingOrder}Среднее время обработки платежа 30 минут

Если возникнут вопросы вы можете обратиться в поддежку нажав на соответсвующую кнопку в меню ниже`
      );

      // Обновляем состояние сессии
      ctx.session.state = "waitingForAdminApproval";
    }
  });

  const formatDate = (date) => {
    return date.toLocaleString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  function isWithinLimits(amount, min, max) {
    return amount >= min && amount <= max;
  }

  const howMuchComission = (ctx, rate) => {
    let comission = 0;
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
    let sendCardOwner = "";
    let qrCodePath = ""; // Путь к файлу QR-кода
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
      sendCardOwner = "Александр В.";
    } else if (ctx.message.text === "🟡Райффайзен") {
      sendCard = 2200300517155691;
      sendCardOwner = "Екатерина Б.";
    } else if (ctx.message.text === "🔹AliPay") {
      sendCard = 13136022300;
      sendCardOwner = "";
    } else if (ctx.message.text === "💬WeChat") {
      sendCard = "QR";
      sendCardOwner = "";
      qrCodePath = "./src/images/qrwechat.jpg";
      ctx.session.qrCodePath = qrCodePath; // Сохранение пути к QR-коду в сессии
    } else if (ctx.message.text === "⬛️МоноБанк") {
      sendCard = 5375411508576258;
      sendCardOwner = "";
    }
    return { sendCard, recieveBanks, sendCardOwner };
  }
};

function isWorkingTime() {
  const pekingTime = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Shanghai" })
  );
  const hours = pekingTime.getHours();
  const workingStartHour = 9;
  const workingEndHour = 23;

  const isOpen = hours >= workingStartHour && hours < workingEndHour;
  let hoursUntilOpen = 0;

  if (!isOpen) {
    if (hours < workingStartHour) {
      // До начала работы
      hoursUntilOpen = workingStartHour - hours;
    } else {
      // После окончания работы
      hoursUntilOpen = 24 - hours + workingStartHour;
    }
  }

  return { isOpen, hoursUntilOpen };
}
