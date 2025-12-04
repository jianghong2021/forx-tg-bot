import { Bot } from "grammy";
import { initApp } from "./utils/config";
import { Commands } from "./commands";

initApp().then(() => {
    const token = process.env.BOT_TOKEN;
    if (!token) {
        throw Error('必须在.env 中配置token')
    }
    const bot = new Bot(token);
    bot.catch((err) => {
        console.error("Bot error:", err);
    });
    new Commands(bot);

    console.log('bot is running')
    bot.start({
        drop_pending_updates: true
    });
}).catch(err => {
    console.error(err)
})
