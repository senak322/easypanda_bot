import { mainMenu } from "../keyboards/mainMenu.js";
import { config } from "../../config.js";

export const backToMainMenu = (ctx, next) => {
  if (ctx.message && ctx.message.text === "📲 Главное меню") {
    ctx.session = null;
    ctx.reply(config.mainMessage, mainMenu);
  } else {
    return next();
  }
};
