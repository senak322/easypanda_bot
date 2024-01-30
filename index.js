import { Telegraf } from "telegraf";
import { config } from "./config.js";
import { startCommand } from "./src/commands/start.js";
import { exchangeCommand } from "./src/commands/exchange.js";
import { backButton } from "./src/middlewares/backButton.js";
import { backToMainMenu } from "./src/middlewares/backToMainMenu.js";
import LocalSession from 'telegraf-session-local';

const bot = new Telegraf(config.tgToken, {});
const localSession = new LocalSession({ database: '.session_db.json' });

bot.use(localSession.middleware());

bot.use(backButton)
bot.use(backToMainMenu);

startCommand(bot);
exchangeCommand(bot);


bot.launch();
