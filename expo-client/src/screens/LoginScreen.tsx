import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Theme } from '../theme';
import { NeumorphView } from '../components/NeumorphView';
import { ApiClient } from '../api/ApiClient';
import * as WebBrowser from 'expo-web-browser';

import * as Linking from 'expo-linking';

interface Props {
  onLoginSuccess: (username: string) => void;
  onGoToSignup: () => void;
}

import { Platform } from 'react-native';

const KAKAO_REST_API_KEY = '3561b2d56ccfedbef1d54c2172b29aa5';
const BACKEND_CALLBACK_URL = 'http://172.16.11.203:3001/api/auth/kakao/callback';

export const LoginScreen: React.FC<Props> = ({ onLoginSuccess, onGoToSignup }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleKakaoLogin = async () => {
    try {
      setIsLoading(true);
      setError('');
      const returnUrl = Linking.createURL('login');
      const authUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_REST_API_KEY}&redirect_uri=${BACKEND_CALLBACK_URL}&response_type=code&state=${encodeURIComponent(returnUrl)}`;
      
      const result = await WebBrowser.openAuthSessionAsync(authUrl, returnUrl);
      
      if (result.type === 'success' && result.url) {
        const token = result.url.split('token=')[1];
        if (token) {
          ApiClient.setToken(token);
          onLoginSuccess('Kakao User');
        } else {
          setError('Failed to get token from login. URL: ' + result.url);
        }
      } else {
         setError('Login cancelled or failed: ' + result.type);
      }
    } catch (e: any) {
      setError(e.message || 'Kakao login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    setError('');
    if (!username.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }
    
    setIsLoading(true);
    try {
      await ApiClient.login(username, password);
      onLoginSuccess(username);
    } catch (e: any) {
      setError(e.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>DevGround</Text>
      
      <View style={styles.form}>
        <Text style={styles.label}>Username</Text>
        <NeumorphView radius={12} style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            placeholder="Enter username"
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
            placeholder="Enter password"
            placeholderTextColor={Theme.colors.textLight}
            secureTextEntry
          />
        </NeumorphView>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity style={styles.buttonContainer} onPress={handleLogin} disabled={isLoading} activeOpacity={0.8}>
          <NeumorphView radius={12} style={styles.button}>
            {isLoading ? (
              <ActivityIndicator color={Theme.colors.primary} />
            ) : (
              <Text style={styles.buttonText}>Login</Text>
            )}
          </NeumorphView>
        </TouchableOpacity>

        <View style={styles.dividerContainer}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.socialContainer}>
          <TouchableOpacity 
            style={[styles.socialButton, { backgroundColor: '#FEE500' }]} 
            onPress={handleKakaoLogin}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            <Text style={[styles.socialButtonText, { color: '#000000' }]}>카카오 로그인</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.socialButton, { backgroundColor: '#03C75A' }]} 
            onPress={() => console.log('Naver login')}
            activeOpacity={0.8}
          >
            <Text style={[styles.socialButtonText, { color: '#FFFFFF' }]}>네이버 로그인</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.switchContainer} onPress={onGoToSignup}>
          <Text style={styles.switchText}>Don't have an account? <Text style={styles.switchTextBold}>Sign up</Text></Text>
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
    fontSize: 36,
    fontWeight: '800',
    color: Theme.colors.primary,
    textAlign: 'center',
    marginBottom: 48,
    letterSpacing: 2,
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
    marginBottom: 24,
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
    marginTop: 16,
  },
  button: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.colors.background, // Ensure Neumorph background matches
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
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    marginHorizontal: 16,
    color: Theme.colors.textLight,
    fontWeight: '600',
  },
  socialContainer: {
    gap: 12,
  },
  socialButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialButtonText: {
    fontWeight: '700',
    fontSize: 16,
  }
});
