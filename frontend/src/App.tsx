import { BrowserRouter, Route, Routes } from "react-router-dom";
// import Authentication from "./pages/Authentication";
import Dashboard from "./pages/Dashboard";
import { ProtectedRoute } from "./layout/ProtectedLayout";
import Profile from "./pages/Profile";
import Transfer from "./pages/Transfer";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<ProtectedRoute/>}>
          <Route path="/profile" element={<Profile/>}/>
          <Route path="/transfer" element={<Transfer/>}/>
        </Route>
        <Route path="/" element={<Dashboard/>}/>

      </Routes>
    </BrowserRouter>
  )
}


