import { Bot, CommandContext, Context } from "grammy";
import { translate } from "./utils/i18n";
import { getLocal, dbClient } from "./utils/cache";
import { login, resetAccount, setLanguage, getWalletKey } from "./utils/api";

export class Commands {
    private bot: Bot;
    private keyboards = [
        [
            {
                text: translate('zn', 'reset_account'),
                type: 'reset_account'
            },
            {
                text: translate('zn', 'export_key'),
                type: 'export_key'
            },
            {
                text: translate('zn', 'set_language'),
                type: 'set_language'
            }
        ]
    ]
    constructor(bot: Bot) {
        this.bot = bot;

        this.bot.command('start', this.startCmd.bind(this));

        this.bot.on('msg:text', ctx => {
            const keyboardRes = this.isKeyBorads(ctx.message?.text);
            if (ctx.from && keyboardRes.ok) {
                login(ctx.from).then(() => {
                    this.keyBoardsHandler(keyboardRes.type, ctx.chatId, ctx.from!);
                }).catch(err => {
                    console.error(err)
                })
            }

        })

        this.bot.callbackQuery(/cmd_[\d\w]+/i, ctx => {
            login(ctx.from).then(() => {
                ctx.deleteMessage();
                this.queryCallbackHandler(ctx.callbackQuery.data, ctx.chatId || 0, ctx.callbackQuery.id, ctx.from);
            }).catch(err => {
                console.error(err)
            })

        })

    }

    private resetKeyBoards(lang: string) {
        this.keyboards = [
            [
                {
                    text: translate(lang, 'reset_account'),
                    type: 'reset_account'
                },
                {
                    text: translate(lang, 'export_key'),
                    type: 'export_key'
                },
                {
                    text: translate(lang, 'set_language'),
                    type: 'set_language'
                }
            ]
        ]
    }

    private isKeyBorads(text?: string) {
        const res = {
            ok: false,
            type: ''
        }
        if (!text) {
            return res
        }
        const index = this.keyboards.findIndex(x => {
            const subIndex = x.findIndex(y => y.text == text);
            if (subIndex > -1) {
                res.type = x[subIndex].type
            }
            return subIndex > -1
        });
        res.ok = index > -1;
        return res
    }

    private async keyBoardsHandler(keyType: string, chatId: number, user: TelegramUser) {
        switch (keyType) {
            case 'export_key':
                this.exportKey(chatId, user);
                break
            case 'set_language':
                this.showLanguages(chatId, user);
                break
            case 'reset_account':
                this.showResetAccount(chatId, user);
        }
    }

    private async queryCallbackHandler(data: string, chatId: number, qid: string, user: TelegramUser) {
        const [cmd, text] = data.replace('cmd_', '').split('_');
        switch (cmd) {
            case 'language':
                this.setLanguage(text, chatId, qid, user);
                break;
            case 'reset':
                this.resSetAccount(text, chatId, qid, user);
                break
            case 'copykey':
                this.copyPrivateKey( chatId, qid, user)
        }
    }

    private async exportKey(chatId: number, user: TelegramUser) {
        const key = await getWalletKey(user).catch(() => 'err');
        const lang = await getLocal(user.id);
        const keyboards = [
            [
                {
                    text: translate(lang, 'export_key_copy'),
                    callback_data: 'cmd_copykey'
                },
            ]
        ]
        this.bot.api.sendMessage(chatId, translate(lang, 'export_key_msg', { key }), {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: keyboards
            }
        })
    }

    private async copyPrivateKey(chatId: number, qid: string, user: TelegramUser){
        
    }

    private async showLanguages(chatId: number, user: TelegramUser) {
        const lang = await getLocal(user.id);
        const keyboards = [
            [
                {
                    text: translate(lang, 'language_zn'),
                    callback_data: 'cmd_language_zn'
                },
                {
                    text: translate(lang, 'language_en'),
                    callback_data: 'cmd_language_en'
                }
            ]
        ]
        this.bot.api.sendMessage(chatId, translate(lang, 'set_language_msg'), {
            parse_mode: 'MarkdownV2',
            reply_markup: {
                inline_keyboard: keyboards
            }
        })
    }

    private async setLanguage(lang: string, chatId: number, qid: string, user: TelegramUser) {
        this.resetKeyBoards(lang);
        setLanguage(user, lang).then(() => {
            const currLang = translate(lang, 'language_' + lang);
            this.bot.api.sendMessage(chatId, translate(lang, 'language_success', { lang: currLang }), {
                reply_markup: {
                    keyboard: this.keyboards,
                    resize_keyboard: true
                }
            });
        }).catch(() => {
            this.bot.api.sendMessage(chatId, translate(lang, 'operation_err'));
        }).finally(() => {
            this.bot.api.answerCallbackQuery(qid);
        })

    }

    private async showResetAccount(chatId: number, user: TelegramUser) {
        const lang = await getLocal(user.id);
        const keyboards = [
            [
                {
                    text: translate(lang, 'reset_account_yes'),
                    callback_data: 'cmd_reset_yes'
                },
                {
                    text: translate(lang, 'reset_account_no'),
                    callback_data: 'cmd_reset_no'
                }
            ]
        ]
        const now = Date.now();
        await dbClient.set('user.reset.ask.' + user.id, String(now), {
            expiration: {
                type: 'EX',
                value: 15
            }
        });
        this.bot.api.sendMessage(chatId, translate(lang, 'reset_account_msg'), {
            parse_mode: 'MarkdownV2',
            reply_markup: {
                inline_keyboard: keyboards
            }
        })
    }

    private async resSetAccount(comfire: string, chatId: number, qid: string, user: TelegramUser) {
        const lang = await getLocal(user.id);
        const askTime = await dbClient.get('user.reset.ask.' + user.id);
        dbClient.del('user.reset.ask.' + user.id);
        if (!askTime) {
            this.bot.api.sendMessage(chatId, translate(lang, 'operation_invalid'));
            this.bot.api.answerCallbackQuery(qid);
            return
        }
        if (comfire == 'no') {
            this.bot.api.sendMessage(chatId, translate(lang, 'reset_account_canelced'));
            this.bot.api.answerCallbackQuery(qid);
            return
        }
        resetAccount(user).then(() => {
            this.bot.api.sendMessage(chatId, translate(lang, 'reset_account_success'));
        }).catch(() => {
            this.bot.api.sendMessage(chatId, translate(lang, 'operation_err'));
        }).finally(() => {
            this.bot.api.answerCallbackQuery(qid);
        })
    }

    private async startCmd(ctx: CommandContext<Context>) {
        const lang = await getLocal(ctx.from?.id || 0);
        this.resetKeyBoards(lang);
        const banner = process.env.TMA_APP_URL + '/images/bot-banner.jpg';

        if (ctx.from) {
            ctx.replyWithPhoto(banner, {
                caption: translate(lang, 'start_msg'),
                reply_markup: {
                    keyboard: this.keyboards,
                    resize_keyboard: true
                },
                parse_mode: 'HTML'
            })
            login(ctx.from).catch((err) => {
                console.error(err)
            });
        } else {
            ctx.replyWithPhoto(banner, {
                caption: translate(lang, 'start_msg'),
                parse_mode: 'HTML'
            })
        }
    }
}