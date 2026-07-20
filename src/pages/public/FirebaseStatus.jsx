import { useState, useEffect } from "react";
import { collection, getDocs, doc, setDoc, getDoc, deleteDoc } from "firebase/firestore";
import { signInAnonymously, signOut, onAuthStateChanged } from "firebase/auth";
import { db, auth } from "../../firebase/firebase";
import { seedFirestore } from "../../firebase/seed";
import { getLoggedUserId } from "../../firebase/firestore";

// ─────────────────────────────────────────────────────────────────────────────
// Firebase Status Page — Comprehensive Live Connectivity & Access Diagnostic
// Route: /firebase-status (public, no auth required)
// ─────────────────────────────────────────────────────────────────────────────

const COLLECTIONS_TO_CHECK = [
  "users",
  "citizens",
  "schemes",
  "benefits",
  "applications",
  "roadmaps",
  "notifications",
  "analytics"
];

export default function FirebaseStatus() {
  const [firebaseInitialized, setFirebaseInitialized] = useState("pending");
  const [projectId, setProjectId] = useState("Unknown");
  const [authStatus, setAuthStatus] = useState("Checking...");
  const [userUid, setUserUid] = useState("None");
  const [authError, setAuthError] = useState(null);

  const [writeStatus, setWriteStatus] = useState("pending");
  const [writeDetails, setWriteDetails] = useState("");

  const [readStatus, setReadStatus] = useState("pending");
  const [readDetails, setReadDetails] = useState("");

  const [deleteStatus, setDeleteStatus] = useState("pending");
  const [deleteDetails, setDeleteDetails] = useState("");

  const [collectionsCheck, setCollectionsCheck] = useState({});
  const [rulesStatus, setRulesStatus] = useState("Checking...");
  const [rulesDetails, setRulesDetails] = useState("");

  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);

  const [seedingStatus, setSeedingStatus] = useState("idle");
  const [seedingDetails, setSeedingDetails] = useState("");
  const [userEmail, setUserEmail] = useState("None");

  // Monitor Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setAuthStatus(user.isAnonymous ? "Authenticated Anonymously" : "Authenticated (User)");
        setUserUid(user.uid);
        setUserEmail(user.email || "None");
        setAuthError(null);
      } else {
        setAuthStatus("Not Authenticated");
        setUserUid("None");
        setUserEmail("None");
      }
    });
    return () => unsubscribe();
  }, []);

  const runDiagnostics = async () => {
    setRunning(true);
    setDone(false);

    // Clear details
    setWriteStatus("pending");
    setWriteDetails("");
    setReadStatus("pending");
    setReadDetails("");
    setDeleteStatus("pending");
    setDeleteDetails("");
    setCollectionsCheck({});
    setRulesStatus("Checking...");
    setRulesDetails("");
    setAuthError(null);

    // 1. Check SDK Init
    try {
      if (db && db.type === "firestore") {
        setFirebaseInitialized("pass");
        setProjectId(db.app.options.projectId || "Unknown");
      } else {
        setFirebaseInitialized("fail");
      }
    } catch (e) {
      setFirebaseInitialized("fail");
      console.error(e);
    }

    // 2. Test Firebase Auth (Try Anonymous Login)
    setAuthStatus("Signing in anonymously...");
    try {
      await signInAnonymously(auth);
      setAuthStatus("Authenticated Anonymously");
    } catch (e) {
      setAuthStatus("Auth Failed");
      setAuthError(e.code ? `${e.code}: ${e.message}` : e.message);
    }

    // 3. Write Test
    setWriteStatus("running");
    let testDocId = "ping_" + Date.now();
    let writeOk = false;
    try {
      const testRef = doc(db, "_status_check", testDocId);
      await setDoc(testRef, {
        ts: new Date().toISOString(),
        ok: true,
        runner: "CivicSync Diagnostic Page"
      });
      setWriteStatus("pass");
      setWriteDetails(`Successfully wrote document to _status_check/${testDocId}`);
      writeOk = true;
    } catch (e) {
      setWriteStatus("fail");
      setWriteDetails(e.code ? `${e.code}: ${e.message}` : e.message);
    }

    // 4. Read Test
    setReadStatus("running");
    if (writeOk) {
      try {
        const testRef = doc(db, "_status_check", testDocId);
        const snap = await getDoc(testRef);
        if (snap.exists()) {
          setReadStatus("pass");
          setReadDetails(`Read success. ts=${snap.data().ts}, runner=${snap.data().runner}`);
        } else {
          setReadStatus("fail");
          setReadDetails("Document written but could not be found.");
        }
      } catch (e) {
        setReadStatus("fail");
        setReadDetails(e.code ? `${e.code}: ${e.message}` : e.message);
      }
    } else {
      setReadStatus("fail");
      setReadDetails("Skipped (Write test failed).");
    }

    // 5. Delete Test
    setDeleteStatus("running");
    if (writeOk) {
      try {
        const testRef = doc(db, "_status_check", testDocId);
        await deleteDoc(testRef);
        setDeleteStatus("pass");
        setDeleteDetails(`Successfully deleted document _status_check/${testDocId}`);
      } catch (e) {
        setDeleteStatus("fail");
        setDeleteDetails(e.code ? `${e.code}: ${e.message}` : e.message);
      }
    } else {
      setDeleteStatus("fail");
      setDeleteDetails("Skipped (Write test failed).");
    }

    // 6. Security Rule Check
    try {
      // Check if we can write to metadata/status path to guess security configuration
      const rulesRef = doc(db, "_rules_test_path", "test");
      await setDoc(rulesRef, { test: true });
      await deleteDoc(rulesRef);
      setRulesStatus("Open/Accessible");
      setRulesDetails("Unrestricted read/write rules are active.");
    } catch (e) {
      if (e.code === "permission-denied") {
        setRulesStatus("Secure / Restricted");
        setRulesDetails("Firestore Rules are active and blocking unauthorized public writes.");
      } else {
        setRulesStatus("Error checking rules");
        setRulesDetails(e.message);
      }
    }

    // 7. Check Collections
    const colChecks = {};
    for (const colName of COLLECTIONS_TO_CHECK) {
      try {
        const colRef = collection(db, colName);
        const snap = await getDocs(colRef);
        colChecks[colName] = {
          status: "pass",
          count: snap.size,
          details: `Accessible. Found ${snap.size} documents.`
        };
      } catch (e) {
        colChecks[colName] = {
          status: "fail",
          count: 0,
          details: e.code ? `${e.code}: ${e.message}` : e.message
        };
      }
    }
    setCollectionsCheck(colChecks);

    setRunning(false);
    setDone(true);
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setAuthStatus("Signed Out");
      setUserUid("None");
      setAuthError(null);
    } catch (e) {
      setAuthError(e.message);
    }
  };

  const handleSeedDatabase = async () => {
    setSeedingStatus("running");
    setSeedingDetails("Locating user session...");
    try {
      let userId = getLoggedUserId();
      if (!userId) {
        userId = auth.currentUser?.uid || "starter_user_id";
        setSeedingDetails(`No logged-in user in localStorage. Seeding with fallback UID: ${userId}`);
      } else {
        setSeedingDetails(`Logged-in user: ${userId}. Seeding custom and global collections...`);
      }
      await seedFirestore(userId);
      setSeedingStatus("success");
      setSeedingDetails(`Seeding completed successfully! Core schemes + user sub-collections populated.`);
      // Refresh count checks
      runDiagnostics();
    } catch (e) {
      setSeedingStatus("error");
      setSeedingDetails(e.code ? `${e.code}: ${e.message}` : e.message);
    }
  };

  // Run on mount
  useEffect(() => {
    runDiagnostics();
  }, []);

  const getStatusColor = (status) => {
    if (status === "pass") return "#4ade80"; // Green
    if (status === "fail") return "#f87171"; // Red
    if (status === "running") return "#fbbf24"; // Yellow
    return "#94a3b8"; // Gray
  };

  const allTestsPass = done &&
    firebaseInitialized === "pass" &&
    writeStatus === "pass" &&
    readStatus === "pass" &&
    deleteStatus === "pass" &&
    Object.values(collectionsCheck).every(c => c.status === "pass");

  return (
    <div style={{ minHeight: "100vh", background: "#0d0f17", color: "#fff", fontFamily: "monospace", paddingBottom: "60px" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "48px 24px" }}>

        {/* Header */}
        <div style={{ marginBottom: "32px", borderBottom: "1px solid #1e293b", paddingBottom: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
            <span style={{ fontSize: "32px" }}>🔥</span>
            <h1 style={{ fontSize: "24px", fontWeight: "bold", color: "#f8fafc", margin: 0 }}>
              CivicSync Firebase Diagnostics
            </h1>
          </div>
          <p style={{ color: "#64748b", fontSize: "13px", margin: "4px 0 0 0" }}>
            Project Target: <strong style={{ color: "#94a3b8" }}>civic-sync-cosmic</strong> | Live System Configuration Checker
          </p>
        </div>

        {/* Overall Status Banner */}
        {done && (
          <div style={{
            padding: "16px 20px",
            borderRadius: "12px",
            marginBottom: "24px",
            border: `1px solid ${allTestsPass ? "#22c55e44" : "#ef444444"}`,
            background: allTestsPass ? "#052e16" : "#1c0a0a",
            color: allTestsPass ? "#4ade80" : "#f87171",
            fontWeight: "bold",
            fontSize: "14px"
          }}>
            {allTestsPass
              ? "✅ CONNECTIVITY PERFECT — Firebase Firestore is fully configured, seed-ready, and write-enabled."
              : "⚠️ CONNECTION NOTICE — Some diagnostic tests failed or returned restrictions. See below."}
          </div>
        )}

        {/* Section 1: Core SDK & Auth Configuration */}
        <h2 style={{ fontSize: "16px", color: "#a78bfa", marginBottom: "12px", borderLeft: "4px solid #a78bfa", paddingLeft: "8px" }}>
          1. SDK & Authentication Status
        </h2>
        <div style={{ background: "#171a21", border: "1px solid #1e293b", borderRadius: "12px", padding: "20px", marginBottom: "24px", display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #ffffff08", paddingBottom: "8px" }}>
            <span style={{ color: "#94a3b8" }}>Firebase SDK Initialized:</span>
            <span style={{ color: getStatusColor(firebaseInitialized), fontWeight: "bold" }}>
              {firebaseInitialized === "pass" ? "YES (Success)" : "NO (Failed)"}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #ffffff08", paddingBottom: "8px" }}>
            <span style={{ color: "#94a3b8" }}>Firebase Project ID:</span>
            <span style={{ color: projectId === "civic-sync-cosmic" ? "#4ade80" : "#fbbf24", fontWeight: "bold" }}>
              {projectId}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #ffffff08", paddingBottom: "8px" }}>
            <span style={{ color: "#94a3b8" }}>Authentication Mode:</span>
            <span style={{ color: "#38bdf8", fontWeight: "bold" }}>{authStatus}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #ffffff08", paddingBottom: "8px" }}>
            <span style={{ color: "#94a3b8" }}>Firebase UID:</span>
            <span style={{ color: "#f472b6", wordBreak: "break-all" }}>{userUid}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #ffffff08", paddingBottom: "8px" }}>
            <span style={{ color: "#94a3b8" }}>User Email:</span>
            <span style={{ color: "#10b981", fontWeight: "bold" }}>{userEmail}</span>
          </div>
          {authError && (
            <div style={{ background: "#ef444411", color: "#f87171", padding: "10px 14px", borderRadius: "8px", fontSize: "12px", border: "1px solid #ef444422" }}>
              <strong>Auth Warning (Ignore if Firestore is open):</strong> {authError}
            </div>
          )}
          {userUid !== "None" && (
            <button
              onClick={handleSignOut}
              style={{ padding: "6px 12px", background: "#334155", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "11px", alignSelf: "flex-start", marginTop: "4px" }}
            >
              Sign Out from Firebase
            </button>
          )}
        </div>

        {/* Section 2: Firestore CRUD Operations */}
        <h2 style={{ fontSize: "16px", color: "#a78bfa", marginBottom: "12px", borderLeft: "4px solid #a78bfa", paddingLeft: "8px" }}>
          2. Firestore CRUD Test Operations
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "24px" }}>

          {/* Write */}
          <div style={{ padding: "16px", borderRadius: "12px", background: "#171a21", border: `1px solid ${writeStatus === "pass" ? "#22c55e33" : writeStatus === "fail" ? "#ef444433" : "#ffffff11"}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
              <span style={{ fontWeight: "bold" }}>Create (Write Document)</span>
              <span style={{ color: getStatusColor(writeStatus) }}>{writeStatus.toUpperCase()}</span>
            </div>
            {writeDetails && <div style={{ fontSize: "12px", color: writeStatus === "pass" ? "#94a3b8" : "#f87171", background: "#0d0f17", padding: "8px 12px", borderRadius: "6px" }}>{writeDetails}</div>}
          </div>

          {/* Read */}
          <div style={{ padding: "16px", borderRadius: "12px", background: "#171a21", border: `1px solid ${readStatus === "pass" ? "#22c55e33" : readStatus === "fail" ? "#ef444433" : "#ffffff11"}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
              <span style={{ fontWeight: "bold" }}>Read (Get Document)</span>
              <span style={{ color: getStatusColor(readStatus) }}>{readStatus.toUpperCase()}</span>
            </div>
            {readDetails && <div style={{ fontSize: "12px", color: readStatus === "pass" ? "#94a3b8" : "#f87171", background: "#0d0f17", padding: "8px 12px", borderRadius: "6px" }}>{readDetails}</div>}
          </div>

          {/* Delete */}
          <div style={{ padding: "16px", borderRadius: "12px", background: "#171a21", border: `1px solid ${deleteStatus === "pass" ? "#22c55e33" : deleteStatus === "fail" ? "#ef444433" : "#ffffff11"}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
              <span style={{ fontWeight: "bold" }}>Delete (Remove Document)</span>
              <span style={{ color: getStatusColor(deleteStatus) }}>{deleteStatus.toUpperCase()}</span>
            </div>
            {deleteDetails && <div style={{ fontSize: "12px", color: deleteStatus === "pass" ? "#94a3b8" : "#f87171", background: "#0d0f17", padding: "8px 12px", borderRadius: "6px" }}>{deleteDetails}</div>}
          </div>

          {/* Rules status */}
          <div style={{ padding: "16px", borderRadius: "12px", background: "#171a21", border: "1px solid #1e293b" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
              <span style={{ fontWeight: "bold" }}>Security Rules Configured</span>
              <span style={{ color: "#38bdf8" }}>{rulesStatus}</span>
            </div>
            {rulesDetails && <div style={{ fontSize: "12px", color: "#94a3b8", background: "#0d0f17", padding: "8px 12px", borderRadius: "6px" }}>{rulesDetails}</div>}
          </div>
        </div>

        {/* Section 3: Project Collections Existence */}
        <h2 style={{ fontSize: "16px", color: "#a78bfa", marginBottom: "12px", borderLeft: "4px solid #a78bfa", paddingLeft: "8px" }}>
          3. Collection Accessibility & Documents Count
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "32px" }}>
          {COLLECTIONS_TO_CHECK.map(col => {
            const result = collectionsCheck[col] || { status: "pending", count: 0, details: "Awaiting test run" };
            return (
              <div key={col} style={{
                padding: "12px 16px",
                borderRadius: "10px",
                background: "#171a21",
                border: `1px solid ${result.status === "pass" ? "#22c55e22" : result.status === "fail" ? "#ef444422" : "#ffffff08"}`,
                display: "flex",
                flexDirection: "column",
                gap: "6px"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: "bold", fontSize: "14px" }}>📁 /{col}</span>
                  <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                    {result.status === "pass" && <span style={{ fontSize: "11px", padding: "2px 8px", background: "#22c55e15", color: "#4ade80", borderRadius: "4px" }}>COUNT: {result.count}</span>}
                    <span style={{ color: getStatusColor(result.status), fontSize: "12px" }}>
                      {result.status.toUpperCase()}
                    </span>
                  </div>
                </div>
                {result.details && (
                  <div style={{ fontSize: "11px", color: result.status === "pass" ? "#64748b" : "#f87171", fontStyle: "italic" }}>
                    {result.details}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Control Button */}
        <button
          onClick={runDiagnostics}
          disabled={running}
          style={{
            padding: "14px 28px",
            borderRadius: "10px",
            background: running ? "#1e293b" : "#4f46e5",
            color: running ? "#64748b" : "#fff",
            border: "none",
            cursor: running ? "not-allowed" : "pointer",
            fontWeight: "bold",
            fontSize: "13px",
            letterSpacing: "1px",
            width: "100%",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
          }}
        >
          {running ? "⏳ RUNNING FULL DIAGNOSTICS..." : "🔄 RETEST & RUN COMPLETE DIAGNOSTICS"}
        </button>

        {/* Seeding Box Section */}
        <h2 style={{ fontSize: "16px", color: "#a78bfa", marginTop: "32px", marginBottom: "12px", borderLeft: "4px solid #a78bfa", paddingLeft: "8px" }}>
          4. Seeding & Database Initialization
        </h2>
        <div style={{
          padding: "20px",
          borderRadius: "12px",
          background: "#12141d",
          border: "1px solid #1e293b",
          marginBottom: "32px"
        }}>
          <p style={{ fontSize: "13px", color: "#94a3b8", lineHeight: "1.6", margin: "0 0 16px 0" }}>
            If Firestore was recently created or is empty, use the button below to initialize and import the baseline project data (Schemes, profile templates, GPS tasks, etc.).
          </p>

          <button
            onClick={handleSeedDatabase}
            disabled={seedingStatus === "running"}
            style={{
              padding: "12px 24px",
              borderRadius: "8px",
              background: seedingStatus === "running" ? "#1e293b" : "#10b981",
              color: "#fff",
              border: "none",
              cursor: seedingStatus === "running" ? "not-allowed" : "pointer",
              fontWeight: "bold",
              fontSize: "13px",
              marginBottom: seedingDetails ? "12px" : "0",
              display: "inline-block"
            }}
          >
            {seedingStatus === "running" ? "🌱 Seeding Database..." : "🌱 Import Project Data / Seed Firestore"}
          </button>

          {seedingDetails && (
            <div style={{
              fontSize: "12px",
              color: seedingStatus === "success" ? "#34d399" : seedingStatus === "error" ? "#f87171" : "#94a3b8",
              background: "#0d0f17",
              padding: "10px 14px",
              borderRadius: "8px",
              border: `1px solid ${seedingStatus === "success" ? "#10b98133" : seedingStatus === "error" ? "#ef444433" : "#ffffff11"}`,
              wordBreak: "break-all"
            }}>
              <strong>Status: </strong>{seedingDetails}
            </div>
          )}
        </div>

        <p style={{ marginTop: "24px", color: "#334155", fontSize: "11px", textAlign: "center" }}>
          <a href="/dashboard" style={{ color: "#818cf8" }}>Back to Dashboard</a>
          &nbsp; | &nbsp;
          <a href="/dashboard/settings" style={{ color: "#818cf8" }}>Settings</a>
        </p>

      </div>
    </div>
  );
}
