import 'dotenv/config'
import mongoose from 'mongoose'
import bcrypt from 'bcrypt'
import User from '../src/models/User.js'
const [,, email, password] = process.argv
if (!email || !password){ console.log('Usage: node scripts/seedAdmin.js <email> <password>'); process.exit(1) }
await mongoose.connect(process.env.MONGO_URI)
const passwordHash = await bcrypt.hash(password, 12)
let u = await User.findOne({ email: email.toLowerCase() })
if (!u) u = await User.create({ name:'Admin', email: email.toLowerCase(), passwordHash, role:'admin' })
else await User.updateOne({ _id: u._id }, { passwordHash, role:'admin', name:'Admin' })
console.log('[seedAdmin] done:', email); process.exit(0)
