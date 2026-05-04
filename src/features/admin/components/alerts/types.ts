export type TemplateMode = 'create' | 'update';

export interface TemplateFormState {
  type: string;
  condition: string;
  titleTemplate: string;
  bodyTemplate: string;
  isActive: boolean;
  isDefault: boolean;
}

export const EMPTY_TEMPLATE_FORM: TemplateFormState = {
  type: '',
  condition: '',
  titleTemplate: '',
  bodyTemplate: '',
  isActive: true,
  isDefault: false,
};