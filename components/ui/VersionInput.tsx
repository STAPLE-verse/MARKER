import React from "react";
import { Control, Controller, FieldErrors, FieldValues, Path } from "react-hook-form";

interface VersionInputProps<TFieldValues extends FieldValues> {
  name: Path<TFieldValues>;
  control: Control<TFieldValues>;
  label: string;
  description?: string;
  errors?: FieldErrors<TFieldValues>;
}

export function VersionInput<TFieldValues extends FieldValues>({
  name,
  control,
  label,
  description,
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
            <div className="label pt-0 pb-1">
              <span className="label-text font-semibold">{label}</span>
            </div>

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

            {description && !errorMessage && (
              <div className="label pb-0 pt-1">
                <span className="label-text-alt text-base-content/60">{description}</span>
              </div>
            )}

            {errorMessage && (
              <div className="label pb-0 pt-1">
                <span className="label-text-alt text-error">{errorMessage}</span>
              </div>
            )}
          </div>
        );
      }}
    />
  );
}
