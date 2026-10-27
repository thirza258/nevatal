# auth.md

## Overview

Welcome to the Nevatal Chat Agent Authentication and Registration Guide.
This document outlines the authentication procedures, registration endpoints,
and supported credential mechanisms for autonomous AI agents interacting with
Nevatal Chat services.

Nevatal Chat is a bring-your-own-key AI tools hub. The web application stores
the visitor's OpenAI, Google Gemini or OpenRouter API key in the browser and
uses it for each request; there is no shared account or subscription. The
tool API under `/api/v1/` follows the same model.

## Audience

This guide is intended for AI agents, automated systems, and client
integrations connecting to the Nevatal Chat APIs.

## Metadata & Discovery Endpoints

- OAuth Protected Resource Metadata: https://chat.nevatal.id/.well-known/oauth-protected-resource
- OAuth 2.0 Authorization Server Metadata: https://chat.nevatal.id/.well-known/oauth-authorization-server
- OpenID Connect Discovery: https://chat.nevatal.id/.well-known/openid-configuration
- API Catalog: https://chat.nevatal.id/.well-known/api-catalog
- A2A Agent Card: https://chat.nevatal.id/.well-known/agent-card.json
- MCP Server Card: https://chat.nevatal.id/.well-known/mcp/server-card.json
- Agent Skills Index: https://chat.nevatal.id/.well-known/agent-skills/index.json

## Registration Flow

Agents can register dynamically or provision access via the registration
endpoints:

- Registration URI: https://chat.nevatal.id/api/v1/agent/register
- Claim URI: https://chat.nevatal.id/api/v1/agent/claim
- Revocation URI: https://chat.nevatal.id/api/v1/agent/revoke

### Step 1: Agent Registration Request

To register an agent, submit a POST request to the registration endpoint:

```http
POST /api/v1/agent/register HTTP/1.1
Host: chat.nevatal.id
Content-Type: application/json

{
  "client_name": "ExampleAgent",
  "identity_type": "anonymous"
}
```

### Step 2: Response with Credentials

The server returns client credentials and a token:

```http
HTTP/1.1 201 Created
Content-Type: application/json

{
  "client_id": "agent-client-id-xyz",
  "token_type": "Bearer",
  "access_token": "sample_agent_token"
}
```

## Supported Authentication Methods

1. Anonymous Agent Access:
   - Identity Types: anonymous
   - Credential Types: api_key, bearer_token
   - Claim URI: https://chat.nevatal.id/api/v1/agent/claim

2. Verified Email Identity:
   - Assertion Types: verified_email
   - Credential Types: api_key, bearer_token
   - Claim URI: https://chat.nevatal.id/api/v1/agent/claim

3. ID-JAG (Identity Assertion):
   - Assertion Type: urn:ietf:params:oauth:token-type:id-jag
   - Identity Types: identity_assertion
   - Credential Types: bearer_token
   - Revocation Event: revocation
   - Revocation URI: https://chat.nevatal.id/api/v1/agent/revoke

## Credential Use

To access protected endpoints, include the issued token in the Authorization
HTTP request header:

```http
Authorization: Bearer <your-token>
```

Tool endpoints also accept the caller's provider API key, which is the
credential the web application uses. Never send a provider key to a host other
than chat.nevatal.id.
