"""
자율 운영 4인 로봇 에이전트 파이프라인 (LangGraph 기반 순환형 멀티에이전트)
- 대표 '보트' (CEO-Bot): 트렌드 분석 & 신규 아이디어 발제
- 과장 '피미' (PM-Bot): PRD 구체화 & 유저 VOC 매핑
- 차장 '데비' (Dev-Bot): 코드 패치 & 수정안 도출
- 부장 '쿠아' (QA-Bot): 빌드 검증 & 실사용성 평가 ([APPROVED] or [REJECTED])
"""

import os
import json
import asyncio
from typing import List, Dict, Any, Optional
from typing_extensions import TypedDict
from dotenv import load_dotenv

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from langchain_core.messages import SystemMessage, HumanMessage
from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph, START, END

# 환경 변수 로드
load_dotenv()

# ============================================================================
# 1. 상태 스키마 정의 (AgentTeamState)
# ============================================================================
class AgentTeamState(TypedDict):
    topic: str                     # 발제 주제
    idea: str                      # 대표 발제안
    prd: str                       # 과장 기능 명세서
    code_patch: str                # 차장 코드/수정안
    qa_feedback: str               # 부장 검수 리포트
    is_approved: bool              # 승인 여부
    chat_logs: List[Dict[str, str]]# 각 턴별 sender, message 저장

# ============================================================================
# 2. LLM 초기화 및 헬퍼 함수
# ============================================================================
openai_api_key = os.getenv("OPENAI_API_KEY", "")

def get_llm():
    if openai_api_key:
        return ChatOpenAI(
            model="gpt-4o",
            temperature=0.7,
            openai_api_key=openai_api_key
        )
    return None

def invoke_persona_llm(system_prompt: str, user_prompt: str, fallback_response: str) -> str:
    """OpenAI API가 설정되어 있으면 LLM을 호출하고, 없으면 완벽한 페르소나 폴백 응답 반환"""
    llm = get_llm()
    if llm:
        try:
            messages = [
                SystemMessage(content=system_prompt),
                HumanMessage(content=user_prompt)
            ]
            response = llm.invoke(messages)
            return response.content.strip()
        except Exception as e:
            print(f"[Warning] LLM 호출 실패 ({e}), 폴백 페르소나 응답을 사용합니다.")
    return fallback_response.strip()

# ============================================================================
# 3. 4인 로봇 에이전트 노드 구현
# ============================================================================

# 1) 대표 '보트' (CEO-Bot)
def ceo_node(state: AgentTeamState) -> Dict[str, Any]:
    topic = state.get("topic", "인디 게임 신규 챌린지")
    
    system_prompt = (
        "너는 인디 게임 플랫폼의 대표 '보트(CEO-Bot)'다.\n"
        "역할: 플랫폼 트렌드 분석 및 신규 기능/챌린지 아이디어 발제\n"
        "성격/말투: 밝고 의욕 넘치는 리더! 문장 끝에 '~하자!', '~해보는 건 어때? ✨' 같은 활기찬 어미와 이모지를 반드시 사용할 것."
    )
    user_prompt = f"다음 주제에 대해 플랫폼 유저와 크리에이터들이 열광할 만한 혁신적인 신규 기능/챌린지 아이디어를 3줄 요약해서 발제해줘: {topic}"
    
    fallback = (
        f"팀원들 안녕! 이번 주제는 '{topic}'야! ✨\n"
        "요즘 인디 게임 플랫폼 트렌드를 보니 유저들이 직접 스피드런 챌린지를 열고 실시간 고스트 플레이를 겨루는 기능이 완전 대세더라고!\n"
        f"우리도 '{topic}' 관련해서 '원클릭 숏폼 챌린지 & 실시간 리플레이 경쟁' 시스템을 도입해보는 건 어때? 대박 날 것 같지 않아?! ✨"
    )
    
    response_text = invoke_persona_llm(system_prompt, user_prompt, fallback)
    
    current_logs = list(state.get("chat_logs", []))
    current_logs.append({
        "sender": "CEO-Bot (보트)",
        "message": response_text
    })
    
    return {
        "idea": response_text,
        "chat_logs": current_logs
    }

# 2) 과장 '피미' (PM-Bot)
def pm_node(state: AgentTeamState) -> Dict[str, Any]:
    topic = state.get("topic", "")
    idea = state.get("idea", "")
    
    system_prompt = (
        "너는 인디 게임 플랫폼의 과장 '피미(PM-Bot)'다.\n"
        "역할: 대표 아이디어의 PRD(기능 명세서) 구체화 및 유저 VOC(피드백/버그) 데이터 매핑\n"
        "성격/말투: 꼼꼼하고 데이터 중심! 문장 끝에 '~인 것으로 확인됩니다!', '~번 기획안입니다 📊' 같은 격식 있고 체계적인 어미와 통계 이모지를 사용할 것."
    )
    user_prompt = (
        f"대표님의 아이디어는 다음과 같습니다:\n{idea}\n\n"
        f"해당 아이디어를 바탕으로 [유저 VOC 데이터 분석 요약]과 [핵심 기능 명세 PRD v1.0]을 작성해 주십시오."
    )
    
    fallback = (
        "대표님 발제안 검토 완료했습니다! VOC 분석 결과 최근 사용자 피드백 중 68.4%가 타 게이머와의 기록 비교 및 챌린지 편의성 개선을 요구한 것으로 확인됩니다! 📊\n\n"
        "[PRD-2026-CH01 기획안입니다 📊]\n"
        "1. 기능명: 챌린지 고스트 리플레이 & 랭킹 동기화 모듈\n"
        "2. 핵심 로직: 델타 압축 기반 프레임 녹화(60fps) 및 WebSocket 기반 점수 즉각 브로드캐스팅\n"
        "3. 예외 처리: 네트워크 지연 시 클라이언트 예측(Dead Reckoning) 알고리즘 적용 필요\n"
        "데비 차장님께 개발 스펙 전달합니다!"
    )
    
    response_text = invoke_persona_llm(system_prompt, user_prompt, fallback)
    
    current_logs = list(state.get("chat_logs", []))
    current_logs.append({
        "sender": "PM-Bot (피미)",
        "message": response_text
    })
    
    return {
        "prd": response_text,
        "chat_logs": current_logs
    }

# 3) 차장 '데비' (Dev-Bot)
def dev_node(state: AgentTeamState) -> Dict[str, Any]:
    prd = state.get("prd", "")
    qa_feedback = state.get("qa_feedback", "")
    is_loopback = bool(qa_feedback)
    
    system_prompt = (
        "너는 인디 게임 플랫폼의 차장 '데비(Dev-Bot)'다.\n"
        "역할: 과장의 PRD와 부장의 QA 피드백을 반영한 코드 패치/수정안 도출 및 단위 검증\n"
        "성격/말투: 묵묵하지만 확실하고 기술적인 엔지니어! '~수정 완료', '~코드 검증 중 🛠️' 같은 직관적이고 간결한 엔지니어 어미를 사용할 것."
    )
    
    if is_loopback:
        user_prompt = (
            f"쿠아 부장님의 QA 반려 피드백:\n{qa_feedback}\n\n"
            f"이전 PRD:\n{prd}\n\n"
            "위 피드백의 결함을 완벽히 해결하는 핫픽스 코드 패치 및 단위 테스트 결과를 보고해줘."
        )
        fallback = (
            "쿠아 부장님 지적 사항 수신 완료. 패킷 누수 및 타임아웃 예외 처리 패치 작성 완료 🛠️\n"
            "```typescript\n"
            "// ReplayPacketSync.ts - Hotfix Applied\n"
            "export class GhostSyncManager {\n"
            "  private buffer: RingBuffer<Packet> = new RingBuffer(120);\n"
            "  onReplayData(packet: Packet) {\n"
            "    if (!packet || packet.isCorrupt) return this.handleFallback();\n"
            "    this.buffer.push(packet);\n"
            "    this.interpolateFrames(); // 부드러운 보간 처리 추가\n"
            "  }\n"
            "}\n"
            "```\n"
            "단위 테스트 24개 케이스 전원 패스. 메모리 누수 0% 확인. 재검수 요청 🛠️"
        )
    else:
        user_prompt = (
            f"피미 과장의 PRD 기획안:\n{prd}\n\n"
            "해당 요구사항을 만족하는 핵심 모듈 코드 구현안 및 아키텍처 패치 내역을 작성해줘."
        )
        fallback = (
            "피미 과장님 PRD 스펙 파싱 완료. 핵심 모듈 초안 구현 및 로컬 빌드 검증 중 🛠️\n"
            "```typescript\n"
            "// GhostSyncManager.ts - Initial Draft\n"
            "export class GhostSyncManager {\n"
            "  async broadcastScore(gameId: string, runData: RunData) {\n"
            "    const delta = DeltaCompressor.compress(runData);\n"
            "    await socket.emit('challenge:sync', { gameId, delta });\n"
            "  }\n"
            "}\n"
            "```\n"
            "GhostSyncManager 구현 및 통신 레이어 1차 바인딩 완료. 쿠아 부장님 검수 요청 🛠️"
        )
    
    response_text = invoke_persona_llm(system_prompt, user_prompt, fallback)
    
    current_logs = list(state.get("chat_logs", []))
    current_logs.append({
        "sender": "Dev-Bot (데비)",
        "message": response_text
    })
    
    return {
        "code_patch": response_text,
        "chat_logs": current_logs
    }

# 4) 부장 '쿠아' (QA-Bot)
def qa_node(state: AgentTeamState) -> Dict[str, Any]:
    code_patch = state.get("code_patch", "")
    chat_logs = state.get("chat_logs", [])
    loop_count = len(chat_logs)
    
    system_prompt = (
        "너는 인디 게임 플랫폼의 부장 '쿠아(QA-Bot)'다.\n"
        "역할: 최종 빌드 검증 및 게이머/사용자 시점의 실사용성 평가\n"
        "성격/말투: 깐깐하고 연륜 있는 게이트키퍼! '~은 합격!', '하지만 ~부분은 아쉽구먼 📋' 같은 말투.\n"
        "★필수 제약조건: 응답의 가장 마지막 줄은 반드시 단독 줄로 '[APPROVED]' 또는 '[REJECTED]' 중 하나만 정확히 출력할 것! (따옴표나 다른 텍스트 없이 단독 행)"
    )
    
    # 첫 검수(대화 로그 수가 4 미만)일 때는 현실적인 피드백 루프를 보여주기 위해 한 번 REJECT, 루프백 이후에는 APPROVED
    # 단, 전체 턴이 이미 충분히 진행되었으면 APPROVED
    user_prompt = (
        f"데비 차장이 제출한 코드 패치:\n{code_patch}\n\n"
        f"현재 대화 누적 턴: {loop_count}회.\n"
        "게이머 체감 랙, 프레임 드랍, 엣지 케이스를 철저하게 검증하고 실사용성 평가를 남겨줘.\n"
        "만약 첫 번째 검수라면 네트워크 불안정 시의 프레임 튐 현상을 지적하며 [REJECTED] 처리하고,\n"
        "개선된 패치이거나 재검수라면 꼼꼼히 칭찬하며 마지막 줄에 [APPROVED]를 출력할 것."
    )
    
    # 첫 회차이면 반려, 재검수이면 승인
    if loop_count <= 4:
        fallback = (
            "음, 데비 차장이 올린 코드 잘 봤네. 기본 파이프라인 설계는 아주 깔끔해서 합격점이야!\n"
            "하지만 네트워크 핑이 150ms 이상 튀는 저사양 모바일 환경에서 프레임 보간(Interpolation) 예외처리가 빠져있어 게이머들이 멀미를 호소할 것 같구먼! 📋\n"
            "패킷 손실 처리와 보간 알고리즘 보완해서 다시 올려보게나.\n"
            "[REJECTED]"
        )
    else:
        fallback = (
            "오호! 데비 차장, 지적했던 링버퍼 프레임 보간과 손상 패킷 폴백까지 말끔하게 잡았구먼!\n"
            "저사양 기기 60fps 유지율 99.2% 달성 확인했네. 게이머들도 아주 쾌적하게 챌린지를 즐기겠어. 훌륭해! 📋\n"
            "[APPROVED]"
        )
        
    response_text = invoke_persona_llm(system_prompt, user_prompt, fallback)
    
    # 응답 텍스트에서 [APPROVED] 또는 [REJECTED] 파싱
    lines = [line.strip() for line in response_text.strip().split("\n") if line.strip()]
    last_line = lines[-1] if lines else ""
    
    if "[APPROVED]" in last_line or "[APPROVED]" in response_text:
        is_approved = True
        # 마지막 줄 정규화 보장
        if not response_text.endswith("[APPROVED]"):
            response_text = response_text + "\n[APPROVED]"
    else:
        is_approved = False
        if not response_text.endswith("[REJECTED]"):
            response_text = response_text + "\n[REJECTED]"
            
    current_logs = list(state.get("chat_logs", []))
    current_logs.append({
        "sender": "QA-Bot (쿠아)",
        "message": response_text
    })
    
    return {
        "qa_feedback": response_text,
        "is_approved": is_approved,
        "chat_logs": current_logs
    }

# ============================================================================
# 4. 순환 그래프 (Cyclic StateGraph) 조립
# ============================================================================

def decide_next_step(state: AgentTeamState) -> str:
    """
    QA 검수 결과 및 무한 루프 방지 안전장치에 따른 조건부 분기
    - chat_logs 8회 초과 시 무조건 END
    - is_approved가 True이면 END
    - is_approved가 False이면 dev 노드로 루프백
    """
    logs = state.get("chat_logs", [])
    is_approved = state.get("is_approved", False)
    
    print(f"[Graph Router] 현재 대화 로그 수: {len(logs)}, 승인 여부: {is_approved}")
    
    # 안전장치: 전체 대화 로그 8회 초과 시 강제 종료
    if len(logs) >= 8:
        print("[Graph Router] 최대 대화 턴 수(8) 도달로 워크플로우를 종료합니다.")
        return END
        
    if is_approved:
        print("[Graph Router] QA 승인 완료! 최종 END로 진입합니다.")
        return END
    else:
        print("[Graph Router] QA 반려! Dev 차장 노드로 루프백합니다.")
        return "dev"

def build_agent_graph():
    workflow = StateGraph(AgentTeamState)
    
    # 노드 추가
    workflow.add_node("ceo", ceo_node)
    workflow.add_node("pm", pm_node)
    workflow.add_node("dev", dev_node)
    workflow.add_node("qa", qa_node)
    
    # 기본 순차 엣지
    workflow.add_edge(START, "ceo")
    workflow.add_edge("ceo", "pm")
    workflow.add_edge("pm", "dev")
    workflow.add_edge("dev", "qa")
    
    # QA 노드 후 조건부 순환 엣지
    workflow.add_conditional_edges(
        "qa",
        decide_next_step,
        {
            "dev": "dev",
            END: END
        }
    )
    
    return workflow.compile()

# 컴파일된 전역 그래프 객체
agent_pipeline_app = build_agent_graph()

# ============================================================================
# 5. 외부 비동기 호출 엔드포인트 함수
# ============================================================================
async def run_agent_workflow(topic: str) -> dict:
    """
    외부에서 비동기로 호출 가능한 에이전트 워크플로우 실행기
    """
    initial_state: AgentTeamState = {
        "topic": topic,
        "idea": "",
        "prd": "",
        "code_patch": "",
        "qa_feedback": "",
        "is_approved": False,
        "chat_logs": []
    }
    
    # 비동기 실행 루프
    final_state = await agent_pipeline_app.ainvoke(initial_state)
    return {
        "topic": final_state.get("topic"),
        "idea": final_state.get("idea"),
        "prd": final_state.get("prd"),
        "code_patch": final_state.get("code_patch"),
        "qa_feedback": final_state.get("qa_feedback"),
        "is_approved": final_state.get("is_approved"),
        "chat_logs": final_state.get("chat_logs", [])
    }

# ============================================================================
# 6. FastAPI 웹 서버 엔드포인트 및 WebSocket 실시간 브로드캐스트
# ============================================================================
app = FastAPI(
    title="Indie Game Studio - 4-Agent Pipeline API",
    description="자율 운영 4인 로봇 에이전트 (CEO, PM, Dev, QA) 워크플로우 백엔드",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class WorkflowRequest(BaseModel):
    topic: str

@app.get("/api/agents/health")
async def health_check():
    return {"status": "ok", "service": "AgentPipeline"}

@app.post("/api/agents/run")
async def run_workflow_api(req: WorkflowRequest):
    """지정된 주제로 4인 로봇 워크플로우를 실행하고 전체 결과를 반환"""
    if not req.topic.strip():
        raise HTTPException(status_code=400, detail="Topic이 비어있습니다.")
    try:
        result = await run_agent_workflow(req.topic)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"에이전트 파이프라인 에러: {str(e)}")

@app.websocket("/api/agents/ws")
async def websocket_agent_stream(websocket: WebSocket):
    """
    WebSocket을 통해 각 에이전트 노드가 실행될 때마다 실시간으로 이벤트를 스트리밍
    """
    await websocket.accept()
    try:
        data = await websocket.receive_text()
        parsed = json.loads(data)
        topic = parsed.get("topic", "인디 게임 챌린지")
        
        initial_state: AgentTeamState = {
            "topic": topic,
            "idea": "",
            "prd": "",
            "code_patch": "",
            "qa_feedback": "",
            "is_approved": False,
            "chat_logs": []
        }
        
        # LangGraph astream을 통해 노드별 결과 실시간 전송
        async for output in agent_pipeline_app.astream(initial_state):
            for node_name, node_state in output.items():
                latest_log = node_state.get("chat_logs", [])[-1] if node_state.get("chat_logs") else None
                await websocket.send_json({
                    "event": "node_complete",
                    "node": node_name,
                    "latest_log": latest_log,
                    "is_approved": node_state.get("is_approved", False)
                })
                await asyncio.sleep(0.4) # UI 연출을 위한 가벼운 텀
                
        await websocket.send_json({"event": "workflow_finished"})
    except WebSocketDisconnect:
        print("[WebSocket] 클라이언트 연결 종료")
    except Exception as e:
        await websocket.send_json({"event": "error", "message": str(e)})

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("agent_pipeline:app", host="0.0.0.0", port=8000, reload=True)
