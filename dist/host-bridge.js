/**
 * SugoiHost — minimal SDK for sugoi-webview host bindings (window.host* from Go webview.Bind).
 * See README "JS SDK" for Bind names and caveats.
 *
 * 在普通浏览器中 window 上通常没有 host* 函数：{@link SugoiHost.capabilities} 会为 false，
 * 页面应降级（例如原生「选择文件」、Blob 下载），勿直接调用会抛错的 API。
 *
 * 可选：拖入的 {@link File} 若需磁盘路径，由宿主在全局挂接 **hostGetPathForFile**（如 Electron preload 里用
 * `webUtils.getPathForFile`）。见 README「拖入文件路径」。
 */
(function (g) {
  "use strict";

  function has(name) {
    return typeof g[name] === "function";
  }

  /**
   * @param {string} name 绑定名，如 hostFsRead
   * @param {unknown[]} args
   * @returns {Promise<unknown>}
   */
  async function invoke(name, args) {
    const fn = g[name];
    if (typeof fn !== "function") {
      throw new Error("SugoiHost: binding missing: " + name);
    }
    return fn.apply(null, args);
  }

  /**
   * @param {string} b64
   * @returns {Uint8Array}
   */
  function base64ToUint8Array(b64) {
    var bin = atob(b64);
    var len = bin.length;
    var u8 = new Uint8Array(len);
    for (var i = 0; i < len; i++) {
      u8[i] = bin.charCodeAt(i) & 255;
    }
    return u8;
  }

  /**
   * 各 host* 是否在运行环境中存在（可先查再调，避免 invoke 抛错）。
   * @type {Readonly<Record<string, boolean>>}
   */
  const capabilities = {
    fsRead: has("hostFsRead"),
    fsReadBase64: has("hostFsReadBase64"),
    fsWrite: has("hostFsWrite"),
    fsWriteBase64: has("hostFsWriteBase64"),
    fsPickOpen: has("hostFsPickOpen"),
    fsPickSave: has("hostFsPickSave"),
    fsPickFolder: has("hostFsPickFolder"),
    clipboardGet: has("hostClipboardGet"),
    clipboardSet: has("hostClipboardSet"),
    shellReveal: has("hostShellReveal"),
    shellOpen: has("hostShellOpen"),
    /** 宿主是否注入 `hostGetPathForFile`（拖入 File → 本机路径，非 Go Bind） */
    fsPathFromDroppedFile: has("hostGetPathForFile"),
  };

  /** @type {typeof globalThis.SugoiHost} */
  const SugoiHost = {
    capabilities,

    /**
     * 读取本地 UTF-8 文本文件（大小上限由宿主决定）。
     * @param {string} path 文件路径
     * @returns {Promise<{ path: string, content: string }>}
     */
    fsRead: function (path) {
      return invoke("hostFsRead", [path]);
    },

    /**
     * 读入整个文件为标准 Base64（二进制安全）。大小上限同 fsRead（HostMaxFileSize）。
     * @param {string} path
     * @returns {Promise<{ path: string, base64: string }>}
     */
    fsReadBase64: function (path) {
      return invoke("hostFsReadBase64", [path]);
    },

    /**
     * 读入文件并解码为 Uint8Array（便捷）。
     * @param {string} path
     * @returns {Promise<Uint8Array>}
     */
    fsReadBytes: async function (path) {
      var res = await invoke("hostFsReadBase64", [path]);
      var b64 = res && res.base64;
      if (typeof b64 !== "string") {
        throw new Error("SugoiHost.fsReadBytes: missing base64 in response");
      }
      return base64ToUint8Array(b64);
    },

    /**
     * 覆盖写入文本文件；命中受保护路径前缀时拒绝并抛错（可用 {@link SugoiHost.isProtectedWriteError} 判断）。
     * @param {string} path 目标路径
     * @param {string} content 全文
     * @returns {Promise<{ path: string }>}
     */
    fsWrite: function (path, content) {
      return invoke("hostFsWrite", [path, content]);
    },

    /**
     * 标准 Base64 解码后写入（二进制安全）。可传整段 data:*;base64,...。
     * 路径策略与 fsWrite 相同。
     * @param {string} path
     * @param {string} base64
     * @returns {Promise<{ path: string }>}
     */
    fsWriteBase64: function (path, base64) {
      return invoke("hostFsWriteBase64", [path, base64]);
    },

    /**
     * Uint8Array / ArrayBuffer / Blob → Base64 → 写入（便捷）。
     * @param {string} path
     * @param {Blob|ArrayBuffer|Uint8Array} data
     * @returns {Promise<{ path: string }>}
     */
    fsWriteBytes: function (path, data) {
      return (async function () {
        var u8;
        if (typeof Blob !== "undefined" && data instanceof Blob) {
          u8 = new Uint8Array(await data.arrayBuffer());
        } else if (data instanceof ArrayBuffer) {
          u8 = new Uint8Array(data);
        } else {
          u8 = /** @type {Uint8Array} */ (data);
        }
        var chunk = 0x8000;
        var parts = [];
        for (var i = 0; i < u8.length; i += chunk) {
          parts.push(
            String.fromCharCode.apply(null, u8.subarray(i, i + chunk))
          );
        }
        var b64 = btoa(parts.join(""));
        return invoke("hostFsWriteBase64", [path, b64]);
      })();
    },

    /**
     * 系统「打开文件」对话框，返回用户所选路径（不含读文件内容，需再 fsRead）。
     * @returns {Promise<{ path: string }>}
     */
    fsPickOpen: function () {
      return invoke("hostFsPickOpen", []);
    },

    /**
     * 系统「另存为」对话框。
     * @param {string} [defaultName] 建议文件名，缺省为 document.txt
     * @returns {Promise<{ path: string }>}
     */
    fsPickSave: function (defaultName) {
      return invoke("hostFsPickSave", [defaultName || "document.txt"]);
    },

    /**
     * 系统选择文件夹对话框。
     * @returns {Promise<{ path: string }>}
     */
    fsPickFolder: function () {
      return invoke("hostFsPickFolder", []);
    },

    /**
     * 从拖入等方式得到的 {@link File} 解析本机绝对路径（若宿主支持）。
     * 调用全局 **hostGetPathForFile(file)**（非 Go `Bind`，须 preload / 壳层注入）。
     * 宿主可返回 `string`、`Promise<string>` 或 `{ path: string }`；空或无法解析时返回 `null`。
     * @param {File} file
     * @returns {Promise<string|null>}
     */
    getPathForFile: async function (file) {
      var fn = g.hostGetPathForFile;
      if (typeof fn !== "function") {
        throw new Error(
          "SugoiHost: hostGetPathForFile missing (see README; e.g. Electron preload + webUtils.getPathForFile)"
        );
      }
      if (file == null) {
        throw new Error("SugoiHost.getPathForFile: file is required");
      }
      var out = fn.call(g, file);
      if (out != null && typeof out.then === "function") {
        out = await out;
      }
      if (out == null || out === "") {
        return null;
      }
      if (typeof out === "string") {
        return out;
      }
      if (typeof out === "object" && out.path != null) {
        var p = String(out.path);
        return p === "" ? null : p;
      }
      throw new Error(
        "SugoiHost.getPathForFile: expected string, Promise<string>, or { path }"
      );
    },

    /**
     * 读取系统剪贴板文本。
     * @returns {Promise<{ text: string }>}
     */
    clipboardGet: function () {
      return invoke("hostClipboardGet", []);
    },

    /**
     * 写入系统剪贴板文本。
     * @param {string} text
     * @returns {Promise<void>}
     */
    clipboardSet: function (text) {
      return invoke("hostClipboardSet", [text]);
    },

    /**
     * 在文件管理器中显示并选中该路径（能力因平台而异）。
     * @param {string} path
     * @returns {Promise<void>}
     */
    shellReveal: function (path) {
      return invoke("hostShellReveal", [path]);
    },

    /**
     * 用系统默认应用打开路径或 URL。
     * @param {string} path
     * @returns {Promise<void>}
     */
    shellOpen: function (path) {
      return invoke("hostShellOpen", [path]);
    },

    /**
     * 判断写入失败是否因命中受保护路径（hostsecurity 配置）。
     * @param {unknown} err
     * @returns {boolean}
     */
    isProtectedWriteError: function (err) {
      const s = String(err && err.message ? err.message : err || "");
      return s.indexOf("refused: protected path") !== -1;
    },
  };

  g.SugoiHost = SugoiHost;
})(typeof globalThis !== "undefined" ? globalThis : window);
