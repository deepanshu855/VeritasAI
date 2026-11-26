import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import AeroBackground from "./AeroBackground";
import PublicNavbar from "./PublicNavbar";
import { useAeroBackgroundProps } from "../hooks/useAeroBackgroundProps";
import "../styles/public.css";

export default function PublicLayout() {
  const bgProps = useAeroBackgroundProps();
  const { pathname } = useLocation();
  const isLanding = pathname === "/";

  useEffect(() => {
    document.documentElement.classList.add("vpub-root");
    return () => {
      document.documentElement.classList.remove("vpub-root");
    };
  }, []);

  return (
    <>
      <AeroBackground {...bgProps} />
      <div
        className={`vpub-scrim ${isLanding ? "vpub-scrim--landing" : "vpub-scrim--auth"}`}
      />
      <div className="vpub-shell">
        <PublicNavbar />
        <Outlet />
      </div>
    </>
  );
}
