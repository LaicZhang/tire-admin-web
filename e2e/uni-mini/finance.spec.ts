import { test, expect } from '@playwright/test'
import { uniReLaunch, uniNavigateTo, waitForUniRoute, expectToast } from './helpers'

const CUSTOMER_ID_V7 = '01890f6e-8e1b-7b2a-8b3c-1a2b3c4d5e72'
const PAYMENT_ID_V7 = '01890f6e-8e1b-7b2a-8b3c-1a2b3c4d5e70'

test.describe('uni-mini: 回归清单-资金(收款/付款/流水/对账)', () => {
  test('收款：必填校验 + 成功保存后返回列表', async ({ page, baseURL }) => {
    await page.goto(baseURL!, { waitUntil: 'domcontentloaded' })

    // 2.1 新建收款：客户未选 -> 提示
    await uniReLaunch(page, '/pages-finance/receipt/create')
    await page.getByText('保存', { exact: true }).click()
    await expect(page.getByText('请选择客户')).toBeVisible()

    // 金额校验：0 或负数 -> 提示
    await uniReLaunch(page, `/pages-finance/receipt/create?customerId=${CUSTOMER_ID_V7}&customer=客户A`)
    await page.locator('input[placeholder="0"]').fill('0')
    await page.getByText('保存', { exact: true }).click()
    await expect(page.getByText('金额需大于 0')).toBeVisible()

    // 走列表 -> navigateTo(create) -> 保存成功 -> navigateBack 回列表
    await uniReLaunch(page, '/pages-finance/receipt/list')
    await uniNavigateTo(page, `/pages-finance/receipt/create?customerId=${CUSTOMER_ID_V7}&customer=客户A`)
    await page.locator('input[placeholder="0"]').fill('1')
    await page.getByText('保存', { exact: true }).click()
    await expectToast(page, '保存成功')
    await waitForUniRoute(page, '/pages-finance/receipt/list')

    // 列表应包含新增单号（mock server 从 0101 开始）
    await expect(page.getByText('RCPT-0101')).toBeVisible()

    // 搜索过滤（客户/单号）
    await page.getByPlaceholder('搜索客户/单号').fill('客户A')
    await expect(page.getByText('客户A').first()).toBeVisible()
    await page.getByPlaceholder('搜索客户/单号').fill('RCPT-0002')
    await expect(page.getByText('客户B')).toBeVisible()
  })

  test('收款详情：展示字段 + 关联销售单跳转', async ({ page, baseURL }) => {
    await page.goto(baseURL!, { waitUntil: 'domcontentloaded' })
    await uniReLaunch(page, '/pages-finance/receipt/list')

    // 点击 mock 数据中的第一条（客户A，带 saleOrderUid）
    await page.getByText('客户A', { exact: true }).first().click()
    await waitForUniRoute(page, '/pages-finance/receipt/detail')

    await expect(page.getByText('单号')).toBeVisible()
    await expect(page.getByText('创建时间')).toBeVisible()

    await page.getByText('查看关联销售单', { exact: true }).click()
    await waitForUniRoute(page, '/pages-order/salesOrder/detail')
  })

  test('付款：列表/详情/发起付款（校验 + 成功）', async ({ page, baseURL }) => {
    await page.goto(baseURL!, { waitUntil: 'domcontentloaded' })
    await uniReLaunch(page, '/pages-finance/payment/list')

    await expect(page.getByText('现金')).toBeVisible()
    await page.getByPlaceholder('搜索账户名称').fill('银行卡')
    await expect(page.getByText('银行卡')).toBeVisible()

    // 详情
    await page.getByText('现金', { exact: true }).click()
    await waitForUniRoute(page, '/pages-finance/payment/detail')
    await expect(page.getByText('发起付款')).toBeVisible()

    // 进入发起付款（带 paymentId）
    await page.getByText('发起付款', { exact: true }).click()
    await waitForUniRoute(page, '/pages-finance/payment/create')

    // 金额 0 -> 提示
    await page.locator('input[placeholder="0"]').fill('0')
    await page.getByText('确认付款', { exact: true }).click()
    await expect(page.getByText('金额需大于 0')).toBeVisible()

    // 成功付款（使用 query 直塞 paymentId，避免选择器）
    await uniReLaunch(page, `/pages-finance/payment/create?paymentId=${PAYMENT_ID_V7}`)
    await page.locator('input[placeholder="0"]').fill('1')
    await page.getByText('确认付款', { exact: true }).click()
    await expectToast(page, '付款成功')
  })

  test('采购订单详情：已提交状态 -> 去付款 -> 付款成功', async ({ page, baseURL }) => {
    await page.goto(baseURL!, { waitUntil: 'domcontentloaded' })
    await uniReLaunch(page, '/pages-order/purchaseOrder/detail?uid=PO-001')

    await expect(page.getByText('去付款', { exact: true })).toBeVisible()
    await page.getByText('去付款', { exact: true }).click()
    await waitForUniRoute(page, '/pages-finance/payment/create')

    // amount 从 query 注入到 input
    await expect(page.locator('input[placeholder="0"]')).toHaveValue(/120(\.0+)?/i)

    // 直接用 paymentId 完成付款（覆盖 purchaseId 分支）
    await uniReLaunch(page, `/pages-finance/payment/create?purchaseId=PO-001&paymentId=${PAYMENT_ID_V7}&amount=120`)
    await page.getByText('确认付款', { exact: true }).click()
    await expectToast(page, '付款成功')
  })

  test('资金流水：基础展示 + 类型筛选/关键字搜索不崩溃', async ({ page, baseURL }) => {
    await page.goto(baseURL!, { waitUntil: 'domcontentloaded' })
    await uniReLaunch(page, '/pages-finance/flow/list')

    await expect(page.getByText('客户A')).toBeVisible()
    await expect(page.getByText('现金')).toBeVisible()

    await page.getByText('收款', { exact: true }).click()
    await expect(page.getByText('客户A')).toBeVisible()

    await page.getByPlaceholder('搜索对方名称').fill('现金')
    await expect(page.getByText('现金')).toBeVisible()
  })

  test('对账记录：列表 -> 详情 -> 确认对账 + 刷新兼容', async ({ page, baseURL }) => {
    await page.goto(baseURL!, { waitUntil: 'domcontentloaded' })
    await uniReLaunch(page, '/pages-finance/reconcile/list')

    await expect(page.getByText('客户A')).toBeVisible()
    await page.getByText('客户A', { exact: true }).first().click()
    await waitForUniRoute(page, '/pages-finance/reconcile/detail')

    await expect(page.getByText('确认对账')).toBeVisible()
    await page.getByText('确认对账', { exact: true }).click()
    await expectToast(page, '确认成功')

    // 5.2 直达详情兼容：刷新页面仍可展示（从 query hydrate）
    await page.reload({ waitUntil: 'domcontentloaded' })
    await expect(page.getByText('对账单详情')).toBeVisible()
    await expect(page.getByText('客户A')).toBeVisible()
  })
})
