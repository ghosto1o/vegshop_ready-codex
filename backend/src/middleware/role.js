export default function role(required){
  return (req,res,next)=>{
    if (!req.user) return res.status(401).json({ message:'Unauthorized' })
    if (req.user.role !== required) return res.status(403).json({ message:'Forbidden' })
    next()
  }
}
