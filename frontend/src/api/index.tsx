import { useReadContract } from 'wagmi'
import abi from './abi.json'

const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3"
export const balanceOf = (address : string) =>{
  const { data: balance, isLoading, error } : any = useReadContract({
      address: CONTRACT_ADDRESS,
      abi: abi,
      functionName: 'balanceOf',
      args: [address],
  })
  return {balance,isLoading,error}
}