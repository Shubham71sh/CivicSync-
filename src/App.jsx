import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import DashboardLayout from "./layouts/DashboardLayout";
import DashboardOverview from "./pages/DashboardOverview";
import CitizenOverview from "./pages/CitizenOverview";
import BillSimplifier from "./pages/BillSimplifier";
import CivicGPS from "./pages/CivicGPS";
import FraudWatch from "./pages/FraudWatch";
import AIChat from "./pages/AIChat";
import SentimentAnalyzer from "./pages/SentimentAnalyzer";
import ImpactSimulator from "./pages/ImpactSimulator";
import Roadmap from "./pages/Roadmap";
import Archive from "./pages/Archive";
import Settings from "./pages/Settings";
import Support from "./pages/Support";
import TownhallEvents from "./pages/TownhallEvents";
import CompareBills from "./pages/CompareBills";
import MyProfile from "./pages/MyProfile";
import Notifications from "./pages/Notifications";
import GenericPage from "./pages/GenericPage";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import UploadBill from "./pages/UploadBill";
import { CheckSquare, Target, History, Bookmark, BarChart2 } from "lucide-react";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/upload" element={<UploadBill />} />
        
        {/* Dashboard Routes with Sidebar/Layout */}
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<DashboardOverview />} />
          <Route path="/citizen" element={<CitizenOverview />} />
          <Route path="/bills" element={<BillSimplifier />} />
          <Route path="/gps" element={<CivicGPS />} />
          <Route path="/fraud" element={<FraudWatch />} />
          <Route path="/chat" element={<AIChat />} />
          <Route path="/sentiment" element={<SentimentAnalyzer />} />
          <Route path="/impact" element={<ImpactSimulator />} />
          <Route path="/roadmap" element={<Roadmap />} />
          <Route path="/townhall" element={<TownhallEvents />} />
          <Route path="/archive" element={<Archive />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/support" element={<Support />} />
          
          {/* New Pages */}
          <Route path="/compare" element={<CompareBills />} />
          <Route path="/profile" element={<MyProfile />} />
          <Route path="/notifications" element={<Notifications />} />
          
          {/* Generic Stubs */}
          <Route path="/eligibility" element={<GenericPage title="Eligibility Checker" description="Verify your eligibility across 100+ local and federal programs." icon={CheckSquare} />} />
          <Route path="/benefits" element={<GenericPage title="Benefits Tracker" description="Track the status and timeline of your claimed benefits." icon={Target} />} />
          <Route path="/analyses" element={<GenericPage title="My Analyses" description="Review past bills you've processed through CivicSync AI." icon={History} />} />
          <Route path="/saved" element={<GenericPage title="Saved Bills" description="Manage and organize legislation you're tracking." icon={Bookmark} />} />
          <Route path="/reports" element={<GenericPage title="Reports & Analytics" description="Generate deep insights and export PDF/CSV data." icon={BarChart2} />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
