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

            font-family:
              Arial,
              Helvetica,
              sans-serif;
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

            border:
              1px solid #cccccc;

            border-radius: 4px;

            font-family:
              Arial,
              Helvetica,
              sans-serif;

            font-size: 13px;

            outline: none;

            color: #222222;

            background: #ffffff;
          }

          input:focus {
            border-color: #777777;
          }

          input[type="password"] {
            font-family:
              Consolas,
              Monaco,
              monospace;

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


          <!-- BACKEND URL -->

          <div class="field">

            <label class="label">
              Databricks Backend URL
            </label>

            <input
              id="backendUrl"
              type="text"
              autocomplete="off"
              placeholder="https://your-databricks-app-url"
            />

            <div class="help">
              Base URL of the Databricks Flask application.
            </div>

          </div>


          <!-- ACCESS TOKEN -->

          <div class="field">

            <label class="label">
              OAuth Access Token
            </label>

            <input
              id="accessToken"
              type="password"
              autocomplete="off"
              spellcheck="false"
              placeholder="Paste OAuth access token"
            />

            <div class="help">
              Short-lived Databricks OAuth 2.0 access token
              used to authenticate API requests.
            </div>

          </div>


          <!-- SECURITY WARNING -->

          <div class="warning">
            POC only: do not use a long-lived token or
            client secret here. This value is available
            to the browser.
          </div>

        </div>
      `;

      this._backendUrlInput = this._shadowRoot.querySelector("#backendUrl");

      this._accessTokenInput = this._shadowRoot.querySelector("#accessToken");

      /*
       * BACKEND URL
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
       * ACCESS TOKEN
       */

      this._accessTokenInput.addEventListener("change", () => {
        this._propertiesChanged();
      });

      this._accessTokenInput.addEventListener("blur", () => {
        this._propertiesChanged();
      });

      this._accessTokenInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          event.preventDefault();

          this._propertiesChanged();

          this._accessTokenInput.blur();
        }
      });
    }

    /* =====================================================
       SAC PROPERTY HANDLING
       ===================================================== */

    onCustomWidgetBeforeUpdate(changedProperties) {
      if (
        Object.prototype.hasOwnProperty.call(changedProperties, "backendUrl")
      ) {
        this.backendUrl = changedProperties.backendUrl || "";
      }

      if (
        Object.prototype.hasOwnProperty.call(changedProperties, "accessToken")
      ) {
        this.accessToken = changedProperties.accessToken || "";
      }
    }

    onCustomWidgetAfterUpdate() {
      this._backendUrlInput.value = this.backendUrl || "";

      this._accessTokenInput.value = this.accessToken || "";
    }

    /* =====================================================
       BACKEND URL
       ===================================================== */

    set backendUrl(value) {
      this._backendUrlInput.value = value || "";
    }

    get backendUrl() {
      return this._backendUrlInput.value;
    }

    /* =====================================================
       ACCESS TOKEN
       ===================================================== */

    set accessToken(value) {
      this._accessTokenInput.value = value || "";
    }

    get accessToken() {
      return this._accessTokenInput.value;
    }

    /* =====================================================
       NOTIFY SAC
       ===================================================== */

    _propertiesChanged() {
      this.dispatchEvent(
        new CustomEvent("propertiesChanged", {
          detail: {
            properties: {
              backendUrl: this.backendUrl,

              accessToken: this.accessToken,
            },
          },
        }),
      );
    }
  }

  /* =========================================================
     REGISTER STYLING COMPONENT
     ========================================================= */

  if (!customElements.get("com-sampurno-geniewidget-styling")) {
    customElements.define(
      "com-sampurno-geniewidget-styling",

      GenieWidgetStylingPanel,
    );
  }
})();
