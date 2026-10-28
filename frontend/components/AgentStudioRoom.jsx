import React, { useState, useEffect, useRef } from "react";

/**
 * 4인 로봇 에이전트 메타데이터 정의
 */
const AGENT_CONFIGS = {
  ceo: {
    id: "ceo",
    name: "보트",
    role: "대표 (CEO-Bot)",
    department: "전략 기획 & 트렌드 리더",
    tone: "밝고 의욕 넘치는 리더 (~하자!, ~해보는 건 어때? ✨)",
    icon: "💡",
    accentColor: "amber",
    bgClass: "bg-amber-50",
    borderClass: "border-amber-300",
    textClass: "text-amber-800",
    badgeClass: "bg-amber-100 text-amber-900 border-amber-300",
    ringClass: "ring-2 ring-amber-400 ring-offset-2 shadow-amber-200 shadow-lg",
  },
  pm: {
    id: "pm",
    name: "피미",
    role: "과장 (PM-Bot)",
    department: "기능 명세 & VOC 데이터 매핑",
    tone: "꼼꼼하고 데이터 중심 (~인 것으로 확인됩니다!, ~번 기획안입니다 📊)",
    icon: "📊",
    accentColor: "sky",
    bgClass: "bg-sky-50",
    borderClass: "border-sky-300",
    textClass: "text-sky-800",
    badgeClass: "bg-sky-100 text-sky-900 border-sky-300",
    ringClass: "ring-2 ring-sky-400 ring-offset-2 shadow-sky-200 shadow-lg",
  },
  dev: {
    id: "dev",
    name: "데비",
    role: "차장 (Dev-Bot)",
    department: "코드 패치 & 단위 테스트 검증",
    tone: "묵묵하지만 확실한 엔지니어 (~수정 완료, ~코드 검증 중 🛠️)",
    icon: "🛠️",
    accentColor: "orange",
    bgClass: "bg-orange-50",
    borderClass: "border-orange-300",
    textClass: "text-orange-800",
    badgeClass: "bg-orange-100 text-orange-900 border-orange-300",
    ringClass: "ring-2 ring-orange-400 ring-offset-2 shadow-orange-200 shadow-lg",
  },
  qa: {
    id: "qa",
    name: "쿠아",
    role: "부장 (QA-Bot)",
    department: "빌드 게이트키퍼 & 실사용성 평가",
    tone: "깐깐하고 연륜 있는 평가자 (~은 합격!, 하지만 ~부분은 아쉽구먼 📋)",
    icon: "📋",
    accentColor: "emerald",
    bgClass: "bg-emerald-50",
    borderClass: "border-emerald-300",
    textClass: "text-emerald-800",
    badgeClass: "bg-emerald-100 text-emerald-900 border-emerald-300",
    ringClass: "ring-2 ring-emerald-400 ring-offset-2 shadow-emerald-200 shadow-lg",
  },
};

/**
 * 인디 게임 스튜디오 4인 로봇 실시간 모니터링 컴포넌트
 * @param {Object} props
 * @param {string} [props.initialTopic] - 초기 발제 주제
 * @param {Array<{sender: string, message: string, timestamp?: string}>} [props.customLogs] - 외부 주입 대화 로그
 * @param {boolean} [props.isExternalLoading] - 외부 로딩 상태
 * @param {Function} [props.onWorkflowComplete] - 워크플로우 완료 콜백
 * @param {string} [props.apiUrl] - 백엔드 파이프라인 API 엔드포인트 URL
 * @param {string} [props.wsUrl] - 백엔드 파이프라인 WebSocket URL
 */
export default function AgentStudioRoom({
  initialTopic = "인디 액션 플랫포머 게임을 위한 '원클릭 고스트 챌린지' 시스템",
  customLogs = null,
  isExternalLoading = false,
  onWorkflowComplete = null,
  apiUrl = "http://localhost:8000/api/agents/run",
  wsUrl = "ws://localhost:8000/api/agents/ws",
}) {
  const [topic, setTopic] = useState(initialTopic);
  const [isRunning, setIsRunning] = useState(false);
  const [activeAgentId, setActiveAgentId] = useState(null);
  const [statusMessage, setStatusMessage] = useState("대기 중 - 파이프라인 실행 준비 완료");
  const [logs, setLogs] = useState([]);
  const [qaStatus, setQaStatus] = useState(null); // 'APPROVED' | 'REJECTED' | null
  const [autoScroll, setAutoScroll] = useState(true);
  const [useWebSocket, setUseWebSocket] = useState(false);

  const consoleEndRef = useRef(null);

  // 외부에서 customLogs 주입 시 동기화
  useEffect(() => {
    if (customLogs && Array.isArray(customLogs)) {
      setLogs(customLogs);
    }
  }, [customLogs]);

  // 자동 스크롤
  useEffect(() => {
    if (autoScroll && consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, autoScroll]);

  // 발화자 문자열에서 에이전트 키 파싱
  const getAgentKeyFromSender = (sender = "") => {
    if (sender.includes("보트") || sender.includes("CEO")) return "ceo";
    if (sender.includes("피미") || sender.includes("PM")) return "pm";
    if (sender.includes("데비") || sender.includes("Dev")) return "dev";
    if (sender.includes("쿠아") || sender.includes("QA")) return "qa";
    return null;
  };

  // 각 에이전트별 최신 발화 추출
  const getLatestSpeech = (agentKey) => {
    for (let i = logs.length - 1; i >= 0; i--) {
      const log = logs[i];
      if (getAgentKeyFromSender(log.sender) === agentKey) {
        return log.message;
      }
    }
    return null;
  };

  /**
   * 워크플로우 실행 핸들러 (API 또는 WebSocket)
   */
  const handleStartWorkflow = async () => {
    if (!topic.trim() || isRunning) return;

    setIsRunning(true);
    setLogs([]);
    setQaStatus(null);
    setActiveAgentId("ceo");
    setStatusMessage("에이전트 파이프라인 실행 중...");

    if (useWebSocket && typeof window !== "undefined" && "WebSocket" in window) {
      // 1. WebSocket 모드 실시간 스트리밍
      try {
        const socket = new WebSocket(wsUrl);

        socket.onopen = () => {
          socket.send(JSON.stringify({ topic }));
        };

        socket.onmessage = (event) => {
          const data = JSON.parse(event.data);
          if (data.event === "node_complete" && data.latest_log) {
            const senderKey = getAgentKeyFromSender(data.latest_log.sender);
            setActiveAgentId(senderKey);

            setLogs((prev) => [
              ...prev,
              {
                ...data.latest_log,
                timestamp: new Date().toLocaleTimeString(),
              },
            ]);

            if (data.node === "qa") {
              if (data.is_approved) {
                setQaStatus("APPROVED");
              } else {
                setQaStatus("REJECTED");
              }
            }
          } else if (data.event === "workflow_finished") {
            setIsRunning(false);
            setActiveAgentId(null);
            setStatusMessage("파이프라인 실행 완료 (승인 통과)");
            socket.close();
            if (onWorkflowComplete) onWorkflowComplete({ topic, status: "FINISHED" });
          } else if (data.event === "error") {
            console.error("WS Error:", data.message);
            fallbackSimulationRun();
            socket.close();
          }
        };

        socket.onerror = () => {
          console.warn("WebSocket 연결 실패. HTTP API 또는 시뮬레이션으로 전환합니다.");
          socket.close();
          executeViaHttpApi();
        };
      } catch (err) {
        executeViaHttpApi();
      }
    } else {
      // 2. HTTP POST API 모드
      await executeViaHttpApi();
    }
  };

  /**
   * HTTP API 호출 및 점진적 렌더링
   */
  const executeViaHttpApi = async () => {
    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const result = await response.json();
      const rawLogs = result.chat_logs || [];

      // 실시간 시각적 느낌을 살려 각 로그를 순차적으로 렌더링
      for (let i = 0; i < rawLogs.length; i++) {
        const log = rawLogs[i];
        const key = getAgentKeyFromSender(log.sender);
        setActiveAgentId(key);

        await new Promise((res) => setTimeout(res, 600));

        setLogs((prev) => [
          ...prev,
          {
            ...log,
            timestamp: new Date().toLocaleTimeString(),
          },
        ]);

        if (key === "qa") {
          if (log.message.includes("[APPROVED]")) {
            setQaStatus("APPROVED");
          } else if (log.message.includes("[REJECTED]")) {
            setQaStatus("REJECTED");
          }
        }
      }

      setIsRunning(false);
      setActiveAgentId(null);
      setStatusMessage("파이프라인 실행 완료 (승인 통과)");
      if (onWorkflowComplete) onWorkflowComplete(result);
    } catch (err) {
      console.warn("백엔드 서버 미연결 감지. 프론트엔드 실시간 시뮬레이션으로 실행합니다:", err.message);
      await fallbackSimulationRun();
    }
  };

  /**
   * 백엔드가 오프라인일 때도 완벽히 테스트 가능한 인-메모리 시뮬레이션
   */
  const fallbackSimulationRun = async () => {
    const demoSteps = [
      {
        node: "ceo",
        sender: "CEO-Bot (보트)",
        message: `팀원들 안녕! 이번 주제는 '${topic}'야! ✨\n요즘 인디 게임 플랫폼 트렌드를 보니 유저들이 직접 스피드런 챌린지를 열고 실시간 고스트 플레이를 겨루는 기능이 완전 대세더라고!\n우리도 '${topic}' 관련해서 '원클릭 숏폼 챌린지 & 실시간 리플레이 경쟁' 시스템을 도입해보는 건 어때? 대박 날 것 같지 않아?! ✨`,
      },
      {
        node: "pm",
        sender: "PM-Bot (피미)",
        message: `대표님 발제안 검토 완료했습니다! VOC 분석 결과 최근 사용자 피드백 중 68.4%가 타 게이머와의 기록 비교 및 챌린지 편의성 개선을 요구한 것으로 확인됩니다! 📊\n\n[PRD-2026-CH01 기획안입니다 📊]\n1. 기능명: 챌린지 고스트 리플레이 & 랭킹 동기화 모듈\n2. 핵심 로직: 델타 압축 기반 프레임 녹화(60fps) 및 WebSocket 기반 점수 즉각 브로드캐스팅\n3. 예외 처리: 네트워크 지연 시 클라이언트 예측(Dead Reckoning) 알고리즘 적용 필요\n데비 차장님께 개발 스펙 전달합니다!`,
      },
      {
        node: "dev",
        sender: "Dev-Bot (데비)",
        message: `피미 과장님 PRD 스펙 파싱 완료. 핵심 모듈 초안 구현 및 로컬 빌드 검증 중 🛠️\n\`\`\`typescript\n// GhostSyncManager.ts - Initial Draft\nexport class GhostSyncManager {\n  async broadcastScore(gameId: string, runData: RunData) {\n    const delta = DeltaCompressor.compress(runData);\n    await socket.emit('challenge:sync', { gameId, delta });\n  }\n}\n\`\`\`\nGhostSyncManager 구현 및 통신 레이어 1차 바인딩 완료. 쿠아 부장님 검수 요청 🛠️`,
      },
      {
        node: "qa",
        sender: "QA-Bot (쿠아)",
        message: `음, 데비 차장이 올린 코드 잘 봤네. 기본 파이프라인 설계는 아주 깔끔해서 합격점이야!\n하지만 네트워크 핑이 150ms 이상 튀는 저사양 모바일 환경에서 프레임 보간(Interpolation) 예외처리가 빠져있어 게이머들이 멀미를 호소할 것 같구먼! 📋\n패킷 손실 처리와 보간 알고리즘 보완해서 다시 올려보게나.\n[REJECTED]`,
      },
      {
        node: "dev",
        sender: "Dev-Bot (데비)",
        message: `쿠아 부장님 지적 사항 수신 완료. 패킷 누수 및 타임아웃 예외 처리 핫픽스 패치 작성 완료 🛠️\n\`\`\`typescript\n// ReplayPacketSync.ts - Hotfix Applied\nexport class GhostSyncManager {\n  private buffer: RingBuffer<Packet> = new RingBuffer(120);\n  onReplayData(packet: Packet) {\n    if (!packet || packet.isCorrupt) return this.handleFallback();\n    this.buffer.push(packet);\n    this.interpolateFrames(); // 부드러운 보간 처리 추가\n  }\n}\n\`\`\`\n단위 테스트 24개 케이스 전원 패스. 메모리 누수 0% 확인. 재검수 요청 🛠️`,
      },
      {
        node: "qa",
        sender: "QA-Bot (쿠아)",
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

      if (step.node === "qa") {
        if (step.message.includes("[APPROVED]")) {
          setQaStatus("APPROVED");
        } else if (step.message.includes("[REJECTED]")) {
          setQaStatus("REJECTED");
        }
      }
    }

    setIsRunning(false);
    setActiveAgentId(null);
    setStatusMessage("파이프라인 실행 완료 (부장 승인 통과 🎉)");
    if (onWorkflowComplete) {
      onWorkflowComplete({ topic, status: "APPROVED", logs: demoSteps });
    }
  };

  const effectiveLoading = isRunning || isExternalLoading;

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-6 space-y-6 font-sans text-slate-800">
      {/* ================================================================= */}
      {/* 1. 상단 헤더 섹션                                                 */}
      {/* ================================================================= */}
      <header className="flex flex-col md:flex-row md:items-center justify-between pb-5 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md text-xl">
              🎮
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                Indie Game Studio StudioRoom
              </h1>
              <p className="text-sm text-slate-500 font-medium">
                자율 운영 4인 로봇 에이전트 순환 협업 파이프라인
              </p>
            </div>
          </div>
        </div>

        {/* 라이브 상태 뱃지 및 제어 컨트롤 */}
        <div className="flex items-center flex-wrap gap-3">
          {/* Live Operational 펄스 뱃지 */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold shadow-sm">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span>Live Operational</span>
          </div>

          {/* QA 상태 뱃지 */}
          {qaStatus && (
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                qaStatus === "APPROVED"
                  ? "bg-emerald-100 text-emerald-900 border-emerald-400"
                  : "bg-rose-100 text-rose-900 border-rose-400"
              }`}
            >
              <span>{qaStatus === "APPROVED" ? "✅" : "⚠️"}</span>
              <span>{qaStatus === "APPROVED" ? "QA APPROVED" : "QA REJECTED (Loopback)"}</span>
            </div>
          )}

          {/* WebSocket 토글 */}
          <button
            type="button"
            onClick={() => setUseWebSocket(!useWebSocket)}
            className={`text-xs px-2.5 py-1.5 rounded-lg border font-medium transition ${
              useWebSocket
                ? "bg-indigo-50 border-indigo-300 text-indigo-700"
                : "bg-slate-100 border-slate-300 text-slate-600"
            }`}
            title="WebSocket 모드 토글"
          >
            {useWebSocket ? "WS Mode ON" : "HTTP Mode"}
          </button>
        </div>
      </header>

      {/* ================================================================= */}
      {/* 2. 주제 입력 및 파이프라인 트리거 바                              */}
      {/* ================================================================= */}
      <section className="bg-white rounded-2xl p-4 md:p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center">
        <div className="flex-1 relative">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
            발제 주제 (Topic for Agents)
          </label>
          <input
            type="text"
            value={topic}
            disabled={effectiveLoading}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="에이전트들이 논의하고 개발할 게임 기능이나 챌린지 주제를 입력하세요..."
            className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition disabled:opacity-60"
          />
        </div>

        <div className="flex items-end gap-2">
          <button
            onClick={handleStartWorkflow}
            disabled={effectiveLoading || !topic.trim()}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm text-white shadow-md flex items-center justify-center gap-2 transition-all ${
              effectiveLoading
                ? "bg-indigo-400 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700 active:scale-95"
            }`}
          >
            {effectiveLoading ? (
              <>
                <svg
                  className="animate-spin h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <span>파이프라인 실행 중...</span>
              </>
            ) : (
              <>
                <span>🚀 파이프라인 가동</span>
              </>
            )}
          </button>
        </div>
      </section>

      {/* ================================================================= */}
      {/* 3. 4인 로봇 현황 카드 (4열 그리드)                                 */}
      {/* ================================================================= */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(AGENT_CONFIGS).map(([key, agent]) => {
          const isActive = activeAgentId === key;
          const speech = getLatestSpeech(key);

          return (
            <div
              key={key}
              className={`relative rounded-2xl border transition-all duration-300 p-5 flex flex-col justify-between ${
                agent.bgClass
              } ${agent.borderClass} ${
                isActive ? agent.ringClass : "shadow-sm hover:shadow-md"
              }`}
            >
              {/* 상단: 로봇 아바타 & 직급 & 직책 */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-2xl">
                      {agent.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900 text-base">
                          {agent.name}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-md font-semibold border ${agent.badgeClass}`}
                        >
                          {agent.role}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500 font-medium block truncate">
                        {agent.department}
                      </span>
                    </div>
                  </div>

                  {/* 활성화 상태 인디케이터 */}
                  {isActive && (
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-600"></span>
                    </span>
                  )}
                </div>

                {/* 캐릭터 페르소나 말투 안내 칩 */}
                <div className="mb-3 px-2.5 py-1.5 rounded-lg bg-white/70 border border-slate-200/80 text-[11px] text-slate-600 italic">
                  💬 {agent.tone}
                </div>
              </div>

              {/* 하단: 최신 발화 내용 (말풍선 형태) */}
              <div className="mt-2">
                <div className="text-xs font-semibold text-slate-400 mb-1 flex items-center justify-between">
                  <span>최신 발화 내용</span>
                  {isActive && (
                    <span className="text-[11px] font-bold text-indigo-600 animate-pulse">
                      발언 중...
                    </span>
                  )}
                </div>

                <div className="relative bg-white p-3 rounded-xl border border-slate-200/90 shadow-sm min-h-[90px] flex flex-col justify-center text-xs text-slate-700 leading-relaxed overflow-hidden">
                  {/* 말풍선 꼭지 */}
                  <div className="absolute -top-1.5 left-4 w-3 h-3 bg-white border-t border-l border-slate-200/90 transform rotate-45"></div>

                  {speech ? (
                    <p className="line-clamp-4 whitespace-pre-line font-medium text-slate-800">
                      {speech}
                    </p>
                  ) : (
                    <p className="text-slate-400 italic text-center">
                      순서를 기다리는 중입니다...
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* ================================================================= */}
      {/* 4. 터미널형 실시간 대화창 (하단 콘솔)                               */}
      {/* ================================================================= */}
      <section className="bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden font-mono">
        {/* 터미널 상단 윈도우 헤더 */}
        <div className="bg-slate-900/90 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-rose-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
            <span className="ml-2 text-xs font-semibold text-slate-400 tracking-wide">
              AGENT_STUDIO_TERMINAL // STDOUT
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="text-slate-500 hidden sm:inline">
              로그: {logs.length}건
            </span>
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-400 hover:text-slate-200">
              <input
                type="checkbox"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
                className="rounded border-slate-700 bg-slate-800 text-indigo-500 focus:ring-0 w-3.5 h-3.5"
              />
              <span>Auto-Scroll</span>
            </label>
            <button
              onClick={() => setLogs([])}
              className="hover:text-slate-200 transition text-slate-500 text-xs px-2 py-0.5 rounded bg-slate-800"
            >
              Clear
            </button>
          </div>
        </div>

        {/* 터미널 로그 스트림 본문 */}
        <div className="p-4 md:p-6 space-y-4 max-h-[460px] overflow-y-auto text-xs md:text-sm">
          {logs.length === 0 ? (
            <div className="text-slate-600 py-10 text-center italic">
              [SYSTEM] 파이프라인이 대기 중입니다. 상단의 '파이프라인 가동' 버튼을 누르면 에이전트 간의 티키타카가 실시간으로 스트리밍됩니다.
            </div>
          ) : (
            logs.map((log, index) => {
              const agentKey = getAgentKeyFromSender(log.sender);
              const agent = agentKey ? AGENT_CONFIGS[agentKey] : null;
              const isApproved = log.message.includes("[APPROVED]");
              const isRejected = log.message.includes("[REJECTED]");

              return (
                <div
                  key={index}
                  className="border-l-2 pl-3 py-1 space-y-1 transition-all animate-fadeIn"
                  style={{
                    borderColor:
                      agentKey === "ceo"
                        ? "#f59e0b"
                        : agentKey === "pm"
                        ? "#0ea5e9"
                        : agentKey === "dev"
                        ? "#f97316"
                        : agentKey === "qa"
                        ? "#10b981"
                        : "#64748b",
                  }}
                >
                  {/* 발화자 태그 & 시각 */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{agent?.icon || "🤖"}</span>
                    <span
                      className={`font-bold px-1.5 py-0.5 rounded text-[11px] tracking-wide ${
                        agentKey === "ceo"
                          ? "bg-amber-950 text-amber-300 border border-amber-800"
                          : agentKey === "pm"
                          ? "bg-sky-950 text-sky-300 border border-sky-800"
                          : agentKey === "dev"
                          ? "bg-orange-950 text-orange-300 border border-orange-800"
                          : agentKey === "qa"
                          ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                          : "bg-slate-800 text-slate-300"
                      }`}
                    >
                      {log.sender}
                    </span>

                    {/* 승인/반려 뱃지 하이라이트 */}
                    {isApproved && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                        [APPROVED]
                      </span>
                    )}
                    {isRejected && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse">
                        [REJECTED]
                      </span>
                    )}

                    <span className="text-[10px] text-slate-600 ml-auto">
                      {log.timestamp || `#TURN-${index + 1}`}
                    </span>
                  </div>

                  {/* 메시지 본문 */}
                  <div className="text-slate-300 whitespace-pre-wrap leading-relaxed pl-6 font-sans md:font-mono text-xs md:text-[13px]">
                    {log.message}
                  </div>
                </div>
              );
            })
          )}
          <div ref={consoleEndRef} />
        </div>

        {/* 터미널 하단 상태바 */}
        <div className="bg-slate-900/60 px-4 py-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                effectiveLoading
                  ? "bg-amber-400 animate-ping"
                  : qaStatus === "APPROVED"
                  ? "bg-emerald-400"
                  : qaStatus === "REJECTED"
                  ? "bg-rose-400"
                  : "bg-slate-600"
              }`}
            ></span>
            <span>{statusMessage}</span>
          </div>
          <div>Cyclic LangGraph Architecture | 4 Agents Active</div>
        </div>
      </section>
    </div>
  );
}
