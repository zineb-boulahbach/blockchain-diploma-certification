/**
 * JSON-RPC HTTP provider for Truffle + @truffle/hdwallet-provider.
 * Infura / public RPCs sometimes return empty bodies or 429 under burst load;
 * web3's fetch-based HttpProvider then throws "Invalid JSON RPC response: {}".
 * This implementation retries with backoff and limits to one socket to reduce parallelism.
 */

const http = require("http");
const https = require("https");
const { URL } = require("url");

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function isEmptyRpcBody(parsed) {
  if (parsed == null) return true;
  if (typeof parsed !== "object") return false;
  if (Array.isArray(parsed)) return parsed.length === 0;
  return Object.keys(parsed).length === 0;
}

class RetryingJsonRpcProvider {
  /**
   * @param {string} rpcUrl
   * @param {{ maxRetries?: number; timeoutMs?: number }} [opts]
   */
  constructor(rpcUrl, opts = {}) {
    this.rpcUrl = rpcUrl;
    const u = new URL(rpcUrl);
    this.host = u.host;
    this._maxRetries = opts.maxRetries ?? 6;
    this._timeoutMs = opts.timeoutMs ?? 90000;
    const agentOpts = { keepAlive: true, maxSockets: 1, maxFreeSockets: 1 };
    this._agent =
      u.protocol === "https:"
        ? new https.Agent(agentOpts)
        : new http.Agent(agentOpts);
  }

  send(payload, callback) {
    this._sendOnce(payload, 0, callback);
  }

  sendAsync(payload, callback) {
    return this.send(payload, callback);
  }

  _sendOnce(payload, attempt, callback) {
    const body = JSON.stringify(payload);
    const u = new URL(this.rpcUrl);
    const lib = u.protocol === "https:" ? https : http;
    const port = u.port || (u.protocol === "https:" ? 443 : 80);
    const pathWithQuery = `${u.pathname}${u.search}`;

    const options = {
      agent: this._agent,
      hostname: u.hostname,
      port,
      path: pathWithQuery || "/",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body, "utf8"),
      },
    };

    const req = lib.request(options, (res) => {
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => {
        const text = Buffer.concat(chunks).toString("utf8");
        const status = res.statusCode ?? 0;
        const retryableHttp =
          status === 408 ||
          status === 429 ||
          status === 502 ||
          status === 503 ||
          status === 504;
        const empty = text.trim() === "";

        const finishRetry = (err) => {
          if (attempt + 1 >= this._maxRetries) {
            return callback(err);
          }
          const delay = Math.min(1500 * 2 ** attempt, 25000);
          void sleep(delay).then(() => this._sendOnce(payload, attempt + 1, callback));
        };

        if (retryableHttp || empty) {
          return finishRetry(
            new Error(`RPC retryable response: HTTP ${status}, body length ${text.length}`)
          );
        }

        if (status !== 200) {
          return callback(
            new Error(`RPC HTTP ${status}: ${text.slice(0, 500)}`)
          );
        }

        let parsed;
        try {
          parsed = text ? JSON.parse(text) : null;
        } catch (e) {
          return finishRetry(e);
        }

        if (isEmptyRpcBody(parsed)) {
          return finishRetry(new Error("RPC returned empty JSON object"));
        }

        callback(null, parsed);
      });
    });

    req.setTimeout(this._timeoutMs, () => {
      req.destroy(new Error("RPC socket timeout"));
    });

    req.on("error", (err) => {
      if (attempt + 1 >= this._maxRetries) {
        return callback(err);
      }
      const delay = Math.min(1500 * 2 ** attempt, 25000);
      void sleep(delay).then(() => this._sendOnce(payload, attempt + 1, callback));
    });

    req.write(body);
    req.end();
  }
}

module.exports = { RetryingJsonRpcProvider };
