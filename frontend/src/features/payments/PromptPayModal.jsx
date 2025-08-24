import React, { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'

export default function PromptPayModal({ open, onClose, payload }){
  const canvasRef = useRef(null)
  const [err, setErr] = useState('')
  useEffect(()=>{
    if (open && payload && canvasRef.current){
      QRCode.toCanvas(canvasRef.current, payload, { width: 256 }, (e)=>{ if (e) setErr(e.message) })
      console.log('[PromptPay] payload', payload)
    }
  }, [open, payload])
  if (!open) return null
  return (
    <div className="fixed inset-0" style={{background:'rgba(0,0,0,.4)', display:'grid', placeItems:'center', padding:16}} onClick={onClose}>
      <div className="card" style={{maxWidth:420, width:'100%'}} onClick={(e)=>e.stopPropagation()}>
        <h3>สแกนจ่าย PromptPay</h3>
        <p style={{color:'#555'}}>เปิดแอปธนาคาร/วอลเล็ต แล้วสแกน QR ด้านล่าง</p>
        <div style={{display:'grid', placeItems:'center', marginTop:8}}><canvas ref={canvasRef}/></div>
        {err && <div style={{color:'crimson', fontSize:12}}>{err}</div>}
        <div style={{display:'flex', justifyContent:'flex-end', gap:8, marginTop:12}}>
          <button className="btn" onClick={onClose}>ปิด</button>
        </div>
      </div>
    </div>
  )
}
