import { Router } from 'express'
import Order from '../models/Order.js'
import role from '../middleware/role.js'

const router = Router()
router.use(role('admin'))

router.get('/orders', async (_req,res)=>{
  const orders = await Order.find()
    .populate('user','name email')
    .sort({createdAt:-1}).lean()
  res.json({ orders })
})

router.patch('/orders/:id', async (req,res)=>{
  const { status } = req.body
  const o = await Order.findByIdAndUpdate(req.params.id, { status }, { new:true }).lean()
  if (!o) return res.status(404).json({ message:'not found' })
  res.json({ order:o })
})

export default router
