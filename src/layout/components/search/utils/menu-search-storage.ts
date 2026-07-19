import { storageLocal } from "@pureadmin/utils";

/** SEARCH-025: local menu search history / collect keys */
export const MENU_SEARCH_HISTORY_KEY = "menu-search-history";
export const MENU_SEARCH_COLLECT_KEY = "menu-search-collect";

/** Clear menu search local history and collect (shared devices / logout). */
export function clearMenuSearchLocal(): void {
  storageLocal().removeItem(MENU_SEARCH_HISTORY_KEY);
  storageLocal().removeItem(MENU_SEARCH_COLLECT_KEY);
}
