export interface AlertTemplateDto {
  id: number;
  type: number | null;
  condition: number | null;
  titleTemplate: string;
  bodyTemplate: string;
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AlertTemplatePlaceholderDto {
  key: string;
  token: string;
  category: string;
  description: string;
}

export interface AlertTemplatePlaceholdersDto {
  placeholders: AlertTemplatePlaceholderDto[];
}

export interface AlertTemplateUpsertRequest {
  type: number | null;
  condition: number | null;
  titleTemplate: string;
  bodyTemplate: string;
  isActive: boolean;
  isDefault: boolean;
}