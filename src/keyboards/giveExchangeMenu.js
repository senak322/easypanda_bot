import { Markup } from "telegraf";

export const giveExchangeMenu = Markup.keyboard([
  ["🇷🇺 RUB"],
  ["🇨🇳 CNY"],
  ["🇺🇦 UAH"],
  ["🔙 Главное меню"],
]).resize();
