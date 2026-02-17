"use client";

import { useState } from "react";
import { createNoteAction } from "@/app/workspace/[id]/actions";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type CreateNoteDialogProps = {
  workspaceId: string;
};

export function CreateNoteDialog({ workspaceId }: CreateNoteDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Create note</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create note</DialogTitle>
          <DialogDescription>Add a note to this workspace.</DialogDescription>
        </DialogHeader>
        <form action={createNoteAction} className="space-y-4">
          <input type="hidden" name="workspace_id" value={workspaceId} />
          <div className="space-y-2">
            <label htmlFor="new-note-title" className="text-sm font-medium">
              Title
            </label>
            <Input id="new-note-title" name="title" placeholder="Sprint updates" required maxLength={120} />
          </div>
          <div className="space-y-2">
            <label htmlFor="new-note-content" className="text-sm font-medium">
              Content
            </label>
            <Textarea
              id="new-note-content"
              name="content"
              placeholder="Add the details for this note..."
              required
              maxLength={4000}
            />
          </div>
          <DialogFooter>
            <Button type="submit">Create</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
