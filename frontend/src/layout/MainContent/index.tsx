import Navbar from "../../components/Navbar";

export default function MainContent({children} : any){
    return (
        <div>
            <div className="flex flex-col min-h-screen w-full bg-black overflow-hidden">
                <Navbar/>
                {children}
            </div>
        </div>
    )
}