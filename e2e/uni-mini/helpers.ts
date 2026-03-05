import { expect, type Page } from '@playwright/test'

type UniGlobal = {
  uni?: {
    reLaunch?: unknown
    navigateTo?: unknown
  }
  getCurrentPages?: () => unknown[]
}

function normalizeExpectedRoute(route: string) {
  const trimmed = route.trim()
  if (!trimmed) return ''
  const noLeading = trimmed.startsWith('/') ? trimmed.slice(1) : trimmed
  return noLeading.split('?')[0] || ''
}

export async function waitForUniRoute(page: Page, expectedRoute: string) {
  const expected = normalizeExpectedRoute(expectedRoute)
  await page.waitForFunction((exp) => {
    // uni-app H5: getCurrentPages().at(-1).route 是不带前导 /
    // 兼容不同运行时字段名
    const pages = ((globalThis as UniGlobal).getCurrentPages?.() ?? []) as unknown[]
    const last = pages.length ? pages[pages.length - 1] : null
    if (!last || typeof last !== 'object') return false
    const obj = last as Record<string, unknown>
    const routeRaw = obj.route ?? obj.__route__
    const route = typeof routeRaw === 'string' ? routeRaw : ''
    return route === exp
  }, expected)
}

export async function uniReLaunch(page: Page, url: string) {
  await page.waitForFunction(() => typeof (globalThis as UniGlobal).uni?.reLaunch === 'function')
  await page.evaluate((u) => {
    // @ts-expect-error uni injected by runtime
    return globalThis.uni.reLaunch({ url: u })
  }, url)
  await waitForUniRoute(page, url)
}

export async function uniNavigateTo(page: Page, url: string) {
  await page.waitForFunction(() => typeof (globalThis as UniGlobal).uni?.navigateTo === 'function')
  await page.evaluate((u) => {
    // @ts-expect-error uni injected by runtime
    return globalThis.uni.navigateTo({ url: u })
  }, url)
  await waitForUniRoute(page, url)
}

export async function expectToast(page: Page, text: string) {
  // uni.showToast 在 H5 下会渲染到 DOM；这里做宽松断言（找得到文本即可）
  await expect(page.getByText(text, { exact: false })).toBeVisible()
}
