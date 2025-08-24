import { currentUser, me } from '../api/auth.js'
import { getAccess } from '../api/client.js'
export function getCurrentUser(){ return currentUser() }
export async function fetchMe(){ return await me() }
export function isAuthed(){ const hasNew = !!getAccess(); const hasLegacy = !!localStorage.getItem('veg_token'); if (!hasNew && !hasLegacy) console.log('[auth] not authed'); return hasNew || hasLegacy }
