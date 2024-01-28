import { Telegraf } from "telegraf";
import { config } from "./config.js";

const bot = new Telegraf(config.tgToken, {})

bot.start((ctx) => ctx.reply('Уважаемый пользователь, сервис EasyPandaMoney приветствует Вас. Для начала обмена нажмите "Новый обмен"'))

bot.launch()