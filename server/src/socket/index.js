import {Server} from 'socket.io';
import logger from '../utils/logger.js';
import { verifySocketToken } from '../middlewares/verifySocketToken.js'
import Room from '../models/room.schema.js';
import dotenv from 'dotenv';
dotenv.config();

export const onlineUsers = new Map()
export function initServer(server){
    const io = new Server(server,{
        cors:{
            origin:process.env.CLIENT_URL || "http://localhost:5173",
            credentials:true
        }
    })
    io.use(verifySocketToken)
    io.on("connection",(socket)=>{
        const userId = socket.user._id.tostring()
        logger.info({
            event:"user_connected",
            userId,
            socketId:socket.id,
            userId:socket.user._id
        })
        if(onlineUsers.has(userId)){
            onlineUsers.get(userId).add(socket.id)
        }else{
            onlineUsers.set(userId,new Set([socket.id]))
        }
        logger.info("a user connected with id "+socket.id);

     
        socket.on("join-room",async ({roomId})=>{
          try {
             if(!roomId)socket.emit("error","Must pass valid roomId to join socket with room")
             const room = await Room.findOne({roomId})
             if(!room){
              socket.emit("error","No room found for given roomId")
             }

             Array.from(socket.rooms)
             .filter(r => r !== socket.id)
             .forEach(r => socket.leave(r))
  
             socket.join(roomId)
             socket.currentRoom = roomId
             socket.to(roomId).emit("user-joined",{
              userId,
              name:socket.user.name
             })
              logger.info({ event: "room_joined", userId, roomId })
          } catch (error) {
             socket.emit("error", "Failed to join room")
          }
        })

        socket.on("language-change", ({ roomId, language }) => {
      socket.to(roomId).emit("language-changed", { language })
    })

      

          socket.on("leave-room",async ({roomId})=>{
            socket.leave(roomId)
            socket.to(roomId).emit("user-left",{
                userId,
                name:socket.user.name
            })
          })

 



        socket.on("disconnect",()=>{
            if(onlineUsers.has(userId)){
                onlineUsers.get(userId).delete(socket.id)
                if(onlineUsers.get(userId).size === 0){
                    onlineUsers.delete(userId)
                }

            }
            logger.info("user disconnected with id "+socket.id);
        })
        return ()=>{
            socket.disconnect();
        }
    })

    return io
}
