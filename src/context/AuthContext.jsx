import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { auth } from "../firebase/firebase";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  updateProfile
} from "firebase/auth";

// ─────────────────────────────────────────────────────────────────────────────
// Auth Context (Firebase Authentication Integrated)
// Provides: user, token, loading, login(), signup(), logout()
// ─────────────────────────────────────────────────────────────────────────────

export const AuthContext = createContext(null);

const TOKEN_KEY = "civicsync_token";
const USER_KEY = "civicsync_user";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ── Auto-ensure default user exists on startup ────────────────────────────
  useEffect(() => {
    const ensureDefaultUserExists = async () => {
      try {
        await createUserWithEmailAndPassword(auth, "devasish778@gmail.com", "Password@123");
        console.log("[Auth] Default user devasish778@gmail.com created successfully.");
        await firebaseSignOut(auth);
      } catch (e) {
        if (e.code === "auth/email-already-in-use") {
          console.log("[Auth] Default user devasish778@gmail.com already exists.");
        } else {
          console.log("[Auth] Default user verification check status:", e.message);
        }
      }
    };
    ensureDefaultUserExists();
  }, []);

  // ── Hydrate and listen to Auth state changes ──────────────────────────────
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const nameParts = firebaseUser.displayName ? firebaseUser.displayName.split(" ") : ["Citizen", ""];
        const firstName = nameParts[0] || "Citizen";
        const lastName = nameParts.slice(1).join(" ") || "";
        
        const mappedUser = {
          id: firebaseUser.uid,
          _id: firebaseUser.uid,
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || `${firstName} ${lastName}`.trim(),
          firstName,
          lastName,
        };
        
        setUser(mappedUser);
        localStorage.setItem(USER_KEY, JSON.stringify(mappedUser));
        
        firebaseUser.getIdToken().then((t) => {
          setToken(t);
          localStorage.setItem(TOKEN_KEY, t);
        });
      } else {
        setUser(null);
        setToken(null);
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem(TOKEN_KEY);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // ── Login ─────────────────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    setError(null);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      const nameParts = firebaseUser.displayName ? firebaseUser.displayName.split(" ") : ["Citizen", ""];
      const firstName = nameParts[0] || "Citizen";
      const lastName = nameParts.slice(1).join(" ") || "";
      
      const mappedUser = {
        id: firebaseUser.uid,
        _id: firebaseUser.uid,
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName || `${firstName} ${lastName}`.trim(),
        firstName,
        lastName,
      };
      
      setUser(mappedUser);
      const t = await firebaseUser.getIdToken();
      setToken(t);
      localStorage.setItem(USER_KEY, JSON.stringify(mappedUser));
      localStorage.setItem(TOKEN_KEY, t);
      
      return { success: true };
    } catch (err) {
      console.error("[AuthContext] Firebase Login Error:", err);
      let message = "Invalid email or password. Please try again.";
      if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password" || err.code === "auth/user-not-found") {
        message = "Invalid email or password. Please try again.";
      } else if (err.code === "auth/invalid-email") {
        message = "The email address is invalid.";
      } else if (err.code === "auth/user-disabled") {
        message = "This user account has been disabled.";
      } else if (err.code === "auth/network-request-failed") {
        message = "Network error. Please check your connection.";
      } else {
        message = err.message || message;
      }
      setError(message);
      return { success: false, error: message };
    }
  }, []);

  // ── Signup ────────────────────────────────────────────────────────────────
  const signup = useCallback(async (formData) => {
    setError(null);
    try {
      const { firstName, lastName, email, password } = formData;
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      const fullName = `${firstName} ${lastName}`.trim();
      await updateProfile(firebaseUser, { displayName: fullName });
      
      const mappedUser = {
        id: firebaseUser.uid,
        _id: firebaseUser.uid,
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: fullName,
        firstName,
        lastName,
      };
      
      setUser(mappedUser);
      const t = await firebaseUser.getIdToken();
      setToken(t);
      localStorage.setItem(USER_KEY, JSON.stringify(mappedUser));
      localStorage.setItem(TOKEN_KEY, t);
      
      return { success: true };
    } catch (err) {
      console.error("[AuthContext] Firebase Signup Error:", err);
      let message = "Registration failed. Please try again.";
      if (err.code === "auth/email-already-in-use") {
        message = "This email address is already registered.";
      } else if (err.code === "auth/invalid-email") {
        message = "The email address is invalid.";
      } else if (err.code === "auth/weak-password") {
        message = "Password must be at least 6 characters.";
      } else if (err.code === "auth/network-request-failed") {
        message = "Network error. Please check your connection.";
      } else {
        message = err.message || message;
      }
      setError(message);
      return { success: false, error: message };
    }
  }, []);

  // ── Logout ────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      await firebaseSignOut(auth);
    } finally {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      setUser(null);
      setToken(null);
    }
  }, []);

  // ── Update user locally (after profile update) ────────────────────────────
  const updateUser = useCallback((updatedFields) => {
    setUser((prev) => {
      const merged = { ...prev, ...updatedFields };
      localStorage.setItem(USER_KEY, JSON.stringify(merged));
      return merged;
    });
  }, []);

  const value = {
    user,
    token,
    loading,
    error,
    isAuthenticated: !!user && !!token,
    login,
    signup,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

