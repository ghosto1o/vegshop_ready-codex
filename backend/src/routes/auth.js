import { Router } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import rateLimit from 'express-rate-limit'
import { z } from 'zod'
import User from '../models/User.js'
import auth from '../middleware/auth.js'

const router = Router()
const ACCESS_TTL = '15m'
const REFRESH_TTL_MS = 7*24*60*60*1000
const BCRYPT_ROUNDS = 12
const MAX_ATTEMPTS = 5
const LOCK_MS = 15*60*1000

function signAccessToken(sub){ return jwt.sign({ sub }, process.env.JWT_SECRET, { expiresIn: ACCESS_TTL }) }
function hashRefreshToken(token){ return crypto.createHash('sha256').update(token).digest('hex') }
function newRefreshToken(){ return crypto.randomBytes(48).toString('base64url') }
function setRefreshCookie(res, token){
  res.cookie('veg_refresh', token, { httpOnly:true, secure: process.env.NODE_ENV === 'production', sameSite:'lax', path:'/auth/refresh', maxAge:REFRESH_TTL_MS })
}

const regSchema = z.object({ name:z.string().min(1), email:z.string().email(), phone:z.string().optional(), password:z.string().min(6), addressLine:z.string().optional(), addressPhone:z.string().optional(), addressNote:z.string().optional() })
const loginSchema = z.object({ email:z.string().email(), password:z.string().min(1) })

const authLimiter = rateLimit({ windowMs:10*60*1000, max:50, standardHeaders:true, legacyHeaders:false })

router.post('/register', authLimiter, async (req,res)=>{
  try{
    const input = regSchema.parse(req.body)
    const email = input.email.toLowerCase()
    const exists = await User.findOne({ email }); if (exists) return res.status(400).json({ message:'email exists' })
    const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS)
    const addresses = input.addressLine ? [{ line:input.addressLine, phone:input.addressPhone || input.phone || '', note:input.addressNote || '' }] : []
    const user = await User.create({ name:input.name, email, phone:input.phone, passwordHash, role:'buyer', addresses, defaultAddressIndex: addresses.length? 0: 0 })
    const access = signAccessToken(user._id)
    const refresh = newRefreshToken(); const tokenHash = hashRefreshToken(refresh)
    user.refreshTokens.push({ tokenHash, expiresAt: new Date(Date.now()+REFRESH_TTL_MS) }); await user.save()
    setRefreshCookie(res, refresh); res.json({ accessToken: access, user:{ id:user._id, name:user.name, email:user.email, role:user.role } })
  }catch(e){ if (e.name==='ZodError') return res.status(400).json({ message:'invalid input' }); res.status(500).json({ message:'register error' }) }
})

router.post('/login', authLimiter, async (req,res)=>{
  try{
    const { email, password } = loginSchema.parse(req.body)
    const user = await User.findOne({ email: email.toLowerCase() })
    const now = Date.now()
    if (!user){ await new Promise(r=>setTimeout(r,300)); return res.status(400).json({ message:'invalid credentials' }) }
    if (user.lockUntil && user.lockUntil.getTime()>now) return res.status(429).json({ message:'too many attempts, try later' })
    const ok = await bcrypt.compare(password, user.passwordHash || ''); if (!ok){ user.loginAttempts=(user.loginAttempts||0)+1; if (user.loginAttempts>=5){ user.lockUntil=new Date(now+LOCK_MS); user.loginAttempts=0 } await user.save(); return res.status(400).json({ message:'invalid credentials' }) }
    user.loginAttempts=0; user.lockUntil=null
    const access = signAccessToken(user._id)
    const refresh = newRefreshToken(); const tokenHash = hashRefreshToken(refresh)
    user.refreshTokens.push({ tokenHash, expiresAt: new Date(Date.now()+REFRESH_TTL_MS) }); if (user.refreshTokens.length>5) user.refreshTokens=user.refreshTokens.slice(-5); await user.save()
    setRefreshCookie(res, refresh); res.json({ accessToken: access, user:{ id:user._id, name:user.name, email:user.email, role:user.role } })
  }catch(e){ if (e.name==='ZodError') return res.status(400).json({ message:'invalid input' }); res.status(500).json({ message:'login error' }) }
})

router.get('/me', auth, async (req,res)=>{ const u=req.user; res.json({ user:{ id:u._id, name:u.name, email:u.email, role:u.role } }) })

router.post('/refresh', async (req,res)=>{
  try{
    const old = req.cookies?.veg_refresh; if (!old) return res.status(401).json({ message:'no refresh' })
    const oldHash = hashRefreshToken(old)
    const user = await User.findOne({ 'refreshTokens.tokenHash': oldHash })
    if (!user){ await User.updateOne({ 'refreshTokens.tokenHash': oldHash }, { $set:{ refreshTokens: [] } }); res.clearCookie('veg_refresh', { path:'/auth/refresh' }); return res.status(401).json({ message:'invalid refresh' }) }
    const entry = user.refreshTokens.find(t=>t.tokenHash===oldHash)
    if (!entry || (entry.expiresAt && entry.expiresAt.getTime()<Date.now())){ user.refreshTokens=user.refreshTokens.filter(t=>t.tokenHash!==oldHash); await user.save(); res.clearCookie('veg_refresh', { path:'/auth/refresh' }); return res.status(401).json({ message:'expired refresh' }) }
    user.refreshTokens=user.refreshTokens.filter(t=>t.tokenHash!==oldHash)
    const newRaw=newRefreshToken(); const newHash=hashRefreshToken(newRaw)
    user.refreshTokens.push({ tokenHash:newHash, expiresAt: new Date(Date.now()+REFRESH_TTL_MS) }); await user.save()
    setRefreshCookie(res, newRaw); const access=signAccessToken(user._id); res.json({ accessToken: access })
  }catch(e){ res.status(500).json({ message:'refresh error' }) }
})

router.post('/logout', async (req,res)=>{
  try{
    const raw = req.cookies?.veg_refresh
    if (raw){ const h = hashRefreshToken(raw); await User.updateOne({ 'refreshTokens.tokenHash': h }, { $pull:{ refreshTokens:{ tokenHash:h } } }) }
    res.clearCookie('veg_refresh', { path:'/auth/refresh' }); res.json({ ok:true })
  }catch(e){ res.status(500).json({ message:'logout error' }) }
})

export default router
