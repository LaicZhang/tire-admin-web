// 如果项目出现 `global is not defined` 报错，可能是您引入某个库的问题，比如 aws-sdk-js https://github.com/aws/aws-sdk-js
// 解决办法就是将该文件引入 src/main.ts 即可 import "@/utils/globalPolyfills";
declare global {
  interface Window {
    global?: typeof globalThis;
  }
}

if (typeof window.global === "undefined") {
  window.global = window;
}

// Some dependencies expect `process` to exist (e.g. browser builds).
const windowAny = window as unknown as { process?: unknown };
if (typeof windowAny.process === "undefined") {
  windowAny.process = {};
}

export {};
