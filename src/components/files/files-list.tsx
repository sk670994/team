import { deleteFileAction, downloadFileAction } from "@/app/workspace/[id]/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";

export type WorkspaceFileItem = {
  id: string;
  file_name: string;
  file_path: string;
  uploaded_by: string;
  created_at: string;
};

type FilesListProps = {
  workspaceId: string;
  files: WorkspaceFileItem[];
  currentUserId: string;
  isOwner: boolean;
};

export function FilesList({ workspaceId, files, currentUserId, isOwner }: FilesListProps) {
  if (files.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No files yet</CardTitle>
          <CardDescription>Upload the first file for this workspace.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="grid gap-3">
      {files.map((file) => {
        const canDelete = isOwner || file.uploaded_by === currentUserId;

        return (
          <Card key={file.id}>
            <CardHeader>
              <CardTitle className="text-lg">{file.file_name}</CardTitle>
              <CardDescription>
                Uploaded {new Date(file.created_at).toLocaleString()}
                {file.uploaded_by === currentUserId ? " by you" : ""}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="font-mono text-xs text-muted-foreground">{file.file_path}</p>
            </CardContent>
            <CardFooter className="gap-2">
              <form action={downloadFileAction}>
                <input type="hidden" name="workspace_id" value={workspaceId} />
                <input type="hidden" name="file_id" value={file.id} />
                <Button type="submit" variant="outline" size="sm">
                  Download
                </Button>
              </form>
              {canDelete ? (
                <form action={deleteFileAction}>
                  <input type="hidden" name="workspace_id" value={workspaceId} />
                  <input type="hidden" name="file_id" value={file.id} />
                  <ConfirmSubmitButton
                    type="submit"
                    variant="destructive"
                    size="sm"
                    confirmMessage="Delete this file? This action cannot be undone."
                  >
                    Delete
                  </ConfirmSubmitButton>
                </form>
              ) : null}
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
