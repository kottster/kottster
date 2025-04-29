export interface SelectOption {
  label: string;
  value: string;
}

interface BaseFieldInput {
  asArray?: boolean;
}

export interface InputFieldInput extends BaseFieldInput {
  type: 'input';
  maxLength?: number;
}

export interface NumberInputFieldInput extends BaseFieldInput {
  type: 'numberInput';
  allowDecimal?: boolean;
}

export interface TextareaFieldInput extends BaseFieldInput {
  type: 'textarea';
  maxLength?: number;
  autoSize?: boolean;
  minRows?: number;
  maxRows?: number;
}

export interface SelectFieldInput extends BaseFieldInput {
  type: 'select';
  options?: SelectOption[];
}

export interface CustomFieldInput extends BaseFieldInput {
  type: 'custom';

  /**
   * Render function for the custom field.
   * @param values - The current values of the form.
   * @param record - The current record being edited.
   * @param updateFieldValue - Function to call when the value changes.
   * @param meta - Additional metadata about the field.
   * @returns A React component.
   */
  renderComponent?: (params: {
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

export interface CheckboxFieldInput extends BaseFieldInput {
  type: 'checkbox';
}

export interface RecordSelectFieldInput extends BaseFieldInput {
  type: 'recordSelect';
}

export interface DatePickerFieldInput extends BaseFieldInput {
  type: 'datePicker';
}

export interface DateTimePickerFieldInput extends BaseFieldInput {
  type: 'dateTimePicker';
  timeWithSeconds?: boolean;
}

export interface TimePickerFieldInput extends BaseFieldInput {
  type: 'timePicker';
  withSeconds?: boolean;
}

export type FieldInput =
  | InputFieldInput
  | NumberInputFieldInput
  | DatePickerFieldInput
  | DateTimePickerFieldInput
  | TimePickerFieldInput
  | TextareaFieldInput
  | SelectFieldInput
  | CheckboxFieldInput
  | RecordSelectFieldInput
  | CustomFieldInput;