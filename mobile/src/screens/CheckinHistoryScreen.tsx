import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { api } from '../services/api';

type Checkin = {
  id: string;
  date: string;
  hrv: number | null;
  rhr: number | null;
  sleep_hours: number | null;
  sleep_quality: number | null;
  energy_level: number | null;
  soreness_level: number | null;
  notes: string | null;
};

export default function CheckinHistoryScreen() {
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await api.get('/api/checkins/history?limit=7');
      setCheckins(response.data);
    } catch (error) {
      console.error('Failed to fetch history', error);
    } finally {
      setLoading(false);
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
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Check-in History</Text>

      {checkins.length === 0 ? (
        <Text style={styles.emptyText}>No check-ins yet</Text>
      ) : (
        checkins.map((checkin) => (
          <View key={checkin.id} style={styles.card}>
            <Text style={styles.date}>
              {new Date(checkin.date).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric'
              })}
            </Text>

            <View style={styles.metricsGrid}>
              {checkin.sleep_hours && (
                <View style={styles.metric}>
                  <Text style={styles.metricLabel}>Sleep</Text>
                  <Text style={styles.metricValue}>{checkin.sleep_hours}h</Text>
                </View>
              )}

              {checkin.sleep_quality && (
                <View style={styles.metric}>
                  <Text style={styles.metricLabel}>Quality</Text>
                  <Text style={styles.metricValue}>{checkin.sleep_quality}/5</Text>
                </View>
              )}

              {checkin.hrv && (
                <View style={styles.metric}>
                  <Text style={styles.metricLabel}>HRV</Text>
                  <Text style={styles.metricValue}>{checkin.hrv}ms</Text>
                </View>
              )}

              {checkin.rhr && (
                <View style={styles.metric}>
                  <Text style={styles.metricLabel}>RHR</Text>
                  <Text style={styles.metricValue}>{checkin.rhr} bpm</Text>
                </View>
              )}

              {checkin.energy_level && (
                <View style={styles.metric}>
                  <Text style={styles.metricLabel}>Energy</Text>
                  <Text style={styles.metricValue}>{checkin.energy_level}/5</Text>
                </View>
              )}

              {checkin.soreness_level && (
                <View style={styles.metric}>
                  <Text style={styles.metricLabel}>Soreness</Text>
                  <Text style={styles.metricValue}>{checkin.soreness_level}/5</Text>
                </View>
              )}
            </View>

            {checkin.notes && (
              <Text style={styles.notes}>{checkin.notes}</Text>
            )}
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 40,
    marginBottom: 20,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 40,
    fontSize: 16,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  date: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
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
  notes: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
});