import { Router } from 'express'
import Order from '../models/Order.js'
import { buildPromptPayQR } from '../utils/promptpay.js'
const router = Router()
function omiseAuthHeader(){ const key = process.env.OPN_SECRET_KEY || process.env.OMISE_SECRET_KEY; const b64 = Buffer.from(`${key}:`).toString('base64'); return `Basic ${b64}` }
router.post('/create-intent', async (req,res)=>{
  try{
    const { orderId, method } = req.body
    const provider = (process.env.PAYMENT_PROVIDER||'promptpay').toLowerCase()
    const order = await Order.findById(orderId)
    if (!order) return res.status(404).json({ message:'order not found' })
    if (provider==='promptpay'){
      const payload = buildPromptPayQR({ mobile: process.env.PROMPTPAY_MOBILE || '0810000000', amount: order.total, name: process.env.PROMPTPAY_NAME || 'VEG SHOP', city: process.env.PROMPTPAY_CITY || 'BANGKOK' })
      await Order.updateOne({ _id: orderId }, { status:'processing' })
      return res.json({ provider:'promptpay', payload })
    }
    const amount = Math.round(order.total * 100)
    const srcResp = await fetch('https://api.omise.co/sources', { method:'POST', headers:{ 'Authorization': omiseAuthHeader(), 'Content-Type':'application/x-www-form-urlencoded' }, body: new URLSearchParams({ type: method || 'internet_banking_bbl', amount: String(amount), currency:'thb' }) })
    const src = await srcResp.json()
    if (!src.id) return res.status(400).json({ message:'cannot create source', detail: src })
    const returnUri = process.env.OPN_RETURN_URL || 'http://localhost:5173/profile'
    const chResp = await fetch('https://api.omise.co/charges', { method:'POST', headers:{ 'Authorization': omiseAuthHeader(), 'Content-Type':'application/x-www-form-urlencoded' }, body: new URLSearchParams({ amount:String(amount), currency:'thb', source:src.id, return_uri:returnUri, 'metadata[orderId]': String(orderId) }) })
    const charge = await chResp.json()
    if (!charge.id) return res.status(400).json({ message:'cannot create charge', detail: charge })
    await Order.updateOne({ _id: orderId }, { chargeId: charge.id, status:'processing' })
    res.json({ chargeId: charge.id, authorize_uri: charge.authorize_uri })
  }catch(e){ console.log('[payments] error', e); res.status(500).json({ message:'payment error' }) }
})
export default router
