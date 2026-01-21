export interface TemplateField {
  name: string;
  label: string;
  required: boolean;
  type?: string;
}

export interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}
