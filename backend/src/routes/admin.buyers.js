import { Router } from 'express'
import User from '../models/User.js'
import bcrypt from 'bcrypt'
import role from '../middleware/role.js'
const router = Router()
router.use(role('admin'))
router.get('/buyers', async (_req,res)=>{ const buyers = await User.find({ role:'buyer' }).lean(); res.json({ buyers }) })
router.post('/buyers', async (req,res)=>{ const { name, phone, email, address, password } = req.body; const passwordHash = password? await bcrypt.hash(password, 12) : undefined; const u = await User.create({ name, phone, email:(email||'').toLowerCase(), passwordHash, role:'buyer', addresses: address? [{ line:address }]:[] }); res.json({ buyer:{ id:u._id, name:u.name, email:u.email } }) })
router.put('/buyers/:id', async (req,res)=>{ const patch = req.body; if (patch.address){ patch.addresses=[{ line:patch.address }]; delete patch.address } const u = await User.findByIdAndUpdate(req.params.id, patch, { new:true }); if (!u) return res.status(404).json({ message:'not found' }); res.json({ buyer:{ id:u._id, name:u.name, email:u.email } }) })
router.delete('/buyers/:id', async (req,res)=>{ await User.findByIdAndDelete(req.params.id); res.json({ ok:true }) })
router.post('/buyers/:id/set-password', async (req,res)=>{ const { password } = req.body; const passwordHash = await bcrypt.hash(password, 12); await User.updateOne({ _id:req.params.id }, { passwordHash }); res.json({ ok:true }) })
export default router
