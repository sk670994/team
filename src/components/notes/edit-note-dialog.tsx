"use client";

import { useState } from "react";
import { updateNoteAction } from "@/app/workspace/[id]/actions";
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

type EditNoteDialogProps = {
  workspaceId: string;
  noteId: string;
  title: string;
  content: string;
};

export function EditNoteDialog({ workspaceId, noteId, title, content }: EditNoteDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit note</DialogTitle>
          <DialogDescription>Update the note content.</DialogDescription>
        </DialogHeader>
        <form action={updateNoteAction} className="space-y-4">
          <input type="hidden" name="workspace_id" value={workspaceId} />
          <input type="hidden" name="note_id" value={noteId} />
          <div className="space-y-2">
            <label htmlFor={`edit-note-title-${noteId}`} className="text-sm font-medium">
              Title
            </label>
            <Input id={`edit-note-title-${noteId}`} name="title" defaultValue={title} required maxLength={120} />
          </div>
          <div className="space-y-2">
            <label htmlFor={`edit-note-content-${noteId}`} className="text-sm font-medium">
              Content
            </label>
            <Textarea
              id={`edit-note-content-${noteId}`}
              name="content"
              defaultValue={content}
              required
              maxLength={4000}
            />
          </div>
          <DialogFooter>
            <Button type="submit">Save changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
