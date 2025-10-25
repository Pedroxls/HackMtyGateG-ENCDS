import { Redirect } from 'expo-router';
import { useAuth } from '../src/store';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useEffect, useState } from 'react';

export default function Index() {
  const user = useAuth(s => s.user);
  const loading = useAuth(s => s.loading);
  const checkAuth = useAuth(s => s.checkAuth);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    checkAuth().then(() => setReady(true));
  }, []);

  if (!ready || loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#1e3a8a" />
      </View>
    );
  }

  return user ? <Redirect href="/(tabs)" /> : <Redirect href="/login" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
