import { describe, it, expect, beforeEach } from "vitest";
import { useNavigationStore } from "@/stores/navigation-store";
import type { LensFrame } from "@/lib/types";

const INITIAL_FRAME: LensFrame = {
  endpointId: "",
  graphIRI: null,
  context: "graphs",
  focusIRI: "",
  activeLayer: 1,
  facets: {},
};

const resetStore = () => {
  useNavigationStore.setState({
    stack: [INITIAL_FRAME],
    pointer: 0,
  });
};

// Helper: push a graph frame (triggers the internal pushFrame logic)
const pushGraph = (ep = "ep1", graph = "http://example.org/g") =>
  useNavigationStore.getState().setGraph(ep, graph);

describe("navigation-store", () => {
  beforeEach(resetStore);

  it("initial state has one frame and pointer = 0", () => {
    const { stack, pointer } = useNavigationStore.getState();
    expect(stack).toHaveLength(1);
    expect(pointer).toBe(0);
  });

  it("push(frame) appends to the stack and increments the pointer", () => {
    pushGraph("ep1", "http://example.org/g1");
    const { stack, pointer } = useNavigationStore.getState();
    expect(stack).toHaveLength(2);
    expect(pointer).toBe(1);
  });

  it("push(frame) when pointer is mid-stack truncates forward history", () => {
    pushGraph("ep1", "http://example.org/g1");
    pushGraph("ep1", "http://example.org/g2");
    // stack: [init, g1, g2], pointer = 2
    useNavigationStore.getState().back();
    // pointer = 1
    expect(useNavigationStore.getState().pointer).toBe(1);

    // Push a new frame — forward history (g2) should be truncated
    pushGraph("ep1", "http://example.org/g3");
    const { stack, pointer } = useNavigationStore.getState();
    // stack should be: [init, g1, g3] — g2 was dropped
    expect(stack).toHaveLength(3);
    expect(pointer).toBe(2);
    expect(stack[2].graphIRI).toBe("http://example.org/g3");
  });

  it("back() decrements pointer; no-ops when pointer is 0", () => {
    pushGraph("ep1", "http://example.org/g1");
    useNavigationStore.getState().back();
    expect(useNavigationStore.getState().pointer).toBe(0);

    // Should not go below 0
    useNavigationStore.getState().back();
    expect(useNavigationStore.getState().pointer).toBe(0);
  });

  it("forward() increments pointer; no-ops when at end of stack", () => {
    pushGraph("ep1", "http://example.org/g1");
    useNavigationStore.getState().back();
    expect(useNavigationStore.getState().pointer).toBe(0);

    useNavigationStore.getState().forward();
    expect(useNavigationStore.getState().pointer).toBe(1);

    // Should not go past end
    useNavigationStore.getState().forward();
    expect(useNavigationStore.getState().pointer).toBe(1);
  });

  it("after back(); push(newFrame), forward() does nothing", () => {
    pushGraph("ep1", "http://example.org/g1");
    pushGraph("ep1", "http://example.org/g2");
    useNavigationStore.getState().back();
    // pointer = 1, stack length = 3

    // Push truncates forward history
    pushGraph("ep1", "http://example.org/g3");
    const { stack, pointer: pointerBefore } = useNavigationStore.getState();
    expect(pointerBefore).toBe(stack.length - 1);

    // forward() should be a no-op
    useNavigationStore.getState().forward();
    expect(useNavigationStore.getState().pointer).toBe(stack.length - 1);
  });
});
