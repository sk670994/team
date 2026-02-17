"use client";

import * as React from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

type ConfirmSubmitButtonProps = React.ComponentProps<typeof Button> & {
  confirmMessage: string;
  pendingText?: string;
};

export function ConfirmSubmitButton({
  children,
  confirmMessage,
  disabled,
  onClick,
  pendingText = "Submitting...",
  ...props
}: ConfirmSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button
      {...props}
      type="submit"
      disabled={disabled || pending}
      onClick={(event) => {
        if (pending) {
          event.preventDefault();
          return;
        }

        if (!confirm(confirmMessage)) {
          event.preventDefault();
          return;
        }

        onClick?.(event);
      }}
    >
      {pending ? pendingText : children}
    </Button>
  );
}
