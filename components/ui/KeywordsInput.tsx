import { Control, Controller, FieldErrors, FieldValues, Path } from "react-hook-form";
import { TagsInput } from "./TagsInput";

interface KeywordsInputProps<TFieldValues extends FieldValues> {
  name: Path<TFieldValues>;
  control: Control<TFieldValues>;
  label: string;
  placeholder?: string;
  description?: string;
  errors?: FieldErrors<TFieldValues>;
}

export function KeywordsInput<TFieldValues extends FieldValues>({
  name,
  control,
  label,
  placeholder,
  description,
  errors,
}: KeywordsInputProps<TFieldValues>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { value, onChange } }) => (
        <TagsInput
          value={Array.isArray(value) ? value : []}
          onChange={onChange}
          label={label}
          placeholder={placeholder}
          description={description}
          error={errors?.[name]?.message as string | undefined}
        />
      )}
    />
  );
}
