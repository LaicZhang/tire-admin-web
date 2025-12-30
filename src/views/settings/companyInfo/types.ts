// 公司信息 - 类型定义
export interface CompanyInfo {
  uid?: string;
  companyName: string;
  taxNumber: string;
  legalPerson: string;
  contactPerson: string;
  phone: string;
  fax: string;
  email: string;
  address: string;
  website: string;
  bankName: string;
  bankAccount: string;
  logo?: string;
  remark: string;
}

export interface CompanyInfoFormProps {
  formInline: CompanyInfo;
}
