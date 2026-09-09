# Genie Assistant — SAC Custom Widget v0.1.0

## Purpose

A first-pass SAP Analytics Cloud Custom Widget that provides a native SAC-side chat UI and communicates with the existing Databricks Finance Genie Flask application.

The widget sends only a plain-English `message` plus a local `session_id` to the backend. It does not contain Databricks credentials, Supervisor credentials, or Genie credentials.

## Backend contract used by this version

### Start request

`POST {backendUrl}/api/chat`

```json
{
  "message": "What are the top 10 GL accounts by movement?",
  "session_id": "<32-character-session-id>"
}
```

Expected response:

```json
{
  "request_id": "<12-character-request-id>",
  "session_id": "<32-character-session-id>",
  "status": "processing",
  "api_mode": "agent_mode"
}
```

### Poll request

`GET {backendUrl}/api/chat/status/{request_id}`

Processing response:

```json
{
  "status": "processing"
}
```

Completed response is expected to contain:

```json
{
  "success": true,
  "session_id": "...",
  "genie_conversation_id": "...",
  "message": {
    "text": "...",
    "sql": "...",
    "table": { "columns": [], "rows": [] },
    "visualizations": [],
    "suggested_questions": []
  }
}
```

## SAC installation

Upload `GenieWidget.json` through the SAC Custom Widget area. The JSON references `./GenieWidget.js`.

Set the widget's `backendUrl` property to the deployed Databricks App URL.

## Important

The Databricks client ID/secret, OAuth token, Supervisor endpoint, and Genie Agent/Space configuration stay in the Databricks backend. They must not be placed in this SAC widget.

CORS is expected to be configured on the Databricks App. If SAC still reports a cross-origin error, troubleshoot CORS after the widget itself is installed and tested.
# GenieWidget
