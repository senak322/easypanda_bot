  import { Markup } from "telegraf";
  import { config } from "../../config.js";

  const { banksRub, banksCny, banksUah, backBtn, mainMenuBtn } = config;

  export const banksMenu = (ctx) => {
    let keyboardLayout = [];
    
    // Добавляем остальные банки в зависимости от валюты отправки
    if (ctx.session.sendCurrency === "🇷🇺 RUB") {
      keyboardLayout.push(["✅Сбер"]);
      keyboardLayout.push(banksRub);
    } else if (ctx.session.sendCurrency === "🇨🇳 CNY") {
      keyboardLayout.push(banksCny);
    } else if (ctx.session.sendCurrency === "🇺🇦 UAH") {
      keyboardLayout.push(banksUah);
    }

    // Добавляем кнопки управления в конец клавиатуры
    keyboardLayout.push([mainMenuBtn, backBtn]);

    return Markup.keyboard(keyboardLayout).resize();
  };
