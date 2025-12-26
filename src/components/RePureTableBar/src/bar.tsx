import { delay } from "@pureadmin/utils";
import { ElDivider } from "element-plus";
import { ref, computed, defineComponent, getCurrentInstance } from "vue";

import Fullscreen from "~icons/ri/fullscreen-fill";
import ExitFullscreen from "~icons/ri/fullscreen-exit-fill";
import ExpandIcon from "@/assets/table-bar/expand.svg?component";
import RefreshIcon from "@/assets/table-bar/refresh.svg?component";

import { tableBarProps, type TableSize } from "./types";
import { useDensityDropdown } from "./DensityDropdown";
import { useColumnSettings } from "./ColumnSettings";

export default defineComponent({
  name: "PureTableBar",
  props: tableBarProps,
  emits: ["refresh", "fullscreen"],
  setup(props, { emit, slots, attrs }) {
    const size = ref<TableSize>("default");
    const loading = ref(false);
    const isFullscreen = ref(false);
    const instance = getCurrentInstance();
    if (!instance) {
      throw new Error("PureTableBar must be used inside setup()");
    }
    const isExpandAll = ref(props.isExpandAll);

    const iconClass = computed(() => [
      "text-black",
      "dark:text-white",
      "duration-100",
      "hover:text-primary!",
      "cursor-pointer",
      "outline-hidden"
    ]);

    const rendTippyProps = (content: string) => ({
      content,
      offset: [0, 18],
      duration: [300, 0],
      followCursor: true,
      hideOnClick: "toggle"
    });

    // 使用密度下拉菜单 composable
    const { renderDensityDropdown } = useDensityDropdown({
      size,
      iconClass: iconClass.value,
      rendTippyProps
    });

    // 使用列设置 composable
    const { dynamicColumns, renderColumnSettings } = useColumnSettings({
      columns: props.columns,
      tableKey: props.tableKey,
      instance,
      iconClass: iconClass.value,
      rendTippyProps
    });

    function onReFresh() {
      loading.value = true;
      emit("refresh");
      delay(500).then(() => (loading.value = false));
    }

    function onExpand() {
      isExpandAll.value = !isExpandAll.value;
      if (props.tableRef?.data) {
        toggleRowExpansionAll(props.tableRef.data, isExpandAll.value);
      }
    }

    function onFullscreen() {
      isFullscreen.value = !isFullscreen.value;
      emit("fullscreen", isFullscreen.value);
    }

    function toggleRowExpansionAll(
      data: Array<Record<string, unknown>>,
      isExpansion: boolean
    ) {
      data.forEach(item => {
        props.tableRef?.toggleRowExpansion(item, isExpansion);
        if (item.children !== undefined && item.children !== null) {
          toggleRowExpansionAll(
            item.children as Array<Record<string, unknown>>,
            isExpansion
          );
        }
      });
    }

    return () => (
      <>
        <div
          {...attrs}
          class={[
            "w-full",
            "px-2",
            "pb-2",
            "bg-bg_color",
            isFullscreen.value
              ? ["h-full!", "z-2002", "fixed", "inset-0"]
              : "mt-2"
          ]}
        >
          <div class="flex justify-between w-full h-[60px] p-4">
            {slots?.title ? (
              slots.title()
            ) : (
              <p class="font-bold truncate">{props.title}</p>
            )}
            <div class="flex items-center justify-around">
              {slots?.buttons ? (
                <div class="flex mr-4">{slots.buttons()}</div>
              ) : null}
              {props.tableRef?.size ? (
                <>
                  <ExpandIcon
                    class={["w-[16px]", iconClass.value]}
                    style={{
                      transform: isExpandAll.value ? "none" : "rotate(-90deg)"
                    }}
                    v-tippy={rendTippyProps(
                      isExpandAll.value ? "折叠" : "展开"
                    )}
                    onClick={() => onExpand()}
                  />
                  <ElDivider direction="vertical" />
                </>
              ) : null}
              <RefreshIcon
                class={[
                  "w-[16px]",
                  iconClass.value,
                  loading.value ? "animate-spin" : ""
                ]}
                v-tippy={rendTippyProps("刷新")}
                onClick={() => onReFresh()}
              />
              <ElDivider direction="vertical" />
              {renderDensityDropdown()}
              <ElDivider direction="vertical" />
              {renderColumnSettings()}
              <ElDivider direction="vertical" />

              <iconifyIconOffline
                class={["w-[16px]", iconClass.value]}
                icon={isFullscreen.value ? ExitFullscreen : Fullscreen}
                v-tippy={isFullscreen.value ? "退出全屏" : "全屏"}
                onClick={() => onFullscreen()}
              />
            </div>
          </div>
          {slots.default?.({
            size: size.value,
            dynamicColumns: dynamicColumns.value
          })}
        </div>
      </>
    );
  }
});
