(function () {
  class GenieWidgetStylingPanel extends HTMLElement {
    constructor() {
      super();

      this._shadowRoot = this.attachShadow({
        mode: "open",
      });

      this._shadowRoot.innerHTML = `
        <style>
          :host {
            display: block;
            font-family: Arial, Helvetica, sans-serif;
          }

          .container {
            padding: 16px;
          }

          .title {
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 8px;
          }

          .description {
            font-size: 12px;
            color: #666666;
            margin-bottom: 14px;
            line-height: 1.4;
          }

          .field {
            margin-bottom: 16px;
          }

          .label {
            display: block;
            font-size: 12px;
            font-weight: 600;
            margin-bottom: 5px;
            color: #333333;
          }

          .help {
            font-size: 10px;
            color: #777777;
            margin-top: 5px;
            line-height: 1.4;
          }

          input {
            width: 100%;
            height: 36px;
            padding: 0 10px;
            box-sizing: border-box;

            border: 1px solid #cccccc;
            border-radius: 4px;

            font-family: Arial, Helvetica, sans-serif;
            font-size: 13px;

            outline: none;

            color: #222222;
            background: #ffffff;
          }

          input:focus {
            border-color: #777777;
          }

          input[type="password"] {
            font-family: Consolas, Monaco, monospace;
            letter-spacing: 0.5px;
          }

          .warning {
            margin-top: 6px;
            padding: 8px 10px;

            border-radius: 4px;

            background: #fff7e6;
            color: #8a5a00;

            font-size: 10px;
            line-height: 1.4;
          }
        </style>

        <div class="container">

          <div class="title">
            Genie Assistant
          </div>

          <div class="description">
            Configure the connection to the
            Databricks Finance Genie application.
          </div>


          <!-- =========================================
               BACKEND URL
               ========================================= -->

          <div class="field">

            <label class="label">
              Databricks Backend URL
            </label>

            <input
              id="backendUrl"
              type="text"
              autocomplete="off"
              spellcheck="false"
              placeholder="https://your-databricks-app-url"
            />

            <div class="help">
              Base URL of the Databricks Flask application.
            </div>

          </div>


          <!-- =========================================
               WORKSPACE HOST
               ========================================= -->

          <div class="field">

            <label class="label">
              Databricks Workspace Host
            </label>

            <input
              id="workspaceHost"
              type="text"
              autocomplete="off"
              spellcheck="false"
              placeholder="https://dbc-xxxxxxxx.cloud.databricks.com"
            />

            <div class="help">
              Databricks workspace URL used for OAuth authentication.
            </div>

          </div>


          <!-- =========================================
               CLIENT ID
               ========================================= -->

          <div class="field">

            <label class="label">
              OAuth Client ID
            </label>

            <input
              id="clientId"
              type="text"
              autocomplete="off"
              spellcheck="false"
              placeholder="OAuth service principal client ID"
            />

            <div class="help">
              OAuth client ID for the Databricks service principal.
            </div>

          </div>


          <!-- =========================================
               CLIENT SECRET
               ========================================= -->

          <div class="field">

            <label class="label">
              OAuth Client Secret
            </label>

            <input
              id="clientSecret"
              type="password"
              autocomplete="off"
              spellcheck="false"
              placeholder="OAuth client secret"
            />

            <div class="help">
              Service principal OAuth secret used to obtain a short-lived access token.
            </div>

          </div>


          <!-- =========================================
               OAUTH SCOPE
               ========================================= -->

          <div class="field">

            <label class="label">
              OAuth Scope
            </label>

            <input
              id="oauthScope"
              type="text"
              autocomplete="off"
              spellcheck="false"
              value="all-apis"
              placeholder="all-apis"
            />

            <div class="help">
              OAuth scope requested from Databricks.
            </div>

          </div>


          <!-- =========================================
               SECURITY WARNING
               ========================================= -->

          <div class="warning">
            POC only: the OAuth client secret is entered
            in the SAC browser and is therefore browser-visible.
            Do not use this approach for production.
          </div>

        </div>
      `;

      /*
       * =====================================================
       * INPUT REFERENCES
       * =====================================================
       */

      this._backendUrlInput = this._shadowRoot.querySelector("#backendUrl");

      this._workspaceHostInput =
        this._shadowRoot.querySelector("#workspaceHost");

      this._clientIdInput = this._shadowRoot.querySelector("#clientId");

      this._clientSecretInput = this._shadowRoot.querySelector("#clientSecret");

      this._oauthScopeInput = this._shadowRoot.querySelector("#oauthScope");

      /*
       * =====================================================
       * BACKEND URL EVENTS
       * =====================================================
       */

      this._backendUrlInput.addEventListener("change", () => {
        this._propertiesChanged();
      });

      this._backendUrlInput.addEventListener("blur", () => {
        this._propertiesChanged();
      });

      this._backendUrlInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          event.preventDefault();

          this._propertiesChanged();

          this._backendUrlInput.blur();
        }
      });

      /*
       * =====================================================
       * WORKSPACE HOST EVENTS
       * =====================================================
       */

      this._workspaceHostInput.addEventListener("change", () => {
        this._propertiesChanged();
      });

      this._workspaceHostInput.addEventListener("blur", () => {
        this._propertiesChanged();
      });

      this._workspaceHostInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          event.preventDefault();

          this._propertiesChanged();

          this._workspaceHostInput.blur();
        }
      });

      /*
       * =====================================================
       * CLIENT ID EVENTS
       * =====================================================
       */

      this._clientIdInput.addEventListener("change", () => {
        this._propertiesChanged();
      });

      this._clientIdInput.addEventListener("blur", () => {
        this._propertiesChanged();
      });

      this._clientIdInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          event.preventDefault();

          this._propertiesChanged();

          this._clientIdInput.blur();
        }
      });

      /*
       * =====================================================
       * CLIENT SECRET EVENTS
       * =====================================================
       */

      this._clientSecretInput.addEventListener("change", () => {
        this._propertiesChanged();
      });

      this._clientSecretInput.addEventListener("blur", () => {
        this._propertiesChanged();
      });

      this._clientSecretInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          event.preventDefault();

          this._propertiesChanged();

          this._clientSecretInput.blur();
        }
      });

      /*
       * =====================================================
       * OAUTH SCOPE EVENTS
       * =====================================================
       */

      this._oauthScopeInput.addEventListener("change", () => {
        this._propertiesChanged();
      });

      this._oauthScopeInput.addEventListener("blur", () => {
        this._propertiesChanged();
      });

      this._oauthScopeInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          event.preventDefault();

          this._propertiesChanged();

          this._oauthScopeInput.blur();
        }
      });
    }

    /*
     * =========================================================
     * SAC PROPERTY LIFECYCLE
     * =========================================================
     */

    onCustomWidgetBeforeUpdate(changedProperties) {
      /*
       * SAC provides changedProperties as a Map-like object.
       */

      if (
        changedProperties &&
        typeof changedProperties.has === "function" &&
        changedProperties.has("backendUrl")
      ) {
        const value = changedProperties.get("backendUrl");

        this.backendUrl = value || "";
      }

      if (
        changedProperties &&
        typeof changedProperties.has === "function" &&
        changedProperties.has("workspaceHost")
      ) {
        const value = changedProperties.get("workspaceHost");

        this.workspaceHost = value || "";
      }

      if (
        changedProperties &&
        typeof changedProperties.has === "function" &&
        changedProperties.has("clientId")
      ) {
        const value = changedProperties.get("clientId");

        this.clientId = value || "";
      }

      if (
        changedProperties &&
        typeof changedProperties.has === "function" &&
        changedProperties.has("clientSecret")
      ) {
        const value = changedProperties.get("clientSecret");

        this.clientSecret = value || "";
      }

      if (
        changedProperties &&
        typeof changedProperties.has === "function" &&
        changedProperties.has("oauthScope")
      ) {
        const value = changedProperties.get("oauthScope");

        this.oauthScope = value || "all-apis";
      }
    }

    onCustomWidgetAfterUpdate() {
      /*
       * Make sure the styling panel reflects
       * the latest SAC property values.
       */

      if (this._backendUrlInput) {
        this._backendUrlInput.value = this.backendUrl || "";
      }

      if (this._workspaceHostInput) {
        this._workspaceHostInput.value = this.workspaceHost || "";
      }

      if (this._clientIdInput) {
        this._clientIdInput.value = this.clientId || "";
      }

      if (this._clientSecretInput) {
        this._clientSecretInput.value = this.clientSecret || "";
      }

      if (this._oauthScopeInput) {
        this._oauthScopeInput.value = this.oauthScope || "all-apis";
      }
    }

    /*
     * =========================================================
     * BACKEND URL PROPERTY
     * =========================================================
     */

    set backendUrl(value) {
      if (this._backendUrlInput) {
        this._backendUrlInput.value = value || "";
      }
    }

    get backendUrl() {
      if (!this._backendUrlInput) {
        return "";
      }

      return this._backendUrlInput.value || "";
    }

    /*
     * =========================================================
     * WORKSPACE HOST PROPERTY
     * =========================================================
     */

    set workspaceHost(value) {
      if (this._workspaceHostInput) {
        this._workspaceHostInput.value = value || "";
      }
    }

    get workspaceHost() {
      if (!this._workspaceHostInput) {
        return "";
      }

      return this._workspaceHostInput.value || "";
    }

    /*
     * =========================================================
     * CLIENT ID PROPERTY
     * =========================================================
     */

    set clientId(value) {
      if (this._clientIdInput) {
        this._clientIdInput.value = value || "";
      }
    }

    get clientId() {
      if (!this._clientIdInput) {
        return "";
      }

      return this._clientIdInput.value || "";
    }

    /*
     * =========================================================
     * CLIENT SECRET PROPERTY
     * =========================================================
     */

    set clientSecret(value) {
      if (this._clientSecretInput) {
        this._clientSecretInput.value = value || "";
      }
    }

    get clientSecret() {
      if (!this._clientSecretInput) {
        return "";
      }

      return this._clientSecretInput.value || "";
    }

    /*
     * =========================================================
     * OAUTH SCOPE PROPERTY
     * =========================================================
     */

    set oauthScope(value) {
      if (this._oauthScopeInput) {
        this._oauthScopeInput.value = value || "all-apis";
      }
    }

    get oauthScope() {
      if (!this._oauthScopeInput) {
        return "all-apis";
      }

      return this._oauthScopeInput.value || "all-apis";
    }

    /*
     * =========================================================
     * NOTIFY SAC OF PROPERTY CHANGES
     * =========================================================
     */

    _propertiesChanged() {
      this.dispatchEvent(
        new CustomEvent("propertiesChanged", {
          detail: {
            properties: {
              backendUrl: this.backendUrl,

              workspaceHost: this.workspaceHost,

              clientId: this.clientId,

              clientSecret: this.clientSecret,

              oauthScope: this.oauthScope,
            },
          },
        }),
      );
    }
  }

  /*
   * ===========================================================
   * REGISTER SAC STYLING COMPONENT
   * ===========================================================
   */

  if (!customElements.get("com-sampurno-geniewidget-styling")) {
    customElements.define(
      "com-sampurno-geniewidget-styling",
      GenieWidgetStylingPanel,
    );
  }
})();
