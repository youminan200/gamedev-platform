import { useState, useEffect } from 'react';
import { View, Text, Platform, StatusBar, Image, ActivityIndicator } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import * as Network from 'expo-network';
import { Theme } from './src/theme';
import { LoginScreen } from './src/screens/LoginScreen';
import { MainFeedScreen } from './src/screens/MainFeedScreen';
import { PostingScreen } from './src/screens/PostingScreen';
import { DetailScreen } from './src/screens/DetailScreen';

import { SignupScreen } from './src/screens/SignupScreen';

type ScreenState = 
  | { type: 'Splash' }
  | { type: 'Offline' }
  | { type: 'Login' }
  | { type: 'Signup' }
  | { type: 'MainFeed' }
  | { type: 'Detail'; id: string }
  | { type: 'Posting' };

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenState>({ type: 'Splash' });
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    const checkNetworkAndInitialize = async () => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const state = await Network.getNetworkStateAsync();
      if (state.isConnected && state.isInternetReachable !== false) {
        setCurrentScreen({ type: 'Login' });
      } else {
        setCurrentScreen({ type: 'Offline' });
      }
    };
    checkNetworkAndInitialize();
  }, []);

  let content;
  switch (currentScreen.type) {
    case 'Splash':
      content = (
        <View style={{ flex: 1, backgroundColor: Theme.colors.background, justifyContent: 'center', alignItems: 'center' }}>
          <Image source={require('./assets/splash.png')} style={{ width: '100%', height: '100%', resizeMode: 'cover' }} />
        </View>
      );
      break;
    case 'Offline':
      content = (
        <View style={{ flex: 1, backgroundColor: Theme.colors.background, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
          <Text style={{ fontSize: 24, color: Theme.colors.error, fontWeight: '700', marginBottom: 16 }}>Offline</Text>
          <Text style={{ fontSize: 16, color: Theme.colors.textLight, textAlign: 'center' }}>Please check your internet connection and restart the app.</Text>
        </View>
      );
      break;
    case 'Login':
      content = (
        <LoginScreen 
          onLoginSuccess={(user) => {
            setUsername(user);
            setCurrentScreen({ type: 'MainFeed' });
          }} 
          onGoToSignup={() => setCurrentScreen({ type: 'Signup' })}
        />
      );
      break;
    case 'Signup':
      content = (
        <SignupScreen 
          onSignupSuccess={(user) => {
            setUsername(user);
            setCurrentScreen({ type: 'MainFeed' });
          }} 
          onGoToLogin={() => setCurrentScreen({ type: 'Login' })}
        />
      );
      break;
    case 'MainFeed':
      content = (
        <MainFeedScreen 
          onDevLogClick={(id) => setCurrentScreen({ type: 'Detail', id })}
          onPostClick={() => setCurrentScreen({ type: 'Posting' })}
        />
      );
      break;
    case 'Detail':
      content = (
        <DetailScreen 
          id={currentScreen.id}
          onBack={() => setCurrentScreen({ type: 'MainFeed' })}
        />
      );
      break;
    case 'Posting':
      content = (
        <PostingScreen 
          username={username || 'Anonymous'}
          onCancel={() => setCurrentScreen({ type: 'MainFeed' })}
          onPostSuccess={() => setCurrentScreen({ type: 'MainFeed' })}
        />
      );
      break;
  }

  // Splash는 SafeArea를 무시하고 전체화면으로 보여주기
  if (currentScreen.type === 'Splash') {
    return content;
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: Theme.colors.background }}>
        {content}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
