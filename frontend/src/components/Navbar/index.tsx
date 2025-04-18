import { Link } from "react-router-dom";
import ButtonAuth from "../Auth";

export default function Navbar() {
    return (
        <nav className="bg-white shadow-md p-4 w-full z-10">
          <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex-shrink-0 flex items-center">
                <span className="font-bold text-4xl text-blue-600"><Link to={"/"}>SCAPE</Link></span>
              </div>
              <div className="hidden md:flex space-x-8 items-center">
              
              
                <ButtonAuth/>
              
              </div>
            </div>
          </div>
      </nav>
    )
}