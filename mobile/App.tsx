import { AuthProvider, useAuth } from './src/context/AuthContext';
import LoginScreen from './src/screens/login';
import DashboardScreen from './src/screens/DashboardScreen';
import { View, ActivityIndicator } from 'react-native';

function AppContent() {
  const { token, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return token ? <DashboardScreen /> : <LoginScreen />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}