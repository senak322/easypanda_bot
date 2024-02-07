import { Telegraf } from "telegraf";
import mongoose from "mongoose";
import dotenv from "dotenv";
import {startCronJobs} from './src/controllers/scheduler.js';
import { startCommand } from "./src/commands/start.js";
import { exchangeCommand } from "./src/commands/exchange.js";
import { backButton } from "./src/middlewares/backButton.js";
import { backToMainMenu } from "./src/middlewares/backToMainMenu.js";
import LocalSession from "telegraf-session-local";


dotenv.config();
const botToken = process.env.TG_TOKEN;
const mongodbUri = process.env.MONGODB_URI;

const bot = new Telegraf(botToken, {});
const localSession = new LocalSession({ database: ".session_db.json" });

mongoose
  .connect(mongodbUri)
  .then(() => console.log("MongoDB подключен"))
  .catch((e) => console.error("Ошибка подключения к MongoDB", e));

bot.use(localSession.middleware());

bot.use(backButton);
bot.use(backToMainMenu);

startCommand(bot);
exchangeCommand(bot);
startCronJobs(bot);
bot.launch();

