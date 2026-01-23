import { h } from "vue";
import type { TableColumnRenderer } from "@pureadmin/table";

export const columns: TableColumnList = [
  {
    label: "文件名称",
    prop: "fileName",
    minWidth: 200
  },
  {
    label: "文件类型",
    prop: "fileType",
    minWidth: 120
  },
  {
    label: "文件大小",
    prop: "fileSize",
    minWidth: 100
  },
  {
    label: "预览",
    prop: "fileUrl",
    minWidth: 80,
    cellRenderer: (data: TableColumnRenderer) => {
      if (data.row?.fileType && data.row?.fileType.startsWith("image/")) {
        return h("el-image", {
          style: "width: 50px; height: 50px",
          src: data.row?.fileUrl,
          fit: "cover",
          "preview-src-list": [data.row?.fileUrl],
          "preview-teleported": true
        });
      }
      return h("span", "--");
    }
  },
  {
    label: "上传时间",
    prop: "createTime",
    minWidth: 160
  },
  {
    label: "操作",
    fixed: "right",
    slot: "operation",
    width: 150
  }
];
