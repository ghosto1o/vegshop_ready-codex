// frontend/src/features/account/DeliveryInfo.jsx
import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listMyOrders, cancelMyOrder } from '../../api/orders.js'
import { createPaymentIntent } from '../../api/payments.js'
import PromptPayModal from '../payments/PromptPayModal.jsx'

const currency = (n)=> new Intl.NumberFormat('th-TH',{style:'currency',currency:'THB'}).format(n||0)
const fmtDate = (s)=> new Date(s).toLocaleString('th-TH')
const renderPayMethod = (m)=> {
  if (m === 'cod') return 'ชำระปลายทาง (COD)'
  if (m === 'transfer') return 'โอนผ่านธนาคาร'
  if (m === 'promptpay') return 'PromptPay'
  if (m?.startsWith('internet_banking')) return 'อินเทอร์เน็ตแบงก์กิ้ง'
  return m || '-'
}
const statusChipStyle = (s)=>{
  const map = {
    'รอการชำระเงิน': { bg:'#fef3c7', bd:'#fde68a', fg:'#92400e' },
    'กำลังดำเนินการ': { bg:'#e0f2fe', bd:'#bae6fd', fg:'#075985' },
    'กำลังจัดส่ง':   { bg:'#ede9fe', bd:'#ddd6fe', fg:'#5b21b6' },
    'จัดส่งแล้ว':     { bg:'#dcfce7', bd:'#bbf7d0', fg:'#166534' },
    'ยกเลิก':         { bg:'#fee2e2', bd:'#fecaca', fg:'#991b1b' },
  }
  const c = map[s] || { bg:'#f1f5f9', bd:'#e2e8f0', fg:'#334155' }
  return { background:c.bg, border:`1px solid ${c.bd}`, color:c.fg, padding:'2px 8px', borderRadius:999, fontSize:12, fontWeight:700, display:'inline-block' }
}
const payChipStyle = (m)=>{
  const map = {
    'cod': { bg:'#dcfce7', bd:'#bbf7d0', fg:'#166534' },
    'transfer': { bg:'#f1f5f9', bd:'#e2e8f0', fg:'#334155' },
    'promptpay': { bg:'#fae8ff', bd:'#f5d0fe', fg:'#6b21a8' },
    'internet': { bg:'#dbeafe', bd:'#bfdbfe', fg:'#1e40af' },
  }
  const key = m==='promptpay' ? 'promptpay' : (m==='cod' ? 'cod' : (m==='transfer' ? 'transfer' : 'internet'))
  const c = map[key]
  return { background:c.bg, border:`1px solid ${c.bd}`, color:c.fg, padding:'2px 8px', borderRadius:999, fontSize:12, fontWeight:700, display:'inline-block' }
}

export default function DeliveryInfo(){
  const [orders, setOrders] = useState([])
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [payingId, setPayingId] = useState('')
  const [cancellingId, setCancellingId] = useState('')

  // PromptPay modal
  const [ppOpen, setPpOpen] = useState(false)
  const [ppPayload, setPpPayload] = useState('')

  const loadOrders = async ()=>{
    setLoadingOrders(true)
    try{
      const r = await listMyOrders()
      console.log('[DeliveryInfo] my orders', r.orders?.length || 0)
      setOrders(r.orders || [])
    } finally { setLoadingOrders(false) }
  }
  useEffect(()=>{ loadOrders() }, [])

  async function handlePay(o){
    console.log('[DeliveryInfo] pay click', { orderId: o._id, method: o.paymentMethod })
    try{
      // เงื่อนไขปิดปุ่ม: ไม่ใช่ออนไลน์หรือสถานะไม่เหมาะสม
      const notPayableStatuses = ['ยกเลิก','กำลังจัดส่ง','จัดส่งแล้ว']
      if (o.paymentMethod === 'cod' || o.paymentMethod === 'transfer' || notPayableStatuses.includes(o.status)){
        alert('ออเดอร์นี้ไม่รองรับการจ่ายออนไลน์')
        return
      }
      setPayingId(o._id)
      const res = await createPaymentIntent({ orderId: o._id, method: o.paymentMethod })
      console.log('[DeliveryInfo] payment intent result', res)
      if (res?.payload){ setPpPayload(res.payload); setPpOpen(true) }
      else if (res?.authorize_uri){ window.location.href = res.authorize_uri }
      else { alert('ไม่พบข้อมูลการชำระเงินที่รองรับ') }
    }catch(e){
      console.log('[DeliveryInfo] pay error', e.message)
      alert('ชำระเงินไม่สำเร็จ: ' + e.message)
    }finally{
      setPayingId('')
    }
  }

  async function handleCancel(o){
    console.log('[DeliveryInfo] cancel click', o._id, 'status=', o.status)
    const notAllowed = ['กำลังจัดส่ง','จัดส่งแล้ว','ยกเลิก']
    if (notAllowed.includes(o.status)){
      alert('ไม่สามารถยกเลิกออเดอร์ในสถานะปัจจุบันได้')
      return
    }
    if (!confirm('ยืนยันยกเลิกคำสั่งซื้อ?')) return
    try{
      setCancellingId(o._id)
      await cancelMyOrder(o._id)
      await loadOrders()
      alert('ยกเลิกคำสั่งซื้อแล้ว')
    }catch(e){
      alert('ยกเลิกไม่สำเร็จ: ' + e.message)
    }finally{
      setCancellingId('')
    }
  }

  return (
    <div className="container">
      {/* ปุ่มกลับหน้าหลัก */}
      <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:8}}>
        <Link className="btn" to="/">⬅ กลับหน้าหลัก</Link>
        {loadingOrders && <span style={{fontSize:12, color:'#64748b'}}>กำลังโหลดคำสั่งซื้อ…</span>}
      </div>

      {/* Header card */}
      <div className="card" style={{
        border:'2px solid #16a34a', background:'#dcfce7', borderRadius:16,
        boxShadow:'0 10px 28px rgba(22,163,74,.12)', marginBottom:12, padding:14
      }}>
        <div style={{display:'flex', alignItems:'center', gap:10}}>
          <div style={{width:44,height:44,borderRadius:12, background:'#16a34a', color:'#fff', display:'grid', placeItems:'center', fontSize:22}}>🧺</div>
          <div>
            <div style={{fontWeight:800, color:'#14532d'}}>คำสั่งซื้อของฉัน</div>
            <div style={{fontSize:13, color:'#166534'}}>ดูสถานะ • ชำระเงิน • ยกเลิกคำสั่งซื้อ (ถ้ายังไม่กำลังจัดส่ง)</div>
          </div>
        </div>
      </div>

      {/* Orders table */}
      <div className="card" style={{overflow:'auto'}}>
        <table className="table">
          <thead>
            <tr>
              <th>เลขที่</th>
              <th>วันที่</th>
              <th>รายการ</th>
              <th style={{textAlign:'right'}}>ยอดรวม</th>
              <th>การชำระเงิน</th>
              <th>สถานะ</th>
              <th>ดำเนินการ</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(o=>(
              <tr key={o._id}>
                <td style={{whiteSpace:'nowrap'}}>{o._id}</td>
                <td>{fmtDate(o.createdAt)}</td>
                <td>
                  <ul style={{margin:'6px 0 0 18px'}}>
                    {o.items.map((it, idx)=> <li key={idx}>{it.name} × {it.qty}</li>)}
                  </ul>
                </td>
                <td style={{textAlign:'right'}}><b>{currency(o.total)}</b></td>
                <td>
                  <span style={payChipStyle(o.paymentMethod)}>{renderPayMethod(o.paymentMethod)}</span>
                  {o.chargeId && <div style={{fontSize:12,color:'#555', marginTop:4}}>Charge: {o.chargeId}</div>}
                </td>
                <td><span style={statusChipStyle(o.status)}>{o.status}</span></td>
                <td style={{display:'flex',gap:6, alignItems:'center'}}>
                  <button
                    className="btn"
                    onClick={()=>handlePay(o)}
                    disabled={
                      payingId===o._id ||
                      o.paymentMethod==='cod' || o.paymentMethod==='transfer' ||
                      ['ยกเลิก','กำลังจัดส่ง','จัดส่งแล้ว'].includes(o.status)
                    }
                    title="ดำเนินการชำระเงินออนไลน์"
                  >
                    {payingId===o._id ? 'กำลังเปิด…' : 'ชำระเงิน'}
                  </button>

                  <button
                    className="btn"
                    onClick={()=>handleCancel(o)}
                    disabled={cancellingId===o._id || ['กำลังจัดส่ง','จัดส่งแล้ว','ยกเลิก'].includes(o.status)}
                    title="ยกเลิกคำสั่งซื้อ"
                  >
                    {cancellingId===o._id ? 'กำลังยกเลิก…' : 'ยกเลิก'}
                  </button>
                </td>
              </tr>
            ))}
            {orders.length===0 && (
              <tr><td colSpan={7} style={{color:'#777'}}>ยังไม่มีคำสั่งซื้อ</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* PromptPay QR */}
      <PromptPayModal open={ppOpen} onClose={()=>setPpOpen(false)} payload={ppPayload} />
    </div>
  )
}
