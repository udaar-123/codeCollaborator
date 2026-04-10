import jwt from 'jsonwebtoken';
import User from '../models/user.schema.js'

export const verifySocketToken = async(socket,next)=>{
    try {
        const cookieHeader = socket.handshake.headers.cookie
        if(!cookieHeader) return next(new Error('No token provided'))
        const token = Object.fromEntries(cookieHeader.split(";").map(cookie => {
    const [Key , ...val] = cookie.trim().split('=')
    return [Key,val.join('=')]
     } ))

     const decode = jwt.verify(token,process.env.JWT_SECRET||modi )
     const user = await User.findById(decode.id).select('-password')
     if(!user) return next(new Error('User not found'))
     socket.user = user
     next()
    } catch (error) {
        next(new Error('Invalid token'))
    }
}
