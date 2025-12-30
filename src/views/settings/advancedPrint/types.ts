// 高级打印模板 - 类型定义
export interface AdvancedPrintTemplate {
  uid: string;
  name: string;
  documentType: string;
  documentTypeName: string;
  paperSize: "A4" | "A5" | "B5" | "Letter" | "Custom";
  paperOrientation: "portrait" | "landscape";
  isDefault: boolean;
  createTime: string;
  updateTime: string;
}

export interface PrintDesignerConfig {
  // 页边距
  marginTop: number;
  marginBottom: number;
  marginLeft: number;
  marginRight: number;
  // 显示设置
  showPrintTime: boolean;
  showPageNumber: boolean;
  showHeaderPerPage: boolean;
  showFooterPerPage: boolean;
  showWatermark: boolean;
  watermarkText: string;
  watermarkFontSize: number;
  // 表格设置
  tableRowAutoHeight: boolean;
}

export interface PrintElement {
  id: string;
  type:
    | "text"
    | "image"
    | "barcode"
    | "qrcode"
    | "line"
    | "rect"
    | "table"
    | "field";
  x: number;
  y: number;
  width: number;
  height: number;
  content?: string;
  fieldCode?: string;
  style: ElementStyle;
}

export interface ElementStyle {
  fontSize?: number;
  fontWeight?: "normal" | "bold";
  fontStyle?: "normal" | "italic";
  textDecoration?: "none" | "underline";
  textAlign?: "left" | "center" | "right";
  color?: string;
  backgroundColor?: string;
  borderWidth?: number;
  borderColor?: string;
}
