import { DeleteNoteDialog } from "@/components/notes/delete-note-dialog";
import { EditNoteDialog } from "@/components/notes/edit-note-dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export type NoteItem = {
  id: string;
  title: string;
  content: string;
  created_by: string;
  created_at: string;
};

type NotesListProps = {
  workspaceId: string;
  notes: NoteItem[];
  currentUserId: string;
  isOwner: boolean;
};

export function NotesList({ workspaceId, notes, currentUserId, isOwner }: NotesListProps) {
  if (notes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No notes yet</CardTitle>
          <CardDescription>Create the first note for this workspace.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="grid gap-3">
      {notes.map((note) => {
        const canManage = isOwner || note.created_by === currentUserId;

        return (
          <Card key={note.id}>
            <CardHeader>
              <CardTitle className="text-lg">{note.title}</CardTitle>
              <CardDescription>
                Created {new Date(note.created_at).toLocaleString()}
                {note.created_by === currentUserId ? " by you" : ""}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">{note.content}</p>
            </CardContent>
            {canManage ? (
              <CardFooter className="gap-2">
                <EditNoteDialog
                  workspaceId={workspaceId}
                  noteId={note.id}
                  title={note.title}
                  content={note.content}
                />
                <DeleteNoteDialog workspaceId={workspaceId} noteId={note.id} title={note.title} />
              </CardFooter>
            ) : null}
          </Card>
        );
      })}
    </div>
  );
}
