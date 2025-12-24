import '@testing-library/jest-dom';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// Mock ResizeObserver
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

window.ResizeObserver = ResizeObserverMock;

// Mock requestAnimationFrame
window.requestAnimationFrame = (callback: FrameRequestCallback) => {
  return setTimeout(() => callback(Date.now()), 0) as unknown as number;
};

window.cancelAnimationFrame = (id: number) => {
  clearTimeout(id);
};

// Mock DataTransfer
class DataTransferMock {
  private data: Map<string, string> = new Map();
  public effectAllowed: string = 'none';
  public dropEffect: string = 'none';

  setData(format: string, data: string) {
    this.data.set(format, data);
  }

  getData(format: string) {
    return this.data.get(format) || '';
  }

  setDragImage() {}
}

(window as any).DataTransfer = DataTransferMock;
