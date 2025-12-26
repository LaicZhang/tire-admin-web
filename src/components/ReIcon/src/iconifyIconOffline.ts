import {
  h,
  defineComponent,
  type PropType,
  type FunctionalComponent
} from "vue";
import { Icon as IconifyIcon } from "@iconify/vue/dist/offline";
import type { IconifyIcon as IconifyIconData } from "@iconify/types";

// Support for unplugin-icons which returns FunctionalComponent
type IconPropType = string | IconifyIconData | FunctionalComponent | null;

// Iconify Icon在Vue里本地使用（用于内网环境）
export default defineComponent({
  name: "IconifyIconOffline",
  components: { IconifyIcon },
  props: {
    icon: {
      type: [String, Object, Function] as PropType<IconPropType>,
      default: null
    }
  },
  render() {
    const attrs = this.$attrs;
    if (!this.icon) return null;

    // If icon is a FunctionalComponent (from unplugin-icons), render it directly
    if (typeof this.icon === "function") {
      return h(this.icon, {
        style: attrs?.style
          ? Object.assign(attrs.style as object, { outline: "none" })
          : { outline: "none" },
        ...attrs
      });
    }

    return h(IconifyIcon, {
      icon: this.icon as string | IconifyIconData,
      "aria-hidden": false,
      style: attrs?.style
        ? Object.assign(attrs.style as object, { outline: "none" })
        : { outline: "none" },
      ...attrs
    });
  }
});
