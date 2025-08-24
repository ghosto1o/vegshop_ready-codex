import { api } from './client.js'
export const adminListOrders = () => api('/admin/orders')
export const adminUpdateOrderStatus = (id, status) => api(`/admin/orders/${id}`, { method:'PATCH', body: { status } })
