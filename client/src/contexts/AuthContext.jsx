import { createContext, useContext, useEffect, useState } from "react";
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  createUserWithEmailAndPassword
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

const AuthContext = createContext(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setFirebaseUser(firebaseUser);
      
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
          if (userDoc.exists()) {
            setUser({ id: firebaseUser.uid, ...userDoc.data() });
          } else {
            // Create user document if it doesn't exist
            const newUser = {
              email: firebaseUser.email || "",
              name: firebaseUser.displayName || "User",
              role: "customer",
              profilePhoto: firebaseUser.photoURL || null,
              phone: firebaseUser.phoneNumber || null,
              isActive: true,
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            await setDoc(doc(db, "users", firebaseUser.uid), newUser);
            setUser({ id: firebaseUser.uid, ...newUser });
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      } else {
        setUser(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email, password) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const register = async (email, password, name, role) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const newUser = {
      email,
      name,
      role,
      profilePhoto: null,
      phone: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await setDoc(doc(db, "users", userCredential.user.uid), newUser);
  };

  const switchRole = async (role) => {
    if (!firebaseUser) throw new Error("No user logged in");
    
    await setDoc(doc(db, "users", firebaseUser.uid), {
      role,
      updatedAt: new Date(),
    }, { merge: true });
    
    if (user) {
      setUser({ ...user, role });
    }
  };

  const value = {
    user,
    firebaseUser,
    loading,
    login,
    logout,
    register,
    switchRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
