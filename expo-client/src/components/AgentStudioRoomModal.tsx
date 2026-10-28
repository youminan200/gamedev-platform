import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Theme } from '../theme';

interface AgentStudioRoomModalProps {
  visible: boolean;
  onClose: () => void;
}

interface ChatLog {
  sender: string;
  message: string;
  timestamp?: string;
}

const AGENT_CONFIGS: Record<
  string,
  {
    id: string;
    name: string;
    role: string;
    department: string;
    tone: string;
    icon: string;
    accentColor: string;
    bg: string;
    border: string;
  }
> = {
  ceo: {
    id: 'ceo',
    name: '보트',
    role: '대표 (CEO-Bot)',
    department: '신규 트렌드 & 챌린지 발제',
    tone: '~하자!, ~해보는 건 어때? ✨',
    icon: '💡',
    accentColor: '#F59E0B',
    bg: 'rgba(245, 158, 11, 0.08)',
    border: '#F59E0B',
  },
  pm: {
    id: 'pm',
    name: '피미',
    role: '과장 (PM-Bot)',
    department: 'PRD 명세 & 유저 VOC 매핑',
    tone: '~인 것으로 확인됩니다!, ~번 기획안입니다 📊',
    icon: '📊',
    accentColor: '#0EA5E9',
    bg: 'rgba(14, 165, 233, 0.08)',
    border: '#0EA5E9',
  },
  dev: {
    id: 'dev',
    name: '데비',
    role: '차장 (Dev-Bot)',
    department: '코드 패치 & 단위 검증',
    tone: '~수정 완료, ~코드 검증 중 🛠️',
    icon: '🛠️',
    accentColor: '#F97316',
    bg: 'rgba(249, 115, 22, 0.08)',
    border: '#F97316',
  },
  qa: {
    id: 'qa',
    name: '쿠아',
    role: '부장 (QA-Bot)',
    department: '빌드 게이트키퍼 & 실사용성 평가',
    tone: '~은 합격!, 하지만 ~부분은 아쉽구먼 📋',
    icon: '📋',
    accentColor: '#10B981',
    bg: 'rgba(16, 185, 129, 0.08)',
    border: '#10B981',
  },
};

export default function AgentStudioRoomModal({ visible, onClose }: AgentStudioRoomModalProps) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const [topic, setTopic] = useState('인디 플랫포머 게임을 위한 원클릭 고스트 리플레이 챌린지');
  const [isRunning, setIsRunning] = useState(false);
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null);
  const [logs, setLogs] = useState<ChatLog[]>([]);
  const [qaStatus, setQaStatus] = useState<'APPROVED' | 'REJECTED' | null>(null);

  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (visible && logs.length === 0) {
      // 초기 상태 리셋
      setQaStatus(null);
      setActiveAgentId(null);
    }
  }, [visible]);

  const getAgentKey = (sender: string) => {
    if (sender.includes('보트') || sender.includes('CEO')) return 'ceo';
    if (sender.includes('피미') || sender.includes('PM')) return 'pm';
    if (sender.includes('데비') || sender.includes('Dev')) return 'dev';
    if (sender.includes('쿠아') || sender.includes('QA')) return 'qa';
    return null;
  };

  const getLatestSpeech = (key: string) => {
    for (let i = logs.length - 1; i >= 0; i--) {
      if (getAgentKey(logs[i].sender) === key) {
        return logs[i].message;
      }
    }
    return null;
  };

  const handleStartWorkflow = async () => {
    if (!topic.trim() || isRunning) return;

    setIsRunning(true);
    setLogs([]);
    setQaStatus(null);
    setActiveAgentId('ceo');

    // 1차 시도: 로컬/원격 백엔드 API 호출 시도
    let apiSuccess = false;
    const apiEndpoints = [
      'http://localhost:8000/api/agents/run',
      'https://gamedev-platform.onrender.com/api/agents/run',
    ];

    for (const url of apiEndpoints) {
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ topic }),
        });
        if (res.ok) {
          const data = await res.json();
          const serverLogs: ChatLog[] = data.chat_logs || [];

          for (let i = 0; i < serverLogs.length; i++) {
            const logItem = serverLogs[i];
            const key = getAgentKey(logItem.sender);
            setActiveAgentId(key);
            await new Promise((r) => setTimeout(r, 650));

            setLogs((prev) => [
              ...prev,
              { ...logItem, timestamp: new Date().toLocaleTimeString() },
            ]);

            if (key === 'qa') {
              if (logItem.message.includes('[APPROVED]')) setQaStatus('APPROVED');
              else if (logItem.message.includes('[REJECTED]')) setQaStatus('REJECTED');
            }
          }
          apiSuccess = true;
          break;
        }
      } catch (e) {
        // 다음 엔드포인트 시도
      }
    }

    // 서버 미연결 시 즉시 시뮬레이션 폴백 실행
    if (!apiSuccess) {
      await runSimulation();
    }

    setIsRunning(false);
    setActiveAgentId(null);
  };

  const runSimulation = async () => {
    const demoSteps = [
      {
        node: 'ceo',
        sender: 'CEO-Bot (보트)',
        message: `팀원들 안녕! 이번 주제는 '${topic}'야! ✨\n요즘 인디 게임 플랫폼 트렌드를 보니 유저들이 직접 스피드런 챌린지를 열고 실시간 고스트 플레이를 겨루는 기능이 대세더라고!\n우리도 '${topic}' 관련해서 '원클릭 숏폼 챌린지 & 실시간 리플레이 경쟁' 시스템을 도입해보는 건 어때? 대박 날 것 같지 않아?! ✨`,
      },
      {
        node: 'pm',
        sender: 'PM-Bot (피미)',
        message: `대표님 발제안 검토 완료했습니다! VOC 분석 결과 최근 사용자 피드백 중 68.4%가 타 게이머와의 기록 비교 및 챌린지 편의성 개선을 요구한 것으로 확인됩니다! 📊\n\n[PRD-2026-CH01 기획안입니다 📊]\n1. 기능명: 챌린지 고스트 리플레이 & 랭킹 동기화 모듈\n2. 핵심 로직: 델타 압축 기반 프레임 녹화(60fps) 및 실시간 점수 브로드캐스팅\n3. 예외 처리: 네트워크 지연 시 클라이언트 예측(Dead Reckoning) 보간 알고리즘 적용\n데비 차장님께 개발 스펙 전달합니다!`,
      },
      {
        node: 'dev',
        sender: 'Dev-Bot (데비)',
        message: `피미 과장님 PRD 스펙 파싱 완료. 핵심 모듈 초안 구현 및 로컬 빌드 검증 중 🛠️\n\`\`\`typescript\n// GhostSyncManager.ts - Initial Draft\nexport class GhostSyncManager {\n  async broadcastScore(gameId: string, runData: RunData) {\n    const delta = DeltaCompressor.compress(runData);\n    await socket.emit('challenge:sync', { gameId, delta });\n  }\n}\n\`\`\`\nGhostSyncManager 구현 및 통신 레이어 1차 바인딩 완료. 쿠아 부장님 검수 요청 🛠️`,
      },
      {
        node: 'qa',
        sender: 'QA-Bot (쿠아)',
        message: `음, 데비 차장이 올린 코드 잘 봤네. 기본 파이프라인 설계는 아주 깔끔해서 합격점이야!\n하지만 네트워크 핑이 150ms 이상 튀는 환경에서 프레임 보간(Interpolation) 예외처리가 빠져있어 게이머들이 멀미를 호소할 것 같구먼! 📋\n패킷 손실 처리와 링버퍼 보간 알고리즘 보완해서 다시 올려보게나.\n[REJECTED]`,
      },
      {
        node: 'dev',
        sender: 'Dev-Bot (데비)',
        message: `쿠아 부장님 지적 사항 수신 완료. 패킷 누수 방지 및 링버퍼 프레임 보간 핫픽스 패치 완료 🛠️\n\`\`\`typescript\n// ReplayPacketSync.ts - Hotfix Applied\nexport class GhostSyncManager {\n  private buffer: RingBuffer<Packet> = new RingBuffer(120);\n  onReplayData(packet: Packet) {\n    if (!packet || packet.isCorrupt) return this.handleFallback();\n    this.buffer.push(packet);\n    this.interpolateFrames(); // 부드러운 60fps 보간\n  }\n}\n\`\`\`\n단위 테스트 24개 케이스 전원 통과. 메모리 누수 0% 확인. 재검수 요청 🛠️`,
      },
      {
        node: 'qa',
        sender: 'QA-Bot (쿠아)',
        message: `오호! 데비 차장, 지적했던 링버퍼 프레임 보간과 손상 패킷 폴백까지 말끔하게 잡았구먼!\n저사양 기기 60fps 유지율 99.2% 달성 확인했네. 게이머들도 아주 쾌적하게 챌린지를 즐기겠어. 훌륭해! 📋\n[APPROVED]`,
      },
    ];

    for (let i = 0; i < demoSteps.length; i++) {
      const step = demoSteps[i];
      setActiveAgentId(step.node);

      await new Promise((r) => setTimeout(r, 900));

      setLogs((prev) => [
        ...prev,
        {
          sender: step.sender,
          message: step.message,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);

      if (step.node === 'qa') {
        if (step.message.includes('[APPROVED]')) setQaStatus('APPROVED');
        else if (step.message.includes('[REJECTED]')) setQaStatus('REJECTED');
      }
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalCard, { maxWidth: isDesktop ? 960 : '96%' }]}>
          {/* 헤더 */}
          <View style={styles.headerRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={styles.logoBadge}>
                <Text style={{ fontSize: 18 }}>🤖</Text>
              </View>
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={[styles.headerTitle, { color: Theme.colors.text }]}>
                    MOD_33 // 4-AGENT_STUDIO
                  </Text>
                  <View style={styles.liveBadge}>
                    <View style={styles.liveDot} />
                    <Text style={styles.liveText}>Live Pipeline</Text>
                  </View>
                </View>
                <Text style={{ fontSize: 11, color: Theme.colors.textLight, marginTop: 2 }}>
                  대표(CEO) · 과장(PM) · 차장(Dev) · 부장(QA) 순환형 멀티에이전트
                </Text>
              </View>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={{ fontSize: 18, color: Theme.colors.textLight, fontWeight: '700' }}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* 주제 입력 및 실행 바 */}
          <View style={[styles.inputBar, { backgroundColor: Theme.colors.surface, borderColor: Theme.colors.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 10, fontWeight: '800', color: '#6366F1', marginBottom: 4 }}>
                PROJECT TOPIC & CHALLENGE
              </Text>
              <TextInput
                value={topic}
                onChangeText={setTopic}
                editable={!isRunning}
                placeholder="에이전트들에게 발제할 인디 게임 기능 또는 챌린지..."
                placeholderTextColor={Theme.colors.textLight}
                style={[styles.textInput, { color: Theme.colors.text }]}
              />
            </View>

            <TouchableOpacity
              onPress={handleStartWorkflow}
              disabled={isRunning || !topic.trim()}
              style={[styles.launchBtn, isRunning && { opacity: 0.6 }]}
            >
              {isRunning ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.launchBtnText}>🚀 파이프라인 가동</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* 4인 로봇 현황 카드 그리드 */}
          <View style={[styles.gridContainer, isDesktop ? styles.gridDesktop : styles.gridMobile]}>
            {Object.entries(AGENT_CONFIGS).map(([key, agent]) => {
              const isActive = activeAgentId === key;
              const latestMsg = getLatestSpeech(key);

              return (
                <View
                  key={key}
                  style={[
                    styles.agentCard,
                    {
                      backgroundColor: Theme.isDark ? '#161926' : agent.bg,
                      borderColor: isActive ? agent.accentColor : Theme.colors.border,
                      borderWidth: isActive ? 2 : 1,
                    },
                    isDesktop ? { width: '23.8%' } : { width: '48%' },
                  ]}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={{ fontSize: 18 }}>{agent.icon}</Text>
                      <View>
                        <Text style={{ fontSize: 13, fontWeight: '800', color: Theme.colors.text }}>
                          {agent.name}
                        </Text>
                        <Text style={{ fontSize: 10, fontWeight: '700', color: agent.accentColor }}>
                          {agent.role}
                        </Text>
                      </View>
                    </View>
                    {isActive && <View style={[styles.activePulse, { backgroundColor: agent.accentColor }]} />}
                  </View>

                  <Text style={[styles.toneChip, { color: Theme.colors.textLight }]}>
                    {agent.tone}
                  </Text>

                  {/* 최신 말풍선 */}
                  <View style={[styles.speechBubble, { backgroundColor: Theme.colors.surface, borderColor: Theme.colors.border }]}>
                    <Text numberOfLines={3} style={{ fontSize: 10.5, color: Theme.colors.text, lineHeight: 14 }}>
                      {latestMsg || '순서를 기다리는 중...'}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>

          {/* 터미널 콘솔 로그 */}
          <View style={styles.terminalContainer}>
            <View style={styles.terminalHeader}>
              <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                <View style={[styles.termDot, { backgroundColor: '#EF4444' }]} />
                <View style={[styles.termDot, { backgroundColor: '#F59E0B' }]} />
                <View style={[styles.termDot, { backgroundColor: '#10B981' }]} />
                <Text style={styles.termTitle}>DEVGROUND_AGENT_PIPELINE // STDOUT</Text>
              </View>

              {qaStatus && (
                <View
                  style={[
                    styles.qaBadge,
                    { backgroundColor: qaStatus === 'APPROVED' ? '#064E3B' : '#7F1D1D' },
                  ]}
                >
                  <Text style={{ fontSize: 10, fontWeight: '800', color: qaStatus === 'APPROVED' ? '#34D399' : '#F87171' }}>
                    [{qaStatus}]
                  </Text>
                </View>
              )}
            </View>

            <ScrollView
              ref={scrollViewRef}
              onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
              style={styles.terminalBody}
            >
              {logs.length === 0 ? (
                <Text style={styles.emptyLogText}>
                  [SYSTEM] 파이프라인 대기 중입니다. 상단 '파이프라인 가동' 버튼을 누르면 대표, 과장, 차장, 부장의 티키타카가 실시간으로 출력됩니다.
                </Text>
              ) : (
                logs.map((log, index) => {
                  const key = getAgentKey(log.sender);
                  const agent = key ? AGENT_CONFIGS[key] : null;

                  return (
                    <View key={index} style={[styles.logRow, { borderLeftColor: agent?.accentColor || '#6366F1' }]}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={{ fontSize: 11 }}>{agent?.icon || '🤖'}</Text>
                        <Text style={[styles.senderTag, { color: agent?.accentColor || '#A5B4FC' }]}>
                          [{log.sender}]
                        </Text>
                        <Text style={styles.timeTag}>{log.timestamp || `#${index + 1}`}</Text>
                      </View>
                      <Text style={styles.logMessage}>{log.message}</Text>
                    </View>
                  );
                })
              )}
            </ScrollView>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 7, 13, 0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  modalCard: {
    width: '100%',
    maxHeight: '92%',
    backgroundColor: '#0E111C',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#2A3047',
    padding: 16,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  logoBadge: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  liveText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#10B981',
  },
  closeBtn: {
    padding: 6,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 12,
  },
  textInput: {
    fontSize: 12,
    padding: 4,
  },
  launchBtn: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  launchBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  gridDesktop: {
    justifyContent: 'space-between',
  },
  gridMobile: {
    justifyContent: 'space-between',
  },
  agentCard: {
    borderRadius: 10,
    padding: 10,
    minHeight: 110,
    justifyContent: 'space-between',
  },
  activePulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  toneChip: {
    fontSize: 9.5,
    fontStyle: 'italic',
    marginVertical: 4,
  },
  speechBubble: {
    padding: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  terminalContainer: {
    backgroundColor: '#05060A',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1F2438',
    maxHeight: 260,
    overflow: 'hidden',
  },
  terminalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#0C0E17',
    borderBottomWidth: 1,
    borderBottomColor: '#1F2438',
  },
  termDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  termTitle: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
  },
  qaBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  terminalBody: {
    padding: 10,
  },
  emptyLogText: {
    fontSize: 11,
    color: '#475569',
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 20,
    lineHeight: 16,
  },
  logRow: {
    borderLeftWidth: 3,
    paddingLeft: 8,
    marginBottom: 10,
  },
  senderTag: {
    fontSize: 10.5,
    fontWeight: '800',
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
  },
  timeTag: {
    fontSize: 9,
    color: '#475569',
    marginLeft: 'auto',
  },
  logMessage: {
    fontSize: 11,
    color: '#CBD5E1',
    lineHeight: 15,
    marginTop: 2,
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
  },
});
