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
  float?: boolean;
}

interface TextareaField extends BaseFormField {
  type: 'textarea';
}

interface SelectField extends BaseFormField {
  type: 'select';
  options: SelectOption[];
}

interface MultipleSelectField extends BaseFormField {
  type: 'multipleSelect';
  options: SelectOption[];
}

interface CheckboxField extends BaseFormField {
  type: 'checkbox';
}

interface RecordSelectField extends BaseFormField {
  type: 'recordSelect';
  column: string;
}

interface MultipleRecordSelectField extends BaseFormField {
  type: 'multipleRecordSelect';
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
  | MultipleSelectField
  | CheckboxField
  | RecordSelectField
  | MultipleRecordSelectField;