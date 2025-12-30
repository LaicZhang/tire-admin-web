// 打印模板 - 类型定义
export interface PrintTemplate {
  uid: string;
  name: string;
  documentType: string;
  documentTypeName: string;
  isDefault: boolean;
  isSystem: boolean;
  createTime: string;
  updateTime: string;
}

export interface PrintTemplateConfig {
  // 标题设置
  title: string;
  subtitle: string;
  titleFontSize: number;
  titleBold: boolean;
  titleUnderline: boolean;
  // 字段设置
  fields: PrintField[];
  // 自定义文本
  customTexts: CustomText[];
  // Logo和二维码
  logo?: string;
  qrcode?: string;
  // 表头别名
  showHeaderAlias: boolean;
}

export interface PrintField {
  id: string;
  name: string;
  visible: boolean;
  order: number;
}

export interface CustomText {
  id: string;
  name: string;
  content: string;
}

export interface DocumentType {
  value: string;
  label: string;
}
