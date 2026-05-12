/**
 * Minimal in-process HTTP server that returns configurable SPARQL JSON responses.
 *
 * Designed for integration tests of server actions (setupEndpoint, introspection).
 * The server identifies query types by looking for unique keywords in the request
 * body, then returns the configured response for that query type.
 *
 * Usage:
 *   const server = new SparqlMockServer();
 *   await server.start();
 *   server.addMatcher("DISTINCT ?graph", { mode: "ok", body: { results: { bindings: [] } } });
 *   // ... run tests ...
 *   await server.stop();
 */
import * as http from "node:http";
import type { AddressInfo } from "node:net";

// ── Response types ─────────────────────────────────────────────

/** A SPARQL results binding row. */
export type SparqlBinding = Record<string, { type: string; value: string; datatype?: string }>;

/** A well-formed SPARQL SELECT/ASK response body. */
export interface SparqlResultsBody {
  results?: { bindings: SparqlBinding[] };
  boolean?: boolean;
}

export type MockResponse =
  | { mode: "ok"; body?: SparqlResultsBody; status?: number }
  | { mode: "error"; status: number; body?: string }
  | { mode: "hang" }; // accept the connection but never send a response

interface Matcher {
  contains: string;
  response: MockResponse;
}

// ── Server class ───────────────────────────────────────────────

export class SparqlMockServer {
  private server: http.Server;

  /** Checked in order — first match wins. */
  private matchers: Matcher[] = [];

  /** Applied to ALL requests when set (overrides matchers). */
  private globalOverride: MockResponse | null = null;

  /** Returned for requests that do not match any matcher. */
  private fallback: MockResponse = { mode: "ok", body: { results: { bindings: [] } } };

  /** Bodies of all requests received, in order. */
  public requestLog: string[] = [];

  constructor() {
    this.server = http.createServer((req, res) => {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk.toString();
      });
      req.on("end", () => {
        this.requestLog.push(body);
        const response = this.globalOverride ?? this.match(body);
        this.sendResponse(res, response);
      });
    });
  }

  private match(queryBody: string): MockResponse {
    for (const m of this.matchers) {
      if (queryBody.includes(m.contains)) {
        return m.response;
      }
    }
    return this.fallback;
  }

  private sendResponse(res: http.ServerResponse, response: MockResponse): void {
    if (response.mode === "hang") {
      // Accept connection but never respond — triggers AbortSignal timeout in the caller.
      return;
    }
    if (response.mode === "error") {
      res.writeHead(response.status, { "Content-Type": "text/plain" });
      res.end(response.body ?? "Internal Server Error");
      return;
    }
    const body: SparqlResultsBody = response.body ?? { results: { bindings: [] } };
    res.writeHead(response.status ?? 200, {
      "Content-Type": "application/sparql-results+json",
    });
    res.end(JSON.stringify(body));
  }

  // ── Configuration API ────────────────────────────────────────

  /** Add a keyword-based matcher. Matchers are checked in insertion order. */
  addMatcher(contains: string, response: MockResponse): this {
    this.matchers.push({ contains, response });
    return this;
  }

  /** Override ALL requests with the given response (useful for error/hang tests). */
  setGlobal(response: MockResponse): this {
    this.globalOverride = response;
    return this;
  }

  /** Set the response for requests that do not match any matcher. */
  setFallback(response: MockResponse): this {
    this.fallback = response;
    return this;
  }

  /** Clear all matchers, the global override, and the request log. */
  reset(): this {
    this.matchers = [];
    this.globalOverride = null;
    this.requestLog = [];
    return this;
  }

  // ── Lifecycle ────────────────────────────────────────────────

  /** The SPARQL endpoint URL for this server (available after start()). */
  get url(): string {
    const addr = this.server.address() as AddressInfo;
    return `http://127.0.0.1:${addr.port}/sparql`;
  }

  async start(): Promise<void> {
    return new Promise((resolve) => {
      this.server.listen(0, "127.0.0.1", () => resolve());
    });
  }

  async stop(): Promise<void> {
    // Destroy open connections so hanging requests don't block the close.
    if (typeof (this.server as http.Server & { closeAllConnections?: () => void }).closeAllConnections === "function") {
      (this.server as http.Server & { closeAllConnections: () => void }).closeAllConnections();
    }
    return new Promise((resolve, reject) => {
      this.server.close((err) => (err ? reject(err) : resolve()));
    });
  }
}

// ── Convenience response builders ─────────────────────────────

/** A minimal successful SPARQL ASK response (capability probes). */
export const ASK_FALSE: SparqlResultsBody = { boolean: false };

/** A SPARQL SELECT response with a single named-graph binding. */
export function singleGraphResponse(
  graphIRI: string,
  tripleCount = 10,
): SparqlResultsBody {
  return {
    results: {
      bindings: [
        {
          graph: { type: "uri", value: graphIRI },
          tripleCount: { type: "literal", value: String(tripleCount) },
        },
      ],
    },
  };
}

/** A SPARQL SELECT response with a default-graph triple count (no named graphs). */
export function defaultGraphCountResponse(tripleCount = 10): SparqlResultsBody {
  return {
    results: {
      bindings: [{ tripleCount: { type: "literal", value: String(tripleCount) } }],
    },
  };
}

/** A SPARQL SELECT response with a list of predicate bindings (sample-graph query). */
export function predicateBindingsResponse(
  predicates: Array<{ iri: string; valueKind?: string; subjectCount?: number; objectCount?: number }>,
): SparqlResultsBody {
  return {
    results: {
      bindings: predicates.map((p) => ({
        predicate: { type: "uri", value: p.iri },
        valueKind: { type: "literal", value: p.valueKind ?? "literal" },
        subjectCount: { type: "literal", value: String(p.subjectCount ?? 5) },
        objectCount: { type: "literal", value: String(p.objectCount ?? 5) },
      })),
    },
  };
}
