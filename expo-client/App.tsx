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
import { AssetFeedScreen } from './src/screens/AssetFeedScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { BottomTabBar, TabType } from './src/components/BottomTabBar';

type ScreenState = 
  | { type: 'Splash' }
  | { type: 'Offline' }
  | { type: 'Login' }
  | { type: 'Signup' }
  | { type: 'MainFeed' }
  | { type: 'AssetHub' }
  | { type: 'Profile' }
  | { type: 'Detail'; id: string }
  | { type: 'Posting' };

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenState>({
    type: Platform.OS === 'web' ? 'Login' : 'Splash'
  });
  const [username, setUsername] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('DevLogs');

  useEffect(() => {
    if (Platform.OS === 'web') return;
    const checkNetworkAndInitialize = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const state = await Network.getNetworkStateAsync();
        if (state.isConnected !== false) {
          setCurrentScreen({ type: 'Login' });
        } else {
          setCurrentScreen({ type: 'Offline' });
        }
      } catch (e) {
        setCurrentScreen({ type: 'Login' });
      }
    };
    checkNetworkAndInitialize();
  }, []);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    if (tab === 'DevLogs') setCurrentScreen({ type: 'MainFeed' });
    else if (tab === 'AssetHub') setCurrentScreen({ type: 'AssetHub' });
    else if (tab === 'Profile') setCurrentScreen({ type: 'Profile' });
  };

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
            setActiveTab('DevLogs');
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
            setActiveTab('DevLogs');
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
    case 'AssetHub':
      content = (
        <AssetFeedScreen />
      );
      break;
    case 'Profile':
      content = (
        <ProfileScreen 
          username={username || 'Creator'}
          onLogout={() => {
            setUsername(null);
            setCurrentScreen({ type: 'Login' });
          }}
          onDevLogClick={(id) => setCurrentScreen({ type: 'Detail', id })}
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

  const showTabBar = ['MainFeed', 'AssetHub', 'Profile'].includes(currentScreen.type);

  return (
    <SafeAreaProvider style={Platform.OS === 'web' ? { height: '100vh' as any, width: '100vw' as any } : undefined}>
      <SafeAreaView style={{ flex: 1, backgroundColor: Theme.colors.background, minHeight: Platform.OS === 'web' ? ('100vh' as any) : undefined }}>
        <View style={{ flex: 1 }}>
          {content}
        </View>
        {showTabBar && (
          <BottomTabBar 
            currentTab={activeTab} 
            onTabChange={handleTabChange}
            onPostClick={() => setCurrentScreen({ type: 'Posting' })}
          />
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
