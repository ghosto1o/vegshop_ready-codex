import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import mongoSanitize from 'express-mongo-sanitize'
import mongoose from 'mongoose'

import health from './routes/health.js'
import authRoutes from './routes/auth.js'
import productRoutes from './routes/products.js'
import orderRoutes from './routes/orders.js'
import adminBuyers from './routes/admin.buyers.js'
import adminOrders from './routes/admin.orders.js'
import account from './routes/account.js'
import authMw from './middleware/auth.js'
import payments from './routes/payments.js'

const app = express()
app.use(helmet({ crossOriginResourcePolicy:{ policy:'cross-origin' } }))
const allowed = (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',')
app.use(cors({ origin: allowed, credentials:true }))
app.use(express.json({ limit:'1mb' }))
app.use(express.urlencoded({ extended:true }))
app.use(cookieParser())
app.use(mongoSanitize())
app.use('/uploads', express.static('uploads'))

app.get('/', (_req,res)=> res.json({ name:'vegshop-api' }))
app.use('/health', health)
app.use('/auth', authRoutes)
app.use('/products', productRoutes)
app.use('/orders', orderRoutes)
app.use('/admin', authMw, adminBuyers)
app.use('/admin', authMw, adminOrders)
app.use('/account', account)
app.use('/payments', payments)

const PORT = process.env.PORT || 4000
mongoose.connect(process.env.MONGO_URI).then(()=>{
  app.listen(PORT, ()=> console.log(`[api] http://localhost:${PORT}`))
}).catch(err=>{ console.error('[db] error', err); process.exit(1) })
