import { describe, it, expect, beforeEach } from "vitest";
import { useEndpointStore } from "@/stores/endpoint-store";
import type { EndpointConfig } from "@/lib/types";

const SAMPLE_CONFIG: EndpointConfig = {
  id: "test-ep",
  label: "Test Endpoint",
  sparqlUrl: "http://localhost:7200/repositories/test",
};

const resetStore = () => {
  useEndpointStore.setState({
    endpoints: [],
    introspectionCache: {},
  });
};

describe("endpoint-store", () => {
  beforeEach(resetStore);

  it("addEndpoint(config) stores the config and makes it retrievable", () => {
    useEndpointStore.getState().addEndpoint(SAMPLE_CONFIG);
    const stored = useEndpointStore.getState().getEndpoint("test-ep");
    expect(stored).toBeDefined();
    expect(stored?.id).toBe("test-ep");
    expect(stored?.sparqlUrl).toBe(SAMPLE_CONFIG.sparqlUrl);
  });

  it("removeEndpoint(id) resets to initial disconnected state", () => {
    useEndpointStore.getState().addEndpoint(SAMPLE_CONFIG);
    expect(useEndpointStore.getState().endpoints).toHaveLength(1);

    useEndpointStore.getState().removeEndpoint("test-ep");

    const { endpoints, introspectionCache } = useEndpointStore.getState();
    expect(endpoints).toHaveLength(0);
    expect(Object.keys(introspectionCache)).toHaveLength(0);
  });

  it("updateEndpoint(id, { labelPredicate }) updates the predicate without changing other fields", () => {
    useEndpointStore.getState().addEndpoint(SAMPLE_CONFIG);
    useEndpointStore.getState().updateEndpoint("test-ep", {
      labelPredicate: "http://www.w3.org/2000/01/rdf-schema#label",
    });

    const updated = useEndpointStore.getState().getEndpoint("test-ep");
    expect(updated?.labelPredicate).toBe(
      "http://www.w3.org/2000/01/rdf-schema#label"
    );
    // Other fields remain unchanged
    expect(updated?.id).toBe(SAMPLE_CONFIG.id);
    expect(updated?.label).toBe(SAMPLE_CONFIG.label);
    expect(updated?.sparqlUrl).toBe(SAMPLE_CONFIG.sparqlUrl);
  });
});
