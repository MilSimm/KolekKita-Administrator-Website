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
  setDoc,
  DocumentData,
  QueryConstraint
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export const useFirestoreCollection = <T = DocumentData>(
  collectionName: string,
  constraints: QueryConstraint[] = []
) => {
  const [data, setData] = useState<(T & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
          })) as (T & { id: string })[];
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
      setError(`Setup error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }, [collectionName, JSON.stringify(constraints)]);

  return { data, loading, error };
};

export const useFirestoreDocument = <T = DocumentData>(
  collectionName: string,
  documentId: string | null
) => {
  const [data, setData] = useState<(T & { id: string }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
          setData({ id: snapshot.id, ...snapshot.data() } as T & { id: string });
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

export const useFirestoreOperations = (collectionName: string) => {
  const addDocument = async (data: any) => {
    return await addDoc(collection(db, collectionName), {
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  };

  const updateDocument = async (id: string, data: any) => {
    return await updateDoc(doc(db, collectionName, id), {
      ...data,
      updatedAt: new Date(),
    });
  };

  const deleteDocument = async (id: string) => {
    return await deleteDoc(doc(db, collectionName, id));
  };

  return { addDocument, updateDocument, deleteDocument };
};
