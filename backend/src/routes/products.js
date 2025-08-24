import { Router } from 'express'
import Product from '../models/Product.js'
import auth from '../middleware/auth.js'
import role from '../middleware/role.js'
import multer from 'multer'
import path from 'path'
import fs from 'fs'

const uploadDir = 'uploads'
fs.mkdirSync(uploadDir, { recursive: true })
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
})
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 5 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true)
    else cb(new Error('only image files'))
  }
})

const router = Router()
router.get('/', async (_req,res)=>{ const items = await Product.find().sort({createdAt:-1}).lean(); res.json({ items }) })
router.post('/', auth, role('admin'), async (req,res)=>{ const item = await Product.create(req.body); res.json({ item }) })
router.post('/upload', auth, role('admin'), upload.array('images', 5), (req,res)=>{
  const files = req.files || []
  if (!files.length) return res.status(400).json({ message:'no file' })
  const urls = files.map(f => `${req.protocol}://${req.get('host')}/uploads/${f.filename}`)
  res.json({ urls })
})
router.put('/:id', auth, role('admin'), async (req,res)=>{ const item = await Product.findByIdAndUpdate(req.params.id, req.body, { new:true }); if (!item) return res.status(404).json({ message:'not found' }); res.json({ item }) })
router.delete('/:id', auth, role('admin'), async (req,res)=>{ const item = await Product.findByIdAndDelete(req.params.id); if (!item) return res.status(404).json({ message:'not found' }); res.json({ ok:true }) })
export default router
