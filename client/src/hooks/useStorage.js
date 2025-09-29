import { useState } from "react";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "@/lib/firebase";

export const useStorage = () => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const uploadFile = async (file, path) => {
    setUploading(true);
    setError(null);

    try {
      const storageRef = ref(storage, path);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Upload failed";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const deleteFile = async (path) => {
    try {
      const storageRef = ref(storage, path);
      await deleteObject(storageRef);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Delete failed";
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  return { uploadFile, deleteFile, uploading, error };
};
