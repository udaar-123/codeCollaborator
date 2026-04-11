
import { io } from "socket.io-client"

const socket = io(import.meta.env.VITE_SERVER_URL || "http://localhost:3000", {
    withCredentials: true,
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
})

if(import.meta.env.DEV){
    socket.on('connect',()=>{console.log("✅ Connected to server with id: "+socket.id)});
    socket.on('disconnect',()=>{console.log("❌ Disconnected from server")});
    socket.on('connect_error', (error) => console.error("🔴 Socket error:", error));
}

export { socket }