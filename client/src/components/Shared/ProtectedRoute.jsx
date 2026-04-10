import {Navigate} from "react-router-dom";
import {useAuth} from "../../context/AuthContext";

export const ProtectedRoute = ({children})=>{
    const {user,loading} = useAuth();
    if(loading){
        return <div
        style={{
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center", 
        height: "100vh",
        color: "#fff",
        background: "#1e1e1e"
        }}
        >Loading...</div>
    }
    if(!user){
        return <Navigate to="/login" replace />
    }
    return children;
}
