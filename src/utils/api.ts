import { dbClient, getToken,removeToken,getLocal } from "./cache";
import { httpClient } from "./http";

export async function login(user: TelegramUser) {
    const token = await getToken(user.id)
    if (token) {
        await getLocal(user.id)
        return
    }
    const res = await httpClient.post('/api/user/login', {
        ...user,
        type: 2
    }, {
        headers: {
            uid: user.id
        }
    })

    await dbClient.set('user.token.' + user.id, res.data.token, {
        expiration: {
            type: 'EX',
            value: 60 * 20
        }
    });
    await dbClient.set('user.address.' + user.id, res.data.wallet_address, {
        expiration: {
            type: 'EX',
            value: 60 * 20
        }
    });

    await getUserInfo(user.id);

}

export async function getUserInfo(uid: number|string) {
    const res = await httpClient.post('/api/info/userInfo', undefined, {
        headers: {
            uid
        }
    });
    await dbClient.set('user.lang.' + uid, res.data.lang, {
        expiration: {
            type: 'EX',
            value: 60 * 60 * 6
        }
    });
    return res.data;
}

export async function resetAccount(user: TelegramUser) {
    await httpClient.post('/api/info/reset', undefined, {
        headers: {
            uid: user.id
        }
    });
    removeToken(user.id);
}

export async function setLanguage(user: TelegramUser, lang: string) {
    await httpClient.post('/api/info/updateLanguage', { lang }, {
        headers: {
            uid: user.id
        }
    });
    await dbClient.set('user.lang.' + user.id, lang, {
        expiration: {
            type: 'EX',
            value: 60 * 60 * 6
        }
    });
}

export async function getWalletKey(user: TelegramUser) {
    const res = await httpClient.post('/api/info/getWalletPrivateKey', undefined, {
        headers: {
            uid: user.id
        }
    });
    return res.data?.private_key || 'err';
}