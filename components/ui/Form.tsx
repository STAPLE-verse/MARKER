import React from 'react';
import { UseFormReturn, FormProvider, FieldValues, SubmitHandler } from 'react-hook-form';
import { cn } from '@/lib/utils';

export interface FormProps<TFieldValues extends FieldValues> extends Omit<React.FormHTMLAttributes<HTMLFormElement>, 'onSubmit'> {
  /** The react-hook-form instance returned by useForm() */
  form: UseFormReturn<TFieldValues>;
  /** The submit handler that will be automatically wrapped in form.handleSubmit */
  onSubmit: SubmitHandler<TFieldValues>;
}

/**
 * A shared Form wrapper for the UI library.
 * 
 * 1. Automatically wraps the children in a react-hook-form `FormProvider`. 
 *    This allows deeply nested components (like complex array builders) to use `useFormContext()`.
 * 2. Automatically wires up `form.handleSubmit(onSubmit)`.
 * 3. Applies standard vertical spacing `space-y-6` by default.
 */
export function Form<TFieldValues extends FieldValues>({
  form,
  onSubmit,
  children,
  className,
  ...props
}: FormProps<TFieldValues>) {
  return (
    <FormProvider {...form}>
      <form 
        onSubmit={form.handleSubmit(onSubmit)} 
        className={cn("w-full flex flex-col flex-1", className)} 
        {...props}
      >
        {children}
      </form>
    </FormProvider>
  );
}
