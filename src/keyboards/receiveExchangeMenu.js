import { Markup } from "telegraf";

export const receiveExchangeMenu = (currencies) => {
  const keyboard = currencies.map((currency) => [currency]);
  // console.log(keyboard);
  keyboard.push(["📲 Главное меню", "🔙Назад"]);

  return Markup.keyboard(keyboard).resize();
};
