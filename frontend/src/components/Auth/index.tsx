import { Link } from 'react-router-dom'
import { useAccount, useConnect, useDisconnect } from 'wagmi'


export default function ButtonAuth() {
    const account = useAccount()
    
    const { connectors, connect } = useConnect()
    const { disconnect } = useDisconnect()
    return (
        <>
            {account.status === "connected" ? (
                <div className='flex gap-4 items-center'>
                    <p className='bg-blue-400 px-4 py-2 rounded-xl text-white'>{(account.addresses)}</p>
                    
                    <button className='border rounded-lg px-4 py-2' type="button" onClick={() => disconnect()}>
                       Disconnect
                    </button>
                    <Link to={"/profile"} className='border rounded-lg px-4 py-2'>Profile</Link>
                    <Link to={"/transfer"} className='border rounded-lg px-4 py-2'>Transfer</Link>
                </div>
                     
            ) : <button className="bg-blue-600 rounded-lg px-4 py-2 text-white" >

                    {connectors.map((connector) => (
                    <button
                        key={connector.uid}
                        onClick={() => connect({ connector })}
                        type="button"
                    >
                        <div className='flex gap-2 items-center justify-center'>
                        <p>connect</p> <img src={connector.icon} width={20} alt="" />
                        </div>
                    </button>
                    ))}
                </button>
            }
        </>
    )
}