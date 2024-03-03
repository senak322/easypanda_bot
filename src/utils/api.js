import axios from "axios";
import dotenv from "dotenv";
import { config } from "../../config.js";

const { currencyUrl } = config;
dotenv.config();
const apiToken = process.env.API_KEY;

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
  let sendCurrencyCode = ctx.session.sendCurrency.slice(-3).toUpperCase(); // Получение кода валюты отправки
  let receiveCurrencyCode = ctx.session.receiveCurrency.slice(-3).toUpperCase(); // Получение кода валюты получения

  try {
    const response = await axios.get(currencyUrl, {
      params: {
        apikey: apiToken,
        currencies: receiveCurrencyCode,
        base_currency: sendCurrencyCode,
      },
    });
    const rate = response.data.data[receiveCurrencyCode].value;
    return rate;
  } catch (error) {
    console.error("Error fetching exchange rate:", error);
  }
}
