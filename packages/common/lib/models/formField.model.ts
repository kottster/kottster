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
  renderComponent: (
    value: any, 
    onChange: (value: any) => void,
    params: {
      hasError: boolean;
      readOnly: boolean;
    }
  ) => any;
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
  withTime?: boolean;
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
  | TimePickerField
  | TextareaField
  | SelectField
  | CheckboxField
  | RecordSelectField
  | CustomField;