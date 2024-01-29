import { Telegraf, Markup } from "telegraf";
import { config } from "./config.js";
import { startCommand } from "./src/commands/start.js";
import { exchangeCommand } from "./src/commands/exchange.js";
import { backToMainMenu } from "./src/middlewares/backToMainMenu.js";

const bot = new Telegraf(config.tgToken, {});

startCommand(bot);
exchangeCommand(bot);
bot.use(backToMainMenu);

bot.launch();
