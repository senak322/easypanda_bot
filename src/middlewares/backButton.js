import { giveExchangeMenu } from "../keyboards/giveExchangeMenu.js";
import { mainMenu } from "../keyboards/mainMenu.js";
import { config } from "../../config.js";

export const backButton = (ctx, next) => {
  if (ctx.updateType === "message" && ctx.message.text === "🔙Назад") {
    if (ctx.session.state === "selectingReceiveCurrency") {
      // Возвращаемся к выбору валюты отправки
      ctx.session.state = "selectingSendCurrency";
      ctx.session.sendCurrency = null; // обнуляем предыдущий выбор
      ctx.reply("Выберите валюту отправки  👇", giveExchangeMenu);
    } else if (
      ctx.session.state === "enteringAmount" ||
      ctx.session.state === "enteringReceiveAmount"
    ) {
      // Возвращаемся к выбору валюты отправки
      ctx.session.state = "selectingReceiveCurrency";
      ctx.session.receiveCurrency = null; // обнуляем предыдущий выбор
      ctx.session.limitFrom = null;
      ctx.session.limitTo = null;
      ctx.reply(
        `Вы отдаёте ${ctx.session.sendCurrency}
Выберите валюту Получения 👇`,
        ctx.session.menuReceiveCurrency
      );
    }

    // Добавьте другие case для разных состояний
    else {
      // Если состояние неизвестно, возвращаемся в главное меню
      ctx.session = null; // сброс сессии
      ctx.reply(config.mainMessage, mainMenu);
    }
  } else {
    next();
  }
};
