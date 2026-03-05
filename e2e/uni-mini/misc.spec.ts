import { test, expect } from '@playwright/test'
import { uniReLaunch, waitForUniRoute } from './helpers'

test.describe('uni-mini: 回归清单-应收应付/全局搜索', () => {
  test('应收对账：列表展示 + 点击收款跳到收款新建并带入客户', async ({ page, baseURL }) => {
    await page.goto(baseURL!, { waitUntil: 'domcontentloaded' })
    await uniReLaunch(page, '/pages-finance/ar/list')

    await expect(page.getByText('客户A')).toBeVisible()
    await page.getByText('收款', { exact: true }).click()
    await waitForUniRoute(page, '/pages-finance/receipt/create')
    await expect(page.getByText('客户A')).toBeVisible()
  })

  test('应付对账：列表展示 + 点击付款跳到付款新建', async ({ page, baseURL }) => {
    await page.goto(baseURL!, { waitUntil: 'domcontentloaded' })
    await uniReLaunch(page, '/pages-finance/ap/list')

    await expect(page.getByText('供应商A')).toBeVisible()
    await page.getByText('付款', { exact: true }).click()
    await waitForUniRoute(page, '/pages-finance/payment/create')
  })

  test('全局搜索：输入关键字展示聚合结果，点击可跳转', async ({ page, baseURL }) => {
    await page.goto(baseURL!, { waitUntil: 'domcontentloaded' })
    await uniReLaunch(page, '/pages-base/search/search')

    await page.getByPlaceholder('搜索单号/客户/供应商/商品...').fill('205')
    await expect(page.getByText('库存')).toBeVisible()

    await page.getByText('205/55R16', { exact: true }).first().click()
    await waitForUniRoute(page, '/pages-base/inventory/list')
  })
})
