"use client";

import { useState } from "react";
import { Star, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateTestimonial } from "../_hooks/use-testimonials";

interface SubmitTestimonialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function SubmitTestimonialDialog({
  open,
  onOpenChange,
  onSuccess,
}: SubmitTestimonialDialogProps) {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [headline, setHeadline] = useState("");
  const [content, setContent] = useState("");

  const createMutation = useCreateTestimonial();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim().length < 5) {
      toast.error("Please provide at least 5 characters for your review.");
      return;
    }

    try {
      await createMutation.mutateAsync({
        rating,
        headline: headline.trim() || undefined,
        content: content.trim(),
      });
      toast.success(
        "Thank you! Your testimonial was submitted and is pending review."
      );
      setHeadline("");
      setContent("");
      setRating(5);
      onOpenChange(false);
      onSuccess?.();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to submit testimonial";
      toast.error(msg);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg border-border/80 bg-background/95 backdrop-blur-xl">
        <DialogHeader>
          <div className="flex items-center gap-2 text-violet-400">
            <Sparkles className="h-5 w-5" />
            <span className="text-xs font-semibold uppercase tracking-wider">
              Player Feedback
            </span>
          </div>
          <DialogTitle className="text-xl font-bold tracking-tight">
            Share Your Arena Experience
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Tell us about your game sessions, the equipment, and the vibe.
            Selected testimonials will be featured directly on the website hero!
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          {/* Star rating selector */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold">Your Rating</Label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => {
                const filled =
                  hoverRating !== null ? star <= hoverRating : star <= rating;
                return (
                  <button
                    key={star}
                    type="button"
                    className="p-1 rounded transition-transform hover:scale-125 focus:outline-none"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(null)}
                    onClick={() => setRating(star)}
                    aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
                  >
                    <Star
                      className={`h-7 w-7 transition-colors ${
                        filled
                          ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]"
                          : "text-neutral-600"
                      }`}
                    />
                  </button>
                );
              })}
              <span className="ml-2 text-xs font-medium text-amber-400">
                {rating === 5
                  ? "⭐⭐⭐⭐⭐ Outstanding!"
                  : rating === 4
                  ? "⭐⭐⭐⭐ Great!"
                  : rating === 3
                  ? "⭐⭐⭐ Good"
                  : rating === 2
                  ? "⭐⭐ Fair"
                  : "⭐ Poor"}
              </span>
            </div>
          </div>

          {/* Headline */}
          <div className="space-y-2">
            <Label htmlFor="headline" className="text-xs font-semibold">
              Headline / Summary (Optional)
            </Label>
            <Input
              id="headline"
              placeholder="e.g. Unbelievable PS5 setup & awesome crowd!"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              maxLength={100}
              className="bg-card/50"
            />
          </div>

          {/* Review text */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="content" className="text-xs font-semibold">
                Your Review <span className="text-destructive">*</span>
              </Label>
              <span className="text-[11px] text-muted-foreground">
                {content.length}/1000
              </span>
            </div>
            <textarea
              id="content"
              rows={4}
              required
              placeholder="What games did you play? How were the controls, stations, and ambiance?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={1000}
              className="w-full rounded-md border border-input bg-card/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={createMutation.isPending || !content.trim()}
              className="bg-violet-600 hover:bg-violet-500 text-white font-semibold shadow-[0_0_15px_-3px_rgba(139,92,246,0.6)]"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting…
                </>
              ) : (
                "Submit Testimonial"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
