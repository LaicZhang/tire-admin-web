import { h, ref } from "vue";
import { ElMessageBox, ElOption, ElSelect } from "element-plus";
import { router, resetRouter } from "@/router";
import {
  addPathMatch,
  getTopMenu,
  initRouter,
  resolveSafeHomeRoute,
  safeNavigate
} from "@/router/utils";
import {
  useCurrentCompanyStoreHook,
  type CompanyOption,
  type StoreOption
} from "@/store/modules/company";
import { useMultiTagsStoreHook } from "@/store/modules/multiTags";
import { useOptionsStoreHook } from "@/store/modules/options";
import { usePermissionStoreHook } from "@/store/modules/permission";
import { routerArrays, toMultiTypeArray } from "@/store/utils";
import { useUserStoreHook } from "@/store/modules/user";
import { message } from "@/utils/message";
import { setToken, type SetTokenPayload } from "@/utils/auth";

async function promptSelectCompany(
  companies: CompanyOption[],
  initialCompanyId?: string
): Promise<string> {
  const selectedCompanyId = ref<string>(
    initialCompanyId && companies.some(c => c.uid === initialCompanyId)
      ? initialCompanyId
      : (companies[0]?.uid ?? "")
  );

  await ElMessageBox({
    title: "请选择公司",
    message: () =>
      h(
        "div",
        { style: "min-width: 320px; margin-top: 8px;" },
        h(
          ElSelect,
          {
            modelValue: selectedCompanyId.value,
            "onUpdate:modelValue": (val: unknown) => {
              if (typeof val === "string") selectedCompanyId.value = val;
            },
            placeholder: "请选择公司",
            filterable: true,
            class: "w-full"
          },
          () =>
            companies.map(c =>
              h(ElOption, {
                key: c.uid,
                label: c.name,
                value: c.uid
              })
            )
        )
      ),
    showCancelButton: false,
    confirmButtonText: "确定",
    closeOnClickModal: false,
    closeOnPressEscape: false,
    showClose: false
  });

  return selectedCompanyId.value;
}

async function promptSelectStore(
  stores: StoreOption[],
  initialStoreId?: string
): Promise<string> {
  const selectedStoreId = ref<string>(
    initialStoreId && stores.some(s => s.uid === initialStoreId)
      ? initialStoreId
      : (stores[0]?.uid ?? "")
  );

  await ElMessageBox({
    title: "请选择门店",
    message: () =>
      h(
        "div",
        { style: "min-width: 320px; margin-top: 8px;" },
        h(
          ElSelect,
          {
            modelValue: selectedStoreId.value,
            "onUpdate:modelValue": (val: unknown) => {
              if (typeof val === "string") selectedStoreId.value = val;
            },
            placeholder: "请选择门店",
            filterable: true,
            class: "w-full"
          },
          () =>
            stores.map(store =>
              h(ElOption, {
                key: store.uid,
                label: store.name,
                value: store.uid
              })
            )
        )
      ),
    showCancelButton: false,
    confirmButtonText: "确定",
    closeOnClickModal: false,
    closeOnPressEscape: false,
    showClose: false
  });

  return selectedStoreId.value;
}

/**
 * W-MC3: 切公司后清空业务选项/路由缓存，避免跨公司串味。
 * 草稿/近期表单已按 companyUid 分 key，不在此全量 wipe。
 */
export function resetBusinessContextForCompanyChange() {
  useOptionsStoreHook().clearForCompanyChange();
  usePermissionStoreHook().clearAllCachePage();
}

async function ensureCompanyContextReady() {
  const companyStore = useCurrentCompanyStoreHook();
  const companies = await companyStore.fetchAvailableCompanies();

  if (companies.length === 0) {
    throw new Error("当前用户没有可用公司，请联系管理员");
  }

  // 单公司：fetch 已写入本地；零弹窗
  if (companies.length === 1) {
    return;
  }

  // 多公司：必须显式选择。localStorage 中的 companyId 仅作弹窗默认高亮，禁止静默 determine。
  const storedCompanyId = companyStore.companyId;
  const highlightId =
    storedCompanyId && companies.some(c => c.uid === storedCompanyId)
      ? storedCompanyId
      : undefined;

  // 失效公司：本地有 id 但不在列表 → 不作为高亮，强制重选
  if (storedCompanyId && !highlightId) {
    companyStore.setCurrentCompany({
      companyId: "",
      companyName: "",
      storeId: "",
      storeName: ""
    });
  }

  const picked = await promptSelectCompany(companies, highlightId);
  if (!picked || !companies.some(c => c.uid === picked)) {
    throw new Error("请选择有效公司");
  }
  await companyStore.determineCurrentCompany(picked);
}

async function ensureStoreContextReady() {
  const companyStore = useCurrentCompanyStoreHook();
  const stores = await companyStore.fetchAvailableStores();

  if (stores.length === 1) return;

  const storedStoreId = companyStore.storeId;
  if (storedStoreId && stores.some(s => s.uid === storedStoreId)) {
    await companyStore.determineCurrentStore(storedStoreId);
    return;
  }

  const picked = await promptSelectStore(stores, storedStoreId);
  await companyStore.determineCurrentStore(picked);
}

function resetUiForContextChange() {
  resetRouter();
  useMultiTagsStoreHook().handleTags(
    "equal",
    toMultiTypeArray([...routerArrays])
  );
}

async function redirectToTopMenu() {
  const topMenu = getTopMenu(true);
  await safeNavigate(router, topMenu.path || resolveSafeHomeRoute(router), {
    replace: true,
    fallback: resolveSafeHomeRoute(router)
  });
}

/**
 * 登录成功后的统一收口：
 * - 确保公司上下文已确定（多公司弹窗选择；stored 仅高亮）
 * - 初始化动态路由（后端 async-routes -> meta.auths -> 按钮权限）
 * - 跳转到顶级菜单
 */
export async function completeLogin(tokenPayload?: SetTokenPayload) {
  try {
    resetUiForContextChange();
    if (tokenPayload) setToken(tokenPayload);

    await ensureCompanyContextReady();
    resetBusinessContextForCompanyChange();
    await ensureStoreContextReady();
    await initRouter();
    addPathMatch();
    await redirectToTopMenu();
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "登录初始化失败";
    message(msg, { type: "error" });
    useUserStoreHook().logOut();
    throw error;
  }
}

/**
 * 全局公司切换：
 * - 同步后端当前公司上下文
 * - 重置业务 store / 菜单路由缓存并重新拉取 async-routes
 * - 失败不登出，保留原公司并展示回滚文案
 */
export async function switchCompany(companyId: string) {
  const companyStore = useCurrentCompanyStoreHook();
  if (!companyId) return;
  if (companyId === companyStore.companyId) return;

  const previousId = companyStore.companyId;
  const previousName = companyStore.companyName;

  try {
    await companyStore.determineCurrentCompany(companyId);
    resetBusinessContextForCompanyChange();
    await ensureStoreContextReady();
    resetUiForContextChange();
    await initRouter();
    addPathMatch();
    await redirectToTopMenu();
  } catch (error: unknown) {
    const detail = error instanceof Error ? error.message : "切换公司失败";
    const keepLabel = previousName || previousId;
    const msg = keepLabel
      ? `切换公司失败，已保留原公司「${keepLabel}」：${detail}`
      : detail;
    message(msg, { type: "error" });
    // 切换失败时不强制登出；保留原公司上下文
    throw error;
  }
}
