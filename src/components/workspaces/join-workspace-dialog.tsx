"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { joinWorkspaceAction } from "@/app/dashboard/actions";

export function JoinWorkspaceDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary">Join workspace</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Join workspace</DialogTitle>
          <DialogDescription>
            Enter an invite code to join an existing workspace.
          </DialogDescription>
        </DialogHeader>
        <form action={joinWorkspaceAction} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="invite-code" className="text-sm font-medium">
              Invite code
            </label>
            <Input id="invite-code" name="invite_code" placeholder="A1B2C3D4E5" required />
          </div>
          <DialogFooter>
            <SubmitButton pendingText="Joining...">Join</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
