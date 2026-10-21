import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Modal, TextInput, Linking, Platform } from 'react-native';
import { Theme } from '../theme';
import { ApiClient } from '../api/ApiClient';
import { NeumorphView } from '../components/NeumorphView';
import { UserProfile } from '../models/DevLog';

interface Props {
  username: string;
  onLogout: () => void;
  onDevLogClick: (id: string) => void;
}

const DEV_CLASSES = [
  { id: 'knight', icon: '⚔️', label: 'CODE_KNIGHT // 로직 기사' },
  { id: 'mage', icon: '🧙‍♂️', label: 'PIXEL_MAGE // 도트 마법사' },
  { id: 'bot', icon: '🤖', label: 'SHADER_BOT // 셰이더 연금술사' },
  { id: 'hunter', icon: '👾', label: 'BUG_HUNTER // 버그 슬레이어' },
  { id: 'bard', icon: '🎸', label: 'SFX_BARD // 8비트 음유시인' },
];

const CARD_ACCENTS = [
  { id: 'coral', color: '#FF4D6D', name: 'ITCH_CORAL' },
  { id: 'cyan', color: '#00E5FF', name: 'CYBER_CYAN' },
  { id: 'gold', color: '#FFD166', name: 'ARCADE_GOLD' },
  { id: 'emerald', color: '#10B981', name: 'MATRIX_MINT' },
];

export const ProfileScreen: React.FC<Props> = ({ username, onLogout, onDevLogClick }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<'devlogs' | 'assets'>('devlogs');
  const [editProfileVisible, setEditProfileVisible] = useState(false);
  const [customizerVisible, setCustomizerVisible] = useState(false);
  const [bioInput, setBioInput] = useState('');
  const [engineInput, setEngineInput] = useState('Unity');
  const [githubInput, setGithubInput] = useState('');
  const [steamInput, setSteamInput] = useState('');
  const [itchInput, setItchInput] = useState('');
  const [supportInput, setSupportInput] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState<string[]>(() => ApiClient.getBlockedUsers());

  const [devClassId, setDevClassId] = useState<string>('knight');
  const [cardAccent, setCardAccent] = useState<string>('#FFD166');
  const [cardCopied, setCardCopied] = useState<boolean>(false);

  useEffect(() => {
    fetchProfile();
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = window.localStorage.getItem(`devground_idcard_${username}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.devClassId) setDevClassId(parsed.devClassId);
          if (parsed.cardAccent) setCardAccent(parsed.cardAccent);
        }
      }
    } catch {}
  }, [username]);

  const saveCardStyle = (nextClass: string, nextAccent: string) => {
    setDevClassId(nextClass);
    setCardAccent(nextAccent);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(
          `devground_idcard_${username}`,
          JSON.stringify({ devClassId: nextClass, cardAccent: nextAccent })
        );
      }
    } catch {}
  };

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await ApiClient.getUserProfile(username);
      setProfile(data);
      setBioInput(data?.user?.bio || '');
      setEngineInput(data?.user?.engine || 'Unity');
      setGithubInput(data?.user?.github_url || '');
      setSteamInput(data?.user?.steam_url || '');
      setItchInput(data?.user?.itch_url || '');
      setSupportInput(data?.user?.support_url || '');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDevLog = async (id: string) => {
    try {
      await ApiClient.deleteDevLog(id);
      fetchProfile();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteAsset = async (id: string) => {
    try {
      await ApiClient.deleteAsset(id);
      fetchProfile();
    } catch (e) {
      console.error(e);
    }
  };

  const currentClass = DEV_CLASSES.find((c) => c.id === devClassId) || DEV_CLASSES[0];
  const devlogsCount = profile?.stats.devlog_count || 0;
  const assetsCount = profile?.stats.asset_count || 0;
  const totalLikes = profile?.stats.total_likes || 0;
  const expScore = devlogsCount * 30 + assetsCount * 40 + totalLikes * 15;
  const devLevel = Math.max(1, Math.floor(expScore / 100) + 1);
  const expPercent = Math.min(100, Math.max(12, expScore % 100));
  const rankBadge = totalLikes >= 20 ? 'MASTER_CREATOR' : totalLikes >= 10 ? 'INDIE_ARTISAN' : 'ROOKIE_BUILDER';

  const handleDownloadIdCardPng = () => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 360;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Background
      ctx.fillStyle = '#11131C';
      ctx.fillRect(0, 0, 640, 360);

      // Outer Hard Border
      ctx.strokeStyle = cardAccent;
      ctx.lineWidth = 6;
      ctx.strokeRect(12, 12, 616, 336);

      // Top Header Strip
      ctx.fillStyle = cardAccent;
      ctx.fillRect(12, 12, 616, 46);
      ctx.fillStyle = '#11131C';
      ctx.font = '900 18px monospace';
      ctx.fillText('DEVGROUND // OFFICIAL INDIE DEVELOPER LICENSE', 28, 41);

      // Avatar Box
      ctx.fillStyle = '#1A1D2B';
      ctx.fillRect(32, 80, 110, 110);
      ctx.strokeStyle = cardAccent;
      ctx.lineWidth = 3;
      ctx.strokeRect(32, 80, 110, 110);
      ctx.font = '54px sans-serif';
      ctx.fillText(currentClass.icon, 60, 152);

      // Developer Info
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 28px monospace';
      ctx.fillText(`@${username}`, 164, 108);

      ctx.fillStyle = cardAccent;
      ctx.font = '800 15px monospace';
      ctx.fillText(`[LV.${devLevel}] ${currentClass.label}`, 164, 136);

      ctx.fillStyle = '#9CA3AF';
      ctx.font = '700 14px monospace';
      ctx.fillText(`ENGINE: ${profile?.user.engine || 'Unity'}  |  RANK: ${rankBadge}`, 164, 164);

      const bioText = profile?.user.bio || '인디 게임과 도트 공방에서 새로운 세계를 만드는 개발자';
      ctx.fillStyle = '#E5E7EB';
      ctx.font = '14px sans-serif';
      ctx.fillText(`"${bioText.slice(0, 40)}"`, 164, 192);

      // Stats Boxes
      const stats = [
        { label: 'DEVLOGS', val: String(devlogsCount) },
        { label: 'FREE ASSETS', val: String(assetsCount) },
        { label: 'TOTAL LIKES', val: `♥ ${totalLikes}` },
        { label: 'EXP PTS', val: `${expScore} XP` },
      ];
      stats.forEach((st, idx) => {
        const bx = 32 + idx * 146;
        ctx.fillStyle = '#1A1D2B';
        ctx.fillRect(bx, 218, 136, 70);
        ctx.strokeStyle = '#3A415E';
        ctx.lineWidth = 2;
        ctx.strokeRect(bx, 218, 136, 70);

        ctx.fillStyle = cardAccent;
        ctx.font = '900 20px monospace';
        ctx.fillText(st.val, bx + 16, 252);
        ctx.fillStyle = '#9CA3AF';
        ctx.font = '700 11px monospace';
        ctx.fillText(st.label, bx + 16, 274);
      });

      // Footer
      ctx.fillStyle = '#6B7280';
      ctx.font = '700 12px monospace';
      ctx.fillText('VERIFIED AT: https://gamedev-platform-expo-client.vercel.app', 32, 324);

      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = `devground-id-${username}.png`;
      a.click();
    } catch {}
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* RETRO DEVELOPER ID CARD (신분증) */}
      <View style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8 }}>
        <View
          style={{
            backgroundColor: Theme.colors.surface,
            borderWidth: 2,
            borderColor: cardAccent,
            borderRadius: 6,
            overflow: 'hidden',
          }}
        >
          {/* Card Top Strip */}
          <View
            style={{
              backgroundColor: cardAccent,
              paddingHorizontal: 12,
              paddingVertical: 6,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: '900', color: '#11131C', fontFamily: 'monospace' }}>
              🪪 DEV_ID // LICENSE #{String(profile?.user?.id || '001').padStart(4, '0')}
            </Text>
            <Text style={{ fontSize: 10.5, fontWeight: '900', color: '#11131C', fontFamily: 'monospace' }}>
              [LV.{devLevel} // {rankBadge}]
            </Text>
          </View>

          <View style={{ padding: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 6,
                  backgroundColor: Theme.colors.background,
                  borderWidth: 2,
                  borderColor: cardAccent,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 32 }}>{currentClass.icon}</Text>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 18, fontWeight: '900', color: Theme.colors.text, fontFamily: 'monospace' }}>
                  @{username}
                </Text>
                <Text style={{ fontSize: 11.5, fontWeight: '800', color: cardAccent, fontFamily: 'monospace', marginTop: 2 }}>
                  {currentClass.label}
                </Text>
                <Text style={{ fontSize: 11.5, color: Theme.colors.textLight, fontFamily: 'monospace', marginTop: 2 }}>
                  ENGINE: [{profile?.user.engine || 'Unity'}] • EXP: {expScore} PTS
                </Text>
              </View>
            </View>

            {/* EXP Gauge Bar */}
            <View style={{ marginTop: 10 }}>
              <View style={{ height: 7, backgroundColor: Theme.colors.background, borderRadius: 3, overflow: 'hidden', borderWidth: 1, borderColor: Theme.colors.border }}>
                <View style={{ width: `${expPercent}%`, height: '100%', backgroundColor: cardAccent }} />
              </View>
            </View>

            {profile?.user.bio ? (
              <Text style={{ fontSize: 12.5, color: Theme.colors.text, marginTop: 8, fontFamily: 'monospace' }}>
                {`> "${profile.user.bio}"`}
              </Text>
            ) : null}

            {/* External Portfolio Links */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
              {profile?.user.github_url ? (
                <TouchableOpacity style={styles.chipBtn} onPress={() => Linking.openURL(profile.user.github_url!)}>
                  <Text style={styles.chipBtnText}>[GITHUB ↗]</Text>
                </TouchableOpacity>
              ) : null}
              {profile?.user.steam_url ? (
                <TouchableOpacity style={styles.chipBtn} onPress={() => Linking.openURL(profile.user.steam_url!)}>
                  <Text style={styles.chipBtnText}>[STEAM ↗]</Text>
                </TouchableOpacity>
              ) : null}
              {profile?.user.itch_url ? (
                <TouchableOpacity style={styles.chipBtn} onPress={() => Linking.openURL(profile.user.itch_url!)}>
                  <Text style={styles.chipBtnText}>[ITCH.IO ↗]</Text>
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity
                style={[styles.chipBtn, { backgroundColor: cardAccent, borderColor: cardAccent }]}
                onPress={() => setCustomizerVisible(true)}
              >
                <Text style={[styles.chipBtnText, { color: '#11131C' }]}>[🎨 신분증 커스텀]</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.chipBtn, { backgroundColor: Theme.colors.primary, borderColor: Theme.colors.primary }]}
                onPress={() => setEditProfileVisible(true)}
              >
                <Text style={[styles.chipBtnText, { color: '#FFF' }]}>[✏️ 정보/링크 수정]</Text>
              </TouchableOpacity>
            </View>

            {/* ID Card Export Buttons */}
            <View style={{ flexDirection: 'row', gap: 6, marginTop: 10 }}>
              {Platform.OS === 'web' && (
                <TouchableOpacity
                  onPress={handleDownloadIdCardPng}
                  style={{
                    flex: 1,
                    backgroundColor: '#11131C',
                    borderWidth: 1.5,
                    borderColor: cardAccent,
                    paddingVertical: 8,
                    borderRadius: 4,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ fontSize: 11, fontWeight: '900', color: cardAccent, fontFamily: 'monospace' }}>
                    [🪪 명함 이미지(.PNG) 발급]
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={() => {
                  const summary = `🪪 [DEVGROUND 개발자 신분증]\n• 닉네임: @${username} (LV.${devLevel} ${currentClass.label})\n• 주력 엔진: ${profile?.user.engine || 'Unity'}\n• 개발일지 ${devlogsCount}편 | 무료 에셋 ${assetsCount}개 | 좋아요 ♥ ${totalLikes}\n• 구경하기: https://gamedev-platform-expo-client.vercel.app`;
                  try { navigator?.clipboard?.writeText(summary); } catch {}
                  setCardCopied(true);
                  setTimeout(() => setCardCopied(false), 2000);
                }}
                style={{
                  flex: 1,
                  backgroundColor: cardCopied ? '#10B981' : Theme.colors.pillBg,
                  borderWidth: 1.5,
                  borderColor: Theme.colors.border,
                  paddingVertical: 8,
                  borderRadius: 4,
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 11, fontWeight: '900', color: '#FFF', fontFamily: 'monospace' }}>
                  {cardCopied ? '[✅ 명함 복사됨!]' : '[🔗 명함 텍스트 복사]'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsRow}>
        <NeumorphView radius={6} style={styles.statCard}>
          <Text style={styles.statNumber}>{devlogsCount}</Text>
          <Text style={styles.statLabel}>DEVLOGS</Text>
        </NeumorphView>

        <NeumorphView radius={6} style={styles.statCard}>
          <Text style={styles.statNumber}>{assetsCount}</Text>
          <Text style={styles.statLabel}>ASSETS</Text>
        </NeumorphView>

        <NeumorphView radius={6} style={styles.statCard}>
          <Text style={styles.statNumber}>♥ {totalLikes}</Text>
          <Text style={styles.statLabel}>LIKES</Text>
        </NeumorphView>
      </View>

      {/* Sub-Tabs for My DevLogs / My Assets */}
      <View style={styles.subTabsRow}>
        <TouchableOpacity
          style={[styles.subTabBtn, activeSubTab === 'devlogs' && styles.activeSubTabBtn]}
          onPress={() => setActiveSubTab('devlogs')}
        >
          <Text style={[styles.subTabText, activeSubTab === 'devlogs' && styles.activeSubTabText]}>
            [LOGS ({profile?.recent_devlogs?.length || 0})]
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.subTabBtn, activeSubTab === 'assets' && styles.activeSubTabBtn]}
          onPress={() => setActiveSubTab('assets')}
        >
          <Text style={[styles.subTabText, activeSubTab === 'assets' && styles.activeSubTabText]}>
            [ASSETS ({profile?.recent_assets?.length || 0})]
          </Text>
        </TouchableOpacity>
      </View>

      {activeSubTab === 'devlogs' ? (
        profile?.recent_devlogs && profile.recent_devlogs.length > 0 ? (
          <FlatList
            data={profile.recent_devlogs}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => onDevLogClick(item.id)}>
                <NeumorphView radius={6} style={styles.postItem}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text style={styles.postTitle}>{item.title}</Text>
                      <Text style={styles.postMeta}>
                        ♥ {item.likes} • CMT {item.comment_count ?? 0} • {new Date(item.created_at).toLocaleDateString()}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.deleteMiniBtn}
                      onPress={(e: any) => {
                        e?.stopPropagation?.();
                        handleDeleteDevLog(item.id);
                      }}
                    >
                      <Text style={styles.deleteMiniText}>[DEL]</Text>
                    </TouchableOpacity>
                  </View>
                </NeumorphView>
              </TouchableOpacity>
            )}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>// NO_DEVLOGS_FOUND //</Text>
          </View>
        )
      ) : (
        profile?.recent_assets && profile.recent_assets.length > 0 ? (
          <FlatList
            data={profile.recent_assets}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <NeumorphView radius={6} style={styles.postItem}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={styles.postTitle}>[{item.category}] {item.title}</Text>
                    <Text style={styles.postMeta}>
                      ♥ {item.likes} • {new Date(item.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.deleteMiniBtn}
                    onPress={() => handleDeleteAsset(item.id)}
                  >
                    <Text style={styles.deleteMiniText}>[DEL]</Text>
                  </TouchableOpacity>
                </View>
              </NeumorphView>
            )}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>// NO_ASSETS_FOUND //</Text>
          </View>
        )
      )}

      {/* Logout & Store Mandatory Account Deletion / Privacy Links */}
      <View style={styles.footer}>
        {blockedUsers.length > 0 && (
          <View style={{ marginBottom: 10, backgroundColor: Theme.colors.pillBg, padding: 10, borderRadius: 6 }}>
            <Text style={{ fontSize: 11, fontWeight: '800', color: Theme.colors.text, marginBottom: 6 }}>🚫 차단한 사용자 ({blockedUsers.length}명)</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {blockedUsers.map((bu) => (
                <TouchableOpacity
                  key={bu}
                  onPress={() => setBlockedUsers(ApiClient.unblockUser(bu))}
                  style={{ backgroundColor: '#FEE2E2', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 }}
                >
                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#DC2626' }}>{bu} ✕ 해제</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity style={[styles.logoutButton, { flex: 1 }]} onPress={onLogout}>
            <Text style={styles.logoutText}>[LOGOUT]</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{ flex: 1, backgroundColor: Theme.colors.pillBg, borderWidth: 1.5, borderColor: Theme.colors.border, padding: 11, borderRadius: 6, alignItems: 'center', justifyContent: 'center' }}
            onPress={() => Linking.openURL('https://gamedev-platform-expo-client.vercel.app/privacy.html')}
          >
            <Text style={{ color: Theme.colors.textLight, fontWeight: '800', fontSize: 11.5, fontFamily: 'monospace' }}>[PRIVACY]</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{ backgroundColor: '#3F1D24', borderWidth: 1.5, borderColor: '#FF4D6D', paddingHorizontal: 12, borderRadius: 6, alignItems: 'center', justifyContent: 'center' }}
            onPress={() => setDeleteConfirmVisible(true)}
          >
            <Text style={{ color: '#FF4D6D', fontWeight: '900', fontSize: 11, fontFamily: 'monospace' }}>[탈퇴]</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* DEV_ID CARD CUSTOMIZER MODAL */}
      <Modal visible={customizerVisible} animationType="fade" transparent onRequestClose={() => setCustomizerVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', padding: 20 }}>
          <View style={{ backgroundColor: Theme.colors.surface, borderWidth: 2, borderColor: cardAccent, borderRadius: 6, padding: 18 }}>
            <Text style={{ fontSize: 15, fontWeight: '900', color: cardAccent, fontFamily: 'monospace', marginBottom: 12 }}>
              🎨 DEV_ID 신분증 도트 클래스 & 컬러 설정
            </Text>

            <Text style={{ fontSize: 11.5, fontWeight: '800', color: Theme.colors.textLight, marginBottom: 6, fontFamily: 'monospace' }}>
              {'> SELECT_DEV_CLASS (직업 아이콘)'}
            </Text>
            <View style={{ gap: 6, marginBottom: 14 }}>
              {DEV_CLASSES.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  onPress={() => saveCardStyle(c.id, cardAccent)}
                  style={{
                    backgroundColor: devClassId === c.id ? cardAccent : Theme.colors.background,
                    borderWidth: 1.5,
                    borderColor: devClassId === c.id ? cardAccent : Theme.colors.border,
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    borderRadius: 4,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <Text style={{ fontSize: 16 }}>{c.icon}</Text>
                  <Text style={{ fontSize: 12, fontWeight: '900', fontFamily: 'monospace', color: devClassId === c.id ? '#11131C' : Theme.colors.text }}>
                    {c.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={{ fontSize: 11.5, fontWeight: '800', color: Theme.colors.textLight, marginBottom: 6, fontFamily: 'monospace' }}>
              {'> SELECT_CARD_ACCENT (신분증 테마 컬러)'}
            </Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
              {CARD_ACCENTS.map((ac) => (
                <TouchableOpacity
                  key={ac.id}
                  onPress={() => saveCardStyle(devClassId, ac.color)}
                  style={{
                    flex: 1,
                    backgroundColor: ac.color,
                    paddingVertical: 10,
                    borderRadius: 4,
                    borderWidth: cardAccent === ac.color ? 3 : 1,
                    borderColor: cardAccent === ac.color ? '#FFFFFF' : '#11131C',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ fontSize: 10, fontWeight: '900', color: '#11131C', fontFamily: 'monospace' }}>{ac.name}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              onPress={() => setCustomizerVisible(false)}
              style={{ backgroundColor: Theme.colors.primary, paddingVertical: 11, borderRadius: 4, alignItems: 'center' }}
            >
              <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 12.5, fontFamily: 'monospace' }}>[적용 완료]</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={deleteConfirmVisible} animationType="fade" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', padding: 24 }}>
          <View style={{ backgroundColor: Theme.colors.surface, borderWidth: 2, borderColor: '#DC2626', borderRadius: 6, padding: 22 }}>
            <Text style={{ fontSize: 17, fontWeight: '800', color: '#DC2626', marginBottom: 8 }}>⚠️ 회원 탈퇴 (계정 영구 삭제)</Text>
            <Text style={{ fontSize: 13, color: Theme.colors.text, lineHeight: 20, marginBottom: 16 }}>
              정말로 계정을 삭제하시겠습니까? 탈퇴 시 계정 정보와 작성한 개발일지·에셋 데이터가 즉시 영구 삭제되며 복구할 수 없습니다.
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10 }}>
              <TouchableOpacity onPress={() => setDeleteConfirmVisible(false)} style={{ paddingHorizontal: 14, paddingVertical: 10 }}>
                <Text style={{ color: Theme.colors.textLight, fontWeight: '700' }}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                disabled={deletingAccount}
                onPress={async () => {
                  try {
                    setDeletingAccount(true);
                    await ApiClient.deleteMyAccount();
                    setDeleteConfirmVisible(false);
                    onLogout();
                  } catch {
                    setDeletingAccount(false);
                  }
                }}
                style={{ backgroundColor: '#DC2626', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 6 }}
              >
                <Text style={{ color: '#FFF', fontWeight: '800' }}>{deletingAccount ? '삭제 중...' : '영구 탈퇴 확인'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={editProfileVisible} animationType="fade" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', padding: 20 }}>
          <View style={{ backgroundColor: Theme.colors.surface, borderWidth: 2, borderColor: Theme.colors.border, borderRadius: 6, padding: 20 }}>
            <Text style={{ fontSize: 16, fontWeight: '900', color: '#FFD166', fontFamily: 'monospace', marginBottom: 12 }}>
              // EDIT_DEVELOPER_PROFILE
            </Text>
            <Text style={{ fontSize: 12, fontWeight: '700', color: Theme.colors.textLight, marginBottom: 6 }}>주력 게임 엔진</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
              {['Unity', 'Unreal', 'Godot', 'Custom'].map((eng) => (
                <TouchableOpacity
                  key={eng}
                  onPress={() => setEngineInput(eng)}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 4,
                    backgroundColor: engineInput === eng ? Theme.colors.primary : Theme.colors.pillBg,
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '800', fontFamily: 'monospace', color: engineInput === eng ? '#FFF' : Theme.colors.text }}>{eng}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={styles.modalInput}
              placeholder="한줄 자기소개 (예: 2D 도트 로그라이크 1인 개발자)"
              placeholderTextColor="#6B7280"
              value={bioInput}
              onChangeText={setBioInput}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="GitHub 주소 (https://github.com/...)"
              placeholderTextColor="#6B7280"
              value={githubInput}
              onChangeText={setGithubInput}
              autoCapitalize="none"
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Steam 상점 페이지 주소 (https://store.steampowered.com/...)"
              placeholderTextColor="#6B7280"
              value={steamInput}
              onChangeText={setSteamInput}
              autoCapitalize="none"
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Itch.io 주소 (https://...itch.io)"
              placeholderTextColor="#6B7280"
              value={itchInput}
              onChangeText={setItchInput}
              autoCapitalize="none"
            />
            <TextInput
              style={styles.modalInput}
              placeholder="☕ 후원 링크 / 스팀 위시리스트 주소"
              placeholderTextColor="#6B7280"
              value={supportInput}
              onChangeText={setSupportInput}
              autoCapitalize="none"
            />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10 }}>
              <TouchableOpacity onPress={() => setEditProfileVisible(false)} style={{ paddingHorizontal: 14, paddingVertical: 10 }}>
                <Text style={{ color: Theme.colors.textLight, fontWeight: '700' }}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                disabled={savingProfile}
                onPress={async () => {
                  try {
                    setSavingProfile(true);
                    await ApiClient.updateUserProfile({
                      bio: bioInput,
                      engine: engineInput,
                      github_url: githubInput,
                      steam_url: steamInput,
                      itch_url: itchInput,
                      support_url: supportInput,
                    });
                    setEditProfileVisible(false);
                    fetchProfile();
                  } catch (e) {
                    console.error(e);
                  } finally {
                    setSavingProfile(false);
                  }
                }}
                style={{ backgroundColor: Theme.colors.primary, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 4 }}
              >
                <Text style={{ color: '#FFF', fontWeight: '800', fontFamily: 'monospace' }}>{savingProfile ? 'SAVING...' : '[SAVE]'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Theme.colors.background },
  chipBtn: {
    backgroundColor: Theme.colors.pillBg,
    borderWidth: 1.5,
    borderColor: Theme.colors.border,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 4,
  },
  chipBtnText: {
    fontSize: 11,
    fontWeight: '900',
    color: Theme.colors.text,
    fontFamily: 'monospace',
  },
  statsRow: { flexDirection: 'row', paddingHorizontal: 16, marginVertical: 8, gap: 8 },
  statCard: { flex: 1, padding: 10, alignItems: 'center', justifyContent: 'center' },
  statNumber: { fontSize: 16, fontWeight: '900', color: '#FFD166', fontFamily: 'monospace', marginBottom: 2 },
  statLabel: { fontSize: 10.5, color: Theme.colors.textLight, fontWeight: '800', fontFamily: 'monospace' },
  subTabsRow: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 10, gap: 8 },
  subTabBtn: { flex: 1, paddingVertical: 8, borderRadius: 4, borderWidth: 1.5, borderColor: Theme.colors.border, backgroundColor: Theme.colors.pillBg, alignItems: 'center' },
  activeSubTabBtn: { backgroundColor: Theme.colors.primary, borderColor: Theme.colors.primary },
  subTabText: { fontSize: 12, fontWeight: '900', color: Theme.colors.textLight, fontFamily: 'monospace' },
  activeSubTabText: { color: '#FFFFFF' },
  postItem: { padding: 12, marginBottom: 10 },
  postTitle: { fontSize: 14, fontWeight: '800', color: Theme.colors.text, marginBottom: 4 },
  postMeta: { fontSize: 11, color: Theme.colors.textLight, fontWeight: '700', fontFamily: 'monospace' },
  deleteMiniBtn: { backgroundColor: '#3F1D24', borderWidth: 1, borderColor: '#FF4D6D', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 4 },
  deleteMiniText: { fontSize: 11, fontWeight: '900', color: '#FF4D6D', fontFamily: 'monospace' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 13, color: Theme.colors.textLight, fontWeight: '800', fontFamily: 'monospace' },
  footer: { paddingHorizontal: 16, paddingVertical: 10 },
  logoutButton: { backgroundColor: Theme.colors.primary, padding: 11, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  logoutText: { color: '#FFF', fontWeight: '900', fontSize: 12, fontFamily: 'monospace' },
  modalInput: {
    backgroundColor: Theme.colors.background,
    borderWidth: 1.5,
    borderColor: Theme.colors.border,
    borderRadius: 4,
    padding: 10,
    marginBottom: 10,
    fontSize: 13,
    color: Theme.colors.text,
  },
});
