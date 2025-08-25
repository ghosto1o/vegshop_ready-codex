import 'dotenv/config'
import mongoose from 'mongoose'
import bcrypt from 'bcrypt'
import User from '../src/models/User.js'
import Product from '../src/models/Product.js'
import Order from '../src/models/Order.js'

await mongoose.connect(process.env.MONGO_URI)
console.log('[seed] connected')

const buyers=[
  { name:'คุณเอ', email:'a@example.com', phone:'0810001111', password:'123456', address:'กทม.' },
  { name:'คุณบี', email:'b@example.com', phone:'0810002222', password:'123456', address:'นนทบุรี' },
]
const products=[
  { name:"คะน้าฮ่องกง", description:"คะน้าอ่อน กรอบหวาน", category:"veg", unit:"กก.", price:55, stock:32, rating:4.6, images:["🥬"] },
  { name:"ผักกาดหอม", description:"สดกรอบ พร้อมทาน", category:"veg", unit:"กก.", price:49, stock:24, rating:4.4, images:["🥗"] },
  { name:"แตงกวา", description:"แตงกรอบ น้ำเยอะ", category:"veg", unit:"กก.", price:39, stock:50, rating:4.7, images:["🥒"] },
  { name:"มะเขือเทศเชอรี่", description:"หวาน สีสด", category:"fruit", unit:"กล่อง", price:65, stock:18, rating:4.8, images:["🍅"] },
  { name:"มะม่วงน้ำดอกไม้", description:"หวานหอม เนื้อฉ่ำ", category:"fruit", unit:"กก.", price:89, stock:20, rating:4.7, images:["🥭"] },
  { name:"โหระพา", description:"กลิ่นหอม กำใหญ่", category:"herb", unit:"กำ", price:15, stock:100, rating:4.5, images:["🌿"] }
]

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
