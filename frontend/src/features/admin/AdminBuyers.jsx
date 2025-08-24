import React, { useEffect, useState } from 'react'
import { getBuyers, createBuyer, updateBuyer, deleteBuyer, setBuyerPassword } from '../../api/admin.js'

export default function AdminBuyers(){
  const [buyers, setBuyers] = useState([])
  const [draft, setDraft] = useState({ name:'', phone:'', email:'', address:'', password:'' })
  const load = ()=> getBuyers().then(res => setBuyers((res.buyers||[]).map(b => ({ id:b._id||b.id, name:b.name, phone:b.phone, email:b.email, address:b.addresses?.[0]?.line || '' }))))
  useEffect(()=>{ load() }, [])

  return (
    <div className="container">
      <h3>ผู้ซื้อ</h3>
      <div className="card">
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:8}}>
          <input className="input" placeholder="ชื่อ" value={draft.name} onChange={e=>setDraft({...draft, name:e.target.value})} />
          <input className="input" placeholder="โทร" value={draft.phone} onChange={e=>setDraft({...draft, phone:e.target.value})} />
          <input className="input" placeholder="อีเมล" value={draft.email} onChange={e=>setDraft({...draft, email:e.target.value})} />
          <input className="input" placeholder="ที่อยู่" value={draft.address} onChange={e=>setDraft({...draft, address:e.target.value})} />
          <input className="input" placeholder="รหัสผ่านเริ่มต้น" value={draft.password} onChange={e=>setDraft({...draft, password:e.target.value})} />
          <button className="btn primary" disabled={!draft.name} onClick={async ()=>{ await createBuyer(draft); setDraft({ name:'', phone:'', email:'', address:'', password:'' }); load() }}>เพิ่มผู้ซื้อ</button>
        </div>
      </div>

      <div className="card" style={{marginTop:12, overflow:'auto'}}>
        <table className="table">
          <thead><tr><th>ชื่อ</th><th>โทร</th><th>อีเมล</th><th>ที่อยู่</th><th>ตั้งรหัสผ่าน</th><th>ลบ</th></tr></thead>
          <tbody>
            {buyers.map(b=> (
              <tr key={b.id}>
                <td><input className="input" defaultValue={b.name} onBlur={e=>updateBuyer(b.id, { name:e.target.value }).then(load)} /></td>
                <td><input className="input" defaultValue={b.phone} onBlur={e=>updateBuyer(b.id, { phone:e.target.value }).then(load)} /></td>
                <td><input className="input" defaultValue={b.email} onBlur={e=>updateBuyer(b.id, { email:e.target.value }).then(load)} /></td>
                <td><input className="input" defaultValue={b.address} onBlur={e=>updateBuyer(b.id, { address:e.target.value }).then(load)} /></td>
                <td>
                  <div style={{display:'flex',gap:6}}>
                    <input className="input" type="password" placeholder="รหัสใหม่" onChange={(e)=>{ b.__pwd = e.target.value }} />
                    <button className="btn" onClick={async ()=>{ if(!b.__pwd){ alert('ใส่รหัสก่อน'); return } await setBuyerPassword(b.id, b.__pwd); alert('ตั้งรหัสแล้ว') }}>ตั้งค่า</button>
                  </div>
                </td>
                <td><button className="btn" onClick={async ()=>{ if (confirm(`ลบผู้ซื้อ “${b.name}” ?`)){ await deleteBuyer(b.id); load() } }}>ลบ</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
