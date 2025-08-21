import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { 
  User as FirebaseUser, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  createUserWithEmailAndPassword
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import type { User, UserRole } from "@shared/schema";

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string, name: string, role: UserRole) => Promise<void>;
  switchRole: (role: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setFirebaseUser(firebaseUser);
      
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
          if (userDoc.exists()) {
            setUser({ id: firebaseUser.uid, ...userDoc.data() } as User);
          } else {
            // Create user document if it doesn't exist
            const newUser: Omit<User, 'id'> = {
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

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const register = async (email: string, password: string, name: string, role: UserRole) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const newUser: Omit<User, 'id'> = {
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

  const switchRole = async (role: UserRole) => {
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
