import mongoose from 'mongoose'
const ItemSchema = new mongoose.Schema({ productId:String, name:String, price:Number, qty:Number }, { _id:false })
const schema = new mongoose.Schema({
  user:{ type: mongoose.Types.ObjectId, ref:'User', required:true },
  items:[ItemSchema],
  total:Number,
  status:{ type:String, default:'processing' },
  paymentMethod:String,
  deliveryMethod:String,
  address:String,
  chargeId:String
},{timestamps:true})
export default mongoose.model('Order', schema)
