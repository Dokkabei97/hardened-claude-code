# Hardened Claude Code

실전 엔터프라이즈 환경에서 단련된 Claude Code 설정.

[English](README.md)

---

## 왜 만들었나

대부분의 Claude Code 설정은 생산성 위주의 설정입니다. 이 설정은 **엔터프라이즈 프로덕션 환경** - 대용량 트래픽 시스템, 대규모 데이터 스트리밍 파이프라인, 잘못된 에이전트 설정 하나가 실제 장애로 이어지는 인프라에서 만들어졌습니다.

이런 환경에서 수년간 개발하면서, 다음과 같은 Claude Code 설정이 필요했습니다:

- **실수를 사전에 차단** - 위험한 명령어를 블록하고, 포맷팅을 강제하고, 컴파일 오류를 실시간으로 검증하는 훅
- **멀티 스택 지원** - Kotlin/Spring Boot, TypeScript/Next.js, Python/FastAPI를 하나의 워크플로우에서
- **AI 생산성과 개발자 성장의 균형** - 모든 사고를 AI에 위임하면 엔지니어로서 퇴화하니까

## 영감을 준 것들

이 프로젝트는 여러 소스에서 영감을 받았습니다:

- **[Advent of Claude 2025](https://adocomplete.com/advent-of-claude-2025/)** - Ado Kukic의 31일간 Claude Code 베스트 프랙티스 가이드. 훅, 서브에이전트, 세션 관리, 그리고 인간-AI 협업 철학에 대한 실용적인 팁
- **[Everything Claude Code](https://github.com/affaan-m/everything-claude-code)** - Anthropic 해커톤 우승 설정. 에이전트, 스킬, 커맨드를 대규모로 활용하는 것이 어떤 것인지 보여줌
- **Boris Cherny의 팁** - Anthropic의 Claude Code 팀 개발자인 Boris Cherny가 공유한 실용적인 Claude Code 팁
- **시니어 개발자 피드백** - 실무 코드 리뷰 피드백이 아키텍처 리뷰와 성능 리뷰 워크플로우의 형태를 만듦

결과물은 의견이 뚜렷하고 실전에서 검증된 설정입니다. 범용 스타터 킷이 아닙니다.

---

## 구성 요소

```
hardened-claude-code/
├── .claude-plugin/      # 플러그인 매니페스트
│   └── plugin.json
├── agents/              # 4개 전문 리뷰 에이전트
├── commands/            # 9개 슬래시 커맨드
├── skills/              # 7개 지식 기반 스킬 모듈
├── hooks/               # Pre/Post 도구 훅 (안전성 + 품질)
├── output-styles/       # Learning Plus - 교육형 출력 스타일
└── mcp/                 # MCP 서버 설정 (Context7, Playwright, Serena)
```

### 에이전트

집중적인 분석 작업을 수행하는 자율 전문가.

| 에이전트 | 역할 |
|---------|------|
| `arch-reviewer` | 아키텍처 적합성, 의존성 방향, 레이어 위반 분석 |
| `perf-reviewer` | Kotlin, Python, TypeScript 성능 안티패턴 탐지 |
| `e2e-runner` | Playwright E2E 테스트 생성, 실행, 아티팩트 캡처 |
| `tdd-guide` | 테스트 주도 개발 강제 (RED-GREEN-REFACTOR) |

### 커맨드

멀티 스텝 워크플로우를 조율하는 슬래시 커맨드.

| 커맨드 | 역할 |
|--------|------|
| `/analyze` | 종합 코드 분석 + AI 협업 옵션 (Gemini/Copilot/Codex) |
| `/arch-review` | 아키텍처 리뷰 + 건강 점수 (0-100) |
| `/perf-review` | 성능 코드 리뷰 + 안티패턴 탐지 |
| `/tdd` | TDD 워크플로우 강제 + 80%+ 커버리지 목표 |
| `/e2e` | E2E 테스트 생성 및 실행 |
| `/create-flow` | 에이전트, 커맨드, 스킬, 훅의 인터랙티브 스캐폴딩 |
| `/verify-flow` | 컴포넌트 컨벤션 검증 |
| `/handoff` | HANDOFF.md를 통한 세션 컨텍스트 전달 |
| `/obsidian` | 기술 학습 노트 생성 (7종 템플릿) |

### 스킬

상황에 맞게 활성화되는 지식 모듈.

| 스킬 | 역할 |
|------|------|
| `arch-review-guide` | 아키텍처 위반 탐지 빠른 참조 |
| `perf-review-guide` | 성능 안티패턴 체크리스트 |
| `tdd-workflow` | Kotlin + TypeScript TDD 방법론 |
| `flow-scaffolding` | 플러그인 컴포넌트 생성 템플릿 |
| `flow-validation` | 컴포넌트 품질 검증 규칙 |
| `sync-claude-md` | 코드 변경 후 CLAUDE.md 업데이트 필요 여부 자동 감지 |
| `obsidian-tech-note` | Obsidian 노트 템플릿 (개념, 실습, 비교, 트러블슈팅, 패턴, TIL, MOC) |

### 훅

진짜 하드닝은 훅 시스템에서 이루어집니다. 모든 도구 사용 시 자동으로 실행됩니다.

**PreToolUse:**
- tmux 외부에서 dev 서버 실행 차단 (고아 프로세스 방지)
- 장시간 명령어에 대한 tmux 사용 리마인더
- `git push` 전 리뷰 리마인더
- 불필요한 문서 파일 생성 차단

**PostToolUse:**
- 편집 후 Prettier로 JS/TS 자동 포맷팅
- 편집 후 ktlint로 Kotlin 자동 포맷팅
- `.ts/.tsx` 편집 후 TypeScript 타입 체크
- `.kt/.kts` 편집 후 Kotlin 컴파일 체크
- `.py` 편집 후 Python 구문 체크
- 코드에 남은 `console.log` / `println()` / `print()` 경고
- PR/MR 생성 후 URL 로깅 (GitHub + GitLab)
- 비동기 빌드 분석 훅

### 출력 스타일: Learning Plus

이 설정에서 가장 의도적으로 만든 부분입니다.

문제: **AI 에이전트에 과도하게 의존하면 단기 생산성은 올라가지만 엔지니어링 실력은 퇴화합니다.** AI가 모든 것을 처리하니까 설계 결정, 에러 핸들링 전략, 알고리즘 선택에 대해 생각하지 않게 됩니다.

Learning Plus는 모든 코드를 **보일러플레이트** 또는 **핵심 로직**으로 분류합니다:

- **보일러플레이트** (DTO, 설정, CRUD, import) → 간결한 인사이트와 함께 즉시 자동 완성
- **핵심 로직** (비즈니스 규칙, 알고리즘, 에러 전략, 보안) → 가이드된 컨텍스트와 함께 직접 작성

"함께 만들기" 포맷은 맥락을 제공하고, 정확한 위치를 알려주고, 트레이드오프를 설명합니다 - 하지만 결정과 코드 작성은 당신이 합니다. 기계적인 부분에서는 빠르게 진행하면서도 핵심 역량은 유지할 수 있습니다.

### MCP 서버

사전 구성된 MCP 서버 연결:

| 서버 | 역할 |
|------|------|
| Context7 | 최신 라이브러리 문서 및 코드 예제 |
| Playwright | E2E 테스트를 위한 브라우저 자동화 |
| Serena | LSP 기반 심볼 네비게이션으로 시맨틱 코드 분석 |

---

## 설치

### 플러그인으로 설치 (권장)

```bash
# 1. 마켓플레이스 추가 (Dokkabei97의 모든 플러그인 포함)
/plugin marketplace add Dokkabei97/claude-plugins

# 2. 플러그인 설치
/plugin install hardened-claude-code
```

> 플러그인 저장소를 직접 추가할 수도 있습니다: `/plugin marketplace add Dokkabei97/hardened-claude-code`

끝입니다. 모든 에이전트, 커맨드, 스킬, 훅, 출력 스타일이 자동으로 사용 가능합니다.

### 로컬 개발

설치 전 로컬에서 테스트:
```bash
git clone https://github.com/Dokkabei97/hardened-claude-code.git
claude --plugin-dir ./hardened-claude-code
```

> **참고:** 일부 훅은 프로젝트에 설치되어 있어야 하는 특정 도구(Prettier, ktlint, gradlew)를 참조합니다.

---

## 커스터마이즈

이 설정은 의도적으로 주관적입니다. 필요에 맞게 조정하세요:

- **불필요한 훅 제거** - Kotlin을 사용하지 않으면 ktlint/gradle 훅을 제거
- **Learning Plus 스타일 조정** - 성장하고 싶은 영역에 따라 보일러플레이트와 핵심 로직 카테고리를 이동
- **자신만의 커맨드 추가** - `/create-flow`로 컨벤션을 따르는 새 컴포넌트를 스캐폴딩
- **변경사항 검증** - `/verify-flow`로 컴포넌트를 프로젝트 표준에 맞게 점검

---

## 철학

이 설정을 이끄는 세 가지 원칙:

1. **기본값은 안전** - 훅이 일반적인 실수를 자동으로 잡습니다. 코드 포맷팅이나 디버그 구문 푸시 방지를 기억할 필요가 없어야 합니다.

2. **멀티 스택 지원** - 엔터프라이즈 환경에서 단일 언어만 사용하는 경우는 드뭅니다. 모든 에이전트, 스킬, 훅이 Kotlin, TypeScript, Python 워크플로우를 지원합니다.

3. **배우면서 배포하기** - Learning Plus 출력 스타일이 존재하는 이유는, 최고의 엔지니어는 코드가 *동작한다는 것*만이 아니라 *왜 동작하는지*를 이해하기 때문입니다. AI는 당신의 실력을 대체하는 것이 아니라 증폭시켜야 합니다.

---

## 기여하기

새로운 훅, 에이전트, 커맨드, 버그 수정 등 모든 기여를 환영합니다!

### 시작하기

```bash
# Fork 후 클론
git clone https://github.com/<your-username>/hardened-claude-code.git
cd hardened-claude-code

# 로컬 테스트
claude --plugin-dir .
```

### 컴포넌트 추가

프로젝트 컨벤션을 따르는 스캐폴딩 도구를 활용하세요:

```bash
# 새 에이전트, 커맨드, 스킬, 훅 생성
claude /create-flow

# 컴포넌트 검증
claude /verify-flow
```

### 프로젝트 구조

| 디렉토리 | 용도 |
|----------|------|
| `agents/` | 자율 리뷰/분석 에이전트 (`.md`) |
| `commands/` | 멀티 스텝 워크플로우 슬래시 커맨드 (`.md`) |
| `skills/` | 상황별 지식 모듈 (`SKILL.md` + 참조 파일) |
| `hooks/` | Pre/Post 도구 훅 (`hooks.json` - 인라인만) |
| `output-styles/` | 출력 스타일 정의 (`.md`) |
| `mcp/` | MCP 서버 설정 (`.json`) |

### 가이드라인

- **훅은 반드시 인라인** - `node -e "..."` 명령어만 사용. 외부 스크립트 참조 불가.
- **멀티 스택 지원** - 새 에이전트, 커맨드, 훅은 가능한 Kotlin, TypeScript, Python을 모두 지원.
- **제출 전 테스트** - `claude --plugin-dir .`로 변경사항이 올바르게 동작하는지 확인.
- **하나의 역할에 집중** - 각 컴포넌트는 하나의 일을 잘 수행해야 합니다. 관련 없는 기능 결합 지양.

### PR 프로세스

1. `main`에서 feature 브랜치 생성
2. `/create-flow`로 컴포넌트 추가
3. `/verify-flow`로 검증
4. `claude --plugin-dir .`로 로컬 테스트
5. 컴포넌트의 역할과 필요성을 명확히 설명하는 PR 제출

---

## 라이선스

MIT
