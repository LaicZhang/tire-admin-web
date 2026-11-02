const localStorageMock = (function () {
  let store: Record<string, string> = {};
  return {
    getItem: function (key: string) {
      return store[key] || null;
    },
    setItem: function (key: string, value: string) {
      store[key] = value.toString();
    },
    removeItem: function (key: string) {
      delete store[key];
    },
    clear: function () {
      store = {};
    }
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock
});

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false
  })
});

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

class IntersectionObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}

Object.defineProperty(window, "ResizeObserver", { value: ResizeObserverStub });
Object.defineProperty(window, "IntersectionObserver", {
  value: IntersectionObserverStub
});
Object.defineProperty(globalThis, "ResizeObserver", {
  value: ResizeObserverStub
});
Object.defineProperty(globalThis, "IntersectionObserver", {
  value: IntersectionObserverStub
});
Object.defineProperty(window, "scrollTo", {
  value: () => undefined,
  writable: true
});
Object.defineProperty(globalThis, "location", {
  configurable: true,
  value: window.location
});

const openWindow = window.open.bind(window);
Object.defineProperty(window, "open", {
  configurable: true,
  value: (...args: Parameters<typeof window.open>) => {
    const popup = openWindow(...args);
    if (popup && typeof popup.print !== "function") {
      Object.defineProperty(popup, "print", { value: () => undefined });
    }
    return popup;
  }
});

Object.defineProperty(globalThis, "fetch", {
  configurable: true,
  value: async () =>
    new Response(new Blob(["fixture"], { type: "text/plain" }), {
      status: 200,
      headers: { "Content-Type": "text/plain" }
    })
});
