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

                        margin-bottom: 10px;

                        line-height: 1.4;
                    }

                    .label {
                        display: block;

                        font-size: 12px;

                        font-weight: 600;

                        margin-bottom: 5px;

                        color: #333333;
                    }

                    input {
                        width: 100%;

                        height: 36px;

                        padding:
                            0 10px;

                        box-sizing:
                            border-box;

                        border:
                            1px solid #cccccc;

                        border-radius: 4px;

                        font-family:
                            Arial,
                            Helvetica,
                            sans-serif;

                        font-size: 13px;

                        outline: none;
                    }

                    input:focus {
                        border-color: #777777;
                    }

                </style>


                <div class="container">

                    <div class="title">
                        Genie Assistant
                    </div>


                    <div class="description">
                        Configure the connection to the
                        Databricks Flask application.
                    </div>


                    <label class="label">
                        Databricks Backend URL
                    </label>


                    <input
                        id="backendUrl"
                        type="text"
                        placeholder="https://your-databricks-app-url"
                    />

                </div>

            `;

      this._input = this._shadowRoot.querySelector("#backendUrl");

      /*
       * SAC property change
       * when the user changes the value.
       */

      this._input.addEventListener("change", () => {
        this._propertiesChanged();
      });

      /*
       * Also save when the input loses focus.
       */

      this._input.addEventListener("blur", () => {
        this._propertiesChanged();
      });

      /*
       * Enter key.
       */

      this._input.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          event.preventDefault();

          this._propertiesChanged();

          this._input.blur();
        }
      });
    }

    /* =====================================================
           SAC PROPERTY SETTER
           ===================================================== */

    set backendUrl(value) {
      this._input.value = value || "";
    }

    /* =====================================================
           SAC PROPERTY GETTER
           ===================================================== */

    get backendUrl() {
      return this._input.value;
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
