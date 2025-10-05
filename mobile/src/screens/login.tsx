import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async () => {
    if (!email || !password || (!isLogin && !name)) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        // Register
        await api.post('/api/auth/register', { email, name, password });
        // Then login
        await login(email, password);
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>ForAthlete</Text>
      <Text style={styles.subtitle}>Your AI Training Coach</Text>

      <View style={styles.toggleContainer}>
        <TouchableOpacity
          onPress={() => setIsLogin(true)}
          style={[styles.toggleButton, isLogin && styles.toggleButtonActive]}
        >
          <Text style={[styles.toggleText, isLogin && styles.toggleTextActive]}>Login</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setIsLogin(false)}
          style={[styles.toggleButton, !isLogin && styles.toggleButtonActive]}
        >
          <Text style={[styles.toggleText, !isLogin && styles.toggleTextActive]}>Register</Text>
        </TouchableOpacity>
      </View>

      {!isLogin && (
        <TextInput
          style={styles.input}
          placeholder="Name"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
        />
      )}

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleSubmit}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Loading...' : isLogin ? 'Login' : 'Create Account'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 40,
  },
  toggleContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 8,
  },
  toggleButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'white',
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#007AFF',
  },
  toggleText: {
    fontSize: 16,
    color: '#666',
  },
  toggleTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  input: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});