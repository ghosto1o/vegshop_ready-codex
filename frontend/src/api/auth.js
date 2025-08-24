import { api, setAccess } from './client.js'
const BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000'

export async function register(payload){
  console.log('[FE] register', payload.email)
  const r = await fetch(BASE + '/auth/register', { method:'POST', headers:{ 'Content-Type':'application/json' }, credentials:'include', body: JSON.stringify(payload) })
  if (!r.ok) throw new Error((await r.json().catch(()=>({}))).message || 'register failed')
  const data = await r.json()
  setAccess(data.accessToken); localStorage.setItem('veg_current_user', JSON.stringify(data.user))
  return data.user
}
export async function login(payload){
  console.log('[FE] login', payload.email)
  const r = await fetch(BASE + '/auth/login', { method:'POST', headers:{ 'Content-Type':'application/json' }, credentials:'include', body: JSON.stringify(payload) })
  if (!r.ok) throw new Error((await r.json().catch(()=>({}))).message || 'login failed')
  const data = await r.json()
  setAccess(data.accessToken); localStorage.setItem('veg_current_user', JSON.stringify(data.user))
  return data.user
}
export async function me(){ try{ const r = await api('/auth/me'); localStorage.setItem('veg_current_user', JSON.stringify(r.user)); return r.user }catch{ return null } }
export function currentUser(){ try{ return JSON.parse(localStorage.getItem('veg_current_user')) }catch{ return null } }
export async function logout(){ try{ await fetch(BASE + '/auth/logout', { method:'POST', credentials:'include' }) }catch{} setAccess(null); localStorage.removeItem('veg_current_user') }
