import { test, expect } from '@playwright/test'
import { uniReLaunch, uniNavigateTo, waitForUniRoute } from './helpers'

test.describe('uni-mini: 回归清单-导航/入口', () => {
  test('TabBar 中间快捷弹层：收款/付款/盘点/库存调整/采购入库/客户/帮助', async ({ page, baseURL }) => {
    await page.goto(baseURL!, { waitUntil: 'domcontentloaded' })
    await uniReLaunch(page, '/pages/index/index')

    await page.getByRole('tab', { name: '操作' }).click()
    await expect(page.getByText('收款')).toBeVisible()

    await page.getByText('收款', { exact: true }).click()
    await waitForUniRoute(page, '/pages-finance/receipt/create')

    await uniReLaunch(page, '/pages/index/index')
    await page.getByRole('tab', { name: '操作' }).click()
    await page.getByText('付款', { exact: true }).click()
    await waitForUniRoute(page, '/pages-finance/payment/list')

    await uniReLaunch(page, '/pages/index/index')
    await page.getByRole('tab', { name: '操作' }).click()
    await page.getByText('盘点', { exact: true }).click()
    await waitForUniRoute(page, '/pages-order/stocktake/list')

    await uniReLaunch(page, '/pages/index/index')
    await page.getByRole('tab', { name: '操作' }).click()
    await page.getByText('库存调整', { exact: true }).click()
    await waitForUniRoute(page, '/pages-order/inventoryAdjust/list')

    await uniReLaunch(page, '/pages/index/index')
    await page.getByRole('tab', { name: '操作' }).click()
    await page.getByText('采购入库', { exact: true }).click()
    await waitForUniRoute(page, '/pages-order/purchaseIn/list')

    await uniReLaunch(page, '/pages/index/index')
    await page.getByRole('tab', { name: '操作' }).click()
    await page.getByText('客户', { exact: true }).click()
    await waitForUniRoute(page, '/pages-base/customer/list')

    await uniReLaunch(page, '/pages/index/index')
    await page.getByRole('tab', { name: '操作' }).click()
    await page.getByText('帮助', { exact: true }).click()
    await waitForUniRoute(page, '/pages-misc/help/help')
  })

  test('销售页右下角快捷：付款入口跳转到付款列表', async ({ page, baseURL }) => {
    await page.goto(baseURL!, { waitUntil: 'domcontentloaded' })
    await uniReLaunch(page, '/pages/sales/sales')

    await page.locator('.i-carbon-add').click()
    await page.getByText('付款', { exact: true }).click()
    await waitForUniRoute(page, '/pages-finance/payment/list')
  })

  test('更多页关键入口：采购退货/收款单/付款单/资金流水/对账记录/商品维护', async ({ page, baseURL }) => {
    await page.goto(baseURL!, { waitUntil: 'domcontentloaded' })
    await uniReLaunch(page, '/pages/more/more')

    await page.getByText('采购退货', { exact: true }).click()
    await waitForUniRoute(page, '/pages-order/purchaseReturn/list')

    await uniReLaunch(page, '/pages/more/more')
    await page.getByText('收款单', { exact: true }).click()
    await waitForUniRoute(page, '/pages-finance/receipt/list')

    await uniReLaunch(page, '/pages/more/more')
    await page.getByText('付款单', { exact: true }).click()
    await waitForUniRoute(page, '/pages-finance/payment/list')

    await uniReLaunch(page, '/pages/more/more')
    await page.getByText('资金流水', { exact: true }).click()
    await waitForUniRoute(page, '/pages-finance/flow/list')

    await uniReLaunch(page, '/pages/more/more')
    await page.getByText('对账记录', { exact: true }).click()
    await waitForUniRoute(page, '/pages-finance/reconcile/list')

    await uniReLaunch(page, '/pages/more/more')
    await page.getByText('商品维护', { exact: true }).click()
    await waitForUniRoute(page, '/pages-base/product/list')
  })

  test('操作页快捷网格：点击收款/付款可跳转', async ({ page, baseURL }) => {
    await page.goto(baseURL!, { waitUntil: 'domcontentloaded' })
    await uniReLaunch(page, '/pages/quick/quick')

    await page.getByText('收款', { exact: true }).click()
    await waitForUniRoute(page, '/pages-finance/receipt/list')

    await uniReLaunch(page, '/pages/quick/quick')
    await page.getByText('付款', { exact: true }).click()
    await waitForUniRoute(page, '/pages-finance/payment/list')
  })

  test('帮助中心/个人中心/关于：页面可打开', async ({ page, baseURL }) => {
    await page.goto(baseURL!, { waitUntil: 'domcontentloaded' })

    await uniNavigateTo(page, '/pages-misc/help/help')
    await expect(page.getByText('帮助分类')).toBeVisible()

    await uniNavigateTo(page, '/pages/me/me')
    await expect(page.getByText('意见反馈')).toBeVisible()

    await uniNavigateTo(page, '/pages-misc/about/about')
    await expect(page.getByText('轮胎管理系统')).toBeVisible()
  })
})
