import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./routes/ProtectedRoute";
import LandingLayout from "./layouts/LandingLayout";
import DashboardLayout from "./layouts/DashboardLayout";
import DisasterRelief from "./pages/DisasterRelief";

import ErrorBoundary from "./components/ui/ErrorBoundary";
import { CheckSquare, Target, History, Bookmark, BarChart2, Search } from "lucide-react";

// ─── Public Pages ────────────────────────────────────────────────────────────
import Home from "./pages/public/Home";
import Login from "./pages/public/Login";
import Signup from "./pages/public/Signup";
import Features from "./pages/public/Features";
import About from "./pages/public/About";
import Contact from "./pages/public/Contact";
import FirebaseStatus from "./pages/public/FirebaseStatus";

// ─── Protected App Pages ─────────────────────────────────────────────────────
import Dashboard from "./pages/app/Dashboard";
import UploadBill from "./pages/app/UploadBill";
import BillHistory from "./pages/app/BillHistory";
import BillDetails from "./pages/app/BillDetails";
import AISummary from "./pages/app/AISummary";
import CompareBills from "./pages/app/CompareBills";
import AIChat from "./pages/app/AIChat";
import CivicGPS from "./pages/app/CivicGPS";
import ImpactSimulator from "./pages/app/ImpactSimulator";
import FraudWatch from "./pages/app/FraudWatch";
import TownhallEvents from "./pages/app/TownhallEvents";
import Roadmap from "./pages/app/Roadmap";
import Profile from "./pages/app/Profile";
import Notifications from "./pages/app/Notifications";
import Settings from "./pages/app/Settings";
import GenericPage from "./pages/app/GenericPage";
// ─── Module 1 Pages ──────────────────────────────────────────────────────────
import SchemeFinder from "./pages/app/SchemeFinder";
import EligibilityChecker from "./pages/app/EligibilityChecker";
import BenefitsTracker from "./pages/app/BenefitsTracker";
// ─── Module 4 Pages ──────────────────────────────────────────────────────────
import LoanAnalyzer from "./pages/app/LoanAnalyzer";
import InsuranceAnalyzer from "./pages/app/InsuranceAnalyzer";
import SchemeNotifications from "./pages/app/SchemeNotifications";

// ─────────────────────────────────────────────────────────────────────────────
// App Route Tree
//
// Structure:
//   / (public, LandingLayout)
//     ├── / → Home
//     ├── /features → Features
//     ├── /about → About
//     └── /contact → Contact
//
//   /login, /signup (standalone, no layout)
//
//   /dashboard/* (protected, ProtectedRoute → DashboardLayout)
//     ├── /dashboard → Dashboard overview
//     ├── /dashboard/upload → Upload Bill
//     ├── /dashboard/bills → Bill History
//     ├── /dashboard/ai-summary → AI Summary
//     ├── /dashboard/compare → Compare Bills
//     ├── /dashboard/chat → AI Chat
//     ├── /dashboard/gps → Civic GPS
//     ├── /dashboard/fraud → Fraud Watch
//     ├── /dashboard/impact → Impact Simulator
//     ├── /dashboard/townhall → Townhall Events
//     ├── /dashboard/roadmap → Roadmap
//     ├── /dashboard/profile → My Profile
//     ├── /dashboard/notifications → Notifications
//     ├── /dashboard/settings → Settings
//     └── Stubs: eligibility, benefits, analyses, saved, archive, reports, support, scheme
// ─────────────────────────────────────────────────────────────────────────────

function App() {
  return (
    <AuthProvider>
      <Router>
        <ErrorBoundary>
          <Routes>

            {/* ── Public Marketing Routes ── */}
            <Route element={<LandingLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/features" element={<Features />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
            </Route>

            {/* ── Auth Routes (no layout wrapper) ── */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/firebase-status" element={<FirebaseStatus />} />
            <Route
                  path="/disaster-relief"
                  element={<DisasterRelief />}
              />

            {/* ── Protected Dashboard Routes ── */}
            <Route element={<ProtectedRoute />}>
              <Route element={<DashboardLayout />}>

                {/* Core */}
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/dashboard/upload" element={<UploadBill />} />
                <Route path="/dashboard/disaster-relief" element={<DisasterRelief />} />
                <Route path="/dashboard/bills" element={<BillHistory />} />
                <Route path="/dashboard/bills/:id" element={<BillDetails />} />
                <Route path="/dashboard/ai-summary" element={<AISummary />} />
                <Route path="/dashboard/compare" element={<CompareBills />} />

                {/* AI */}
                <Route path="/dashboard/chat" element={<AIChat />} />
                <Route path="/dashboard/loan-analyzer" element={<LoanAnalyzer />} />
                <Route path="/dashboard/insurance-analyzer" element={<InsuranceAnalyzer />} />

                {/* Intelligence */}
                <Route path="/dashboard/gps" element={<CivicGPS />} />
                <Route path="/dashboard/fraud" element={<FraudWatch />} />
                <Route path="/dashboard/impact" element={<ImpactSimulator />} />
                <Route path="/dashboard/roadmap" element={<Roadmap />} />

                {/* Community */}
                <Route path="/dashboard/townhall" element={<TownhallEvents />} />

                {/* Account */}
                <Route path="/dashboard/profile" element={<Profile />} />
                <Route path="/dashboard/notifications" element={<Notifications />} />
                <Route path="/dashboard/settings" element={<Settings />} />

                {/* ── Module 1 & Module 4 Gov Services ── */}
                <Route path="/dashboard/scheme"              element={<SchemeFinder />} />
                <Route path="/dashboard/eligibility"         element={<EligibilityChecker />} />
                <Route path="/dashboard/benefits"            element={<BenefitsTracker />} />
                <Route path="/dashboard/scheme-notifications" element={<SchemeNotifications />} />

                {/* Stubs (Coming Soon) */}
                <Route path="/dashboard/analyses" element={<GenericPage title="My Analyses" description="Review past bills you've processed through CivicSync AI." icon={History} />} />
                <Route path="/dashboard/saved" element={<GenericPage title="Saved Bills" description="Manage and organize legislation you're tracking." icon={Bookmark} />} />
                <Route path="/dashboard/reports" element={<GenericPage title="Reports & Analytics" description="Generate deep insights and export PDF/CSV data." icon={BarChart2} />} />
                <Route path="/dashboard/archive" element={<GenericPage title="Document Vault" description="All your uploaded bills, documents, and processed analyses." icon={History} />} />
                <Route path="/dashboard/support" element={<GenericPage title="Help Center" description="Documentation, FAQs, and direct support from the CivicSync team." icon={CheckSquare} />} />

              </Route>
            </Route>

            {/* Legacy route redirects — old paths redirect to new /dashboard/* paths */}
            <Route path="/bills" element={<Navigate to="/dashboard/bills" replace />} />
            <Route path="/chat" element={<Navigate to="/dashboard/chat" replace />} />
            <Route path="/gps" element={<Navigate to="/dashboard/gps" replace />} />
            <Route path="/fraud" element={<Navigate to="/dashboard/fraud" replace />} />
            <Route path="/impact" element={<Navigate to="/dashboard/impact" replace />} />
            <Route path="/townhall" element={<Navigate to="/dashboard/townhall" replace />} />
            <Route path="/compare" element={<Navigate to="/dashboard/compare" replace />} />
            <Route path="/profile" element={<Navigate to="/dashboard/profile" replace />} />
            <Route path="/notifications" element={<Navigate to="/dashboard/notifications" replace />} />
            <Route path="/settings" element={<Navigate to="/dashboard/settings" replace />} />
            <Route path="/upload" element={<Navigate to="/dashboard/upload" replace />} />
            <Route path="/roadmap" element={<Navigate to="/dashboard/roadmap" replace />} />
            <Route path="/citizen" element={<Navigate to="/dashboard" replace />} />
            <Route path="/archive" element={<Navigate to="/dashboard/archive" replace />} />
            <Route path="/eligibility" element={<Navigate to="/dashboard/eligibility" replace />} />
            <Route path="/benefits" element={<Navigate to="/dashboard/benefits" replace />} />
            <Route path="/analyses" element={<Navigate to="/dashboard/analyses" replace />} />
            <Route path="/saved" element={<Navigate to="/dashboard/saved" replace />} />
            <Route path="/reports" element={<Navigate to="/dashboard/reports" replace />} />
            <Route path="/sentiment" element={<Navigate to="/dashboard" replace />} />
            <Route path="/support" element={<Navigate to="/dashboard/support" replace />} />

            {/* 404 Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />

          </Routes>
        </ErrorBoundary>
      </Router>
    </AuthProvider>
  );
}

export default App;
