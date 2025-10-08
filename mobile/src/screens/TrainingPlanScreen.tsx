import { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../services/api';
import EditProfileScreen from './EditProfileScreen';

interface DayWorkout {
  type: string;
  workout: string;
  duration_minutes: number;
  notes: string;
  date: string;
}

interface TrainingPlan {
  monday: DayWorkout;
  tuesday: DayWorkout;
  wednesday: DayWorkout;
  thursday: DayWorkout;
  friday: DayWorkout;
  saturday: DayWorkout;
  sunday: DayWorkout;
}

export default function TrainingPlanScreen() {
  const [plan, setPlan] = useState<TrainingPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [generatedAt, setGeneratedAt] = useState<string>('');
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [selectedWorkout, setSelectedWorkout] = useState<{ day: string; workout: DayWorkout } | null>(null);
  const [completions, setCompletions] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadCurrentPlan();
  }, []);

  const loadCurrentPlan = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/coach/training-plan/current');
      setPlan(response.data.plan);
      setGeneratedAt(response.data.generated_at);

      if (response.data.plan.monday?.date) {
        const weekStart = response.data.plan.monday.date;
        await loadCompletions(weekStart);
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        await generatePlan();
      } else {
        Alert.alert('Error', 'Failed to load training plan');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadCompletions = async (weekStart: string) => {
    try {
      const response = await api.get(`/api/workouts/week?week_start=${weekStart}`);
      const completionMap: Record<string, boolean> = {};
      response.data.forEach((c: any) => {
        completionMap[c.date] = c.completed;
      });
      setCompletions(completionMap);
    } catch (error) {
      console.error('Failed to load completions:', error);
    }
  };

  const toggleCompletion = async (date: string, workoutType: string) => {
    const isCompleted = !completions[date];

    // Update UI immediately (optimistic update)
    setCompletions(prev => ({...prev, [date]: isCompleted}));

    try {
      // Then make API call in background
      await api.post('/api/workouts/complete', {
        date,
        workout_type: workoutType,
        completed: isCompleted
      });
    } catch (error) {
      // Revert on error
      setCompletions(prev => ({...prev, [date]: !isCompleted}));
      Alert.alert('Error', 'Failed to update completion');
    }
  };

  const generatePlan = async () => {
    setLoading(true);
    try {
      const response = await api.post('/api/coach/training-plan');
      setPlan(response.data.plan);
      setGeneratedAt(response.data.generated_at);

      if (response.data.plan.monday?.date) {
        const weekStart = response.data.plan.monday.date;
        await loadCompletions(weekStart);
      }
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.response?.data?.detail || 'Failed to generate training plan'
      );
    } finally {
      setLoading(false);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'run':
        return '#DB8A74';
      case 'badminton':
        return '#544F69';
      case 'rest':
        return '#8EBFE1';
      case 'strength':
        return '#85B79D';
      case 'cross-training':
        return '#EEA7F1';
      default:
        return '#FAEDCB';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'run':
        return 'R';
      case 'badminton':
        return 'B';
      case 'rest':
        return '···';
      case 'strength':
        return 'S';
      case 'cross-training':
        return 'X';
      default:
        return '?';
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const renderDayCard = (dayName: string, workout: DayWorkout) => {
    const color = getTypeColor(workout.type);
    const isCompleted = completions[workout.date] || false;

    return (
      <View key={dayName} style={styles.dayCard}>
        <TouchableOpacity
          style={styles.cardTouchable}
          onPress={() => setSelectedWorkout({ day: dayName, workout })}
          activeOpacity={0.6}
        >
          <View style={[styles.cardLeft, { backgroundColor: color, opacity: isCompleted ? 0.5 : 1 }]}>
            <Text style={styles.typeIcon}>{getTypeIcon(workout.type)}</Text>
          </View>

          <View style={styles.cardRight}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={[styles.dayName, isCompleted && styles.completedText]}>{dayName}</Text>
                <Text style={styles.dayDate}>{formatDate(workout.date)}</Text>
              </View>
            </View>

            <View style={[styles.typePill, { backgroundColor: color + '15' }]}>
              <Text style={[styles.typePillText, { color }]}>{workout.type.toUpperCase()}</Text>
              <View style={[styles.separator, { backgroundColor: color + '30' }]} />
              <Text style={[styles.typePillText, { color }]}>{workout.duration_minutes}min</Text>
            </View>

            <Text style={[styles.workoutPreview, isCompleted && styles.completedText]} numberOfLines={2}>
              {workout.workout}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={() => toggleCompletion(workout.date, workout.type)}
        >
          <View style={[styles.checkbox, isCompleted && { backgroundColor: color, borderColor: color }]}>
            {isCompleted && <Text style={styles.checkmark}>✓</Text>}
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#DB8A74" />
        <Text style={styles.loadingText}>Generating your plan...</Text>
      </View>
    );
  }

  if (!plan) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorEmoji}>📋</Text>
        <Text style={styles.errorText}>No training plan available</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={generatePlan}>
          <Text style={styles.primaryButtonText}>Generate Plan</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const completedCount = Object.values(completions).filter(Boolean).length;

  return (
      <View style={styles.container}>
        <SafeAreaView style={[styles.container, styles.safeArea]} edges={['top']}>
          <View style={styles.header}>
            <View style={{width: 40}}/>

            <View style={styles.titleContainer}>
              <Text style={styles.title}>This Week</Text>
              <Text style={styles.completionStats}>{completedCount}/7 completed</Text>
            </View>

            <TouchableOpacity
                style={styles.menuButton}
                onPress={() => setShowMenu(true)}
            >
              <View style={styles.menuLine}/>
              <View style={[styles.menuLine, {marginTop: 3, marginBottom: 3}]}/>
              <View style={styles.menuLine}/>
            </TouchableOpacity>
          </View>

          <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
          >
            {days.map((day) => renderDayCard(
                day.charAt(0).toUpperCase() + day.slice(1),
                plan[day as keyof TrainingPlan]
            ))}

            <View style={{height: 100}}/>
          </ScrollView>

          <Modal
              visible={showEditProfile}
              animationType="slide"
              presentationStyle="pageSheet"
          >
            <EditProfileScreen onClose={() => setShowEditProfile(false)}/>
          </Modal>

          <Modal
              visible={showMenu}
              animationType="fade"
              transparent={true}
              onRequestClose={() => setShowMenu(false)}
          >
            <TouchableOpacity
                style={styles.menuOverlay}
                activeOpacity={1}
                onPress={() => setShowMenu(false)}
            >
              <View style={styles.menuContent}>
                <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => {
                      setShowMenu(false);
                      setShowEditProfile(true);
                    }}
                >
                  <Text style={styles.menuItemText}>Edit Profile</Text>
                </TouchableOpacity>

                <View style={styles.menuDivider}/>

                <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => {
                      setShowMenu(false);
                      generatePlan();
                    }}
                >
                  <Text style={styles.menuItemText}>Generate New Plan</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </Modal>

          <Modal
              visible={selectedWorkout !== null}
              animationType="slide"
              transparent={true}
              onRequestClose={() => setSelectedWorkout(null)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                {selectedWorkout && (
                    <>
                      <View style={styles.modalHeader}>
                        <View>
                          <Text style={styles.modalDay}>{selectedWorkout.day}</Text>
                          <Text style={styles.modalDate}>
                            {formatDate(selectedWorkout.workout.date)}
                          </Text>
                        </View>
                        <TouchableOpacity
                            onPress={() => setSelectedWorkout(null)}
                            style={styles.closeButton}
                        >
                          <Text style={styles.closeButtonText}>✕</Text>
                        </TouchableOpacity>
                      </View>

                      <View style={[
                        styles.modalTypeBadge,
                        {backgroundColor: getTypeColor(selectedWorkout.workout.type)}
                      ]}>
                        <Text style={styles.modalTypeText}>
                          {getTypeIcon(selectedWorkout.workout.type)} {selectedWorkout.workout.type.toUpperCase()}
                        </Text>
                        <View style={styles.modalDurationBadge}>
                          <Text style={styles.modalDurationText}>
                            {selectedWorkout.workout.duration_minutes} min
                          </Text>
                        </View>
                      </View>

                      <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                        <View style={styles.modalSection}>
                          <Text style={styles.modalSectionTitle}>WORKOUT</Text>
                          <Text style={styles.modalWorkoutText}>{selectedWorkout.workout.workout}</Text>
                        </View>

                        {selectedWorkout.workout.notes && (
                            <View style={styles.modalSection}>
                              <Text style={styles.modalSectionTitle}>NOTES</Text>
                              <Text style={styles.modalNotes}>{selectedWorkout.workout.notes}</Text>
                            </View>
                        )}
                      </ScrollView>

                      <TouchableOpacity
                          style={[styles.modalButton, {backgroundColor: getTypeColor(selectedWorkout.workout.type)}]}
                          onPress={() => setSelectedWorkout(null)}
                      >
                        <Text style={styles.modalButtonText}>Close</Text>
                      </TouchableOpacity>
                    </>
                )}
              </View>
            </View>
          </Modal>
          </SafeAreaView>
      </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F6',
  },
    safeArea: {
    backgroundColor: '#FFFFFF',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FAF8F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E7E5E1',
  },
  menuButton: {
    width: 40,
    height: 40,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuLine: {
    width: 20,
    height: 2,
    backgroundColor: '#57534E',
    borderRadius: 1,
  },
  titleContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  completionStats: {
    fontSize: 13,
    color: '#78716C',
    marginTop: 2,
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-start',
    paddingTop: 100,
    paddingHorizontal: 20,
  },
  menuContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  menuItem: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#E7E5E1',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#78716C',
  },
  errorEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 18,
    color: '#78716C',
    marginBottom: 24,
  },
  dayCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#E7E5E1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    position: 'relative',
  },
  cardTouchable: {
    flex: 1,
    flexDirection: 'row',
  },
  cardLeft: {
    width: 70,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeIcon: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cardRight: {
    flex: 1,
    padding: 16,
  },
  cardHeader: {
    marginBottom: 12,
  },
  dayName: {
    fontSize: 19,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  completedText: {
    opacity: 0.5,
    textDecorationLine: 'line-through',
  },
  dayDate: {
    fontSize: 13,
    color: '#A8A29E',
    fontWeight: '500',
  },
  checkboxContainer: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 4,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  typePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  typePillText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  separator: {
    width: 1,
    height: 12,
    marginHorizontal: 8,
  },
  workoutPreview: {
    fontSize: 14,
    color: '#57534E',
    lineHeight: 20,
  },
  primaryButton: {
    backgroundColor: '#DB8A74',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  modalDay: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  modalDate: {
    fontSize: 15,
    color: '#78716C',
    marginTop: 4,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FAF8F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: '#78716C',
    fontWeight: '300',
  },
  modalTypeBadge: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  modalTypeText: {
    fontSize: 14,
    fontWeight: '700',
    color: 'white',
    letterSpacing: 0.5,
  },
  modalDurationBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  modalDurationText: {
    fontSize: 13,
    fontWeight: '700',
    color: 'white',
  },
  modalScroll: {
    maxHeight: 400,
  },
  modalSection: {
    marginBottom: 24,
  },
  modalSectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#A8A29E',
    letterSpacing: 1,
    marginBottom: 12,
  },
  modalWorkoutText: {
    fontSize: 16,
    color: '#1A1A1A',
    lineHeight: 24,
  },
  modalNotes: {
    fontSize: 15,
    color: '#78716C',
    lineHeight: 22,
  },
  modalButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});