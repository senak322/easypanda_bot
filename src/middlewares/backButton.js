import { giveExchangeMenu } from "../keyboards/giveExchangeMenu.js";
import { mainMenu } from "../keyboards/mainMenu.js";
import { config } from "../../config.js";

export const backButton = (ctx, next) => {
  if (ctx.updateType === 'message' && ctx.update.message.text === '🔙Назад') {
    switch (ctx.session.state) {
      case "selectingReceiveCurrency":
        // Возвращаемся к выбору валюты отправки
        ctx.session.state = "selectingSendCurrency";
        ctx.session.sendCurrency = null; // обнуляем предыдущий выбор
        ctx.reply("Выберите валюту отправки", giveExchangeMenu);
        break;
      // Добавьте другие case для разных состояний
      default:
        // Если состояние неизвестно, возвращаемся в главное меню
        ctx.session = null; // сброс сессии
        ctx.reply(config.mainMessage, mainMenu);
        break;
    }
  } else {
    next();
  }
};
