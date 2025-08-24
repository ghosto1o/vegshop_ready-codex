import { api } from './client.js'
export const createPaymentIntent = (token, payload) => api('/payments/create-intent', { method:'POST', token, body: payload })
