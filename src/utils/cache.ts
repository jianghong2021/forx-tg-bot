import { createClient } from "redis";
import { getUserInfo } from "./api";

const PING_TIME = 6_000;

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

    setInterval(() => {
        dbClient.ping().catch(err => {
            console.error("Redis ping failed", err)
        })
    }, PING_TIME)
}

export function getToken(uid: string | number) {
    return dbClient.get('user.token.' + uid)
}

export function removeToken(uid: string | number) {
    return dbClient.del('user.token.' + uid)
}

export async function getLocal(uid: string | number) :Promise<string>{
    const lang = await dbClient.get('user.lang.' + uid);
    if (!lang) {
        const info = await getUserInfo(uid);
        return info.lang || 'en';
    }
    return lang || 'en'
}