import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Home() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Team Workspace App</CardTitle>
          <CardDescription>
            Project scaffold is ready with Supabase wiring and Shadcn UI foundation.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Next steps are authentication, protected routes, and workspace features.
          </p>
          <Button asChild>
            <Link href="/login" className="inline-flex items-center gap-2">
              Continue to Auth
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
