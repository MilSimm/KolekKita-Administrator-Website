import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase.js';

export default function DatabaseConnectionTest() {
  const [status, setStatus] = useState({
    loading: true,
    connected: false,
    verificationCount: 0,
    error: null
  });

  useEffect(() => {
    const testConnection = async () => {
      try {
        console.log('🔍 Testing database connection...');
        
        // Test basic Firestore connection
        const verificationsRef = collection(db, 'verifications');
        const snapshot = await getDocs(verificationsRef);
        
        console.log('✅ Database connected successfully');
        console.log(`📊 Found ${snapshot.size} verifications`);
        
        // Log some sample data
        if (snapshot.size > 0) {
          const firstDoc = snapshot.docs[0].data();
          console.log('📄 Sample verification:', firstDoc);
          console.log('🔍 Keys in document:', Object.keys(firstDoc));
          console.log('👤 userRole:', firstDoc.userRole);
          console.log('📋 status:', firstDoc.status);
          console.log('🏪 shopName:', firstDoc.shopName);
        }
        
        setStatus({
          loading: false,
          connected: true,
          verificationCount: snapshot.size,
          error: null
        });
        
      } catch (error) {
        console.error('❌ Database connection failed:', error);
        setStatus({
          loading: false,
          connected: false,
          verificationCount: 0,
          error: error.message
        });
      }
    };

    testConnection();
  }, []);

  return (
    <div style={{ 
      padding: '20px', 
      backgroundColor: status.connected ? '#f0f9ff' : '#fef2f2',
      border: `2px solid ${status.connected ? '#3b82f6' : '#ef4444'}`,
      borderRadius: '8px',
      margin: '10px'
    }}>
      <h3>🔗 Database Connection Test</h3>
      
      {status.loading ? (
        <p>⏳ Testing connection...</p>
      ) : (
        <>
          <p><strong>Status:</strong> 
            <span style={{ color: status.connected ? 'green' : 'red' }}>
              {status.connected ? ' ✅ Connected' : ' ❌ Disconnected'}
            </span>
          </p>
          
          {status.connected && (
            <p><strong>Verifications Found:</strong> {status.verificationCount}</p>
          )}
          
          {status.error && (
            <p style={{ color: 'red' }}><strong>Error:</strong> {status.error}</p>
          )}
          
          <p><strong>Collection:</strong> "verifications"</p>
          <p><strong>Firebase Project:</strong> kolekkita</p>
        </>
      )}
    </div>
  );
}