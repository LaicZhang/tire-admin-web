import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mount } from "@vue/test-utils";
import { defineComponent } from "vue";
import { lazy } from "../index";

// Mock IntersectionObserver
const mockObserve = vi.fn();
const mockUnobserve = vi.fn();
const mockDisconnect = vi.fn();

let intersectionCallback: IntersectionObserverCallback;

class MockIntersectionObserver {
  constructor(callback: IntersectionObserverCallback) {
    intersectionCallback = callback;
  }

  observe = mockObserve;
  unobserve = mockUnobserve;
  disconnect = mockDisconnect;
}

describe("lazy directive", () => {
  beforeEach(() => {
    vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
    mockObserve.mockClear();
    mockUnobserve.mockClear();
    mockDisconnect.mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("should set loading placeholder on mount", () => {
    const TestComponent = defineComponent({
      directives: { lazy },
      template: '<img v-lazy="imageUrl" />',
      setup() {
        return { imageUrl: "https://example.com/image.jpg" };
      }
    });

    const wrapper = mount(TestComponent);
    const img = wrapper.find("img");

    // Should have data-src attribute
    expect(img.attributes("data-src")).toBe("https://example.com/image.jpg");
    // Should have placeholder src
    expect(img.attributes("src")).toContain("data:image/svg+xml");
  });

  it("should observe the image element", () => {
    const TestComponent = defineComponent({
      directives: { lazy },
      template: '<img v-lazy="imageUrl" />',
      setup() {
        return { imageUrl: "https://example.com/image.jpg" };
      }
    });

    mount(TestComponent);

    expect(mockObserve).toHaveBeenCalled();
  });

  it("should accept object with options", () => {
    const TestComponent = defineComponent({
      directives: { lazy },
      template: '<img v-lazy="lazyOptions" />',
      setup() {
        return {
          lazyOptions: {
            src: "https://example.com/image.jpg",
            loading: "https://example.com/loading.gif"
          }
        };
      }
    });

    const wrapper = mount(TestComponent);
    const img = wrapper.find("img");

    expect(img.attributes("data-src")).toBe("https://example.com/image.jpg");
    expect(img.attributes("src")).toBe("https://example.com/loading.gif");
  });

  it("should disconnect observer on unmount", () => {
    const TestComponent = defineComponent({
      directives: { lazy },
      template: '<img v-lazy="imageUrl" />',
      setup() {
        return { imageUrl: "https://example.com/image.jpg" };
      }
    });

    const wrapper = mount(TestComponent);
    wrapper.unmount();

    expect(mockDisconnect).toHaveBeenCalled();
  });

  it("should load image when intersecting", async () => {
    const TestComponent = defineComponent({
      directives: { lazy },
      template: '<img v-lazy="imageUrl" />',
      setup() {
        return { imageUrl: "https://example.com/image.jpg" };
      }
    });

    const wrapper = mount(TestComponent);
    const imgElement = wrapper.find("img").element;

    // Simulate intersection
    intersectionCallback(
      [
        {
          isIntersecting: true,
          target: imgElement
        } as unknown as IntersectionObserverEntry
      ],
      {} as IntersectionObserver
    );

    expect(mockUnobserve).toHaveBeenCalledWith(imgElement);
  });
});
