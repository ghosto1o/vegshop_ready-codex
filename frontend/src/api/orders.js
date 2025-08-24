import { api } from './client.js'
export const createOrder = (payload) => api('/orders', { method:'POST', body: payload })
export const listMyOrders = () => api('/orders/me')
export const cancelMyOrder = (id) => api(`/orders/${id}/cancel`, { method:'POST' })
