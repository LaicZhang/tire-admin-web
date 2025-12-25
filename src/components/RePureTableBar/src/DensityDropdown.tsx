import { computed, type Ref } from "vue";
import { useEpThemeStoreHook } from "@/store/modules/epTheme";
import CollapseIcon from "@/assets/table-bar/collapse.svg?component";
import { TABLE_SIZE_OPTIONS, type TableSize } from "./types";

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
      <el-dropdown-menu class="translation">
        {TABLE_SIZE_OPTIONS.map(option => (
          <el-dropdown-item
            key={option.value}
            style={getDropdownItemStyle.value(option.value)}
            onClick={() => (size.value = option.value)}
          >
            {option.label}
          </el-dropdown-item>
        ))}
      </el-dropdown-menu>
    )
  };

  const renderDensityDropdown = () => (
    <el-dropdown
      v-slots={dropdown}
      trigger="click"
      v-tippy={rendTippyProps("密度")}
    >
      <CollapseIcon class={["w-[16px]", ...iconClass]} />
    </el-dropdown>
  );

  return {
    renderDensityDropdown
  };
}
