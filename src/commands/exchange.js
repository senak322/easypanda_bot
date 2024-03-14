import { Markup } from "telegraf";
import crypto from "crypto";
import { giveExchangeMenu } from "../keyboards/giveExchangeMenu.js";
import { receiveExchangeMenu } from "../keyboards/receiveExchangeMenu.js";
import { config } from "../../config.js";
import { getExchangeRate } from "../utils/api.js";
import { banksMenu } from "../keyboards/banksMenu.js";
import Order from "../models/ExchangeOrder.js";
import { mainMenu } from "../keyboards/mainMenu.js";
import { User } from "../models/User.js";
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
            limitFrom = 400;
            limitTo = 25000;
            currencyName = "🇷🇺 RUB";
          }
          break;
        case "Получить 🇺🇦 UAH":
          if (ctx.session.sendCurrency === "🇨🇳 CNY") {
            limitFrom = 400;
            limitTo = 25000;
            currencyName = "🇺🇦 UAH";
          }
          break;
        case "Получить 🇨🇳 CNY":
          if (ctx.session.sendCurrency === "🇷🇺 RUB") {
            limitFrom = 5000;
            limitTo = 300000;
            currencyName = "🇨🇳 CNY";
          }
          if (ctx.session.sendCurrency === "🇺🇦 UAH") {
            limitFrom = 2000;
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
      "✅Сбер",
      "🟡Тинькофф",
      "🔶Райффайзен",
      "🔹AliPay",
      "💬WeChat",
      "⬛️МоноБанк",
    ],
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
    [
      "✅Sber",
      "🟡Tinkoff",
      "🔶Raiffeisen",
      "🔷AliPay",
      "💭WeChat",
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
      let user = await User.findOne({ userId: Number(ctx.from.id) });
      let pandingOrder = await Order.findOne({
        userId: Number(ctx.from.id),
        status: "pending" || "waitingAccept",
      });
      if (!user) {
        // Если пользователь не найден, создаем нового
        user = new User({
          userId: Number(ctx.from.id),
          paidOrders: 0,
          unpaidOrders: [],
          isBlocked: false,
        });
        await user.save();
      } else {
        const now = new Date();
        const aDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        // Фильтрация неоплаченных заявок за последние 24 часа
        const recentUnpaidOrders = user.unpaidOrders.filter(
          (order) => order.createdAt > aDayAgo
        );

        if (recentUnpaidOrders.length > 3) {
          // Блокировка пользователя
          user.isBlocked = true;
          await user.save();
          return ctx.reply("Вы заблокированы за создание неоплаченных заявок.");
        }
      }

      if (pandingOrder) {
        return ctx.reply(
          `У вас уже есть незавершённая заявка. 
Для завершения обмена или отмены заявки напишите Администратору нажав кнопку  "🆘 Поддержка".`
        );
      }

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

        let messageText = `✅Новая заявка #${hash} от пользователя [${ctx.from.first_name}](tg://user?id=${ctx.from.id}) [ID: ${ctx.from.id}].\n\n`;
        messageText += `Пользователь отправляет: ${savedOrder.sendAmount} ${savedOrder.sendCurrency} на ${savedOrder.sendBank} на ${ctx.session.sendCard},\n`;
        messageText += `Пользователь получает: ${savedOrder.receiveAmount} ${savedOrder.receiveCurrency} на ${savedOrder.receiveBank}\n`;
        messageText += `Имя владельца счета получения: ${savedOrder.ownerName}\n`;
        messageText += `Данные счета получения: ${savedOrder.ownerData}\n`;
        messageText += `Дата создания заявки: ${formatDate(
          savedOrder.createdAt
        )}\n`;

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

        const orderMessage = `Ваша заявка #${hash} принята⏱. 

Сумма оплаты: ${ctx.session.howToSend} ${ctx.session.sendCurrency} на ${
          ctx.session.sendBank
        }
Реквизиты для оплаты: ${ctx.session.sendCard}
${
  ctx.session.sendCardOwner
    ? `Получатель: ${ctx.session.sendCardOwner}
❗️Комментарий не писать`
    : ""
}
${
  ctx.session.sendBank === "🟡Тинькофф" ||
  ctx.session.sendBank === "🔶Райффайзен"
    ? ""
    : "Ниже будут продублированы сумма к оплате и реквизиты для копирования"
}
❗️Важно: принимается оплата только внутри банка, карту которого Вы выбрали.
Пожалуйста, произведите оплату в течение 30 минут и отправьте скриншот в этот чат 👇. 
        `;

        await ctx.reply(
          orderMessage,
          Markup.keyboard([
            ["❌Закрыть заявку", "🆘 Поддержка"],
            [mainMenuBtn],
          ]).resize()
        );
        if (
          ctx.session.sendBank === "🟡Тинькофф" ||
          ctx.session.sendBank === "🔶Райффайзен"
        ) {
          await ctx.reply("Нажмите кнопку ниже для связи с администратором", {
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "Связаться с администратором",
                    url: "https://t.me/easypandamoney",
                  },
                ],
              ],
            },
          });
        } else {
          if (ctx.session.howToSend && ctx.session.sendCard) {
            await ctx.reply(`${ctx.session.howToSend}`);
            await ctx.reply(`${ctx.session.sendCard}`);
          }
        }
      } catch (error) {
        console.error(error);
        ctx.reply("Произошла ошибка.", mainMenu);
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

      await sendGroupedOrders(ctx.chat.id, orders, bot);
      // ctx.reply(messageText);
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

/1 🐼О компании EasyPandaMoney
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
 3. thefirstonthemars - WeChat ID

‼️Будьте внимательны и всегда проверяйте username ID и адресную строку сайта‼️`
    );
  });

  bot.hears("/2", (ctx) => {
    ctx.reply(
      `✅Какие гарантии?

✅Гарантией нашей качественной работы служит многолетняя репутация и тысячи довольных клиентов. Что бы убедится в подлинности нашего аккаунта и не попасть на мошенников, рекомендуем проверять всегда @username бота (@EasyPandaMoney_bot) и добавить наш рабочий аккаунт в WeChat, обязательно сверив WeChat ID: thefirstonthemars
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

      const user = await User.findOne({ userId: order.userId });
      user.paidOrders = user.paidOrders ? user.paidOrders + 1 : 1;
      await user.save();

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

  bot.command("contactUser", async (ctx) => {
    const args = ctx.message.text.split(" ").slice(1);
    if (args.length === 0) {
      return ctx.reply(
        "Пожалуйста, укажите ID пользователя, которому нужно отправить сообщение. Например: /contactUser 123456789"
      );
    }

    const userId = args[0]; // hash пользователя
    const message =
      "Похоже, что из-за настроек вашей приватности мы не можем напрямую связаться с вами. Пожалуйста, напишите нашему администратору, нажав на кнопку ниже, чтобы мы могли ответить на ваши вопросы или помочь с заявкой.";

    try {
      await bot.telegram.sendMessage(userId, message, {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "Написать администратору",
                url: "https://t.me/easypandamoney",
              },
            ],
          ],
        },
      });
      ctx.reply(`Сообщение успешно отправлено пользователю с ID ${userId}.`);
    } catch (error) {
      console.error("Ошибка при отправке сообщения: ", error);
      ctx.reply("Произошла ошибка при отправке сообщения пользователю.");
    }
  });

  bot.command("pending_orders", async (ctx) => {
    let chatId = "" + ctx.chat.id;

    // Проверяем, отправлена ли команда из группы администраторов
    if (chatId !== adminChatId) {
      return ctx.reply("Эта команда доступна только в группе администраторов.");
    }

    try {
      // Извлекаем заявки в статусе "ожидает подтверждения"
      const pendingOrders = await Order.find({ status: "waitingAccept" });

      if (pendingOrders.length === 0) {
        return ctx.reply("Нет заявок, ожидающих подтверждения.");
      }

      let messageText = "Заявки в ожидании подтверждения:\n\n";
      pendingOrders.forEach((order, index) => {
        messageText += `${index + 1}. Заявка #${order.hash}\n`;
        messageText += `От: [${order.userId}](tg://user?id=${order.userId})\n`; // Можно добавить имя пользователя, если есть в вашей модели
        messageText += `Сумма отправки: ${order.sendAmount} ${order.sendCurrency}\n`;
        messageText += `Сумма получения: ${order.receiveAmount} ${order.receiveCurrency}\n`;
        messageText += `Статус: Ожидает подтверждения\n\n`;
      });

      ctx.reply(messageText, { parse_mode: "Markdown" });
    } catch (error) {
      console.error(
        "Ошибка при получении заявок, ожидающих подтверждения:",
        error
      );
      ctx.reply(
        "Произошла ошибка при получении заявок, ожидающих подтверждения."
      );
    }
  });

  bot.command("approved_orders", async (ctx) => {
    let chatId = "" + ctx.chat.id;

    // Проверяем, отправлена ли команда из группы администраторов
    if (chatId !== adminChatId) {
      return ctx.reply("Эта команда доступна только в группе администраторов.");
    }

    try {
      // Извлекаем заявки в статусе "ожидает подтверждения"
      const pendingOrders = await Order.find({ status: "completed" });

      if (pendingOrders.length === 0) {
        return ctx.reply("Нет подтвержденных заявок.");
      }

      let messageText = "Подтвержденные заявки:\n\n";
      pendingOrders.forEach((order, index) => {
        messageText += `${index + 1}. Заявка #${order.hash}\n`;
        messageText += `От: [${order.userId}](tg://user?id=${order.userId})\n`;
        messageText += `Сумма отправки: ${order.sendAmount} ${order.sendCurrency} ${order.sendBank}\n`;
        messageText += `Сумма получения: ${order.receiveAmount} ${order.receiveCurrency} ${order.receiveBank}\n`;
        messageText += `Дата: ${formatDate(order.createdAt)}\n\n`;
      });

      ctx.reply(messageText, { parse_mode: "Markdown" });
    } catch (error) {
      console.error("Ошибка при получении подтвержденных заявок:", error);
      ctx.reply("Произошла ошибка при получении подтвержденных заявок.");
    }
  });

  bot.command("all_users", async (ctx) => {
    let chatId = "" + ctx.chat.id;

    // Проверяем, отправлена ли команда из группы администраторов
    if (chatId !== adminChatId) {
      return ctx.reply("Эта команда доступна только в группе администраторов.");
    }

    try {
      // Извлекаем заявки в статусе "ожидает подтверждения"
      const users = await User.find({});

      if (users.length === 0) {
        return ctx.reply("Нет пользователей.");
      }

      let messageText = "Пользователи:\n\n";
      users.forEach((user, index) => {
        messageText += `${index + 1}. ID: [${user.userId}](tg://user?id=${
          user.userId
        })\n`;
        messageText += `isBlocked: ${user.isBlocked}\n`;
        messageText += `paidOrders: ${user.paidOrders}\n\n`;
        // messageText += `unpaidOrders: ${user.unpaidOrders}\n\n`;
      });

      ctx.reply(messageText, { parse_mode: "Markdown" });
    } catch (error) {
      console.error("Ошибка при получении пользователей:", error);
      ctx.reply("Произошла ошибка при получении пользователей.");
    }
  });

  bot.command("close_order", async (ctx) => {
    let chatId = "" + ctx.chat.id;

    // Проверяем, отправлена ли команда из группы администраторов
    if (chatId !== adminChatId) {
      return ctx.reply("Эта команда доступна только в группе администраторов.");
    }

    // Извлекаем аргументы команды (хеш заявки)
    const args = ctx.message.text.split(" ").slice(1);
    if (args.length === 0) {
      return ctx.reply(
        "Пожалуйста, укажите хеш заявки. Например: /close_order ABC123"
      );
    }

    const hash = args[0];
    try {
      // Поиск заявки по хешу
      const order = await Order.findOne({ hash: hash });
      if (!order) {
        return ctx.reply(`Заявка с хешем #${hash} не найдена.`);
      }

      // Изменение статуса заявки на "закрыто"
      order.status = "cancelled";
      await order.save();

      // Отправка подтверждения об успешном закрытии заявки
      ctx.reply(`Заявка с хешем #${hash} успешно закрыта.`);

      // Опционально: отправка уведомления пользователю о закрытии заявки
      bot.telegram.sendMessage(
        order.userId,
        `Ваша заявка #${hash} была закрыта администратором.`
      );
    } catch (error) {
      console.error("Ошибка при закрытии заявки:", error);
      ctx.reply("Произошла ошибка при попытке закрыть заявку.");
    }
  });

  bot.command("block_user", async (ctx) => {
    let chatId = "" + ctx.chat.id;

    // Проверяем, отправлена ли команда из группы администраторов
    if (chatId !== adminChatId) {
      return ctx.reply("Эта команда доступна только в группе администраторов.");
    }

    // Извлекаем аргументы команды (id)
    const args = ctx.message.text.split(" ").slice(1);
    if (args.length === 0) {
      return ctx.reply(
        "Пожалуйста, укажите ID пользователя. Например: /block_user 1234"
      );
    }

    const id = args[0];
    try {
      // Поиск заявки по хешу
      const user = await User.findOne({ userId: id });
      if (!user) {
        return ctx.reply(`Пользователь с ID ${id} не найден.`);
      }

      user.isBlocked = true;
      await user.save();

      ctx.reply(`Пользователь с ID ${id} заблокирован.`);

      bot.telegram.sendMessage(
        user.userId,
        `Вы были заблокированы администратором.`
      );
    } catch (error) {
      console.error("Ошибка при блокировке:", error);
      ctx.reply("Произошла ошибка при попытке заблокировать пользователя.");
    }
  });

  bot.command("unblock_user", async (ctx) => {
    let chatId = "" + ctx.chat.id;

    // Проверяем, отправлена ли команда из группы администраторов
    if (chatId !== adminChatId) {
      return ctx.reply("Эта команда доступна только в группе администраторов.");
    }

    // Извлекаем аргументы команды (id)
    const args = ctx.message.text.split(" ").slice(1);
    if (args.length === 0) {
      return ctx.reply(
        "Пожалуйста, укажите ID пользователя. Например: /unblock_user 1234"
      );
    }

    const id = args[0];
    try {
      const user = await User.findOne({ userId: id });
      if (!user) {
        return ctx.reply(`Пользователь с ID ${id} не найден.`);
      }

      user.isBlocked = false;
      user.unpaidOrders = [];
      await user.save();

      ctx.reply(`Пользователь с ID ${id} разблокирован.`);

      bot.telegram.sendMessage(
        user.userId,
        `Вы были разблокированы администратором.`
      );
    } catch (error) {
      console.error("Ошибка при разблокировке:", error);
      ctx.reply("Произошла ошибка при попытке разблокировать пользователя.");
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
          limitFromRecieve = 400;
          limitToRecieve = 25000;
        }
        if (ctx.session.currencyName === "🇷🇺 RUB") {
          limitFromRecieve = 5000;
          limitToRecieve = 300000;
        }
        if (ctx.session.currencyName === "🇺🇦 UAH") {
          limitFromRecieve = 2000;
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
        const howToRecieve = await getExchangeFormula(ctx, rate);
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
        const howToSend = await getExchangeFormula(ctx, rate);
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
            ["✅ Всё верно, создать заявку!"],

            [mainMenuBtn, "🆘 Поддержка"],
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

  const howMuchPaidFromUser = async (ctx) => {
    const user = await User.findOne({ userId: ctx.from.id });
    const paidOrders = user && user.paidOrders ? user.paidOrders : 0;
    const isMorePaid = paidOrders >= 3;
    
    return isMorePaid;
  };

  const howMuchComission = async (ctx, rate) => {
    let comission = 0;

    const isMorePaid = await howMuchPaidFromUser(ctx);

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
      if (5000 <= amount && amount < 50000) {
        comission = isMorePaid ? 0.06 : 0.06;
      } else if (50000 <= amount && amount <= 300000) {
        comission = isMorePaid ? 0.06 : 0.06;
      }
    }
    if (ctx.session.sendCurrency === "🇨🇳 CNY") {
      if (0 < amount && amount < 3500) {
        comission = isMorePaid ? 0.05 : 0.035;
      } else if (3500 <= amount && amount < 10000) {
        comission = isMorePaid ? 0.05 : 0.035;
      } else if (10000 <= amount && amount <= 25000) {
        comission = isMorePaid ? 0.05 : 0.035;
      }
    }
    if (ctx.session.sendCurrency === "🇺🇦 UAH") {
      if (2000 <= amount && amount < 20000) {
        comission = isMorePaid ? 0.1 : 0.1;
      } else if (20000 <= amount && amount <= 50000) {
        comission = isMorePaid ? 0.09 : 0.09;
      }
    }

    return comission;
  };

  async function getExchangeFormula(ctx, rate) {
    let receiveSum = 0;
    const comission = await howMuchComission(ctx, rate);

    if (ctx.session.state === "enteringAmount") {
      const initialReceiveSum = rate * ctx.message.text;
        receiveSum = Math.floor(
          initialReceiveSum - (initialReceiveSum * comission)
        );
        return receiveSum;
    } else if (ctx.session.state === "enteringReceiveAmount") {
      const comissionRate = await howMuchComission(ctx, rate);
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

    if (ctx.message.text === "✅Сбер") {
      sendCard = 2202206296854099;
      sendCardOwner = "Александр В.";
    } else if (
      ctx.message.text === "🟡Тинькофф" ||
      ctx.message.text === "🔶Райффайзен"
    ) {
      sendCard =
        "Для получения реквизитов отправьте #номерзаявки в чат с Администратором";
      sendCardOwner = "";
    } else if (ctx.message.text === "🔹AliPay") {
      sendCard = 13136022300;
      sendCardOwner = "C YURII";
    } else if (ctx.message.text === "💬WeChat") {
      sendCard = "QR";
      sendCardOwner = "CHERNIAIEV YURII";
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

const formatDate = (date) => {
  return date.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

async function sendGroupedOrders(chatId, orders, bot) {
  const MAX_MESSAGE_LENGTH = 4096; // Максимальная длина сообщения
  let currentMessage = "История ваших заявок:\n";
  let messageLength = currentMessage.length;

  for (let order of orders) {
    const statusIcon =
      order.status === "pending" || order.status === "waitingAccept"
        ? "🔄"
        : order.status === "completed"
        ? "✅"
        : "❌";
    const formattedDate = formatDate(new Date(order.createdAt));
    const orderMessage = `${statusIcon} ${formattedDate} #${
      order.hash
    }\n${order.sendAmount.toFixed(2)}${
      order.sendCurrency
    }➡️${order.receiveAmount.toFixed(2)}${order.receiveCurrency}\n\n`;

    // Проверяем, будет ли добавление текущего заказа превышать лимит
    if (messageLength + orderMessage.length > MAX_MESSAGE_LENGTH) {
      // Если да, отправляем текущее накопленное сообщение и начинаем новое
      await bot.telegram.sendMessage(chatId, currentMessage);
      currentMessage = orderMessage;
      messageLength = orderMessage.length;
    } else {
      // Если нет, просто добавляем информацию о заказе к текущему сообщению
      currentMessage += orderMessage;
      messageLength += orderMessage.length;
    }
  }

  // После цикла проверяем, осталось ли непосланное сообщение
  if (currentMessage.length > 0) {
    await bot.telegram.sendMessage(chatId, currentMessage);
  }
}
