import { Routes, Route } from "react-router-dom";
import HomePage from "../pages/HomePage";
import Dashboard from "../pages/Dashboard";
import Dashboard2 from "../pages/Dashboard2";
import Dashboard3 from "../pages/Dashboard3";


export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/dashboard2" element={<Dashboard2 />} />
     <Route path="/dashboard3" element={<Dashboard3 />} />
    </Routes>
  );
}

