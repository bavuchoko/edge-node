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
import { createInitialState, GraphCanvas, layoutColumns } from 'edge-node'
import 'edge-node/style.css'

const initialState = createInitialState(
  layoutColumns([
    { id: 'build', column: 0, row: 0, data: { title: 'Build', status: 'success' } },
    { id: 'deploy', column: 1, row: 0, data: { title: 'Deploy', status: 'idle' } },
  ]),
  [{ source: 'build', target: 'deploy', kind: 'required', label: 'artifact' }],
)

export function App() {
  return <GraphCanvas initialState={initialState} colorMode="system" />
}
```

## 편집 모드 (`editable`)

```tsx
<GraphCanvas initialState={initialState} editable />
```

| `editable` | 동작 |
|------------|------|
| `true` | 편집 모드: 노드 이동, 연결 추가·수정·삭제 |
| `false` (기본값) | 보기 모드: 노드 클릭으로 세부정보 펼치기/접기 |

팬·줌과 호버 시 의존관계 강조는 두 모드 모두에서 동작합니다.

- 편집 → 보기로 바꾸면 열려 있던 연결선 편집 창이 닫히면서 그때까지의 변경이 확정됩니다.
- 보기 → 편집으로 바꾸면 펼쳐져 있던 세부정보가 접힙니다.

## 노드 세부정보 (`details` / `renderNodeDetails`)

보기 모드(`editable={false}`)에서 노드의 내용 영역을 클릭하거나 오른쪽 위 ⌄ 버튼을 누르면
세부정보가 펼쳐지고, 다시 누르면 접힙니다. 편집 모드에서는 클릭이 선택·이동에 쓰이므로 펼쳐지지 않습니다.

기본으로는 `data.details`를 라벨/값 목록으로 보여줍니다. `details`가 없는 노드는 펼칠 수 없습니다.

```ts
{
  id: 'build',
  data: {
    title: 'Build',
    status: 'success',
    details: [
      { label: 'Commit', value: 'a3f9c21' },
      { label: 'Duration', value: '4m 12s' },
    ],
  },
}
```

API에서 조회해야 하면 `renderNodeDetails`로 직접 그립니다. 펼쳐질 때만 렌더링되므로,
반환한 컴포넌트가 마운트될 때 데이터를 불러오면 됩니다. 이 prop을 주면 모든 노드를 펼칠 수 있습니다.

```tsx
function NodeDetails({ id }: { id: string }) {
  const [detail, setDetail] = useState<Record<string, string> | null>(null)
  useEffect(() => {
    fetch(`/api/nodes/${id}`).then((r) => r.json()).then(setDetail)
  }, [id])
  if (!detail) return <span>Loading…</span>
  return <pre>{JSON.stringify(detail, null, 2)}</pre>
}

<GraphCanvas
  initialState={initialState}
  renderNodeDetails={(node) => <NodeDetails id={node.id} />}
/>
```

## 변경 저장 (`onConnect` / `onEdgeUpdate` / `onEdgeDelete` / `onNodeMove`)

연결선이 생기거나, 바뀌거나, 지워질 때, 그리고 노드를 옮겼을 때 호출됩니다. API로 관계와 배치를 저장할 때 씁니다.

| 콜백 | 호출 시점 |
|------|-----------|
| `onConnect(edge)` | 새 연결 직후 뜨는 편집 창(실선/점선, 라벨)이 닫힐 때(`Enter`, `Esc`, 다른 곳 클릭) 한 번. 닫히기 전에 삭제하면 호출되지 않음 |
| `onEdgeUpdate(edge, previous)` | 기존 연결선을 클릭해 연 편집 창이 닫힐 때, `kind`·`label`이 실제로 바뀐 경우에만 한 번 |
| `onEdgeDelete(edge)` | 확정된 연결선이 삭제될 때(`Delete` 키, 휴지통 버튼). 노드를 삭제하면 그 노드에 붙은 연결선마다 한 번씩 |
| `onNodeMove(node, previous)` | 노드를 드래그해서 놓을 때 한 번(드래그 중에는 호출 안 됨). 실제로 움직였을 때만. `node.position`이 새 위치 |

```tsx
<GraphCanvas
  initialState={initialState}
  onConnect={async (edge) => {
    const res = await fetch('/api/edges', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(edge),
    })
    if (!res.ok) return false
  }}
  onEdgeUpdate={async (edge) => {
    const res = await fetch(`/api/edges/${encodeURIComponent(edge.id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind: edge.kind, label: edge.label }),
    })
    if (!res.ok) return false
  }}
  onEdgeDelete={async (edge) => {
    const res = await fetch(`/api/edges/${encodeURIComponent(edge.id)}`, { method: 'DELETE' })
    if (!res.ok) return false
  }}
/>
```

- 변경은 화면에 먼저 반영됩니다. `false`를 반환하거나 Promise가 reject되면 되돌립니다
  (연결 → 제거, 수정 → 이전 값, 삭제 → 복원, 이동 → 원래 위치).
- Promise가 끝날 때까지 해당 연결선은 반투명으로 표시됩니다.
- `edge`는 `{ id, source, target, kind?, label? }`이고, target이 source에 의존한다는 뜻입니다.
  `id`는 `` `${source}->${target}` `` 형식입니다.

### 저장한 위치로 불러오기

`layoutColumns`에 `position`을 넘기면 열/행 자동 배치 대신 그 위치를 씁니다.
저장된 위치가 없는 노드만 자동 배치됩니다.

```ts
const saved = await fetch('/api/nodes').then((r) => r.json()) // [{ id, position: { x, y } }, ...]
const positions = new Map(saved.map((n) => [n.id, n.position]))

const nodes = layoutColumns(
  inputs.map((input) => ({ ...input, position: positions.get(input.id) })),
)
```

## 테마 (`GraphTheme`)

`theme`은 선택 사항입니다. 생략하면 `colorMode` 프리셋(기본 다크)이 적용됩니다.  
필요한 필드만 넘기면 나머지는 기본값을 유지합니다.

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
