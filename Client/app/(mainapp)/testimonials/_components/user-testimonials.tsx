"use client";

import { useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  MessageSquareQuote,
  Plus,
  Sparkles,
  Star,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { formatDateTime } from "@/lib/format";
import type { Testimonial, TestimonialStatus } from "@/api/testimonials.api";
import { useMyTestimonials } from "../_hooks/use-testimonials";
import { SubmitTestimonialDialog } from "./submit-testimonial-dialog";

const STATUS_BADGES: Record<
  TestimonialStatus,
  { label: string; className: string; icon: React.ReactNode }
> = {
  PENDING: {
    label: "Under Review",
    className: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    icon: <Clock className="h-3 w-3" />,
  },
  APPROVED: {
    label: "Approved",
    className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  REJECTED: {
    label: "Needs Revision",
    className: "bg-destructive/15 text-destructive border-destructive/30",
    icon: <AlertCircle className="h-3 w-3" />,
  },
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`h-4 w-4 ${
            s <= rating
              ? "fill-amber-400 text-amber-400"
              : "fill-neutral-800 text-neutral-700"
          }`}
        />
      ))}
    </div>
  );
}

function MyTestimonialCard({ item }: { item: Testimonial }) {
  const statusInfo = STATUS_BADGES[item.status] || STATUS_BADGES.PENDING;

  return (
    <Card
      className={`glass-card transition-all duration-300 hover:border-violet-500/40 relative overflow-hidden flex flex-col justify-between ${
        item.isHero
          ? "border-violet-500/60 shadow-[0_0_25px_-5px_rgba(139,92,246,0.3)] bg-gradient-to-b from-violet-500/5 to-transparent"
          : "border-border/60"
      }`}
    >
      {item.isHero && (
        <div className="bg-violet-600/90 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 flex items-center gap-1.5 justify-center">
          <Sparkles className="h-3 w-3 animate-pulse text-amber-300" />
          Featured on Hero Page
        </div>
      )}

      <CardHeader className="pb-3 pt-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-violet-600/20 border border-violet-500/30 text-violet-300 font-bold flex items-center justify-center text-xs uppercase">
              {item.user.name?.slice(0, 2) || "ME"}
            </div>
            <div>
              <p className="font-semibold text-sm text-foreground leading-tight">
                {item.user.name || "My Submission"}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {formatDateTime(item.createdAt)}
              </p>
            </div>
          </div>

          <Badge
            variant="outline"
            className={`flex items-center gap-1 text-[11px] ${statusInfo.className}`}
          >
            {statusInfo.icon}
            {statusInfo.label}
          </Badge>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <StarRating rating={item.rating} />
        </div>
      </CardHeader>

      <CardContent className="space-y-2.5 pb-5 flex-1">
        {item.headline && (
          <h4 className="font-bold text-sm text-foreground line-clamp-1">
            &ldquo;{item.headline}&rdquo;
          </h4>
        )}
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
          {item.content}
        </p>

        {item.adminNote && (
          <div className="mt-3 p-2.5 rounded bg-muted/40 border border-border/70 text-[11px] text-muted-foreground">
            <strong className="text-foreground">Admin Feedback:</strong>{" "}
            {item.adminNote}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function UserTestimonials() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data: myData, isPending: myLoading, refetch: refetchMy } = useMyTestimonials();

  const myTestimonials = Array.isArray(myData) ? myData : [];
  const heroCount = myTestimonials.filter((t) => t.isHero).length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-xl border border-violet-500/30 bg-gradient-to-r from-violet-950/40 via-background to-background p-6 sm:p-8 backdrop-blur-xl">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-violet-600/10 blur-3xl"
        />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-400/30 bg-violet-400/10 px-3 py-1 text-[11px] font-semibold text-violet-300">
              <Sparkles className="h-3.5 w-3.5" />
              My Testimonials
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-display">
              Your Arena Reviews & Feedback
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Share your thoughts about our equipment, game pods, and arena vibe.
              Your submissions are reviewed by management and top reviews get
              pinned directly onto the homepage hero!
            </p>
          </div>

          <Button
            size="lg"
            onClick={() => setDialogOpen(true)}
            className="self-start md:self-center bg-violet-600 hover:bg-violet-500 text-white font-bold uppercase tracking-wider text-xs shadow-[0_0_20px_-4px_rgba(139,92,246,0.7)]"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Share Your Experience
          </Button>
        </div>
      </div>

      {/* Submissions header & status pill */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <MessageSquareQuote className="h-4 w-4 text-violet-400" />
          <h2 className="text-sm font-bold text-foreground">
            My Submissions ({myTestimonials.length})
          </h2>
        </div>

        <p className="text-xs text-muted-foreground">
          {heroCount > 0
            ? "✨ One of your reviews is currently featured on the homepage hero!"
            : "Submitted reviews undergo admin review before appearing on the website."}
        </p>
      </div>

      {/* Submissions List */}
      {myLoading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-violet-400" />
          Loading your reviews…
        </div>
      ) : myTestimonials.length === 0 ? (
        <Card className="p-10 text-center glass-card border-dashed">
          <MessageSquareQuote className="h-10 w-10 text-violet-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-foreground">
            You Haven&apos;t Submitted Any Reviews Yet
          </h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
            Tell us about your gameplay, our equipment, or arena ambiance.
            Submit your feedback to get featured on the hero page!
          </p>
          <Button
            size="sm"
            className="mt-5 bg-violet-600 hover:bg-violet-500"
            onClick={() => setDialogOpen(true)}
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Submit Your First Review
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {myTestimonials.map((item) => (
            <MyTestimonialCard key={item.id} item={item} />
          ))}
        </div>
      )}

      {/* Submission Dialog */}
      <SubmitTestimonialDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={() => {
          refetchMy();
        }}
      />
    </div>
  );
}
