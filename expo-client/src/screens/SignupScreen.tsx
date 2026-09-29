import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Theme } from '../theme';
import { NeumorphView } from '../components/NeumorphView';
import { ApiClient } from '../api/ApiClient';

interface Props {
  onSignupSuccess: (username: string) => void;
  onGoToLogin: () => void;
}

export const SignupScreen: React.FC<Props> = ({ onSignupSuccess, onGoToLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignup = async () => {
    setError('');
    if (!username.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      await ApiClient.signup(username, password);
      onSignupSuccess(username);
    } catch (e: any) {
      setError(e.message || 'Signup failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Join DevGround</Text>
      
      <View style={styles.form}>
        <Text style={styles.label}>Username</Text>
        <NeumorphView radius={12} style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            placeholder="Choose a username"
            placeholderTextColor={Theme.colors.textLight}
            autoCapitalize="none"
          />
        </NeumorphView>

        <Text style={styles.label}>Password</Text>
        <NeumorphView radius={12} style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Create password"
            placeholderTextColor={Theme.colors.textLight}
            secureTextEntry
          />
        </NeumorphView>

        <Text style={styles.label}>Confirm Password</Text>
        <NeumorphView radius={12} style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Confirm password"
            placeholderTextColor={Theme.colors.textLight}
            secureTextEntry
          />
        </NeumorphView>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity style={styles.buttonContainer} onPress={handleSignup} disabled={isLoading} activeOpacity={0.8}>
          <NeumorphView radius={12} style={styles.button}>
            {isLoading ? (
              <ActivityIndicator color={Theme.colors.primary} />
            ) : (
              <Text style={styles.buttonText}>Sign Up</Text>
            )}
          </NeumorphView>
        </TouchableOpacity>

        <TouchableOpacity style={styles.switchContainer} onPress={onGoToLogin}>
          <Text style={styles.switchText}>Already have an account? <Text style={styles.switchTextBold}>Log in</Text></Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
    justifyContent: 'center',
    padding: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: Theme.colors.primary,
    textAlign: 'center',
    marginBottom: 40,
    letterSpacing: 1,
  },
  form: {
    width: '100%',
  },
  label: {
    color: Theme.colors.textLight,
    fontWeight: '600',
    marginBottom: 12,
    marginLeft: 4,
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    color: Theme.colors.text,
    padding: 16,
    fontSize: 16,
  },
  errorText: {
    color: Theme.colors.error,
    marginBottom: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
  buttonContainer: {
    marginTop: 8,
  },
  button: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.colors.background,
  },
  buttonText: {
    color: Theme.colors.primary,
    fontWeight: '700',
    fontSize: 18,
  },
  switchContainer: {
    marginTop: 32,
    alignItems: 'center',
  },
  switchText: {
    color: Theme.colors.textLight,
    fontSize: 15,
  },
  switchTextBold: {
    color: Theme.colors.accent,
    fontWeight: '700',
  }
});
