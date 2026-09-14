import React, { useState } from "react";
import EyeIcon from "@heroicons/react/24/outline/EyeIcon";
import EyeSlashIcon from "@heroicons/react/24/outline/EyeSlashIcon";
import { Input } from "@/components/ui/Input";

type PasswordInputProps = Omit<React.ComponentPropsWithoutRef<typeof Input>, "type" | "endAdornment">;

/**
 * `Input` with a built-in show/hide toggle for password fields. Owns its own
 * visibility state, so callers don't need to wire up a `useState` + handler
 * per field the way STAPLE's `LabeledPasswordField` requires.
 */
export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  (props, ref) => {
    const [visible, setVisible] = useState(false);

    return (
      <Input
        ref={ref}
        type={visible ? "text" : "password"}
        endAdornment={
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Hide password" : "Show password"}
            aria-pressed={visible}
            className="flex items-center justify-center text-base-content/60 hover:text-base-content"
          >
            {visible ? (
              <EyeSlashIcon className="w-5 h-5" aria-hidden="true" />
            ) : (
              <EyeIcon className="w-5 h-5" aria-hidden="true" />
            )}
          </button>
        }
        {...props}
      />
    );
  }
);

PasswordInput.displayName = "PasswordInput";
