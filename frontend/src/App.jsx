import { useCallback, useState, lazy, Suspense } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Layout from "./components/Layout.jsx";
import LoadingScreen from "./components/LoadingScreen.jsx";
import CursorFollow from "./components/CursorFollow.jsx";
import Home from "./pages/Home.jsx";
import Menu from "./pages/Menu.jsx";
import About from "./pages/About.jsx";
import Location from "./pages/Location.jsx";
import Feedback from "./pages/Feedback.jsx";
import Register from "./pages/Register.jsx";
import Spin from "./pages/Spin.jsx";
import Wallet from "./pages/Wallet.jsx";
import { useAuth } from "./auth.jsx";

// Lazy-loaded: only downloaded when someone actually visits /admin,
// keeps the admin dashboard code out of every customer's initial bundle
const AdminLogin = lazy(() => import("./pages/admin/Login.jsx"));
const AdminStudio = lazy(() => import("./pages/admin/Studio.jsx"));

function RequireAdmin({ children }) {
  const { admin } = useAuth();
  if (!admin) return <Navigate to="/admin/login" replace />;
  return children;
}

export default function App() {
  const location = useLocation();
  const [night] = useState(true);
  const [booting, setBooting] = useState(() => !sessionStorage.getItem("fp_booted"));

  const finishBoot = useCallback(() => {
    sessionStorage.setItem("fp_booted", "1");
    setBooting(false);
  }, []);

  return (
    <>
      <AnimatePresence>{booting && <LoadingScreen onDone={finishBoot} night={night} />}</AnimatePresence>
      <CursorFollow />
      <Suspense fallback={<LoadingScreen onDone={() => {}} night={night} />}>
        <Routes location={location}>
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin/*"
            element={
              <RequireAdmin>
                <AdminStudio />
              </RequireAdmin>
            }
          />
          <Route element={<Layout night={night} />}>
            <Route path="/" element={<Home />} />
            <Route path="/menu" element={<Menu />} />
            <Route path="/about" element={<About />} />
            <Route path="/location" element={<Location />} />
            <Route path="/feedback" element={<Feedback />} />
            <Route path="/register" element={<Register />} />
            <Route path="/spin" element={<Spin />} />
            <Route path="/wallet" element={<Wallet />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </>
  );
}