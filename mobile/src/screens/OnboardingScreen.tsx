import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { profileAPI } from '../services/api';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const INTENSITIES = ['light', 'moderate', 'hard'];

interface BadmintonSession {
  day: string;
  duration_minutes: string;
  intensity: string;
  type: string;
}

export default function OnboardingScreen({ onComplete }: { onComplete: () => void }) {
  const [badmintonSessions, setBadmintonSessions] = useState<BadmintonSession[]>([
    { day: 'monday', duration_minutes: '90', intensity: 'moderate', type: 'training' }
  ]);
  const [primarySport, setPrimarySport] = useState('both');
  const [runningGoal, setRunningGoal] = useState('');
  const [weeklyVolume, setWeeklyVolume] = useState('180');
  const [currentVolume, setCurrentVolume] = useState('');
  const [injuryArea, setInjuryArea] = useState('');
  const [loading, setLoading] = useState(false);

  const addBadmintonSession = () => {
    setBadmintonSessions([...badmintonSessions, {
      day: 'monday',
      duration_minutes: '90',
      intensity: 'moderate',
      type: 'training'
    }]);
  };

  const updateSession = (index: number, field: string, value: string) => {
    const updated = [...badmintonSessions];
    updated[index] = { ...updated[index], [field]: value };
    setBadmintonSessions(updated);
  };

  const removeSession = (index: number) => {
    if (badmintonSessions.length === 1) {
      Alert.alert('Error', 'Keep at least one badminton session');
      return;
    }
    setBadmintonSessions(badmintonSessions.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!runningGoal.trim()) {
      Alert.alert('Missing info', 'Please describe your running goal');
      return;
    }

    setLoading(true);
    try {
      const sessions = badmintonSessions.map(s => ({
        day: s.day,
        duration_minutes: parseInt(s.duration_minutes) || 90,
        intensity: s.intensity,
        type: s.type
      }));

      const injuries = injuryArea.trim() ? [{
        area: injuryArea,
        severity: 'moderate',
        notes: undefined
      }] : undefined;

      const runningExperience = {
        current_weekly_volume: currentVolume ? parseInt(currentVolume) : undefined,
      };

      await profileAPI.create({
        badminton_sessions: sessions,
        primary_sport: primarySport,
        running_goal: runningGoal,
        weekly_run_volume_target: parseInt(weeklyVolume) || 180,
        running_experience: runningExperience,
        current_injuries: injuries,
      });

      Alert.alert('Success', 'Profile created! Generating your first training plan...');
      onComplete();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.detail || 'Failed to create profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Quick Setup</Text>
      <Text style={styles.subtitle}>2 minutes to your first training plan</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Badminton Schedule</Text>

        {badmintonSessions.map((session, index) => (
          <View key={index} style={styles.sessionCard}>
            <View style={styles.sessionHeader}>
              <Text style={styles.sessionLabel}>Session {index + 1}</Text>
              {badmintonSessions.length > 1 && (
                <TouchableOpacity onPress={() => removeSession(index)}>
                  <Text style={styles.removeText}>Remove</Text>
                </TouchableOpacity>
              )}
            </View>

            <Text style={styles.label}>Day</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.daysRow}>
                {DAYS.map(day => (
                  <TouchableOpacity
                    key={day}
                    onPress={() => updateSession(index, 'day', day)}
                    style={[
                      styles.dayChip,
                      session.day === day && styles.dayChipSelected
                    ]}
                  >
                    <Text style={[
                      styles.dayChipText,
                      session.day === day && styles.dayChipTextSelected
                    ]}>
                      {day.slice(0, 3)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <Text style={styles.label}>Duration (minutes)</Text>
            <TextInput
              style={styles.input}
              value={session.duration_minutes}
              onChangeText={(val) => updateSession(index, 'duration_minutes', val)}
              keyboardType="number-pad"
              placeholder="90"
            />

            <Text style={styles.label}>Intensity</Text>
            <View style={styles.intensityRow}>
              {INTENSITIES.map(intensity => (
                <TouchableOpacity
                  key={intensity}
                  onPress={() => updateSession(index, 'intensity', intensity)}
                  style={[
                    styles.intensityChip,
                    session.intensity === intensity && styles.intensityChipSelected
                  ]}
                >
                  <Text style={[
                    styles.intensityText,
                    session.intensity === intensity && styles.intensityTextSelected
                  ]}>
                    {intensity}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        <TouchableOpacity style={styles.addButton} onPress={addBadmintonSession}>
          <Text style={styles.addButtonText}>+ Add another session</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Running Focus</Text>

        <Text style={styles.label}>Primary Focus</Text>
        <View style={styles.focusRow}>
          {['badminton', 'both', 'running'].map(sport => (
            <TouchableOpacity
              key={sport}
              onPress={() => setPrimarySport(sport)}
              style={[
                styles.focusChip,
                primarySport === sport && styles.focusChipSelected
              ]}
            >
              <Text style={[
                styles.focusText,
                primarySport === sport && styles.focusTextSelected
              ]}>
                {sport === 'both' ? 'Both Equally' : sport.charAt(0).toUpperCase() + sport.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Running Goal *</Text>
        <Text style={styles.hint}>What do you want to achieve?</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={runningGoal}
          onChangeText={setRunningGoal}
          placeholder="e.g., Improve 800m to sub-2:05, build aerobic base for badminton"
          multiline
        />

        <Text style={styles.label}>Target Weekly Run Volume (minutes)</Text>
        <TextInput
          style={styles.input}
          value={weeklyVolume}
          onChangeText={setWeeklyVolume}
          keyboardType="number-pad"
          placeholder="180"
        />

        <Text style={styles.label}>Current Weekly Volume (optional)</Text>
        <Text style={styles.hint}>Helps us start at the right level</Text>
        <TextInput
          style={styles.input}
          value={currentVolume}
          onChangeText={setCurrentVolume}
          keyboardType="number-pad"
          placeholder="120"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Injuries (optional)</Text>
        <TextInput
          style={styles.input}
          value={injuryArea}
          onChangeText={setInjuryArea}
          placeholder="e.g., left calf, right knee"
        />
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={handleSubmit}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Creating Profile...' : 'Create My Training Plan'}
        </Text>
      </TouchableOpacity>

      <Text style={styles.footer}>
        You can add more details later for better plans
      </Text>

      <View style={{ height: 50 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 60,
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  sessionCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sessionLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  removeText: {
    color: '#FF3B30',
    fontSize: 14,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 12,
  },
  hint: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
    marginTop: -4,
  },
  daysRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  dayChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  dayChipSelected: {
    backgroundColor: '#007AFF',
  },
  dayChipText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  dayChipTextSelected: {
    color: 'white',
  },
  input: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  intensityRow: {
    flexDirection: 'row',
    gap: 8,
  },
  intensityChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  intensityChipSelected: {
    backgroundColor: '#FF9500',
  },
  intensityText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  intensityTextSelected: {
    color: 'white',
    fontWeight: '600',
  },
  focusRow: {
    flexDirection: 'row',
    gap: 8,
  },
  focusChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  focusChipSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  focusText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  focusTextSelected: {
    color: 'white',
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: 'white',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
  },
  addButtonText: {
    color: '#007AFF',
    fontSize: 15,
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '600',
  },
  footer: {
    textAlign: 'center',
    color: '#999',
    fontSize: 14,
    marginTop: 16,
    marginBottom: 8,
  },
});