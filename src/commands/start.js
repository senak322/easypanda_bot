import { Markup } from "telegraf";
import { mainMenu } from "../keyboards/mainMenu.js";
import { config } from "../../config.js";

export const startCommand = (bot) => {
  bot.start(async (ctx) => {
    const userId = ctx.from.id;
    let user = await User.findOne({ userId: userId });

    if (!user) {
      user = new User({
        userId: userId,
        // другие начальные настройки пользователя
      });
      await user.save();
    }
    ctx.reply(config.mainMessage, mainMenu);
  });
};
