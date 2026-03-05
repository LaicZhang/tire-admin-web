import { test, expect } from '@playwright/test'
import { uniReLaunch, waitForUniRoute, expectToast } from './helpers'

test.describe('uni-mini: 回归清单-商品维护', () => {
  test('商品列表：可加载/搜索；新建/编辑含重复名校验', async ({ page, baseURL }) => {
    await page.goto(baseURL!, { waitUntil: 'domcontentloaded' })

    await uniReLaunch(page, '/pages-base/product/list')
    await expect(page.getByText('205/55R16')).toBeVisible()

    await page.getByPlaceholder('搜索商品名称/品牌/规格').fill('普利司通')
    await expect(page.getByText('195/65R15')).toBeVisible()

    // 新建：名称为空
    await page.getByText('新建', { exact: true }).click()
    await waitForUniRoute(page, '/pages-base/product/create')
    await page.getByText('保存', { exact: true }).click()
    await expect(page.getByText('请输入商品名称')).toBeVisible()

    // 新建：名称重复
    await page.locator('input[placeholder="如: 205/55R16"]').fill('205/55R16')
    await page.getByText('保存', { exact: true }).click()
    await expectToast(page, '商品名称已存在')

    // 新建：成功
    await page.locator('input[placeholder="如: 205/55R16"]').fill('E2E-新品')
    await page.getByText('保存', { exact: true }).click()
    await expectToast(page, '保存成功')
    await waitForUniRoute(page, '/pages-base/product/list')
    await expect(page.getByText('E2E-新品')).toBeVisible()

    // 编辑：修改为其他已存在名称 -> 拒绝
    await page.getByText('E2E-新品', { exact: true }).click()
    await waitForUniRoute(page, '/pages-base/product/edit')
    await page.locator('input[placeholder="如: 205/55R16"]').fill('195/65R15')
    await page.getByText('保存', { exact: true }).click()
    await expectToast(page, '商品名称已存在')

    // 编辑：成功保存
    await page.locator('input[placeholder="如: 205/55R16"]').fill('E2E-新品-改')
    await page.getByText('保存', { exact: true }).click()
    await expectToast(page, '保存成功')
  })
})

