(function () {
  class GenieWidget extends HTMLElement {
    constructor() {
      super();

      this.attachShadow({
        mode: "open",
      });

      /* =========================================================
         PROPERTIES
         ========================================================= */

      this._props = {
        backendUrl: "",
        workspaceHost: "",
        clientId: "",
        clientSecret: "",
        oauthScope: "all-apis",

        // Runtime OAuth token.
        // This is generated automatically and is not persisted.
        accessToken: "",
      };

      /* =========================================================
         SESSION
         ========================================================= */

      this._sessionId = this._generateSessionId();

      this._currentRequestId = null;

      this._pollTimer = null;

      this._isWaiting = false;

      /* =========================================================
         UI
         ========================================================= */

      this.shadowRoot.innerHTML = `
        <style>

          :host {
            display: block;
            width: 100%;
            height: 100%;
            box-sizing: border-box;

            font-family:
              Arial,
              Helvetica,
              sans-serif;
          }

          * {
            box-sizing: border-box;
          }

          /* =====================================================
             CONTAINER
             ===================================================== */

          .container {
            width: 100%;
            height: 100%;
            min-height: 350px;

            display: flex;
            flex-direction: column;

            background: #ffffff;

            border: 1px solid #d9d9d9;
            border-radius: 8px;

            overflow: hidden;
          }

          /* =====================================================
             HEADER
             ===================================================== */

          .header {
            height: 48px;
            min-height: 48px;

            display: flex;
            align-items: center;
            justify-content: space-between;

            padding: 0 16px;

            border-bottom: 1px solid #e5e5e5;

            background: #ffffff;
          }

          .title {
            font-size: 15px;
            font-weight: 600;
            color: #222222;
          }

          .status {
            display: flex;
            align-items: center;

            gap: 6px;

            font-size: 12px;

            color: #777777;
          }

          .status-dot {
            width: 7px;
            height: 7px;

            border-radius: 50%;

            background: #999999;
          }

          .status.ready .status-dot {
            background: #3a9b5f;
          }

          .status.busy .status-dot {
            background: #d99b00;
          }

          .status.error .status-dot {
            background: #d64545;
          }

          /* =====================================================
             CHAT
             ===================================================== */

          .chat {
            flex: 1;

            overflow-y: auto;

            padding: 16px;

            background: #fafafa;
          }

          .welcome {
            text-align: center;

            margin-top: 40px;

            color: #777777;

            font-size: 14px;
          }

          .welcome-title {
            font-size: 18px;
            font-weight: 600;

            color: #333333;

            margin-bottom: 8px;
          }

          /* =====================================================
             MESSAGE
             ===================================================== */

          .message {
            display: flex;

            margin-bottom: 14px;
          }

          .message.user {
            justify-content: flex-end;
          }

          .message.assistant {
            justify-content: flex-start;
          }

          .bubble {
            max-width: 88%;

            padding: 11px 13px;

            border-radius: 10px;

            font-size: 14px;

            line-height: 1.5;

            white-space: normal;

            word-wrap: break-word;

            overflow-wrap: anywhere;
          }

          .user .bubble {
            background: #e8f0fe;

            color: #222222;

            border-bottom-right-radius: 3px;
          }

          .assistant .bubble {
            background: #ffffff;

            color: #222222;

            border: 1px solid #e2e2e2;

            border-bottom-left-radius: 3px;
          }

          .error-bubble {
            background: #fff1f1 !important;

            border-color: #efb0b0 !important;

            color: #9b2525 !important;
          }

          /* =====================================================
             TEXT FORMATTING
             ===================================================== */

          .bubble p {
            margin: 0 0 9px;
          }

          .bubble p:last-child {
            margin-bottom: 0;
          }

          .bubble ul,
          .bubble ol {
            margin: 6px 0 10px 21px;

            padding: 0;
          }

          .bubble li {
            margin: 4px 0;
          }

          .bubble strong {
            font-weight: 700;
          }

          .bubble em {
            font-style: italic;
          }

          .bubble code {
            padding: 2px 5px;

            border-radius: 4px;

            background: #f1f3f5;

            color: #333333;

            font-family:
              Consolas,
              Monaco,
              monospace;

            font-size: 0.9em;
          }

          .md-h1,
          .md-h2,
          .md-h3 {
            margin: 3px 0 9px;

            line-height: 1.3;

            color: #222222;
          }

          .md-h1 {
            font-size: 18px;
            font-weight: 700;
          }

          .md-h2 {
            font-size: 16px;
            font-weight: 700;
          }

          .md-h3 {
            font-size: 14px;
            font-weight: 700;
          }

          .md-codeblock {
            margin: 9px 0;

            padding: 10px;

            border-radius: 6px;

            background: #1e1e1e;

            color: #f5f5f5;

            overflow-x: auto;

            font-family:
              Consolas,
              Monaco,
              monospace;

            font-size: 11px;

            line-height: 1.5;
          }

          .bubble hr {
            border: 0;

            border-top: 1px solid #e5e5e5;

            margin: 11px 0;
          }

          /* =====================================================
             VISUALIZATION
             ===================================================== */

          .visualization-container {
            margin-top: 14px;

            padding: 10px;

            border: 1px solid #e5e5e5;

            border-radius: 8px;

            background: #ffffff;
          }

          .visualization-header {
            display: flex;

            align-items: center;

            justify-content: space-between;

            gap: 8px;

            margin-bottom: 8px;
          }

          .visualization-title {
            font-size: 12px;

            font-weight: 600;

            color: #333333;

            overflow: hidden;

            text-overflow: ellipsis;

            white-space: nowrap;
          }

          .chart-type {
            font-size: 10px;

            color: #777777;

            white-space: nowrap;
          }

          .chart-toolbar {
            display: flex;

            flex-wrap: wrap;

            gap: 5px;

            margin-bottom: 8px;
          }

          .chart-button {
            border: 1px solid #d6d6d6;

            background: #ffffff;

            color: #555555;

            border-radius: 4px;

            padding: 4px 8px;

            font-size: 10px;

            cursor: pointer;
          }

          .chart-button:hover {
            background: #f5f5f5;
          }

          .chart-button.active {
            background: #333333;

            border-color: #333333;

            color: #ffffff;
          }

          .chart-wrap {
            width: 100%;

            min-height: 230px;

            overflow: hidden;
          }

          .chart-wrap svg {
            display: block;

            width: 100%;

            height: auto;

            min-height: 230px;
          }

          .chart-empty {
            min-height: 120px;

            display: flex;

            align-items: center;

            justify-content: center;

            color: #888888;

            font-size: 12px;

            text-align: center;
          }

          /* =====================================================
             TABLE
             ===================================================== */

          .table-container {
            margin-top: 12px;

            overflow-x: auto;

            border: 1px solid #e0e0e0;

            border-radius: 6px;
          }

          table {
            border-collapse: collapse;

            width: 100%;

            font-size: 12px;

            background: #ffffff;
          }

          th,
          td {
            border-bottom: 1px solid #e5e5e5;

            padding: 7px 9px;

            text-align: left;

            white-space: nowrap;
          }

          th {
            background: #f4f4f4;

            font-weight: 600;

            color: #333333;
          }

          tbody tr:last-child td {
            border-bottom: none;
          }

          tbody tr:hover {
            background: #fafafa;
          }

          /* =====================================================
             SQL
             ===================================================== */

          .sql-container {
            margin-top: 11px;
          }

          .sql-toggle {
            display: inline-block;

            cursor: pointer;

            font-size: 11px;

            color: #666666;

            user-select: none;
          }

          .sql-toggle:hover {
            color: #222222;
          }

          .sql {
            display: none;

            margin-top: 6px;

            padding: 10px;

            background: #1e1e1e;

            color: #f5f5f5;

            border-radius: 5px;

            overflow-x: auto;

            font-family:
              Consolas,
              Monaco,
              monospace;

            font-size: 11px;

            line-height: 1.5;

            white-space: pre-wrap;
          }

          .sql.visible {
            display: block;
          }

          /* =====================================================
             INPUT
             ===================================================== */

          .input-area {
            border-top: 1px solid #e5e5e5;

            padding: 10px;

            background: #ffffff;

            display: flex;

            gap: 8px;
          }

          .input {
            flex: 1;

            min-width: 0;

            resize: none;

            height: 42px;

            max-height: 100px;

            padding: 10px 12px;

            border: 1px solid #cccccc;

            border-radius: 6px;

            outline: none;

            font-family: inherit;

            font-size: 14px;
          }

          .input:focus {
            border-color: #888888;
          }

          .send {
            width: 70px;

            border: none;

            border-radius: 6px;

            background: #333333;

            color: white;

            font-size: 13px;

            cursor: pointer;
          }

          .send:hover {
            background: #222222;
          }

          .send:disabled {
            background: #aaaaaa;

            cursor: not-allowed;
          }

          /* =====================================================
             CLEAR
             ===================================================== */

          .clear {
            position: absolute;

            right: 10px;

            bottom: 62px;

            border: none;

            background: transparent;

            color: #777777;

            font-size: 11px;

            cursor: pointer;

            display: none;
          }

          .clear:hover {
            color: #333333;
          }

          /* =====================================================
             TYPING
             ===================================================== */

          .typing {
            display: inline-flex;

            gap: 3px;

            align-items: center;
          }

          .typing span {
            width: 5px;

            height: 5px;

            border-radius: 50%;

            background: #999999;

            animation: blink 1.2s infinite;
          }

          .typing span:nth-child(2) {
            animation-delay: 0.2s;
          }

          .typing span:nth-child(3) {
            animation-delay: 0.4s;
          }

          @keyframes blink {
            0%,
            60%,
            100% {
              opacity: 0.3;
            }

            30% {
              opacity: 1;
            }
          }

        </style>

        <div class="container">

          <!-- HEADER -->

          <div class="header">

            <div class="title">
              Genie Assistant
            </div>

            <div class="status ready">

              <span class="status-dot"></span>

              <span class="status-text">
                Ready
              </span>

            </div>

          </div>


          <!-- CHAT -->

          <div class="chat">

            <div class="welcome">

              <div class="welcome-title">
                Ask Genie
              </div>

              <div>
                Ask a financial question in plain English.
                Your question will be sent to the existing
                Finance Genie application.
              </div>

            </div>

          </div>


          <!-- CLEAR -->

          <button class="clear">
            Clear
          </button>


          <!-- INPUT -->

          <div class="input-area">

            <textarea
              class="input"
              placeholder="Ask a question..."
            ></textarea>

            <button class="send">
              ➤
            </button>

          </div>

        </div>
      `;

      /* =========================================================
         UI REFERENCES
         ========================================================= */

      this._chat = this.shadowRoot.querySelector(".chat");

      this._input = this.shadowRoot.querySelector(".input");

      this._sendButton = this.shadowRoot.querySelector(".send");

      this._clearButton = this.shadowRoot.querySelector(".clear");

      this._status = this.shadowRoot.querySelector(".status");

      this._statusText = this.shadowRoot.querySelector(".status-text");

      /* =========================================================
         EVENT LISTENERS
         ========================================================= */

      this._sendButton.addEventListener("click", () => this._handleSend());

      this._clearButton.addEventListener("click", () => this.clearChat());

      this._input.addEventListener("keydown", (event) => {
        if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault();

          this._handleSend();
        }
      });
    }

    /* =========================================================
       SAC PROPERTY HANDLING
       ========================================================= */

    onCustomWidgetBeforeUpdate(changedProperties) {
      this._props = {
        ...this._props,
        ...changedProperties,
      };
    }

    onCustomWidgetAfterUpdate(changedProperties) {
      if (
        changedProperties &&
        Object.prototype.hasOwnProperty.call(changedProperties, "backendUrl")
      ) {
        const url = changedProperties.backendUrl || "";

        if (String(url).trim()) {
          this._setStatus("ready", "Ready");
        } else {
          this._setStatus("error", "Backend URL required");
        }
      }
    }

    /* =========================================================
       BACKEND URL
       ========================================================= */

    set backendUrl(value) {
      this._props = {
        ...this._props,

        backendUrl: value || "",
      };
    }

    get backendUrl() {
      return this._props.backendUrl || "";
    }

    setBackendUrl(url) {
      this.dispatchEvent(
        new CustomEvent("propertiesChanged", {
          detail: {
            properties: {
              backendUrl: url || "",
            },
          },
        }),
      );
    }

    getBackendUrl() {
      return this.backendUrl;
    }

    /* =========================================================
       WORKSPACE HOST
       ========================================================= */

    set workspaceHost(value) {
      this._props = {
        ...this._props,
        workspaceHost: value || "",
      };
    }

    get workspaceHost() {
      return this._props.workspaceHost || "";
    }

    setWorkspaceHost(host) {
      this.dispatchEvent(
        new CustomEvent("propertiesChanged", {
          detail: {
            properties: {
              workspaceHost: host || "",
            },
          },
        }),
      );
    }

    getWorkspaceHost() {
      return this.workspaceHost;
    }

    /* =========================================================
       CLIENT ID
       ========================================================= */

    set clientId(value) {
      this._props = {
        ...this._props,
        clientId: value || "",
      };
    }

    get clientId() {
      return this._props.clientId || "";
    }

    setClientId(clientId) {
      this.dispatchEvent(
        new CustomEvent("propertiesChanged", {
          detail: {
            properties: {
              clientId: clientId || "",
            },
          },
        }),
      );
    }

    getClientId() {
      return this.clientId;
    }

    /* =========================================================
       CLIENT SECRET
       ========================================================= */

    set clientSecret(value) {
      this._props = {
        ...this._props,
        clientSecret: value || "",
      };
    }

    get clientSecret() {
      return this._props.clientSecret || "";
    }

    setClientSecret(clientSecret) {
      this.dispatchEvent(
        new CustomEvent("propertiesChanged", {
          detail: {
            properties: {
              clientSecret: clientSecret || "",
            },
          },
        }),
      );
    }

    getClientSecret() {
      return this.clientSecret;
    }

    /* =========================================================
       OAUTH SCOPE
       ========================================================= */

    set oauthScope(value) {
      this._props = {
        ...this._props,
        oauthScope: value || "all-apis",
      };
    }

    get oauthScope() {
      return this._props.oauthScope || "all-apis";
    }

    setOauthScope(scope) {
      this.dispatchEvent(
        new CustomEvent("propertiesChanged", {
          detail: {
            properties: {
              oauthScope: scope || "all-apis",
            },
          },
        }),
      );
    }

    getOauthScope() {
      return this.oauthScope;
    }

    /* =========================================================
       ACCESS TOKEN
       ========================================================= */

    set accessToken(value) {
      this._props = {
        ...this._props,

        accessToken: value || "",
      };
    }

    get accessToken() {
      return this._props.accessToken || "";
    }

    setAccessToken(token) {
      this.dispatchEvent(
        new CustomEvent("propertiesChanged", {
          detail: {
            properties: {
              accessToken: token || "",
            },
          },
        }),
      );
    }

    getAccessToken() {
      return this.accessToken;
    }

    /* =========================================================
       API URL
       ========================================================= */

    _getApiUrl(path) {
      const base = this.backendUrl.trim();

      if (!base) {
        throw new Error("Databricks backend URL is not configured.");
      }

      return base.replace(/\/+$/, "") + path;
    }

    /* =========================================================
       OAUTH TOKEN
       ========================================================= */

    async _getAccessToken() {
      const now = Date.now();

      /*
       * Reuse the current token while it is still valid.
       */
      if (
        this.accessToken &&
        this._accessTokenExpiresAt &&
        now < this._accessTokenExpiresAt - this._tokenRefreshBufferMs
      ) {
        return this.accessToken;
      }

      /*
       * Prevent multiple simultaneous token requests.
       */
      if (this._tokenRequestPromise) {
        return this._tokenRequestPromise;
      }

      const workspaceHost = this.workspaceHost.trim();
      const clientId = this.clientId.trim();
      const clientSecret = this.clientSecret;
      const scope = this.oauthScope.trim() || "all-apis";

      if (!workspaceHost) {
        throw new Error(
          "Databricks Workspace Host is not configured.",
        );
      }

      if (!clientId) {
        throw new Error(
          "OAuth Client ID is not configured.",
        );
      }

      if (!clientSecret) {
        throw new Error(
          "OAuth Client Secret is not configured.",
        );
      }

      const tokenUrl =
        workspaceHost.replace(/\/+$/, "") +
        "/oidc/v1/token";

      this._tokenRequestPromise = (async () => {
        try {
          const credentials =
            btoa(`${clientId}:${clientSecret}`);

          const body = new URLSearchParams();

          body.set(
            "grant_type",
            "client_credentials",
          );

          body.set(
            "scope",
            scope,
          );

          const response = await fetch(tokenUrl, {
            method: "POST",

            headers: {
              Authorization:
                `Basic ${credentials}`,

              "Content-Type":
                "application/x-www-form-urlencoded",

              Accept:
                "application/json",
            },

            body: body.toString(),
          });

          if (!response.ok) {
            let errorMessage =
              `OAuth token request failed with HTTP ${response.status}.`;

            try {
              const errorData =
                await response.json();

              if (errorData.error_description) {
                errorMessage +=
                  ` ${errorData.error_description}`;
              } else if (errorData.error) {
                errorMessage +=
                  ` ${errorData.error}`;
              }
            } catch (error) {
              // Keep the HTTP status error.
            }

            throw new Error(errorMessage);
          }

          const data =
            await response.json();

          if (!data.access_token) {
            throw new Error(
              "Databricks OAuth response did not contain an access token.",
            );
          }

          this.accessToken =
            data.access_token;

          const expiresIn =
            Number(data.expires_in);

          /*
           * Databricks normally returns expires_in
           * in seconds.
           *
           * Fall back to one hour if it is missing.
           */
          const lifetimeMs =
            Number.isFinite(expiresIn) &&
            expiresIn > 0
              ? expiresIn * 1000
              : 60 * 60 * 1000;

          this._accessTokenExpiresAt =
            Date.now() + lifetimeMs;

          return this.accessToken;
        } finally {
          this._tokenRequestPromise = null;
        }
      })();

      return this._tokenRequestPromise;
    }

    /* =========================================================
       SESSION
       ========================================================= */

    _generateSessionId() {
      if (window.crypto && window.crypto.randomUUID) {
        return window.crypto.randomUUID();
      }

      return Date.now().toString(16) + Math.random().toString(16).substring(2);
    }

    getSessionId() {
      return this._sessionId;
    }

    /* =========================================================
       SEND
       ========================================================= */

    async _handleSend() {
      const question = this._input.value.trim();

      if (!question) {
        return;
      }

      if (this._isWaiting) {
        return;
      }

      try {
        await this.askGenie(question);
      } catch (error) {
        console.error("GenieWidget error:", error);
      }
    }

    /* =========================================================
       ASK GENIE
       ========================================================= */

    async askGenie(question) {
      question = (question || "").trim();

      if (!question) {
        throw new Error("Question cannot be empty.");
      }

      /* =====================================================
         BACKEND URL VALIDATION
         ===================================================== */

      if (!this.backendUrl.trim()) {
        const error = "Databricks backend URL is not configured.";

        this._addMessage("assistant", error, true);

        this._setStatus("error", "Error");

        this._fireEvent("onError", {
          error: error,
        });

        return error;
      }

      /* =====================================================
         OAUTH CONFIGURATION VALIDATION
         ===================================================== */

      if (!this.workspaceHost.trim()) {
        const error =
          "Databricks Workspace Host is not configured.";

        this._addMessage(
          "assistant",
          error,
          true,
        );

        this._setStatus(
          "error",
          "Error",
        );

        this._fireEvent("onError", {
          error: error,
        });

        return error;
      }

      if (!this.clientId.trim()) {
        const error =
          "OAuth Client ID is not configured.";

        this._addMessage(
          "assistant",
          error,
          true,
        );

        this._setStatus(
          "error",
          "Error",
        );

        this._fireEvent("onError", {
          error: error,
        });

        return error;
      }

      if (!this.clientSecret) {
        const error =
          "OAuth Client Secret is not configured.";

        this._addMessage(
          "assistant",
          error,
          true,
        );

        this._setStatus(
          "error",
          "Error",
        );

        this._fireEvent("onError", {
          error: error,
        });

        return error;
      }

      /* =====================================================
         UI STATE
         ===================================================== */

      this._isWaiting = true;

      this._sendButton.disabled = true;

      this._input.disabled = true;

      this._setStatus("busy", "Thinking...");

      this._addMessage("user", question);

      this._input.value = "";

      this._fireEvent("onMessageSent", {
        question: question,
      });

      const typingMessage = this._addTypingMessage();

      try {
        /* ===================================================
           GENERATE / REFRESH OAUTH TOKEN
           =================================================== */

        await this._getAccessToken();

        /* ===================================================
           POST /api/chat
           =================================================== */

        const response = await fetch(this._getApiUrl("/api/chat"), {
          method: "POST",

          headers: {
            "Content-Type": "application/json",

            Authorization: `Bearer ${this.accessToken}`,
          },

          body: JSON.stringify({
            message: question,

            session_id: this._sessionId,
          }),
        });

        /* ===================================================
           HTTP ERROR
           =================================================== */

        if (!response.ok) {
          throw new Error(`Backend returned HTTP ${response.status}`);
        }

        /* ===================================================
           RESPONSE JSON
           =================================================== */

        const data = await response.json();

        if (!data.request_id) {
          throw new Error(data.error || "Backend did not return a request_id.");
        }

        this._currentRequestId = data.request_id;

        /* ===================================================
           POLL
           =================================================== */

        const result = await this._pollRequest(data.request_id);

        /* ===================================================
           DISPLAY RESPONSE
           =================================================== */

        this._removeMessage(typingMessage);

        this._displayGenieResponse(result);

        this._setStatus("ready", "Ready");

        const responseText = this._extractResponseText(result);

        this._fireEvent("onResponseReceived", {
          response: responseText,
        });

        return responseText;
      } catch (error) {
        console.error("Genie request failed:", error);

        this._removeMessage(typingMessage);

        const errorText = error.message || "Unable to communicate with Genie.";

        this._addMessage("assistant", errorText, true);

        this._setStatus("error", "Error");

        this._fireEvent("onError", {
          error: errorText,
        });

        throw error;
      } finally {
        this._isWaiting = false;

        this._sendButton.disabled = false;

        this._input.disabled = false;

        this._input.focus();
      }
    }

    /* =========================================================
       POLLING
       ========================================================= */

    _pollRequest(requestId) {
      return new Promise((resolve, reject) => {
        const startedAt = Date.now();

        const timeout = 180000;

        const poll = async () => {
          try {
            /* =========================================
                   TIMEOUT
                   ========================================= */

            if (Date.now() - startedAt > timeout) {
              throw new Error("Genie request timed out.");
            }

            /* =========================================
               ENSURE VALID OAUTH TOKEN
               ========================================= */

            await this._getAccessToken();

            /* =========================================
               GET STATUS
               ========================================= */

            const response = await fetch(
              this._getApiUrl(
                `/api/chat/status/${encodeURIComponent(requestId)}`,
              ),
              {
                method: "GET",

                headers: {
                  Accept: "application/json",

                  Authorization: `Bearer ${this.accessToken}`,
                },
              },
            );

            /* =========================================
                   HTTP ERROR
                   ========================================= */

            if (!response.ok) {
              throw new Error(
                `Status request returned HTTP ${response.status}`,
              );
            }

            /* =========================================
                   JSON
                   ========================================= */

            const data = await response.json();

            const status = (data.status || "").toLowerCase();

            /* =========================================
                   PROCESSING
                   ========================================= */

            if (
              status === "processing" ||
              status === "pending" ||
              status === "running"
            ) {
              this._setStatus("busy", "Thinking...");

              this._pollTimer = setTimeout(poll, 1500);

              return;
            }

            /* =========================================
                   FAILED
                   ========================================= */

            if (status === "failed" || status === "error") {
              throw new Error(
                data.error || data.message || "Genie request failed.",
              );
            }

            /* =========================================
                   SUCCESS
                   ========================================= */

            if (data.success === true || data.message) {
              resolve(data);

              return;
            }

            /* =========================================
                   CONTINUE POLLING
                   ========================================= */

            this._pollTimer = setTimeout(poll, 1500);
          } catch (error) {
            reject(error);
          }
        };

        poll();
      });
    }

    /* =========================================================
       RESPONSE
       ========================================================= */

    _displayGenieResponse(data) {
      const message = data.message || {};

      const table = message.table;

      const originalText = this._extractResponseText(data);

      const cleanedText = this._cleanResponseText(originalText, table);

      const messageElement = this._addMessage(
        "assistant",
        cleanedText || "No response received.",
      );

      /* =====================================================
         VISUALIZATION
         ===================================================== */

      if (
        table &&
        Array.isArray(table.columns) &&
        Array.isArray(table.rows) &&
        table.columns.length > 0
      ) {
        this._addVisualization(messageElement, table, message);

        /* ===================================================
           STRUCTURED TABLE
           =================================================== */

        this._addTable(messageElement, table);
      }

      /* =====================================================
         SQL
         ===================================================== */

      if (message.sql) {
        this._addSql(messageElement, message.sql);
      }

      this._scrollToBottom();
    }

    /* =========================================================
       EXTRACT RESPONSE TEXT
       ========================================================= */

    _extractResponseText(data) {
      if (!data) {
        return "";
      }

      if (typeof data.message === "string") {
        return data.message;
      }

      if (data.message && typeof data.message.text === "string") {
        return data.message.text;
      }

      if (typeof data.text === "string") {
        return data.text;
      }

      return "";
    }

    /* =========================================================
       CHAT UI
       ========================================================= */

    _addMessage(role, text, isError = false) {
      const message = document.createElement("div");

      message.className = `message ${role}`;

      const bubble = document.createElement("div");

      bubble.className = "bubble";

      if (isError) {
        bubble.classList.add("error-bubble");
      }

      bubble.innerHTML = this._formatText(text);

      message.appendChild(bubble);

      this._chat.appendChild(message);

      this._removeWelcome();

      this._scrollToBottom();

      this._clearButton.style.display = "block";

      return message;
    }

    /* =========================================================
       TYPING
       ========================================================= */

    _addTypingMessage() {
      const message = document.createElement("div");

      message.className = "message assistant";

      const bubble = document.createElement("div");

      bubble.className = "bubble";

      bubble.innerHTML = `
        <div class="typing">
          <span></span>
          <span></span>
          <span></span>
        </div>
      `;

      message.appendChild(bubble);

      this._chat.appendChild(message);

      this._removeWelcome();

      this._scrollToBottom();

      return message;
    }

    _removeMessage(element) {
      if (element && element.parentNode) {
        element.parentNode.removeChild(element);
      }
    }

    _removeWelcome() {
      const welcome = this._chat.querySelector(".welcome");

      if (welcome) {
        welcome.remove();
      }
    }

    _scrollToBottom() {
      requestAnimationFrame(() => {
        this._chat.scrollTop = this._chat.scrollHeight;
      });
    }

    /* =========================================================
       CLEAN RESPONSE TEXT
       ========================================================= */

    _cleanResponseText(text, table) {
      if (text === null || text === undefined) {
        return "";
      }

      let value = String(text).replace(/\r\n/g, "\n").replace(/\r/g, "\n");

      /*
       * Genie may return the same data twice:
       *
       * 1. Human-readable response text
       * 2. Markdown table
       *
       * Since we already have message.table,
       * remove the Markdown table from the text.
       */

      if (table && Array.isArray(table.columns) && Array.isArray(table.rows)) {
        const lines = value.split("\n");

        const kept = [];

        let inMarkdownTable = false;

        for (let i = 0; i < lines.length; i += 1) {
          const current = lines[i].trim();

          const next = i + 1 < lines.length ? lines[i + 1].trim() : "";

          const isTableHeader =
            current.includes("|") &&
            /^\|?\s*:?-{2,}(\s*\|\s*:?-{2,})+\s*\|?$/.test(next);

          if (isTableHeader) {
            inMarkdownTable = true;

            i += 1;

            continue;
          }

          if (inMarkdownTable) {
            if (current.includes("|")) {
              continue;
            }

            inMarkdownTable = false;
          }

          kept.push(lines[i]);
        }

        value = kept.join("\n");
      }

      return value.replace(/\n{3,}/g, "\n\n").trim();
    }

    /* =========================================================
       MARKDOWN FORMATTER
       ========================================================= */

    _formatText(text) {
      if (text === null || text === undefined) {
        return "";
      }

      let value = String(text).replace(/\r\n/g, "\n").replace(/\r/g, "\n");

      /* =======================================================
         CODE BLOCKS
         ======================================================= */

      const codeBlocks = [];

      value = value.replace(
        /```(?:[a-zA-Z0-9_+-]+)?\n?([\s\S]*?)```/g,
        (match, code) => {
          const token = `@@CODEBLOCK${codeBlocks.length}@@`;

          codeBlocks.push(code.trim());

          return token;
        },
      );

      /* =======================================================
         ESCAPE HTML
         ======================================================= */

      value = this._escapeHtml(value);

      /* =======================================================
         HEADINGS
         ======================================================= */

      value = value.replace(/^###\s+(.+)$/gm, '<div class="md-h3">$1</div>');

      value = value.replace(/^##\s+(.+)$/gm, '<div class="md-h2">$1</div>');

      value = value.replace(/^#\s+(.+)$/gm, '<div class="md-h1">$1</div>');

      /* =======================================================
         BOLD
         ======================================================= */

      value = value.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

      value = value.replace(/__(.+?)__/g, "<strong>$1</strong>");

      /* =======================================================
         ITALIC
         ======================================================= */

      value = value.replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, "<em>$1</em>");

      /* =======================================================
         INLINE CODE
         ======================================================= */

      value = value.replace(/`([^`\n]+)`/g, "<code>$1</code>");

      /* =======================================================
         PROCESS LINES
         ======================================================= */

      const lines = value.split("\n");

      const output = [];

      let paragraph = [];

      let listType = null;

      /* =======================================================
         FLUSH PARAGRAPH
         ======================================================= */

      const flushParagraph = () => {
        if (!paragraph.length) {
          return;
        }

        const content = paragraph.join(" ").trim();

        if (content) {
          output.push(`<p>${content}</p>`);
        }

        paragraph = [];
      };

      /* =======================================================
         CLOSE LIST
         ======================================================= */

      const closeList = () => {
        if (listType === "ul") {
          output.push("</ul>");
        }

        if (listType === "ol") {
          output.push("</ol>");
        }

        listType = null;
      };

      /* =======================================================
         LINE PROCESSING
         ======================================================= */

      lines.forEach((line) => {
        const trimmed = line.trim();

        /* EMPTY LINE */

        if (!trimmed) {
          flushParagraph();

          closeList();

          return;
        }

        /* HEADING */

        if (/^<div class="md-h[123]">/.test(trimmed)) {
          flushParagraph();

          closeList();

          output.push(trimmed);

          return;
        }

        /* UNORDERED LIST */

        const unordered = trimmed.match(/^[-*+]\s+(.+)$/);

        /* ORDERED LIST */

        const ordered = trimmed.match(/^\d+[.)]\s+(.+)$/);

        if (unordered) {
          flushParagraph();

          if (listType === "ol") {
            output.push("</ol>");

            listType = null;
          }

          if (!listType) {
            output.push("<ul>");

            listType = "ul";
          }

          output.push(`<li>${unordered[1]}</li>`);

          return;
        }

        if (ordered) {
          flushParagraph();

          if (listType === "ul") {
            output.push("</ul>");

            listType = null;
          }

          if (!listType) {
            output.push("<ol>");

            listType = "ol";
          }

          output.push(`<li>${ordered[1]}</li>`);

          return;
        }

        /* HORIZONTAL RULE */

        if (/^---+$/.test(trimmed)) {
          flushParagraph();

          closeList();

          output.push("<hr>");

          return;
        }

        /* NORMAL TEXT */

        closeList();

        paragraph.push(trimmed);
      });

      flushParagraph();

      closeList();

      let html = output.join("");

      /* =======================================================
         RESTORE CODE BLOCKS
         ======================================================= */

      codeBlocks.forEach((code, index) => {
        html = html.replace(
          `@@CODEBLOCK${index}@@`,
          `<pre class="md-codeblock"><code>${this._escapeHtml(
            code,
          )}</code></pre>`,
        );
      });

      return html;
    }

    /* =========================================================
       ESCAPE HTML
       ========================================================= */

    _escapeHtml(value) {
      return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    }

    /* =========================================================
       VISUALIZATION
       ========================================================= */

    _addVisualization(messageElement, table, message = {}) {
      const dataset = this._prepareChartData(table);

      if (!dataset || !dataset.values.length) {
        return;
      }

      const container = document.createElement("div");

      container.className = "visualization-container";

      /* =======================================================
         HEADER
         ======================================================= */

      const header = document.createElement("div");

      header.className = "visualization-header";

      const title = document.createElement("div");

      title.className = "visualization-title";

      title.textContent =
        message.visualization?.title ||
        message.visualization?.name ||
        (Array.isArray(message.visualizations) &&
          message.visualizations[0]?.title) ||
        `${dataset.metricLabel} by ${dataset.categoryLabel}`;

      const typeLabel = document.createElement("div");

      typeLabel.className = "chart-type";

      typeLabel.textContent = this._getChartLabel(dataset.defaultType);

      header.appendChild(title);

      header.appendChild(typeLabel);

      container.appendChild(header);

      /* =======================================================
         CHART TOOLBAR
         ======================================================= */

      const supported = this._getSupportedChartTypes(dataset);

      if (supported.length > 1) {
        const toolbar = document.createElement("div");

        toolbar.className = "chart-toolbar";

        supported.forEach((type) => {
          const button = document.createElement("button");

          button.type = "button";

          button.className = `chart-button${
            type === dataset.defaultType ? " active" : ""
          }`;

          button.textContent = this._getChartLabel(type);

          button.addEventListener("click", () => {
            toolbar.querySelectorAll(".chart-button").forEach((item) => {
              item.classList.remove("active");
            });

            button.classList.add("active");

            typeLabel.textContent = this._getChartLabel(type);

            this._renderChart(chartWrap, dataset, type);
          });

          toolbar.appendChild(button);
        });

        container.appendChild(toolbar);
      }

      /* =======================================================
         CHART AREA
         ======================================================= */

      const chartWrap = document.createElement("div");

      chartWrap.className = "chart-wrap";

      container.appendChild(chartWrap);

      const bubble = messageElement.querySelector(".bubble");

      if (bubble) {
        bubble.appendChild(container);
      }

      requestAnimationFrame(() => {
        this._renderChart(chartWrap, dataset, dataset.defaultType);
      });
    }

    /* =========================================================
       PREPARE CHART DATA
       ========================================================= */

    _prepareChartData(table) {
      const columns = table.columns.map((column) =>
        typeof column === "string"
          ? column
          : column?.name || column?.label || "Column",
      );

      const rows = table.rows.map((row) => {
        if (Array.isArray(row)) {
          return row;
        }

        if (row && typeof row === "object") {
          return columns.map((key) => row[key]);
        }

        return [row];
      });

      if (!columns.length || !rows.length) {
        return null;
      }

      /* =======================================================
         NUMERIC COLUMNS
         ======================================================= */

      const numericColumns = columns
        .map((column, index) => {
          const numeric = rows
            .map((row) => this._toNumber(row[index]))
            .filter(Number.isFinite);

          return {
            index,
            count: numeric.length,
          };
        })
        .filter(
          (item) => item.count >= Math.max(1, Math.ceil(rows.length * 0.6)),
        );

      if (!numericColumns.length) {
        return null;
      }

      /* =======================================================
         CHOOSE METRIC
         ======================================================= */

      let metric = numericColumns[0];

      const preferred = numericColumns.find((item) =>
        /amount|amt|total|movement|activity|value|sales|revenue|count|qty|quantity|balance|profit|cost|debit|credit|gc|lc|tc/i.test(
          columns[item.index],
        ),
      );

      if (preferred) {
        metric = preferred;
      }

      /* =======================================================
         CATEGORY CANDIDATES
         ======================================================= */

      const categoryCandidates = columns
        .map((column, index) => ({
          column,
          index,
        }))
        .filter(
          (item) =>
            item.index !== metric.index &&
            !numericColumns.some((numeric) => numeric.index === item.index),
        );

      /* =======================================================
         PREFERRED CATEGORY
         ======================================================= */

      const preferredCategory = categoryCandidates.find((item) =>
        /gl[_ ]?account|account|category|name|description|customer|company|cost[_ ]?center|profit[_ ]?center|date|period|month|year|quarter/i.test(
          item.column,
        ),
      );

      /* =======================================================
         UNIQUE CATEGORY
         ======================================================= */

      const uniqueCategory = categoryCandidates
        .map((item) => ({
          ...item,

          uniqueCount: new Set(rows.map((row) => String(row[item.index] ?? "")))
            .size,
        }))
        .sort((a, b) => b.uniqueCount - a.uniqueCount)[0];

      const category =
        preferredCategory?.index ??
        uniqueCategory?.index ??
        Math.max(0, metric.index - 1);

      /* =======================================================
         VALUES
         ======================================================= */

      const values = rows
        .map((row) => ({
          category: row[category] == null ? "" : String(row[category]),

          value: this._toNumber(row[metric.index]),
        }))
        .filter((item) => Number.isFinite(item.value));

      if (!values.length) {
        return null;
      }

      /* =======================================================
         DATE DETECTION
         ======================================================= */

      const isDate = /date|period|month|year|quarter|week|time/i.test(
        columns[category],
      );

      /* =======================================================
         MULTIPLE NUMERIC COLUMNS
         ======================================================= */

      const xIndex = numericColumns[0].index;

      const yIndex =
        numericColumns.length > 1 ? numericColumns[1].index : metric.index;

      return {
        columns,

        rows,

        values,

        categoryIndex: category,

        metricIndex: metric.index,

        xIndex,

        yIndex,

        categoryLabel: columns[category],

        metricLabel: columns[metric.index],

        defaultType:
          numericColumns.length > 1 ? "scatter" : isDate ? "line" : "bar",
      };
    }

    /* =========================================================
       SUPPORTED CHART TYPES
       ========================================================= */

    _getSupportedChartTypes(dataset) {
      const types = ["bar", "line"];

      if (dataset.values.length <= 12) {
        types.push("donut");
      }

      const hasScatterData =
        dataset.rows.some((row) =>
          Number.isFinite(this._toNumber(row[dataset.xIndex])),
        ) &&
        dataset.rows.some((row) =>
          Number.isFinite(this._toNumber(row[dataset.yIndex])),
        );

      if (hasScatterData) {
        types.push("scatter");
      }

      return [...new Set(types)];
    }

    /* =========================================================
       CHART LABEL
       ========================================================= */

    _getChartLabel(type) {
      return (
        {
          bar: "Bar",
          line: "Line",
          donut: "Donut",
          scatter: "Scatter",
        }[type] || type
      );
    }

    /* =========================================================
       NUMBER
       ========================================================= */

    _toNumber(value) {
      if (typeof value === "number") {
        return Number.isFinite(value) ? value : NaN;
      }

      if (value === null || value === undefined || value === "") {
        return NaN;
      }

      const number = Number(
        String(value).replace(/,/g, "").replace(/%$/, "").trim(),
      );

      return Number.isFinite(number) ? number : NaN;
    }

    /* =========================================================
       FORMAT CHART NUMBER
       ========================================================= */

    _formatChartNumber(value) {
      const abs = Math.abs(value);

      if (abs >= 1e9) {
        return (value / 1e9).toFixed(1) + "B";
      }

      if (abs >= 1e6) {
        return (value / 1e6).toFixed(1) + "M";
      }

      if (abs >= 1e3) {
        return (value / 1e3).toFixed(1) + "K";
      }

      return Number(value).toLocaleString(undefined, {
        maximumFractionDigits: 2,
      });
    }

    /* =========================================================
       SCALE
       ========================================================= */

    _chartScale(values, includeZero = false) {
      const clean = values.filter(Number.isFinite);

      if (!clean.length) {
        return {
          min: 0,
          max: 1,
        };
      }

      let min = Math.min(...clean);

      let max = Math.max(...clean);

      if (includeZero) {
        min = Math.min(0, min);

        max = Math.max(0, max);
      }

      if (min === max) {
        const pad = Math.abs(min || 1) * 0.1;

        min -= pad;

        max += pad;
      }

      const pad = (max - min) * 0.08;

      return {
        min: min - pad,

        max: max + pad,
      };
    }

    /* =========================================================
       SVG HELPER
       ========================================================= */

    _svg(name, attrs = {}, text = null) {
      const element = document.createElementNS(
        "http://www.w3.org/2000/svg",
        name,
      );

      Object.entries(attrs).forEach(([key, value]) => {
        element.setAttribute(key, String(value));
      });

      if (text !== null) {
        element.textContent = String(text);
      }

      return element;
    }

    /* =========================================================
       RENDER CHART
       ========================================================= */

    _renderChart(container, dataset, type) {
      container.innerHTML = "";

      const svg = this._svg("svg", {
        viewBox: "0 0 720 300",

        role: "img",

        "aria-label": "Genie data visualization",
      });

      if (type === "donut") {
        this._renderDonut(svg, dataset);
      } else if (type === "scatter") {
        this._renderScatter(svg, dataset);
      } else if (type === "line") {
        this._renderLine(svg, dataset);
      } else {
        this._renderBar(svg, dataset);
      }

      container.appendChild(svg);
    }

    /* =========================================================
       AXES
       ========================================================= */

    _renderAxes(svg, plot, scale, xLabel, yLabel) {
      const { left, top, width, height } = plot;

      /* =======================================================
         GRID LINES
         ======================================================= */

      for (let i = 0; i <= 4; i += 1) {
        const y = top + height - (i / 4) * height;

        const value = scale.min + (i / 4) * (scale.max - scale.min);

        svg.appendChild(
          this._svg("line", {
            x1: left,
            y1: y,

            x2: left + width,

            y2: y,

            stroke: "#eeeeee",
          }),
        );

        svg.appendChild(
          this._svg(
            "text",
            {
              x: left - 7,

              y: y + 4,

              "text-anchor": "end",

              fill: "#777",

              "font-size": 10,
            },

            this._formatChartNumber(value),
          ),
        );
      }

      /* =======================================================
         Y AXIS
         ======================================================= */

      svg.appendChild(
        this._svg("line", {
          x1: left,

          y1: top,

          x2: left,

          y2: top + height,

          stroke: "#cfcfcf",
        }),
      );

      /* =======================================================
         X AXIS
         ======================================================= */

      svg.appendChild(
        this._svg("line", {
          x1: left,

          y1: top + height,

          x2: left + width,

          y2: top + height,

          stroke: "#cfcfcf",
        }),
      );

      /* =======================================================
         X LABEL
         ======================================================= */

      if (xLabel) {
        svg.appendChild(
          this._svg(
            "text",
            {
              x: left + width / 2,

              y: 285,

              "text-anchor": "middle",

              fill: "#777",

              "font-size": 10,
            },

            this._truncateLabel(xLabel, 55),
          ),
        );
      }

      /* =======================================================
         Y LABEL
         ======================================================= */

      if (yLabel) {
        svg.appendChild(
          this._svg(
            "text",
            {
              x: 13,

              y: top + height / 2,

              "text-anchor": "middle",

              fill: "#777",

              "font-size": 10,

              transform: `rotate(-90 13 ${top + height / 2})`,
            },

            this._truncateLabel(yLabel, 30),
          ),
        );
      }
    }

    /* =========================================================
       TRUNCATE LABEL
       ========================================================= */

    _truncateLabel(value, max = 15) {
      const text = String(value ?? "");

      return text.length > max ? `${text.slice(0, max - 1)}…` : text;
    }

    /* =========================================================
       BAR CHART
       ========================================================= */

    _renderBar(svg, dataset) {
      const plot = {
        left: 72,
        top: 20,
        width: 615,
        height: 220,
      };

      const values = dataset.values.slice(0, 20);

      const scale = this._chartScale(
        values.map((item) => item.value),
        true,
      );

      const range = scale.max - scale.min;

      this._renderAxes(
        svg,
        plot,
        scale,
        dataset.categoryLabel,
        dataset.metricLabel,
      );

      const slot = plot.width / values.length;

      const barWidth = Math.max(8, Math.min(34, slot * 0.62));

      const zeroY =
        plot.top + plot.height - ((0 - scale.min) / range) * plot.height;

      values.forEach((item, index) => {
        const x = plot.left + index * slot + (slot - barWidth) / 2;

        const valueY =
          plot.top +
          plot.height -
          ((item.value - scale.min) / range) * plot.height;

        const y = Math.min(valueY, zeroY);

        const height = Math.max(1, Math.abs(valueY - zeroY));

        const rect = this._svg("rect", {
          x,
          y,
          width: barWidth,
          height,
          rx: 2,

          fill: "#5b7cfa",
        });

        rect.appendChild(
          this._svg(
            "title",
            {},
            `${item.category}: ${item.value.toLocaleString()}`,
          ),
        );

        svg.appendChild(rect);

        if (values.length <= 14) {
          svg.appendChild(
            this._svg(
              "text",
              {
                x: x + barWidth / 2,

                y: 258,

                "text-anchor": "middle",

                fill: "#666",

                "font-size": 9,
              },

              this._truncateLabel(item.category, 12),
            ),
          );
        }
      });
    }

    /* =========================================================
       LINE CHART
       ========================================================= */

    _renderLine(svg, dataset) {
      const plot = {
        left: 72,
        top: 20,
        width: 615,
        height: 220,
      };

      const values = dataset.values.slice(0, 40);

      const scale = this._chartScale(values.map((item) => item.value));

      const range = scale.max - scale.min;

      this._renderAxes(
        svg,
        plot,
        scale,
        dataset.categoryLabel,
        dataset.metricLabel,
      );

      const points = values.map((item, index) => {
        const x =
          plot.left +
          (values.length === 1
            ? plot.width / 2
            : (index / (values.length - 1)) * plot.width);

        const y =
          plot.top +
          plot.height -
          ((item.value - scale.min) / range) * plot.height;

        return {
          x,
          y,
          item,
        };
      });

      /* =======================================================
         LINE
         ======================================================= */

      svg.appendChild(
        this._svg("polyline", {
          points: points.map((point) => `${point.x},${point.y}`).join(" "),

          fill: "none",

          stroke: "#5b7cfa",

          "stroke-width": 2,
        }),
      );

      /* =======================================================
         POINTS
         ======================================================= */

      points.forEach((point) => {
        const circle = this._svg("circle", {
          cx: point.x,

          cy: point.y,

          r: 3.5,

          fill: "#5b7cfa",
        });

        circle.appendChild(
          this._svg(
            "title",
            {},
            `${point.item.category}: ${point.item.value.toLocaleString()}`,
          ),
        );

        svg.appendChild(circle);
      });
    }

    /* =========================================================
       DONUT CHART
       ========================================================= */

    _renderDonut(svg, dataset) {
      const values = dataset.values
        .filter((item) => item.value > 0)
        .slice(0, 12);

      const total = values.reduce((sum, item) => sum + item.value, 0);

      if (!total) {
        svg.appendChild(
          this._svg(
            "text",
            {
              x: 360,
              y: 150,

              "text-anchor": "middle",

              fill: "#888",

              "font-size": 12,
            },

            "No positive values available for a donut chart",
          ),
        );

        return;
      }

      const cx = 245;
      const cy = 145;

      const radius = 78;

      const circumference = 2 * Math.PI * radius;

      let offset = 0;

      values.forEach((item, index) => {
        const length = (item.value / total) * circumference;

        const shade = `hsl(${index * 42}, 60%, 55%)`;

        const circle = this._svg("circle", {
          cx,
          cy,
          r: radius,

          fill: "none",

          stroke: shade,

          "stroke-width": 32,

          "stroke-dasharray": `${length} ${circumference - length}`,

          "stroke-dashoffset": -offset,

          transform: `rotate(-90 ${cx} ${cy})`,
        });

        circle.appendChild(
          this._svg(
            "title",
            {},
            `${item.category}: ${item.value.toLocaleString()}`,
          ),
        );

        svg.appendChild(circle);

        offset += length;
      });

      /* =======================================================
         CENTER TOTAL
         ======================================================= */

      svg.appendChild(
        this._svg(
          "text",
          {
            x: cx,

            y: cy - 2,

            "text-anchor": "middle",

            fill: "#333",

            "font-size": 13,

            "font-weight": 600,
          },

          this._formatChartNumber(total),
        ),
      );

      svg.appendChild(
        this._svg(
          "text",
          {
            x: cx,

            y: cy + 15,

            "text-anchor": "middle",

            fill: "#888",

            "font-size": 10,
          },

          "Total",
        ),
      );

      /* =======================================================
         LEGEND
         ======================================================= */

      values.forEach((item, index) => {
        const y = 34 + index * 21;

        const shade = `hsl(${index * 42}, 60%, 55%)`;

        svg.appendChild(
          this._svg("rect", {
            x: 430,

            y: y - 8,

            width: 10,

            height: 10,

            rx: 2,

            fill: shade,
          }),
        );

        svg.appendChild(
          this._svg(
            "text",
            {
              x: 448,

              y,

              fill: "#555",

              "font-size": 10,
            },

            `${this._truncateLabel(item.category, 24)} (${(
              (item.value / total) *
              100
            ).toFixed(1)}%)`,
          ),
        );
      });
    }

    /* =========================================================
       SCATTER CHART
       ========================================================= */

    _renderScatter(svg, dataset) {
      const plot = {
        left: 72,
        top: 20,
        width: 615,
        height: 220,
      };

      const points = dataset.rows
        .map((row) => ({
          x: this._toNumber(row[dataset.xIndex]),

          y: this._toNumber(row[dataset.yIndex]),
        }))
        .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y))
        .slice(0, 100);

      if (!points.length) {
        svg.appendChild(
          this._svg(
            "text",
            {
              x: 360,
              y: 150,

              "text-anchor": "middle",

              fill: "#888",

              "font-size": 12,
            },

            "No numeric pairs available for a scatter chart",
          ),
        );

        return;
      }

      const xScale = this._chartScale(points.map((point) => point.x));

      const yScale = this._chartScale(points.map((point) => point.y));

      /* =======================================================
         GRID
         ======================================================= */

      this._renderAxes(
        svg,
        plot,
        yScale,
        dataset.columns[dataset.xIndex],
        dataset.columns[dataset.yIndex],
      );

      points.forEach((point) => {
        const x =
          plot.left +
          ((point.x - xScale.min) / (xScale.max - xScale.min)) * plot.width;

        const y =
          plot.top +
          plot.height -
          ((point.y - yScale.min) / (yScale.max - yScale.min)) * plot.height;

        const circle = this._svg("circle", {
          cx: x,

          cy: y,

          r: 4,

          fill: "#5b7cfa",

          opacity: 0.72,
        });

        circle.appendChild(
          this._svg(
            "title",
            {},
            `(${point.x.toLocaleString()}, ${point.y.toLocaleString()})`,
          ),
        );

        svg.appendChild(circle);
      });
    }

    /* =========================================================
       SQL
       ========================================================= */

    _addSql(messageElement, sql) {
      const container = document.createElement("div");

      container.className = "sql-container";

      const toggle = document.createElement("div");

      toggle.className = "sql-toggle";

      toggle.textContent = "Show SQL";

      const sqlElement = document.createElement("pre");

      sqlElement.className = "sql";

      sqlElement.textContent = sql;

      toggle.addEventListener("click", () => {
        sqlElement.classList.toggle("visible");

        toggle.textContent = sqlElement.classList.contains("visible")
          ? "Hide SQL"
          : "Show SQL";
      });

      container.appendChild(toggle);

      container.appendChild(sqlElement);

      const bubble = messageElement.querySelector(".bubble");

      if (bubble) {
        bubble.appendChild(container);
      }
    }

    /* =========================================================
       TABLE
       ========================================================= */

    _addTable(messageElement, table) {
      const container = document.createElement("div");

      container.className = "table-container";

      const htmlTable = document.createElement("table");

      const thead = document.createElement("thead");

      const headerRow = document.createElement("tr");

      table.columns.forEach((column) => {
        const th = document.createElement("th");

        th.textContent =
          typeof column === "string"
            ? column
            : column.name || column.label || "";

        headerRow.appendChild(th);
      });

      thead.appendChild(headerRow);

      const tbody = document.createElement("tbody");

      table.rows.forEach((row) => {
        const tr = document.createElement("tr");

        let values;

        if (Array.isArray(row)) {
          values = row;
        } else if (row && typeof row === "object") {
          values = table.columns.map((column) => {
            const key =
              typeof column === "string"
                ? column
                : column.name || column.label || "";

            return row[key];
          });
        } else {
          values = [row];
        }

        values.forEach((value) => {
          const td = document.createElement("td");

          td.textContent =
            value === null || value === undefined ? "" : String(value);

          tr.appendChild(td);
        });

        tbody.appendChild(tr);
      });

      htmlTable.appendChild(thead);

      htmlTable.appendChild(tbody);

      container.appendChild(htmlTable);

      const bubble = messageElement.querySelector(".bubble");

      if (bubble) {
        bubble.appendChild(container);
      }
    }

    /* =========================================================
       CLEAR
       ========================================================= */

    clearChat() {
      if (this._pollTimer) {
        clearTimeout(this._pollTimer);

        this._pollTimer = null;
      }

      this._chat.innerHTML = `

        <div class="welcome">

          <div class="welcome-title">
            Ask Genie
          </div>

          <div>
            Ask a financial question in plain English.
            Your question will be sent to the existing
            Finance Genie application.
          </div>

        </div>

      `;

      this._clearButton.style.display = "none";

      this._sessionId = this._generateSessionId();

      this._currentRequestId = null;

      this._setStatus(
        this.backendUrl.trim() ? "ready" : "error",

        this.backendUrl.trim() ? "Ready" : "Backend URL required",
      );
    }

    /* =========================================================
       STATUS
       ========================================================= */

    _setStatus(type, text) {
      this._status.className = `status ${type}`;

      this._statusText.textContent = text;
    }

    /* =========================================================
       EVENTS
       ========================================================= */

    _fireEvent(eventName, detail) {
      const event = new CustomEvent(eventName, {
        detail: detail,

        bubbles: true,

        composed: true,
      });

      this.dispatchEvent(event);
    }
  }

  /* =============================================================
     REGISTER WEB COMPONENT
     ============================================================= */

  if (!customElements.get("com-sampurno-geniewidget")) {
    customElements.define("com-sampurno-geniewidget", GenieWidget);
  }
})();
