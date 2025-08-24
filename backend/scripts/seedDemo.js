import 'dotenv/config'
import mongoose from 'mongoose'
import bcrypt from 'bcrypt'
import User from '../src/models/User.js'
import Product from '../src/models/Product.js'
import Order from '../src/models/Order.js'

await mongoose.connect(process.env.MONGO_URI)
console.log('[seed] connected')

const buyerDocs=[]
for (const b of buyers){
  const passwordHash = await bcrypt.hash(b.password, 12)
  let u = await User.findOne({ email:b.email })
  if (!u) u = await User.create({ name:b.name, email:b.email.toLowerCase(), phone:b.phone, passwordHash, role:'buyer', addresses:[{ line:b.address }] })
  else await User.updateOne({ _id:u._id }, { name:b.name, phone:b.phone, passwordHash, role:'buyer' })
  buyerDocs.push(u)
}
const prodDocs=[]
for (const p of products){
  let d = await Product.findOne({ name:p.name })
  if (!d) d = await Product.create(p)
  else await Product.updateOne({ _id:d._id }, p)
  prodDocs.push(d)
}
const u = buyerDocs[0]
if (u){
  const items=[
    { productId:String(prodDocs[0]._id), name:prodDocs[0].name, price:prodDocs[0].price, qty:2 },
    { productId:String(prodDocs[3]._id), name:prodDocs[3].name, price:prodDocs[3].price, qty:1 }
  ]
  const total = items.reduce((s,i)=> s+i.price*i.qty, 0)
  const exists = await Order.findOne({ user:u._id })
  if (!exists) await Order.create({ user:u._id, items, total, status:'processing', paymentMethod:'cod', deliveryMethod:'delivery', address:'กทม.' })
}
console.log('[seed] done'); process.exit(0)
