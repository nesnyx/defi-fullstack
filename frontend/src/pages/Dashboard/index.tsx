import MainContent from "../../layout/MainContent";


export default function Dashboard(){
    return (
        <MainContent>
          
            <div className="flex justify-center pt-60 w-full text-white">
                <div className="flex w-full justify-between">
                    <div className="flex flex-col px-10 w-full justify-center items-center">
                        <h1 className="text-8xl font-bold pb-10">Scape</h1>
                        <p>Blockchain and DeFi Modern</p>
                    </div>
                    <div className="flex flex-col px-10 w-full justify-center items-center">
                        <p>building and using the most transformative apps and blockchains.</p>
                    </div>
                </div>
            </div>
            
        </MainContent>
    )
}