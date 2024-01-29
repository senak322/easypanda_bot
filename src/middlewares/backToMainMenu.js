import { mainMenu } from "../keyboards/mainMenu.js";

export const backToMainMenu = (ctx, next) => {
    if (ctx.message.text === '🔙 Главное меню') {
        mainMenu
    } else {
      return next();
    }
  };