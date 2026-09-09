(function () {
  "use strict";

  class GenieWidget extends HTMLElement {
    constructor() {
      super();

      this._props = {
        backendUrl: ""
      };

      this._sessionId = this._newSessionId();
      this._requestInProgress = false;
      this._pollTimer = null;
      this._lastResponse = null;

      this.attachShadow({ mode: "open" });
      this.shadowRoot.innerHTML = `
        <style>
          :host {
            display: block;
            width: 100%;
            height: 100%;
            min-height: 420px;
            box-sizing: border-box;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
            color: #1f2937;
            background: #ffffff;
          }

          * { box-sizing: border-box; }

          .shell {
            height: 100%;
            min-height: 420px;
            display: flex;
            flex-direction: column;
            border: 1px solid #d9dee7;
            border-radius: 10px;
            overflow: hidden;
            background: #ffffff;
          }

          .header {
            flex: 0 0 auto;
            padding: 12px 16px;
            border-bottom: 1px solid #e5e7eb;
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: #f8fafc;
          }

          .title {
            font-size: 15px;
            font-weight: 600;
            margin: 0;
          }

          .status {
            font-size: 11px;
            color: #64748b;
          }

          .messages {
            flex: 1 1 auto;
            overflow-y: auto;
            padding: 16px;
            display: flex;
            flex-direction: column;
            gap: 12px;
            background: #ffffff;
          }

          .welcome {
            margin: auto;
            max-width: 520px;
            text-align: center;
            color: #64748b;
            padding: 24px 12px;
          }

          .welcome-title {
            color: #1f2937;
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 8px;
          }

          .welcome-text {
            font-size: 13px;
            line-height: 1.5;
          }

          .message {
            max-width: 88%;
            display: flex;
            flex-direction: column;
            gap: 4px;
          }

          .message.user { align-self: flex-end; align-items: flex-end; }
          .message.assistant { align-self: flex-start; align-items: flex-start; }

          .label {
            font-size: 11px;
            color: #64748b;
            padding: 0 4px;
          }

          .bubble {
            padding: 10px 12px;
            border-radius: 10px;
            font-size: 13px;
            line-height: 1.5;
            white-space: pre-wrap;
            overflow-wrap: anywhere;
          }

          .user .bubble {
            background: #e8f1fb;
            color: #12304a;
          }

          .assistant .bubble {
            background: #f4f6f8;
            color: #1f2937;
          }

          .assistant .bubble.error {
            background: #fff4f4;
            color: #9f1239;
          }

          .markdown p { margin: 0 0 8px; }
          .markdown p:last-child { margin-bottom: 0; }
          .markdown ul, .markdown ol { margin: 6px 0 6px 20px; padding: 0; }
          .markdown code {
            font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
            font-size: 11px;
          }

          .details {
            margin-top: 8px;
            border-top: 1px solid #dfe4ea;
            padding-top: 8px;
          }

          .details summary {
            cursor: pointer;
            font-size: 11px;
            color: #475569;
          }

          .sql {
            margin-top: 8px;
            padding: 8px;
            border-radius: 6px;
            background: #111827;
            color: #e5e7eb;
            overflow-x: auto;
            font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
            font-size: 11px;
            white-space: pre;
          }

          .table-wrap {
            margin-top: 8px;
            overflow: auto;
            max-height: 300px;
            border: 1px solid #dfe4ea;
            border-radius: 6px;
            background: #ffffff;
          }

          table { border-collapse: collapse; width: 100%; font-size: 11px; }
          th, td { padding: 6px 8px; border-bottom: 1px solid #e5e7eb; text-align: left; white-space: nowrap; }
          th { background: #f8fafc; font-weight: 600; position: sticky; top: 0; }

          .loading {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            color: #64748b;
          }

          .dot {
            width: 5px;
            height: 5px;
            border-radius: 50%;
            background: #64748b;
            animation: pulse 1.1s infinite ease-in-out;
          }
          .dot:nth-child(2) { animation-delay: .15s; }
          .dot:nth-child(3) { animation-delay: .30s; }
          @keyframes pulse { 0%, 80%, 100% { opacity: .25; } 40% { opacity: 1; } }

          .input-area {
            flex: 0 0 auto;
            padding: 10px;
            border-top: 1px solid #e5e7eb;
            background: #ffffff;
          }

          .input-row {
            display: flex;
            gap: 8px;
            align-items: flex-end;
          }

          textarea {
            flex: 1 1 auto;
            resize: none;
            min-height: 40px;
            max-height: 120px;
            padding: 10px 12px;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            outline: none;
            font: inherit;
            font-size: 13px;
          }

          textarea:focus { border-color: #64748b; }

          button {
            border: 0;
            cursor: pointer;
            font: inherit;
          }

          .send {
            flex: 0 0 auto;
            width: 40px;
            height: 40px;
            border-radius: 8px;
            background: #1f2937;
            color: #ffffff;
            font-size: 17px;
          }

          .send:disabled { opacity: .45; cursor: default; }

          .footer-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 6px;
          }

          .hint { font-size: 10px; color: #94a3b8; }

          .clear {
            background: transparent;
            color: #64748b;
            font-size: 10px;
            padding: 2px 4px;
          }

          .clear:hover { color: #1f2937; }
        </style>

        <div class="shell">
          <div class="header">
            <div class="title">Genie Assistant</div>
            <div class="status" id="status">Ready</div>
          </div>

          <div class="messages" id="messages">
            <div class="welcome" id="welcome">
              <div class="welcome-title">Ask Genie</div>
              <div class="welcome-text">
                Ask a financial question in plain English. Your question will be sent to the existing Finance Genie application.
              </div>
            </div>
          </div>

          <div class="input-area">
            <div class="input-row">
              <textarea id="input" rows="1" maxlength="4000" placeholder="Ask a question..."></textarea>
              <button class="send" id="send" title="Send">➤</button>
            </div>
            <div class="footer-row">
              <span class="hint">Plain English questions only</span>
              <button class="clear" id="clear">New chat</button>
            </div>
          </div>
        </div>
      `;

      this._messagesEl = this.shadowRoot.getElementById("messages");
      this._inputEl = this.shadowRoot.getElementById("input");
      this._sendEl = this.shadowRoot.getElementById("send");
      this._clearEl = this.shadowRoot.getElementById("clear");
      this._statusEl = this.shadowRoot.getElementById("status");

      this._sendEl.addEventListener("click", () => this._submitFromInput());
      this._clearEl.addEventListener("click", () => this.clearChat());

      this._inputEl.addEventListener("keydown", (event) => {
        if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault();
          this._submitFromInput();
        }
      });

      this._inputEl.addEventListener("input", () => this._autoResize());
    }

    onCustomWidgetBeforeUpdate(changedProperties) {
      this._props = { ...this._props, ...changedProperties };
    }

    onCustomWidgetAfterUpdate() {
      // The backend URL is intentionally configurable through SAC properties.
      // No Databricks credentials are stored in this widget.
    }

    setBackendUrl(url) {
      this._props.backendUrl = String(url || "").trim().replace(/\/$/, "");
      this._emitPropertiesChanged();
    }

    getBackendUrl() {
      return this._props.backendUrl || "";
    }

    getSessionId() {
      return this._sessionId;
    }

    async askGenie(question) {
      const text = String(question || "").trim();
      if (!text) return false;

      if (this._requestInProgress) {
        this._setStatus("Waiting for Genie...");
        return false;
      }

      const backendUrl = this.getBackendUrl();
      if (!backendUrl) {
        this._showError("Databricks backend URL is not configured.");
        return false;
      }

      this._removeWelcome();
      this._appendUserMessage(text);
      this._emit("onMessageSent");

      this._requestInProgress = true;
      this._setBusy(true);
      this._setStatus("Sending...");
      const loading = this._appendLoading();

      try {
        const start = await fetch(`${backendUrl}/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text,
            session_id: this._sessionId
          })
        });

        const startData = await this._readJson(start);
        if (!start.ok || !startData.request_id) {
          throw new Error(startData.error || `Chat request failed (${start.status})`);
        }

        this._setStatus("Genie is thinking...");
        await this._poll(startData.request_id, loading);
        return true;
      } catch (error) {
        this._removeLoading(loading);
        this._showError(error && error.message ? error.message : String(error));
        this._emit("onError");
        return false;
      } finally {
        this._requestInProgress = false;
        this._setBusy(false);
      }
    }

    clearChat() {
      this._stopPolling();
      this._sessionId = this._newSessionId();
      this._requestInProgress = false;
      this._lastResponse = null;
      this._messagesEl.innerHTML = `
        <div class="welcome" id="welcome">
          <div class="welcome-title">Ask Genie</div>
          <div class="welcome-text">
            Ask a financial question in plain English. Your question will be sent to the existing Finance Genie application.
          </div>
        </div>`;
      this._setStatus("Ready");
      this._setBusy(false);
    }

    async _poll(requestId, loading) {
      const maxAttempts = 120; // 120 x 1.5 sec = 3 minutes
      const delayMs = 1500;

      for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
        await this._delay(delayMs);

        const response = await fetch(
          `${this.getBackendUrl()}/api/chat/status/${encodeURIComponent(requestId)}`,
          { method: "GET", headers: { "Accept": "application/json" } }
        );

        const data = await this._readJson(response);

        if (data.status === "processing") {
          continue;
        }

        if (data.status === "completed" && data.success) {
          this._removeLoading(loading);
          this._appendAssistantMessage(data.message || {});
          this._lastResponse = data.message || {};
          this._setStatus("Ready");
          this._emit("onResponseReceived");
          return;
        }

        throw new Error(data.error || "Genie request failed.");
      }

      throw new Error("Genie request timed out while waiting for a response.");
    }

    async _readJson(response) {
      let data = {};
      try {
        data = await response.json();
      } catch (error) {
        throw new Error(`Invalid response from backend (${response.status}).`);
      }
      return data;
    }

    _submitFromInput() {
      const text = this._inputEl.value.trim();
      if (!text || this._requestInProgress) return;
      this._inputEl.value = "";
      this._autoResize();
      this.askGenie(text);
    }

    _appendUserMessage(text) {
      const wrapper = document.createElement("div");
      wrapper.className = "message user";
      wrapper.innerHTML = `<div class="label">You</div><div class="bubble"></div>`;
      wrapper.querySelector(".bubble").textContent = text;
      this._messagesEl.appendChild(wrapper);
      this._scrollBottom();
    }

    _appendLoading() {
      const wrapper = document.createElement("div");
      wrapper.className = "message assistant loading-message";
      wrapper.innerHTML = `
        <div class="label">Genie</div>
        <div class="bubble">
          <span class="loading"><span class="dot"></span><span class="dot"></span><span class="dot"></span> Analyzing...</span>
        </div>`;
      this._messagesEl.appendChild(wrapper);
      this._scrollBottom();
      return wrapper;
    }

    _removeLoading(element) {
      if (element && element.parentNode) element.parentNode.removeChild(element);
    }

    _appendAssistantMessage(message) {
      const wrapper = document.createElement("div");
      wrapper.className = "message assistant";

      const bubble = document.createElement("div");
      bubble.className = "bubble";

      const text = message.text || "";
      if (text) {
        const textEl = document.createElement("div");
        textEl.className = "markdown";
        textEl.innerHTML = this._renderMarkdown(text);
        bubble.appendChild(textEl);
      } else {
        const textEl = document.createElement("div");
        textEl.textContent = "Genie returned a response without display text.";
        bubble.appendChild(textEl);
      }

      if (message.sql) {
        const details = document.createElement("details");
        details.className = "details";
        const summary = document.createElement("summary");
        summary.textContent = "View SQL";
        const pre = document.createElement("pre");
        pre.className = "sql";
        pre.textContent = message.sql;
        details.appendChild(summary);
        details.appendChild(pre);
        bubble.appendChild(details);
      }

      if (message.table && Array.isArray(message.table.columns) && Array.isArray(message.table.rows)) {
        bubble.appendChild(this._buildTable(message.table));
      }

      wrapper.innerHTML = `<div class="label">Genie</div>`;
      wrapper.appendChild(bubble);
      this._messagesEl.appendChild(wrapper);
      this._scrollBottom();
    }

    _buildTable(table) {
      const wrap = document.createElement("div");
      wrap.className = "table-wrap";

      const columns = table.columns || [];
      const rows = table.rows || [];
      const tableEl = document.createElement("table");
      const thead = document.createElement("thead");
      const headRow = document.createElement("tr");

      columns.forEach((column) => {
        const th = document.createElement("th");
        th.textContent = typeof column === "string" ? column : (column.name || column.column_name || "");
        headRow.appendChild(th);
      });
      thead.appendChild(headRow);
      tableEl.appendChild(thead);

      const tbody = document.createElement("tbody");
      rows.slice(0, 500).forEach((row) => {
        const tr = document.createElement("tr");
        const values = Array.isArray(row) ? row : columns.map((column) => {
          const key = typeof column === "string" ? column : (column.name || column.column_name || "");
          return row ? row[key] : "";
        });

        values.forEach((value) => {
          const td = document.createElement("td");
          td.textContent = value == null ? "" : String(value);
          tr.appendChild(td);
        });
        tbody.appendChild(tr);
      });

      tableEl.appendChild(tbody);
      wrap.appendChild(tableEl);
      return wrap;
    }

    _renderMarkdown(text) {
      // Lightweight rendering for V1. We intentionally do not load a third-party
      // parser into the SAC widget. Escape HTML, then support common Markdown
      // constructs returned by Genie.
      let value = this._escapeHtml(String(text));
      value = value.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
      value = value.replace(/`([^`]+)`/g, "<code>$1</code>");
      value = value.replace(/^### (.*)$/gm, "<strong>$1</strong>");
      value = value.replace(/^## (.*)$/gm, "<strong>$1</strong>");
      value = value.replace(/^# (.*)$/gm, "<strong>$1</strong>");
      value = value.replace(/\n/g, "<br>");
      return value;
    }

    _showError(message) {
      const wrapper = document.createElement("div");
      wrapper.className = "message assistant";
      wrapper.innerHTML = `<div class="label">Genie</div><div class="bubble error"></div>`;
      wrapper.querySelector(".bubble").textContent = message;
      this._messagesEl.appendChild(wrapper);
      this._setStatus("Error");
      this._scrollBottom();
    }

    _removeWelcome() {
      const welcome = this.shadowRoot.getElementById("welcome");
      if (welcome) welcome.remove();
    }

    _setBusy(busy) {
      this._sendEl.disabled = busy;
      this._inputEl.disabled = busy;
    }

    _setStatus(text) {
      this._statusEl.textContent = text;
    }

    _autoResize() {
      this._inputEl.style.height = "auto";
      this._inputEl.style.height = Math.min(this._inputEl.scrollHeight, 120) + "px";
    }

    _scrollBottom() {
      requestAnimationFrame(() => {
        this._messagesEl.scrollTop = this._messagesEl.scrollHeight;
      });
    }

    _stopPolling() {
      if (this._pollTimer) {
        clearTimeout(this._pollTimer);
        this._pollTimer = null;
      }
    }

    _delay(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }

    _newSessionId() {
      if (window.crypto && window.crypto.randomUUID) {
        return window.crypto.randomUUID().replace(/-/g, "");
      }
      return (Date.now().toString(16) + Math.random().toString(16).slice(2)).padEnd(32, "0").slice(0, 32);
    }

    _emit(name) {
      this.dispatchEvent(new CustomEvent(name));
    }

    _emitPropertiesChanged() {
      this.dispatchEvent(new CustomEvent("propertiesChanged"));
    }

    _escapeHtml(value) {
      return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    }
  }

  customElements.define("com-sampurno-geniewidget", GenieWidget);
})();
