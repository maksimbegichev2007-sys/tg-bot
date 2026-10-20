//техническая фигня
const { Bot, InlineKeyboard } = require('grammy');
require('dotenv').config();
const bot = new Bot(process.env.BOT_TOKEN);

//кнопки
const userAdminButtons = new InlineKeyboard().text("Пользователь", "user_button").text("Админ", "admin_button"); 
const yesNoButtons = new InlineKeyboard().text("да", "yes_button").text("нет", "no_button"); 
const sendAgainButton = new InlineKeyboard().text("Отправить ещё", "send_again_button"); 

const sendQuote = new InlineKeyboard().text("Отправить цитату", "send_quote"); 
const yesNoAdmin = new InlineKeyboard().text("да", "yes_button_admin").text("нет", "no_button_admin"); 

//осн. переменные
let text = ""; //текст
let quote = ""; //цитата
let author = ""; //автор
let isWaitingForQuote = false; //ждем ли цитату
let isWaitingForAuthor = false; //ждём ли автора

let isAdmin = false; //если админчик
let isQuoteAdmin = false;
let isAuthorAdmin = false;
let authorAdmin = "";
let quoteAdmin = "";
let adminMessage = "";
//старт
bot.command('start', async (ctx) => 
{
    await ctx.reply("Доброго времени суток! Кем ты являешься?", {reply_markup: userAdminButtons});
    //сброс
    isWaitingForQuote = false;
    isWaitingForAuthor = false;
    isAdmin = false;
    isQuoteAdmin = false;
    isAuthorAdmin = false;
    quote = "";
    author = "";
    quoteAdmin = "";
    authorAdmin = "";
    adminMessage = "";
});

//кнопки пользователя
bot.callbackQuery("user_button", async (ctx) =>
{
    await ctx.answerCallbackQuery();

    isWaitingForQuote = true;
    await ctx.reply("Отправь мне цитату");
});

//кнопка да, готов отправить на модерацию
bot.callbackQuery("yes_button", async (ctx) =>
{
    await ctx.answerCallbackQuery();

    await ctx.api.sendMessage(Number(process.env.MY_ID), `Пришла новая цитата:\n\n\"<code>${escapeHtml(quote)}</code>\"\n\nАвтор: <code>${escapeHtml(author)}</code>`,
{ parse_mode: "HTML" });
    await ctx.reply("Сообщение отправлено на модерацию!", {reply_markup: sendAgainButton});
});
//нет
bot.callbackQuery("no_button", async (ctx) =>
{
    await ctx.answerCallbackQuery();

    await ctx.reply("Отправь мне цитату заново");
    isWaitingForQuote = true;
});
//отправить еще
bot.callbackQuery("send_again_button", async (ctx) =>
{
    await ctx.answerCallbackQuery();

    await ctx.reply("Отправь мне цитату");
    isWaitingForQuote = true;
});



//кнопки админа
bot.callbackQuery("admin_button", async (ctx) =>
{
    await ctx.answerCallbackQuery();

    if (ctx.from.id === Number(process.env.MY_ID))
    {
        isAdmin = true;
        await ctx.reply("Приветствую вас! О повелитель!", {reply_markup: sendQuote});
    }
    else
    {
        await ctx.reply("Ай-ай-ай-ай. В школе должны были научить тому, что врать нехорошо. Подумай еще раз над вариантом ответа.", {reply_markup: userAdminButtons});
    }
});
bot.callbackQuery("send_quote", async (ctx) =>
{
    await ctx.answerCallbackQuery();

    await ctx.reply("Введи цитату без кавычек");
    isQuoteAdmin = true;
})
bot.callbackQuery("yes_button_admin", async (ctx) =>
{
    await ctx.answerCallbackQuery();

    await ctx.api.sendMessage(Number(process.env.CHANNEL_ID), adminMessage, { parse_mode: "HTML" });
    await ctx.reply("Цитата опубликована!", {reply_markup: sendQuote} );
});
bot.callbackQuery("no_button_admin", async (ctx) =>
{
    await ctx.answerCallbackQuery();

    await ctx.reply("Ок, давай заново. Напиши цитату без кавычек");
    isQuoteAdmin = true;
});


//обработчик всего текста
bot.on("message:text", async (ctx) => 
{
    text = ctx.message.text;
    
    //пасхалочка
    if (["Пошел нахуй", "пошел нахуй", "пошёл нахуй", "Пошёл нахуй"].includes(text))
    {
        await ctx.reply("Сам пошёл нахуй, уёбище!");
        return;
    }

    //обработка запросов пользователя
    if (isWaitingForQuote) //цитата
    {
        await ctx.reply("Отлично! Теперь напиши автора цитаты (фамилию и инициалы)");
        isWaitingForQuote = false;
        isWaitingForAuthor = true;
        quote = text;
        return;
    }
    if (isWaitingForAuthor) //автор
    {
        await ctx.reply("Прекрасно! Вы готовы отправить цитату на модерацию?", {reply_markup: yesNoButtons});
        isWaitingForAuthor = false;
        author = text;
        return;
    }


    if (isAdmin)
    {
        if (isQuoteAdmin)
        {
            await ctx.reply("Введи хэштег преподавателя (например #Иванов_И_И)");
            isQuoteAdmin = false;
            isAuthorAdmin = true;
            quoteAdmin = text;
            return;
        }
        if (isAuthorAdmin)
        {
            authorAdmin = text;
            isAuthorAdmin = false;
            adminMessage = 
            `<code>\"${quoteAdmin}\"</code>

${authorAdmin}


<a href="https://t.me/boost/radik_rgrtu">Проголосовать за канал</a>
<a href="https://t.me/radik_citaty_bot">Предложить цитату</a>`;

            await ctx.reply(adminMessage, { parse_mode: "HTML" });
            await ctx.reply("Так будет выглядить пост. Опубликовать?", {reply_markup: yesNoAdmin});
            return;
        }
    }
});

//команды
bot.command("info", async (ctx) =>
{
    await ctx.reply("Я бот-помощник для публикации цитат. Написан я админом за 4 часа с помощью Node.js и библиотеки grammY");
});
bot.command("help", async (ctx) =>
{
    await ctx.reply("/start - запустить бота;\n/help - помощь по командам;\n/info - информация о боте\n/delete_channel - удалить ТГК");
});
bot.command("delete_channel", async (ctx) =>
{
    await ctx.reply("Попытка удаления канала зафиксирована. Сотрудники ФСБ уже выехали по вашему IP-адресу.");
});

//технические функции
//функция против xss атак
function escapeHtml(text) 
{
  return text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

bot.start();