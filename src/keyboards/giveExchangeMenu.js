import { Markup } from "telegraf";
import { config } from "../../config.js";
const { mainMenuBtn } = config;

export const giveExchangeMenu = Markup.keyboard([
  ["🇷🇺 RUB"],
  ["🇨🇳 CNY"],
  ["🇺🇦 UAH"],
  [mainMenuBtn],
]).resize();
