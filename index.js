//техническая фигня
const { Bot, InlineKeyboard, session } = require('grammy');
require('dotenv').config();
const bot = new Bot(process.env.BOT_TOKEN);
bot.use(session({ initial: () => ({}) })); //создание сессии для каждого пользователя


//кнопки
const userAdminButtons = new InlineKeyboard().text("Пользователь", "user_button").text("Админ", "admin_button"); 
const yesNoButtons = new InlineKeyboard().text("да", "yes_button").text("нет", "no_button"); //отправить ли цитату на модерацию пользователю
const sendAgainButton = new InlineKeyboard().text("Отправить ещё", "send_again_button"); 


const sendQuoteAdmin = new InlineKeyboard().text("Создать пост", "send_quote_admin"); //отправить ли цитату АДМИНУ
const yesNoAdmin = new InlineKeyboard().text("да", "yes_button_admin").text("нет", "no_button_admin"); 

//старт
bot.command('start', async (ctx) => 
{
    ctx.session = {}; //сброс
    await ctx.reply("Доброго времени суток! Я бот для отправки цитат. Кем ты являешься?", {reply_markup: userAdminButtons});
});

//команды
bot.command("info", async (ctx) =>
{
    await ctx.reply("Я бот-помощник для публикации цитат. Написан я админом с помощью Node.js и библиотеки grammY");
});
bot.command("help", async (ctx) =>
{
    await ctx.reply("/start - запустить бота;\n/help - помощь по командам;\n/info - информация о боте\n/delete_channel - удалить ТГК");
});
bot.command("delete_channel", async (ctx) =>
{
    await ctx.reply("Попытка удаления канала зафиксирована. Сотрудники ФСБ уже выехали по вашему IP-адресу.");
});




//кнопки пользователя
bot.callbackQuery("user_button", async (ctx) =>
{
    await ctx.answerCallbackQuery();

    ctx.session.isWaitingForQuote = true;
    await ctx.reply("Отправь мне цитату");
});

//кнопка да, готов отправить на модерацию
bot.callbackQuery("yes_button", async (ctx) =>
{
    await ctx.answerCallbackQuery();

    await ctx.api.sendMessage(Number(process.env.MY_ID), `Пришла новая цитата:\n\n\"<code>${escapeHtml(ctx.session.quote)}</code>\"\n\nАвтор: <code>${escapeHtml(ctx.session.author)}</code>`,
{ parse_mode: "HTML", link_preview_options: { is_disabled: true } });
    await ctx.reply("Сообщение отправлено на модерацию!", {reply_markup: sendAgainButton});
});
//нет
bot.callbackQuery("no_button", async (ctx) =>
{
    await ctx.answerCallbackQuery();

    await ctx.reply("Отправь мне цитату заново");
    ctx.session.isWaitingForQuote = true;
});
//отправить еще
bot.callbackQuery("send_again_button", async (ctx) =>
{
    await ctx.answerCallbackQuery();

    await ctx.reply("Отправь мне цитату");
    ctx.session.isWaitingForQuote = true;
});



//кнопки админа
bot.callbackQuery("admin_button", async (ctx) =>
{
    await ctx.answerCallbackQuery();

    if (ctx.from.id === Number(process.env.MY_ID))
    {
        ctx.session.isAdmin = true;
        await ctx.reply("Приветствую вас! О повелитель!", {reply_markup: sendQuoteAdmin});
        ctx.session.isWaitingForQuote = false;
        ctx.session.isWaitingForAuthor = false;
    }
    else
    {
        await ctx.reply("Ай-ай-ай-ай. В школе должны были научить тому, что врать нехорошо. Подумай еще раз над вариантом ответа.", {reply_markup: userAdminButtons});
    }
});
bot.callbackQuery("send_quote_admin", async (ctx) =>
{
    await ctx.answerCallbackQuery();

    await ctx.reply("Введи цитату без кавычек");
    ctx.session.isQuoteAdmin = true;
})
bot.callbackQuery("yes_button_admin", async (ctx) =>
{
    await ctx.answerCallbackQuery();

    await ctx.api.sendMessage(Number(process.env.CHANNEL_ID), ctx.session.adminMessage, { parse_mode: "HTML", link_preview_options: { is_disabled: true } });
    await ctx.reply("Цитата опубликована!", {reply_markup: sendQuoteAdmin} );
});
bot.callbackQuery("no_button_admin", async (ctx) =>
{
    await ctx.answerCallbackQuery();

    await ctx.reply("Ок, давай заново. Напиши цитату без кавычек");
    ctx.session.isQuoteAdmin = true;
});


//обработчик всего текста
bot.on("message:text", async (ctx) => 
{
    const text = escapeHtml(ctx.message.text);
    
    //пасхалочка
    if (["Пошел нахуй", "пошел нахуй", "пошёл нахуй", "Пошёл нахуй"].includes(text))
    {
        await ctx.reply("Сам пошёл нахуй, уёбище!");
        return;
    }

    //обработка запросов пользователя
    if (ctx.session.isWaitingForQuote) //цитата
    {
        await ctx.reply("Отлично! Теперь напиши автора цитаты (фамилию и инициалы)");
        ctx.session.isWaitingForQuote = false;
        ctx.session.isWaitingForAuthor = true;
        ctx.session.quote = text;
        return;
    }
    if (ctx.session.isWaitingForAuthor) //автор
    {
        await ctx.reply("Прекрасно! Вы готовы отправить цитату на модерацию?", {reply_markup: yesNoButtons});
        ctx.session.isWaitingForAuthor = false;
        ctx.session.author = text;
        return;
    }


    if (ctx.session.isAdmin)
    {
        if (ctx.session.isQuoteAdmin)
        {
            await ctx.reply("Введи хэштег преподавателя (например #Иванов_И_И)");
            ctx.session.isQuoteAdmin = false;
            ctx.session.isAuthorAdmin = true;
            ctx.session.quoteAdmin = text;
            return;
        }
        if (ctx.session.isAuthorAdmin)
        {
            ctx.session.authorAdmin = text;
            ctx.session.isAuthorAdmin = false;
            ctx.session.adminMessage = 
            `<code>\"${ctx.session.quoteAdmin}\"</code>

${ctx.session.authorAdmin}


<a href="https://t.me/boost/radik_rgrtu">Проголосовать за канал</a>
<a href="https://t.me/radik_citaty_bot">Предложить цитату</a>`;

            await ctx.reply(ctx.session.adminMessage, { parse_mode: "HTML", link_preview_options: { is_disabled: true } });
            await ctx.reply("Так будет выглядить пост. Опубликовать?", {reply_markup: yesNoAdmin});
            return;
        }
    }
});

//технические функции
//функция против xss атак
function escapeHtml(text) 
{
  return text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

bot.start();
