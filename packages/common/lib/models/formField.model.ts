export interface SelectOption {
  label: string;
  value: string;
}

interface BaseFormField {
  asArray?: boolean;
}

interface InputField extends BaseFormField {
  type: 'input';
  maxLength?: number;
}

interface NumberInputField extends BaseFormField {
  type: 'numberInput';
  allowDecimal?: boolean;
}

interface TextareaField extends BaseFormField {
  type: 'textarea';
  maxLength?: number;
  autoSize?: boolean;
  minRows?: number;
  maxRows?: number;
}

interface SelectField extends BaseFormField {
  type: 'select';
  options: SelectOption[];
}

interface CustomField extends BaseFormField {
  type: 'custom';

  /**
   * Render function for the custom field.
   * @param values - The current values of the form.
   * @param record - The current record being edited.
   * @param updateFieldValue - Function to call when the value changes.
   * @param meta - Additional metadata about the field.
   * @returns A React component.
   */
  renderComponent: (params: {
    value: any;
    values: Record<string, any>, 
    record: Record<string, any> | null,
    updateFieldValue: (key: string, value: any) => void,
    meta: {
      hasError: boolean;
      readOnly: boolean;
    }
  }) => any;
}

interface CheckboxField extends BaseFormField {
  type: 'checkbox';
}

interface RecordSelectField extends BaseFormField {
  type: 'recordSelect';
  linkedKey?: string;
}

interface DatePickerField extends BaseFormField {
  type: 'datePicker';
}

interface DateTimePickerField extends BaseFormField {
  type: 'dateTimePicker';
  timeWithSeconds?: boolean;
}

interface TimePickerField extends BaseFormField {
  type: 'timePicker';
  withSeconds?: boolean;
}

export type FormField =
  | InputField
  | NumberInputField
  | DatePickerField
  | DateTimePickerField
  | TimePickerField
  | TextareaField
  | SelectField
  | CheckboxField
  | RecordSelectField
  | CustomField;