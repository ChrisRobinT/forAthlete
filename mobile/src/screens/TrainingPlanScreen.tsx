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

  useEffect(() => {
    loadCurrentPlan();
  }, []);

  const loadCurrentPlan = async () => {
    setLoading(true);
    try {
      // Try to load existing plan first
      const response = await api.get('/api/coach/training-plan/current');
      setPlan(response.data.plan);
      setGeneratedAt(response.data.generated_at);
    } catch (error: any) {
      if (error.response?.status === 404) {
        // No plan exists, generate one
        await generatePlan();
      } else {
        Alert.alert('Error', 'Failed to load training plan');
      }
    } finally {
      setLoading(false);
    }
  };

  const generatePlan = async () => {
    setLoading(true);
    try {
      const response = await api.post('/api/coach/training-plan');
      setPlan(response.data.plan);
      setGeneratedAt(response.data.generated_at);
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
        return '#34C759';
      case 'badminton':
        return '#007AFF';
      case 'rest':
        return '#8E8E93';
      case 'strength':
        return '#FF2D55';
      case 'cross-training':
        return '#FF9500';
      default:
        return '#5856D6';
    }
  };

  const getTypeEmoji = (type: string) => {
    switch (type.toLowerCase()) {
      case 'run':
        return '🏃';
      case 'badminton':
        return '🏸';
      case 'rest':
        return '😴';
      case 'strength':
        return '💪';
      case 'cross-training':
        return '🚴';
      default:
        return '📋';
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const renderDayCard = (dayName: string, workout: DayWorkout) => {
    return (
      <View key={dayName} style={styles.dayCard}>
        <View style={styles.dayHeader}>
          <View style={styles.dayTitleRow}>
            <Text style={styles.dayEmoji}>{getTypeEmoji(workout.type)}</Text>
            <View>
              <Text style={styles.dayName}>{dayName}</Text>
              <Text style={styles.dayDate}>{formatDate(workout.date)}</Text>
            </View>
          </View>
          <View
            style={[
              styles.typeBadge,
              { backgroundColor: getTypeColor(workout.type) + '20' },
            ]}
          >
            <Text
              style={[styles.typeText, { color: getTypeColor(workout.type) }]}
            >
              {workout.type}
            </Text>
          </View>
        </View>

        <Text style={styles.workoutText}>{workout.workout}</Text>

        <View style={styles.workoutFooter}>
          <Text style={styles.duration}>
            ⏱️ {workout.duration_minutes} min
          </Text>
          {workout.notes && (
            <Text style={styles.notes}>💡 {workout.notes}</Text>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Generating your training plan...</Text>
      </View>
    );
  }

  if (!plan) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>No training plan available</Text>
        <TouchableOpacity style={styles.button} onPress={generatePlan}>
          <Text style={styles.buttonText}>Generate Plan</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const totalRunMinutes = days.reduce((sum, day) => {
    const workout = plan[day as keyof TrainingPlan];
    return workout.type.toLowerCase() === 'run'
      ? sum + workout.duration_minutes
      : sum;
  }, 0);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Training Plan</Text>
        {generatedAt && (
          <Text style={styles.generatedDate}>
            Generated {new Date(generatedAt).toLocaleDateString()}
          </Text>
        )}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryText}>
            Total Run Volume: {totalRunMinutes} min
          </Text>
        </View>
        <TouchableOpacity
          style={styles.refineButton}
          onPress={() => setShowEditProfile(true)}
        >
          <Text style={styles.refineButtonText}>✨ Refine Profile for Better Plans</Text>
        </TouchableOpacity>
      </View>

      {days.map((day) => renderDayCard(
        day.charAt(0).toUpperCase() + day.slice(1),
        plan[day as keyof TrainingPlan]
      ))}

      <TouchableOpacity
        style={styles.regenerateButton}
        onPress={generatePlan}
        disabled={loading}
      >
        <Text style={styles.regenerateButtonText}>🔄 Regenerate Plan</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />

      <Modal
        visible={showEditProfile}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <EditProfileScreen onClose={() => setShowEditProfile(false)} />
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  generatedDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  summaryCard: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
  },
  summaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  refineButton: {
    backgroundColor: '#F0F0F0',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    alignItems: 'center',
  },
  refineButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  dayCard: {
    backgroundColor: 'white',
    margin: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dayTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dayEmoji: {
    fontSize: 32,
  },
  dayName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  dayDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  workoutText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    marginBottom: 12,
  },
  workoutFooter: {
    gap: 8,
  },
  duration: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  notes: {
    fontSize: 14,
    color: '#007AFF',
    fontStyle: 'italic',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  regenerateButton: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  regenerateButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
});