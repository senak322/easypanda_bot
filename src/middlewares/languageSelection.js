export const languageSelection = (ctx, next) => {
    // здесь логика для обработки выбора языка
    if (ctx.message.text.includes('Выбрать язык')) {
      ctx.reply('Выберите язык из списка');
      // Обработка выбора языка
    } else {
      // Если это не выбор языка, продолжаем обработку других команд
      return next();
    }
  };
  
  // Использование этого middleware в bot.js
  bot.use(languageSelection);