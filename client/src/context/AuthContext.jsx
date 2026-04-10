import axios from "axios";
import {socket} from "../config/socket";
import {useContext,createContext,useState,useEffect} from 'react';

const AuthContext = createContext();
const API = axios.create({
    baseURL:import.meta.env.VITE_SERVER_URL || "http://localhost:3000",
    withCredentials:true
})

export const AuthProvider = ({children})=>{
    const [user,setUser] = useState(null);
    const [loading,setLoading] = useState(true);

    useEffect( ()=>{
      const fetchUser = async()=>{
        try {
            const res = await API.get("/api/auth/me");
            setUser(res.data.user);
            socket.connect();
        } catch (error) {
            console.log("error fetching user",error);
        }finally{
            setLoading(false);
        }
      }
      fetchUser()
    },[])
     const login = async(email,password)=>{
        try {
            const res =await API.post("/api/auth/login",{email,password})
            setUser(res.data.user);
            socket.connect()
        } catch (error) {
            console.log("error in login",error);
            throw error;
        }
    }
    const register = async(name,email,password)=>{
        try {
             const res = await API.post("/api/auth/register",{name,email,password})
             setUser(res.data.user);
             socket.connect()
        } catch (error) {
            console.log("error in register",error);
        }
    }
     const logout = async(email)=>{
        try {
             const res = await API.get("/api/auth/logout",{email})
             setUser(null);
             socket.disconnect()
        } catch (error) {
            console.log("error in register",error);
        }
    }
    return (
        <AuthContext.Provider value={{user,login,logout,register,loading,socket,API}}>
         {children}
        </AuthContext.Provider>
    )

}

export const useAuth = ()=>{
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within AuthProvider")
  return context
}

export default AuthContext;