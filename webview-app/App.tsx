import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  BackHandler,
  ToastAndroid,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { WEB_APP_URL } from './config';

export default function App() {
  const webViewRef = useRef<any>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const lastBackPressedRef = useRef<number>(0);

  // 안드로이드 하드웨어 뒤로가기 버튼 처리
  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const onBackPress = () => {
      if (canGoBack && webViewRef.current) {
        webViewRef.current.goBack();
        return true; // 이벤트 소비 (앱 종료 방지)
      }

      // 첫 페이지인 경우: 2초 내에 다시 누르면 앱 종료
      const now = Date.now();
      if (now - lastBackPressedRef.current < 2000) {
        BackHandler.exitApp();
        return true;
      }

      lastBackPressedRef.current = now;
      ToastAndroid.show("'뒤로' 버튼을 한 번 더 누르면 종료됩니다.", ToastAndroid.SHORT);
      return true;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [canGoBack]);

  const handleNavigationStateChange = useCallback((navState: WebViewNavigation) => {
    setCanGoBack(navState.canGoBack);
  }, []);

  const handleReload = () => {
    setHasError(false);
    setIsLoading(true);
    webViewRef.current?.reload();
  };

  const WebViewComponent = WebView as any;

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <StatusBar barStyle="light-content" backgroundColor="#12141a" />
        <View style={styles.container}>
          {hasError ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorTitle}>연결할 수 없습니다</Text>
              <Text style={styles.errorMessage}>
                네트워크 연결 상태를 확인하거나 잠시 후 다시 시도해주세요.{'\n'}
                URL: {WEB_APP_URL}
              </Text>
              <TouchableOpacity style={styles.retryButton} onPress={handleReload}>
                <Text style={styles.retryButtonText}>다시 시도</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <WebViewComponent
              ref={webViewRef}
              source={{ uri: WEB_APP_URL }}
              style={styles.webview}
              onNavigationStateChange={handleNavigationStateChange}
              onLoadStart={() => setIsLoading(true)}
              onLoadEnd={() => setIsLoading(false)}
              onError={(syntheticEvent: any) => {
                const { nativeEvent } = syntheticEvent;
                console.warn('WebView error: ', nativeEvent);
                setHasError(true);
                setIsLoading(false);
              }}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              startInLoadingState={false}
              allowsInlineMediaPlayback={true}
              mixedContentMode="always"
              originWhitelist={['*']}
              applicationNameForUserAgent="DevGroundApp/1.0"
            />
          )}

          {isLoading && !hasError && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#6366f1" />
              <Text style={styles.loadingText}>DevGround 로딩 중...</Text>
            </View>
          )}
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#12141a',
  },
  container: {
    flex: 1,
    backgroundColor: '#12141a',
    position: 'relative',
  },
  webview: {
    flex: 1,
    backgroundColor: '#12141a',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#12141a',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  loadingText: {
    marginTop: 16,
    color: '#94a3b8',
    fontSize: 15,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ef4444',
    marginBottom: 12,
  },
  errorMessage: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
