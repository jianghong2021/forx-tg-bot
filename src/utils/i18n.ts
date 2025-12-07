// import zn from '../../locales/zn.json'
import en from '../../locales/en.json'
import ja from '../../locales/ja.json'

interface LangPack {
    [key: string]: string | LangPack;
}

export const i18n = {
    messages: {
        // zn,
        en,
        ja,
    }
}

function getMessage(local: string) {
    return Reflect.get(i18n.messages, local) || {}
}

export function translate(local: string, key: string, data?: any): string {
    const keys = key.split('.');
    let current: string | LangPack = getMessage(local);

    for (const k of keys) {
        if (typeof current === 'object' && current !== null && k in current) {
            current = current[k];
        } else {
            return key;
        }
    }

    let val = typeof current === 'string' ? current : key;
    if (data) {
        for (const k in data) {
            const v = data[k];
            const reg = new RegExp(`\\{\\s?${k}\\s?\\}`, 'i');
            val = val.replace(reg, v);
        }
    }
    return val
}
