export interface SelectOption {
  label: string;
  value: string;
}

interface BaseFieldInput {
  asArray?: boolean;
}

interface InputField extends BaseFieldInput {
  type: 'input';
  maxLength?: number;
}

interface NumberInputField extends BaseFieldInput {
  type: 'numberInput';
  allowDecimal?: boolean;
}

interface TextareaField extends BaseFieldInput {
  type: 'textarea';
  maxLength?: number;
  autoSize?: boolean;
  minRows?: number;
  maxRows?: number;
}

interface SelectField extends BaseFieldInput {
  type: 'select';
  options: SelectOption[];
}

interface CustomField extends BaseFieldInput {
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

interface CheckboxField extends BaseFieldInput {
  type: 'checkbox';
}

interface RecordSelectField extends BaseFieldInput {
  type: 'recordSelect';
}

interface DatePickerField extends BaseFieldInput {
  type: 'datePicker';
}

interface DateTimePickerField extends BaseFieldInput {
  type: 'dateTimePicker';
  timeWithSeconds?: boolean;
}

interface TimePickerField extends BaseFieldInput {
  type: 'timePicker';
  withSeconds?: boolean;
}

export type FieldInput =
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