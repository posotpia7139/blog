# 🍥 후와리 (Fuwari)
![Node.js >= 20](https://img.shields.io/badge/node.js-%3E%3D20-brightgreen) 
![pnpm >= 9](https://img.shields.io/badge/pnpm-%3E%3D9-blue) 

[Astro](https://astro.build)로 제작된 정적 블로그 템플릿입니다.

[**🖥️ 라이브 데모 (Vercel)**](https://fuwari.vercel.app)

![미리보기 이미지](https://raw.githubusercontent.com/saicaca/resource/main/fuwari/home.png)

🌏 다른 언어 읽기:
[**English**](https://github.com/saicaca/fuwari/blob/main/README.md) /
[**中文**](https://github.com/saicaca/fuwari/blob/main/docs/README.zh-CN.md) /
[**日本語**](https://github.com/saicaca/fuwari/blob/main/docs/README.ja.md) /
[**Español**](https://github.com/saicaca/fuwari/blob/main/docs/README.es.md) /
[**ไทย**](https://github.com/saicaca/fuwari/blob/main/docs/README.th.md) /
[**Tiếng Việt**](https://github.com/saicaca/fuwari/blob/main/docs/README.vi.md) /
[**Bahasa Indonesia**](https://github.com/saicaca/fuwari/blob/main/docs/README.id.md)

## ✨ 주요 기능

- [x] [Astro](https://astro.build) 및 [Tailwind CSS](https://tailwindcss.com) 기반 제작
- [x] 부드러운 애니메이션 및 페이지 전환 효과
- [x] 라이트 / 다크 모드 지원
- [x] 테마 색상 및 배너 커스터마이징 가능
- [x] 반응형 디자인 (모바일 지원)
- [x] [Pagefind](https://pagefind.app/)를 활용한 검색 기능
- [x] [확장 마크다운 문법](https://github.com/saicaca/fuwari?tab=readme-ov-file#-markdown-extended-syntax) 지원
- [x] 게시물 목차(TOC) 생성
- [x] RSS 피드 제공

## 🚀 시작하기

1. 블로그 저장소 생성:
    - 이 템플릿에서 [새 저장소 생성](https://github.com/saicaca/fuwari/generate)을 하거나 포크(Fork)합니다.
    - 또는 아래 명령어를 실행합니다:
       ```sh
       pnpm create fuwari@latest
       ```
2. 로컬에서 편집하려면 저장소를 클론하고 `pnpm install`로 의존성을 설치합니다.
3. `src/config.ts` 파일을 수정하여 블로그를 나만의 스타일로 꾸밉니다.
4. `pnpm new-post <파일명>`을 실행하여 새 글을 생성하고 `src/content/posts/`에서 편집합니다.
5. [배포 가이드](https://docs.astro.build/en/guides/deploy/)를 따라 Vercel, Netlify, GitHub Pages 등에 배포합니다. 배포 전 `astro.config.mjs`의 사이트 설정을 확인하세요.

## 📝 포스트 설정 (Frontmatter)

```yaml
---
title: 나의 첫 번째 블로그 글
published: 2023-09-09
description: 새 Astro 블로그의 첫 번째 게시물입니다.
image: ./cover.jpg
tags: [일상, 개발]
category: 프로그래밍
draft: false
lang: ko      # 사이트 기본 언어와 다를 경우에만 설정
---
```

## 🧩 마크다운 확장 문법

기본적인 마크다운 외에도 아래와 같은 추가 기능을 지원합니다:

- 어드모니션 (강조 박스)
- GitHub 저장소 카드
- Expressive Code를 활용한 강력한 코드 블록

## ⚡ 주요 명령어

모든 명령어는 프로젝트 루트 터미널에서 실행합니다:

| 명령어 | 동작 |
|:---|:---|
| `pnpm install` | 의존성 패키지 설치 |
| `pnpm dev` | 로컬 개발 서버 시작 (`localhost:4321`) |
| `pnpm build` | 배포용 사이트 빌드 (`./dist/` 폴더 생성) |
| `pnpm preview` | 배포 전 빌드 결과물 로컬에서 미리보기 |
| `pnpm check` | 코드 오류 검사 실행 |
| `pnpm format` | Biome을 사용한 코드 포맷팅 |
| `pnpm new-post <파일명>` | 새 포스트 생성 |
| `pnpm astro ...` | `astro add`, `astro check` 등 CLI 명령어 실행 |

---

## 🚀 제임스의 블로그 운영 및 최적화

제임스(James)의 블로그 운영 및 성능 개선을 위한 핵심 가이드입니다.

### ⚡ 성능 최적화 (성능)
- **CSS 인라인화:** `astro.config.mjs`에서 `build: { inlineStylesheets: "always" }` 적용. 렌더링 차단 요소를 제거하여 초기 로딩 속도 극대화.
- **애니메이션 최적화:** LCP 요소인 포스트 커버 이미지의 페이드 인 애니메이션을 제거하여 즉시 렌더링되도록 수정.

### 🎨 디자인 및 UI (디자인)
- **아이콘 라이브러리:** Material Symbols (Rounded)
  - 날짜: `calendar-month-rounded`
  - 시간/분: `schedule-rounded`
  - 카테고리/폴더: `folder-open-outline-rounded`
- **색상 지침:** 메타데이터 아이콘 및 텍스트는 차분한 회색(`text-black/50`)을 기본으로 유지.

### 📂 지식 관리 전략 (카테고리 전략)
1. **`fundamentals`**: 근본 원리 이해, CS 기초.
2. **`development`**: MERN 스택 실무, 개발 테크닉.
3. **`systems`**: 시스템 아키텍처, 인프라, 환경 구축.
4. **`game-logic`**: 1인 인디 게임 제작을 위한 기술적 토대.
5. **`meta`**: 도구 활용 및 운영 지식.
> **팁:** 세부 기술(React, Node 등)은 폴더 대신 **태그(#)**로 관리.

---

## 🧩 마크다운 확장 가이드 (제임스 마스터 가이드)

블로그 운영에 필요한 모든 마크다운 문법과 특수 기능의 **코드 & 결과** 예시입니다.

### 1. 게시물 설정 상세
| 항목 | 설명 |
| :--- | :--- |
| `title` | 포스트의 메인 제목 |
| `published` | 게시 날짜 (YYYY-MM-DD) |
| `description` | 카드 및 검색 결과에 노출될 요약 설명 |
| `image` | 포스트 상단 커버 이미지 경로 |
| `tags` | 세부 분류 태그 (검색 및 필터링 연동) |
| `category` | 사이드바 카테고리 (계층형 구조 지원) |

### 2. 기본 문법 및 각주
- **텍스트 스타일:** `**굵게**`, `*기울임*`, `~~취소선~~`
- **각주 (🚀 호버 툴팁 지원):**
  - **코드:** `본문입니다.[^1]` / `[^1]: 내용`
  - **결과:** 본문 숫자 위에 마우스를 올리면 내용이 팝업으로 나타납니다.

### 3. 시각적 컴포넌트
#### 📘 어드모니션 (강조 박스)
- **코드:** `:::note[알림] 
 내용 
 :::`
- **결과:** 블로그에서 컬러 박스로 강조되어 표시됩니다. (`tip`, `important` 등 가능)

#### 🐙 GitHub 저장소 카드
- **코드:** `::github{repo="사용자/저장소"}`
- **결과:** 저장소 정보가 포함된 세련된 카드가 생성됩니다.

#### 🕵️ 스포일러 (Spoiler)
- **코드:** `:spoiler[비밀 내용]`
- **결과:** 클릭해야 내용이 나타나는 가림막 효과가 적용됩니다.

### 4. 코드 블록 및 멀티미디어
- **코드 강조:** 파일명 표시, 줄 번호, 특정 라인 강조 등을 지원합니다.
- **유튜브:** 표준 `iframe` 태그를 사용하여 영상을 본문에 삽입할 수 있습니다.

**가장 중요한 요약:** 블로그의 모든 안내와 운영 정보를 한국어로 완전히 전환하여 가독성과 관리 편의성을 높임.