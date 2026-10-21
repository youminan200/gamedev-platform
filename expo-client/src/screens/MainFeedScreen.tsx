import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, TextInput, Modal, ScrollView, Linking, Image, Platform } from 'react-native';
import { DevLog } from '../models/DevLog';
import { ApiClient } from '../api/ApiClient';
import { Theme } from '../theme';
import { DevLogCard } from '../components/DevLogCard';
import { NeumorphView } from '../components/NeumorphView';

interface Props {
  onDevLogClick: (id: string) => void;
  onPostClick: () => void;
  username?: string | null;
  onAuthClick?: () => void;
  onAssetNotificationClick?: (id: string) => void;
}

export const MainFeedScreen: React.FC<Props> = ({ onDevLogClick, onPostClick, username, onAuthClick, onAssetNotificationClick }) => {
  const [logs, setLogs] = useState<DevLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'bookmarked'>('latest');
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(() => ApiClient.getBookmarks('devlog'));
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [authorModalVisible, setAuthorModalVisible] = useState(false);
  const [authorModalProfile, setAuthorModalProfile] = useState<any>(null);
  const [authorModalLoading, setAuthorModalLoading] = useState(false);
  const [leaderboardVisible, setLeaderboardVisible] = useState(false);
  const [toolboxVisible, setToolboxVisible] = useState(false);
  const [lang, setLang] = useState<'ko' | 'en'>('ko');
  const [showcases, setShowcases] = useState<any[]>([]);
  const [showcaseModalOpen, setShowcaseModalOpen] = useState(false);
  const [scTitle, setScTitle] = useState('');
  const [scEngine, setScEngine] = useState('Unity');
  const [scUrl, setScUrl] = useState('');
  const [scThumb, setScThumb] = useState('');
  const [scDesc, setScDesc] = useState('');
  const [submittingSc, setSubmittingSc] = useState(false);
  const [previewGame, setPreviewGame] = useState<any>(null);
  const [badgeCopied, setBadgeCopied] = useState(false);
  const [arcadeOpen, setArcadeOpen] = useState(false);
  const [installModalOpen, setInstallModalOpen] = useState(false);
  const [sfxStudioOpen, setSfxStudioOpen] = useState(false);
  const [errorWikiOpen, setErrorWikiOpen] = useState(false);
  const [errorList, setErrorList] = useState<any[]>([]);
  const [errorSearch, setErrorSearch] = useState('');
  const [errorCatFilter, setErrorCatFilter] = useState('전체');
  const [diagnoseInput, setDiagnoseInput] = useState('');
  const [diagnoseResult, setDiagnoseResult] = useState<any>(null);
  const [diagnosing, setDiagnosing] = useState(false);
  const [copiedErrId, setCopiedErrId] = useState<string | null>(null);

  const BUILTIN_UNITY_ERRORS: any[] = [
    { id: 'u1', engine: 'Unity (C# CS코드)', error_title: 'CS0103: The name "..." does not exist in the current context', cause: '선언하지 않은 변수/함수명을 사용했거나 대소문자 오타(gameObject vs gameobject), 또는 지역변수 중괄호 { } 범위를 벗어났을 때 발생합니다.', solution: '1) 대소문자 철자를 확인하세요. 2) 특정 함수 안에서 선언한 변수를 다른 함수에서 쓰려면 클래스 상단 멤버 변수로 선언하세요.', code_fix: 'private float moveSpeed = 5f; // 클래스 상단에 선언', helpful_count: 68 },
    { id: 'u2', engine: 'Unity (C# CS코드)', error_title: 'CS0246: The type or namespace name "..." could not be found', cause: 'UI(Button, Image), TextMeshPro, SceneManager 등을 사용할 때 스크립트 최상단 using 구문이 빠졌거나 .asmdef 참조가 누락되었습니다.', solution: '스크립트 맨 위에 using UnityEngine.UI; / using TMPro; / using UnityEngine.SceneManagement; 를 추가하세요.', code_fix: 'using UnityEngine;
using UnityEngine.UI;
using UnityEngine.SceneManagement;
using TMPro;', helpful_count: 64 },
    { id: 'u3', engine: 'Unity (C# CS코드)', error_title: 'CS1061: "..." does not contain a definition for "..."', cause: '해당 컴포넌트에 없는 함수/변수를 호출했거나, 내가 만든 스크립트 이름(예: Camera.cs)이 Unity 기본 클래스 이름과 겹쳐 충돌났습니다.', solution: '호출 대상 컴포넌트가 맞는지 확인하고, 내 스크립트 이름이 Unity 내장 클래스명과 같다면 파일명을 변경하세요.', code_fix: 'GetComponent<Rigidbody2D>().linearVelocity = Vector2.zero;', helpful_count: 59 },
    { id: 'u4', engine: 'Unity (C# CS코드)', error_title: 'CS0029: Cannot implicitly convert type "double" to "float" (또는 float to int)', cause: 'C#에서 소수점 숫자 뒤에 f를 붙이지 않으면 double로 인식되어 float 변수에 대입할 수 없습니다.', solution: '소수점 숫자 뒤에 반드시 f를 붙이고(예: 3.5f), int에 넣을 때는 Mathf.RoundToInt()를 사용하세요.', code_fix: 'float speed = 5.5f;
int dmg = Mathf.RoundToInt(speed);', helpful_count: 55 },
    { id: 'u5', engine: 'Unity (C# CS코드)', error_title: 'CS1612: Cannot modify the return value of "Transform.position" because it is not a variable', cause: 'transform.position.x = 5f; 처럼 구조체(Vector3) 반환값의 일부만 직접 수정하려고 할 때 발생합니다.', solution: 'Vector3 변수에 먼저 담아서 수정한 뒤 transform.position에 통째로 대입하세요.', code_fix: 'Vector3 pos = transform.position;
pos.x = 5f;
transform.position = pos;', helpful_count: 61 },
    { id: 'u6', engine: 'Unity (C# CS코드)', error_title: 'CS0120: An object reference is required for the non-static field, method, or property', cause: '생성된 오브젝트 인스턴스가 아니라 클래스 이름 자체로 일반 함수/변수를 호출했습니다.', solution: 'GetComponent<T>() 또는 FindFirstObjectByType<T>()로 실제 오브젝트를 찾아 호출하세요.', code_fix: 'Player p = FindFirstObjectByType<Player>();
p.Jump();', helpful_count: 48 },
    { id: 'u7', engine: 'Unity (C# CS코드)', error_title: 'CS0161: Not all code paths return a value', cause: '반환값이 있는 함수에서 if문 안에만 return이 있고 함수 끝에 기본 return이 빠졌습니다.', solution: '함수 맨 마지막 줄에 기본 return 문을 추가하세요.', code_fix: 'bool Check() {
    if (hp > 0) return true;
    return false;
}', helpful_count: 43 },
    { id: 'u8', engine: 'Unity (C# CS코드)', error_title: 'CS0618 / CS0619: "..." is obsolete (Unity 6 구버전 API 경고/에러)', cause: 'Unity 6에서 구버전 API(rb.velocity, FindObjectOfType 등)가 최신 API로 변경되었습니다.', solution: 'rb.velocity -> rb.linearVelocity, FindObjectOfType -> FindFirstObjectByType 으로 변경하세요.', code_fix: 'rb.linearVelocity = new Vector2(x, rb.linearVelocity.y);', helpful_count: 52 },
    { id: 'u9', engine: 'Unity (C# CS코드)', error_title: 'CS1002 / CS1513 / CS1525: ; expected / } expected / Invalid expression term', cause: '코드 줄 끝에 세미콜론(;)이 빠졌거나 중괄호 { } 짝이 맞지 않을 때 발생합니다.', solution: '에러에 적힌 줄 번호(또는 바로 윗줄) 끝에 ; 가 있는지, 닫는 중괄호 } 개수가 맞는지 확인하세요.', code_fix: 'int hp = 100; // 세미콜론과 중괄호 짝 확인', helpful_count: 50 },
    { id: 'u10', engine: 'Unity (런타임 예외)', error_title: 'NullReferenceException: Object reference not set to an instance of an object', cause: 'Inspector 슬롯이 비어 있거나(None), GetComponent<T>()가 실패해 null인 변수를 사용할 때 발생합니다.', solution: '콘솔 에러를 더블클릭해 해당 줄의 변수 중 어떤 것이 null인지 확인하고 Inspector 연결 또는 Awake() 초기화를 추가하세요.', code_fix: 'void Awake() { if (!rb) rb = GetComponent<Rigidbody2D>(); }', helpful_count: 95 },
    { id: 'u11', engine: 'Unity (런타임 예외)', error_title: 'MissingReferenceException: The object of type "..." has been destroyed', cause: 'Destroy()로 이미 파괴된 오브젝트를 코루틴이나 이벤트에서 계속 참조할 때 발생합니다.', solution: '접근 전 if (target != null) 체크를 추가하고 OnDestroy()에서 코루틴/이벤트를 해제하세요.', code_fix: 'if (target != null) target.transform.Translate(Vector3.up);', helpful_count: 57 },
    { id: 'u12', engine: 'Unity (런타임 예외)', error_title: 'UnassignedReferenceException: The variable "..." has not been assigned', cause: 'Inspector 창의 스크립트 변수 슬롯이 비어 있는(None) 상태로 게임을 실행했습니다.', solution: 'Hierarchy에서 오브젝트를 선택하고 Inspector의 빈 슬롯에 프리팹/오브젝트를 드래그해 연결하세요.', code_fix: '[SerializeField] private GameObject prefab; // Inspector 연결 필수', helpful_count: 63 },
    { id: 'u13', engine: 'Unity (런타임 예외)', error_title: 'IndexOutOfRangeException / ArgumentOutOfRangeException (배열·리스트 범위 초과)', cause: '배열이나 List의 크기보다 큰 인덱스(또는 음수)에 접근했습니다.', solution: '접근 전 if (idx >= 0 && idx < list.Count) 조건으로 배열 범위를 먼저 확인하세요.', code_fix: 'if (idx >= 0 && idx < list.Count) { var v = list[idx]; }', helpful_count: 54 },
    { id: 'u14', engine: 'Unity (런타임 예외)', error_title: 'InvalidOperationException: You are trying to read Input using the UnityEngine.Input class (Input System 충돌)', cause: '신규 Input System 패키지를 켜놓고 구버전 Input.GetKeyDown() 코드를 사용했습니다.', solution: 'Edit > Project Settings > Player > Other Settings > Active Input Handling을 "Both"로 변경하면 즉시 해결됩니다!', code_fix: '// Project Settings > Player > Active Input Handling -> Both 선택', helpful_count: 82 },
    { id: 'u15', engine: 'Unity (런타임 예외)', error_title: 'InvalidOperationException: Collection was modified; enumeration operation may not execute', cause: 'foreach문으로 리스트를 돌면서 동시에 list.Remove()나 Add()를 호출했습니다.', solution: 'foreach 대신 역방향 for문(for int i = list.Count - 1; i >= 0; i--)을 사용해 안전하게 삭제하세요.', code_fix: 'for (int i = list.Count - 1; i >= 0; i--) { list.RemoveAt(i); }', helpful_count: 49 },
    { id: 'u16', engine: 'Unity (런타임 예외)', error_title: 'MissingComponentException / StackOverflowException / KeyNotFoundException', cause: '필수 컴포넌트 누락, 무한 재귀 호출, 또는 Dictionary에 없는 키를 조회할 때 발생합니다.', solution: 'Inspector에서 컴포넌트를 추가하고, Dictionary는 TryGetValue()로 안전하게 조회하세요.', code_fix: 'if (dict.TryGetValue(key, out var val)) { /* 안전 사용 */ }', helpful_count: 46 },
    { id: 'u17', engine: 'Unity (물리/UI/셰이더)', error_title: 'OnTriggerEnter2D / OnCollisionEnter 충돌 감지가 전혀 작동하지 않는 현상', cause: '두 오브젝트 중 최소 하나에 Rigidbody(2D)가 없거나, 2D 게임에서 3D용 OnTriggerEnter를 사용했습니다.', solution: '두 오브젝트에 Collider2D를 넣고 움직이는 쪽에 Rigidbody2D를 추가한 뒤 OnTriggerEnter2D(Collider2D other)를 사용하세요.', code_fix: 'private void OnTriggerEnter2D(Collider2D other) {
    if (other.CompareTag("Player")) { }
}', helpful_count: 88 },
    { id: 'u18', engine: 'Unity (물리/UI/셰이더)', error_title: 'UI 버튼(Button)이 클릭되지 않는 현상 (UGUI 먹통)', cause: '씬에 EventSystem이 없거나 투명한 다른 UI 이미지(Raycast Target 켜짐)가 버튼 위를 가리고 있습니다.', solution: 'Hierarchy에 EventSystem이 있는지 확인하고, 버튼을 가리는 배경/텍스트의 Raycast Target 체크를 해제하세요.', code_fix: '// 장식용 Image/Text의 Raycast Target 체크 해제', helpful_count: 73 },
    { id: 'u19', engine: 'Unity (물리/UI/셰이더)', error_title: '셰이더/머티리얼이 분홍색(Magenta / Pink)으로 깨지는 현상', cause: 'Built-in 에셋을 URP 프로젝트에 가져와 셰이더가 호환되지 않을 때 발생합니다.', solution: 'Window > Rendering > Render Pipeline Converter에서 Material Upgrade를 실행하면 1초 만에 복구됩니다.', code_fix: '// Window > Rendering > Render Pipeline Converter 실행', helpful_count: 79 },
    { id: 'u20', engine: 'Unity (물리/UI/셰이더)', error_title: '캐릭터 이동 시 카메라 떨림(Jitter) 또는 빠른 총알이 벽을 뚫는 현상(Tunneling)', cause: '카메라를 Update에서 이동시켰거나, 빠른 물체의 Rigidbody Collision Detection이 Discrete로 되어 있습니다.', solution: '카메라 추적은 LateUpdate()에 작성하고, 빠른 총알의 Rigidbody Collision Detection을 Continuous로 설정하세요.', code_fix: 'void LateUpdate() { transform.position = target.position + offset; }', helpful_count: 62 },
    { id: 'u21', engine: 'Unity (빌드/배포)', error_title: 'Android IL2CPP / Gradle 빌드 실패 (NDK not found / CommandInvokationFailure / Duplicate class)', cause: '프로젝트 경로에 한글/공백이 포함되어 있거나 Android SDK/NDK 경로 및 플러그인 라이브러리가 충돌했습니다.', solution: '1) 프로젝트 폴더를 순수 영문 경로로 이동 2) External Tools에서 SDK/NDK 체크 리셋 3) Android Resolver > Force Resolve 실행', code_fix: '// 프로젝트 폴더명에 한글(바탕화면 등)이 없도록 영문 경로로 이동', helpful_count: 76 },
    { id: 'u22', engine: 'Unity (빌드/배포)', error_title: 'WebGL 빌드 후 90%에서 멈추거나 Decompression Fallback 에러 발생', cause: '웹 호스팅 서버가 Brotli 압축 헤더를 지원하지 않을 때 발생합니다.', solution: 'Player Settings > Publishing Settings에서 Decompression Fallback을 체크하거나 Compression Format을 Disabled로 바꾸세요.', code_fix: '// Publishing Settings > Decompression Fallback 체크!', helpful_count: 67 },
    { id: 'u23', engine: 'Unreal / Godot', error_title: 'Unreal ExitCode=25 (Unknown Cook Failure) / Godot 4 Nil 참조 및 한글 네모 깨짐', cause: '언리얼 깨진 Redirector 참조 또는 Godot @onready 이전 노드 참조 / 폰트 미등록 문제입니다.', solution: 'Unreal: Content 폴더 Fix Up Redirectors 실행 / Godot: @onready 사용 및 Web Export 시 Thread Support 해제', code_fix: '@onready var anim = $AnimationPlayer', helpful_count: 45 }
  ];

  const handleUniversalDiagnose = async () => {
    const raw = diagnoseInput.trim();
    if (!raw) return;
    setDiagnosing(true);
    try {
      const lower = raw.toLowerCase();
      const fileMatch = raw.match(/([A-Za-z0-9_\/\\.-]+\.cs)\((\d+),\s*(\d+)\)/i);
      const locationStr = fileMatch ? `📍 발생 파일 위치: ${fileMatch[1]} (${fileMatch[2]}번째 줄, ${fileMatch[3]}열)` : '';

      const allPool = [...BUILTIN_UNITY_ERRORS, ...errorList];
      let matchedItem = allPool.find((item) => {
        const codeKey = item.error_title.split(':')[0].trim().toLowerCase();
        return (codeKey.length >= 4 && lower.includes(codeKey)) || lower.includes(item.error_title.toLowerCase().slice(0, 18));
      });

      if (!matchedItem) {
        if (lower.includes('nullreference')) matchedItem = BUILTIN_UNITY_ERRORS[9];
        else if (lower.includes('missingreference')) matchedItem = BUILTIN_UNITY_ERRORS[10];
        else if (lower.includes('unassignedreference')) matchedItem = BUILTIN_UNITY_ERRORS[11];
        else if (lower.includes('indexoutofrange') || lower.includes('argumentoutofrange')) matchedItem = BUILTIN_UNITY_ERRORS[12];
        else if (lower.includes('input') && lower.includes('invalidoperation')) matchedItem = BUILTIN_UNITY_ERRORS[13];
        else if (lower.includes('collection was modified')) matchedItem = BUILTIN_UNITY_ERRORS[14];
        else if (lower.includes('does not exist in the current context')) matchedItem = BUILTIN_UNITY_ERRORS[0];
        else if (lower.includes('could not be found')) matchedItem = BUILTIN_UNITY_ERRORS[1];
        else if (lower.includes('does not contain a definition')) matchedItem = BUILTIN_UNITY_ERRORS[2];
        else if (lower.includes('cannot implicitly convert')) matchedItem = BUILTIN_UNITY_ERRORS[3];
        else if (lower.includes('cannot modify the return value')) matchedItem = BUILTIN_UNITY_ERRORS[4];
        else if (lower.includes('object reference is required')) matchedItem = BUILTIN_UNITY_ERRORS[5];
        else if (lower.includes('not all code paths')) matchedItem = BUILTIN_UNITY_ERRORS[6];
        else if (lower.includes('obsolete')) matchedItem = BUILTIN_UNITY_ERRORS[7];
        else if (lower.includes('expected')) matchedItem = BUILTIN_UNITY_ERRORS[8];
        else if (lower.includes('il2cpp') || lower.includes('gradle') || lower.includes('ndk')) matchedItem = BUILTIN_UNITY_ERRORS[20];
        else if (lower.includes('webgl') || lower.includes('decompression')) matchedItem = BUILTIN_UNITY_ERRORS[21];
        else if (lower.includes('pink') || lower.includes('magenta') || lower.includes('분홍')) matchedItem = BUILTIN_UNITY_ERRORS[18];
        else if (lower.includes('trigger') || lower.includes('collision') || lower.includes('충돌')) matchedItem = BUILTIN_UNITY_ERRORS[16];
      }

      let koreanTranslation = '';
      try {
        const trRes = await fetch('https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=ko&dt=t&q=' + encodeURIComponent(raw.slice(0, 300)));
        const trJson = await trRes.json();
        koreanTranslation = trJson[0].map((s: any) => s[0]).join('');
      } catch {}

      if (matchedItem) {
        setDiagnoseResult({
          title: matchedItem.error_title,
          location: locationStr,
          translated: koreanTranslation,
          cause: matchedItem.cause,
          solution: matchedItem.solution,
          code_fix: matchedItem.code_fix,
          query: raw.slice(0, 120)
        });
      } else {
        setDiagnoseResult({
          title: raw.slice(0, 120),
          location: locationStr,
          translated: koreanTranslation || '사용자 정의 에러 로그 분석 완료',
          cause: '스크립트 내 참조 누락, C# 문법/타입 불일치, 또는 패키지 버전 충돌로 인해 발생한 에러입니다.',
          solution: '1) 위 한글 번역 내용과 발생 파일 줄 번호를 확인해 변수 초기화 및 오타를 점검하세요.\n2) 아래 [Unity 공식 포럼 해결책 바로 열기] 또는 [StackOverflow 정답 바로 열기] 버튼을 누르면 이 에러 메시지와 100% 일치하는 전 세계 개발자들의 해결 코드를 즉시 볼 수 있습니다!',
          code_fix: '// 1. 콘솔 에러 더블클릭 -> 해당 스크립트 줄 이동\n// 2. 변수 null 여부 및 컴포넌트 연결 확인',
          query: raw.slice(0, 120)
        });
      }
    } finally {
      setDiagnosing(false);
    }
  };
  const [errEngine, setErrEngine] = useState('Unity');
  const [errTitle, setErrTitle] = useState('');
  const [errCause, setErrCause] = useState('');
  const [errSolution, setErrSolution] = useState('');
  const [errCode, setErrCode] = useState('');
  const [submittingErr, setSubmittingErr] = useState(false);

  const [ideaMachineOpen, setIdeaMachineOpen] = useState(false);
  const [currentIdea, setCurrentIdea] = useState({
    genre: '2D 덱빌딩 로그라이크',
    mechanic: '공격할 때마다 시간을 2초 되감기',
    theme: '마왕성 야간 청소부',
    constraint: '체력이 곧 화폐(돈)로 사용되는 규칙'
  });
  const [ideaCopied, setIdeaCopied] = useState(false);

  const rollGameIdea = () => {
    const genres = ['2D 덱빌딩 로그라이크', '뱀서라이크 탄막 생존', '도트 메트로배니아 액션', '물리엔진 병맛 협동게임', '힐링 자동화 농장 타이쿤', '사이버펑크 추리 어드벤처', '리듬 기반 보스 러시', '타워 디펜스 + 오토배틀러', '1인칭 리미널 스페이스 공포'];
    const mechanics = ['시간을 3초 되감는 능력', '무기를 던져서 순간이동', '빛과 그림자 반전 퍼즐', '적의 스킬을 훔쳐서 조합', '중력 방향을 4방향으로 전환', '마우스 커서 하나로만 조작', '박자에 맞춰 패링할수록 공격력 2배', '죽을 때마다 이전 캐릭터가 보스로 등장'];
    const themes = ['마왕성 야간 청소부', '망해가는 마법 대장간 운영', '우주 택배 상하차 알바', '버그 걸린 고전 게임 속 세계', '심해 잠수함 요리사', '고양이 해적단의 보물섬', 'AI가 지배한 네온 서울', '장난감 병정들의 책상 위 전쟁'];
    const constraints = ['체력이 곧 상점 화폐로 사용됨', '화면에 동시에 무기 1개만 존재', '1스테이지당 제한시간 60초', '공격 버튼 없이 반사/패링으로만 처치', '낮에는 상점 운영, 밤에는 던전 탐험'];
    const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
    setCurrentIdea({
      genre: pick(genres),
      mechanic: pick(mechanics),
      theme: pick(themes),
      constraint: pick(constraints)
    });
    setIdeaCopied(false);
  };

  const handleOpenErrorWiki = async () => {
    setErrorWikiOpen(true);
    try {
      const list = await ApiClient.getErrors();
      setErrorList(list);
    } catch {}
  };

  const handleInstallAppClick = async () => {
    try {
      if (typeof window !== 'undefined' && (window as any).__deferredInstallPrompt) {
        const promptEvent = (window as any).__deferredInstallPrompt;
        promptEvent.prompt();
        await promptEvent.userChoice;
        (window as any).__deferredInstallPrompt = null;
        return;
      }
    } catch {}
    setInstallModalOpen(true);
  };
  const [arcadeScores, setArcadeScores] = useState<any[]>([]);
  const [teamBoardOpen, setTeamBoardOpen] = useState(false);
  const [teams, setTeams] = useState<any[]>([]);
  const [teamTitle, setTeamTitle] = useState('');
  const [teamRole, setTeamRole] = useState('🎨 2D 픽셀 아티스트');
  const [teamEngine, setTeamEngine] = useState('Unity');
  const [teamContact, setTeamContact] = useState('');
  const [teamDesc, setTeamDesc] = useState('');
  const [submittingTeam, setSubmittingTeam] = useState(false);

  const handleOpenArcade = async () => {
    setArcadeOpen(true);
    try {
      const s = await ApiClient.getArcadeScores();
      setArcadeScores(s);
    } catch {}
  };

  const handleOpenTeamBoard = async () => {
    setTeamBoardOpen(true);
    try {
      const t = await ApiClient.getTeams();
      setTeams(t);
    } catch {}
  };

  const handleCopyFeaturedBadge = () => {
    const badgeMd = '[![Featured on DevGround](https://img.shields.io/badge/🎮_Featured_on-DevGround-4F46E5?style=for-the-badge)](https://gamedev-platform-expo-client.vercel.app)';
    try {
      navigator?.clipboard?.writeText(badgeMd);
    } catch {}
    setBadgeCopied(true);
    setTimeout(() => setBadgeCopied(false), 2200);
  };
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [visitStats, setVisitStats] = useState<{ today: number; total: number }>({ today: 0, total: 0 });
  const [shouts, setShouts] = useState<any[]>([]);
  const [shoutText, setShoutText] = useState('');
  const [sendingShout, setSendingShout] = useState(false);

  useEffect(() => {
    ApiClient.getShowcases().then(setShowcases).catch(() => {});
    ApiClient.getShoutbox().then(setShouts).catch(() => {});
    fetch('https://gamedev-platform.onrender.com/api/system-status?track=0')
      .then((r) => r.json())
      .then((d) => {
        if (d.today_visits !== undefined) setVisitStats({ today: d.today_visits, total: d.total_visits });
      })
      .catch(() => {});
  }, []);

  const handleOpenLeaderboard = async () => {
    setLeaderboardVisible(true);
    try {
      const list = await ApiClient.getLeaderboard();
      setLeaderboard(list);
    } catch {}
  };

  const handleOpenAuthorModal = async (targetUsername: string) => {
    setAuthorModalVisible(true);
    setAuthorModalProfile(null);
    try {
      setAuthorModalLoading(true);
      const data = await ApiClient.getUserProfile(targetUsername);
      setAuthorModalProfile(data);
    } catch {} finally {
      setAuthorModalLoading(false);
    }
  };

  const loadNotifications = async () => {
    if (!username || !ApiClient.getToken()) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    try {
      const data = await ApiClient.getNotifications();
      setNotifications(data.items);
      setUnreadCount(data.unread);
    } catch {}
  };

  useEffect(() => {
    loadNotifications();
  }, [username]);

  const handleOpenNotifications = async () => {
    setNotifOpen(true);
    await loadNotifications();
  };

  const handleMarkAllRead = async () => {
    try {
      await ApiClient.markNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {}
  };

  const handleNotificationClick = async (n: any) => {
    setNotifOpen(false);
    if (!n.is_read) {
      try {
        await ApiClient.markNotificationRead(n.id);
        setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)));
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch {}
    }
    if (n.ref_type === 'devlog' && n.ref_id) onDevLogClick(n.ref_id);
    else if (n.ref_type === 'asset' && n.ref_id) onAssetNotificationClick?.(n.ref_id);
  };

  useEffect(() => {
    fetchLogs();
  }, [searchQuery, selectedTag]);

  const handleTagClick = (tag: string) => {
    setSelectedTag((prev) => (prev === tag ? null : tag));
    if (sortBy === 'bookmarked') setSortBy('latest');
  };

  const handleToggleTheme = () => {
    Theme.toggleMode();
    // StyleSheets are evaluated at load time, so reload to apply the palette everywhere (web).
    if (typeof window !== 'undefined' && window.location && typeof window.location.reload === 'function') {
      window.location.reload();
    }
  };

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const data = await ApiClient.getDevLogs(searchQuery || undefined, selectedTag || undefined);
      setLogs(data);
      setBookmarkedIds(ApiClient.getBookmarks('devlog'));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBookmark = (id: string) => {
    ApiClient.toggleBookmark(id, 'devlog');
    setBookmarkedIds(ApiClient.getBookmarks('devlog'));
  };

  const blockedList = ApiClient.getBlockedUsers();
  const visibleLogs = logs.filter((item) => !blockedList.includes(item.author));
  const filteredLogs = sortBy === 'bookmarked'
    ? visibleLogs.filter((item) => bookmarkedIds.includes(String(item.id)))
    : visibleLogs;

  const sortedLogs = [...filteredLogs].sort((a, b) => {
    const pinDiff = (b.is_pinned ? 1 : 0) - (a.is_pinned ? 1 : 0);
    if (pinDiff !== 0) return pinDiff;
    if (sortBy === 'popular') {
      return (b.likes || 0) - (a.likes || 0);
    }
    return Number(b.id) - Number(a.id);
  });

  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const shareUrl = 'https://gamedev-platform-expo-client.vercel.app';
    const shareText = 'DevGround - 인디 게임 개발자들의 개발일지(DevLog) & 무료 에셋 공유 커뮤니티 🎮';
    try {
      if (typeof navigator !== 'undefined' && (navigator as any).share) {
        await (navigator as any).share({
          title: 'DevGround',
          text: shareText,
          url: shareUrl,
        });
        return;
      }
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch {}
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={[styles.titleRow, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
        <View>
          <Text style={styles.headerTitle}>📜 DevLogs Hub</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: Theme.colors.textLight }}>
              {lang === 'en' ? `👁️ Today ${visitStats.today} • Total ${visitStats.total} visits` : `👁️ 오늘 ${visitStats.today}명 • 누적 ${visitStats.total}명 방문`}
            </Text>
            <TouchableOpacity
              onPress={handleOpenLeaderboard}
              style={{ backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 }}
            >
              <Text style={{ fontSize: 11, fontWeight: '800', color: '#D97706' }}>{lang === 'en' ? '🏆 Top Creators' : '🏆 개발자 랭킹'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setToolboxVisible(true)}
              style={{ backgroundColor: '#EEF2FF', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 }}
            >
              <Text style={{ fontSize: 11, fontWeight: '800', color: '#4F46E5' }}>{lang === 'en' ? '🧰 Free Dev Tools' : '🧰 무료 개발도구함'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleOpenArcade}
              style={{ backgroundColor: '#DCFCE7', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 }}
            >
              <Text style={{ fontSize: 11, fontWeight: '800', color: '#15803D' }}>{lang === 'en' ? '🕹️ Mini Arcade' : '🕹️ 미니오락실'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleOpenTeamBoard}
              style={{ backgroundColor: '#FCE7F3', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 }}
            >
              <Text style={{ fontSize: 11, fontWeight: '800', color: '#BE185D' }}>{lang === 'en' ? '🤝 Team Board' : '🤝 팀원모집 보드'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleInstallAppClick}
              style={{ backgroundColor: '#E0F2FE', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 }}
            >
              <Text style={{ fontSize: 11, fontWeight: '800', color: '#0369A1' }}>{lang === 'en' ? '📲 Install App' : '📲 무료 앱 설치'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setSfxStudioOpen(true)}
              style={{ backgroundColor: '#F3E8FF', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 }}
            >
              <Text style={{ fontSize: 11, fontWeight: '800', color: '#7E22CE' }}>{lang === 'en' ? '🔊 8-Bit SFX Studio' : '🔊 효과음 제작기'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleOpenErrorWiki}
              style={{ backgroundColor: '#FFEDD5', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 }}
            >
              <Text style={{ fontSize: 11, fontWeight: '800', color: '#C2410C' }}>{lang === 'en' ? '🛠️ Error Wiki' : '🛠️ 에러 해결 사전'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setIdeaMachineOpen(true)}
              style={{ backgroundColor: '#FEF9C3', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 }}
            >
              <Text style={{ fontSize: 11, fontWeight: '800', color: '#A16207' }}>{lang === 'en' ? '🎲 Idea Generator' : '🎲 신작 아이디어 뽑기'}</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {username ? (
            <TouchableOpacity
              style={{ backgroundColor: Theme.colors.pillBg, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 }}
              onPress={handleOpenNotifications}
            >
              <Text style={{ color: Theme.colors.text, fontWeight: '700', fontSize: 13 }}>
                🔔{unreadCount > 0 ? ` ${unreadCount}` : ''}
              </Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity
            style={{
              backgroundColor: Theme.colors.pillBg,
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 20,
            }}
            onPress={handleToggleTheme}
          >
            <Text style={{ color: Theme.colors.text, fontWeight: '700', fontSize: 13 }}>
              {Theme.isDark ? '☀️ Light' : '🌙 Dark'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              backgroundColor: copied ? '#10B981' : Theme.colors.pillBg,
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 20,
            }}
            onPress={handleShare}
          >
            <Text style={{ color: copied ? '#FFFFFF' : '#334155', fontWeight: '700', fontSize: 13 }}>
              {copied ? '✅ 링크 복사됨' : '🔗 공유'}
            </Text>
          </TouchableOpacity>
          {onAuthClick && (
            <TouchableOpacity
              style={{
                backgroundColor: username ? Theme.colors.pillBg : Theme.colors.primary,
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 20,
              }}
              onPress={onAuthClick}
            >
              <Text style={{ color: username ? Theme.colors.text : '#FFFFFF', fontWeight: '700', fontSize: 13 }}>
                {username ? `👤 ${username}` : '🔑 로그인 / 가입'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Search Input */}
      <NeumorphView radius={12} style={styles.searchBox}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search devlogs, games, tags..."
          placeholderTextColor={Theme.colors.textLight}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </NeumorphView>



      {/* Quick Category Filter Pills (All / Demo Play / Team Recruit / Engines) */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 12 }}>
        {[
          { label: '📋 전체 글', tag: null },
          { label: '🏆 이달의 쇼케이스', tag: '쇼케이스' },
          { label: '🎮 데모 플레이', tag: '데모버전' },
          { label: '🤝 팀원 모집', tag: '팀원모집' },
          { label: 'Unity', tag: 'Unity' },
          { label: 'Unreal', tag: 'Unreal' },
          { label: 'Godot', tag: 'Godot' },
        ].map((item) => {
          const active = selectedTag === item.tag;
          return (
            <TouchableOpacity
              key={item.label}
              onPress={() => setSelectedTag(active ? null : item.tag)}
              style={{
                backgroundColor: active ? Theme.colors.primary : Theme.colors.pillBg,
                paddingHorizontal: 13,
                paddingVertical: 7,
                borderRadius: 16,
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: '700', color: active ? '#FFF' : Theme.colors.text }}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>




      {/* Global GameDev Free Assets & Game Jam News Bar */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 12 }}>
        {[
          { label: lang === 'en' ? '🎁 Unreal/Fab Monthly Free Assets' : '🎁 언리얼/Fab 이달의 무료 에셋', url: 'https://www.fab.com/' },
          { label: lang === 'en' ? '🎁 Unity Top Free Assets' : '🎁 유니티 인기 무료 에셋 모음', url: 'https://assetstore.unity.com/top-assets/top-free' },
          { label: lang === 'en' ? '🏆 Global Indie Game Jams (Itch.io)' : '🏆 글로벌 인디 게임잼 일정 (Itch.io)', url: 'https://itch.io/jams' },
          { label: lang === 'en' ? '🔥 Steam Upcoming Indie Games' : '🔥 스팀 출시 예정 인디게임 트렌드', url: 'https://store.steampowered.com/genre/Indie/' },
        ].map((news) => (
          <TouchableOpacity
            key={news.label}
            onPress={() => Linking.openURL(news.url)}
            style={{ backgroundColor: '#EEF2FF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 }}
          >
            <Text style={{ fontSize: 11, fontWeight: '800', color: '#4F46E5' }}>{news.label} ↗</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Indie Game Homepage & Web Demo Showcase Strip */}
      <View style={{ marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Text style={{ fontSize: 14, fontWeight: '800', color: Theme.colors.primary }}>
            {lang === 'en' ? '🕹️ Indie Game Websites & Web Demos' : '🕹️ 인디게임 공식 홈페이지 & 웹데모 홍보관'}
          </Text>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <TouchableOpacity
              onPress={handleCopyFeaturedBadge}
              style={{ backgroundColor: badgeCopied ? '#10B981' : '#EEF2FF', paddingHorizontal: 9, paddingVertical: 4, borderRadius: 10 }}
            >
              <Text style={{ color: badgeCopied ? '#FFF' : '#4F46E5', fontSize: 11, fontWeight: '800' }}>
                {badgeCopied ? '✅ 배지코드 복사됨!' : lang === 'en' ? '🎖️ Copy Badge' : '🎖️ 공식 배지 복사'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowcaseModalOpen(true)}
              style={{ backgroundColor: '#10B981', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 }}
            >
              <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '800' }}>
                {lang === 'en' ? '+ Add My Game Site' : '+ 내 게임 홈페이지 등록'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
          {showcases.map((game: any) => (
            <View
              key={game.id}
              style={{
                width: 240,
                backgroundColor: Theme.colors.pillBg,
                borderRadius: 16,
                overflow: 'hidden',
                paddingBottom: 12,
              }}
            >
              {game.thumbnail_url ? (
                <Image source={{ uri: game.thumbnail_url }} style={{ width: '100%', height: 100 }} resizeMode="cover" />
              ) : null}
              <View style={{ paddingHorizontal: 12, paddingTop: 10 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <Text style={{ fontSize: 10, fontWeight: '800', color: Theme.colors.primary }}>{game.engine}</Text>
                  <Text style={{ fontSize: 10, color: Theme.colors.textLight }}>👁️ {game.plays || 0}회 방문</Text>
                </View>
                <Text numberOfLines={1} style={{ fontSize: 14, fontWeight: '800', color: Theme.colors.text }}>
                  {game.title}
                </Text>
                <Text numberOfLines={2} style={{ fontSize: 11, color: Theme.colors.textLight, marginTop: 3, height: 30 }}>
                  {game.description || '인디게임 공식 홈페이지 및 데모 페이지'}
                </Text>
                <View style={{ flexDirection: 'row', gap: 6, marginTop: 8 }}>
                  <TouchableOpacity
                    onPress={async () => {
                      try {
                        const r = await ApiClient.visitShowcase(game.id);
                        setShowcases((prev) => prev.map((x) => (x.id === game.id ? { ...x, plays: r.plays } : x)));
                      } catch {}
                      setPreviewGame(game);
                    }}
                    style={{
                      flex: 1,
                      backgroundColor: '#4F46E5',
                      paddingVertical: 7,
                      borderRadius: 10,
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '800' }}>
                      {lang === 'en' ? '🖥️ Preview Here' : '🖥️ 안에서 바로보기'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={async () => {
                      try {
                        const r = await ApiClient.visitShowcase(game.id);
                        setShowcases((prev) => prev.map((x) => (x.id === game.id ? { ...x, plays: r.plays } : x)));
                      } catch {}
                      Linking.openURL(game.homepage_url).catch(() => {});
                    }}
                    style={{
                      backgroundColor: Theme.colors.pillBg,
                      paddingHorizontal: 10,
                      paddingVertical: 7,
                      borderRadius: 10,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ color: Theme.colors.text, fontSize: 11, fontWeight: '800' }}>↗ 새창</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Live Developer Shoutbox Widget */}
      <View style={{ backgroundColor: Theme.colors.pillBg, borderRadius: 14, padding: 12, marginBottom: 14 }}>
        <Text style={{ fontSize: 12, fontWeight: '800', color: Theme.colors.primary, marginBottom: 6 }}>
          {lang === 'en' ? '⚡ Live Indie Dev Shoutbox (No login required)' : '⚡ 실시간 개발자 한줄 응원톡 (로그인 없이 작성 가능)'}
        </Text>
        {shouts.slice(0, 3).map((s: any) => (
          <Text key={s.id} numberOfLines={1} style={{ fontSize: 12, color: Theme.colors.text, marginBottom: 3 }}>
            <Text style={{ fontWeight: '800', color: Theme.colors.primary }}>{s.nickname}: </Text>
            {s.message}
          </Text>
        ))}
        <View style={{ flexDirection: 'row', gap: 6, marginTop: 6 }}>
          <TextInput
            style={{ flex: 1, backgroundColor: Theme.colors.background, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, fontSize: 12, color: Theme.colors.text }}
            placeholder="오늘의 개발 진척도나 응원 한마디를 남겨보세요..."
            placeholderTextColor={Theme.colors.textLight}
            value={shoutText}
            onChangeText={setShoutText}
          />
          <TouchableOpacity
            disabled={sendingShout}
            onPress={async () => {
              if (!shoutText.trim()) return;
              try {
                setSendingShout(true);
                const list = await ApiClient.postShoutbox(username || '인디개발자', shoutText.trim());
                if (list.length > 0) setShouts(list);
                setShoutText('');
              } catch {} finally {
                setSendingShout(false);
              }
            }}
            style={{ backgroundColor: Theme.colors.primary, paddingHorizontal: 12, justifyContent: 'center', borderRadius: 10 }}
          >
            <Text style={{ color: '#FFF', fontSize: 12, fontWeight: '800' }}>등록</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Top 3 Popular DevLogs Banner */}
      {logs.length > 0 && (
        <View style={{ marginBottom: 14 }}>
          <Text style={{ fontSize: 13, fontWeight: '800', color: Theme.colors.primary, marginBottom: 8 }}>
            {lang === 'en' ? '🔥 Top 3 Trending DevLogs' : '🔥 인기 개발일지 TOP 3'}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
            {[...logs]
              .sort((a, b) => (b.likes || 0) - (a.likes || 0))
              .slice(0, 3)
              .map((topItem, index) => (
                <TouchableOpacity
                  key={topItem.id}
                  onPress={() => onDevLogClick(topItem.id)}
                  style={{
                    backgroundColor: Theme.colors.pillBg,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    borderRadius: 14,
                    maxWidth: 240,
                  }}
                >
                  <Text numberOfLines={1} style={{ fontSize: 13, fontWeight: '800', color: Theme.colors.text }}>
                    {index === 0 ? '🥇 ' : index === 1 ? '🥈 ' : '🥉 '}
                    {topItem.title}
                  </Text>
                  <Text style={{ fontSize: 11, color: Theme.colors.textLight, marginTop: 4 }}>
                    by {topItem.author} • ❤️ {topItem.likes || 0}
                  </Text>
                </TouchableOpacity>
              ))}
          </ScrollView>
        </View>
      )}

      {/* Sort Buttons */}
      <View style={styles.sortRow}>
        <TouchableOpacity 
          style={[styles.sortButton, sortBy === 'latest' && styles.activeSortButton]}
          onPress={() => setSortBy('latest')}
        >
          <Text style={[styles.sortButtonText, sortBy === 'latest' && styles.activeSortButtonText]}>⚡ Latest</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.sortButton, sortBy === 'popular' && styles.activeSortButton]}
          onPress={() => setSortBy('popular')}
        >
          <Text style={[styles.sortButtonText, sortBy === 'popular' && styles.activeSortButtonText]}>🔥 Most Liked</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.sortButton, sortBy === 'bookmarked' && styles.activeSortButton]}
          onPress={() => setSortBy('bookmarked')}
        >
          <Text style={[styles.sortButtonText, sortBy === 'bookmarked' && styles.activeSortButtonText]}>
            ⭐ 찜한 글 ({bookmarkedIds.length})
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading && logs.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={sortedLogs}
        keyExtractor={item => item.id}
        ListHeaderComponent={renderHeader}
        renderItem={({ item }) => (
          <DevLogCard
            devLog={item}
            onClick={() => onDevLogClick(item.id)}
            isBookmarked={bookmarkedIds.includes(String(item.id))}
            onToggleBookmark={handleToggleBookmark}
            onTagClick={handleTagClick}
            selectedTag={selectedTag}
            onAuthorClick={handleOpenAuthorModal}
          />
        )}
        ListEmptyComponent={
          <View style={{ padding: 40, alignItems: 'center' }}>
            <Text style={{ color: Theme.colors.textLight, fontWeight: '600', fontSize: 15 }}>
              {sortBy === 'bookmarked' ? '아직 ⭐ 찜한 개발일지가 없습니다.' : '등록된 개발일지가 없습니다.'}
            </Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
        onRefresh={fetchLogs}
        refreshing={loading}
      />

      <Modal visible={notifOpen} animationType="fade" transparent onRequestClose={() => setNotifOpen(false)}>
        <View style={styles.notifOverlay}>
          <View style={[styles.notifPanel, { backgroundColor: Theme.colors.background }]}>
            <Text style={[styles.notifTitle, { color: Theme.colors.text }]}>🔔 알림</Text>
            <ScrollView style={{ maxHeight: 360 }}>
              {notifications.length === 0 ? (
                <Text style={{ color: Theme.colors.textLight, paddingVertical: 20, textAlign: 'center' }}>새 알림이 없습니다.</Text>
              ) : (
                notifications.map((n) => (
                  <TouchableOpacity
                    key={n.id}
                    style={[styles.notifItem, { borderBottomColor: Theme.colors.border }]}
                    onPress={() => handleNotificationClick(n)}
                  >
                    <Text style={{ color: Theme.colors.text, fontWeight: n.is_read ? '500' : '800' }}>{n.message}</Text>
                    <Text style={{ color: Theme.colors.textLight, fontSize: 11, marginTop: 2 }}>
                      {n.created_at ? new Date(n.created_at.replace(' ', 'T') + 'Z').toLocaleString() : ''}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 6 }}>
              <TouchableOpacity style={{ paddingVertical: 10 }} onPress={handleMarkAllRead}>
                <Text style={{ color: Theme.colors.textLight, fontWeight: '700' }}>모두 읽음</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ paddingVertical: 10 }} onPress={() => setNotifOpen(false)}>
                <Text style={{ color: Theme.colors.primary, fontWeight: '800' }}>닫기</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={authorModalVisible} animationType="fade" transparent onRequestClose={() => setAuthorModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ width: '100%', maxWidth: 440, backgroundColor: Theme.colors.background, borderRadius: 20, padding: 22 }}>
            {authorModalLoading || !authorModalProfile ? (
              <ActivityIndicator size="large" color={Theme.colors.primary} style={{ marginVertical: 24 }} />
            ) : (
              <>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <View>
                    <Text style={{ fontSize: 20, fontWeight: '800', color: Theme.colors.text }}>
                      👤 {authorModalProfile.user.username}
                    </Text>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: Theme.colors.primary, marginTop: 2 }}>
                      🎮 {authorModalProfile.user.engine || 'Unity'} 크리에이터
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => setAuthorModalVisible(false)}>
                    <Text style={{ fontSize: 16, fontWeight: '800', color: Theme.colors.textLight }}>✕</Text>
                  </TouchableOpacity>
                </View>

                {authorModalProfile.user.bio ? (
                  <Text style={{ fontSize: 13, color: Theme.colors.text, marginBottom: 12 }}>
                    "{authorModalProfile.user.bio}"
                  </Text>
                ) : null}

                <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
                  <View style={{ flex: 1, backgroundColor: Theme.colors.pillBg, padding: 10, borderRadius: 12, alignItems: 'center' }}>
                    <Text style={{ fontWeight: '800', fontSize: 16, color: Theme.colors.primary }}>{authorModalProfile.stats.devlog_count}</Text>
                    <Text style={{ fontSize: 11, color: Theme.colors.textLight }}>DevLogs</Text>
                  </View>
                  <View style={{ flex: 1, backgroundColor: Theme.colors.pillBg, padding: 10, borderRadius: 12, alignItems: 'center' }}>
                    <Text style={{ fontWeight: '800', fontSize: 16, color: Theme.colors.primary }}>{authorModalProfile.stats.asset_count}</Text>
                    <Text style={{ fontSize: 11, color: Theme.colors.textLight }}>Assets</Text>
                  </View>
                  <View style={{ flex: 1, backgroundColor: Theme.colors.pillBg, padding: 10, borderRadius: 12, alignItems: 'center' }}>
                    <Text style={{ fontWeight: '800', fontSize: 16, color: Theme.colors.primary }}>❤️ {authorModalProfile.stats.total_likes}</Text>
                    <Text style={{ fontSize: 11, color: Theme.colors.textLight }}>Likes</Text>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
                  {authorModalProfile.user.github_url ? (
                    <TouchableOpacity style={{ backgroundColor: Theme.colors.pillBg, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 }} onPress={() => Linking.openURL(authorModalProfile.user.github_url)}>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: Theme.colors.text }}>🐙 GitHub ↗</Text>
                    </TouchableOpacity>
                  ) : null}
                  {authorModalProfile.user.steam_url ? (
                    <TouchableOpacity style={{ backgroundColor: Theme.colors.pillBg, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 }} onPress={() => Linking.openURL(authorModalProfile.user.steam_url)}>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: Theme.colors.text }}>🎮 Steam ↗</Text>
                    </TouchableOpacity>
                  ) : null}
                  {authorModalProfile.user.itch_url ? (
                    <TouchableOpacity style={{ backgroundColor: Theme.colors.pillBg, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 }} onPress={() => Linking.openURL(authorModalProfile.user.itch_url)}>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: Theme.colors.text }}>🕹️ Itch.io ↗</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>

                <Text style={{ fontSize: 13, fontWeight: '800', color: Theme.colors.text, marginBottom: 6 }}>📜 최근 작성한 개발일지</Text>
                {(authorModalProfile.recent_devlogs || []).slice(0, 3).map((d: any) => (
                  <TouchableOpacity
                    key={d.id}
                    onPress={() => {
                      setAuthorModalVisible(false);
                      onDevLogClick(d.id);
                    }}
                    style={{ paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Theme.colors.pillBg }}
                  >
                    <Text numberOfLines={1} style={{ fontSize: 13, fontWeight: '700', color: Theme.colors.text }}>{d.title}</Text>
                    <Text style={{ fontSize: 11, color: Theme.colors.textLight }}>❤️ {d.likes} • 💬 {d.comment_count ?? 0}</Text>
                  </TouchableOpacity>
                ))}
              </>
            )}
          </View>
        </View>
      </Modal>

      <Modal visible={leaderboardVisible} animationType="fade" transparent onRequestClose={() => setLeaderboardVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ width: '100%', maxWidth: 440, backgroundColor: Theme.colors.background, borderRadius: 20, padding: 22 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: Theme.colors.text }}>🏆 인디 크리에이터 명예의 전당</Text>
              <TouchableOpacity onPress={() => setLeaderboardVisible(false)}>
                <Text style={{ fontSize: 16, fontWeight: '800', color: Theme.colors.textLight }}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 320 }}>
              {leaderboard.map((c, i) => (
                <TouchableOpacity
                  key={c.username}
                  onPress={() => {
                    setLeaderboardVisible(false);
                    handleOpenAuthorModal(c.username);
                  }}
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingVertical: 10,
                    paddingHorizontal: 12,
                    marginBottom: 8,
                    borderRadius: 12,
                    backgroundColor: Theme.colors.pillBg,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '800', color: Theme.colors.text }}>
                      {i === 0 ? '🥇 ' : i === 1 ? '🥈 ' : i === 2 ? '🥉 ' : `#${i + 1} `}
                      {c.username}{' '}
                      <Text style={{ fontSize: 11, color: '#D97706' }}>
                        {c.total_likes >= 40 ? '[👑 마스터]' : c.total_likes >= 15 ? '[⚡ 인디장인]' : '[🌱 새싹]'}
                      </Text>
                    </Text>
                    <Text style={{ fontSize: 11, color: Theme.colors.textLight, marginTop: 2 }}>
                      🎮 {c.engine} • 개발일지 {c.devlog_count}개 • 에셋 {c.asset_count}개
                    </Text>
                  </View>
                  <Text style={{ fontSize: 13, fontWeight: '800', color: Theme.colors.primary }}>❤️ {c.total_likes}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={toolboxVisible} animationType="fade" transparent onRequestClose={() => setToolboxVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ width: '100%', maxWidth: 440, backgroundColor: Theme.colors.background, borderRadius: 20, padding: 22 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: Theme.colors.text }}>🧰 인디 개발자 필수 무료 도구함</Text>
              <TouchableOpacity onPress={() => setToolboxVisible(false)}>
                <Text style={{ fontSize: 16, fontWeight: '800', color: Theme.colors.textLight }}>✕</Text>
              </TouchableOpacity>
            </View>
            {[
              { name: '🎨 Kenney.nl (CC0 무료 2D/3D/오디오 에셋 5만종)', url: 'https://kenney.nl/assets' },
              { name: '🔊 Jsfxr (웹에서 바로 만드는 8비트 효과음 생성기)', url: 'https://sfxr.me/' },
              { name: '🖌️ Piskel (설치 없이 웹에서 그리는 픽셀아트 툴)', url: 'https://www.piskelapp.com/' },
              { name: '🕺 Mixamo (무료 3D 캐릭터 리깅 & 애니메이션)', url: 'https://www.mixamo.com/' },
              { name: '✨ Shadertoy (실시간 셰이더 코드 레퍼런스)', url: 'https://www.shadertoy.com/' },
              { name: '🕹️ Itch.io (인디게임 웹 데모 무료 호스팅 & 게임잼)', url: 'https://itch.io/' },
            ].map((tool) => (
              <TouchableOpacity
                key={tool.name}
                onPress={() => Linking.openURL(tool.url)}
                style={{
                  backgroundColor: Theme.colors.pillBg,
                  paddingVertical: 11,
                  paddingHorizontal: 14,
                  borderRadius: 12,
                  marginBottom: 8,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: '700', color: Theme.colors.text, flex: 1 }}>{tool.name}</Text>
                <Text style={{ fontSize: 12, fontWeight: '800', color: Theme.colors.primary }}>열기 ↗</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      <Modal visible={showcaseModalOpen} animationType="fade" transparent onRequestClose={() => setShowcaseModalOpen(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ width: '100%', maxWidth: 440, backgroundColor: Theme.colors.background, borderRadius: 20, padding: 22 }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: Theme.colors.text, marginBottom: 12 }}>
              🕹️ 내 인디게임 홈페이지 / 웹데모 홍보 등록
            </Text>
            <TextInput
              style={{ backgroundColor: '#FFF', borderRadius: 10, padding: 10, marginBottom: 10, fontSize: 14 }}
              placeholder="게임 제목 (예: Shadow Dungeon)"
              value={scTitle}
              onChangeText={setScTitle}
            />
            <TextInput
              style={{ backgroundColor: '#FFF', borderRadius: 10, padding: 10, marginBottom: 10, fontSize: 14 }}
              placeholder="게임 홈페이지 / Itch.io / Steam 주소 (https://...)"
              value={scUrl}
              onChangeText={setScUrl}
              autoCapitalize="none"
            />
            <TextInput
              style={{ backgroundColor: '#FFF', borderRadius: 10, padding: 10, marginBottom: 10, fontSize: 14 }}
              placeholder="대표 썸네일 이미지 주소 (https://... 선택사항)"
              value={scThumb}
              onChangeText={setScThumb}
              autoCapitalize="none"
            />
            <TextInput
              style={{ backgroundColor: '#FFF', borderRadius: 10, padding: 10, marginBottom: 10, fontSize: 14 }}
              placeholder="사용 엔진 (예: Unity / Unreal 5 / Godot)"
              value={scEngine}
              onChangeText={setScEngine}
            />
            <TextInput
              style={{ backgroundColor: '#FFF', borderRadius: 10, padding: 10, marginBottom: 14, fontSize: 14 }}
              placeholder="한줄 게임 소개"
              value={scDesc}
              onChangeText={setScDesc}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10 }}>
              <TouchableOpacity onPress={() => setShowcaseModalOpen(false)} style={{ paddingHorizontal: 14, paddingVertical: 10 }}>
                <Text style={{ color: Theme.colors.textLight, fontWeight: '700' }}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                disabled={submittingSc}
                onPress={async () => {
                  if (!scTitle.trim() || !scUrl.trim()) return;
                  try {
                    setSubmittingSc(true);
                    const updated = await ApiClient.postShowcase({
                      title: scTitle.trim(),
                      developer: username || 'Indie Creator',
                      engine: scEngine.trim() || 'Unity',
                      homepage_url: scUrl.trim(),
                      thumbnail_url: scThumb.trim() || undefined,
                      description: scDesc.trim(),
                    });
                    if (updated.length > 0) setShowcases(updated);
                    setShowcaseModalOpen(false);
                    setScTitle('');
                    setScUrl('');
                    setScThumb('');
                    setScDesc('');
                  } catch {} finally {
                    setSubmittingSc(false);
                  }
                }}
                style={{ backgroundColor: '#10B981', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12 }}
              >
                <Text style={{ color: '#FFF', fontWeight: '800' }}>{submittingSc ? '등록 중...' : '홍보관에 등록하기'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={Boolean(previewGame)} animationType="fade" transparent onRequestClose={() => setPreviewGame(null)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.75)', justifyContent: 'center', alignItems: 'center', padding: 16 }}>
          <View style={{ width: '100%', maxWidth: 900, height: '85%', backgroundColor: '#0F172A', borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: '#334155' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#1E293B' }}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text numberOfLines={1} style={{ color: '#F8FAFC', fontSize: 15, fontWeight: '800' }}>
                  🕹️ {previewGame?.title} ({previewGame?.engine})
                </Text>
                <Text numberOfLines={1} style={{ color: '#94A3B8', fontSize: 11 }}>
                  {previewGame?.homepage_url} (외부 보안 정책으로 화면이 안 보이면 우측 '새 탭으로 열기'를 눌러주세요)
                </Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                <TouchableOpacity
                  onPress={() => previewGame?.homepage_url && Linking.openURL(previewGame.homepage_url)}
                  style={{ backgroundColor: '#38BDF8', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 }}
                >
                  <Text style={{ color: '#0F172A', fontSize: 12, fontWeight: '800' }}>🌐 새 탭으로 열기 ↗</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setPreviewGame(null)}
                  style={{ backgroundColor: '#334155', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 }}
                >
                  <Text style={{ color: '#FFF', fontSize: 13, fontWeight: '800' }}>✕ 닫기</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={{ flex: 1, backgroundColor: '#FFF' }}>
              {Platform.OS === 'web' && previewGame?.homepage_url
                ? React.createElement('iframe', {
                    src: previewGame.homepage_url,
                    style: { width: '100%', height: '100%', border: 'none' },
                    allow: 'fullscreen; autoplay; gamepad',
                  })
                : null}
            </View>
          </View>
        </View>
            </Modal>

      <Modal visible={arcadeOpen} animationType="fade" transparent onRequestClose={() => setArcadeOpen(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.8)', justifyContent: 'center', alignItems: 'center', padding: 14 }}>
          <View style={{ width: '100%', maxWidth: 880, backgroundColor: '#0F172A', borderRadius: 20, padding: 18, borderWidth: 1, borderColor: '#334155', maxHeight: '92%' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <View>
                <Text style={{ color: '#38BDF8', fontSize: 18, fontWeight: '800' }}>🕹️ DevGround 미니 오락실: Bug Slayer (버그 피하기)</Text>
                <Text style={{ color: '#94A3B8', fontSize: 12 }}>게임 오버 시 내 최고 점수가 실시간 랭킹에 자동 등록됩니다!</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  onPress={async () => {
                    const s = await ApiClient.getArcadeScores();
                    setArcadeScores(s);
                  }}
                  style={{ backgroundColor: '#1E293B', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: '#475569' }}
                >
                  <Text style={{ color: '#38BDF8', fontSize: 12, fontWeight: '800' }}>🔄 랭킹 새로고침</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setArcadeOpen(false)}
                  style={{ backgroundColor: '#EF4444', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 }}
                >
                  <Text style={{ color: '#FFF', fontSize: 12, fontWeight: '800' }}>✕ 닫기</Text>
                </TouchableOpacity>
              </View>
            </View>
            <ScrollView>
              <View style={{ height: 400, backgroundColor: '#020617', borderRadius: 14, overflow: 'hidden', marginBottom: 14 }}>
                {Platform.OS === 'web'
                  ? React.createElement('iframe', {
                      src: '/arcade.html?user=' + encodeURIComponent(username || 'IndieDev'),
                      style: { width: '100%', height: '100%', border: 'none' },
                    })
                  : null}
              </View>
              <Text style={{ color: '#FACC15', fontSize: 14, fontWeight: '800', marginBottom: 8 }}>🏆 실시간 최고 점수 TOP 10</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {arcadeScores.map((r, idx) => (
                  <View
                    key={r.username + idx}
                    style={{ backgroundColor: '#1E293B', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: '#334155', minWidth: 150 }}
                  >
                    <Text style={{ color: '#F8FAFC', fontSize: 13, fontWeight: '800' }}>
                      {idx === 0 ? '🥇 ' : idx === 1 ? '🥈 ' : idx === 2 ? '🥉 ' : '#' + (idx + 1) + ' '}
                      {r.username}
                    </Text>
                    <Text style={{ color: '#38BDF8', fontSize: 12, fontWeight: '800', marginTop: 2 }}>{r.score} pts</Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={teamBoardOpen} animationType="fade" transparent onRequestClose={() => setTeamBoardOpen(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.75)', justifyContent: 'center', alignItems: 'center', padding: 16 }}>
          <View style={{ width: '100%', maxWidth: 640, backgroundColor: Theme.colors.background, borderRadius: 20, padding: 22, maxHeight: '90%' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <View>
                <Text style={{ fontSize: 19, fontWeight: '800', color: Theme.colors.text }}>🤝 인디 게임 개발 팀원 모집 전용 보드</Text>
                <Text style={{ fontSize: 12, color: Theme.colors.textLight }}>프로그래머 · 2D/3D 아트 · 사운드 · 기획자 협업 파트너를 찾아보세요!</Text>
              </View>
              <TouchableOpacity onPress={() => setTeamBoardOpen(false)}>
                <Text style={{ fontSize: 18, fontWeight: '800', color: Theme.colors.textLight }}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 520 }}>
              {teams.map((t) => (
                <View
                  key={t.id}
                  style={{ backgroundColor: Theme.colors.pillBg, borderRadius: 14, padding: 14, marginBottom: 10 }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      <View style={{ backgroundColor: '#FCE7F3', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
                        <Text style={{ fontSize: 11, fontWeight: '800', color: '#BE185D' }}>{t.role_needed}</Text>
                      </View>
                      <View style={{ backgroundColor: '#E0F2FE', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
                        <Text style={{ fontSize: 11, fontWeight: '800', color: '#0369A1' }}>{t.engine}</Text>
                      </View>
                    </View>
                    <Text style={{ fontSize: 11, color: Theme.colors.textLight, fontWeight: '700' }}>by {t.author}</Text>
                  </View>
                  <Text style={{ fontSize: 15, fontWeight: '800', color: Theme.colors.text, marginBottom: 4 }}>{t.project_title}</Text>
                  <Text style={{ fontSize: 13, color: Theme.colors.textLight, marginBottom: 10, lineHeight: 18 }}>{t.description}</Text>
                  <TouchableOpacity
                    onPress={() => t.contact_url && Linking.openURL(t.contact_url)}
                    style={{ backgroundColor: Theme.colors.primary, paddingVertical: 8, borderRadius: 10, alignItems: 'center' }}
                  >
                    <Text style={{ color: '#FFF', fontSize: 12, fontWeight: '800' }}>💬 디스코드 / 오픈채팅으로 지원·연락하기 ↗</Text>
                  </TouchableOpacity>
                </View>
              ))}

              <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: Theme.colors.pillBg }}>
                <Text style={{ fontSize: 15, fontWeight: '800', color: Theme.colors.text, marginBottom: 8 }}>➕ 새 팀원 모집 공고 등록하기</Text>
                <TextInput
                  style={{ backgroundColor: '#FFF', borderRadius: 10, padding: 10, marginBottom: 8, fontSize: 13 }}
                  placeholder="프로젝트 제목 (예: 2D 로그라이크 스팀 출시 팀원 구합니다)"
                  value={teamTitle}
                  onChangeText={setTeamTitle}
                />
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                  {['💻 프로그래머', '🎨 2D 픽셀 아티스트', '🧊 3D 모델러', '🎵 사운드/작곡', '📝 기획자'].map((role) => (
                    <TouchableOpacity
                      key={role}
                      onPress={() => setTeamRole(role)}
                      style={{
                        backgroundColor: teamRole === role ? Theme.colors.primary : Theme.colors.pillBg,
                        paddingHorizontal: 10,
                        paddingVertical: 5,
                        borderRadius: 10,
                      }}
                    >
                      <Text style={{ fontSize: 11, fontWeight: '800', color: teamRole === role ? '#FFF' : Theme.colors.text }}>{role}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                  <TextInput
                    style={{ flex: 1, backgroundColor: '#FFF', borderRadius: 10, padding: 10, fontSize: 13 }}
                    placeholder="엔진 (Unity / Unreal / Godot)"
                    value={teamEngine}
                    onChangeText={setTeamEngine}
                  />
                  <TextInput
                    style={{ flex: 1, backgroundColor: '#FFF', borderRadius: 10, padding: 10, fontSize: 13 }}
                    placeholder="오픈카톡 / 디스코드 초대 링크 (https://...)"
                    value={teamContact}
                    onChangeText={setTeamContact}
                    autoCapitalize="none"
                  />
                </View>
                <TextInput
                  style={{ backgroundColor: '#FFF', borderRadius: 10, padding: 10, marginBottom: 10, fontSize: 13, height: 64 }}
                  placeholder="모집 상세 내용 및 협업 방식 소개..."
                  multiline
                  value={teamDesc}
                  onChangeText={setTeamDesc}
                />
                <TouchableOpacity
                  disabled={submittingTeam}
                  onPress={async () => {
                    if (!teamTitle.trim()) return;
                    try {
                      setSubmittingTeam(true);
                      const next = await ApiClient.postTeam({
                        project_title: teamTitle.trim(),
                        role_needed: teamRole,
                        engine: teamEngine.trim() || 'Unity',
                        author: username || 'IndieDev',
                        contact_url: teamContact.trim() || 'https://discord.com',
                        description: teamDesc.trim(),
                      });
                      if (next.length > 0) setTeams(next);
                      setTeamTitle('');
                      setTeamContact('');
                      setTeamDesc('');
                    } catch {} finally {
                      setSubmittingTeam(false);
                    }
                  }}
                  style={{ backgroundColor: '#10B981', paddingVertical: 11, borderRadius: 12, alignItems: 'center' }}
                >
                  <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 14 }}>{submittingTeam ? '등록 중...' : '🤝 팀원 모집 공고 올리기'}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={installModalOpen} animationType="fade" transparent onRequestClose={() => setInstallModalOpen(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.75)', justifyContent: 'center', alignItems: 'center', padding: 18 }}>
          <View style={{ width: '100%', maxWidth: 460, backgroundColor: Theme.colors.background, borderRadius: 20, padding: 22 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: Theme.colors.text }}>📲 DevGround 모바일·PC 앱 무료 설치</Text>
              <TouchableOpacity onPress={() => setInstallModalOpen(false)}>
                <Text style={{ fontSize: 18, fontWeight: '800', color: Theme.colors.textLight }}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={{ fontSize: 13, color: Theme.colors.textLight, marginBottom: 10, lineHeight: 19 }}>
              스토어 결제나 무거운 다운로드 없이 스마트폰 카메라로 아래 QR코드를 스캔하거나 홈 화면에 추가해 바로 실행하세요!
            </Text>
            <View style={{ alignItems: 'center', marginBottom: 12 }}>
              <Image
                source={{ uri: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https%3A%2F%2Fgamedev-platform-expo-client.vercel.app' }}
                style={{ width: 120, height: 120, borderRadius: 12, backgroundColor: '#FFF', padding: 6 }}
              />
              <Text style={{ fontSize: 11, fontWeight: '700', color: Theme.colors.primary, marginTop: 4 }}>📷 휴대폰 카메라로 스캔하면 앱이 바로 열립니다</Text>
            </View>
            <View style={{ backgroundColor: Theme.colors.pillBg, padding: 11, borderRadius: 12, marginBottom: 8 }}>
              <Text style={{ fontSize: 13, fontWeight: '800', color: Theme.colors.primary, marginBottom: 3 }}>🤖 안드로이드 (갤럭시 · Chrome)</Text>
              <Text style={{ fontSize: 12, color: Theme.colors.text, lineHeight: 17 }}>
                우측 상단 메뉴(⋮) 탭 👉 [앱 설치] 또는 [홈 화면에 추가] 선택 시 바탕화면에 전용 앱으로 즉시 설치됩니다.
              </Text>
            </View>
            <View style={{ backgroundColor: Theme.colors.pillBg, padding: 11, borderRadius: 12, marginBottom: 8 }}>
              <Text style={{ fontSize: 13, fontWeight: '800', color: '#10B981', marginBottom: 3 }}>🍎 아이폰 · 아이패드 (Safari)</Text>
              <Text style={{ fontSize: 12, color: Theme.colors.text, lineHeight: 17 }}>
                하단 중앙 [공유(⬆️)] 버튼 탭 👉 [홈 화면에 추가]를 누르면 상단 주소창이 없는 진짜 앱으로 실행됩니다.
              </Text>
            </View>
            <View style={{ backgroundColor: Theme.colors.pillBg, padding: 11, borderRadius: 12, marginBottom: 12 }}>
              <Text style={{ fontSize: 13, fontWeight: '800', color: '#D97706', marginBottom: 3 }}>💻 PC (Chrome · Edge 브라우저)</Text>
              <Text style={{ fontSize: 12, color: Theme.colors.text, lineHeight: 17 }}>
                주소창 오른쪽 끝의 [📥 앱 설치] 아이콘을 클릭하면 윈도우/맥 독립 프로그램으로 설치됩니다.
              </Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <TouchableOpacity onPress={() => Linking.openURL('https://gamedev-platform-expo-client.vercel.app/privacy.html')}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: Theme.colors.textLight }}>📜 개인정보처리방침 · 이용약관 보기 ↗</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setInstallModalOpen(false)}
                style={{ backgroundColor: Theme.colors.primary, paddingHorizontal: 18, paddingVertical: 9, borderRadius: 10 }}
              >
                <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 13 }}>확인</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
            </Modal>

      <Modal visible={sfxStudioOpen} animationType="fade" transparent onRequestClose={() => setSfxStudioOpen(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.8)', justifyContent: 'center', alignItems: 'center', padding: 14 }}>
          <View style={{ width: '100%', maxWidth: 820, backgroundColor: '#0F172A', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#334155' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <Text style={{ color: '#38BDF8', fontSize: 17, fontWeight: '800' }}>🔊 DevGround 내장 8비트 효과음(SFX) 제작 스튜디오 (.WAV 추출)</Text>
              <TouchableOpacity onPress={() => setSfxStudioOpen(false)} style={{ backgroundColor: '#EF4444', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8 }}>
                <Text style={{ color: '#FFF', fontSize: 12, fontWeight: '800' }}>✕ 닫기</Text>
              </TouchableOpacity>
            </View>
            <View style={{ height: 470, backgroundColor: '#0F172A', borderRadius: 12, overflow: 'hidden' }}>
              {Platform.OS === 'web'
                ? React.createElement('iframe', {
                    src: '/sfx-studio.html',
                    style: { width: '100%', height: '100%', border: 'none' },
                  })
                : null}
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={errorWikiOpen} animationType="fade" transparent onRequestClose={() => setErrorWikiOpen(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.82)', justifyContent: 'center', alignItems: 'center', padding: 14 }}>
          <View style={{ width: '100%', maxWidth: 760, backgroundColor: Theme.colors.background, borderRadius: 20, padding: 20, maxHeight: '92%' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 18, fontWeight: '800', color: Theme.colors.text }}>🛠️ Unity · Unreal · Godot 만능 에러 해결 센터</Text>
                <Text style={{ fontSize: 12, color: Theme.colors.textLight }}>어떤 에러든 콘솔 로그를 붙여넣거나 검색하면 원인과 해결 코드를 즉시 찾아줍니다!</Text>
              </View>
              <TouchableOpacity onPress={() => setErrorWikiOpen(false)} style={{ padding: 4 }}>
                <Text style={{ fontSize: 18, fontWeight: '800', color: Theme.colors.textLight }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 580 }}>
              {/* Universal Error Analyzer Box */}
              <View style={{ backgroundColor: '#0F172A', borderRadius: 14, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: '#38BDF8' }}>
                <Text style={{ color: '#38BDF8', fontSize: 13, fontWeight: '800', marginBottom: 6 }}>
                  🤖 만능 에러 자동 진단기 (Unity 콘솔 에러 메시지를 그대로 붙여넣으세요!)
                </Text>
                <TextInput
                  style={{ backgroundColor: '#1E293B', color: '#F8FAFC', borderRadius: 10, padding: 10, fontSize: 12, height: 56, marginBottom: 8 }}
                  placeholder="예: Assets/Player.cs(42,13): error CS0103: The name 'speed' does not exist... 또는 아무 에러 메시지 붙여넣기"
                  placeholderTextColor="#64748B"
                  multiline
                  value={diagnoseInput}
                  onChangeText={setDiagnoseInput}
                />
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity
                    onPress={handleUniversalDiagnose}
                    disabled={diagnosing}
                    style={{ flex: 1, backgroundColor: '#38BDF8', paddingVertical: 9, borderRadius: 10, alignItems: 'center' }}
                  >
                    <Text style={{ color: '#0F172A', fontWeight: '800', fontSize: 13 }}>
                      {diagnosing ? '🔍 에러 분석 및 번역 중...' : '🔍 이 에러 즉시 원인 진단 & 한글 번역 해결하기'}
                    </Text>
                  </TouchableOpacity>
                  {diagnoseResult ? (
                    <TouchableOpacity
                      onPress={() => { setDiagnoseResult(null); setDiagnoseInput(''); }}
                      style={{ backgroundColor: '#334155', paddingHorizontal: 12, justifyContent: 'center', borderRadius: 10 }}
                    >
                      <Text style={{ color: '#FFF', fontSize: 12, fontWeight: '700' }}>초기화</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>

                {diagnoseResult ? (
                  <View style={{ marginTop: 12, backgroundColor: '#1E293B', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#475569' }}>
                    <Text style={{ color: '#FACC15', fontSize: 13, fontWeight: '800', marginBottom: 4 }}>✅ 자동 진단 결과: {diagnoseResult.title}</Text>
                    {diagnoseResult.location ? (
                      <Text style={{ color: '#38BDF8', fontSize: 12, fontWeight: '800', marginBottom: 4 }}>{diagnoseResult.location}</Text>
                    ) : null}
                    {diagnoseResult.translated ? (
                      <Text style={{ color: '#E2E8F0', fontSize: 12, marginBottom: 6 }}>🌐 에러 한글 해석: "{diagnoseResult.translated}"</Text>
                    ) : null}
                    <Text style={{ color: '#FDA4AF', fontSize: 12, marginBottom: 4 }}>• 발생 원인: {diagnoseResult.cause}</Text>
                    <Text style={{ color: '#A7F3D0', fontSize: 13, fontWeight: '700', marginBottom: 8, lineHeight: 18 }}>💡 해결 방법: {diagnoseResult.solution}</Text>
                    {diagnoseResult.code_fix ? (
                      <View style={{ backgroundColor: '#020617', padding: 10, borderRadius: 8, marginBottom: 8 }}>
                        <Text style={{ color: '#38BDF8', fontSize: 11, fontFamily: 'monospace' }}>{diagnoseResult.code_fix}</Text>
                      </View>
                    ) : null}
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                      <TouchableOpacity
                        onPress={() => Linking.openURL('https://www.google.com/search?q=' + encodeURIComponent('Unity ' + diagnoseResult.query + ' 해결'))}
                        style={{ backgroundColor: '#3B82F6', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }}
                      >
                        <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '800' }}>🔎 구글 한국어 해결책 검색 ↗</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => Linking.openURL('https://stackoverflow.com/search?q=' + encodeURIComponent('[unity3d] ' + diagnoseResult.query))}
                        style={{ backgroundColor: '#F97316', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }}
                      >
                        <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '800' }}>💡 StackOverflow 정답 검색 ↗</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => Linking.openURL('https://discussions.unity.com/search?q=' + encodeURIComponent(diagnoseResult.query))}
                        style={{ backgroundColor: '#10B981', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }}
                      >
                        <Text style={{ color: '#0F172A', fontSize: 11, fontWeight: '800' }}>🎮 Unity 공식 포럼 검색 ↗</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : null}
              </View>

              {/* Search & Category Filter */}
              <TextInput
                style={{ backgroundColor: '#FFF', borderRadius: 10, padding: 10, marginBottom: 8, fontSize: 13 }}
                placeholder="🔎 에러 코드/증상 즉시 검색 (예: CS0103, CS0246, Null, 분홍색, 충돌, 버튼, IL2CPP, WebGL...)"
                value={errorSearch}
                onChangeText={setErrorSearch}
              />

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginBottom: 12 }}>
                {['전체', 'Unity (C# CS코드)', 'Unity (런타임 예외)', 'Unity (물리/UI/셰이더)', 'Unity (빌드/배포)', 'Unreal / Godot'].map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setErrorCatFilter(cat)}
                    style={{
                      backgroundColor: errorCatFilter === cat ? Theme.colors.primary : Theme.colors.pillBg,
                      paddingHorizontal: 11,
                      paddingVertical: 6,
                      borderRadius: 12,
                    }}
                  >
                    <Text style={{ fontSize: 11, fontWeight: '800', color: errorCatFilter === cat ? '#FFF' : Theme.colors.text }}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {(() => {
                const combined = [...BUILTIN_UNITY_ERRORS];
                errorList.forEach((srvErr) => {
                  if (!combined.some((b) => b.error_title.slice(0, 12) === String(srvErr.error_title).slice(0, 12))) {
                    combined.push(srvErr);
                  }
                });
                const filtered = combined.filter((e) => {
                  const matchCat = errorCatFilter === '전체' || String(e.engine).includes(errorCatFilter.replace('Unreal / Godot', 'Unreal')) || (errorCatFilter === 'Unreal / Godot' && (String(e.engine).includes('Unreal') || String(e.engine).includes('Godot')));
                  const matchQuery = !errorSearch.trim() || (e.error_title + e.cause + e.solution + e.engine + (e.code_fix || '')).toLowerCase().includes(errorSearch.toLowerCase());
                  return matchCat && matchQuery;
                });

                return filtered.map((e, idx) => (
                  <View key={String(e.id) + idx} style={{ backgroundColor: Theme.colors.pillBg, borderRadius: 14, padding: 14, marginBottom: 10 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <View style={{ backgroundColor: '#FFEDD5', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
                        <Text style={{ fontSize: 11, fontWeight: '800', color: '#C2410C' }}>{e.engine}</Text>
                      </View>
                      <View style={{ flexDirection: 'row', gap: 6 }}>
                        {e.code_fix ? (
                          <TouchableOpacity
                            onPress={() => {
                              try { navigator?.clipboard?.writeText(e.code_fix); } catch {}
                              setCopiedErrId(String(e.id));
                              setTimeout(() => setCopiedErrId(null), 1800);
                            }}
                            style={{ backgroundColor: copiedErrId === String(e.id) ? '#10B981' : '#1E293B', paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8 }}
                          >
                            <Text style={{ fontSize: 11, fontWeight: '800', color: '#FFF' }}>
                              {copiedErrId === String(e.id) ? '✅ 코드 복사됨' : '📋 해결코드 복사'}
                            </Text>
                          </TouchableOpacity>
                        ) : null}
                        <TouchableOpacity
                          onPress={() => Linking.openURL('https://www.google.com/search?q=' + encodeURIComponent(e.error_title + ' 해결'))}
                          style={{ backgroundColor: '#E0F2FE', paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8 }}
                        >
                          <Text style={{ fontSize: 11, fontWeight: '800', color: '#0369A1' }}>🔎 상세 검색 ↗</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                    <Text style={{ fontSize: 14, fontWeight: '800', color: '#DC2626', marginBottom: 4 }}>🚨 {e.error_title}</Text>
                    <Text style={{ fontSize: 12, color: Theme.colors.textLight, marginBottom: 6 }}>• 원인: {e.cause}</Text>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: Theme.colors.text, marginBottom: 8, lineHeight: 19 }}>💡 해결법: {e.solution}</Text>
                    {e.code_fix ? (
                      <View style={{ backgroundColor: '#0F172A', padding: 10, borderRadius: 10 }}>
                        <Text style={{ color: '#38BDF8', fontSize: 11, fontFamily: 'monospace' }}>{e.code_fix}</Text>
                      </View>
                    ) : null}
                  </View>
                ));
              })()}

              <View style={{ marginTop: 10, paddingTop: 12, borderTopWidth: 1, borderTopColor: Theme.colors.pillBg }}>
                <Text style={{ fontSize: 14, fontWeight: '800', color: Theme.colors.text, marginBottom: 8 }}>➕ 새로운 에러 & 해결법 커뮤니티에 공유하기</Text>
                <TextInput
                  style={{ backgroundColor: '#FFF', borderRadius: 10, padding: 9, marginBottom: 8, fontSize: 13 }}
                  placeholder="에러 메시지 제목 (예: CS0103: The name does not exist...)"
                  value={errTitle}
                  onChangeText={setErrTitle}
                />
                <TextInput
                  style={{ backgroundColor: '#FFF', borderRadius: 10, padding: 9, marginBottom: 8, fontSize: 13 }}
                  placeholder="발생 원인 한줄 요약"
                  value={errCause}
                  onChangeText={setErrCause}
                />
                <TextInput
                  style={{ backgroundColor: '#FFF', borderRadius: 10, padding: 9, marginBottom: 8, fontSize: 13, height: 56 }}
                  placeholder="해결 방법 설명..."
                  multiline
                  value={errSolution}
                  onChangeText={setErrSolution}
                />
                <TouchableOpacity
                  disabled={submittingErr}
                  onPress={async () => {
                    if (!errTitle.trim() || !errSolution.trim()) return;
                    try {
                      setSubmittingErr(true);
                      const next = await ApiClient.postError({
                        engine: errEngine,
                        error_title: errTitle.trim(),
                        cause: errCause.trim() || '설정/스크립트 참조 오류',
                        solution: errSolution.trim(),
                        code_fix: errCode.trim() || undefined,
                        author: username || 'IndieDev',
                      });
                      if (next.length > 0) setErrorList(next);
                      setErrTitle('');
                      setErrCause('');
                      setErrSolution('');
                      setErrCode('');
                    } catch {} finally {
                      setSubmittingErr(false);
                    }
                  }}
                  style={{ backgroundColor: Theme.colors.primary, paddingVertical: 10, borderRadius: 10, alignItems: 'center' }}
                >
                  <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 13 }}>{submittingErr ? '등록 중...' : '🛠️ 에러 해결 사전에 등재하기'}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={ideaMachineOpen} animationType="fade" transparent onRequestClose={() => setIdeaMachineOpen(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.75)', justifyContent: 'center', alignItems: 'center', padding: 18 }}>
          <View style={{ width: '100%', maxWidth: 460, backgroundColor: Theme.colors.background, borderRadius: 20, padding: 22 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: Theme.colors.text }}>🎲 인디게임 신작 & 게임잼 아이디어 뽑기</Text>
              <TouchableOpacity onPress={() => setIdeaMachineOpen(false)}>
                <Text style={{ fontSize: 18, fontWeight: '800', color: Theme.colors.textLight }}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={{ fontSize: 12, color: Theme.colors.textLight, marginBottom: 14 }}>
              버튼을 누를 때마다 독창적인 인디게임 장르·핵심 기믹·세계관 조합이 무작위로 생성됩니다!
            </Text>
            <View style={{ backgroundColor: Theme.colors.pillBg, borderRadius: 16, padding: 16, marginBottom: 14, gap: 10 }}>
              <View>
                <Text style={{ fontSize: 11, fontWeight: '800', color: Theme.colors.primary }}>🎮 추천 장르 (Genre)</Text>
                <Text style={{ fontSize: 16, fontWeight: '800', color: Theme.colors.text, marginTop: 2 }}>{currentIdea.genre}</Text>
              </View>
              <View>
                <Text style={{ fontSize: 11, fontWeight: '800', color: '#10B981' }}>⚡ 핵심 기믹 (Core Mechanic)</Text>
                <Text style={{ fontSize: 15, fontWeight: '800', color: Theme.colors.text, marginTop: 2 }}>{currentIdea.mechanic}</Text>
              </View>
              <View>
                <Text style={{ fontSize: 11, fontWeight: '800', color: '#D97706' }}>🌍 세계관 / 주인공 (Theme)</Text>
                <Text style={{ fontSize: 15, fontWeight: '800', color: Theme.colors.text, marginTop: 2 }}>{currentIdea.theme}</Text>
              </View>
              <View>
                <Text style={{ fontSize: 11, fontWeight: '800', color: '#BE185D' }}>🎯 특별 제약 조건 (Jam Rule)</Text>
                <Text style={{ fontSize: 14, fontWeight: '700', color: Theme.colors.text, marginTop: 2 }}>{currentIdea.constraint}</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity
                onPress={rollGameIdea}
                style={{ flex: 1, backgroundColor: Theme.colors.primary, paddingVertical: 12, borderRadius: 12, alignItems: 'center' }}
              >
                <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 14 }}>🎰 다시 뽑기 (Spin!)</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  const text = `[신작 기획안]\n• 장르: ${currentIdea.genre}\n• 핵심 기믹: ${currentIdea.mechanic}\n• 세계관: ${currentIdea.theme}\n• 특별 규칙: ${currentIdea.constraint}`;
                  try { navigator?.clipboard?.writeText(text); } catch {}
                  setIdeaCopied(true);
                }}
                style={{ flex: 1, backgroundColor: ideaCopied ? '#10B981' : '#1E293B', paddingVertical: 12, borderRadius: 12, alignItems: 'center' }}
              >
                <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 13 }}>{ideaCopied ? '✅ 기획안 복사됨!' : '📋 기획안 복사하기'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Theme.colors.background,
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  titleRow: {
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: Theme.colors.primary,
  },
  searchBox: {
    width: '100%',
    marginBottom: 12,
  },
  searchInput: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: Theme.colors.text,
  },
  sortRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  sortButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: Theme.colors.pillBg,
  },
  activeSortButton: {
    backgroundColor: Theme.colors.primary,
  },
  sortButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: Theme.colors.textLight,
  },
  activeSortButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  listContent: {
    paddingBottom: 100,
  },
  notifOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  notifPanel: { borderRadius: 20, padding: 20 },
  notifTitle: { fontSize: 20, fontWeight: '800', marginBottom: 12 },
  notifItem: { paddingVertical: 12, borderBottomWidth: 1 },
});
