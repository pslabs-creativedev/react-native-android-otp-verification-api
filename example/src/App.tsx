import React, { useEffect, useState } from 'react';
import { Button, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  receiveVerificationSMS,
  removeAllListeners,
  startSmsRetriever,
  startSmsUserConsent,
} from 'react-native-android-otp-verification-api';

export default function App() {
  const [otp, setOtp] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const subscription = receiveVerificationSMS((err, sms) => {
      if (err) {
        setError(err.message);
        return;
      }

      if (!sms) {
        return;
      }

      setMessage(sms);
      const match = /\b(\d{6})\b/.exec(sms);
      setOtp(match ? match[1] : '');
      setError('');
    });

    return () => {
      subscription?.remove?.();
      removeAllListeners();
    };
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>OTP Verification Example</Text>
      <Text style={styles.subtitle}>
        Test SMS User Consent or SMS Retriever on a real Android device.
      </Text>

      <View style={styles.buttonGroup}>
        <Button title="Start User Consent" onPress={() => startSmsUserConsent()} />
      </View>

      <View style={styles.buttonGroup}>
        <Button title="Start Retriever" onPress={() => startSmsRetriever()} />
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Detected OTP</Text>
        <Text style={styles.value}>{otp || '-'}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Latest SMS</Text>
        <Text style={styles.message}>{message || '-'}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Error</Text>
        <Text style={styles.error}>{error || '-'}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    gap: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: '#4b5563',
  },
  buttonGroup: {
    marginTop: 8,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f5f7fb',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },
  value: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  message: {
    fontSize: 14,
    lineHeight: 22,
    color: '#111827',
  },
  error: {
    fontSize: 14,
    lineHeight: 22,
    color: '#b91c1c',
  },
});
