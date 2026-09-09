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


          .container {
            width: 100%;
            height: 100%;

            min-height: 350px;

            display: flex;

            flex-direction: column;

            background: #ffffff;

            border:
              1px solid #d9d9d9;

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

            border-bottom:
              1px solid #e5e5e5;

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
            max-width: 80%;

            padding: 10px 13px;

            border-radius: 10px;

            font-size: 14px;

            line-height: 1.45;

            white-space: normal;

            word-wrap: break-word;
          }


          .user .bubble {
            background: #e8f0fe;

            color: #222222;

            border-bottom-right-radius: 3px;
          }


          .assistant .bubble {
            background: #ffffff;

            color: #222222;

            border:
              1px solid #e2e2e2;

            border-bottom-left-radius: 3px;
          }


          .error-bubble {
            background: #fff1f1 !important;

            border-color:
              #efb0b0 !important;

            color: #9b2525 !important;
          }


          /* =====================================================
             SQL
             ===================================================== */

          .sql-container {
            margin-top: 10px;
          }


          .sql-toggle {
            cursor: pointer;

            font-size: 12px;

            color: #555555;

            user-select: none;
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

            white-space: pre-wrap;
          }


          .sql.visible {
            display: block;
          }


          /* =====================================================
             TABLE
             ===================================================== */

          .table-container {
            margin-top: 10px;

            overflow-x: auto;
          }


          table {
            border-collapse: collapse;

            width: 100%;

            font-size: 12px;
          }


          th,
          td {
            border:
              1px solid #dddddd;

            padding: 6px 8px;

            text-align: left;

            white-space: nowrap;
          }


          th {
            background: #f2f2f2;

            font-weight: 600;
          }


          /* =====================================================
             INPUT AREA
             ===================================================== */

          .input-area {
            border-top:
              1px solid #e5e5e5;

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

            border:
              1px solid #cccccc;

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

            animation:
              blink 1.2s infinite;
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
      if ("backendUrl" in changedProperties) {
        const url = changedProperties.backendUrl || "";

        if (url.trim()) {
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
         ACCESS TOKEN VALIDATION
         ===================================================== */

      if (!this.accessToken.trim()) {
        const error = "Databricks OAuth access token is not configured.";

        this._addMessage("assistant", error, true);

        this._setStatus("error", "Error");

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

      const text = this._extractResponseText(data);

      const messageElement = this._addMessage(
        "assistant",

        text || "No response received.",
      );

      if (message.sql) {
        this._addSql(messageElement, message.sql);
      }

      const table = message.table;

      if (
        table &&
        Array.isArray(table.columns) &&
        Array.isArray(table.rows) &&
        table.columns.length > 0
      ) {
        this._addTable(messageElement, table);
      }
    }

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
       FORMAT TEXT
       ========================================================= */

    _formatText(text) {
      if (text === null || text === undefined) {
        return "";
      }

      let value = String(text);

      value = value

        .replace(/&/g, "&amp;")

        .replace(/</g, "&lt;")

        .replace(/>/g, "&gt;")

        .replace(/"/g, "&quot;")

        .replace(/'/g, "&#039;");

      value = value.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

      value = value.replace(/`([^`]+)`/g, "<code>$1</code>");

      value = value.replace(/\n/g, "<br>");

      return value;
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
