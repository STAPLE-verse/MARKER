import React from "react";
import { Control, Controller, FieldErrors, FieldValues, Path } from "react-hook-form";

interface VersionInputProps<TFieldValues extends FieldValues> {
  name: Path<TFieldValues>;
  control: Control<TFieldValues>;
  label: React.ReactNode;
  errors?: FieldErrors<TFieldValues>;
}

export function VersionInput<TFieldValues extends FieldValues>({
  name,
  control,
  label,
  errors,
}: VersionInputProps<TFieldValues>) {
  const errorMessage = errors?.[name]?.message as string | undefined;

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { value, onChange } }) => {
        return (
          <div className="form-control w-full">
            <label className="label pb-2">
              <span className="label-text font-medium">{label}</span>
            </label>

            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-base-content/50">v</span>
              <input
                type="text"
                className={`input input-bordered w-full font-mono text-lg bg-base-100 ${errorMessage ? "input-error" : ""}`}
                value={typeof value === "string" ? value : ""}
                onChange={(e) => onChange(e.target.value)}
                placeholder="1.0.0"
              />
            </div>

            {errorMessage && (
              <label className="label pt-2">
                <span className="label-text-alt text-error">{errorMessage}</span>
              </label>
            )}
          </div>
        );
      }}
    />
  );
}
