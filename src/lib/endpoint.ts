import type { EndpointConfig, EndpointCapabilities } from "./types";

const DEFAULT_CAPABILITIES: EndpointCapabilities = {
  isPgRipple: false,
  sparql11Query: true,
  sparql11Update: false,
  sparqlProtocol: true,
  contentFormats: ["application/sparql-results+json"],
  fullTextSearch: false,
  federation: false,
  vectorSearch: false,
  datalogReasoning: false,
  shaclValidation: false,
  jsonldFraming: false,
  graphStoreProtocol: false,
  ragRetrieval: false,
};

export async function detectCapabilities(
  sparqlUrl: string,
): Promise<EndpointCapabilities> {
  const caps: EndpointCapabilities = { ...DEFAULT_CAPABILITIES };

  // Probe pg-ripple canary
  try {
    const response = await fetch(sparqlUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/sparql-query",
        Accept: "application/sparql-results+json",
      },
      body: `ASK { BIND(<http://pg-ripple.io/fn/similar> AS ?fn) FILTER(isIRI(?fn)) }`,
      signal: AbortSignal.timeout(5000),
    });
    if (response.ok) {
      const result = await response.json();
      caps.isPgRipple = result?.boolean === true;
    }
  } catch {
    // not pg-ripple, that's fine
  }

  if (caps.isPgRipple) {
    caps.sparql11Update = true;
    caps.federation = true;
    caps.fullTextSearch = true;
    caps.vectorSearch = true;
    caps.datalogReasoning = true;
    caps.shaclValidation = true;
    caps.jsonldFraming = true;
    caps.graphStoreProtocol = true;
  }

  return caps;
}

export function buildAuthHeader(auth: NonNullable<EndpointConfig["auth"]>): string {
  if (auth.type === "basic") {
    return `Basic ${Buffer.from(auth.credentials).toString("base64")}`;
  }
  return `Bearer ${auth.credentials}`;
}
