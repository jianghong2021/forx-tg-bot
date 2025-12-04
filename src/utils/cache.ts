import { createClient } from "redis";

export const dbClient = createClient({
    socket: {
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT) || 6379
    }
})

dbClient.on('error', err => {
    console.log(err)
})

export async function initCache() {
    await dbClient.connect();
}

export function getToken(uid: string | number) {
    return dbClient.get('user.token.' + uid)
}

export async function getLocal(uid: string | number) {
    const lang = await dbClient.get('user.lang.' + uid);
    return lang || 'zn'
}