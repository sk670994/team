"use client";

import * as React from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

type SubmitButtonProps = React.ComponentProps<typeof Button> & {
  pendingText?: string;
};

export function SubmitButton({
  children,
  disabled,
  pendingText = "Submitting...",
  ...props
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={disabled || pending} {...props}>
      {pending ? pendingText : children}
    </Button>
  );
}
