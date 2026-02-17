import { uploadFileAction } from "@/app/workspace/[id]/actions";
import { Button } from "@/components/ui/button";

type UploadFileFormProps = {
  workspaceId: string;
};

export function UploadFileForm({ workspaceId }: UploadFileFormProps) {
  return (
    <div className="space-y-2">
      <form action={uploadFileAction} className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input type="hidden" name="workspace_id" value={workspaceId} />
        <input
          type="file"
          name="file"
          required
          className="w-full cursor-pointer text-sm file:mr-3 file:rounded-md file:border file:border-input file:bg-background file:px-3 file:py-1.5 file:text-sm"
        />
        <Button type="submit">Upload file</Button>
      </form>
      <p className="text-xs text-muted-foreground">Max file size: 10MB.</p>
    </div>
  );
}
