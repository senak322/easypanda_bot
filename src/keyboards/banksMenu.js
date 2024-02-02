import { Markup } from "telegraf";
import { config } from "../../config.js";

const { banksRub, banksCny, banksUah, backBtn, mainMenuBtn } = config;

export const banksMenu = (ctx) => {
  let correctBanks = [];
  if (ctx.session.sendCurrency === "🇷🇺 RUB") {
    correctBanks = [...banksRub];
  } else if (ctx.session.sendCurrency === "🇨🇳 CNY") {
    correctBanks = [...banksCny];
  } else if (ctx.session.sendCurrency === "🇺🇦 UAH") {
    correctBanks = [...banksUah];
  }
  console.log(correctBanks);
//   correctBanks.push();

  return Markup.keyboard([correctBanks, [mainMenuBtn, backBtn]]).resize();
};
