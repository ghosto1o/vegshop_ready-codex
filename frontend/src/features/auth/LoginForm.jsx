// frontend/src/features/auth/LoginForm.jsx
import React, { useState } from 'react'
import { login } from '../../api/auth.js'

export default function LoginForm({ onSuccess }){
  const [email,setEmail] = useState('')
  const [password,setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [err,setErr] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e){
    e.preventDefault()
    setErr('')
    if (!email || !password){
      setErr('กรุณากรอกอีเมลและรหัสผ่าน')
      return
    }
    try{
      setLoading(true)
      console.log('[LoginForm] submitting login for', email)
      const u = await login({ email,password })
      console.log('[LoginForm] login success, reloading page for', u?.email || email)
      onSuccess?.(u)
      window.location.reload()
    }catch(ex){
      console.log('[LoginForm] login error:', ex.message)
      setErr(ex.message || 'เข้าสู่ระบบไม่สำเร็จ')
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
        border: '2px solid #16a34a',            // ขอบสีเขียวชัด
        background: '#dcfce7',                   // พื้นหลังเขียวอ่อน (เด่นชัด อ่านง่าย)
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
          <div style={{fontWeight:800, fontSize:18, color:'#14532d'}}>เข้าสู่ระบบ</div>
          <div style={{color:'#166534', fontSize:13, opacity:.9}}>ยินดีต้อนรับกลับ สั่งผักได้ทันใจ</div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} style={{display:'grid', gap:10}}>
        <label style={{fontSize:13, color:'#14532d'}}>อีเมล</label>
        <input
          className="input"
          placeholder="you@example.com"
          value={email}
          onChange={(e)=>{ setEmail(e.target.value); console.log('[LoginForm] email change =>', e.target.value) }}
          autoFocus
          style={{background:'#fff'}} // ตัดกับพื้นเขียว ชัดอ่านง่าย
        />

        <label style={{fontSize:13, color:'#14532d', marginTop:4}}>รหัสผ่าน</label>
        <div style={{position:'relative'}}>
          <input
            className="input"
            type={showPwd ? 'text' : 'password'}
            placeholder="••••••••"
            value={password}
            onChange={(e)=>{ setPassword(e.target.value); if(e.target.value?.length===0) console.log('[LoginForm] password cleared') }}
            style={{background:'#fff'}}
          />
          <button
            type="button"
            className="btn"
            onClick={()=>{ setShowPwd(v=>!v); console.log('[LoginForm] toggle show password =>', !showPwd) }}
            style={{position:'absolute', right:6, top:6, height:30}}
            aria-label={showPwd ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
          >
            {showPwd ? 'ซ่อน' : 'แสดง'}
          </button>
        </div>

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
            background:'#16a34a', borderColor:'#16a34a' // ปุ่มสีเดียวกับธีม
          }}
        >
          {loading ? 'กำลังเข้าสู่ระบบ…' : 'เข้าสู่ระบบ'}
        </button>

        {/* Small helper row */}
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:4}}>
          <div style={{fontSize:12, color:'#166534'}}>ยังไม่มีบัญชี? ไปที่แท็บ “สมัครสมาชิก”</div>
          <div style={{fontSize:12, color:'#166534', opacity:.75}}>ต้องการความช่วยเหลือ? ติดต่อผู้ดูแล</div>
        </div>
      </form>
    </div>
  )
}
