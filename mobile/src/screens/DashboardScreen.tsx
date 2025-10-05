import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import CheckinScreen from './CheckinScreen';
import CheckinHistoryScreen from './CheckinHistoryScreen';
import { api } from '../services/api';

type TodayCheckin = {
  sleep_hours: number | null;
  sleep_quality: number | null;
  hrv: number | null;
  rhr: number | null;
  energy_level: number | null;
  soreness_level: number | null;
};

export default function DashboardScreen() {
  const { logout } = useAuth();
  const [showCheckin, setShowCheckin] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [todayCheckin, setTodayCheckin] = useState<TodayCheckin | null>(null);
  const [loadingCheckin, setLoadingCheckin] = useState(true);
  const [recommendation, setRecommendation] = useState<string | null>(null);
  const [loadingRecommendation, setLoadingRecommendation] = useState(false);

  useEffect(() => {
    fetchTodayCheckin();
  }, [showCheckin]);

  const fetchTodayCheckin = async () => {
    try {
      const response = await api.get('/api/checkins/today');
      setTodayCheckin(response.data);
    } catch (error) {
      setTodayCheckin(null);
    } finally {
      setLoadingCheckin(false);
    }
  };

  const fetchRecommendation = async () => {
    setLoadingRecommendation(true);
    try {
      const response = await api.get('/api/coach/daily-recommendation');
      setRecommendation(response.data.recommendation);
    } catch (error: any) {
      setRecommendation('Complete your check-in first to get AI recommendations.');
    } finally {
      setLoadingRecommendation(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>ForAthlete</Text>
        <TouchableOpacity onPress={logout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Recovery Status</Text>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => setShowHistory(true)}
              >
                <Text style={styles.secondaryButtonText}>History</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.checkinButton}
                onPress={() => setShowCheckin(true)}
              >
                <Text style={styles.checkinButtonText}>
                  {todayCheckin ? 'Update' : 'Check-in'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {loadingCheckin ? (
            <ActivityIndicator />
          ) : todayCheckin ? (
            <View style={styles.metricsGrid}>
              {todayCheckin.sleep_hours && (
                <View style={styles.metric}>
                  <Text style={styles.metricLabel}>Sleep</Text>
                  <Text style={styles.metricValue}>{todayCheckin.sleep_hours}h</Text>
                </View>
              )}
              {todayCheckin.sleep_quality && (
                <View style={styles.metric}>
                  <Text style={styles.metricLabel}>Quality</Text>
                  <Text style={styles.metricValue}>{todayCheckin.sleep_quality}/5</Text>
                </View>
              )}
              {todayCheckin.hrv && (
                <View style={styles.metric}>
                  <Text style={styles.metricLabel}>HRV</Text>
                  <Text style={styles.metricValue}>{todayCheckin.hrv}ms</Text>
                </View>
              )}
              {todayCheckin.rhr && (
                <View style={styles.metric}>
                  <Text style={styles.metricLabel}>RHR</Text>
                  <Text style={styles.metricValue}>{todayCheckin.rhr} bpm</Text>
                </View>
              )}
              {todayCheckin.energy_level && (
                <View style={styles.metric}>
                  <Text style={styles.metricLabel}>Energy</Text>
                  <Text style={styles.metricValue}>{todayCheckin.energy_level}/5</Text>
                </View>
              )}
              {todayCheckin.soreness_level && (
                <View style={styles.metric}>
                  <Text style={styles.metricLabel}>Soreness</Text>
                  <Text style={styles.metricValue}>{todayCheckin.soreness_level}/5</Text>
                </View>
              )}
            </View>
          ) : (
            <Text style={styles.placeholder}>Complete your daily check-in</Text>
          )}
        </View>

        {todayCheckin && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>AI Coach Recommendation</Text>
              <TouchableOpacity
                style={styles.aiButton}
                onPress={fetchRecommendation}
                disabled={loadingRecommendation}
              >
                <Text style={styles.aiButtonText}>
                  {loadingRecommendation ? '...' : 'Get Advice'}
                </Text>
              </TouchableOpacity>
            </View>

            {recommendation ? (
              <Text style={styles.recommendation}>{recommendation}</Text>
            ) : (
              <Text style={styles.placeholder}>Tap 'Get Advice' for AI coaching</Text>
            )}
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Today's Workout</Text>
          <View style={styles.workoutCard}>
            <Text style={styles.workoutType}>Threshold Run</Text>
            <Text style={styles.workoutDetails}>
              6-8 × 800m @ 3:20-3:25, jog rest 200m
            </Text>
            <Text style={styles.workoutFocus}>
              Focus: Aerobic power + lactate control
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Weekly Progress</Text>
          <Text style={styles.placeholder}>Coming soon...</Text>
        </View>
      </ScrollView>

      <Modal visible={showCheckin} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowCheckin(false)}>
            <Text style={styles.closeButton}>Cancel</Text>
          </TouchableOpacity>
        </View>
        <CheckinScreen onComplete={() => setShowCheckin(false)} />
      </Modal>

      <Modal visible={showHistory} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowHistory(false)}>
            <Text style={styles.closeButton}>Close</Text>
          </TouchableOpacity>
        </View>
        <CheckinHistoryScreen />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: 'white',
    paddingTop: 60,
    paddingBottom: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  logoutButton: {
    padding: 8,
  },
  logoutText: {
    color: '#007AFF',
    fontSize: 16,
  },
  content: {
    flex: 1,
    padding: 15,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  checkinButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  checkinButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#E8E8E8',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  secondaryButtonText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '600',
  },
  aiButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  aiButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metric: {
    minWidth: '30%',
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  recommendation: {
    fontSize: 15,
    lineHeight: 22,
    color: '#333',
  },
  workoutCard: {
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  workoutType: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1565C0',
    marginBottom: 8,
  },
  workoutDetails: {
    fontSize: 15,
    color: '#1976D2',
    marginBottom: 8,
  },
  workoutFocus: {
    fontSize: 13,
    color: '#1976D2',
  },
  placeholder: {
    color: '#666',
    fontSize: 14,
  },
  modalHeader: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 10,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  closeButton: {
    color: '#007AFF',
    fontSize: 16,
  },
});