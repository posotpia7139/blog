---
title: Markdown Extended Features
published: 2024-05-01
updated: 2024-11-29
description: 'Read more about Markdown features in Fuwari'
image: ''
tags: [Demo, Example, Markdown, Fuwari]
draft: false 
---

## GitHub Repository Cards
You can add dynamic cards that link to GitHub repositories, on page load, the repository information is pulled from the GitHub API. 

::github{repo="Fabrizz/MMM-OnSpotify"}

Create a GitHub repository card with the code `::github{repo="<owner>/<repo>"}`.

```markdown
::github{repo="saicaca/fuwari"}
```

## Admonitions

Following types of admonitions are supported: `note` `tip` `important` `warning` `caution`

:::note
대충 훑어보더라도 사용자가 반드시 알아야 할 정보를 강조합니다.
:::

:::tip
사용자가 더 잘 활용할 수 있도록 돕는 선택적 정보입니다.
:::

:::important
사용자의 성공에 필수적인 핵심 정보입니다.
:::

:::warning
잠재적 위험으로 인해 사용자의 즉각적인 주의가 필요한 중요 콘텐츠입니다.
:::

:::caution
어떤 행동이 가져올 수 있는 부정적인 잠재적 결과.
:::

### Basic Syntax

```markdown
:::note
Highlights information that users should take into account, even when skimming.
:::

:::tip
Optional information to help a user be more successful.
:::
```

### Custom Titles

The title of the admonition can be customized.

:::note[MY CUSTOM TITLE]
This is a note with a custom title.
:::

```markdown
:::note[MY CUSTOM TITLE]
This is a note with a custom title.
:::
```

### GitHub Syntax

> [!TIP]
> [The GitHub syntax](https://github.com/orgs/community/discussions/16925) is also supported.

```
> [!NOTE]
> The GitHub syntax is also supported.

> [!TIP]
> The GitHub syntax is also supported.
```

### Spoiler

You can add spoilers to your text. The text also supports **Markdown** syntax.

The content :spoiler[is hidden **ayyy**]!

```markdown
The content :spoiler[is hidden **ayyy**]!

```