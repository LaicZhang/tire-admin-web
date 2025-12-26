import { h, defineComponent, type PropType } from "vue";
import { Icon as IconifyIcon } from "@iconify/vue/dist/offline";
import type { IconifyIcon as IconifyIconData } from "@iconify/types";

// Iconify Icon在Vue里本地使用（用于内网环境）
export default defineComponent({
  name: "IconifyIconOffline",
  components: { IconifyIcon },
  props: {
    icon: {
      type: [String, Object] as PropType<string | IconifyIconData | null>,
      default: null
    }
  },
  render() {
    const attrs = this.$attrs;
    if (!this.icon) return null;
    return h(IconifyIcon, {
      icon: this.icon,
      "aria-hidden": false,
      style: attrs?.style
        ? Object.assign(attrs.style as object, { outline: "none" })
        : { outline: "none" },
      ...attrs
    });
  }
});
