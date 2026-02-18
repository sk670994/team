import { Button } from "@/components/ui/button";

type GoogleCtaButtonProps = {
  label?: string;
};

export function GoogleCtaButton({ label = "Continue with Google" }: GoogleCtaButtonProps) {
  return (
    <Button
      type="submit"
      variant="outline"
      className="group relative w-full overflow-hidden border-border/80 bg-background/90 shadow-sm hover:border-foreground/20 hover:bg-muted/60"
    >
      <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-foreground/[0.03] to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
      <span className="relative z-10 flex items-center justify-center gap-2">
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
          <path
            fill="#EA4335"
            d="M12 10.2v3.9h5.5c-.2 1.3-.8 2.4-1.8 3.2l2.9 2.2c1.7-1.6 2.7-3.9 2.7-6.8 0-.7-.1-1.4-.2-2.1H12z"
          />
          <path
            fill="#34A853"
            d="M12 21c2.4 0 4.4-.8 5.9-2.2l-2.9-2.2c-.8.5-1.8.9-3 .9-2.3 0-4.2-1.5-4.9-3.6l-3 .2v2.3C5.7 19.2 8.6 21 12 21z"
          />
          <path
            fill="#4A90E2"
            d="M7.1 13.9c-.2-.5-.3-1.2-.3-1.9s.1-1.3.3-1.9l-3-.2V7.6C3.4 9 3 10.5 3 12s.4 3 1.1 4.4l3-2.5z"
          />
          <path
            fill="#FBBC05"
            d="M12 6.5c1.3 0 2.5.5 3.4 1.3L18 5.2C16.4 3.8 14.4 3 12 3 8.6 3 5.7 4.8 4.1 7.6l3 2.3c.7-2.1 2.6-3.4 4.9-3.4z"
          />
        </svg>
        <span>{label}</span>
      </span>
    </Button>
  );
}
