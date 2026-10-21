import { useState, useEffect } from 'react';
import { View, Text, Platform, StatusBar, Image, ActivityIndicator, TouchableOpacity, Modal, ScrollView } from 'react-native';
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
  const [noticeMsg, setNoticeMsg] = useState<string | null>(null);
  const [updatePopupVisible, setUpdatePopupVisible] = useState<boolean>(false);
  const [updatePopupTitle, setUpdatePopupTitle] = useState<string>("🎉 오늘의 업데이트 안내 (v1.3.0 대규모 업데이트)");
  const [updatePopupItems, setUpdatePopupItems] = useState<string[]>(["🎮 개발일지 [데모 게임 플레이하기] 직통 버튼 & 🤝 #팀원모집 전용 필터 추가","👤 작성자 닉네임 클릭 시 개발자 포트폴리오(Steam · GitHub · Itch.io) 팝업 열람","▶️ 개발일지 본문 유튜브(YouTube) 영상 바로 재생 & 💻 코드 블록 복사 기능 추가","🔥 인기 개발일지 TOP 3 배너 및 👁️ 실시간 조회수 · 📥 에셋 다운로드 수 집계 적용","⭐ 관심있는 개발일지/에셋 찜하기(북마크) 및 🔗 카카오톡/디스코드 공유 카드 지원"]);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        let trackParam = '1';
        try {
          const visitKey = 'devground_visited_' + new Date().toISOString().slice(0, 10);
          if (typeof window !== 'undefined' && window.localStorage) {
            if (window.localStorage.getItem(visitKey) === '1') {
              trackParam = '0';
            } else {
              window.localStorage.setItem(visitKey, '1');
            }
          }
        } catch {}
        const res = await fetch(`https://gamedev-platform.onrender.com/api/system-status?track=${trackParam}`);
        if (res.ok) {
          const data = await res.json();
          setMaintenanceMsg(data.maintenance ? (data.message || '🚧 현재 서버 점검 중입니다.') : null);
          setNoticeMsg(data.notice_active ? (data.notice_message || null) : null);
          if (data.popup_active === false) {
            setUpdatePopupVisible(false);
          } else {
            const title = data.popup_title || "🎉 오늘의 업데이트 안내 (v1.3.0 대규모 업데이트)";
            const rawContent = data.popup_content || "🎮 개발일지 [데모 게임 플레이하기] 직통 버튼 & 🤝 #팀원모집 전용 필터 추가\n👤 작성자 닉네임 클릭 시 개발자 포트폴리오(Steam · GitHub · Itch.io) 팝업 열람\n▶️ 개발일지 본문 유튜브(YouTube) 영상 바로 재생 & 💻 코드 블록 복사 기능 추가\n🔥 인기 개발일지 TOP 3 배너 및 👁️ 실시간 조회수 · 📥 에셋 다운로드 수 집계 적용\n⭐ 관심있는 개발일지/에셋 찜하기(북마크) 및 🔗 카카오톡/디스코드 공유 카드 지원";
            setUpdatePopupTitle(title);
            setUpdatePopupItems(String(rawContent).split('\n').map((s: string) => s.trim()).filter(Boolean));
            try {
              const todayKey = new Date().toISOString().slice(0, 10) + '_' + title;
              setUpdatePopupVisible(false);
            } catch {
              setUpdatePopupVisible(true);
            }
          }
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
        {noticeMsg && !maintenanceMsg && (
          <View style={{ backgroundColor: '#1A1D2B', borderBottomWidth: 2, borderBottomColor: '#3A415E', paddingVertical: 6, paddingHorizontal: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
            <Text numberOfLines={1} style={{ color: '#00E5FF', fontWeight: '800', fontSize: 11, fontFamily: 'monospace', flex: 1 }}>
              {'> SYS_NOTICE: ' + noticeMsg.replace(/^📢s*[공지]s*/, '')}
            </Text>
            <TouchableOpacity
              onPress={() => setUpdatePopupVisible(true)}
              style={{ backgroundColor: '#FF4D6D', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, borderWidth: 1, borderColor: '#11131C', flexShrink: 0 }}
            >
              <Text numberOfLines={1} style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 10, fontFamily: 'monospace' }}>[PATCH_LOG]</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setNoticeMsg(null)} style={{ paddingHorizontal: 4, flexShrink: 0 }}>
              <Text style={{ color: '#9BA3B8', fontWeight: '900', fontSize: 12, fontFamily: 'monospace' }}>[X]</Text>
            </TouchableOpacity>
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

        <Modal visible={updatePopupVisible} animationType="fade" transparent onRequestClose={() => setUpdatePopupVisible(false)}>
          <View style={{ flex: 1, backgroundColor: 'rgba(5, 6, 10, 0.82)', justifyContent: 'center', alignItems: 'center', padding: 16 }}>
            <View style={{ width: '100%', maxWidth: 400, maxHeight: '82%', backgroundColor: '#1A1D2B', borderRadius: 6, borderWidth: 2, borderColor: '#FF4D6D', padding: 18 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <View style={{ backgroundColor: '#FF4D6D', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 3 }}>
                  <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 10, fontFamily: 'monospace' }}>PATCH_NOTES // v1.5</Text>
                </View>
                <TouchableOpacity onPress={() => setUpdatePopupVisible(false)} style={{ padding: 4 }}>
                  <Text style={{ fontSize: 14, fontWeight: '900', color: '#9BA3B8', fontFamily: 'monospace' }}>[X]</Text>
                </TouchableOpacity>
              </View>

              <Text style={{ fontSize: 16, fontWeight: '800', color: '#F4F4F6', marginBottom: 6, lineHeight: 22 }}>
                {updatePopupTitle}
              </Text>

              <ScrollView style={{ maxHeight: 220, marginBottom: 14 }} showsVerticalScrollIndicator={true}>
                {updatePopupItems.map((item, idx) => (
                  <View
                    key={idx}
                    style={{
                      backgroundColor: '#11131C',
                      borderWidth: 1.5,
                      borderColor: '#3A415E',
                      borderRadius: 4,
                      paddingVertical: 9,
                      paddingHorizontal: 12,
                      marginBottom: 6,
                    }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: '700', color: '#F4F4F6', lineHeight: 18 }}>
                      {item}
                    </Text>
                  </View>
                ))}
              </ScrollView>

              <TouchableOpacity
                onPress={() => setUpdatePopupVisible(false)}
                style={{ paddingVertical: 11, borderRadius: 4, backgroundColor: '#FF4D6D', alignItems: 'center', borderWidth: 1.5, borderColor: '#11131C' }}
              >
                <Text numberOfLines={1} style={{ fontSize: 13, fontWeight: '900', color: '#FFFFFF', fontFamily: 'monospace' }}>[ ENTER_WORKSHOP // 닫기 ]</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
