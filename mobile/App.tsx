import { AuthProvider, useAuth } from './src/context/AuthContext';
import { useState, useEffect } from 'react';
import Login from './src/screens/login';
import DashboardScreen from './src/screens/DashboardScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import TrainingPlanScreen from './src/screens/TrainingPlanScreen';
import { View, ActivityIndicator, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { profileAPI } from './src/services/api';

function AppContent() {
  const { token, loading: authLoading } = useAuth();
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentScreen, setCurrentScreen] = useState<'dashboard' | 'plan'>('dashboard');

  useEffect(() => {
    if (token) {
      checkProfile();
    } else {
      setLoading(false);
    }
  }, [token]);

  const checkProfile = async () => {
    try {
      await profileAPI.get();
      setHasProfile(true);
    } catch (error: any) {
      if (error.response?.status === 404 || error.response?.status === 401) {
        setHasProfile(false);
      } else {
        setHasProfile(false);
      }
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!token) {
    return <Login />;
  }

  if (hasProfile === false) {
    return <OnboardingScreen onComplete={() => setHasProfile(true)} />;
  }

  if (hasProfile === true) {
    return (
      <View style={{ flex: 1 }}>
        {currentScreen === 'dashboard' ? <DashboardScreen /> : <TrainingPlanScreen />}

        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tab, currentScreen === 'dashboard' && styles.tabActive]}
            onPress={() => setCurrentScreen('dashboard')}
          >
            <Text style={[styles.tabText, currentScreen === 'dashboard' && styles.tabTextActive]}>
              Dashboard
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, currentScreen === 'plan' && styles.tabActive]}
            onPress={() => setCurrentScreen('plan')}
          >
            <Text style={[styles.tabText, currentScreen === 'plan' && styles.tabTextActive]}>
              Training Plan
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
  },
  tabTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
});

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}