import { chromium, type FullConfig } from '@playwright/test'
import { waitForUniRoute } from './helpers'
import fs from 'node:fs'
import path from 'node:path'

async function globalSetup(config: FullConfig) {
  const { baseURL, storageState } = config.projects[0]?.use || {}
  if (!baseURL || typeof baseURL !== 'string') {
    throw new Error('uni-mini e2e: missing baseURL')
  }
  if (!storageState || typeof storageState !== 'string') {
    throw new Error('uni-mini e2e: missing storageState path')
  }

  fs.mkdirSync(path.dirname(storageState), { recursive: true })

  const browser = await chromium.launch()
  const page = await browser.newPage()

  await page.goto(baseURL, { waitUntil: 'domcontentloaded' })

  // 未登录会被路由拦截器带到登录页
  await page.locator('input[placeholder="请输入账号"]').waitFor({ state: 'visible' })
  await page.locator('input[placeholder="请输入账号"]').fill('e2e')
  await page.locator('input[placeholder="请输入密码"]').fill('e2e')
  await page.getByText('登录', { exact: true }).click()

  await waitForUniRoute(page, '/pages/index/index')

  await page.context().storageState({ path: storageState })
  await browser.close()
}

export default globalSetup
