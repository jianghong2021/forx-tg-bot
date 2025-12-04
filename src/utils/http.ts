import axios from 'axios';
import { getToken } from './cache';

export const httpClient = new axios.Axios({
    baseURL: process.env.API_HOST
})

httpClient.interceptors.request.use(async (config) => {
    const uid = config.headers.get('uid');
    if (!uid) {
        return Promise.reject('need uid')
    }
    const token = await getToken(uid.toString());

    if (token) {
        config.headers.set('Authorization', `${token}`);
    }
    if (config.url?.startsWith('http')) {
        config.baseURL = undefined;
    } else {
        config.baseURL = process.env.API_HOST;
    }
    config.headers.set('Server', '1');
    // config.headers.set('Type', '2');

    if (config.method != 'GET' && config.data) {
        const form = new FormData();
        for (const k in config.data) {
            form.append(k, Reflect.get(config.data, k));
        }
        config.data = form;
    }
    return config
})

httpClient.interceptors.response.use(res => {

    if (res.status != 200) {
        return Promise.reject('Net err')
    }
    if (typeof res.data === 'string') {
        try {
            return JSON.parse(res.data)
        } catch (e) {
            console.log('string')
        }
    }
    return res.data
})