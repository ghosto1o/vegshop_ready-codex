import { api } from './client.js'
export const getAddresses = () => api('/account/addresses')
export const addAddress = (payload) => api('/account/addresses', { method:'POST', body: payload })
export const updateAddress = (index, payload) => api(`/account/addresses/${index}`, { method:'PUT', body: payload })
export const deleteAddress = (index) => api(`/account/addresses/${index}`, { method:'DELETE' })
export const setDefaultAddress = (index) => api('/account/addresses/default', { method:'PATCH', body: { index } })
