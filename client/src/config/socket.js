import {io} from 'socket.io-client'

export const socket = io(import.meta.env.VITE_SERVER_URL,{
    withCredentials:true,
    autoConnect:false,
    reconnection:true,
    reconnectionAttempts:5,
    reconnectionDelay:1000,
    reconnectionDelayMax:5000,
})

if(import.meta.env.DEV){
    socket.on('connect',()=>{console.log("connected to server with id "+socket.id)});
    socket.on('disconnect',()=>{console.log("disconnected from server with id "+socket.id)});
}

//export default socket;