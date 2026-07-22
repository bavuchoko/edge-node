# edge-node

외부 그래프 라이브러리 없이 구현한 **노드 연결 에디터**입니다.  
HTML 노드 + SVG 베지어 연결선으로 좌→우 파이프라인 스타일 DAG를 편집할 수 있습니다.

## 시작하기

```bash
npm install
npm run dev
```

| 명령 | 설명 |
|------|------|
| `npm run dev` | 개발 서버 |
| `npm run build` | 프로덕션 빌드 |
| `npm run lint` | Oxlint |
| `npm run preview` | 빌드 결과 미리보기 |

## 기능

- 노드 드래그 이동
- 오른쪽 핸들 → 왼쪽 핸들로 연결 생성
- 연결선 / 노드 선택 후 삭제
- 캔버스 pan / zoom
- 테마로 배경·노드·연결선 스타일 커스터마이징

## 조작

| 동작 | 방법 |
|------|------|
| 노드 이동 | 노드 드래그 |
| 연결 생성 | 오른쪽 핸들을 드래그해 대상 노드의 왼쪽 핸들에 드롭 |
| 선택 | 노드 또는 연결선 클릭 |
| 선택 해제 | 빈 공간 클릭 또는 `Esc` |
| 삭제 | 선택 후 `Delete` / `Backspace` |
| 팬 | 빈 공간 드래그 |
| 줌 | 스크롤 (커서 기준) |

연결 방향은 MVP 기준으로 **오른쪽 → 왼쪽**만 지원합니다.

## 기본 사용

```tsx
import { createDemoGraph, GraphCanvas, type GraphTheme } from './graph'
import './graph/graph.css'

const demo = createDemoGraph()

const theme: GraphTheme = {
  background: '#141414',
  edge: { color: '#6b7280', width: 2 },
}

export function App() {
  return <GraphCanvas initialState={demo} theme={theme} />
}
```

`theme`은 선택 사항입니다. 생략하면 기본 다크 테마가 적용됩니다.  
필요한 필드만 넘기면 나머지는 기본값을 유지합니다.

## 테마 (`GraphTheme`)

```ts
type GraphTheme = {
  background?: string
  gridColor?: string   // 'transparent'면 점 그리드 숨김
  gridSize?: number
  node?: {
    background?: string
    border?: string
    borderHover?: string
    borderSelected?: string
    title?: string
    subtitle?: string
    shadow?: string
    radius?: number
    handle?: string
    handleActive?: string
    badgeBackground?: string
    badgeText?: string
    statusSuccess?: string
    statusError?: string
    statusIdle?: string
  }
  edge?: {
    color?: string
    hoverColor?: string
    selectedColor?: string
    width?: number
    hoverWidth?: number
    selectedWidth?: number
    hitWidth?: number      // 클릭 영역(화면 px)
    draftColor?: string    // 연결 드래그 중 임시선
    draftWidth?: number
    draftDash?: string
  }
  hud?: {
    color?: string
  }
}
```

### 예시

```tsx
<GraphCanvas
  initialState={demo}
  theme={{
    background: '#0b1220',
    gridColor: 'transparent',
    node: {
      background: '#111827',
      border: '#374151',
      title: '#f9fafb',
      radius: 10,
    },
    edge: {
      color: '#64748b',
      width: 1.5,
      selectedColor: '#38bdf8',
      selectedWidth: 3,
      hitWidth: 36,
    },
  }}
/>
```

관련 유틸:

- `defaultGraphTheme` — 기본 테마 값
- `resolveGraphTheme(partial?)` — partial을 완전한 테마로 병합

## 그래프 데이터

```ts
type GraphNode = {
  id: string
  position: { x: number; y: number }
  width: number
  height: number
  data: {
    title: string
    subtitle?: string
    status: 'success' | 'error' | 'idle'
    stats?: string
    badge?: string
  }
}

type GraphEdge = {
  id: string
  source: string  // node id
  target: string  // node id
}
```

데모 그래프는 `createDemoGraph()`로 생성합니다.  
초기 배치는 `layoutColumns()`로 열(column) 단위 자동 배치합니다.

## 구조

```
src/graph/
  components/     GraphCanvas, GraphNode, GraphEdge, ConnectionLine
  hooks/          useViewport, useConnectionDrag
  types.ts        데이터 모델
  store.ts        reducer (이동/연결/선택/삭제)
  geometry.ts     핸들 좌표, 베지어 path
  layout.ts       열 레이아웃
  theme.ts        테마 타입·기본값·CSS 변수
  demo.ts         샘플 파이프라인
  graph.css       스타일
```

## 아직 없는 것 (MVP 제외)

미니맵, undo/redo, 스냅/그리드, 다중 선택, 위·아래 핸들, npm 패키지 분리
