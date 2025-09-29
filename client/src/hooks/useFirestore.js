import { useState, useEffect } from "react";
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  setDoc
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export const useFirestoreCollection = (
  collectionName,
  constraints = []
) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      const collectionRef = collection(db, collectionName);
      const q = constraints.length > 0 ? query(collectionRef, ...constraints) : collectionRef;

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          console.log(`Firestore ${collectionName} data:`, snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
          const items = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setData(items);
          setLoading(false);
          setError(null);
        },
        (err) => {
          console.error(`Firestore error for ${collectionName}:`, err);
          // For "verifications" collection, still try to show data even with permission errors
          if (collectionName === "verifications") {
            setData([]);
            setError(`Unable to access ${collectionName}: ${err.message}`);
          } else if (err.code === "permission-denied" || err.code === "failed-precondition") {
            setData([]);
            setError(null);
          } else {
            setError(err.message);
          }
          setLoading(false);
        }
      );

      return unsubscribe;
    } catch (err) {
      console.error(`Firestore setup error for ${collectionName}:`, err);
      setData([]);
      setLoading(false);
      setError(`Setup error: ${err?.message || 'Unknown error'}`);
    }
  }, [collectionName, JSON.stringify(constraints)]);

  return { data, loading, error };
};

export const useFirestoreDocument = (
  collectionName,
  documentId
) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!documentId) {
      setData(null);
      setLoading(false);
      return;
    }

    const docRef = doc(db, collectionName, documentId);

    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setData({ id: snapshot.id, ...snapshot.data() });
        } else {
          setData(null);
        }
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error("Firestore error:", err);
        setError(err.message);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [collectionName, documentId]);

  return { data, loading, error };
};

export const useFirestoreOperations = (collectionName) => {
  const addDocument = async (data) => {
    return await addDoc(collection(db, collectionName), {
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  };

  const updateDocument = async (id, data) => {
    return await updateDoc(doc(db, collectionName, id), {
      ...data,
      updatedAt: new Date(),
    });
  };

  const deleteDocument = async (id) => {
    return await deleteDoc(doc(db, collectionName, id));
  };

  return { addDocument, updateDocument, deleteDocument };
};
