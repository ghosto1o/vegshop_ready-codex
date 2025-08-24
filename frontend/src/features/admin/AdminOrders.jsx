import React, { useEffect, useState } from 'react'
import { adminListOrders, adminUpdateOrderStatus } from '../../api/adminOrders.js'
const currency = (n)=> new Intl.NumberFormat('th-TH',{style:'currency', currency:'THB'}).format(n||0)
const STATUS_OPTIONS = ['รอการชำระเงิน','กำลังดำเนินการ','กำลังจัดส่ง','จัดส่งแล้ว','ยกเลิก']
const STATUS_CLASS = {
  'รอการชำระเงิน': 'pending',
  'กำลังดำเนินการ': 'processing',
  'กำลังจัดส่ง': 'shipping',
  'จัดส่งแล้ว': 'done',
  'ยกเลิก': 'cancel',
}
const renderPayMethod = (m)=> {
  if (m === 'cod') return 'ชำระปลายทาง (COD)'
  if (m === 'transfer') return 'โอนผ่านธนาคาร'
  if (m === 'promptpay') return 'PromptPay'
  if (m?.startsWith('internet_banking')) return 'อินเทอร์เน็ตแบงก์กิ้ง'
  return m || '-'
}

export default function AdminOrders(){
  const [orders, setOrders] = useState([])
  const load = ()=> adminListOrders().then(res => setOrders(res.orders||[]))
  useEffect(()=>{ load() }, [])
  return (
    <div className="container">
      <h3>คำสั่งซื้อทั้งหมด</h3>
      <div className="card" style={{overflow:'auto'}}>
        <table className="table orders-table">
          <thead>
            <tr>
              <th>#</th>
              <th>ลูกค้า</th>
              <th>รายการ</th>
              <th style={{textAlign:'right'}}>ยอดรวม</th>
              <th>การชำระเงิน</th>
              <th>สถานะ</th>
              <th>ปรับสถานะ</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(o=> (
              <tr key={o._id}>
                <td>{o._id}</td>
                <td>{o.user?.name || 'N/A'}{o.user?.email ? <div style={{fontSize:12,color:'#555'}}>{o.user.email}</div> : null}</td>
                <td><ul style={{margin:'6px 0 0 18px'}}>{o.items.map((it,i)=> <li key={i}>{it.name} × {it.qty}</li>)}</ul></td>
                <td style={{textAlign:'right'}}>{currency(o.total)}</td>
                <td>
                  <div>{renderPayMethod(o.paymentMethod)}</div>
                  {o.chargeId && <div style={{fontSize:12,color:'#555'}}>Charge: {o.chargeId}</div>}
                </td>
                <td><span className={`status-badge ${STATUS_CLASS[o.status]||''}`}>{o.status}</span></td>
                <td>
                  <select
                    className="input"
                    defaultValue={STATUS_OPTIONS.includes(o.status) ? o.status : 'กำลังดำเนินการ'}
                    onChange={async (e)=>{ await adminUpdateOrderStatus(o._id, e.target.value); load() }}
                  >
                    {STATUS_OPTIONS.map(s=> <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

