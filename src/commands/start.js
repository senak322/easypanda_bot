import { Markup } from "telegraf";
import { mainMenu } from "../keyboards/mainMenu.js";
import { config } from "../../config.js";

export const startCommand = (bot) => {
    // ctx.session.state = "main";
  bot.start((ctx) => {
    ctx.reply(
        config.mainMessage,
      mainMenu
    );
  });
};
