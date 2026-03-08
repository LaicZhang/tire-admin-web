import NProgress from "@/utils/progress";
import { message } from "@/utils/message";
import { routerLogger } from "@/utils/logger";
import {
  isNavigationFailure,
  type RouteLocationRaw,
  type Router
} from "vue-router";

const chunkLoadPatterns = [
  /Failed to fetch dynamically imported module/i,
  /Importing a module script failed/i,
  /Loading chunk [\d]+ failed/i,
  /Unable to preload CSS/i,
  /dynamically imported module/i,
  /error loading dynamically imported module/i
];

interface SafeNavigateOptions {
  replace?: boolean;
  fallback?: RouteLocationRaw;
  silent?: boolean;
}

function isSamePath(router: Router, target: RouteLocationRaw) {
  const resolved = router.resolve(target);
  return resolved.fullPath === router.currentRoute.value.fullPath;
}

export function isChunkLoadError(error: unknown): boolean {
  const content = error instanceof Error ? error.message : String(error ?? "");
  return chunkLoadPatterns.some(pattern => pattern.test(content));
}

export function getNavigationErrorMessage(error: unknown): string {
  if (isChunkLoadError(error)) {
    return "页面资源加载失败，请刷新后重试";
  }
  return "页面跳转失败，请稍后重试";
}

export function resolveSafeHomeRoute(router: Router): RouteLocationRaw {
  if (router.hasRoute("Home")) return { path: "/" };
  if (router.hasRoute("Welcome")) return { path: "/welcome" };
  if (router.hasRoute("Login")) return { path: "/login" };
  return {
    path: router.getRoutes().some(route => route.path === "/") ? "/" : "/login"
  };
}

export function resolveSafeErrorRoute(router: Router): RouteLocationRaw {
  if (router.hasRoute("500")) return { path: "/error/500" };
  return resolveSafeHomeRoute(router);
}

async function navigateRaw(
  router: Router,
  target: RouteLocationRaw,
  replace = false
) {
  return replace ? router.replace(target) : router.push(target);
}

export async function safeNavigate(
  router: Router,
  target: RouteLocationRaw,
  options: SafeNavigateOptions = {}
): Promise<boolean> {
  const { replace = false, fallback, silent = false } = options;

  try {
    const result = await navigateRaw(router, target, replace);
    if (result && isNavigationFailure(result)) {
      return false;
    }
    return true;
  } catch (error) {
    NProgress.done();
    routerLogger.error("[Router] navigation failed", {
      target,
      replace,
      error: error instanceof Error ? error.message : String(error ?? "")
    });

    if (!silent) {
      message(getNavigationErrorMessage(error), { type: "error" });
    }

    if (fallback && !isSamePath(router, fallback)) {
      try {
        const fallbackResult = await router.replace(fallback);
        if (fallbackResult && isNavigationFailure(fallbackResult)) {
          return false;
        }
      } catch (fallbackError) {
        routerLogger.error("[Router] fallback navigation failed", {
          fallback,
          error:
            fallbackError instanceof Error
              ? fallbackError.message
              : String(fallbackError ?? "")
        });
      }
    }

    return false;
  }
}
