// frontend/src/features/shop/VeggieShopMVP.jsx
import React, { useEffect, useMemo, useReducer, useState } from 'react'
import { Link } from 'react-router-dom'
import { listProducts } from '../../api/products.js'
import { createOrder } from '../../api/orders.js'
import { isAuthed } from '../../store/auth.js'
import { createPaymentIntent } from '../../api/payments.js'
import { logout as doLogout } from '../../api/auth.js'
import PromptPayModal from '../payments/PromptPayModal.jsx'

const currency = (n)=> new Intl.NumberFormat('th-TH',{style:'currency',currency:'THB'}).format(n||0)

const initial = { products:[], cart:[], user: (JSON.parse(localStorage.getItem('veg_current_user')||'null')) }
function reducer(s, a){
  switch(a.type){
    case 'SET_PRODUCTS': return {...s, products:a.items}
    case 'ADD_TO_CART': {
      const ex = s.cart.find(x=>x.id===a.id)
      const cart = ex? s.cart.map(x=> x.id===a.id? {...x, qty:x.qty+1}:x) : [...s.cart, {id:a.id, qty:1}]
      return {...s, cart}
    }
    case 'UPDATE_QTY': return {...s, cart: s.cart.map(x=> x.id===a.id? {...x, qty:Math.max(1,a.qty)}:x) }
    case 'REMOVE': return {...s, cart: s.cart.filter(x=>x.id!==a.id)}
    case 'CLEAR_CART': return {...s, cart: []}
    default: return s
  }
}

/** Top green header */
function TopBar({ user, openCart, onAuth }){
  const isAdmin = user?.role === 'admin'
  const isBuyer = user?.role === 'buyer'
  return (
    <div className="header" style={{background:'linear-gradient(90deg,#16a34a,#22c55e)', color:'#fff', borderBottom:'none'}}>
      <div className="container" style={{display:'flex',alignItems:'center',gap:10}}>
        <div style={{
          width:40,height:40,borderRadius:12,background:'rgba(255,255,255,.2)',
          display:'grid',placeItems:'center',fontSize:22
        }}>🥕</div>
        <div style={{fontWeight:800, letterSpacing:.2}}>ผักหน้าบ้าน</div>

        <div className="nav" style={{marginLeft:16}}>
          <Link to="/" className="active" style={{background:'rgba(255,255,255,.18)', color:'#fff'}}>หน้าหลัก</Link>
          {isBuyer && <Link to="/delivery" style={{color:'#fff'}}>คำสั่งซื้อของฉัน</Link>}
          {isAdmin && <Link to="/admin/products" style={{color:'#fff'}}>แผงแอดมิน</Link>}
        </div>

        <div style={{marginLeft:'auto',display:'flex',gap:8,alignItems:'center'}}>
          {user ? (
            <>
              <span style={{fontSize:14, opacity:.95}}>สวัสดี, <b>{user.name}</b></span>
              <button
                className="btn"
                onClick={()=>{ console.log('[FE] logout click'); doLogout(); location.reload() }}
                style={{background:'#fff', borderColor:'#fff'}}
              >ออกจากระบบ</button>
            </>
          ) : (
            <button className="btn" onClick={()=>onAuth('login')} style={{background:'#fff', borderColor:'#fff'}}>สมัคร/เข้าสู่ระบบ</button>
          )}
          <button className="btn" onClick={openCart} style={{background:'#fff', borderColor:'#fff'}}>🧺</button>
        </div>
      </div>
    </div>
  )
}

export default function VeggieShopMVP({ onOpenAuth }){
  const [s, d] = useReducer(reducer, initial)
  const [showCart, setShowCart] = useState(false)
  const [showCheckout, setShowCheckout] = useState(false)
  const [ppOpen, setPpOpen] = useState(false); const [ppPayload, setPpPayload] = useState('')
  const [viewer, setViewer] = useState({ open:false, images:[], index:0 })

  useEffect(()=>{ listProducts().then(r=>{
    const items=(r.items||[]).map(p=> ({...p, id:p._id||p.id}))
    console.log('[Shop] products loaded', items.length)
    d({type:'SET_PRODUCTS', items})
  }) },[])

  const map = useMemo(()=> Object.fromEntries(s.products.map(p=> [p.id||p._id, {...p, id:p.id||p._id}])), [s.products])
  const items = s.cart.map(c=> ({...c, product: map[c.id]})).filter(x=>x.product)
  const subtotal = items.reduce((t,x)=> t + (x.product.price||0)*x.qty, 0)

  async function placeOrder({ deliveryMethod, address, payment }){
    if (!isAuthed()) { console.log('[placeOrder] blocked: not authed'); alert('กรุณาเข้าสู่ระบบก่อนสั่งซื้อ'); onOpenAuth?.('login'); return }
    try {
      const payload = { items: items.map(x=> ({ productId:x.id, name:x.product.name, price:x.product.price, qty:x.qty })), total: subtotal, paymentMethod: payment, deliveryMethod, address }
      console.log('[Shop] placeOrder', payload)
      const res = await createOrder(payload)
      const orderId = res.orderId

      if (payment !== 'cod' && payment !== 'transfer'){
        const pay = await createPaymentIntent({ orderId, method: payment })
        console.log('[Shop] payment intent', pay)
        if (pay.payload){
          console.log('[Shop] clear cart after order created (PromptPay)')
          d({ type:'CLEAR_CART' })
          setPpPayload(pay.payload); 
          setPpOpen(true) 
        }else if (pay.authorize_uri){ 
          console.log('[Shop] clear cart before redirect to bank')
          d({ type:'CLEAR_CART' })
          location.href = pay.authorize_uri; 
        return 
        }
      }
      if (payment === 'cod' || payment === 'transfer') {
        console.log('[Shop] clear cart after order created (COD/transfer)')
        d({ type:'CLEAR_CART' })
      }    

      setShowCheckout(false)
      setShowCart(false)
      alert('สั่งซื้อสำเร็จ!')
    } catch (e){
      alert('ไม่สำเร็จ: '+e.message)
    }
  }

  return (
    <div>
      <TopBar user={s.user} openCart={()=>setShowCart(true)} onAuth={onOpenAuth} />

      {/* Banner / Promo */}
      <div className="container" style={{marginTop:12}}>
        <div className="card" style={{
          background:'#dcfce7',
          border:'2px solid #16a34a',
          boxShadow:'0 10px 28px rgba(22,163,74,.15)',
          borderRadius:16,
          display:'flex',
          alignItems:'center',
          justifyContent:'space-between',
          padding:16
        }}>
          <div>
            <div style={{fontSize:18, fontWeight:800, color:'#14532d'}}>ผักสด ส่งไว ทุกวัน</div>
            <div style={{color:'#166534'}}>ลดพิเศษ ผักใบเขียววันนี้ • ปลอดสาร • เก็บเช้า ขายเช้า</div>
          </div>
          <div style={{
            width:56, height:56, borderRadius:16, background:'#16a34a',
            display:'grid', placeItems:'center', color:'#fff', fontSize:28
          }}>🥬</div>
        </div>
      </div>

      {/* Grid สินค้า */}
      <div className="container" style={{marginTop:12}}>
        <div className="product-grid">
<<<<<<< HEAD
          {s.products.map(p=> {
            const discount = p.originalPrice && p.price < p.originalPrice ? Math.round(100 - (p.price / p.originalPrice) * 100) : 0
            return (
            <div key={p.id} className="card product-card simple">
              <div className="product-image">
                {p.images?.length ? (
                  <img src={p.images[0]} alt={p.name} onClick={()=>setViewer({open:true, images:p.images, index:0})} />
                ) : '🥬'}
                {discount > 0 && <span className="discount-badge">-{discount}%</span>}
=======
          {s.products.map(p=> (
            <div key={p.id} className="card product-card">
              <div className="product-image">{p.images?.[0] ? <img src={p.images[0]} alt={p.name} /> : '🥬'}</div>
              <div className="product-info">
                <div className="product-title-row">
                  <b style={{fontSize:16}}>{p.name}</b>
                  <span className="badge">{p.category}</span>
                </div>
                <div className="product-description">{p.description}</div>
                <div className="product-bottom-row">
                  <div><b style={{fontSize:16}}>{currency(p.price)}</b> <span style={{fontSize:12,color:'#666'}}>/ {p.unit}</span></div>
                  <button
                    className="btn"
                    disabled={p.stock<=0}
                    onClick={()=>{ console.log('[Shop] add to cart', p.id); d({type:'ADD_TO_CART', id:p.id}) }}
                    style={{
                      background: p.stock>0? '#16a34a':'#e5e7eb',
                      color: p.stock>0? '#fff':'#999',
                      borderColor: p.stock>0? '#16a34a':'#e5e7eb',
                      fontWeight:700
                    }}
                  >
                    {p.stock>0?'ใส่ตะกร้า':'หมดสต็อก'}
                  </button>
                </div>
>>>>>>> main
              </div>
              <div className="product-info">
                <div className="product-title">{p.name}</div>
                <div className="price-row">
                  <b>{currency(p.price)}</b>
                  {discount>0 && <span className="old-price">{currency(p.originalPrice)}</span>}
                </div>
                <button
                  className="btn add"
                  disabled={p.stock<=0}
                  onClick={()=>{ console.log('[Shop] add to cart', p.id); d({type:'ADD_TO_CART', id:p.id}) }}
                >{p.stock>0?'ใส่ตะกร้า':'หมดสต็อก'}</button>
              </div>
            </div>)
          })}
        </div>
      </div>

      {viewer.open && (
        <div className="image-modal overlay" onClick={()=>setViewer(v=>({...v, open:false}))}>
          {viewer.images.length>1 && (
            <button className="nav prev" onClick={e=>{e.stopPropagation(); setViewer(v=>({...v, index:(v.index-1+v.images.length)%v.images.length}))}}>‹</button>
          )}
          <img src={viewer.images[viewer.index]} alt="preview" className="modal-pop" onClick={e=>e.stopPropagation()} />
          {viewer.images.length>1 && (
            <button className="nav next" onClick={e=>{e.stopPropagation(); setViewer(v=>({...v, index:(v.index+1)%v.images.length}))}}>›</button>
          )}
        </div>
      )}


{/* Drawer: Cart */}
{showCart && (
  <div
    className="fixed inset-0 overlay"
    style={{ background: 'rgba(0,0,0,.55)', backdropFilter: 'blur(2px)' }}
    onClick={() => { console.log('[Cart] overlay click → close'); setShowCart(false) }}
  >
    <aside
      className="cart-drawer"
      onClick={(e) => e.stopPropagation()}
      style={{
        background: '#fff',
        width: '100%',
        maxWidth: 420,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        marginLeft: 'auto',
        borderTopLeftRadius: 16,
        borderBottomLeftRadius: 16,
        boxShadow: '0 10px 28px rgba(0,0,0,.25)',
        transform: 'translateX(0)',
      }}
    >
      {/* header (sticky) */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 2,
          background: 'linear-gradient(90deg,#16a34a,#22c55e)',
          color: '#fff',
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTopLeftRadius: 16
        }}
      >
        <b style={{ letterSpacing: .2 }}>ตะกร้าของฉัน</b>
        <button
          className="btn"
          onClick={() => setShowCart(false)}
          style={{ background: '#fff', borderColor: '#fff' }}
        >
          ปิด
        </button>
      </div>

      {/* list (scroll) */}
      <div style={{ overflow: 'auto', flex: 1, padding: 12 }}>
        {items.length === 0 ? (
          <div style={{ color: '#777' }}>ยังไม่มีสินค้า</div>
        ) : (
          items.map(ci => (
            <div
              key={ci.id}
              style={{
                display: 'flex', gap: 10, alignItems: 'center',
                borderTop: '1px dashed #e5e7eb', padding: '10px 0'
              }}
            >
              <div
                style={{
                  fontSize: 28, background: '#f0fdf4', width: 44, height: 44,
                  borderRadius: 10, display: 'grid', placeItems: 'center', overflow:'hidden'
                }}
              >
                {ci.product.images?.[0] ? <img src={ci.product.images[0]} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/> : '🥬'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700 }}>{ci.product.name}</div>
                <div style={{ fontSize: 12, color: '#666' }}>
                  {currency(ci.product.price)} / {ci.product.unit}
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 6, alignItems: 'center' }}>
                  <button className="btn" onClick={() => d({ type: 'UPDATE_QTY', id: ci.id, qty: ci.qty - 1 })}>-</button>
                  <input
                    className="input"
                    style={{ width: 70, textAlign: 'center' }}
                    type="number"
                    value={ci.qty}
                    onChange={(e) => d({ type: 'UPDATE_QTY', id: ci.id, qty: Number(e.target.value) })}
                    min={1}
                  />
                  <button className="btn" onClick={() => d({ type: 'UPDATE_QTY', id: ci.id, qty: ci.qty + 1 })}>+</button>
                  <button className="btn" onClick={() => { console.log('[Cart] remove item', ci.id); d({ type: 'REMOVE', id: ci.id }) }}>ลบ</button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* footer (sticky) */}
      <div
        style={{
          position: 'sticky',
          bottom: 0,
          zIndex: 2,
          background: '#fff',
          borderTop: '1px solid #e5e7eb',
          padding: 12,
          boxShadow: '0 -6px 12px rgba(0,0,0,.05)',
          borderBottomLeftRadius: 16
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>ยอดรวม</span>
          <b style={{ fontSize: 16 }}>{currency(subtotal)}</b>
        </div>
        <button
          className="btn"
          style={{
            width: '100%', marginTop: 10,
            background: '#16a34a', color: '#fff', borderColor: '#16a34a',
            fontWeight: 800, height: 42
          }}
          disabled={items.length === 0}
          onClick={() => {
            if (!isAuthed()) {
              console.log('[checkout] not authed → open login modal')
              alert('กรุณาเข้าสู่ระบบก่อนทำการชำระเงิน')
              onOpenAuth?.('login'); return
            }
            setShowCheckout(true)
          }}
        >
          ดำเนินการชำระเงิน
        </button>
      </div>
    </aside>
  </div>
      )}

      {/* Modal: Checkout */}
      {showCheckout && <CheckoutModal subtotal={subtotal} onClose={()=>setShowCheckout(false)} onPlaceOrder={placeOrder} />}

      {/* PromptPay Modal */}
      <PromptPayModal open={ppOpen} onClose={()=>setPpOpen(false)} payload={ppPayload} />
    </div>
  )
}

/** Checkout Modal (Styled + Loading) */
function CheckoutModal({ subtotal, onClose, onPlaceOrder }){
  const [deliveryMethod,setDeliveryMethod] = useState('pickup')
  const [address,setAddress] = useState('')
  const [payment,setPayment] = useState('cod')
  const [loading, setLoading] = useState(false)

  console.log('[CheckoutModal] render', { deliveryMethod, payment, subtotal })

  async function handleConfirm(){
    try{
      setLoading(true)
      console.log('[Checkout] confirm clicked')
      await onPlaceOrder({ deliveryMethod, address, payment })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 overlay"
      style={{ background:'rgba(0,0,0,.55)', backdropFilter:'blur(2px)', display:'grid', placeItems:'center', padding:16 }}
      onClick={onClose}
    >
      <div
        role="dialog" aria-modal="true" aria-label="เช็คเอาต์"
        className="card modal-pop"
        style={{
          maxWidth:560, width:'100%',
          borderRadius:16,
          border:'2px solid #16a34a',
          background:'#dcfce7',
          boxShadow:'0 16px 40px rgba(22,163,74,.25)',
          overflow:'hidden'
        }}
        onClick={(e)=>e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display:'flex', alignItems:'center', justifyContent:'space-between',
            padding:'12px 14px',
            background:'linear-gradient(90deg,#16a34a,#22c55e)',
            color:'#fff'
          }}
        >
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <div style={{width:36,height:36,borderRadius:10,background:'rgba(255,255,255,.22)',display:'grid',placeItems:'center',fontSize:20}}>🧾</div>
            <b style={{letterSpacing:.2}}>ทำการสั่งซื้อ</b>
          </div>
          <button className="btn" onClick={onClose} style={{background:'#fff', borderColor:'#fff'}}>ปิด</button>
        </div>

        <div className="grid" style={{gap:12, padding:14}}>
          {/* Steps (visual only) */}
          <div style={{display:'flex',gap:10,alignItems:'center',justifyContent:'center', marginBottom:2}}>
            {['จัดส่ง','ชำระเงิน','ยืนยัน'].map((t,i)=>(
              <div key={t} style={{display:'flex',alignItems:'center',gap:8}}>
                <div style={{
                  width:22,height:22,borderRadius:'50%',
                  background: i<2? '#16a34a':'#22c55e',
                  color:'#fff', display:'grid', placeItems:'center', fontSize:12, fontWeight:800
                }}>{i+1}</div>
                <div style={{fontSize:12, color:'#14532d'}}>{t}</div>
                {i<2 && <div style={{width:28,height:2,background:'#86efac',borderRadius:2}}/>}
              </div>
            ))}
          </div>

          {/* วิธีจัดส่ง */}
          <div>
            <div style={{fontWeight:800, color:'#14532d', marginBottom:6}}>วิธีจัดส่ง</div>
            <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
              <label
                style={{
                  display:'flex', alignItems:'center', gap:8,
                  padding:'8px 10px', borderRadius:10,
                  border:'2px solid ' + (deliveryMethod==='pickup'?'#16a34a':'#bbf7d0'),
                  background: deliveryMethod==='pickup' ? '#bbf7d0' : '#fff',
                  cursor:'pointer'
                }}
              >
                <input type="radio" checked={deliveryMethod==='pickup'} onChange={()=>{ console.log('[Checkout] set delivery=pickup'); setDeliveryMethod('pickup') }} />
                รับที่ร้าน
              </label>
              <label
                style={{
                  display:'flex', alignItems:'center', gap:8,
                  padding:'8px 10px', borderRadius:10,
                  border:'2px solid ' + (deliveryMethod==='delivery'?'#16a34a':'#bbf7d0'),
                  background: deliveryMethod==='delivery' ? '#bbf7d0' : '#fff',
                  cursor:'pointer'
                }}
              >
                <input type="radio" checked={deliveryMethod==='delivery'} onChange={()=>{ console.log('[Checkout] set delivery=delivery'); setDeliveryMethod('delivery') }} />
                ส่งถึงบ้าน
              </label>
            </div>
            {deliveryMethod==='delivery' && (
              <input
                className="input"
                placeholder="ที่อยู่สำหรับจัดส่ง"
                value={address}
                onChange={e=>setAddress(e.target.value)}
                style={{marginTop:8, background:'#fff'}}
              />
            )}
          </div>

          {/* การชำระเงิน */}
          <div>
            <div style={{fontWeight:800, color:'#14532d', marginBottom:6}}>การชำระเงิน</div>
            <select
              className="input"
              value={payment}
              onChange={e=>{ console.log('[Checkout] set payment', e.target.value); setPayment(e.target.value) }}
              style={{background:'#fff'}}
            >
              <option value="cod">ชำระปลายทาง</option>
              <option value="transfer">โอนผ่านธนาคาร</option>
              <option value="promptpay">PromptPay (Sandbox)</option>
              <option value="internet_banking_bbl">อินเทอร์เน็ตแบงก์กิ้ง (BBL)</option>
            </select>
            <div style={{fontSize:12, color:'#166534', marginTop:6, opacity:.9}}>
              * ชำระปลายทาง: ระบบเริ่มดำเนินการทันที • วิธีอื่น ๆ: จะสร้างการชำระเงินหลังยืนยัน
            </div>
          </div>

          {/* สรุปยอด */}
          <div style={{
            display:'flex', justifyContent:'space-between', alignItems:'center',
            padding:'10px 12px',
            borderTop:'1px dashed #86efac',
            borderBottom:'1px dashed #86efac',
            background:'#eafff1', borderRadius:10
          }}>
            <span style={{color:'#14532d'}}>ยอดชำระ</span>
            <b style={{fontSize:20}}>{currency(subtotal)}</b>
          </div>

          {/* ปุ่ม */}
          <div style={{display:'flex', gap:8, justifyContent:'flex-end'}}>
            <button className="btn" onClick={onClose}>ยกเลิก</button>
            <button
              className="btn"
              onClick={()=>{ console.log('[Checkout] confirm order'); onPlaceOrder({ deliveryMethod, address, payment }) }}
              style={{background:'#16a34a', color:'#fff', borderColor:'#16a34a', fontWeight:800, height:42, minWidth:130}}
            >
              ยืนยัน
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
