import mongoose from 'mongoose'
const schema = new mongoose.Schema({
  name:{type:String,required:true},
  description:String,
  category:{type:String,enum:['veg','fruit','herb'],default:'veg'},
  unit:{type:String,default:'กก.'},
  price:{type:Number,default:0},
  originalPrice:Number,
  stock:{type:Number,default:0},
  images:{type:[String],default:[]},
  rating:Number
},{timestamps:true})
export default mongoose.model('Product', schema)
