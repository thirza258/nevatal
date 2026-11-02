---
name: nevatal-chat
description: Discover and call the Nevatal Chat AI tools API
---

# Nevatal Chat Skill

Nevatal Chat is an open-source AI tools hub at https://chat.nevatal.id. It
offers seventeen focused tools — prompting, explaining, writing, rewriting,
proofreading, summarising, copywriting, email drafting, social captions, idea
generation, translation, sentiment analysis, document Q&A, image generation,
CSV data analysis, data formatting and batch runs. Every request runs on the
caller's own OpenAI, Gemini or OpenRouter API key.

## Discovery documents

- API catalog: https://chat.nevatal.id/.well-known/api-catalog
- A2A agent card: https://chat.nevatal.id/.well-known/agent-card.json
- MCP server card: https://chat.nevatal.id/.well-known/mcp/server-card.json
- OAuth authorization server: https://chat.nevatal.id/.well-known/oauth-authorization-server
- OAuth protected resource: https://chat.nevatal.id/.well-known/oauth-protected-resource
- Agent skills index: https://chat.nevatal.id/.well-known/agent-skills/index.json
- Authentication guide: https://chat.nevatal.id/auth.md

## Calling the API

The tool API is served under https://chat.nevatal.id/api/v1/. Each tool is a
POST endpoint such as `/api/v1/prompt/`, `/api/v1/summarizer/`,
`/api/v1/translator/` or `/api/v1/document/rag-chat/`. Requests carry the
caller's provider API key; there is no shared account or subscription.

## Public pages

- Home: https://chat.nevatal.id/
- About: https://chat.nevatal.id/about
- Courses: https://chat.nevatal.id/courses
- Sitemap: https://chat.nevatal.id/sitemap.xml
