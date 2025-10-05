import { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform} from 'react-native';
import { api } from '../services/api';

export default function CheckinScreen({ onComplete }: { onComplete: () => void }) {
  const today = new Date().toISOString().split('T')[0];
  const scrollViewRef = useRef<ScrollView>(null);

  const [formData, setFormData] = useState({
    sleep_hours: '',
    sleep_quality: '',
    hrv: '',
    rhr: '',
    soreness_level: '',
    energy_level: '',
    notes: '',
  });

  const [loading, setLoading] = useState(false);
  const [isUpdate, setIsUpdate] = useState(false);

  useEffect(() => {
    fetchTodayCheckin();
  }, []);

  const fetchTodayCheckin = async () => {
    try {
      const response = await api.get('/api/checkins/today');
      const data = response.data;

      setFormData({
        sleep_hours: data.sleep_hours?.toString() || '',
        sleep_quality: data.sleep_quality?.toString() || '',
        hrv: data.hrv?.toString() || '',
        rhr: data.rhr?.toString() || '',
        soreness_level: data.soreness_level?.toString() || '',
        energy_level: data.energy_level?.toString() || '',
        notes: data.notes || '',
      });
      setIsUpdate(true);
    } catch (error) {
      setIsUpdate(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const payload = {
        date: today,
        sleep_hours: formData.sleep_hours ? parseFloat(formData.sleep_hours) : null,
        sleep_quality: formData.sleep_quality ? parseInt(formData.sleep_quality) : null,
        hrv: formData.hrv ? parseInt(formData.hrv) : null,
        rhr: formData.rhr ? parseInt(formData.rhr) : null,
        soreness_level: formData.soreness_level ? parseInt(formData.soreness_level) : null,
        soreness_areas: null,
        energy_level: formData.energy_level ? parseInt(formData.energy_level) : null,
        notes: formData.notes || null,
      };

      await api.post('/api/checkins', payload);
      Alert.alert('Success', isUpdate ? 'Check-in updated!' : 'Check-in saved!');
      onComplete();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.detail || 'Failed to save check-in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView
        style={styles.container}
        ref={scrollViewRef}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <Text style={styles.title}>Daily Check-in</Text>
        <Text style={styles.subtitle}>
          {isUpdate ? 'Update your metrics' : 'How are you feeling today?'}
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sleep</Text>
          <View style={styles.row}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Hours</Text>
              <TextInput
                style={styles.input}
                value={formData.sleep_hours}
                onChangeText={(value) => setFormData({...formData, sleep_hours: value})}
                keyboardType="decimal-pad"
                placeholder="7.5"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Quality (1-5)</Text>
              <TextInput
                style={styles.input}
                value={formData.sleep_quality}
                onChangeText={(value) => setFormData({...formData, sleep_quality: value})}
                keyboardType="number-pad"
                placeholder="4"
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Heart Metrics</Text>
          <View style={styles.row}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>HRV</Text>
              <TextInput
                style={styles.input}
                value={formData.hrv}
                onChangeText={(value) => setFormData({...formData, hrv: value})}
                keyboardType="number-pad"
                placeholder="65"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>RHR</Text>
              <TextInput
                style={styles.input}
                value={formData.rhr}
                onChangeText={(value) => setFormData({...formData, rhr: value})}
                keyboardType="number-pad"
                placeholder="58"
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How You Feel</Text>
          <View style={styles.row}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Energy (1-5)</Text>
              <TextInput
                style={styles.input}
                value={formData.energy_level}
                onChangeText={(value) => setFormData({...formData, energy_level: value})}
                onFocus={() => {
                  setTimeout(() => {
                    scrollViewRef.current?.scrollTo({ y: 215, animated: true });
                  }, 100);
                }}
                keyboardType="number-pad"
                placeholder="4"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Soreness (1-5)</Text>
              <TextInput
                style={styles.input}
                value={formData.soreness_level}
                onChangeText={(value) => setFormData({...formData, soreness_level: value})}
                onFocus={() => {
                  setTimeout(() => {
                    scrollViewRef.current?.scrollTo({ y: 215, animated: true });
                  }, 100);
                }}
                keyboardType="number-pad"
                placeholder="2"
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Notes (optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.notes}
            onChangeText={(value) => setFormData({...formData, notes: value})}
            onFocus={() => {
              setTimeout(() => {
                scrollViewRef.current?.scrollTo({ y: 260, animated: true });
              },100);
            }}
            multiline
            numberOfLines={4}
            placeholder="How are you feeling? Any concerns?"
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Saving...' : isUpdate ? 'Update Check-in' : 'Save Check-in'}
          </Text>
        </TouchableOpacity>

        {/* Extra padding for keyboard */}
        <View style={{ height: 200 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    marginTop: 0,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  inputGroup: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
  input: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});