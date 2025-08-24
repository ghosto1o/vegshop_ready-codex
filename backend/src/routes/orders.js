import { Router } from 'express'
import Order from '../models/Order.js'
import Product from '../models/Product.js'
import auth from '../middleware/auth.js'

const router = Router()
router.use((req,res,next)=>{ console.log('[orders] incoming', req.method, req.originalUrl); next() })
router.use(auth)

// สร้างคำสั่งซื้อ (กำหนดสถานะเริ่มต้นจากวิธีชำระเงิน)
router.post('/', async (req,res)=>{
  try{
    if (!req.user?._id) return res.status(401).json({ message:'unauthorized' })
    const { items, total, paymentMethod, deliveryMethod, address } = req.body
    if (!Array.isArray(items) || items.length===0) return res.status(400).json({ message:'no items' })

    // ตรวจสต็อก
    for (const it of items){
      const p = await Product.findById(it.productId)
      if (!p || p.stock < it.qty) return res.status(400).json({ message:`stock not enough for ${it?.name||it.productId}` })
    }
    for (const it of items){ await Product.updateOne({ _id: it.productId }, { $inc: { stock: -it.qty } }) }

    // กำหนดสถานะเริ่มต้น
    const initialStatus = paymentMethod === 'cod' ? 'กำลังดำเนินการ' : 'รอการชำระเงิน'

    const order = await Order.create({
      user: req.user._id,
      items, total,
      status: initialStatus,
      paymentMethod, deliveryMethod, address
    })
    console.log('[orders] created', order._id.toString(), 'by', req.user.email, 'status=', initialStatus)
    res.json({ orderId: order._id })
  }catch(e){ console.log('[orders] error', e.message); res.status(500).json({ message:'order error' }) }
})

// ดูคำสั่งซื้อของฉัน
router.get('/me', async (req,res)=>{
  const orders = await Order.find({ user: req.user._id }).sort({createdAt:-1}).lean()
  res.json({ orders })
})

// ยกเลิกคำสั่งซื้อของฉัน (ถ้ายังไม่กำลังจัดส่ง/จัดส่งแล้ว/ยกเลิก)
router.post('/:id/cancel', async (req,res)=>{
  try{
    const o = await Order.findOne({ _id: req.params.id, user: req.user._id })
    if (!o) return res.status(404).json({ message:'not found' })
    const notAllowed = ['กำลังจัดส่ง','จัดส่งแล้ว','ยกเลิก']
    if (notAllowed.includes(o.status)) {
      console.log('[orders] cancel blocked', o._id.toString(), 'status=', o.status)
      return res.status(400).json({ message:'ไม่สามารถยกเลิกออเดอร์ในสถานะปัจจุบันได้' })
    }
    o.status = 'ยกเลิก'
    await o.save()
    console.log('[orders] cancelled', o._id.toString())
    res.json({ ok:true })
  }catch(e){
    console.log('[orders] cancel error', e.message)
    res.status(500).json({ message:'cancel error' })
  }
})

export default router
