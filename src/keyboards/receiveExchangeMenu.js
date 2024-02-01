import { Markup } from "telegraf";
import { config } from "../../config.js";

const { backBtn, mainMenuBtn } = config;

export const receiveExchangeMenu = (currencies) => {
  const keyboard = currencies.map((currency) => [currency]);
  keyboard.push([mainMenuBtn, backBtn]);

  return Markup.keyboard(keyboard).resize();
};
