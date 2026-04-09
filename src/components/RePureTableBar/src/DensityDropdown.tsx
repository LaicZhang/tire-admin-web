import { computed, type Ref } from "vue";
import { useEpThemeStoreHook } from "@/store/modules/epTheme";
import CollapseIcon from "@/assets/table-bar/collapse.svg?component";
import { TABLE_SIZE_OPTIONS, type TableSize } from "./types";
import { ElDropdown, ElDropdownItem, ElDropdownMenu } from "element-plus";

interface DensityDropdownProps {
  size: Ref<TableSize>;
  iconClass: string[];
  rendTippyProps: (content: string) => object;
}

/**
 * 密度选择下拉菜单组件
 */
export function useDensityDropdown({
  size,
  iconClass,
  rendTippyProps
}: DensityDropdownProps) {
  const getDropdownItemStyle = computed(() => {
    return (s: TableSize) => ({
      background: s === size.value ? useEpThemeStoreHook().epThemeColor : "",
      color: s === size.value ? "#fff" : "var(--el-text-color-primary)"
    });
  });

  const dropdown = {
    dropdown: () => (
      <ElDropdownMenu class="translation">
        {TABLE_SIZE_OPTIONS.map(option => (
          <ElDropdownItem
            key={option.value}
            style={getDropdownItemStyle.value(option.value)}
            onClick={() => (size.value = option.value)}
          >
            {option.label}
          </ElDropdownItem>
        ))}
      </ElDropdownMenu>
    )
  };

  const renderDensityDropdown = () => (
    <ElDropdown
      v-slots={dropdown}
      trigger="click"
      v-tippy={rendTippyProps("密度")}
    >
      <CollapseIcon class={["w-[16px]", ...iconClass]} />
    </ElDropdown>
  );

  return {
    renderDensityDropdown
  };
}
