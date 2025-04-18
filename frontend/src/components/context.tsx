import { createContext, useContext, ReactNode } from "react";
import { useAccount, useBalance } from "wagmi";


type AuthContextType = {
    address? : `0x${string}`,
    isConnected : boolean;
}

const AuthContext = createContext<AuthContextType | any>(undefined);

export const AuthProvider = ({children} : {children : ReactNode}) => {
    const {address,isConnected } = useAccount();
    const balance  = useBalance({
        address : address,
    })
    return (
        <AuthContext.Provider value={{address, isConnected,balance}}>
                {children}
        </AuthContext.Provider>
    )
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAUth must be used within an AuthProvider")
    }
    return context
}