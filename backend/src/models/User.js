import mongoose from 'mongoose'
const AddressSchema = new mongoose.Schema({ line:String, phone:String, note:String }, { _id:false })
const RefreshSchema = new mongoose.Schema({ tokenHash:String, expiresAt:Date, createdAt:{type:Date,default:Date.now} }, { _id:false })
const schema = new mongoose.Schema({
  name:{type:String,required:true},
  email:{type:String,required:true,unique:true,index:true},
  phone:String,
  passwordHash:String,
  role:{type:String,enum:['buyer','admin'],default:'buyer'},
  addresses:[AddressSchema],
  defaultAddressIndex:{type:Number,default:0},
  loginAttempts:{type:Number,default:0},
  lockUntil:{type:Date,default:null},
  refreshTokens:[RefreshSchema]
},{timestamps:true})
export default mongoose.model('User', schema)
