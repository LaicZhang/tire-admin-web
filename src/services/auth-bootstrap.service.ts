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

async function ensureCompanyContextReady() {
  const companyStore = useCurrentCompanyStoreHook();
  const companies = await companyStore.fetchAvailableCompanies();

  if (companies.length === 1) return;

  const storedCompanyId = companyStore.companyId;
  if (storedCompanyId && companies.some(c => c.uid === storedCompanyId)) {
    await companyStore.determineCurrentCompany(storedCompanyId);
    return;
  }

  const picked = await promptSelectCompany(companies, storedCompanyId);
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
  const topMenuPath = getTopMenu(true)?.path;
  await safeNavigate(
    router,
    topMenuPath ? topMenuPath : resolveSafeHomeRoute(router),
    {
      replace: true,
      fallback: resolveSafeHomeRoute(router)
    }
  );
}

/**
 * 登录成功后的统一收口：
 * - 确保公司上下文已确定（多公司弹窗选择）
 * - 初始化动态路由（后端 async-routes -> meta.auths -> 按钮权限）
 * - 跳转到顶级菜单
 */
export async function completeLogin(tokenPayload?: SetTokenPayload) {
  try {
    resetUiForContextChange();
    if (tokenPayload) setToken(tokenPayload);

    await ensureCompanyContextReady();
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
 * - 重置菜单/路由缓存并重新拉取 async-routes
 * - 跳转到新公司顶级菜单
 */
export async function switchCompany(companyId: string) {
  const companyStore = useCurrentCompanyStoreHook();
  if (!companyId) return;
  if (companyId === companyStore.companyId) return;

  try {
    await companyStore.determineCurrentCompany(companyId);
    await ensureStoreContextReady();
    resetUiForContextChange();
    await initRouter();
    addPathMatch();
    await redirectToTopMenu();
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "切换公司失败";
    message(msg, { type: "error" });
    // 切换失败时不强制登出；保留原公司上下文
    throw error;
  }
}
