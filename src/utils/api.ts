import { dbClient, getToken } from "./cache";
import { httpClient } from "./http";

export async function login(user: TelegramUser) {
    const token = await getToken(user.id)
    if (token) {
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

    const serverUser = await getUserInfo(user);
    await dbClient.set('user.lang.' + user.id, serverUser.lang, {
        expiration: {
            type: 'EX',
            value: 60 * 20
        }
    });

}

export async function getUserInfo(user: TelegramUser) {
    const res = await httpClient.post('/api/info/userInfo', undefined, {
        headers: {
            uid: user.id
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
    dbClient.del('user.token');
    dbClient.del('user.address');
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
            value: 60 * 20
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