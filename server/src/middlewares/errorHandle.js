import logger from "../utils/logger.js";

export function errorHandle(err,req,res,next){
    logger.error({
        message:err.message,
        stack:err.stack,
        url:req.url,
        method:req.method,
    })
    const status = err.status || 500
    const message = err.message || "Internal Server Error"
    res.status(status).json({message})
}

export const asyncHandler = (fn)=>(req,res,next)=>{
  Promise.resolve(fn(req,res,next)).catch(next)
}