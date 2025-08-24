import { Router } from 'express'
import auth from '../middleware/auth.js'
import User from '../models/User.js'
const router = Router()
router.use(auth)
router.get('/addresses', async (req,res)=>{ const u = await User.findById(req.user._id).lean(); const addresses = u?.addresses || []; const defaultIndex = Math.min(u?.defaultAddressIndex ?? 0, Math.max(addresses.length-1, 0)); res.json({ addresses, defaultIndex }) })
router.post('/addresses', async (req,res)=>{ const { line='', phone='', note='' } = req.body || {}; const u = await User.findById(req.user._id); if (!u.addresses) u.addresses=[]; u.addresses.push({ line, phone, note }); if (u.addresses.length===1) u.defaultAddressIndex=0; await u.save(); res.json({ ok:true }) })
router.put('/addresses/:index', async (req,res)=>{ const idx = Number(req.params.index); const { line, phone, note } = req.body || {}; const u = await User.findById(req.user._id); if (!u.addresses || idx<0 || idx>=u.addresses.length) return res.status(404).json({ message:'not found' }); u.addresses[idx] = { line: line ?? u.addresses[idx].line, phone: phone ?? u.addresses[idx].phone, note: note ?? u.addresses[idx].note }; await u.save(); res.json({ ok:true }) })
router.delete('/addresses/:index', async (req,res)=>{ const idx = Number(req.params.index); const u = await User.findById(req.user._id); if (!u.addresses || idx<0 || idx>=u.addresses.length) return res.status(404).json({ message:'not found' }); u.addresses.splice(idx,1); if (u.defaultAddressIndex===idx) u.defaultAddressIndex=0; else if (u.defaultAddressIndex>idx) u.defaultAddressIndex--; await u.save(); res.json({ ok:true }) })
router.patch('/addresses/default', async (req,res)=>{ const { index } = req.body || {}; const u = await User.findById(req.user._id); if (!u.addresses || index<0 || index>=u.addresses.length) return res.status(400).json({ message:'invalid index' }); u.defaultAddressIndex=index; await u.save(); res.json({ ok:true }) })
export default router
