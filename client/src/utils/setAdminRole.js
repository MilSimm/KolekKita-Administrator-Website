// Temporary script to set user role to admin for testing
import { doc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase.js';

export const setUserAsAdmin = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {
      role: 'admin',
      email: 'admin@kolekkita.com',
      name: 'Admin User',
      createdAt: new Date(),
      updatedAt: new Date(),
    }, { merge: true });
    
    console.log('✅ User role set to admin successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to set user role:', error);
    return false;
  }
};