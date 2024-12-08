export interface SelectOption {
  label: string;
  value: string;
}

interface BaseFormField {
  asArray?: boolean;
}

interface InputField extends BaseFormField {
  type: 'input';
}

interface NumberInputField extends BaseFormField {
  type: 'numberInput';
  allowDecimal?: boolean;
}

interface TextareaField extends BaseFormField {
  type: 'textarea';
}

interface SelectField extends BaseFormField {
  type: 'select';
  options: SelectOption[];
}

interface CustomField extends BaseFormField {
  type: 'custom';
  renderComponent: (value: any, onChange: (value: any) => void) => any;
}

// interface MultipleSelectField extends BaseFormField {
//   type: 'multipleSelect';
//   options: SelectOption[];
// }

interface CheckboxField extends BaseFormField {
  type: 'checkbox';
}

interface RecordSelectField extends BaseFormField {
  type: 'recordSelect';
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