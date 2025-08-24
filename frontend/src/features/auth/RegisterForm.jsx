// frontend/src/features/auth/RegisterForm.jsx
import React, { useState } from 'react'
import { register } from '../../api/auth.js'

export default function RegisterForm({ onSuccess }){
  const [name,setName] = useState('')
  const [email,setEmail] = useState('')
  const [phone,setPhone] = useState('')
  const [password,setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)

  // ที่อยู่จัดส่ง (บันทึกพร้อมสมัคร)
  const [addressLine,setAddressLine] = useState('')
  const [addressPhone,setAddressPhone] = useState('')
  const [addressNote,setAddressNote] = useState('')

  const [err,setErr] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e){
    e.preventDefault()
    setErr('')

    // ตรวจเบื้องต้น
    if (!name || !email || !password){
      setErr('กรุณากรอก ชื่อ/อีเมล/รหัสผ่าน ให้ครบ')
      return
    }
    if (password.length < 6){
      setErr('รหัสผ่านต้องยาวอย่างน้อย 6 ตัวอักษร')
      return
    }

    try{
      setLoading(true)
      const payload = { name,email,password,phone,addressLine,addressPhone,addressNote }
      console.log('[RegisterForm] submit payload', { name,email,phone, addressLine, addressPhone, addressNote, pwdLen: password.length })
      const u = await register(payload)
      console.log('[RegisterForm] register success, reloading page for', u?.email || email)
      onSuccess?.(u)
      window.location.reload()
    }catch(ex){
      console.log('[RegisterForm] register error:', ex.message)
      setErr(ex.message || 'สมัครสมาชิกไม่สำเร็จ')
    }finally{
      setLoading(false)
    }
  }

  return (
    <div
      className="card"
      style={{
        borderRadius: 16,
        padding: 20,
        border: '2px solid #16a34a',        // ขอบสีเขียวชัด
        background: '#dcfce7',               // พื้นหลังเขียวอ่อน
        boxShadow: '0 10px 28px rgba(22,163,74,.20)',
      }}
    >
      {/* Header */}
      <div style={{display:'flex', alignItems:'center', gap:10, marginBottom:12}}>
        <div style={{
          width:40, height:40, borderRadius:12,
          background:'#16a34a', color:'#fff',
          display:'grid', placeItems:'center', fontSize:20
        }}>🥕</div>
        <div>
          <div style={{fontWeight:800, fontSize:18, color:'#14532d'}}>สมัครสมาชิก</div>
          <div style={{color:'#166534', fontSize:13, opacity:.9}}>บัญชีใหม่สำหรับสั่งผักได้ทันใจ</div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} style={{display:'grid', gap:10}}>
        <label style={{fontSize:13, color:'#14532d'}}>ชื่อ</label>
        <input
          className="input"
          placeholder="ชื่อ-นามสกุล"
          value={name}
          onChange={(e)=>{ setName(e.target.value); console.log('[RegisterForm] name =>', e.target.value) }}
          style={{background:'#fff'}}
        />

        <label style={{fontSize:13, color:'#14532d'}}>อีเมล</label>
        <input
          className="input"
          placeholder="you@example.com"
          value={email}
          onChange={(e)=>{ setEmail(e.target.value); console.log('[RegisterForm] email =>', e.target.value) }}
          style={{background:'#fff'}}
        />

        <label style={{fontSize:13, color:'#14532d'}}>เบอร์โทร (ไม่บังคับ)</label>
        <input
          className="input"
          placeholder="0812345678"
          value={phone}
          onChange={(e)=>{ setPhone(e.target.value); console.log('[RegisterForm] phone =>', e.target.value) }}
          style={{background:'#fff'}}
        />

        <label style={{fontSize:13, color:'#14532d'}}>รหัสผ่าน</label>
        <div style={{position:'relative'}}>
          <input
            className="input"
            type={showPwd ? 'text' : 'password'}
            placeholder="อย่างน้อย 6 ตัวอักษร"
            value={password}
            onChange={(e)=>{ setPassword(e.target.value); if(e.target.value?.length===0) console.log('[RegisterForm] password cleared') }}
            style={{background:'#fff'}}
          />
          <button
            type="button"
            className="btn"
            onClick={()=>{ setShowPwd(v=>!v); console.log('[RegisterForm] toggle show password =>', !showPwd) }}
            style={{position:'absolute', right:6, top:6, height:30}}
            aria-label={showPwd ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
          >
            {showPwd ? 'ซ่อน' : 'แสดง'}
          </button>
        </div>

        {/* ที่อยู่จัดส่ง */}
        <div style={{marginTop:4, fontWeight:700, color:'#14532d'}}>ที่อยู่จัดส่ง (บันทึกทันที)</div>
        <input
          className="input"
          placeholder="ที่อยู่เต็ม"
          value={addressLine}
          onChange={(e)=>{ setAddressLine(e.target.value); console.log('[RegisterForm] addressLine =>', e.target.value) }}
          style={{background:'#fff'}}
        />
        <input
          className="input"
          placeholder="เบอร์ติดต่อสำหรับจัดส่ง (ไม่บังคับ)"
          value={addressPhone}
          onChange={(e)=>{ setAddressPhone(e.target.value); console.log('[RegisterForm] addressPhone =>', e.target.value) }}
          style={{background:'#fff'}}
        />
        <input
          className="input"
          placeholder="หมายเหตุ (เช่น ฝากไว้กับ รปภ.)"
          value={addressNote}
          onChange={(e)=>{ setAddressNote(e.target.value); console.log('[RegisterForm] addressNote =>', e.target.value) }}
          style={{background:'#fff'}}
        />

        {/* Error box */}
        {err && (
          <div
            style={{
              background:'#fee2e2',
              color:'#991b1b',
              border:'1px solid #fecaca',
              borderRadius:10,
              padding:'8px 10px',
              fontSize:13
            }}
          >
            {err}
          </div>
        )}

        {/* Actions */}
        <button
          className="btn primary"
          type="submit"
          disabled={loading}
          style={{
            height:44, fontWeight:800, letterSpacing:.2,
            background:'#16a34a', borderColor:'#16a34a'
          }}
        >
          {loading ? 'กำลังสมัครสมาชิก…' : 'สมัครสมาชิก'}
        </button>

        <div style={{fontSize:12, color:'#166534', opacity:.75, marginTop:4}}>
          มีบัญชีอยู่แล้ว? ไปที่แท็บ “เข้าสู่ระบบ”
        </div>
      </form>
    </div>
  )
}

