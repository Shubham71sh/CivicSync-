import { Outlet } from "react-router-dom";
import Navbar from "../components/shared/Navbar";
import Footer from "../components/shared/Footer";

/**
 * LandingLayout
 * Wraps all public marketing pages with the top Navbar and Footer.
 * Pages: Home, Features, About, Contact
 */
export default function LandingLayout() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-hidden">
      <Navbar />
      <main>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
