import { createClient } from "redis";

export let dbClient = createClient({
    socket: {
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT) || 6379,
    },
    password: process.env.REDIS_PSWD
})

dbClient.on('error', err => {
    console.log(err)
})

export async function initCache() {
    dbClient = createClient({
    socket: {
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT) || 6379,
    },
    password: process.env.REDIS_PSWD
})
    await dbClient.connect();
}

export function getToken(uid: string | number) {
    return dbClient.get('user.token.' + uid)
}

export async function getLocal(uid: string | number) {
    const lang = await dbClient.get('user.lang.' + uid);
    return lang || 'zn'
}