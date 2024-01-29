import { mainMenu } from "../keyboards/mainMenu.js";

export const backToMainMenu = (ctx, next) => {
  if (ctx.message && ctx.message.text === "🔙 Главное меню") {
    ctx.reply("Выберите одну из опций", mainMenu);
  } else {
    return next();
  }
};
