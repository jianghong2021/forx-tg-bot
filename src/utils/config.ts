import { config } from 'dotenv'
import fs from 'fs'
import { initCache } from './cache';

function loadEnv() {
    if (fs.existsSync('./.env.local')) {
        config({ path: './.env.local' });
    } else {
        config({ path: './.env' })
    }
}

export async function initApp(){
    loadEnv();
    await initCache()
}