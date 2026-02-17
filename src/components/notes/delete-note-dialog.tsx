"use client";

import { useState } from "react";
import { deleteNoteAction } from "@/app/workspace/[id]/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { SubmitButton } from "@/components/ui/submit-button";

type DeleteNoteDialogProps = {
  workspaceId: string;
  noteId: string;
  title: string;
};

export function DeleteNoteDialog({ workspaceId, noteId, title }: DeleteNoteDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm">
          Delete
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete note</DialogTitle>
          <DialogDescription>This action cannot be undone.</DialogDescription>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          You are deleting <span className="font-medium text-foreground">{title}</span>.
        </p>
        <form action={deleteNoteAction} className="space-y-4">
          <input type="hidden" name="workspace_id" value={workspaceId} />
          <input type="hidden" name="note_id" value={noteId} />
          <DialogFooter>
            <SubmitButton type="submit" variant="destructive" pendingText="Deleting...">
              Confirm delete
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
