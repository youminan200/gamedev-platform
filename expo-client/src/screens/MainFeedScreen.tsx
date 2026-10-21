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
  const [activeSection, setActiveSection] = useState<'feed' | 'showcase' | 'tools'>('feed');
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
    // 1. Unity C# Compiler Errors (CS Codes)
    { id: 'u1', engine: 'Unity (C# CS코드)', error_title: 'CS0103: The name "..." does not exist in the current context', cause: '선언하지 않은 변수/함수명을 사용했거나 대소문자 오타(gameObject vs gameobject), 또는 지역변수 중괄호 { } 범위를 벗어났을 때 발생합니다.', solution: '1) 대소문자 철자를 확인하세요. 2) 특정 함수 안에서 선언한 변수를 다른 함수에서 쓰려면 클래스 상단 멤버 변수로 선언하세요.', code_fix: 'private float moveSpeed = 5f; // 클래스 상단에 선언', helpful_count: 68 },
    { id: 'u2', engine: 'Unity (C# CS코드)', error_title: 'CS0246: The type or namespace name "..." could not be found', cause: 'UI(Button, Image), TextMeshPro, SceneManager, InputSystem 등을 사용할 때 스크립트 최상단 using 구문이 빠졌거나 .asmdef 참조가 누락되었습니다.', solution: '스크립트 맨 위에 using UnityEngine.UI; / using TMPro; / using UnityEngine.SceneManagement; 를 추가하세요.', code_fix: 'using UnityEngine;\nusing UnityEngine.UI;\nusing UnityEngine.SceneManagement;\nusing TMPro;', helpful_count: 64 },
    { id: 'u3', engine: 'Unity (C# CS코드)', error_title: 'CS1061: "..." does not contain a definition for "..."', cause: '해당 컴포넌트에 없는 함수/변수를 호출했거나, 내가 만든 스크립트 이름(예: Camera.cs, Input.cs)이 Unity 기본 클래스 이름과 겹쳐 충돌났습니다.', solution: '호출 대상 컴포넌트가 맞는지 확인하고, 내 스크립트 이름이 Unity 내장 클래스명과 같다면 파일명을 변경하세요.', code_fix: 'GetComponent<Rigidbody2D>().linearVelocity = Vector2.zero;', helpful_count: 59 },
    { id: 'u4', engine: 'Unity (C# CS코드)', error_title: 'CS0029: Cannot implicitly convert type "double" to "float" (또는 float to int)', cause: 'C#에서 소수점 숫자 뒤에 f를 붙이지 않으면 double로 인식되어 float 변수에 대입할 수 없습니다.', solution: '소수점 숫자 뒤에 반드시 f를 붙이고(예: 3.5f), int에 넣을 때는 Mathf.RoundToInt()를 사용하세요.', code_fix: 'float speed = 5.5f;\nint dmg = Mathf.RoundToInt(speed);', helpful_count: 55 },
    { id: 'u5', engine: 'Unity (C# CS코드)', error_title: 'CS1612: Cannot modify the return value of "Transform.position" because it is not a variable', cause: 'transform.position.x = 5f; 처럼 구조체(Vector3) 반환값의 일부만 직접 수정하려고 할 때 발생합니다.', solution: 'Vector3 변수에 먼저 담아서 수정한 뒤 transform.position에 통째로 대입하세요.', code_fix: 'Vector3 pos = transform.position;\npos.x = 5f;\ntransform.position = pos;', helpful_count: 61 },
    { id: 'u6', engine: 'Unity (C# CS코드)', error_title: 'CS0120: An object reference is required for the non-static field, method, or property', cause: '생성된 오브젝트 인스턴스가 아니라 클래스 이름 자체로 일반(non-static) 함수/변수를 호출했습니다.', solution: 'GetComponent<T>(), 싱글톤 Instance, 또는 FindFirstObjectByType<T>()로 실제 오브젝트를 찾아 호출하세요.', code_fix: 'Player p = FindFirstObjectByType<Player>();\np.Jump();', helpful_count: 48 },
    { id: 'u7', engine: 'Unity (C# CS코드)', error_title: 'CS0161: Not all code paths return a value', cause: '반환값(int, bool 등)이 있는 함수에서 if문 안에만 return이 있고 함수 끝에 기본 return이 빠졌습니다.', solution: '함수 맨 마지막 줄에 기본 return 문을 추가하세요.', code_fix: 'bool Check() {\n    if (hp > 0) return true;\n    return false;\n}', helpful_count: 43 },
    { id: 'u8', engine: 'Unity (C# CS코드)', error_title: 'CS0618 / CS0619: "..." is obsolete (Unity 6 구버전 API 경고/에러)', cause: 'Unity 6에서 구버전 API(rb.velocity, FindObjectOfType 등)가 최신 API로 변경되었습니다.', solution: 'rb.velocity -> rb.linearVelocity, FindObjectOfType -> FindFirstObjectByType 으로 변경하세요.', code_fix: 'rb.linearVelocity = new Vector2(x, rb.linearVelocity.y);', helpful_count: 52 },
    { id: 'u9', engine: 'Unity (C# CS코드)', error_title: 'CS1002 / CS1513 / CS1525: ; expected / } expected / Invalid expression term', cause: '코드 줄 끝에 세미콜론(;)이 빠졌거나 중괄호 { } 짝이 맞지 않을 때 발생합니다.', solution: '에러에 적힌 줄 번호(또는 바로 윗줄) 끝에 ; 가 있는지, 닫는 중괄호 } 개수가 맞는지 확인하세요.', code_fix: 'int hp = 100; // 세미콜론과 중괄호 짝 확인', helpful_count: 50 },
    { id: 'u24', engine: 'Unity (C# CS코드)', error_title: 'CS0101 / CS0111: The namespace already contains a definition / Type already defines a member', cause: '프로젝트 폴더 안에 동일한 클래스 이름(.cs)이 2개 존재하거나, 한 스크립트 안에 똑같은 이름의 함수(예: Update 두 번)가 중복 작성되었습니다.', solution: '중복된 스크립트 파일을 삭제/이름변경하거나, 스크립트 내 중복된 함수 하나를 합치세요.', code_fix: '// 프로젝트 창에서 동일한 클래스명이 두 번 선언되었는지 검색', helpful_count: 47 },
    { id: 'u25', engine: 'Unity (C# CS코드)', error_title: 'CS1501 / CS1503: No overload for method takes N arguments / Argument cannot convert from A to B', cause: '함수 호출 시 전달한 매개변수(인자) 개수가 다르거나, 잘못된 타입(예: GameObject 자리에 Transform 전달)을 넣었습니다.', solution: '함수 정의부의 매개변수 개수와 타입을 확인하세요. (예: Instantiate(prefab, transform.position, Quaternion.identity))', code_fix: 'Instantiate(prefab, transform.position, Quaternion.identity);', helpful_count: 51 },
    { id: 'u26', engine: 'Unity (C# CS코드)', error_title: 'CS0266: Cannot implicitly convert type "Object" to "GameObject". An explicit conversion exists', cause: 'Resources.Load() 또는 구버전 Instantiate 반환값을 형변환 없이 변수에 대입했습니다.', solution: '제네릭 문법 Resources.Load<GameObject>("Path") 또는 Instantiate<GameObject>(prefab)를 사용하세요.', code_fix: 'GameObject go = Resources.Load<GameObject>("Prefabs/Slime");', helpful_count: 41 },
    { id: 'u27', engine: 'Unity (C# CS코드)', error_title: 'CS0122: "..." is inaccessible due to its protection level (접근 제한자 오류)', cause: '다른 스크립트의 private 또는 protected 변수/함수에 외부에서 접근하려고 할 때 발생합니다.', solution: '대상 변수나 함수를 public으로 변경하거나 public 프로퍼티(Getter)를 만드세요.', code_fix: 'public int CurrentHp { get; private set; } = 100;', helpful_count: 58 },
    { id: 'u28', engine: 'Unity (C# CS코드)', error_title: 'CS0165: Use of unassigned local variable (초기화되지 않은 지역변수 사용)', cause: '함수 안에서 선언만 하고 초기값(= 0, = null 등)을 넣지 않은 지역변수를 읽으려 했습니다.', solution: '지역변수 선언과 동시에 초기값을 대입하세요.', code_fix: 'int totalDamage = 0; // 선언 시 초기값 대입', helpful_count: 39 },
    { id: 'u29', engine: 'Unity (C# CS코드)', error_title: 'CS0535: "..." does not implement interface member (인터페이스 구현 누락)', cause: 'IPointerClickHandler, IDamageable 등 인터페이스를 상속받고 필수 함수를 작성하지 않았거나 public을 빼먹었습니다.', solution: '인터페이스에 정의된 메서드를 반드시 public으로 정확히 구현하세요.', code_fix: 'public void OnPointerClick(PointerEventData eventData) { }', helpful_count: 42 },
    { id: 'u30', engine: 'Unity (C# CS코드)', error_title: 'MonoBehaviour 파일명과 클래스명 불일치 ("Can\'t add script component because the script class cannot be found")', cause: 'C# 스크립트 파일 이름(예: PlayerMove.cs)과 코드 안의 public class 이름이 서로 다르면 오브젝트에 부착할 수 없습니다.', solution: '파일 이름과 public class 이름을 대소문자까지 100% 똑같이 맞추세요.', code_fix: '// 파일명이 PlayerMove.cs 이면:\npublic class PlayerMove : MonoBehaviour { }', helpful_count: 89 },

    // 2. Unity Runtime Exceptions
    { id: 'u10', engine: 'Unity (런타임 예외)', error_title: 'NullReferenceException: Object reference not set to an instance of an object', cause: 'Inspector 슬롯이 비어 있거나(None), GetComponent<T>()가 실패해 null인 변수를 사용할 때 발생합니다.', solution: '콘솔 에러를 더블클릭해 해당 줄의 변수 중 어떤 것이 null인지 확인하고 Inspector 연결 또는 Awake() 초기화를 추가하세요.', code_fix: 'void Awake() { if (!rb) rb = GetComponent<Rigidbody2D>(); }', helpful_count: 95 },
    { id: 'u11', engine: 'Unity (런타임 예외)', error_title: 'MissingReferenceException: The object of type "..." has been destroyed', cause: 'Destroy()로 이미 파괴된 오브젝트를 코루틴이나 이벤트에서 계속 참조할 때 발생합니다.', solution: '접근 전 if (target != null) 체크를 추가하고 OnDestroy()에서 코루틴/이벤트를 해제하세요.', code_fix: 'if (target != null) target.transform.Translate(Vector3.up);', helpful_count: 57 },
    { id: 'u12', engine: 'Unity (런타임 예외)', error_title: 'UnassignedReferenceException: The variable "..." has not been assigned', cause: 'Inspector 창의 스크립트 변수 슬롯이 비어 있는(None) 상태로 게임을 실행했습니다.', solution: 'Hierarchy에서 오브젝트를 선택하고 Inspector의 빈 슬롯에 프리팹/오브젝트를 드래그해 연결하세요.', code_fix: '[SerializeField] private GameObject prefab; // Inspector 연결 필수', helpful_count: 63 },
    { id: 'u13', engine: 'Unity (런타임 예외)', error_title: 'IndexOutOfRangeException / ArgumentOutOfRangeException (배열·리스트 범위 초과)', cause: '배열이나 List의 크기보다 큰 인덱스(또는 음수)에 접근했습니다.', solution: '접근 전 if (idx >= 0 && idx < list.Count) 조건으로 배열 범위를 먼저 확인하세요.', code_fix: 'if (idx >= 0 && idx < list.Count) { var v = list[idx]; }', helpful_count: 54 },
    { id: 'u14', engine: 'Unity (런타임 예외)', error_title: 'InvalidOperationException: You are trying to read Input using the UnityEngine.Input class (Input System 충돌)', cause: '신규 Input System 패키지를 켜놓고 구버전 Input.GetKeyDown() 코드를 사용했습니다.', solution: 'Edit > Project Settings > Player > Other Settings > Active Input Handling을 "Both"로 변경하면 즉시 해결됩니다!', code_fix: '// Project Settings > Player > Active Input Handling -> Both 선택', helpful_count: 82 },
    { id: 'u15', engine: 'Unity (런타임 예외)', error_title: 'InvalidOperationException: Collection was modified; enumeration operation may not execute', cause: 'foreach문으로 리스트를 돌면서 동시에 list.Remove()나 Add()를 호출했습니다.', solution: 'foreach 대신 역방향 for문(for int i = list.Count - 1; i >= 0; i--)을 사용해 안전하게 삭제하세요.', code_fix: 'for (int i = list.Count - 1; i >= 0; i--) { list.RemoveAt(i); }', helpful_count: 49 },
    { id: 'u16', engine: 'Unity (런타임 예외)', error_title: 'MissingComponentException / StackOverflowException / KeyNotFoundException', cause: '필수 컴포넌트 누락, 무한 재귀 호출, 또는 Dictionary에 없는 키를 조회할 때 발생합니다.', solution: 'Inspector에서 컴포넌트를 추가하고, Dictionary는 TryGetValue()로 안전하게 조회하세요.', code_fix: 'if (dict.TryGetValue(key, out var val)) { /* 안전 사용 */ }', helpful_count: 46 },
    { id: 'u31', engine: 'Unity (런타임 예외)', error_title: 'Coroutine couldn\'t be started because the game object "..." is inactive!', cause: 'SetActive(false)로 꺼져 있는 게임오브젝트에서 StartCoroutine()을 호출할 때 발생합니다.', solution: '먼저 gameObject.SetActive(true)로 활성화한 뒤 StartCoroutine()을 호출하거나, 항상 켜져 있는 매니저 오브젝트에서 코루틴을 실행하세요.', code_fix: 'gameObject.SetActive(true);\nStartCoroutine(SpawnRoutine());', helpful_count: 66 },
    { id: 'u32', engine: 'Unity (런타임 예외)', error_title: 'DontDestroyOnLoad 사용 시 씬을 이동할 때마다 매니저/BGM 오브젝트가 중복 생성되는 버그', cause: '처음 씬으로 돌아올 때 기존 DontDestroyOnLoad 오브젝트가 남아있는데 씬에 배치된 오브젝트가 또 생성됩니다.', solution: 'Awake()에서 static Instance가 이미 존재하면 자기 자신(Destroy(gameObject))을 즉시 파괴하고 return 하세요.', code_fix: 'if (Instance != null && Instance != this) { Destroy(gameObject); return; }\nInstance = this;\nDontDestroyOnLoad(gameObject);', helpful_count: 74 },
    { id: 'u33', engine: 'Unity (런타임 예외)', error_title: '일시정지(Time.timeScale = 0) 상태에서 코루틴(WaitForSeconds)과 UI 애니메이션이 멈추는 현상', cause: 'WaitForSeconds와 일반 Animator는 Time.timeScale의 영향을 받아 0이 되면 완전히 멈춥니다.', solution: '코루틴에서는 WaitForSecondsRealtime()을 사용하고, UI Animator의 Update Mode를 "Unscaled Time"으로 변경하세요.', code_fix: 'yield return new WaitForSecondsRealtime(1.0f);', helpful_count: 69 },
    { id: 'u34', engine: 'Unity (런타임 예외)', error_title: 'FormatException: Input string was not in a correct format (int.Parse / float.Parse 에러)', cause: '숫자가 아닌 빈 문자열("")이나 공백/문자가 섞인 텍스트를 int.Parse()로 변환하려 했습니다.', solution: '에러가 나지 않는 int.TryParse(str, out int result)를 사용하세요.', code_fix: 'if (int.TryParse(inputField.text, out int score)) { /* 안전 변환 */ }', helpful_count: 44 },

    // 3. Unity Physics / UI / Shader
    { id: 'u17', engine: 'Unity (물리/UI/셰이더)', error_title: 'OnTriggerEnter2D / OnCollisionEnter 충돌 감지가 전혀 작동하지 않는 현상', cause: '두 오브젝트 중 최소 하나에 Rigidbody(2D)가 없거나, 2D 게임에서 3D용 OnTriggerEnter를 사용했습니다.', solution: '두 오브젝트에 Collider2D를 넣고 움직이는 쪽에 Rigidbody2D를 추가한 뒤 OnTriggerEnter2D(Collider2D other)를 사용하세요.', code_fix: 'private void OnTriggerEnter2D(Collider2D other) {\n    if (other.CompareTag("Player")) { }\n}', helpful_count: 88 },
    { id: 'u18', engine: 'Unity (물리/UI/셰이더)', error_title: 'UI 버튼(Button)이 클릭되지 않는 현상 (UGUI 먹통)', cause: '씬에 EventSystem이 없거나 투명한 다른 UI 이미지/패널(Raycast Target 켜짐)이 버튼 위를 가리고 있습니다.', solution: 'Hierarchy에 EventSystem이 있는지 확인하고, 버튼을 가리는 배경/텍스트의 Raycast Target 체크를 해제하세요.', code_fix: '// 장식용 Image/Text의 Raycast Target 체크 해제', helpful_count: 73 },
    { id: 'u19', engine: 'Unity (물리/UI/셰이더)', error_title: '셰이더/머티리얼이 분홍색(Magenta / Pink)으로 깨지는 현상', cause: 'Built-in 에셋을 URP 프로젝트에 가져와 셰이더가 호환되지 않을 때 발생합니다.', solution: 'Window > Rendering > Render Pipeline Converter에서 Material Upgrade를 실행하면 1초 만에 복구됩니다.', code_fix: '// Window > Rendering > Render Pipeline Converter 실행', helpful_count: 79 },
    { id: 'u20', engine: 'Unity (물리/UI/셰이더)', error_title: '캐릭터 이동 시 카메라 떨림(Jitter) 또는 빠른 총알이 벽을 뚫는 현상(Tunneling)', cause: '카메라를 Update에서 이동시켰거나, 빠른 물체의 Rigidbody Collision Detection이 Discrete로 되어 있습니다.', solution: '카메라 추적은 LateUpdate()에 작성하고, 빠른 총알의 Rigidbody Collision Detection을 Continuous로 설정하세요.', code_fix: 'void LateUpdate() { transform.position = target.position + offset; }', helpful_count: 62 },
    { id: 'u35', engine: 'Unity (물리/UI/셰이더)', error_title: 'TextMeshPro(TMP)에서 한글이 네모(□□□) 또는 X표시로 깨져서 안 나오는 현상', cause: '기본 LiberationSans SDF 폰트 에셋에는 영문만 들어있고 한글 글리프가 포함되어 있지 않습니다.', solution: 'Window > TextMeshPro > Font Asset Creator에서 한글 폰트(.ttf)를 넣고 Dynamic 모드로 SDF 에셋을 생성해 연결하세요.', code_fix: '// Font Asset Creator -> Atlas Population Mode: Dynamic 설정', helpful_count: 86 },
    { id: 'u36', engine: 'Unity (물리/UI/셰이더)', error_title: '해상도나 스마트폰 화면 비율이 바뀔 때마다 UI 크기와 위치가 다 찌그러지는 현상', cause: 'Canvas의 Canvas Scaler가 Constant Pixel Size로 되어 있어 해상도 대응이 안 되고 있습니다.', solution: 'Canvas Scaler의 UI Scale Mode를 "Scale With Screen Size"로 바꾸고 Reference Resolution(예: 1920x1080), Match를 0.5로 설정하세요.', code_fix: '// Canvas Scaler -> Scale With Screen Size (Match 0.5)', helpful_count: 77 },
    { id: 'u37', engine: 'Unity (물리/UI/셰이더)', error_title: 'NavMeshAgent: "SetDestination" can only be called on an active agent that has been placed on a NavMesh', cause: '베이크(Bake)된 NavMesh 영역 밖에 몬스터가 스폰되었거나 NavMeshAgent가 초기화되기 전에 이동을 명령했습니다.', solution: 'Window > AI > Navigation에서 Bake 여부를 확인하고, 스폰 시 NavMeshAgent.Warp(spawnPos)로 위치를 고정하세요.', code_fix: 'agent.Warp(spawnPoint.position);\nagent.SetDestination(player.position);', helpful_count: 53 },
    { id: 'u38', engine: 'Unity (물리/UI/셰이더)', error_title: '2D 캐릭터가 타일맵(Tilemap) 바닥 위를 걸어갈 때 보이지 않는 턱에 걸려 멈추는 현상', cause: '개별 타일마다 사각 콜라이더가 생성되어 타일 경계면 모서리에 캐릭터 BoxCollider2D가 걸리는 현상입니다.', solution: 'Tilemap 오브젝트에 CompositeCollider2D를 추가하고 TilemapCollider2D에서 "Used By Composite"(Unity 6: Merge)를 체크하세요!', code_fix: '// TilemapCollider2D + CompositeCollider2D 조합 (Rigidbody2D는 Static)', helpful_count: 71 },

    // 4. Unity 2D / Animation / Audio
    { id: 'u39', engine: 'Unity (애니/사운드/2D)', error_title: '2D 도트(픽셀아트) 스프라이트가 선명하지 않고 뿌옇게 흐려지는 현상', cause: '스프라이트 기본 Filter Mode가 Bilinear(보간)로 되어 있고 Compression(압축)이 켜져 있기 때문입니다.', solution: '스프라이트 Inspector에서 Filter Mode를 "Point (no filter)"로, Compression을 "None"으로 변경 후 Apply를 누르세요!', code_fix: '// Sprite Import Settings: Filter Mode = Point (no filter), Compression = None', helpful_count: 91 },
    { id: 'u40', engine: 'Unity (애니/사운드/2D)', error_title: '2D 타일맵(Tilemap) 이동 시 타일 사이에 미세한 흰 줄/빈틈(Seam)이 깜빡이는 현상', cause: '카메라 이동 중 소수점 픽셀 샘플링 오차로 인접 타일 외곽의 투명 픽셀이 읽히는 현상입니다.', solution: '1) Project Settings > Quality에서 Anti Aliasing(MSAA)을 끄고 2) Sprite Atlas를 생성해 타일 스프라이트를 묶고 Padding을 주세요.', code_fix: '// Pixel Perfect Camera 부착 + Sprite Atlas 패킹 적용', helpful_count: 75 },
    { id: 'u41', engine: 'Unity (애니/사운드/2D)', error_title: 'Animator에서 공격/점프 애니메이션이 키를 눌러도 한 박자 늦게 전환되는 현상', cause: 'Animator 상태 전환 화살표(Transition)에 "Has Exit Time"이 체크되어 있어 이전 애니메이션이 끝날 때까지 기다리기 때문입니다.', solution: 'Transition 화살표를 클릭하고 Inspector에서 "Has Exit Time" 체크를 해제한 뒤 Transition Duration을 0으로 줄이세요.', code_fix: '// Animator Transition: Has Exit Time 체크 해제, Duration = 0', helpful_count: 84 },
    { id: 'u42', engine: 'Unity (애니/사운드/2D)', error_title: '효과음(AudioSource.Play)을 연속 재생할 때 앞 소리가 끊기거나 씹히는 현상', cause: 'AudioSource.Play()는 기존 재생 중이던 오디오를 멈추고 처음부터 다시 틀기 때문입니다.', solution: '총소리/타격음처럼 겹쳐서 나야 하는 효과음은 반드시 audioSource.PlayOneShot(clip)을 사용하세요!', code_fix: 'audioSource.PlayOneShot(hitSfxClip, 0.8f);', helpful_count: 68 },

    // 5. Unity Build / Mobile / WebGL / Data
    { id: 'u21', engine: 'Unity (빌드/배포)', error_title: 'Android IL2CPP / Gradle 빌드 실패 (NDK not found / CommandInvokationFailure / Duplicate class)', cause: '프로젝트 경로에 한글/공백이 포함되어 있거나 Android SDK/NDK 경로 및 플러그인 라이브러리가 충돌했습니다.', solution: '1) 프로젝트 폴더를 순수 영문 경로로 이동 2) External Tools에서 SDK/NDK 체크 리셋 3) Android Resolver > Force Resolve 실행', code_fix: '// 프로젝트 폴더명에 한글(바탕화면 등)이 없도록 영문 경로로 이동', helpful_count: 76 },
    { id: 'u22', engine: 'Unity (빌드/배포)', error_title: 'WebGL 빌드 후 90%에서 멈추거나 Decompression Fallback 에러 발생', cause: '웹 호스팅 서버가 Brotli/Gzip 압축 헤더를 지원하지 않을 때 발생합니다.', solution: 'Player Settings > Publishing Settings에서 Decompression Fallback을 체크하거나 Compression Format을 Disabled로 바꾸세요.', code_fix: '// Publishing Settings > Decompression Fallback 체크!', helpful_count: 67 },
    { id: 'u43', engine: 'Unity (빌드/배포)', error_title: '에디터에서는 잘 되던 게임이 PC/모바일 빌드(Build)만 하면 씬 전환이나 데이터 로드가 안 되는 현상', cause: 'Build Settings의 Scenes In Build 목록에 이동할 씬이 등록되지 않았거나, 에디터 전용 경로(AssetDatabase / Application.dataPath)를 사용했습니다.', solution: '1) File > Build Settings에 모든 씬을 추가하세요. 2) 세이브 파일 경로는 반드시 Application.persistentDataPath를 사용하세요.', code_fix: 'string path = Path.Combine(Application.persistentDataPath, "save.json");', helpful_count: 72 },
    { id: 'u44', engine: 'Unity (빌드/배포)', error_title: '스크립트에 "using UnityEditor;"가 포함되어 있어 빌드가 실패하는 에러 (CS0234 in Player Build)', cause: 'UnityEditor 네임스페이스는 에디터 전용이라 실제 빌드(PC/Android/WebGL) 시에는 존재하지 않아 컴파일 에러가 납니다.', solution: '해당 스크립트를 Editor 폴더 안으로 옮기거나, #if UNITY_EDITOR ... #endif 전처리기로 감싸주세요.', code_fix: '#if UNITY_EDITOR\nusing UnityEditor;\n#endif', helpful_count: 81 },
    { id: 'u45', engine: 'Unity (빌드/배포)', error_title: 'JsonUtility.ToJson / FromJson 사용 시 데이터가 빈 값({})으로 저장되거나 리스트 직렬화가 안 되는 현상', cause: '데이터 클래스 위에 [System.Serializable] 어트리뷰트가 없거나, 변수가 private / 프로퍼티({get; set;})로 선언되어 있습니다.', solution: '클래스 상단에 [System.Serializable]을 붙이고 저장할 변수는 일반 public 필드로 선언하세요.', code_fix: '[System.Serializable]\npublic class SaveData { public int gold; public List<string> items; }', helpful_count: 65 },
    { id: 'u46', engine: 'Unity (빌드/배포)', error_title: 'Google Play 콘솔 업로드 시 Target API Level 34+ 또는 64-bit(ARM64) 미지원 거절 에러', cause: '구글 플레이 스토어 정책상 최신 API 레벨과 IL2CPP ARM64 아키텍처가 필수입니다.', solution: 'Player Settings > Android > Other Settings에서 Scripting Backend를 IL2CPP로 바꾸고 ARM64 체크 및 Target API Level을 34 이상으로 올리세요.', code_fix: '// Scripting Backend: IL2CPP + Target Architectures: ARM64 체크', helpful_count: 60 },

    // 6. Unreal Engine 5 & Godot 4
    { id: 'u23', engine: 'Unreal / Godot', error_title: 'Unreal ExitCode=25 (Unknown Cook Failure) 패키징 빌드 실패', cause: '삭제/이동된 에셋의 깨진 Redirector 참조가 남아있거나 블루프린트 컴파일 에러가 있는 상태로 패키징했습니다.', solution: 'Content 폴더 우클릭 > Fix Up Redirectors 실행 후 Saved/Intermediate 폴더를 지우고 다시 패키징하세요.', code_fix: '// Content Browser -> Content 우클릭 -> Fix Up Redirectors', helpful_count: 58 },
    { id: 'u47', engine: 'Unreal / Godot', error_title: 'Unreal Blueprint Runtime Error: "Accessed None trying to read property ..."', cause: '유니티의 NullReferenceException과 동일한 에러로, 유효하지 않은(비어 있는) 오브젝트 참조 변수를 블루프린트에서 읽었습니다.', solution: '변수 사용 전 "Is Valid" 노드를 연결해 유효할 때만 실행되도록 방어하거나 BeginPlay 초기화 순서를 확인하세요.', code_fix: '// Blueprint: [Is Valid ?] 노드로 Null 체크 후 실행 핀 연결', helpful_count: 64 },
    { id: 'u48', engine: 'Unreal / Godot', error_title: 'Unreal C++ Live Coding 컴파일 후 에디터를 껐다 켜면 추가한 컴포넌트/변수가 사라지는 현상', cause: 'Live Coding(Ctrl+Alt+F11)은 임시 메모리 패치만 수행하므로 에디터 종료 후 재실행 시 바이너리가 초기화됩니다.', solution: '헤더(.h)나 UPROPERTY 수정 시에는 에디터를 끄고 Visual Studio / Rider에서 직접 Build(Ctrl+Shift+B)하세요.', code_fix: '// .h 헤더 수정 시 IDE에서 직접 Build 솔루션 실행 권장', helpful_count: 52 },
    { id: 'u49', engine: 'Unreal / Godot', error_title: 'Godot 4: "Invalid get index \'...\' (on base: \'Nil\')" 또는 Node not found 에러', cause: '_ready()가 호출되기 전에 자식 노드를 참조했거나 노드 경로($Sprite2D) 이름이 변경되었습니다.', solution: '변수 앞에 @onready 어노테이션을 붙이고 씬 트리의 실제 노드 이름과 경로가 일치하는지 확인하세요.', code_fix: '@onready var sprite: Sprite2D = $Sprite2D', helpful_count: 61 },
    { id: 'u50', engine: 'Unreal / Godot', error_title: 'Godot 4: CharacterBody2D "move_and_slide()"에 인자를 넣으면 발생하는 에러 (Too many arguments)', cause: 'Godot 3에서는 move_and_slide(velocity)였으나 Godot 4부터는 내장 velocity 속성을 사용하고 인자를 받지 않습니다.', solution: 'velocity = direction * speed 대입 후 인자 없이 move_and_slide()만 호출하세요.', code_fix: 'velocity = input_dir * SPEED\nmove_and_slide()', helpful_count: 59 }
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
        matchedItem = allPool.find((item) => {
          const haystack = (item.error_title + ' ' + item.cause + ' ' + item.solution).toLowerCase();
          if (lower.includes('nullreference') && haystack.includes('nullreference')) return true;
          if (lower.includes('missingreference') && haystack.includes('missingreference')) return true;
          if (lower.includes('unassignedreference') && haystack.includes('unassignedreference')) return true;
          if ((lower.includes('indexoutofrange') || lower.includes('argumentoutofrange') || lower.includes('배열')) && haystack.includes('indexoutofrange')) return true;
          if ((lower.includes('input') || lower.includes('키입력')) && haystack.includes('input system')) return true;
          if ((lower.includes('collection was modified') || lower.includes('foreach')) && haystack.includes('collection was modified')) return true;
          if ((lower.includes('inactive') || lower.includes('코루틴')) && haystack.includes('inactive')) return true;
          if ((lower.includes('dontdestroy') || lower.includes('중복')) && haystack.includes('dontdestroyonload')) return true;
          if ((lower.includes('timescale') || lower.includes('일시정지')) && haystack.includes('timescale')) return true;
          if ((lower.includes('pink') || lower.includes('magenta') || lower.includes('분홍')) && haystack.includes('magenta')) return true;
          if ((lower.includes('trigger') || lower.includes('collision') || lower.includes('충돌')) && haystack.includes('ontriggerenter2d')) return true;
          if ((lower.includes('button') || lower.includes('버튼') || lower.includes('클릭')) && haystack.includes('raycast target')) return true;
          if ((lower.includes('한글') || lower.includes('네모') || lower.includes('tmp')) && haystack.includes('textmeshpro')) return true;
          if ((lower.includes('타일맵') || lower.includes('tilemap') || lower.includes('흰 줄') || lower.includes('줄')) && haystack.includes('tilemap')) return true;
          if ((lower.includes('흐릿') || lower.includes('도트') || lower.includes('픽셀')) && haystack.includes('point (no filter)')) return true;
          if ((lower.includes('unityeditor') || lower.includes('cs0234')) && haystack.includes('unityeditor')) return true;
          if ((lower.includes('json') || lower.includes('저장')) && haystack.includes('jsonutility')) return true;
          if ((lower.includes('il2cpp') || lower.includes('gradle') || lower.includes('ndk')) && haystack.includes('il2cpp')) return true;
          if ((lower.includes('webgl') || lower.includes('90%')) && haystack.includes('webgl')) return true;
          if ((lower.includes('accessed none') || lower.includes('언리얼')) && haystack.includes('accessed none')) return true;
          if ((lower.includes('godot') || lower.includes('move_and_slide') || lower.includes('nil')) && haystack.includes('godot')) return true;
          return false;
        });
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
  const [pixelStudioOpen, setPixelStudioOpen] = useState(false);
  const [bgmStudioOpen, setBgmStudioOpen] = useState(false);
  const [steamSimOpen, setSteamSimOpen] = useState(false);
  const [simTitle, setSimTitle] = useState('DUNGEON VENDING: 던전 자판기 타이쿤');
  const [simDesc, setSimDesc] = useState('용사들에게 포션과 전설 무기를 파는 2D 도트 로그라이크 상점 시뮬레이션');
  const [simPrice, setSimPrice] = useState('₩12,500 (-15%)');
  const [simTags, setSimTags] = useState('로그라이크, 픽셀 그래픽, 타이쿤, 인디');
  const [simThumb, setSimThumb] = useState('');
  const [simChecks, setSimChecks] = useState<string[]>(['c1', 'c2', 'c4', 'c6']);

  const [optDoctorOpen, setOptDoctorOpen] = useState(false);
  const [optTab, setOptTab] = useState<'checklist' | 'hotkeys'>('checklist');
  const [optChecks, setOptChecks] = useState<string[]>(['o1', 'o3']);
  const [hotkeyEngine, setHotkeyEngine] = useState<'Unity' | 'Unreal' | 'Godot'>('Unity');

  const [balanceCalcOpen, setBalanceCalcOpen] = useState(false);
  const [balTab, setBalTab] = useState<'damage' | 'exp' | 'drop'>('damage');
  const [balAtk, setBalAtk] = useState('120');
  const [balDef, setBalDef] = useState('45');
  const [balCritPct, setBalCritPct] = useState('25');
  const [balExpBase, setBalExpBase] = useState('100');
  const [balExpFactor, setBalExpFactor] = useState('1.45');
  const [balDropRate, setBalDropRate] = useState('1.5');
  const [balDropTries, setBalDropTries] = useState('50');
  const [balCopied, setBalCopied] = useState(false);

  const [patchBuilderOpen, setPatchBuilderOpen] = useState(false);
  const [patchVer, setPatchVer] = useState('v0.3.0 Early Access');
  const [patchNew, setPatchNew] = useState('신규 보스 스테이지 및 전설 등급 무기 3종 추가\n8비트 칩튠 보스전 브금(BGM) 적용');
  const [patchBal, setPatchBal] = useState('플레이어 기본 대시 쿨타임 1.5초 -> 1.1초로 단축\n초반 슬라임 몬스터 체력 15% 하향');
  const [patchFix, setPatchFix] = useState('타일맵 모서리에 캐릭터가 간헐적으로 끼이던 현상 수정\n일시정지 해제 시 효과음이 두 번 재생되던 버그 수정');
  const [patchFormat, setPatchFormat] = useState<'markdown' | 'steam'>('markdown');
  const [patchCopied, setPatchCopied] = useState(false);

  const [dungeonGenOpen, setDungeonGenOpen] = useState(false);
  const [shaderBookOpen, setShaderBookOpen] = useState(false);
  const [selectedShaderKey, setSelectedShaderKey] = useState<string>('hitflash');
  const [shaderCopied, setShaderCopied] = useState(false);

  const [locToolOpen, setLocToolOpen] = useState(false);
  const [locInput, setLocInput] = useState('UI_START=게임 시작\nUI_CONTINUE=이어하기\nUI_SETTINGS=환경설정\nUI_EXIT=게임 종료\nMSG_CRITICAL=치명타 피해!\nMSG_LEVELUP=레벨 업! 새로운 스킬을 선택하세요.\nMSG_GAMEOVER=전투 불능! 다시 도전하시겠습니까?\nITEM_POTION=체력 회복 물약');
  const [locFormat, setLocFormat] = useState<'csv' | 'json'>('csv');
  const [locCopied, setLocCopied] = useState(false);

  const [paletteDexOpen, setPaletteDexOpen] = useState(false);
  const [selectedPaletteIdx, setSelectedPaletteIdx] = useState(0);
  const [copiedColorMsg, setCopiedColorMsg] = useState('');

  const [csharpVendingOpen, setCsharpVendingOpen] = useState(false);
  const [selectedScriptKey, setSelectedScriptKey] = useState<string>('platformer2d');
  const [scriptSpeed, setScriptSpeed] = useState<string>('8');
  const [scriptJump, setScriptJump] = useState<string>('14');
  const [scriptCopied, setScriptCopied] = useState<boolean>(false);
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
      {/* Top Indie Workshop Console Bar */}
      <View style={{ backgroundColor: Theme.colors.surface, borderWidth: 2, borderColor: Theme.colors.border, borderRadius: 6, padding: 12, marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{ backgroundColor: Theme.colors.primary, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 3 }}>
                <Text style={{ color: '#FFF', fontSize: 9.5, fontWeight: '900', fontFamily: 'monospace' }}>INDIE_HUB</Text>
              </View>
              <Text style={{ fontSize: 10.5, fontWeight: '800', color: '#00E5FF', fontFamily: 'monospace' }}>
                ONLINE: {visitStats.today} // TOTAL: {visitStats.total}
              </Text>
            </View>
            <Text numberOfLines={1} style={{ fontSize: 20, fontWeight: '900', color: Theme.colors.text, fontFamily: 'monospace', marginTop: 4, letterSpacing: 0.5 }}>
              DEVGROUND // 도트·인디공방_
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            {username ? (
              <TouchableOpacity
                style={{ backgroundColor: Theme.colors.pillBg, borderWidth: 1.5, borderColor: Theme.colors.border, paddingHorizontal: 8, paddingVertical: 6, borderRadius: 4 }}
                onPress={handleOpenNotifications}
              >
                <Text style={{ color: Theme.colors.text, fontWeight: '900', fontSize: 11, fontFamily: 'monospace' }}>
                  ALRT{unreadCount > 0 ? `(${unreadCount})` : ''}
                </Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              style={{ backgroundColor: Theme.colors.pillBg, borderWidth: 1.5, borderColor: Theme.colors.border, paddingHorizontal: 8, paddingVertical: 6, borderRadius: 4 }}
              onPress={handleToggleTheme}
            >
              <Text style={{ color: Theme.colors.text, fontWeight: '900', fontSize: 11, fontFamily: 'monospace' }}>
                {Theme.isDark ? 'LIGHT' : 'DARK'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ backgroundColor: copied ? '#10B981' : Theme.colors.pillBg, borderWidth: 1.5, borderColor: Theme.colors.border, paddingHorizontal: 8, paddingVertical: 6, borderRadius: 4 }}
              onPress={handleShare}
            >
              <Text style={{ color: copied ? '#FFF' : Theme.colors.text, fontWeight: '900', fontSize: 11, fontFamily: 'monospace' }}>
                {copied ? 'COPIED' : 'SHARE'}
              </Text>
            </TouchableOpacity>
            {onAuthClick && (
              <TouchableOpacity
                style={{
                  backgroundColor: username ? Theme.colors.pillBg : Theme.colors.primary,
                  borderWidth: 1.5,
                  borderColor: Theme.colors.border,
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 4,
                }}
                onPress={onAuthClick}
              >
                <Text numberOfLines={1} style={{ color: username ? Theme.colors.text : '#FFFFFF', fontWeight: '900', fontSize: 11, fontFamily: 'monospace' }}>
                  {username ? `@${username.slice(0, 7)}` : 'LOGIN'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* 3-Mode Console Switcher (Replaces stacked banners!) */}
        <View style={{ flexDirection: 'row', gap: 6 }}>
          <TouchableOpacity
            onPress={() => setActiveSection('feed')}
            style={{
              flex: 1,
              backgroundColor: activeSection === 'feed' ? Theme.colors.primary : Theme.colors.pillBg,
              borderWidth: 1.5,
              borderColor: activeSection === 'feed' ? Theme.colors.primary : Theme.colors.border,
              paddingVertical: 8,
              borderRadius: 4,
              alignItems: 'center',
            }}
          >
            <Text numberOfLines={1} style={{ fontSize: 11.5, fontWeight: '900', fontFamily: 'monospace', color: activeSection === 'feed' ? '#FFF' : Theme.colors.text }}>
              [01] 개발일지
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveSection('showcase')}
            style={{
              flex: 1,
              backgroundColor: activeSection === 'showcase' ? '#00E5FF' : Theme.colors.pillBg,
              borderWidth: 1.5,
              borderColor: activeSection === 'showcase' ? '#00E5FF' : Theme.colors.border,
              paddingVertical: 8,
              borderRadius: 4,
              alignItems: 'center',
            }}
          >
            <Text numberOfLines={1} style={{ fontSize: 11.5, fontWeight: '900', fontFamily: 'monospace', color: activeSection === 'showcase' ? '#11131C' : Theme.colors.text }}>
              [02] 웹데모·홍보관
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveSection('tools')}
            style={{
              flex: 1,
              backgroundColor: activeSection === 'tools' ? '#FFD166' : Theme.colors.pillBg,
              borderWidth: 1.5,
              borderColor: activeSection === 'tools' ? '#FFD166' : Theme.colors.border,
              paddingVertical: 8,
              borderRadius: 4,
              alignItems: 'center',
            }}
          >
            <Text numberOfLines={1} style={{ fontSize: 11.5, fontWeight: '900', fontFamily: 'monospace', color: activeSection === 'tools' ? '#11131C' : Theme.colors.text }}>
              [03] 에러사전·오락실
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* SECTION 01: DEVLOGS FEED CONTROLS */}
      {activeSection === 'feed' && (
        <>
          {/* Weekly Indie Game Jam & Dot Challenge Banner */}
          <View
            style={{
              backgroundColor: Theme.colors.surface,
              borderWidth: 2,
              borderColor: '#FFD166',
              borderRadius: 6,
              padding: 11,
              marginBottom: 10,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 8,
            }}
          >
            <View style={{ flex: 1, minWidth: 200 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                <View style={{ backgroundColor: '#FFD166', paddingHorizontal: 6, paddingVertical: 1.5, borderRadius: 3 }}>
                  <Text style={{ fontSize: 10, fontWeight: '900', color: '#11131C', fontFamily: 'monospace' }}>
                    🏆 WEEKLY_JAM // D-{7 - (new Date().getDay() || 7) + 1}
                  </Text>
                </View>
                <Text style={{ fontSize: 11, fontWeight: '800', color: '#00E5FF', fontFamily: 'monospace' }}>
                  주간 도트 & 프로토타입 챌린지
                </Text>
              </View>
              <Text style={{ fontSize: 13, fontWeight: '900', color: Theme.colors.text }}>
                이번 주 주제: 「던전 속 수상한 자판기」 (#게임잼 태그로 출품!)
              </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <TouchableOpacity
                onPress={() => setSelectedTag(selectedTag === '게임잼' ? null : '게임잼')}
                style={{
                  backgroundColor: selectedTag === '게임잼' ? Theme.colors.primary : Theme.colors.pillBg,
                  borderWidth: 1.5,
                  borderColor: selectedTag === '게임잼' ? Theme.colors.primary : '#FFD166',
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 4,
                }}
              >
                <Text style={{ fontSize: 11, fontWeight: '900', color: selectedTag === '게임잼' ? '#FFF' : '#FFD166', fontFamily: 'monospace' }}>
                  {selectedTag === '게임잼' ? '[전체 글 보기]' : '[🔍 출품작 보기]'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <NeumorphView radius={6} style={styles.searchBox}>
            <TextInput
              style={[styles.searchInput, { fontFamily: 'monospace' }]}
              placeholder="> SEARCH_LOGS (키워드, 엔진, 태그 입력...)"
              placeholderTextColor={Theme.colors.textLight}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </NeumorphView>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginBottom: 10 }}>
            {[
              { label: 'ALL_LOGS', tag: null },
              { label: '🏆 GAME_JAM', tag: '게임잼' },
              { label: 'UNITY', tag: 'Unity' },
              { label: 'UNREAL', tag: 'Unreal' },
              { label: 'GODOT', tag: 'Godot' },
              { label: 'SHOWCASE', tag: '쇼케이스' },
              { label: 'WEB_DEMO', tag: '데모버전' },
              { label: 'RECRUIT', tag: '팀원모집' },
            ].map((item) => {
              const active = selectedTag === item.tag;
              return (
                <TouchableOpacity
                  key={item.label}
                  onPress={() => setSelectedTag(active ? null : item.tag)}
                  style={{
                    backgroundColor: active ? Theme.colors.primary : Theme.colors.surface,
                    borderWidth: 1.5,
                    borderColor: active ? Theme.colors.primary : Theme.colors.border,
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderRadius: 4,
                  }}
                >
                  <Text style={{ fontSize: 11, fontWeight: '900', fontFamily: 'monospace', color: active ? '#FFF' : Theme.colors.text }}>
                    #{item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={styles.sortRow}>
            <TouchableOpacity
              style={[styles.sortButton, sortBy === 'latest' && styles.activeSortButton]}
              onPress={() => setSortBy('latest')}
            >
              <Text style={[styles.sortButtonText, sortBy === 'latest' && styles.activeSortButtonText]}>[LATEST // 최신]</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sortButton, sortBy === 'popular' && styles.activeSortButton]}
              onPress={() => setSortBy('popular')}
            >
              <Text style={[styles.sortButtonText, sortBy === 'popular' && styles.activeSortButtonText]}>[HOT // 인기]</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sortButton, sortBy === 'bookmarked' && styles.activeSortButton]}
              onPress={() => setSortBy('bookmarked')}
            >
              <Text style={[styles.sortButtonText, sortBy === 'bookmarked' && styles.activeSortButtonText]}>
                [SAVED ({bookmarkedIds.length})]
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* SECTION 02: INDIE GAME SHOWCASE & LIVE TERMINAL */}
      {activeSection === 'showcase' && (
        <View style={{ marginBottom: 14 }}>
          <View style={{ backgroundColor: Theme.colors.surface, borderWidth: 2, borderColor: Theme.colors.border, borderRadius: 6, padding: 14, marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
              <View>
                <Text style={{ fontSize: 15, fontWeight: '900', color: '#00E5FF', fontFamily: 'monospace' }}>
                  // INDIE_GAME_SHOWCASE_ARCADE
                </Text>
                <Text style={{ fontSize: 12, color: Theme.colors.textLight, marginTop: 2 }}>
                  개발 중인 인디게임 홈페이지·스팀·Itch.io 웹데모를 등록하고 사이트 안에서 바로 실행해보세요.
                </Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <TouchableOpacity
                  onPress={handleCopyFeaturedBadge}
                  style={{ backgroundColor: Theme.colors.pillBg, borderWidth: 1.5, borderColor: Theme.colors.border, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 4 }}
                >
                  <Text style={{ color: Theme.colors.text, fontSize: 11, fontWeight: '900', fontFamily: 'monospace' }}>
                    {badgeCopied ? '[COPIED!]' : '[COPY_BADGE]'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setShowcaseModalOpen(true)}
                  style={{ backgroundColor: Theme.colors.primary, borderWidth: 1.5, borderColor: Theme.colors.border, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 4 }}
                >
                  <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '900', fontFamily: 'monospace' }}>
                    [+ REGISTER_GAME]
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {showcases.map((game: any) => (
              <View
                key={game.id}
                style={{
                  backgroundColor: Theme.colors.background,
                  borderWidth: 1.5,
                  borderColor: Theme.colors.border,
                  borderRadius: 6,
                  padding: 12,
                  marginBottom: 10,
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <Text style={{ fontSize: 11, fontWeight: '900', color: '#FFD166', fontFamily: 'monospace' }}>
                    [{game.engine}] // BY @{game.developer}
                  </Text>
                  <Text style={{ fontSize: 11, color: Theme.colors.textLight, fontFamily: 'monospace' }}>
                    PLAYS: {game.plays || 0}
                  </Text>
                </View>
                <Text style={{ fontSize: 15, fontWeight: '800', color: Theme.colors.text, marginBottom: 4 }}>
                  {game.title}
                </Text>
                <Text style={{ fontSize: 12, color: Theme.colors.textLight, marginBottom: 10 }}>
                  {game.description || '인디게임 공식 홈페이지 및 웹데모 쇼케이스'}
                </Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity
                    onPress={async () => {
                      try {
                        const r = await ApiClient.visitShowcase(game.id);
                        setShowcases((prev) => prev.map((x) => (x.id === game.id ? { ...x, plays: r.plays } : x)));
                      } catch {}
                      setPreviewGame(game);
                    }}
                    style={{ flex: 1, backgroundColor: '#00E5FF', paddingVertical: 8, borderRadius: 4, alignItems: 'center' }}
                  >
                    <Text style={{ color: '#11131C', fontSize: 11.5, fontWeight: '900', fontFamily: 'monospace' }}>
                      [▶ LAUNCH_IN_APP // 바로실행]
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => Linking.openURL(game.homepage_url).catch(() => {})}
                    style={{ backgroundColor: Theme.colors.pillBg, borderWidth: 1.5, borderColor: Theme.colors.border, paddingHorizontal: 12, justifyContent: 'center', borderRadius: 4 }}
                  >
                    <Text style={{ color: Theme.colors.text, fontSize: 11, fontWeight: '900', fontFamily: 'monospace' }}>[↗ WEB]</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>

          {/* Live Developer Terminal Shoutbox */}
          <View style={{ backgroundColor: Theme.colors.surface, borderWidth: 2, borderColor: Theme.colors.border, borderRadius: 6, padding: 14 }}>
            <Text style={{ fontSize: 13, fontWeight: '900', color: '#FFD166', fontFamily: 'monospace', marginBottom: 8 }}>
              {'> LIVE_DEV_TERMINAL // 한줄 개발 현황 로그'}
            </Text>
            {shouts.slice(0, 4).map((s: any) => (
              <Text key={s.id} numberOfLines={1} style={{ fontSize: 12, color: Theme.colors.text, fontFamily: 'monospace', marginBottom: 4 }}>
                <Text style={{ fontWeight: '900', color: '#00E5FF' }}>@{s.nickname}: </Text>
                {s.message}
              </Text>
            ))}
            <View style={{ flexDirection: 'row', gap: 6, marginTop: 8 }}>
              <TextInput
                style={{ flex: 1, backgroundColor: Theme.colors.background, borderWidth: 1.5, borderColor: Theme.colors.border, borderRadius: 4, paddingHorizontal: 10, paddingVertical: 6, fontSize: 12, color: Theme.colors.text, fontFamily: 'monospace' }}
                placeholder="> 오늘의 개발 진척도 입력..."
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
                    const list = await ApiClient.postShoutbox(username || 'INDIE_DEV', shoutText.trim());
                    if (list.length > 0) setShouts(list);
                    setShoutText('');
                  } catch {} finally {
                    setSendingShout(false);
                  }
                }}
                style={{ backgroundColor: Theme.colors.primary, paddingHorizontal: 14, justifyContent: 'center', borderRadius: 4 }}
              >
                <Text style={{ color: '#FFF', fontSize: 11.5, fontWeight: '900', fontFamily: 'monospace' }}>SEND</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* SECTION 03: INDIE DEV LAB & TOOLS CARTRIDGE GRID */}
      {activeSection === 'tools' && (
        <View style={{ marginBottom: 14, gap: 10 }}>
          {[
            {
              code: 'MOD_01 // PIXEL_SPRITE_WORKSHOP',
              title: '16×16 · 32×32 웹 도트 찍기 스튜디오 (투명 PNG 저장)',
              desc: '브라우저에서 좌우대칭·채우기·Pico-8 팔레트로 도트 캐릭터/아이콘을 찍고 투명 배경 .PNG로 즉시 추출합니다.',
              accent: '#FFD166',
              onPress: () => setPixelStudioOpen(true)
            },
            {
              code: 'MOD_02 // CSHARP_SCRIPT_VENDING',
              title: 'Unity / C# 필수 스크립트 자판기 (이동·점프·세이브·풀링)',
              desc: '이동속도·점프력 수치만 입력하면 2D 플랫포머, 3D 카메라, 오브젝트 풀링, JSON 세이브 C# 코드를 자동 생성합니다.',
              accent: '#10B981',
              onPress: () => setCsharpVendingOpen(true)
            },
            {
              code: 'MOD_03 // ERR_DOCTOR',
              title: 'Unity · Unreal · Godot 만능 에러 해결 센터',
              desc: '콘솔 에러 로그를 붙여넣으면 발생 줄 번호·한글 번역·수정 코드를 1초 만에 진단합니다. (23종 필수 에러 수록)',
              accent: '#FF4D6D',
              onPress: handleOpenErrorWiki
            },
            {
              code: 'MOD_04 // 8BIT_SFX_SYNTH',
              title: '8-Bit 레트로 효과음(SFX) 합성 스튜디오',
              desc: '점프·레이저·폭발·코인 효과음을 파형으로 조절하고 상업용 무료 .WAV 오디오 파일로 즉시 추출합니다.',
              accent: '#00E5FF',
              onPress: () => setSfxStudioOpen(true)
            },
            {
              code: 'MOD_05 // 8BIT_BGM_SEQUENCER',
              title: '8-Bit 칩튠 브금(BGM) 작곡 시퀀서 & 루프 .WAV 추출',
              desc: '보스전·평화로운 마을·아케이드 프리셋 또는 16스텝 피아노롤로 저작권 무료 배경음악(BGM)을 작곡합니다.',
              accent: '#14B8A6',
              onPress: () => setBgmStudioOpen(true)
            },
            {
              code: 'MOD_06 // STEAM_STORE_SIM',
              title: '스팀·스토어 캡슐 썸네일 시뮬레이터 & 출시 준비 진단기',
              desc: '내 인디게임 배너와 제목이 실제 스토어 진열대에서 얼마나 눈에 띄는지 비교하고 출시 체크리스트 점수를 진단합니다.',
              accent: '#6366F1',
              onPress: () => setSteamSimOpen(true)
            },
            {
              code: 'MOD_07 // 60FPS_OPT_DOCTOR',
              title: 'Unity·Godot 60FPS 최적화 방어 진단기 & 엔진 단축키 사전',
              desc: 'Draw Call·GC Alloc·배칭·물리 렉 원인을 체크리스트로 점검하고 3대 게임 엔진 필수 단축키를 확인합니다.',
              accent: '#F59E0B',
              onPress: () => setOptDoctorOpen(true)
            },
            {
              code: 'MOD_08 // GAME_BALANCE_CALC',
              title: '인디게임 밸런스 계산기 (데미지·경험치 곡선·가챠/드랍 확률)',
              desc: '공격/방어 공식 비교, 레벨별 요구 경험치 테이블, 아이템 드랍 천장 확률을 시뮬레이션하고 C# 수식 코드로 변환합니다.',
              accent: '#EC4899',
              onPress: () => setBalanceCalcOpen(true)
            },
            {
              code: 'MOD_09 // PATCHNOTE_BUILDER',
              title: '스팀(BBCode) · 디스코드 · 개발일지 패치노트 자동 생성기',
              desc: '신규 기능·밸런스 조정·버그 수정 내역만 적으면 스팀 공지사항 태그([h1], [list])와 마크다운 양식으로 1초 변환합니다.',
              accent: '#22C55E',
              onPress: () => setPatchBuilderOpen(true)
            },
            {
              code: 'MOD_10 // DUNGEON_MAP_GEN',
              title: '2D 타일맵 · 절차적 던전 맵 생성기 & Unity C# 배열 추출기',
              desc: '로그라이크 방+복도(BSP), 자연동굴(Cellular), 보스 아레나를 랜덤 생성하고 미니맵 .PNG와 C# int[,] 배열로 추출합니다.',
              accent: '#A855F7',
              onPress: () => setDungeonGenOpen(true)
            },
            {
              code: 'MOD_11 // SHADER_RECIPE_BOOK',
              title: 'Unity / Godot 셰이더(Shader) 시각 효과 레시피 사전',
              desc: '피격 하얀 점멸(Hit Flash), 2D 도트 외곽선(Outline), 타들어가는 디졸브, 홀로그램, 물결 셰이더 코드를 복사합니다.',
              accent: '#06B6D4',
              onPress: () => setShaderBookOpen(true)
            },
            {
              code: 'MOD_12 // LOCALIZATION_SHEET',
              title: '인디게임 다국어 번역 시트 생성기 (한·영·일·중 CSV/JSON)',
              desc: '자주 쓰는 게임 UI/전투/상점 문구를 한국어로 입력하면 영어·일본어·중국어(간체) 로컬라이징 테이블로 즉시 변환합니다.',
              accent: '#10B981',
              onPress: () => setLocToolOpen(true)
            },
            {
              code: 'MOD_13 // PALETTE_DEX',
              title: '레트로 명작 & 인디 도트 컬러 팔레트 도감 (Hex & C# Color)',
              desc: 'PICO-8, Sweetie-16, GameBoy DMG, 사이버펑크, 다크 판타지 팔레트를 클릭해 Hex 코드와 Unity Color 구조체를 복사합니다.',
              accent: '#F43F5E',
              onPress: () => setPaletteDexOpen(true)
            },
            {
              code: 'MOD_14 // ARCADE_CABINET',
              title: '내장 미니오락실: Bug Slayer & 실시간 랭킹',
              desc: '인디 개발자 버그 피하기 HTML5 미니게임을 플레이하고 TOP 10 명예의 전당에 이름을 올리세요.',
              accent: '#38BDF8',
              onPress: handleOpenArcade
            },
            {
              code: 'MOD_15 // PARTY_RECRUIT',
              title: '인디 게임 팀원 모집 & 협업 보드',
              desc: '프로그래머 · 2D 도트 아티스트 · 3D 모델러 · 사운드 디자이너 팀원을 구하고 오픈채팅/디스코드로 연결합니다.',
              accent: '#F97316',
              onPress: handleOpenTeamBoard
            },
            {
              code: 'MOD_12 // IDEA_SLOT_MACHINE',
              title: '게임잼 & 신작 아이디어 랜덤 조합기',
              desc: '독창적인 [장르 + 핵심 기믹 + 세계관 + 제약 조건]을 무작위로 뽑아 신작 기획안을 완성합니다.',
              accent: '#A855F7',
              onPress: () => setIdeaMachineOpen(true)
            },
            {
              code: 'MOD_13 // HALL_OF_FAME & APP',
              title: '크리에이터 랭킹 & 모바일·PC 앱 설치 (QR)',
              desc: '명예의 전당 개발자 순위를 확인하거나 스마트폰/PC 바탕화면에 전용 앱으로 설치합니다.',
              accent: '#06B6D4',
              onPress: handleInstallAppClick
            }
          ].map((mod) => (
            <TouchableOpacity
              key={mod.code}
              activeOpacity={0.85}
              onPress={mod.onPress}
              style={{
                backgroundColor: Theme.colors.surface,
                borderWidth: 2,
                borderColor: Theme.colors.border,
                borderLeftWidth: 6,
                borderLeftColor: mod.accent,
                borderRadius: 6,
                padding: 14,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <Text style={{ fontSize: 10.5, fontWeight: '900', color: mod.accent, fontFamily: 'monospace' }}>
                  [{mod.code}]
                </Text>
                <Text style={{ fontSize: 11, fontWeight: '900', color: Theme.colors.textLight, fontFamily: 'monospace' }}>
                  [LAUNCH →]
                </Text>
              </View>
              <Text style={{ fontSize: 15, fontWeight: '800', color: Theme.colors.text, marginBottom: 4 }}>
                {mod.title}
              </Text>
              <Text style={{ fontSize: 12, color: Theme.colors.textLight, lineHeight: 17 }}>
                {mod.desc}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
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
        data={activeSection === 'feed' ? sortedLogs : []}
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
        ListEmptyComponent={activeSection !== 'feed' ? null : 
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
        <View style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.85)', justifyContent: 'center', alignItems: 'center', padding: 14 }}>
          <View style={{ width: '100%', maxWidth: 860, height: '88%', backgroundColor: '#11131C', borderRadius: 6, overflow: 'hidden', borderWidth: 2, borderColor: '#00E5FF' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 11, backgroundColor: '#1A1D2B', borderBottomWidth: 2, borderBottomColor: '#3A415E' }}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text numberOfLines={1} style={{ color: '#FFD166', fontSize: 14.5, fontWeight: '900', fontFamily: 'monospace' }}>
                  🕹️ {previewGame?.title} ({previewGame?.engine})
                </Text>
                <Text numberOfLines={1} style={{ color: '#9CA3AF', fontSize: 11, fontFamily: 'monospace', marginTop: 2 }}>
                  인터랙티브 웹 데모 플레이어 실행 중 (방향키 / 마우스 클릭 / 터치 조작 지원)
                </Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                <TouchableOpacity
                  onPress={() => previewGame?.homepage_url && Linking.openURL(previewGame.homepage_url)}
                  style={{ backgroundColor: '#00E5FF', paddingHorizontal: 11, paddingVertical: 6, borderRadius: 4 }}
                >
                  <Text style={{ color: '#11131C', fontSize: 11.5, fontWeight: '900', fontFamily: 'monospace' }}>[🌐 원본 사이트 새 탭 ↗]</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setPreviewGame(null)}
                  style={{ backgroundColor: '#FF4D6D', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 4 }}
                >
                  <Text style={{ color: '#FFF', fontSize: 11.5, fontWeight: '900', fontFamily: 'monospace' }}>[X 닫기]</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={{ flex: 1, backgroundColor: '#0D0F17' }}>
              {Platform.OS === 'web' && previewGame
                ? (() => {
                    const rawUrl = String(previewGame.homepage_url || '');
                    const titleLower = String(previewGame.title || '').toLowerCase();
                    const isBlockedExternal = /itch\.io|steampowered\.com|godotengine\.org|github\.com|naver\.com|youtube\.com/i.test(rawUrl);
                    let resolvedSrc = rawUrl;
                    if (titleLower.includes('cozy') || rawUrl.includes('godot')) {
                      resolvedSrc = '/demo-showcase.html?game=cozy';
                    } else if (titleLower.includes('arena') || titleLower.includes('cel-shader') || rawUrl.includes('steampowered')) {
                      resolvedSrc = '/demo-showcase.html?game=arena';
                    } else if (titleLower.includes('shadow') || isBlockedExternal || !rawUrl.startsWith('http')) {
                      resolvedSrc = '/demo-showcase.html?game=shadow';
                    }
                    return React.createElement('iframe', {
                      src: resolvedSrc,
                      style: { width: '100%', height: '100%', border: 'none', backgroundColor: '#0D0F17' },
                      allow: 'fullscreen; autoplay; gamepad',
                    });
                  })()
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
                placeholder="🔎 에러 코드/증상 즉시 검색 (예: CS0103, CS0246, Null, 분홍색, 충돌, 버튼, 타일맵, 한글, IL2CPP, WebGL...)"
                value={errorSearch}
                onChangeText={setErrorSearch}
              />

              {/* Quick Symptom Search Chips */}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginBottom: 10 }}>
                {[
                  { label: '전체보기', q: '' },
                  { label: '#CS0103 변수없음', q: 'CS0103' },
                  { label: '#CS0246 using누락', q: 'CS0246' },
                  { label: '#CS1061 함수없음', q: 'CS1061' },
                  { label: '#NullReference', q: 'NullReference' },
                  { label: '#InputSystem충돌', q: 'Input' },
                  { label: '#분홍색(Magenta)', q: '분홍색' },
                  { label: '#버튼클릭먹통', q: '버튼' },
                  { label: '#충돌감지안됨', q: 'OnTriggerEnter2D' },
                  { label: '#한글네모깨짐', q: 'TextMeshPro' },
                  { label: '#도트흐릿함', q: 'Point' },
                  { label: '#타일맵흰줄/턱걸림', q: '타일맵' },
                  { label: '#코루틴비활성에러', q: 'inactive' },
                  { label: '#DontDestroy중복', q: 'DontDestroyOnLoad' },
                  { label: '#IL2CPP빌드실패', q: 'IL2CPP' },
                  { label: '#WebGL90%멈춤', q: 'WebGL' },
                  { label: '#JSON저장안됨', q: 'JsonUtility' },
                ].map((chip) => (
                  <TouchableOpacity
                    key={chip.label}
                    onPress={() => { setErrorCatFilter('전체'); setErrorSearch(chip.q); }}
                    style={{
                      backgroundColor: errorSearch === chip.q && chip.q !== '' ? '#FFD166' : Theme.colors.pillBg,
                      borderWidth: 1,
                      borderColor: Theme.colors.border,
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 4,
                    }}
                  >
                    <Text style={{ fontSize: 10.5, fontWeight: '800', color: errorSearch === chip.q && chip.q !== '' ? '#11131C' : Theme.colors.text, fontFamily: 'monospace' }}>
                      {chip.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginBottom: 12 }}>
                {['전체', 'Unity (C# CS코드)', 'Unity (런타임 예외)', 'Unity (물리/UI/셰이더)', 'Unity (애니/사운드/2D)', 'Unity (빌드/배포)', 'Unreal / Godot'].map((cat) => (
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

      {/* PIXEL ART SPRITE STUDIO MODAL */}
      <Modal visible={pixelStudioOpen} animationType="fade" transparent onRequestClose={() => setPixelStudioOpen(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 12 }}>
          <View style={{ width: '100%', maxWidth: 740, height: '88%', backgroundColor: '#11131C', borderWidth: 2, borderColor: '#FFD166', borderRadius: 6, overflow: 'hidden' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, backgroundColor: '#1A1D2B', borderBottomWidth: 2, borderBottomColor: '#3A415E' }}>
              <Text style={{ color: '#FFD166', fontWeight: '900', fontSize: 13.5, fontFamily: 'monospace' }}>
                🎨 MOD_01 // 16×16 · 32×32 PIXEL_SPRITE_WORKSHOP
              </Text>
              <TouchableOpacity onPress={() => setPixelStudioOpen(false)} style={{ backgroundColor: '#FF4D6D', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4 }}>
                <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 11, fontFamily: 'monospace' }}>[X CLOSE]</Text>
              </TouchableOpacity>
            </View>
            {Platform.OS === 'web' ? (
              React.createElement('iframe', {
                src: '/pixel-studio.html',
                style: { width: '100%', height: '100%', border: 'none', backgroundColor: '#11131C' },
              })
            ) : (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                <Text style={{ color: '#FFF' }}>웹 브라우저에서 도트 스튜디오가 실행됩니다.</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* UNITY / C# ESSENTIAL SCRIPT VENDING MACHINE MODAL */}
      <Modal visible={csharpVendingOpen} animationType="fade" transparent onRequestClose={() => setCsharpVendingOpen(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 14 }}>
          <View style={{ width: '100%', maxWidth: 680, maxHeight: '90%', backgroundColor: Theme.colors.surface, borderWidth: 2, borderColor: '#10B981', borderRadius: 6, padding: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, borderBottomWidth: 2, borderBottomColor: Theme.colors.border, paddingBottom: 10 }}>
              <View>
                <Text style={{ fontSize: 15, fontWeight: '900', color: '#10B981', fontFamily: 'monospace' }}>
                  💻 MOD_02 // UNITY C# SCRIPT VENDING MACHINE
                </Text>
                <Text style={{ fontSize: 11.5, color: Theme.colors.textLight, marginTop: 2 }}>
                  매번 구글링하는 필수 C# 스크립트를 수치 조절 후 1초 만에 복사하거나 .cs 파일로 받으세요.
                </Text>
              </View>
              <TouchableOpacity onPress={() => setCsharpVendingOpen(false)} style={{ backgroundColor: Theme.colors.primary, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 4 }}>
                <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 11, fontFamily: 'monospace' }}>[X]</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                {[
                  { key: 'platformer2d', label: '🏃 2D 플랫포머 이동·점프' },
                  { key: 'fps3d', label: '🎥 3D 1인칭 카메라·이동' },
                  { key: 'pool', label: '♻️ 오브젝트 풀링 매니저' },
                  { key: 'jsonSave', label: '💾 JSON 세이브·로드' },
                  { key: 'singleton', label: '👑 제네릭 싱글톤 매니저' },
                  { key: 'camShake', label: '💥 카메라 흔들림 타격감' },
                ].map((item) => (
                  <TouchableOpacity
                    key={item.key}
                    onPress={() => { setSelectedScriptKey(item.key); setScriptCopied(false); }}
                    style={{
                      backgroundColor: selectedScriptKey === item.key ? '#10B981' : Theme.colors.pillBg,
                      borderWidth: 1.5,
                      borderColor: selectedScriptKey === item.key ? '#10B981' : Theme.colors.border,
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      borderRadius: 4,
                    }}
                  >
                    <Text style={{ fontSize: 11.5, fontWeight: '900', color: selectedScriptKey === item.key ? '#11131C' : Theme.colors.text, fontFamily: 'monospace' }}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: '#FFD166', fontFamily: 'monospace', marginBottom: 4 }}>
                    {'> PARAM_01 (속도 / 풀 크기 / 강도)'}
                  </Text>
                  <TextInput
                    style={{ backgroundColor: Theme.colors.background, borderWidth: 1.5, borderColor: Theme.colors.border, borderRadius: 4, padding: 8, color: Theme.colors.text, fontFamily: 'monospace', fontSize: 13 }}
                    value={scriptSpeed}
                    onChangeText={setScriptSpeed}
                    keyboardType="numeric"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: '#00E5FF', fontFamily: 'monospace', marginBottom: 4 }}>
                    {'> PARAM_02 (점프력 / 감도 / 지속시간)'}
                  </Text>
                  <TextInput
                    style={{ backgroundColor: Theme.colors.background, borderWidth: 1.5, borderColor: Theme.colors.border, borderRadius: 4, padding: 8, color: Theme.colors.text, fontFamily: 'monospace', fontSize: 13 }}
                    value={scriptJump}
                    onChangeText={setScriptJump}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              {(() => {
                const spd = scriptSpeed || '8';
                const jmp = scriptJump || '14';
                const templates: Record<string, { file: string; code: string }> = {
                  platformer2d: {
                    file: 'PlayerController2D.cs',
                    code: `using UnityEngine;\n\n[RequireComponent(typeof(Rigidbody2D))]\npublic class PlayerController2D : MonoBehaviour\n{\n    [Header("Movement Settings")]\n    public float moveSpeed = ${spd}f;\n    public float jumpForce = ${jmp}f;\n    public Transform groundCheck;\n    public LayerMask groundLayer;\n\n    private Rigidbody2D rb;\n    private float moveInput;\n    private bool isGrounded;\n    private float coyoteCounter;\n\n    void Awake() => rb = GetComponent<Rigidbody2D>();\n\n    void Update()\n    {\n        moveInput = Input.GetAxisRaw("Horizontal");\n        isGrounded = Physics2D.OverlapCircle(groundCheck.position, 0.2f, groundLayer);\n        coyoteCounter = isGrounded ? 0.12f : coyoteCounter - Time.deltaTime;\n\n        if (Input.GetButtonDown("Jump") && coyoteCounter > 0f)\n        {\n            rb.linearVelocity = new Vector2(rb.linearVelocity.x, jumpForce);\n            coyoteCounter = 0f;\n        }\n        if (moveInput != 0) transform.localScale = new Vector3(Mathf.Sign(moveInput), 1f, 1f);\n    }\n\n    void FixedUpdate()\n    {\n        rb.linearVelocity = new Vector2(moveInput * moveSpeed, rb.linearVelocity.y);\n    }\n}`
                  },
                  fps3d: {
                    file: 'FirstPersonController.cs',
                    code: `using UnityEngine;\n\n[RequireComponent(typeof(CharacterController))]\npublic class FirstPersonController : MonoBehaviour\n{\n    public float walkSpeed = ${spd}f;\n    public float mouseSensitivity = ${jmp}0f;\n    public Transform playerCamera;\n\n    private CharacterController cc;\n    private float xRotation = 0f;\n\n    void Start()\n    {\n        cc = GetComponent<CharacterController>();\n        Cursor.lockState = CursorLockMode.Locked;\n    }\n\n    void Update()\n    {\n        float mouseX = Input.GetAxis("Mouse X") * mouseSensitivity * Time.deltaTime;\n        float mouseY = Input.GetAxis("Mouse Y") * mouseSensitivity * Time.deltaTime;\n        xRotation = Mathf.Clamp(xRotation - mouseY, -85f, 85f);\n        playerCamera.localRotation = Quaternion.Euler(xRotation, 0f, 0f);\n        transform.Rotate(Vector3.up * mouseX);\n\n        Vector3 move = transform.right * Input.GetAxis("Horizontal") + transform.forward * Input.GetAxis("Vertical");\n        cc.SimpleMove(move * walkSpeed);\n    }\n}`
                  },
                  pool: {
                    file: 'ObjectPoolManager.cs',
                    code: `using System.Collections.Generic;\nusing UnityEngine;\n\npublic class ObjectPoolManager : MonoBehaviour\n{\n    public static ObjectPoolManager Instance { get; private set; }\n    public GameObject prefab;\n    public int initialPoolSize = ${spd};\n    private readonly Queue<GameObject> pool = new Queue<GameObject>();\n\n    void Awake()\n    {\n        Instance = this;\n        for (int i = 0; i < initialPoolSize; i++) CreateNewObject();\n    }\n\n    private GameObject CreateNewObject()\n    {\n        GameObject obj = Instantiate(prefab, transform);\n        obj.SetActive(false);\n        pool.Enqueue(obj);\n        return obj;\n    }\n\n    public GameObject Spawn(Vector3 position, Quaternion rotation)\n    {\n        if (pool.Count == 0) CreateNewObject();\n        GameObject obj = pool.Dequeue();\n        obj.transform.SetPositionAndRotation(position, rotation);\n        obj.SetActive(true);\n        return obj;\n    }\n\n    public void Despawn(GameObject obj)\n    {\n        obj.SetActive(false);\n        pool.Enqueue(obj);\n    }\n}`
                  },
                  jsonSave: {
                    file: 'SaveManager.cs',
                    code: `using System.IO;\nusing UnityEngine;\n\n[System.Serializable]\npublic class GameSaveData\n{\n    public int stageLevel = 1;\n    public int gold = ${spd}00;\n    public float maxHp = ${jmp}0f;\n}\n\npublic static class SaveManager\n{\n    private static string SavePath => Path.Combine(Application.persistentDataPath, "savegame.json");\n\n    public static void Save(GameSaveData data)\n    {\n        string json = JsonUtility.ToJson(data, true);\n        File.WriteAllText(SavePath, json);\n        Debug.Log("[SaveManager] Saved to: " + SavePath);\n    }\n\n    public static GameSaveData Load()\n    {\n        if (!File.Exists(SavePath)) return new GameSaveData();\n        string json = File.ReadAllText(SavePath);\n        return JsonUtility.FromJson<GameSaveData>(json);\n    }\n}`
                  },
                  singleton: {
                    file: 'Singleton.cs',
                    code: `using UnityEngine;\n\npublic abstract class Singleton<T> : MonoBehaviour where T : MonoBehaviour\n{\n    public static T Instance { get; private set; }\n\n    protected virtual void Awake()\n    {\n        if (Instance != null && Instance != this)\n        {\n            Destroy(gameObject);\n            return;\n        }\n        Instance = this as T;\n        DontDestroyOnLoad(gameObject);\n    }\n}`
                  },
                  camShake: {
                    file: 'CameraShake.cs',
                    code: `using System.Collections;\nusing UnityEngine;\n\npublic class CameraShake : MonoBehaviour\n{\n    public static CameraShake Instance;\n    private Vector3 originalPos;\n\n    void Awake() { Instance = this; originalPos = transform.localPosition; }\n\n    public void TriggerShake(float duration = 0.${jmp}f, float magnitude = 0.${spd}f)\n    {\n        StopAllCoroutines();\n        StartCoroutine(ShakeRoutine(duration, magnitude));\n    }\n\n    private IEnumerator ShakeRoutine(float duration, float magnitude)\n    {\n        float elapsed = 0f;\n        while (elapsed < duration)\n        {\n            transform.localPosition = originalPos + (Vector3)Random.insideUnitCircle * magnitude;\n            elapsed += Time.unscaledDeltaTime;\n            yield return null;\n        }\n        transform.localPosition = originalPos;\n    }\n}`
                  }
                };
                const current = templates[selectedScriptKey] || templates.platformer2d;
                return (
                  <View>
                    <View style={{ backgroundColor: '#090B10', borderWidth: 1.5, borderColor: Theme.colors.border, borderRadius: 6, padding: 12, marginBottom: 12 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                        <Text style={{ color: '#FFD166', fontSize: 11.5, fontWeight: '900', fontFamily: 'monospace' }}>
                          // FILE: {current.file}
                        </Text>
                        <Text style={{ color: '#10B981', fontSize: 11, fontWeight: '900', fontFamily: 'monospace' }}>
                          UNITY 2022 / UNITY 6 READY
                        </Text>
                      </View>
                      <Text style={{ color: '#E2E8F0', fontSize: 11.5, fontFamily: 'monospace', lineHeight: 17 }}>
                        {current.code}
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <TouchableOpacity
                        onPress={() => {
                          try { navigator?.clipboard?.writeText(current.code); } catch {}
                          setScriptCopied(true);
                        }}
                        style={{ flex: 1, backgroundColor: scriptCopied ? '#10B981' : Theme.colors.primary, paddingVertical: 12, borderRadius: 4, alignItems: 'center' }}
                      >
                        <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 12.5, fontFamily: 'monospace' }}>
                          {scriptCopied ? '[✅ COPIED TO CLIPBOARD!]' : '[📋 C# 스크립트 전체 복사]'}
                        </Text>
                      </TouchableOpacity>
                      {Platform.OS === 'web' && (
                        <TouchableOpacity
                          onPress={() => {
                            try {
                              const blob = new Blob([current.code], { type: 'text/plain;charset=utf-8' });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = current.file;
                              a.click();
                            } catch {}
                          }}
                          style={{ backgroundColor: '#00E5FF', paddingHorizontal: 14, justifyContent: 'center', borderRadius: 4 }}
                        >
                          <Text style={{ color: '#11131C', fontWeight: '900', fontSize: 12, fontFamily: 'monospace' }}>
                            [💾 {current.file} 다운로드]
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              })()}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* 8-BIT CHIPTUNE BGM SEQUENCER MODAL */}
      <Modal visible={bgmStudioOpen} animationType="fade" transparent onRequestClose={() => setBgmStudioOpen(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 12 }}>
          <View style={{ width: '100%', maxWidth: 760, height: '88%', backgroundColor: '#11131C', borderWidth: 2, borderColor: '#14B8A6', borderRadius: 6, overflow: 'hidden' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, backgroundColor: '#1A1D2B', borderBottomWidth: 2, borderBottomColor: '#3A415E' }}>
              <Text style={{ color: '#00E5FF', fontWeight: '900', fontSize: 13.5, fontFamily: 'monospace' }}>
                🎵 MOD_05 // 8-BIT CHIPTUNE BGM SEQUENCER (루프 브금 작곡기)
              </Text>
              <TouchableOpacity onPress={() => setBgmStudioOpen(false)} style={{ backgroundColor: '#FF4D6D', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4 }}>
                <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 11, fontFamily: 'monospace' }}>[X CLOSE]</Text>
              </TouchableOpacity>
            </View>
            {Platform.OS === 'web' ? (
              React.createElement('iframe', {
                src: '/bgm-studio.html',
                style: { width: '100%', height: '100%', border: 'none', backgroundColor: '#11131C' },
              })
            ) : (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                <Text style={{ color: '#FFF' }}>웹 브라우저에서 칩튠 브금 작곡기가 실행됩니다.</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* STEAM / STORE CAPSULE SIMULATOR & LAUNCH READINESS MODAL */}
      <Modal visible={steamSimOpen} animationType="fade" transparent onRequestClose={() => setSteamSimOpen(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 14 }}>
          <View style={{ width: '100%', maxWidth: 680, maxHeight: '90%', backgroundColor: Theme.colors.surface, borderWidth: 2, borderColor: '#6366F1', borderRadius: 6, padding: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, borderBottomWidth: 2, borderBottomColor: Theme.colors.border, paddingBottom: 10 }}>
              <View>
                <Text style={{ fontSize: 15, fontWeight: '900', color: '#818CF8', fontFamily: 'monospace' }}>
                  🛒 MOD_06 // STEAM & INDIE STORE CAPSULE SIMULATOR
                </Text>
                <Text style={{ fontSize: 11.5, color: Theme.colors.textLight, marginTop: 2 }}>
                  내 게임 배너/제목이 경쟁작 사이에서 얼마나 눈에 띄는지 비교하고 출시 준비 점수를 점검하세요.
                </Text>
              </View>
              <TouchableOpacity onPress={() => setSteamSimOpen(false)} style={{ backgroundColor: Theme.colors.primary, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 4 }}>
                <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 11, fontFamily: 'monospace' }}>[X]</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Inputs */}
              <View style={{ gap: 8, marginBottom: 12 }}>
                <TextInput
                  style={{ backgroundColor: Theme.colors.background, borderWidth: 1.5, borderColor: Theme.colors.border, borderRadius: 4, padding: 9, color: Theme.colors.text, fontSize: 13 }}
                  placeholder="내 게임 타이틀 입력..."
                  placeholderTextColor="#6B7280"
                  value={simTitle}
                  onChangeText={setSimTitle}
                />
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TextInput
                    style={{ flex: 2, backgroundColor: Theme.colors.background, borderWidth: 1.5, borderColor: Theme.colors.border, borderRadius: 4, padding: 9, color: Theme.colors.text, fontSize: 12.5 }}
                    placeholder="태그 (예: 로그라이크, 도트, 액션)"
                    placeholderTextColor="#6B7280"
                    value={simTags}
                    onChangeText={setSimTags}
                  />
                  <TextInput
                    style={{ flex: 1, backgroundColor: Theme.colors.background, borderWidth: 1.5, borderColor: Theme.colors.border, borderRadius: 4, padding: 9, color: '#10B981', fontWeight: '800', fontSize: 12.5 }}
                    placeholder="가격 (예: ₩12,500)"
                    placeholderTextColor="#6B7280"
                    value={simPrice}
                    onChangeText={setSimPrice}
                  />
                </View>
                <TextInput
                  style={{ backgroundColor: Theme.colors.background, borderWidth: 1.5, borderColor: Theme.colors.border, borderRadius: 4, padding: 9, color: Theme.colors.text, fontSize: 12.5 }}
                  placeholder="한줄 소개 문구 (Short Description)..."
                  placeholderTextColor="#6B7280"
                  value={simDesc}
                  onChangeText={setSimDesc}
                />
                <TextInput
                  style={{ backgroundColor: Theme.colors.background, borderWidth: 1.5, borderColor: Theme.colors.border, borderRadius: 4, padding: 9, color: Theme.colors.text, fontSize: 12 }}
                  placeholder="캡슐 썸네일 이미지 URL (비워두면 기본 도트 아트워크 표시)"
                  placeholderTextColor="#6B7280"
                  value={simThumb}
                  onChangeText={setSimThumb}
                />
              </View>

              {/* Simulated Steam Store Shelf */}
              <View style={{ backgroundColor: '#171A21', borderWidth: 2, borderColor: '#2A475E', borderRadius: 6, padding: 12, marginBottom: 14 }}>
                <Text style={{ fontSize: 11, fontWeight: '900', color: '#66C0F4', fontFamily: 'monospace', marginBottom: 8 }}>
                  {'> STEAM / INDIE STORE SHELF PREVIEW (경쟁작 대비 가독성 비교)'}
                </Text>

                {/* Competitor A */}
                <View style={{ flexDirection: 'row', backgroundColor: '#16202D', padding: 8, borderRadius: 4, marginBottom: 6, opacity: 0.65, alignItems: 'center', gap: 10 }}>
                  <View style={{ width: 84, height: 42, backgroundColor: '#314966', justifyContent: 'center', alignItems: 'center', borderRadius: 2 }}>
                    <Text style={{ fontSize: 10, color: '#9CA3AF', fontFamily: 'monospace' }}>COMPETITOR_A</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12.5, fontWeight: '700', color: '#C7D5E0' }}>Cyber Soul: Neon Blade</Text>
                    <Text style={{ fontSize: 10.5, color: '#8F98A0' }}>액션, 사이버펑크, 핵앤슬래시</Text>
                  </View>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#BEEE11' }}>₩16,500</Text>
                </View>

                {/* MY GAME CAPSULE (Highlighted) */}
                <View style={{ flexDirection: 'row', backgroundColor: '#1B2838', borderWidth: 2, borderColor: '#66C0F4', padding: 10, borderRadius: 4, marginBottom: 6, alignItems: 'center', gap: 10 }}>
                  {simThumb.trim() ? (
                    <Image source={{ uri: simThumb.trim() }} style={{ width: 96, height: 54, borderRadius: 3, backgroundColor: '#000' }} resizeMode="cover" />
                  ) : (
                    <View style={{ width: 96, height: 54, backgroundColor: '#FF4D6D', borderRadius: 3, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#FFD166' }}>
                      <Text style={{ fontSize: 10, fontWeight: '900', color: '#FFF', fontFamily: 'monospace' }}>★ MY CAPSULE</Text>
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '900', color: '#FFFFFF' }}>{simTitle || '제목 없음'}</Text>
                    <Text numberOfLines={1} style={{ fontSize: 11, color: '#66C0F4', marginTop: 2 }}>{simTags}</Text>
                    <Text numberOfLines={1} style={{ fontSize: 11, color: '#8F98A0', marginTop: 2 }}>{simDesc}</Text>
                  </View>
                  <View style={{ backgroundColor: '#4C6B22', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 3 }}>
                    <Text style={{ fontSize: 12, fontWeight: '900', color: '#BEEE11', fontFamily: 'monospace' }}>{simPrice}</Text>
                  </View>
                </View>

                {/* Competitor B */}
                <View style={{ flexDirection: 'row', backgroundColor: '#16202D', padding: 8, borderRadius: 4, opacity: 0.65, alignItems: 'center', gap: 10 }}>
                  <View style={{ width: 84, height: 42, backgroundColor: '#3B2F4A', justifyContent: 'center', alignItems: 'center', borderRadius: 2 }}>
                    <Text style={{ fontSize: 10, color: '#9CA3AF', fontFamily: 'monospace' }}>COMPETITOR_B</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12.5, fontWeight: '700', color: '#C7D5E0' }}>Pixel Farm Survivors</Text>
                    <Text style={{ fontSize: 10.5, color: '#8F98A0' }}>농장 시뮬레이션, 도트, 생존</Text>
                  </View>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#C7D5E0' }}>₩9,900</Text>
                </View>
              </View>

              {/* Launch Readiness Checklist */}
              <View style={{ backgroundColor: Theme.colors.background, borderWidth: 1.5, borderColor: Theme.colors.border, borderRadius: 6, padding: 12 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <Text style={{ fontSize: 12.5, fontWeight: '900', color: '#FFD166', fontFamily: 'monospace' }}>
                    {'> 스토어 출시 & 위시리스트 전환율 체크리스트'}
                  </Text>
                  <Text style={{ fontSize: 13, fontWeight: '900', color: '#10B981', fontFamily: 'monospace' }}>
                    준비도: {Math.round((simChecks.length / 6) * 100)}점
                  </Text>
                </View>
                {[
                  { id: 'c1', text: '트레일러 시작 후 3초 안에 로고 대신 실제 인게임 핵심 액션 장면이 나오는가?' },
                  { id: 'c2', text: '캡슐 썸네일 이미지를 모바일 크기(120x60px)로 축소해도 게임 제목이 선명하게 읽히는가?' },
                  { id: 'c3', text: '상점 첫 문단에 세계관 소설 대신 [장르 + 핵심 플레이 재미]가 2줄 이내로 요약되어 있는가?' },
                  { id: 'c4', text: '유저들이 바로 체험할 수 있는 웹 데모(Itch.io) 또는 Steam Next Fest 체험판 빌드가 있는가?' },
                  { id: 'c5', text: '유사 인디 흥행작과 겹치는 핵심 태그(예: Roguelike Deckbuilder, Pixel Graphics) 5개를 지정했는가?' },
                  { id: 'c6', text: '해외 유저 유입을 위한 최소한의 영어 UI / 상점 페이지 번역을 적용했는가?' },
                ].map((chk) => {
                  const checked = simChecks.includes(chk.id);
                  return (
                    <TouchableOpacity
                      key={chk.id}
                      onPress={() => setSimChecks(checked ? simChecks.filter(x => x !== chk.id) : [...simChecks, chk.id])}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: Theme.colors.pillBg }}
                    >
                      <Text style={{ fontSize: 14, color: checked ? '#10B981' : Theme.colors.textLight, fontFamily: 'monospace', fontWeight: '900' }}>
                        {checked ? '[✓]' : '[ ]'}
                      </Text>
                      <Text style={{ flex: 1, fontSize: 12, color: checked ? Theme.colors.text : Theme.colors.textLight }}>
                        {chk.text}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* UNITY / GODOT 60FPS OPTIMIZER & ENGINE HOTKEYS CHEATSHEET MODAL */}
      <Modal visible={optDoctorOpen} animationType="fade" transparent onRequestClose={() => setOptDoctorOpen(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 14 }}>
          <View style={{ width: '100%', maxWidth: 680, maxHeight: '90%', backgroundColor: Theme.colors.surface, borderWidth: 2, borderColor: '#F59E0B', borderRadius: 6, padding: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, borderBottomWidth: 2, borderBottomColor: Theme.colors.border, paddingBottom: 10 }}>
              <View>
                <Text style={{ fontSize: 15, fontWeight: '900', color: '#F59E0B', fontFamily: 'monospace' }}>
                  ⚡ MOD_07 // 60FPS OPTIMIZATION DOCTOR & HOTKEYS
                </Text>
                <Text style={{ fontSize: 11.5, color: Theme.colors.textLight, marginTop: 2 }}>
                  인디게임 프레임 드랍(렉) 방어 체크리스트 및 Unity·Unreal·Godot 필수 단축키 치트시트
                </Text>
              </View>
              <TouchableOpacity onPress={() => setOptDoctorOpen(false)} style={{ backgroundColor: Theme.colors.primary, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 4 }}>
                <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 11, fontFamily: 'monospace' }}>[X]</Text>
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: 'row', gap: 6, marginBottom: 12 }}>
              <TouchableOpacity
                onPress={() => setOptTab('checklist')}
                style={{ flex: 1, backgroundColor: optTab === 'checklist' ? '#F59E0B' : Theme.colors.pillBg, paddingVertical: 8, borderRadius: 4, alignItems: 'center' }}
              >
                <Text style={{ fontSize: 12, fontWeight: '900', color: optTab === 'checklist' ? '#11131C' : Theme.colors.text, fontFamily: 'monospace' }}>
                  [01] 60FPS 프레임 방어 진단 ({Math.round((optChecks.length / 6) * 100)}%)
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setOptTab('hotkeys')}
                style={{ flex: 1, backgroundColor: optTab === 'hotkeys' ? '#00E5FF' : Theme.colors.pillBg, paddingVertical: 8, borderRadius: 4, alignItems: 'center' }}
              >
                <Text style={{ fontSize: 12, fontWeight: '900', color: optTab === 'hotkeys' ? '#11131C' : Theme.colors.text, fontFamily: 'monospace' }}>
                  [02] 3대 엔진 필수 단축키 사전
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {optTab === 'checklist' ? (
                <View style={{ gap: 8 }}>
                  {[
                    { id: 'o1', cat: 'CPU / GC Alloc', title: 'Update() 안에서 GetComponent<T>() 또는 GameObject.Find() 호출 제거', tip: 'Awake()에서 컴포넌트를 변수에 캐싱해 두어야 매 프레임 가비지(GC)와 CPU 스파이크가 발생하지 않습니다.' },
                    { id: 'o2', cat: 'Memory / Pool', title: '반복 생성되는 총알·몬스터·데미지 텍스트에 Object Pooling 적용', tip: 'Instantiate()와 Destroy()를 전투 중 반복 호출하면 GC.Collect 순간 멈춤(Stutter) 현상이 발생합니다.' },
                    { id: 'o3', cat: 'GPU / DrawCall', title: '2D 스프라이트를 Sprite Atlas로 묶어 SetPass Calls(드로우콜) 압축', tip: '동일한 머티리얼/아틀라스를 공유해야 배칭(Batching)이 깨지지 않고 모바일 발열이 줄어듭니다.' },
                    { id: 'o4', cat: 'UI / Canvas', title: '자주 변하는 텍스트(체력바/점수)와 정적 배경 UI의 Canvas 분리', tip: 'Unity UGUI는 캔버스 내 요소 하나만 바뀌어도 해당 Canvas 전체 메쉬를 리빌드합니다.' },
                    { id: 'o5', cat: 'Physics', title: '움직이지 않는 배경 콜라이더에서 Rigidbody 제거 및 Layer Collision Matrix 정리', tip: 'Edit > Project Settings > Physics(2D)에서 불필요한 레이어 간 충돌 체크를 해제하면 물리 연산이 절반 이하로 감소합니다.' },
                    { id: 'o6', cat: 'Ray / Camera', title: '장식용 UI Image·Text의 Raycast Target 해제 및 Camera.main 캐싱', tip: '터치 입력을 받지 않는 UI의 Raycast Target을 끄면 EventSystem 클릭 검사 속도가 크게 향상됩니다.' },
                  ].map((item) => {
                    const done = optChecks.includes(item.id);
                    return (
                      <TouchableOpacity
                        key={item.id}
                        onPress={() => setOptChecks(done ? optChecks.filter(x => x !== item.id) : [...optChecks, item.id])}
                        style={{
                          backgroundColor: Theme.colors.background,
                          borderWidth: 1.5,
                          borderColor: done ? '#10B981' : Theme.colors.border,
                          borderRadius: 6,
                          padding: 11,
                        }}
                      >
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                          <Text style={{ fontSize: 10.5, fontWeight: '900', color: '#F59E0B', fontFamily: 'monospace' }}>[{item.cat}]</Text>
                          <Text style={{ fontSize: 11, fontWeight: '900', color: done ? '#10B981' : Theme.colors.textLight, fontFamily: 'monospace' }}>
                            {done ? '[✓ OPTIMIZED]' : '[미적용 - 클릭해 체크]'}
                          </Text>
                        </View>
                        <Text style={{ fontSize: 13.5, fontWeight: '800', color: Theme.colors.text, marginBottom: 4 }}>{item.title}</Text>
                        <Text style={{ fontSize: 11.5, color: Theme.colors.textLight, lineHeight: 17 }}>💡 {item.tip}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ) : (
                <View>
                  <View style={{ flexDirection: 'row', gap: 6, marginBottom: 10 }}>
                    {(['Unity', 'Unreal', 'Godot'] as const).map((eng) => (
                      <TouchableOpacity
                        key={eng}
                        onPress={() => setHotkeyEngine(eng)}
                        style={{
                          backgroundColor: hotkeyEngine === eng ? Theme.colors.primary : Theme.colors.pillBg,
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          borderRadius: 4,
                        }}
                      >
                        <Text style={{ fontSize: 12, fontWeight: '900', color: '#FFF', fontFamily: 'monospace' }}>{eng}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  {(hotkeyEngine === 'Unity' ? [
                    { k: 'Q / W / E / R / T', d: '손바닥 이동 / 위치(Move) / 회전(Rotate) / 크기(Scale) / 2D 렉트 툴 전환' },
                    { k: 'V 누른 채 드래그', d: '버텍스 스냅(Vertex Snap) — 타일이나 벽 모서리를 빈틈없이 딱 맞출 때 필수!' },
                    { k: 'Ctrl + Shift + F', d: '현재 내가 보고 있는 Scene 뷰 시점 그대로 선택한 카메라/오브젝트 정렬' },
                    { k: 'F (오브젝트 선택 후)', d: '선택한 오브젝트로 씬 카메라 즉시 포커스 이동' },
                    { k: 'Alt + Shift + A', d: '선택한 GameObject 활성화/비활성화(Active) 즉시 토글' },
                    { k: 'Ctrl + P / Ctrl + Shift + P', d: '게임 플레이(Play) 시작·종료 / 일시정지(Pause)' },
                  ] : hotkeyEngine === 'Unreal' ? [
                    { k: 'End 키', d: '공중에 떠 있는 액터(오브젝트)를 바닥 지형에 즉시 착지(Snap to Floor)' },
                    { k: 'G 키', d: '게임 뷰(Game View) 토글 — 기즈모와 아이콘을 숨기고 실제 인게임 화면 확인' },
                    { k: 'Ctrl + Space', d: '콘텐츠 드로어(Content Drawer) 즉시 열기/닫기' },
                    { k: 'Alt + P', d: '현재 뷰포트에서 즉시 플레이(PIE) 시작' },
                    { k: ' 블루프린트 B + 좌클릭', d: 'Branch(if 분기문) 노드 1초 생성 (D+클릭: Delay, S+클릭: Sequence)' },
                  ] : [
                    { k: 'F5 / F6', d: '메인 프로젝트 실행(F5) / 현재 열려 있는 씬만 단독 실행(F6)' },
                    { k: 'Ctrl + A', d: '현재 노드의 하위 자식 노드 추가(Add Child Node)' },
                    { k: 'Ctrl + Shift + O', d: '빠른 씬 열기(Quick Open Scene)' },
                    { k: 'S / R / W (2D/3D 뷰)', d: '크기 조절(Scale) / 회전(Rotate) / 이동(Move) 모드 전환' },
                    { k: 'Ctrl 드래그 (스크립트창)', d: '씬 트리의 노드를 스크립트 에디터로 Ctrl+드래그하면 @onready 변수 자동 완성!' },
                  ]).map((hk, idx) => (
                    <View key={idx} style={{ backgroundColor: Theme.colors.background, borderWidth: 1.5, borderColor: Theme.colors.border, borderRadius: 4, padding: 10, marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <View style={{ backgroundColor: '#FFD166', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, minWidth: 110, alignItems: 'center' }}>
                        <Text style={{ fontSize: 11.5, fontWeight: '900', color: '#11131C', fontFamily: 'monospace' }}>{hk.k}</Text>
                      </View>
                      <Text style={{ flex: 1, fontSize: 12.5, color: Theme.colors.text, fontWeight: '700' }}>{hk.d}</Text>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* GAME BALANCE CALCULATOR MODAL */}
      <Modal visible={balanceCalcOpen} animationType="fade" transparent onRequestClose={() => setBalanceCalcOpen(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 14 }}>
          <View style={{ width: '100%', maxWidth: 680, maxHeight: '90%', backgroundColor: Theme.colors.surface, borderWidth: 2, borderColor: '#EC4899', borderRadius: 6, padding: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, borderBottomWidth: 2, borderBottomColor: Theme.colors.border, paddingBottom: 10 }}>
              <View>
                <Text style={{ fontSize: 15, fontWeight: '900', color: '#F472B6', fontFamily: 'monospace' }}>
                  ⚖️ MOD_08 // GAME_BALANCE_CALCULATOR (밸런스 & C# 수식 계산기)
                </Text>
                <Text style={{ fontSize: 11.5, color: Theme.colors.textLight, marginTop: 2 }}>
                  데미지 공식·레벨업 경험치 곡선·드랍 확률을 실시간 시뮬레이션하고 Unity C# 코드로 변환합니다.
                </Text>
              </View>
              <TouchableOpacity onPress={() => setBalanceCalcOpen(false)} style={{ backgroundColor: Theme.colors.primary, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 4 }}>
                <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 11, fontFamily: 'monospace' }}>[X]</Text>
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: 'row', gap: 6, marginBottom: 12 }}>
              {[
                { k: 'damage' as const, label: '[01] 데미지·치명타 공식' },
                { k: 'exp' as const, label: '[02] 레벨업 경험치 곡선' },
                { k: 'drop' as const, label: '[03] 아이템 드랍·가챠 확률' },
              ].map((t) => (
                <TouchableOpacity
                  key={t.k}
                  onPress={() => { setBalTab(t.k); setBalCopied(false); }}
                  style={{ flex: 1, backgroundColor: balTab === t.k ? '#EC4899' : Theme.colors.pillBg, paddingVertical: 8, borderRadius: 4, alignItems: 'center' }}
                >
                  <Text style={{ fontSize: 11, fontWeight: '900', color: '#FFF', fontFamily: 'monospace' }}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {balTab === 'damage' && (() => {
                const atk = Math.max(1, Number(balAtk) || 100);
                const def = Math.max(0, Number(balDef) || 40);
                const crit = Math.min(100, Math.max(0, Number(balCritPct) || 25));
                const flatDmg = Math.max(1, atk - def);
                const pctDmg = Math.round(atk * (100 / (100 + def)));
                const avgDpsMult = 1 + (crit / 100) * 0.5;
                const csharpCode = `public static int CalculateDamage(float atk, float def, float critChance = ${crit}f)\n{\n    // LoL / RPG 표준 비율 방어력 공식 (방어력이 높아져도 0 데미지가 되지 않음)\n    float baseDmg = atk * (100f / (100f + Mathf.Max(0f, def)));\n    bool isCrit = Random.Range(0f, 100f) < critChance;\n    return Mathf.Max(1, Mathf.RoundToInt(isCrit ? baseDmg * 1.5f : baseDmg));\n}`;
                return (
                  <View>
                    <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 11, color: '#FFD166', fontFamily: 'monospace', marginBottom: 4 }}>공격력 (ATK)</Text>
                        <TextInput style={{ backgroundColor: Theme.colors.background, borderWidth: 1.5, borderColor: Theme.colors.border, borderRadius: 4, padding: 8, color: '#FFF', fontFamily: 'monospace' }} value={balAtk} onChangeText={setBalAtk} keyboardType="numeric" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 11, color: '#00E5FF', fontFamily: 'monospace', marginBottom: 4 }}>방어력 (DEF)</Text>
                        <TextInput style={{ backgroundColor: Theme.colors.background, borderWidth: 1.5, borderColor: Theme.colors.border, borderRadius: 4, padding: 8, color: '#FFF', fontFamily: 'monospace' }} value={balDef} onChangeText={setBalDef} keyboardType="numeric" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 11, color: '#F472B6', fontFamily: 'monospace', marginBottom: 4 }}>치명타율 (%)</Text>
                        <TextInput style={{ backgroundColor: Theme.colors.background, borderWidth: 1.5, borderColor: Theme.colors.border, borderRadius: 4, padding: 8, color: '#FFF', fontFamily: 'monospace' }} value={balCritPct} onChangeText={setBalCritPct} keyboardType="numeric" />
                      </View>
                    </View>
                    <View style={{ backgroundColor: Theme.colors.background, borderWidth: 1.5, borderColor: Theme.colors.border, borderRadius: 6, padding: 12, marginBottom: 12, gap: 6 }}>
                      <Text style={{ fontSize: 12.5, color: Theme.colors.text, fontWeight: '800' }}>
                        • 단순 감산 공식 (ATK - DEF): 일반 <Text style={{ color: '#FFD166' }}>{flatDmg}</Text> / 치명타(1.5배) <Text style={{ color: '#FF4D6D' }}>{Math.round(flatDmg * 1.5)}</Text>
                      </Text>
                      <Text style={{ fontSize: 12.5, color: Theme.colors.text, fontWeight: '800' }}>
                        • 비율 방어 공식 (ATK × 100/(100+DEF)): 일반 <Text style={{ color: '#00E5FF' }}>{pctDmg}</Text> / 치명타 <Text style={{ color: '#10B981' }}>{Math.round(pctDmg * 1.5)}</Text> (평균 기댓값: {Math.round(pctDmg * avgDpsMult)})
                      </Text>
                    </View>
                    <View style={{ backgroundColor: '#090B10', padding: 12, borderRadius: 6, marginBottom: 10 }}>
                      <Text style={{ color: '#38BDF8', fontSize: 11.5, fontFamily: 'monospace', lineHeight: 17 }}>{csharpCode}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => { try { navigator?.clipboard?.writeText(csharpCode); } catch {} setBalCopied(true); }}
                      style={{ backgroundColor: balCopied ? '#10B981' : '#EC4899', paddingVertical: 11, borderRadius: 4, alignItems: 'center' }}
                    >
                      <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 12, fontFamily: 'monospace' }}>
                        {balCopied ? '[✅ C# 데미지 공식 복사됨!]' : '[📋 C# 데미지 계산 함수 복사]'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })()}

              {balTab === 'exp' && (() => {
                const base = Math.max(10, Number(balExpBase) || 100);
                const factor = Math.max(1.05, Math.min(3.0, Number(balExpFactor) || 1.45));
                const levels = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(lv => ({
                  lv,
                  req: Math.round(base * Math.pow(lv, factor))
                }));
                const maxExp = levels[levels.length - 1].req;
                const csharpCode = `public static int GetRequiredExp(int currentLevel)\n{\n    // 지수 성장형 경험치 테이블 (Base: ${base}, Exponent: ${factor}f)\n    return Mathf.RoundToInt(${base}f * Mathf.Pow(currentLevel, ${factor}f));\n}`;
                return (
                  <View>
                    <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 11, color: '#FFD166', fontFamily: 'monospace', marginBottom: 4 }}>1레벨 기본 경험치 (Base EXP)</Text>
                        <TextInput style={{ backgroundColor: Theme.colors.background, borderWidth: 1.5, borderColor: Theme.colors.border, borderRadius: 4, padding: 8, color: '#FFF', fontFamily: 'monospace' }} value={balExpBase} onChangeText={setBalExpBase} keyboardType="numeric" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 11, color: '#00E5FF', fontFamily: 'monospace', marginBottom: 4 }}>성장 곡선 지수 (1.2 ~ 2.0)</Text>
                        <TextInput style={{ backgroundColor: Theme.colors.background, borderWidth: 1.5, borderColor: Theme.colors.border, borderRadius: 4, padding: 8, color: '#FFF', fontFamily: 'monospace' }} value={balExpFactor} onChangeText={setBalExpFactor} keyboardType="numeric" />
                      </View>
                    </View>
                    <View style={{ backgroundColor: Theme.colors.background, borderWidth: 1.5, borderColor: Theme.colors.border, borderRadius: 6, padding: 12, marginBottom: 12, gap: 5 }}>
                      {levels.map((item) => (
                        <View key={item.lv} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Text style={{ width: 52, fontSize: 11, fontWeight: '900', color: '#FFD166', fontFamily: 'monospace' }}>LV.{item.lv}</Text>
                          <View style={{ flex: 1, height: 10, backgroundColor: '#1E2235', borderRadius: 2, overflow: 'hidden' }}>
                            <View style={{ width: `${Math.max(4, Math.round((item.req / maxExp) * 100))}%`, height: '100%', backgroundColor: '#00E5FF' }} />
                          </View>
                          <Text style={{ width: 80, textAlign: 'right', fontSize: 11, fontWeight: '800', color: '#FFF', fontFamily: 'monospace' }}>{item.req} EXP</Text>
                        </View>
                      ))}
                    </View>
                    <TouchableOpacity
                      onPress={() => { try { navigator?.clipboard?.writeText(csharpCode); } catch {} setBalCopied(true); }}
                      style={{ backgroundColor: balCopied ? '#10B981' : '#EC4899', paddingVertical: 11, borderRadius: 4, alignItems: 'center' }}
                    >
                      <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 12, fontFamily: 'monospace' }}>
                        {balCopied ? '[✅ C# 경험치 공식 복사됨!]' : '[📋 C# 경험치 요구량 함수 복사]'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })()}

              {balTab === 'drop' && (() => {
                const p = Math.min(100, Math.max(0.01, Number(balDropRate) || 1.5)) / 100;
                const n = Math.max(1, Number(balDropTries) || 50);
                const probAtLeastOne = (1 - Math.pow(1 - p, n)) * 100;
                const triesFor50 = Math.ceil(Math.log(0.5) / Math.log(1 - p));
                const triesFor90 = Math.ceil(Math.log(0.1) / Math.log(1 - p));
                return (
                  <View>
                    <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 11, color: '#FFD166', fontFamily: 'monospace', marginBottom: 4 }}>1회 드랍/뽑기 확률 (%)</Text>
                        <TextInput style={{ backgroundColor: Theme.colors.background, borderWidth: 1.5, borderColor: Theme.colors.border, borderRadius: 4, padding: 8, color: '#FFF', fontFamily: 'monospace' }} value={balDropRate} onChangeText={setBalDropRate} keyboardType="numeric" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 11, color: '#00E5FF', fontFamily: 'monospace', marginBottom: 4 }}>반복 처치/뽑기 횟수 (N회)</Text>
                        <TextInput style={{ backgroundColor: Theme.colors.background, borderWidth: 1.5, borderColor: Theme.colors.border, borderRadius: 4, padding: 8, color: '#FFF', fontFamily: 'monospace' }} value={balDropTries} onChangeText={setBalDropTries} keyboardType="numeric" />
                      </View>
                    </View>
                    <View style={{ backgroundColor: Theme.colors.background, borderWidth: 1.5, borderColor: Theme.colors.border, borderRadius: 6, padding: 14, gap: 8 }}>
                      <Text style={{ fontSize: 14, fontWeight: '900', color: '#10B981' }}>
                        🎯 {n}회 시도 시 최소 1개 이상 획득할 확률: {probAtLeastOne.toFixed(1)}%
                      </Text>
                      <Text style={{ fontSize: 12.5, color: Theme.colors.text }}>
                        • 유저 절반(50%)이 획득하는 기대 횟수: 약 <Text style={{ color: '#FFD166', fontWeight: '900' }}>{triesFor50}회</Text>
                      </Text>
                      <Text style={{ fontSize: 12.5, color: Theme.colors.text }}>
                        • 유저 90%가 획득하는 권장 천장(Pity) 횟수: 약 <Text style={{ color: '#00E5FF', fontWeight: '900' }}>{triesFor90}회</Text>
                      </Text>
                    </View>
                  </View>
                );
              })()}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* STEAM / DISCORD / DEVLOG PATCH NOTE BUILDER MODAL */}
      <Modal visible={patchBuilderOpen} animationType="fade" transparent onRequestClose={() => setPatchBuilderOpen(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 14 }}>
          <View style={{ width: '100%', maxWidth: 680, maxHeight: '90%', backgroundColor: Theme.colors.surface, borderWidth: 2, borderColor: '#22C55E', borderRadius: 6, padding: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, borderBottomWidth: 2, borderBottomColor: Theme.colors.border, paddingBottom: 10 }}>
              <View>
                <Text style={{ fontSize: 15, fontWeight: '900', color: '#22C55E', fontFamily: 'monospace' }}>
                  📋 MOD_09 // STEAM & DISCORD PATCHNOTE BUILDER
                </Text>
                <Text style={{ fontSize: 11.5, color: Theme.colors.textLight, marginTop: 2 }}>
                  업데이트 내역을 입력하면 스팀 뉴스 허브(BBCode) 및 디스코드/개발일지 마크다운으로 자동 변환합니다.
                </Text>
              </View>
              <TouchableOpacity onPress={() => setPatchBuilderOpen(false)} style={{ backgroundColor: Theme.colors.primary, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 4 }}>
                <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 11, fontFamily: 'monospace' }}>[X]</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <TextInput
                style={{ backgroundColor: Theme.colors.background, borderWidth: 1.5, borderColor: Theme.colors.border, borderRadius: 4, padding: 9, color: '#FFD166', fontWeight: '900', marginBottom: 8, fontSize: 13 }}
                placeholder="패치 버전명 (예: v0.3.0 Early Access)"
                value={patchVer}
                onChangeText={setPatchVer}
              />
              <Text style={{ fontSize: 11, color: '#10B981', fontWeight: '800', fontFamily: 'monospace', marginBottom: 4 }}>✨ 신규 추가 기능 (줄바꿈으로 구분)</Text>
              <TextInput
                style={{ backgroundColor: Theme.colors.background, borderWidth: 1.5, borderColor: Theme.colors.border, borderRadius: 4, padding: 8, color: '#FFF', height: 52, marginBottom: 8, fontSize: 12.5 }}
                multiline
                value={patchNew}
                onChangeText={setPatchNew}
              />
              <Text style={{ fontSize: 11, color: '#00E5FF', fontWeight: '800', fontFamily: 'monospace', marginBottom: 4 }}>⚖️ 밸런스 조정 (줄바꿈으로 구분)</Text>
              <TextInput
                style={{ backgroundColor: Theme.colors.background, borderWidth: 1.5, borderColor: Theme.colors.border, borderRadius: 4, padding: 8, color: '#FFF', height: 52, marginBottom: 8, fontSize: 12.5 }}
                multiline
                value={patchBal}
                onChangeText={setPatchBal}
              />
              <Text style={{ fontSize: 11, color: '#FF4D6D', fontWeight: '800', fontFamily: 'monospace', marginBottom: 4 }}>🐛 버그 수정 (줄바꿈으로 구분)</Text>
              <TextInput
                style={{ backgroundColor: Theme.colors.background, borderWidth: 1.5, borderColor: Theme.colors.border, borderRadius: 4, padding: 8, color: '#FFF', height: 52, marginBottom: 10, fontSize: 12.5 }}
                multiline
                value={patchFix}
                onChangeText={setPatchFix}
              />

              <View style={{ flexDirection: 'row', gap: 6, marginBottom: 10 }}>
                <TouchableOpacity
                  onPress={() => { setPatchFormat('markdown'); setPatchCopied(false); }}
                  style={{ flex: 1, backgroundColor: patchFormat === 'markdown' ? '#22C55E' : Theme.colors.pillBg, paddingVertical: 8, borderRadius: 4, alignItems: 'center' }}
                >
                  <Text style={{ fontSize: 11.5, fontWeight: '900', color: patchFormat === 'markdown' ? '#11131C' : '#FFF', fontFamily: 'monospace' }}>
                    [디스코드 / 개발일지 마크다운]
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => { setPatchFormat('steam'); setPatchCopied(false); }}
                  style={{ flex: 1, backgroundColor: patchFormat === 'steam' ? '#00E5FF' : Theme.colors.pillBg, paddingVertical: 8, borderRadius: 4, alignItems: 'center' }}
                >
                  <Text style={{ fontSize: 11.5, fontWeight: '900', color: patchFormat === 'steam' ? '#11131C' : '#FFF', fontFamily: 'monospace' }}>
                    [스팀(Steam) 공지사항 BBCode]
                  </Text>
                </TouchableOpacity>
              </View>

              {(() => {
                const newLines = patchNew.split('\n').map(s => s.trim()).filter(Boolean);
                const balLines = patchBal.split('\n').map(s => s.trim()).filter(Boolean);
                const fixLines = patchFix.split('\n').map(s => s.trim()).filter(Boolean);
                const formatted = patchFormat === 'markdown'
                  ? `# 📦 [${patchVer}] 업데이트 패치노트 안내\n\n### ✨ 신규 콘텐츠 (New Features)\n${newLines.map(l => `- ${l}`).join('\n')}\n\n### ⚖️ 밸런스 조정 (Balance Changes)\n${balLines.map(l => `- ${l}`).join('\n')}\n\n### 🐛 버그 수정 (Bug Fixes)\n${fixLines.map(l => `- ${l}`).join('\n')}\n\n항상 플레이해주시고 소중한 피드백 남겨주셔서 감사합니다!`
                  : `[h1]📦 [${patchVer}] 업데이트 패치노트 안내[/h1]\n\n[h2]✨ 신규 콘텐츠 (New Features)[/h2]\n[list]\n${newLines.map(l => `[*] ${l}`).join('\n')}\n[/list]\n\n[h2]⚖️ 밸런스 조정 (Balance Changes)[/h2]\n[list]\n${balLines.map(l => `[*] ${l}`).join('\n')}\n[/list]\n\n[h2]🐛 버그 수정 (Bug Fixes)[/h2]\n[list]\n${fixLines.map(l => `[*] ${l}`).join('\n')}\n[/list]`;
                return (
                  <View>
                    <View style={{ backgroundColor: '#090B10', padding: 12, borderRadius: 6, marginBottom: 10 }}>
                      <Text style={{ color: '#E2E8F0', fontSize: 11.5, fontFamily: 'monospace', lineHeight: 17 }}>{formatted}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => { try { navigator?.clipboard?.writeText(formatted); } catch {} setPatchCopied(true); }}
                      style={{ backgroundColor: patchCopied ? '#10B981' : '#22C55E', paddingVertical: 12, borderRadius: 4, alignItems: 'center' }}
                    >
                      <Text style={{ color: '#11131C', fontWeight: '900', fontSize: 12.5, fontFamily: 'monospace' }}>
                        {patchCopied ? '[✅ 패치노트 양식이 클립보드에 복사되었습니다!]' : '[📋 완성된 패치노트 전체 복사하기]'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })()}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* 2D 타일맵 & 절차적 던전 맵 생성기 모달 */}
      <Modal visible={dungeonGenOpen} transparent animationType="fade" onRequestClose={() => setDungeonGenOpen(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 12 }}>
          <View style={{ maxWidth: 960, width: '100%', height: '90%', maxHeight: 740, backgroundColor: Theme.colors.surface, borderRadius: 6, padding: 0, overflow: 'hidden', borderColor: '#A855F7', borderWidth: 2 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#11131C', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#2D3446' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ fontSize: 16 }}>🗺️</Text>
                <Text style={{ fontSize: 13.5, fontWeight: '900', color: '#E9D5FF', fontFamily: 'monospace' }}>
                  MOD_10 // 2D 타일맵 · 절차적 던전 생성기 (BSP & Cellular & Unity C# 추출)
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setDungeonGenOpen(false)}
                style={{ backgroundColor: '#FF2A85', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 4 }}
              >
                <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 12, fontFamily: 'monospace' }}>[X 닫기]</Text>
              </TouchableOpacity>
            </View>
            {Platform.OS === 'web' ? (
              <iframe
                src="/dungeon-gen.html"
                style={{ width: '100%', height: '100%', border: 'none', backgroundColor: '#0E1017' } as any}
                title="2D Dungeon Map Generator"
              />
            ) : (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
                <Text style={{ color: '#FFF', fontSize: 14 }}>웹 브라우저 환경에서 2D 던전 생성기를 사용할 수 있습니다.</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Unity / Godot 셰이더 시각 효과 레시피 사전 모달 */}
      <Modal visible={shaderBookOpen} transparent animationType="fade" onRequestClose={() => setShaderBookOpen(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 14 }}>
          <View style={{ width: '100%', maxWidth: 680, backgroundColor: Theme.colors.surface, borderRadius: 6, padding: 16, borderColor: '#06B6D4', borderWidth: 2, maxHeight: '90%' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <Text style={{ fontSize: 15, fontWeight: '900', color: '#22D3EE', fontFamily: 'monospace' }}>
                ✨ MOD_11 // Unity & Godot 필수 셰이더(Shader) 레시피 사전
              </Text>
              <TouchableOpacity onPress={() => setShaderBookOpen(false)}>
                <Text style={{ color: Theme.colors.textLight, fontWeight: '900', fontSize: 13, fontFamily: 'monospace' }}>[X 닫기]</Text>
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {(() => {
                const recipes: Record<string, { title: string; badge: string; desc: string; previewColor: string; code: string }> = {
                  hitflash: {
                    title: '⚡ 피격 하얀색 점멸 (Sprite Hit Flash)',
                    badge: '2D 액션 필수',
                    desc: '몬스터가 공격받았을 때 0.1초 동안 스프라이트 전체를 하얗게 발광시켜 타격감을 극대화합니다.',
                    previewColor: '#F8FAFC',
                    code: [
                      '// [Godot 4 .gdshader & Unity URP 호환 핵심 수식]',
                      'shader_type canvas_item;',
                      'uniform float flash_amount : hint_range(0.0, 1.0) = 0.0;',
                      'uniform vec4 flash_color : source_color = vec4(1.0, 1.0, 1.0, 1.0);',
                      '',
                      'void fragment() {',
                      '    vec4 tex = texture(TEXTURE, UV);',
                      '    COLOR = mix(tex, vec4(flash_color.rgb, tex.a), flash_amount);',
                      '}',
                      '',
                      '// [Unity C# MaterialPropertyBlock 제어 코드 (배칭 유지)]',
                      'public IEnumerator FlashWhite(SpriteRenderer sr) {',
                      '    MaterialPropertyBlock mpb = new MaterialPropertyBlock();',
                      '    sr.GetPropertyBlock(mpb);',
                      '    mpb.SetFloat("_FlashAmount", 1f);',
                      '    sr.SetPropertyBlock(mpb);',
                      '    yield return new WaitForSeconds(0.08f);',
                      '    mpb.SetFloat("_FlashAmount", 0f);',
                      '    sr.SetPropertyBlock(mpb);',
                      '}'
                    ].join('\n')
                  },
                  outline: {
                    title: '🟨 2D 도트 1픽셀 외곽선 (Pixel Perfect Outline)',
                    badge: '도트/상호작용',
                    desc: 'NPC나 아이템에 가까이 다가갔을 때 상하좌우 1텍셀 알파값을 검사해 깔끔한 도트 테두리를 그립니다.',
                    previewColor: '#FFCA28',
                    code: [
                      '// [2D Pixel Outline Shader (4-방향 알파 검출)]',
                      'shader_type canvas_item;',
                      'uniform vec4 line_color : source_color = vec4(1.0, 0.85, 0.1, 1.0);',
                      'uniform float line_thickness : hint_range(0.0, 4.0) = 1.0;',
                      '',
                      'void fragment() {',
                      '    vec2 size = TEXTURE_PIXEL_SIZE * line_thickness;',
                      '    float outline = texture(TEXTURE, UV + vec2(-size.x, 0)).a;',
                      '    outline += texture(TEXTURE, UV + vec2(size.x, 0)).a;',
                      '    outline += texture(TEXTURE, UV + vec2(0, -size.y)).a;',
                      '    outline += texture(TEXTURE, UV + vec2(0, size.y)).a;',
                      '    outline = min(outline, 1.0);',
                      '    vec4 color = texture(TEXTURE, UV);',
                      '    COLOR = mix(color, line_color, outline - color.a);',
                      '}'
                    ].join('\n')
                  },
                  dissolve: {
                    title: '🔥 몬스터 사망 불타는 디졸브 (Noise Dissolve)',
                    badge: '보스 연출',
                    desc: '노이즈 텍스처 임계값(Threshold)과 불꽃 경계선 색상(Edge Emission)을 이용해 적이 타들어가며 소멸합니다.',
                    previewColor: '#F97316',
                    code: [
                      '// [Dissolve Effect with Glowing Edge]',
                      'shader_type canvas_item;',
                      'uniform sampler2D noise_tex;',
                      'uniform float dissolve_value : hint_range(0.0, 1.0) = 0.45;',
                      'uniform float edge_width = 0.06;',
                      'uniform vec4 burn_color : source_color = vec4(1.0, 0.35, 0.0, 1.0);',
                      '',
                      'void fragment() {',
                      '    vec4 main_tex = texture(TEXTURE, UV);',
                      '    float noise = texture(noise_tex, UV).r;',
                      '    if (noise < dissolve_value) discard;',
                      '    float is_edge = step(noise, dissolve_value + edge_width);',
                      '    COLOR = mix(main_tex, burn_color * 2.5, is_edge);',
                      '    COLOR.a = main_tex.a;',
                      '}'
                    ].join('\n')
                  },
                  hologram: {
                    title: '🌐 사이버펑크 홀로그램 & 주사선 글리치 (Hologram)',
                    badge: 'SF/UI 연출',
                    desc: '시간(TIME)에 따라 흐르는 가로 스캔라인과 청록색 발광 효과를 결합해 SF 홀로그램 NPC나 통신창을 만듭니다.',
                    previewColor: '#00E5FF',
                    code: [
                      '// [Sci-Fi Hologram Scanline Shader]',
                      'shader_type canvas_item;',
                      'uniform vec4 holo_color : source_color = vec4(0.0, 0.9, 1.0, 0.75);',
                      'uniform float scanline_count = 80.0;',
                      'uniform float speed = 3.0;',
                      '',
                      'void fragment() {',
                      '    vec4 tex = texture(TEXTURE, UV);',
                      '    float scan = sin((UV.y + TIME * 0.1 * speed) * scanline_count * 3.14159);',
                      '    scan = (scan * 0.25) + 0.75;',
                      '    COLOR = vec4(mix(tex.rgb, holo_color.rgb, 0.65) * scan, tex.a * holo_color.a);',
                      '}'
                    ].join('\n')
                  },
                  water: {
                    title: '🌊 2D 물결 흔들림 & 잔잔한 파동 (2D Wave Distortion)',
                    badge: '배경/환경',
                    desc: '삼각함수(sin/cos)로 UV 좌표를 미세하게 왜곡시켜 강물, 해저 던전, 아지랑이 열기 효과를 구현합니다.',
                    previewColor: '#3B82F6',
                    code: [
                      '// [2D Water / Heat Haze UV Wave Distortion]',
                      'shader_type canvas_item;',
                      'uniform float wave_speed = 3.5;',
                      'uniform float wave_freq = 18.0;',
                      'uniform float wave_amp = 0.012;',
                      '',
                      'void fragment() {',
                      '    vec2 wave_uv = UV;',
                      '    wave_uv.x += sin(UV.y * wave_freq + TIME * wave_speed) * wave_amp;',
                      '    wave_uv.y += cos(UV.x * wave_freq + TIME * wave_speed) * (wave_amp * 0.5);',
                      '    COLOR = texture(TEXTURE, wave_uv);',
                      '}'
                    ].join('\n')
                  }
                };
                const current = recipes[selectedShaderKey] || recipes.hitflash;
                return (
                  <View>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                      {Object.keys(recipes).map((k) => {
                        const r = recipes[k];
                        const active = selectedShaderKey === k;
                        return (
                          <TouchableOpacity
                            key={k}
                            onPress={() => { setSelectedShaderKey(k); setShaderCopied(false); }}
                            style={{
                              paddingHorizontal: 10,
                              paddingVertical: 7,
                              borderRadius: 4,
                              backgroundColor: active ? '#06B6D4' : Theme.colors.pillBg,
                              borderWidth: 1,
                              borderColor: active ? '#FFF' : Theme.colors.border
                            }}
                          >
                            <Text style={{ fontSize: 11.5, fontWeight: '900', color: active ? '#11131C' : '#FFF', fontFamily: 'monospace' }}>
                              {r.title.split(' (')[0]}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    <View style={{ backgroundColor: '#11131C', padding: 12, borderRadius: 6, borderWidth: 1, borderColor: current.previewColor, marginBottom: 10 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <Text style={{ fontSize: 13.5, fontWeight: '900', color: '#FFF' }}>{current.title}</Text>
                        <Text style={{ fontSize: 10.5, fontWeight: '900', color: '#11131C', backgroundColor: current.previewColor, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 3, fontFamily: 'monospace' }}>
                          {current.badge}
                        </Text>
                      </View>
                      <Text style={{ fontSize: 12, color: Theme.colors.textLight, lineHeight: 18 }}>{current.desc}</Text>
                    </View>

                    <View style={{ backgroundColor: '#090B10', padding: 12, borderRadius: 6, borderWidth: 1, borderColor: '#2D3446', marginBottom: 10 }}>
                      <Text style={{ fontSize: 11.5, color: '#67E8F9', fontFamily: 'monospace', lineHeight: 17 }}>{current.code}</Text>
                    </View>

                    <TouchableOpacity
                      onPress={() => { try { navigator?.clipboard?.writeText(current.code); } catch {} setShaderCopied(true); }}
                      style={{ backgroundColor: shaderCopied ? '#10B981' : '#06B6D4', paddingVertical: 12, borderRadius: 4, alignItems: 'center' }}
                    >
                      <Text style={{ color: '#11131C', fontWeight: '900', fontSize: 12.5, fontFamily: 'monospace' }}>
                        {shaderCopied ? '[✅ 셰이더 레시피 코드가 클립보드에 복사되었습니다!]' : '[📋 이 셰이더(Shader) 코드 전체 복사하기]'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })()}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* 인디게임 다국어 번역 시트 생성기 모달 */}
      <Modal visible={locToolOpen} transparent animationType="fade" onRequestClose={() => setLocToolOpen(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 14 }}>
          <View style={{ width: '100%', maxWidth: 680, backgroundColor: Theme.colors.surface, borderRadius: 6, padding: 16, borderColor: '#10B981', borderWidth: 2, maxHeight: '90%' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <Text style={{ fontSize: 15, fontWeight: '900', color: '#34D399', fontFamily: 'monospace' }}>
                🌍 MOD_12 // 인디게임 한·영·일·중 다국어 로컬라이징 시트 생성기
              </Text>
              <TouchableOpacity onPress={() => setLocToolOpen(false)}>
                <Text style={{ color: Theme.colors.textLight, fontWeight: '900', fontSize: 13, fontFamily: 'monospace' }}>[X 닫기]</Text>
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={{ fontSize: 11.5, color: Theme.colors.textLight, marginBottom: 8 }}>
                KEY=한국어 문구 형식으로 입력하면 스팀 글로벌 출시 필수 언어(한국어·영어·일본어·중국어 간체) CSV 및 JSON 테이블로 자동 변환합니다.
              </Text>

              <View style={{ flexDirection: 'row', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
                <TouchableOpacity
                  onPress={() => {
                    setLocInput('UI_START=게임 시작\nUI_CONTINUE=이어하기\nUI_SETTINGS=환경설정\nUI_EXIT=게임 종료\nUI_LANGUAGE=언어 선택\nUI_SAVE=저장 완료');
                    setLocCopied(false);
                  }}
                  style={{ backgroundColor: Theme.colors.pillBg, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 4, borderWidth: 1, borderColor: Theme.colors.border }}
                >
                  <Text style={{ fontSize: 11, color: '#FFF', fontWeight: '800', fontFamily: 'monospace' }}>[프리셋: 타이틀/UI]</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setLocInput('MSG_CRITICAL=치명타 피해!\nMSG_DODGE=회피 성공\nMSG_LEVELUP=레벨 업! 새로운 스킬을 선택하세요.\nMSG_BOSS_WARN=경고! 던전 보스가 출현했습니다.\nMSG_GAMEOVER=전투 불능! 다시 도전하시겠습니까?');
                    setLocCopied(false);
                  }}
                  style={{ backgroundColor: Theme.colors.pillBg, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 4, borderWidth: 1, borderColor: Theme.colors.border }}
                >
                  <Text style={{ fontSize: 11, color: '#FFF', fontWeight: '800', fontFamily: 'monospace' }}>[프리셋: 전투/로그라이크]</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setLocInput('SHOP_BUY=구매하기\nSHOP_SELL=판매하기\nSHOP_NO_GOLD=골드가 부족합니다.\nITEM_POTION=체력 회복 물약\nITEM_SWORD=전설의 용사 검');
                    setLocCopied(false);
                  }}
                  style={{ backgroundColor: Theme.colors.pillBg, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 4, borderWidth: 1, borderColor: Theme.colors.border }}
                >
                  <Text style={{ fontSize: 11, color: '#FFF', fontWeight: '800', fontFamily: 'monospace' }}>[프리셋: 상점/인벤토리]</Text>
                </TouchableOpacity>
              </View>

              <TextInput
                style={{ backgroundColor: Theme.colors.background, borderWidth: 1.5, borderColor: Theme.colors.border, borderRadius: 4, padding: 10, color: '#FFF', minHeight: 110, textAlignVertical: 'top', marginBottom: 10, fontFamily: 'monospace', fontSize: 12 }}
                value={locInput}
                onChangeText={(t) => { setLocInput(t); setLocCopied(false); }}
                multiline
                placeholder="KEY=한국어 텍스트"
                placeholderTextColor={Theme.colors.textLight}
              />

              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
                <TouchableOpacity
                  onPress={() => { setLocFormat('csv'); setLocCopied(false); }}
                  style={{ flex: 1, backgroundColor: locFormat === 'csv' ? '#10B981' : Theme.colors.pillBg, paddingVertical: 8, borderRadius: 4, alignItems: 'center' }}
                >
                  <Text style={{ fontSize: 11.5, fontWeight: '900', color: locFormat === 'csv' ? '#11131C' : '#FFF', fontFamily: 'monospace' }}>
                    [Unity / 구글시트 CSV 포맷]
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => { setLocFormat('json'); setLocCopied(false); }}
                  style={{ flex: 1, backgroundColor: locFormat === 'json' ? '#10B981' : Theme.colors.pillBg, paddingVertical: 8, borderRadius: 4, alignItems: 'center' }}
                >
                  <Text style={{ fontSize: 11.5, fontWeight: '900', color: locFormat === 'json' ? '#11131C' : '#FFF', fontFamily: 'monospace' }}>
                    [Godot / 웹 다국어 JSON 포맷]
                  </Text>
                </TouchableOpacity>
              </View>

              {(() => {
                const dict: Record<string, { en: string; ja: string; zh: string }> = {
                  '게임 시작': { en: 'Start Game', ja: 'ゲーム開始', zh: '开始游戏' },
                  '이어하기': { en: 'Continue', ja: 'つづきから', zh: '继续游戏' },
                  '환경설정': { en: 'Settings', ja: '設定', zh: '游戏设置' },
                  '게임 종료': { en: 'Quit Game', ja: 'ゲーム終了', zh: '退出游戏' },
                  '언어 선택': { en: 'Language', ja: '言語選択', zh: '语言选择' },
                  '저장 완료': { en: 'Game Saved', ja: 'セーブ完了', zh: '保存成功' },
                  '치명타 피해!': { en: 'CRITICAL HIT!', ja: 'クリティカルヒット！', zh: '暴击伤害！' },
                  '회피 성공': { en: 'DODGED!', ja: '回避成功！', zh: '闪避成功' },
                  '레벨 업! 새로운 스킬을 선택하세요.': { en: 'LEVEL UP! Choose a new skill.', ja: 'レベルアップ！新しいスキルを選択してください。', zh: '升级！请选择一个新技能。' },
                  '경고! 던전 보스가 출현했습니다.': { en: 'WARNING! The Dungeon Boss has appeared!', ja: '警告！ダンジョンボスが出現しました！', zh: '警告！地牢首领已出现！' },
                  '전투 불능! 다시 도전하시겠습니까?': { en: 'DEFEATED! Try again?', ja: '戦闘不能！再挑戦しますか？', zh: '战斗不能！是否重新挑战？' },
                  '구매하기': { en: 'Buy', ja: '購入する', zh: '购买' },
                  '판매하기': { en: 'Sell', ja: '売却する', zh: '出售' },
                  '골드가 부족합니다.': { en: 'Not enough Gold.', ja: 'ゴールドが足りません。', zh: '金币不足。' },
                  '체력 회복 물약': { en: 'HP Potion', ja: 'HP回復ポーション', zh: '生命恢复药水' },
                  '전설의 용사 검': { en: 'Legendary Hero Sword', ja: '伝説の勇者の剣', zh: '传说勇者之剑' },
                };

                const rows = locInput.split('\n').map(l => l.trim()).filter(Boolean).map((line, i) => {
                  const eqIdx = line.indexOf('=');
                  const key = eqIdx > 0 ? line.slice(0, eqIdx).trim() : `KEY_${i + 1}`;
                  const ko = eqIdx > 0 ? line.slice(eqIdx + 1).trim() : line;
                  const matched = dict[ko];
                  return {
                    key,
                    ko,
                    en: matched ? matched.en : `[EN] ${ko}`,
                    ja: matched ? matched.ja : `[JA] ${ko}`,
                    zh: matched ? matched.zh : `[ZH] ${ko}`,
                  };
                });

                const output = locFormat === 'csv'
                  ? ['KEY,ko,en,ja,zh-CN', ...rows.map(r => `"${r.key}","${r.ko}","${r.en}","${r.ja}","${r.zh}"`)].join('\n')
                  : JSON.stringify(rows.reduce((acc: any, r) => {
                      acc[r.key] = { ko: r.ko, en: r.en, ja: r.ja, zh_CN: r.zh };
                      return acc;
                    }, {}), null, 2);

                return (
                  <View>
                    <View style={{ backgroundColor: '#090B10', padding: 12, borderRadius: 6, borderWidth: 1, borderColor: '#2D3446', marginBottom: 10 }}>
                      <Text style={{ fontSize: 11.5, color: '#6EE7B7', fontFamily: 'monospace', lineHeight: 17 }}>{output}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => { try { navigator?.clipboard?.writeText(output); } catch {} setLocCopied(true); }}
                      style={{ backgroundColor: locCopied ? '#059669' : '#10B981', paddingVertical: 12, borderRadius: 4, alignItems: 'center' }}
                    >
                      <Text style={{ color: '#11131C', fontWeight: '900', fontSize: 12.5, fontFamily: 'monospace' }}>
                        {locCopied ? '[✅ 다국어 로컬라이징 시트가 복사되었습니다!]' : `[📋 ${locFormat.toUpperCase()} 다국어 번역 데이터 전체 복사하기]`}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })()}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* 레트로 명작 & 인디 도트 컬러 팔레트 도감 모달 */}
      <Modal visible={paletteDexOpen} transparent animationType="fade" onRequestClose={() => setPaletteDexOpen(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 14 }}>
          <View style={{ width: '100%', maxWidth: 660, backgroundColor: Theme.colors.surface, borderRadius: 6, padding: 16, borderColor: '#F43F5E', borderWidth: 2, maxHeight: '90%' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <Text style={{ fontSize: 15, fontWeight: '900', color: '#FB7185', fontFamily: 'monospace' }}>
                🎨 MOD_13 // 레트로 명작 & 인디 도트 컬러 팔레트 도감
              </Text>
              <TouchableOpacity onPress={() => setPaletteDexOpen(false)}>
                <Text style={{ color: Theme.colors.textLight, fontWeight: '900', fontSize: 13, fontFamily: 'monospace' }}>[X 닫기]</Text>
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {(() => {
                const palettes = [
                  {
                    name: 'PICO-8 Fantasy Console (16색)',
                    desc: 'Celeste 클래식 등 전 세계 인디 도트 게임에서 가장 사랑받는 고채도 16색 표준 팔레트',
                    colors: ['#000000', '#1D2B53', '#7E2553', '#008751', '#AB5236', '#5F574F', '#C2C3C7', '#FFF1E8', '#FF004D', '#FFA300', '#FFEC27', '#00E436', '#29ADFF', '#83769C', '#FF77A8', '#FFCCAA']
                  },
                  {
                    name: 'SWEETIE-16 (파스텔 아케이드)',
                    desc: '부드러운 명암 대비로 캐주얼 플랫포머와 아케이드 도트에 최적화된 16색 팔레트',
                    colors: ['#1A1C2C', '#5D275D', '#B13E53', '#EF7D57', '#FFCD75', '#A7F070', '#38B764', '#257179', '#29366F', '#3B5DC9', '#41A6F6', '#73EFF7', '#F4F4F4', '#94B0C2', '#566C86', '#333C57']
                  },
                  {
                    name: 'GAMEBOY DMG-01 & POCKET (8색)',
                    desc: '1989 오리지널 게임보이 올리브 그린 4색 + 포켓 모노크롬 4색 레트로 감성 조합',
                    colors: ['#0F380F', '#306230', '#8BAC0F', '#9BBC0F', '#1B2A0A', '#496B22', '#82A83E', '#C4E070']
                  },
                  {
                    name: 'CYBERPUNK NEON SEOUL (12색)',
                    desc: '산나비·카타나 제로 감성의 네온 마젠타, 시안, 딥 바이올렛 그림자 배색',
                    colors: ['#090A14', '#16132B', '#2B1B4D', '#52196B', '#FF0055', '#FF2A85', '#FF77A8', '#00E5FF', '#0099FF', '#38BDF8', '#FFEA00', '#F8FAFC']
                  },
                  {
                    name: 'DARK SOULS & DUNGEON CRYPT (12색)',
                    desc: '다크 판타지 로그라이크·메트로배니아 지하 묘지 및 횃불 조명 컬러셋',
                    colors: ['#0D0E12', '#181A22', '#262B38', '#3B4254', '#5A6378', '#8B95A8', '#4A1C1C', '#8C2D19', '#D95B26', '#F29F3D', '#FCE29C', '#3B7A57']
                  }
                ];
                const cur = palettes[selectedPaletteIdx] || palettes[0];
                const hexToUnityColor = (hex: string) => {
                  const clean = hex.replace('#', '');
                  const r = (parseInt(clean.substring(0, 2), 16) / 255).toFixed(2);
                  const g = (parseInt(clean.substring(2, 4), 16) / 255).toFixed(2);
                  const b = (parseInt(clean.substring(4, 6), 16) / 255).toFixed(2);
                  return `new Color(${r}f, ${g}f, ${b}f, 1f)`;
                };

                return (
                  <View>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                      {palettes.map((p, idx) => (
                        <TouchableOpacity
                          key={p.name}
                          onPress={() => { setSelectedPaletteIdx(idx); setCopiedColorMsg(''); }}
                          style={{
                            paddingHorizontal: 10,
                            paddingVertical: 6,
                            borderRadius: 4,
                            backgroundColor: selectedPaletteIdx === idx ? '#F43F5E' : Theme.colors.pillBg,
                            borderWidth: 1,
                            borderColor: selectedPaletteIdx === idx ? '#FFF' : Theme.colors.border
                          }}
                        >
                          <Text style={{ fontSize: 11.5, fontWeight: '900', color: '#FFF', fontFamily: 'monospace' }}>
                            {p.name.split(' (')[0]}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <View style={{ backgroundColor: '#11131C', padding: 12, borderRadius: 6, borderWidth: 1, borderColor: '#2D3446', marginBottom: 12 }}>
                      <Text style={{ fontSize: 13.5, fontWeight: '900', color: '#FFF', marginBottom: 4 }}>{cur.name}</Text>
                      <Text style={{ fontSize: 12, color: Theme.colors.textLight }}>{cur.desc}</Text>
                    </View>

                    <Text style={{ fontSize: 11.5, color: '#94A3B8', marginBottom: 8, fontFamily: 'monospace' }}>
                      👇 아래 컬러칩을 클릭하면 #HEX 코드와 Unity C# Color 구조체가 동시에 복사됩니다:
                    </Text>

                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                      {cur.colors.map((hex) => {
                        const csharp = hexToUnityColor(hex);
                        return (
                          <TouchableOpacity
                            key={hex}
                            onPress={() => {
                              const text = `${hex} /* ${csharp} */`;
                              try { navigator?.clipboard?.writeText(text); } catch {}
                              setCopiedColorMsg(`✅ 복사 완료: ${hex}  |  Unity C#: ${csharp}`);
                            }}
                            style={{
                              width: '23%',
                              minWidth: 120,
                              backgroundColor: '#090B10',
                              borderRadius: 6,
                              padding: 8,
                              borderWidth: 1,
                              borderColor: '#2D3446'
                            }}
                          >
                            <View style={{ height: 36, backgroundColor: hex, borderRadius: 4, marginBottom: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' }} />
                            <Text style={{ fontSize: 12, fontWeight: '900', color: '#FFF', fontFamily: 'monospace' }}>{hex}</Text>
                            <Text style={{ fontSize: 9.5, color: '#94A3B8', fontFamily: 'monospace', marginTop: 2 }} numberOfLines={1}>{csharp}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    {copiedColorMsg ? (
                      <View style={{ backgroundColor: '#10B981', padding: 10, borderRadius: 4, marginBottom: 10, alignItems: 'center' }}>
                        <Text style={{ color: '#11131C', fontWeight: '900', fontSize: 12, fontFamily: 'monospace' }}>{copiedColorMsg}</Text>
                      </View>
                    ) : null}

                    <TouchableOpacity
                      onPress={() => {
                        const allHex = cur.colors.join(', ');
                        try { navigator?.clipboard?.writeText(allHex); } catch {}
                        setCopiedColorMsg(`✅ 팔레트 전체(${cur.colors.length}색) HEX 리스트가 복사되었습니다!`);
                      }}
                      style={{ backgroundColor: '#F43F5E', paddingVertical: 11, borderRadius: 4, alignItems: 'center' }}
                    >
                      <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 12.5, fontFamily: 'monospace' }}>
                        [📋 현재 팔레트 전체 색상 리스트 한 번에 복사하기]
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })()}
            </ScrollView>
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
