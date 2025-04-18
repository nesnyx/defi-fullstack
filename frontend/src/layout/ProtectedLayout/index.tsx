import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../components/context";



export const ProtectedRoute = () => {
    const {isConnected} = useAuth()
    if (!isConnected) {
        return <Navigate to={"/"}/>
    }

    return <Outlet/>
}