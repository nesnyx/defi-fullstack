import { balanceOf } from "../../api";
import { useAuth } from "../../components/context";
import MainContent from "../../layout/MainContent";
import { formatUnits } from "viem";


export default function Profile(){
    const {address} = useAuth()
    const {balance, isLoading, error} : any = balanceOf(address)
    if (isLoading) return <p>Loading...</p>
    if (error) return <p>Error: {error.message}</p>
    return(
        <MainContent>
            <div className="flex justify-center text-white">
                <div className="pt-20">
                    <p className="text-2xl bg-red-400 w-1/4 text-white">Wallet Address</p>
                    <p className="text-3xl">{address}</p>
                    <p>
                        Balance: {balance ? formatUnits(balance, 18) : 'Loading...'} SCPE
                    </p>
                </div>
            </div>
        </MainContent>
    )
}