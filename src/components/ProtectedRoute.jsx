import { Navigate } from "react-router-dom";
import validator from 'validator';
export default function ProtectedRoute({ children }) {
    if (!localStorage.getItem("token")) {
        return (
            <Navigate to={"/login"} />
        )
    }
    if (!validator.isJWT(localStorage.getItem("token"))) {
        window.alert("Token em Formato Inválido")
        return (
            <Navigate to={"/login"} />
        )
    }
    return children
    
}