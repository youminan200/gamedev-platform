import { useState, useEffect } from 'react';
import { View, Text, Platform, StatusBar, Image, ActivityIndicator } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import * as Network from 'expo-network';
import { Theme } from './src/theme';
import { ApiClient } from './src/api/ApiClient';
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
    type: Platform.OS === 'web' ? 'MainFeed' : 'Splash'
  });
  const [username, setUsername] = useState<string | null>(() => ApiClient.getUsername());
  const [activeTab, setActiveTab] = useState<TabType>('DevLogs');
  const [pendingAssetId, setPendingAssetId] = useState<string | null>(null);
  const [maintenanceMsg, setMaintenanceMsg] = useState<string | null>(null);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch('https://gamedev-platform.onrender.com/api/system-status');
        if (res.ok) {
          const data = await res.json();
          setMaintenanceMsg(data.maintenance ? (data.message || '🚧 현재 서버 점검 중입니다.') : null);
        }
      } catch {}
    };
    checkStatus();
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      document.title = 'DevGround - 인디 게임 개발자 커뮤니티 (GameDev Platform)';
      const ensureMeta = (attr: 'name' | 'property', key: string, content: string) => {
        let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
        if (!el) {
          el = document.createElement('meta');
          el.setAttribute(attr, key);
          document.head.appendChild(el);
        }
        el.setAttribute('content', content);
      };
      ensureMeta('name', 'keywords', 'DevGround, gamedev platform, 게임 개발자 커뮤니티, 인디 게임 개발, 개발일지, DevLog, 게임 에셋, Unity, Unreal Engine, Godot');
      ensureMeta('property', 'og:title', 'DevGround - 인디 게임 개발자 개발일지 & 에셋 허브');
      ensureMeta('property', 'og:description', '인디 게임 개발자들의 실시간 개발일지(DevLog) 및 2D/3D/Audio 무료 에셋 공유 플랫폼');
      ensureMeta('property', 'og:url', 'https://gamedev-platform-expo-client.vercel.app/');
      ensureMeta('property', 'og:type', 'website');
      ensureMeta('property', 'og:image', 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80');
      ensureMeta('name', 'twitter:card', 'summary_large_image');

      const params = new URLSearchParams(window.location.search);
      const sharedDevlogId = params.get('devlog');
      const sharedAssetId = params.get('asset');
      if (sharedDevlogId) {
        setCurrentScreen({ type: 'Detail', id: sharedDevlogId });
      } else if (sharedAssetId) {
        setPendingAssetId(sharedAssetId);
        setActiveTab('AssetHub');
        setCurrentScreen({ type: 'AssetHub' });
      }
      const urlToken = params.get('token');
      if (urlToken) {
        ApiClient.setToken(urlToken);
        const paramUsername = params.get('username');
        const decodedUsername = paramUsername || ApiClient.decodeTokenUsername(urlToken) || 'Creator';
        ApiClient.setUsername(decodedUsername);
        setUsername(decodedUsername);
        window.history.replaceState({}, document.title, window.location.pathname);
        setActiveTab('DevLogs');
        setCurrentScreen({ type: 'MainFeed' });
      }
      return;
    }

    const checkNetworkAndInitialize = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const state = await Network.getNetworkStateAsync();
        if (state.isConnected !== false) {
          setCurrentScreen({ type: 'MainFeed' });
        } else {
          setCurrentScreen({ type: 'Offline' });
        }
      } catch (e) {
        setCurrentScreen({ type: 'MainFeed' });
      }
    };
    checkNetworkAndInitialize();
  }, []);

  const handleTabChange = (tab: TabType) => {
    if (tab === 'Profile' && (!username || !ApiClient.getToken())) {
      setCurrentScreen({ type: 'Login' });
      return;
    }
    setActiveTab(tab);
    if (tab === 'DevLogs') setCurrentScreen({ type: 'MainFeed' });
    else if (tab === 'AssetHub') setCurrentScreen({ type: 'AssetHub' });
    else if (tab === 'Profile') setCurrentScreen({ type: 'Profile' });
  };

  const handlePostClick = () => {
    if (!username || !ApiClient.getToken()) {
      setCurrentScreen({ type: 'Login' });
      return;
    }
    setCurrentScreen({ type: 'Posting' });
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
          onSkipLogin={() => {
            setActiveTab('DevLogs');
            setCurrentScreen({ type: 'MainFeed' });
          }}
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
          onPostClick={handlePostClick}
          username={username}
          onAssetNotificationClick={(id) => {
            setPendingAssetId(id);
            setActiveTab('AssetHub');
            setCurrentScreen({ type: 'AssetHub' });
          }}
          onAuthClick={() => {
            if (username && ApiClient.getToken()) {
              setActiveTab('Profile');
              setCurrentScreen({ type: 'Profile' });
            } else {
              setCurrentScreen({ type: 'Login' });
            }
          }}
        />
      );
      break;
    case 'AssetHub':
      content = (
        <AssetFeedScreen
          onRequireLogin={() => setCurrentScreen({ type: 'Login' })}
          openAssetId={pendingAssetId}
          onOpenAssetHandled={() => setPendingAssetId(null)}
        />
      );
      break;
    case 'Profile':
      content = (
        <ProfileScreen 
          username={username || 'Creator'}
          onLogout={() => {
            ApiClient.logout();
            setUsername(null);
            setActiveTab('DevLogs');
            setCurrentScreen({ type: 'MainFeed' });
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
          onRequireLogin={() => setCurrentScreen({ type: 'Login' })}
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
    <SafeAreaProvider style={Platform.OS === 'web' ? { height: '100vh' as any, width: '100vw' as any, overflow: 'hidden' as any } : undefined}>
      <SafeAreaView style={{ flex: 1, backgroundColor: Theme.colors.background, height: Platform.OS === 'web' ? ('100vh' as any) : undefined, maxHeight: Platform.OS === 'web' ? ('100vh' as any) : undefined }}>
        {maintenanceMsg && (
          <View style={{ backgroundColor: '#EF4444', paddingVertical: 10, paddingHorizontal: 16, alignItems: 'center' }}>
            <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 13, textAlign: 'center' }}>{maintenanceMsg}</Text>
          </View>
        )}
        <View style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
          {content}
        </View>
        {showTabBar && (
          <BottomTabBar 
            currentTab={activeTab} 
            onTabChange={handleTabChange}
            onPostClick={handlePostClick}
          />
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
