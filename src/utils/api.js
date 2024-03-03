import axios from "axios";
import { config } from "../../config.js";
const { baseCurrencyUrl } = config;

// const currencyToExchange = (ctx) => {
//   let currency;

//   if (ctx.session.sendCurrency === "🇷🇺 RUB") {
//     currency = currencyRubUrl;
//   } else if (ctx.session.sendCurrency === "🇺🇦 UAH") {
//     currency = currencyUahUrl;
//   } else if (ctx.session.sendCurrency === "🇨🇳 CNY") {
//     currency = currencyCnyUrl;
//   }
//   return currency;
// };

export async function getExchangeRate(ctx) {
  let sendCurrencyCode = ctx.session.sendCurrency.slice(-3).toLowerCase(); // Получение кода валюты отправки
  let receiveCurrencyCode = ctx.session.receiveCurrency.slice(-3).toLowerCase(); // Получение кода валюты получения

  try {
    const response = await axios.get(`${baseCurrencyUrl + sendCurrencyCode}.json`);
    const rate = response.data[sendCurrencyCode][receiveCurrencyCode];
    console.log(rate);
    return rate;
  } catch (error) {
    console.error("Error fetching exchange rate:", error);
  }
}
