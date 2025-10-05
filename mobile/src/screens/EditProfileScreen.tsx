import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { profileAPI } from '../services/api';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export default function EditProfileScreen({ onClose }: { onClose: () => void }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Advanced fields
  const [targetRace, setTargetRace] = useState('');
  const [yearsRunning, setYearsRunning] = useState('');
  const [longestRun, setLongestRun] = useState('');
  const [preferredRunDays, setPreferredRunDays] = useState<string[]>([]);
  const [avoidRunDays, setAvoidRunDays] = useState<string[]>([]);
  const [sleepAverage, setSleepAverage] = useState('');
  const [otherCommitments, setOtherCommitments] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await profileAPI.get();
      const profile = response.data;

      setTargetRace(profile.target_race || '');
      setYearsRunning(profile.running_experience?.years_running?.toString() || '');
      setLongestRun(profile.running_experience?.longest_run?.toString() || '');
      setPreferredRunDays(profile.preferred_run_days || []);
      setAvoidRunDays(profile.avoid_run_days || []);
      setSleepAverage(profile.sleep_average?.toString() || '');
      setOtherCommitments(profile.other_commitments || '');
    } catch (error) {
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const toggleDay = (day: string, list: string[], setter: (days: string[]) => void) => {
    if (list.includes(day)) {
      setter(list.filter(d => d !== day));
    } else {
      setter([...list, day]);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const runningExperience = {
        years_running: yearsRunning ? parseInt(yearsRunning) : undefined,
        longest_run: longestRun ? parseInt(longestRun) : undefined,
      };

      await profileAPI.update({
        target_race: targetRace || undefined,
        running_experience: runningExperience,
        preferred_run_days: preferredRunDays.length > 0 ? preferredRunDays : undefined,
        avoid_run_days: avoidRunDays.length > 0 ? avoidRunDays : undefined,
        sleep_average: sleepAverage ? parseFloat(sleepAverage) : undefined,
        other_commitments: otherCommitments || undefined,
      });

      Alert.alert('Success', 'Profile updated! Your next training plan will be more personalized.');
      onClose();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.closeButton}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Refine Profile</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving}>
          <Text style={[styles.saveButton, saving && styles.saveButtonDisabled]}>
            {saving ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.intro}>
          Adding these details will help create more personalized training plans
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Running Details</Text>

          <Text style={styles.label}>Target Race/Event</Text>
          <Text style={styles.hint}>e.g., "800m in 6 weeks", "5K in 3 months"</Text>
          <TextInput
            style={styles.input}
            value={targetRace}
            onChangeText={setTargetRace}
            placeholder="Optional"
          />

          <Text style={styles.label}>Years Running</Text>
          <TextInput
            style={styles.input}
            value={yearsRunning}
            onChangeText={setYearsRunning}
            keyboardType="number-pad"
            placeholder="Optional"
          />

          <Text style={styles.label}>Longest Run (minutes)</Text>
          <Text style={styles.hint}>Your longest continuous run ever</Text>
          <TextInput
            style={styles.input}
            value={longestRun}
            onChangeText={setLongestRun}
            keyboardType="number-pad"
            placeholder="Optional"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Schedule Preferences</Text>

          <Text style={styles.label}>Preferred Run Days</Text>
          <Text style={styles.hint}>Days when you prefer to run</Text>
          <View style={styles.daysGrid}>
            {DAYS.map(day => (
              <TouchableOpacity
                key={day}
                onPress={() => toggleDay(day, preferredRunDays, setPreferredRunDays)}
                style={[
                  styles.dayButton,
                  preferredRunDays.includes(day) && styles.dayButtonSelected
                ]}
              >
                <Text style={[
                  styles.dayText,
                  preferredRunDays.includes(day) && styles.dayTextSelected
                ]}>
                  {day.slice(0, 3)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Days to Avoid Running</Text>
          <Text style={styles.hint}>Days when you definitely can't run</Text>
          <View style={styles.daysGrid}>
            {DAYS.map(day => (
              <TouchableOpacity
                key={day}
                onPress={() => toggleDay(day, avoidRunDays, setAvoidRunDays)}
                style={[
                  styles.dayButton,
                  avoidRunDays.includes(day) && styles.dayButtonSelected
                ]}
              >
                <Text style={[
                  styles.dayText,
                  avoidRunDays.includes(day) && styles.dayTextSelected
                ]}>
                  {day.slice(0, 3)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lifestyle</Text>

          <Text style={styles.label}>Average Sleep (hours)</Text>
          <TextInput
            style={styles.input}
            value={sleepAverage}
            onChangeText={setSleepAverage}
            keyboardType="decimal-pad"
            placeholder="e.g., 7.5"
          />

          <Text style={styles.label}>Other Commitments</Text>
          <Text style={styles.hint}>Work travel, family time, etc.</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={otherCommitments}
            onChangeText={setOtherCommitments}
            placeholder="e.g., Work travel Wednesdays, busy weekend mornings"
            multiline
          />
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    fontSize: 16,
    color: '#007AFF',
  },
  saveButton: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  saveButtonDisabled: {
    color: '#999',
  },
  content: {
    flex: 1,
  },
  intro: {
    fontSize: 15,
    color: '#666',
    padding: 20,
    paddingBottom: 8,
    lineHeight: 22,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
    marginTop: 16,
  },
  hint: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
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
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  dayButtonSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  dayText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  dayTextSelected: {
    color: 'white',
    fontWeight: '600',
  },
});