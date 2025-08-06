// App.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { getFirestore, doc, getDoc } from '@react-native-firebase/firestore';

// ---------- Retry helper ----------
async function getWithRetry<T>(
  docRef: FirebaseFirestoreTypes.DocumentReference,
  retries = 3,
  delay = 1000
): Promise<T | null> {
  for (let i = 0; i < retries; i++) {
    try {
      const snap = await getDoc(docRef);
      return snap.exists() ? (snap.data() as T) : null;
    } catch (err: any) {
      if (err.code === 'firestore/unavailable' && i < retries - 1) {
        await new Promise(r => setTimeout(r, delay * (i + 1)));
        continue;
      }
      throw err;
    }
  }
  return null;
}

export default function App() {
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');
  const [docFound, setDocFound] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const db = getFirestore();
        const data = await getWithRetry<{ dummy?: boolean }>(
          doc(db, 'test', 'connection')
        );
        setDocFound(data !== null);
        setStatus('ok');
      } catch (e) {
        console.error('Final error:', e);
        setStatus('error');
      }
    })();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      {status === 'loading' && <ActivityIndicator />}
      {status === 'ok' && (
        <Text>Firebase connected! Doc exists: {String(docFound)}</Text>
      )}
      {status === 'error' && <Text>Could not reach Firestore.</Text>}
    </View>
  );
}