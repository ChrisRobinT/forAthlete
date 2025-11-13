import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
  notes?: string;
};

type TodayWorkout = {
  type: string;
  workout: string;
  duration_minutes: number;
  notes: string;
  date: string;
};

export default function DashboardScreen() {
  const { logout } = useAuth();
  const [showCheckin, setShowCheckin] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [todayCheckin, setTodayCheckin] = useState<TodayCheckin | null>(null);
  const [todayWorkout, setTodayWorkout] = useState<TodayWorkout | null>(null);
  const [loadingCheckin, setLoadingCheckin] = useState(true);
  const [loadingWorkout, setLoadingWorkout] = useState(true);
  const [recommendation, setRecommendation] = useState<string | null>(null);
  const [loadingRecommendation, setLoadingRecommendation] = useState(false);
  const [adjustingWorkout, setAdjustingWorkout] = useState(false);

  useEffect(() => {
    fetchTodayCheckin();
    fetchTodayWorkout();
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

  const fetchTodayWorkout = async () => {
    try {
      const response = await api.get('/api/coach/training-plan/current');
      const plan = response.data.plan;

      // Get today's day of week
      const today = new Date();
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const todayName = dayNames[today.getDay()];

      // Get today's workout from the plan
      const workout = plan[todayName];
      setTodayWorkout(workout || null);
    } catch (error) {
      console.error('Failed to fetch today\'s workout:', error);
      setTodayWorkout(null);
    } finally {
      setLoadingWorkout(false);
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

const adjustTodaysWorkout = async () => {
  if (!todayWorkout || !todayCheckin) return;

  setAdjustingWorkout(true);
  try {
    const response = await api.post('/api/coach/training-plan/adjust-today', {
      current_workout: todayWorkout,
      checkin_data: todayCheckin,
      recommendation: recommendation
    });

    // Update local state immediately
    setTodayWorkout(response.data.adjusted_workout);
    setRecommendation(null);

    Alert.alert('Workout Adjusted! 🎯', 'Your workout has been modified based on your recovery metrics. Check the updated plan below.');
  } catch (error: any) {
    Alert.alert('Error', error.response?.data?.detail || 'Failed to adjust workout');
  } finally {
    setAdjustingWorkout(false);
  }
};

  const getWorkoutColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'run':
        return { bg: '#FDECEA', border: '#DB8A74', text: '#DB8A74' };
      case 'badminton':
        return { bg: '#EDE9F0', border: '#544F69', text: '#544F69' };
      case 'rest':
        return { bg: '#E8F4F8', border: '#8EBFE1', text: '#8EBFE1' };
      case 'strength':
        return { bg: '#E8F3ED', border: '#85B79D', text: '#85B79D' };
      case 'cross-training':
        return { bg: '#FCF0FC', border: '#EEA7F1', text: '#EEA7F1' };
      default:
        return { bg: '#FEF9E7', border: '#FAEDCB', text: '#B8860B' };
    }
  };

  return (
      <SafeAreaView style={[styles.container, styles.safeArea]} edges={['top']}>
        <View style={[styles.header]}>
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
                <ActivityIndicator/>
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
                  <Text style={styles.cardTitle}>🤖 AI Coach</Text>
                  {!recommendation && (
                      <TouchableOpacity
                          style={styles.aiButton}
                          onPress={fetchRecommendation}
                          disabled={loadingRecommendation}
                      >
                        <Text style={styles.aiButtonText}>
                          {loadingRecommendation ? '...' : 'Get Advice'}
                        </Text>
                      </TouchableOpacity>
                  )}
                </View>

                {recommendation ? (
                    <>
                      <Text style={styles.recommendation}>{recommendation}</Text>
                      <View style={styles.actionButtons}>
                        <TouchableOpacity
                            style={styles.keepButton}
                            onPress={() => setRecommendation(null)}
                        >
                          <Text style={styles.keepButtonText}>Dismiss</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.adjustButton}
                            onPress={adjustTodaysWorkout}
                            disabled={adjustingWorkout}
                        >
                          <Text style={styles.adjustButtonText}>
                            {adjustingWorkout ? 'Adjusting...' : 'Apply Adjustment'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </>
                ) : (
                    <Text style={styles.placeholder}>
                      Tap 'Get Advice' for personalized coaching based on your recovery metrics
                    </Text>
                )}
              </View>
          )}

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Today's Workout</Text>
            {loadingWorkout ? (
                <ActivityIndicator style={{marginTop: 12}}/>
            ) : todayWorkout ? (
                <View
                    style={[
                      styles.workoutCard,
                      {
                        backgroundColor: getWorkoutColor(todayWorkout.type).bg,
                        borderLeftColor: getWorkoutColor(todayWorkout.type).border,
                      },
                    ]}
                >
                  <View style={styles.workoutHeader}>
                    <Text
                        style={[
                          styles.workoutType,
                          {color: getWorkoutColor(todayWorkout.type).text},
                        ]}
                    >
                      {todayWorkout.type.toUpperCase()}
                    </Text>
                    <Text
                        style={[
                          styles.workoutDuration,
                          {color: getWorkoutColor(todayWorkout.type).text},
                        ]}
                    >
                      {todayWorkout.duration_minutes} min
                    </Text>
                  </View>
                  <Text style={styles.workoutDetails}>{todayWorkout.workout}</Text>
                  {todayWorkout.notes && (
                      <Text style={styles.workoutNotes}>{todayWorkout.notes}</Text>
                  )}
                </View>
            ) : (
                <Text style={styles.placeholder}>No workout planned for today, or no training plan generated yet.</Text>
            )}
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
          <CheckinScreen onComplete={() => setShowCheckin(false)}/>
        </Modal>

        <Modal visible={showHistory} animationType="slide" presentationStyle="pageSheet">
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowHistory(false)}>
              <Text style={styles.closeButton}>Close</Text>
            </TouchableOpacity>
          </View>
          <CheckinHistoryScreen/>
        </Modal>
      </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  safeArea: {
    backgroundColor: '#FFFFFF',
  },
  header: {
    backgroundColor: 'white',
    paddingBottom: 20,
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
    borderWidth: 1,
    borderColor: '#e0e0e0',
    // iOS
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 3,
    // Android
    elevation: 2,
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
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  keepButton: {
    flex: 1,
    backgroundColor: '#E8E8E8',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  keepButtonText: {
    color: '#333',
    fontSize: 15,
    fontWeight: '600',
  },
  adjustButton: {
    flex: 1,
    backgroundColor: '#34C759',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  adjustButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
  },
  workoutCard: {
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    marginTop: 12,
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  workoutType: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  workoutDuration: {
    fontSize: 14,
    fontWeight: '600',
  },
  workoutDetails: {
    fontSize: 15,
    color: '#333',
    marginBottom: 8,
    lineHeight: 22,
  },
  workoutNotes: {
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
    lineHeight: 20,
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