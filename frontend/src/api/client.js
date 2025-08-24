const BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000'

let ACCESS_TOKEN = localStorage.getItem('veg_access') || null
export function setAccess(t){ ACCESS_TOKEN = t; if (t) localStorage.setItem('veg_access', t); else localStorage.removeItem('veg_access') }
export function getAccess(){ return ACCESS_TOKEN }

async function refresh(){
  const res = await fetch(BASE + '/auth/refresh', {
    method:'POST', credentials:'include', headers:{ 'Content-Type':'application/json' }
  })
  if (!res.ok) throw new Error('refresh failed')
  const data = await res.json()
  setAccess(data.accessToken)
  return data.accessToken
}

export async function api(path, { method='GET', body } = {}){
  const doFetch = async ()=>{
    const headers = {}
    const isForm = body instanceof FormData
    if (!isForm) headers['Content-Type'] = 'application/json'
    if (ACCESS_TOKEN) headers['Authorization'] = 'Bearer ' + ACCESS_TOKEN
    const legacy = localStorage.getItem('veg_token')
    if (!ACCESS_TOKEN && legacy) headers['Authorization'] = 'Bearer ' + legacy
    const res = await fetch(BASE + path, {
      method,
      headers,
      body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
      credentials:'include'
    })
    return res
  }
  let res = await doFetch()
  if (res.status === 401){
    console.log('[FE] 401 → try refresh...')
    try{ await refresh(); res = await doFetch() }catch(e){ console.log('[FE] refresh failed', e.message); throw new Error('unauthorized') }
  }
  if (!res.ok) throw new Error((await res.json().catch(()=>({}))).message || res.statusText)
  return res.json()
}
