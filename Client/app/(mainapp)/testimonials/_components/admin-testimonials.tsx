"use client";

import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  AlertCircle,
  ArrowDownUp,
  CheckCircle2,
  Clock,
  Eye,
  Loader2,
  MessageSquareQuote,
  RefreshCw,
  Search,
  Sparkles,
  Star,
  Trash2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import type {
  Testimonial,
  TestimonialStatus,
  TestimonialStats,
} from "@/api/testimonials.api";
import { formatDateTime } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import GenericTable from "@/components/ui/generic-table";

import {
  useAdminTestimonials,
  useDeleteTestimonial,
  useSetHeroTestimonial,
  useUpdateTestimonialStatus,
} from "../_hooks/use-testimonials";

/* ------------------------------------------------------------------ */
/*  Style maps                                                        */
/* ------------------------------------------------------------------ */

const STATUS_STYLES: Record<TestimonialStatus, string> = {
  PENDING: "bg-amber-500/90 text-white border-amber-400/40",
  APPROVED: "bg-emerald-500/90 text-white border-emerald-400/40",
  REJECTED: "bg-destructive/90 text-destructive-foreground border-destructive/40",
};

const STATUS_LABELS: Record<TestimonialStatus, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

/* ------------------------------------------------------------------ */
/*  Summary cards                                                     */
/* ------------------------------------------------------------------ */

function SummaryCards({
  testimonials,
  statsFromMeta,
}: {
  testimonials: Testimonial[];
  statsFromMeta?: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    hero: number;
  };
}) {
  const stats = useMemo(() => {
    if (statsFromMeta) return statsFromMeta;

    let pending = 0;
    let approved = 0;
    let rejected = 0;
    let hero = 0;

    for (const t of testimonials) {
      if (t.status === "PENDING") pending++;
      else if (t.status === "APPROVED") approved++;
      else if (t.status === "REJECTED") rejected++;
      if (t.isHero) hero++;
    }
    return {
      total: testimonials.length,
      pending,
      approved,
      rejected,
      hero,
    };
  }, [testimonials, statsFromMeta]);

  const cards = [
    {
      label: "Total Submissions",
      value: stats.total,
      icon: <MessageSquareQuote className="h-5 w-5 text-violet-400" />,
      accent: "text-violet-400",
      description: "All customer testimonials",
    },
    {
      label: "Pending Review",
      value: stats.pending,
      icon: <Clock className="h-5 w-5 text-amber-500" />,
      accent: "text-amber-500",
      alert: stats.pending > 0,
      description: "Awaiting admin approval",
    },
    {
      label: "Approved",
      value: stats.approved,
      icon: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
      accent: "text-emerald-500",
      description: "Visible on community wall",
    },
    {
      label: "Featured on Hero",
      value: stats.hero,
      icon: <Sparkles className="h-5 w-5 text-purple-400" />,
      accent: "text-purple-400",
      description: "Displayed on homepage hero",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 sm:gap-4">
      {cards.map((c) => (
        <Card
          key={c.label}
          className={`glass-card transition-all duration-300 hover:border-violet-500/30 ${
            c.alert ? "border-amber-500/40 bg-amber-500/5" : ""
          }`}
        >
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {c.label}
              </span>
              <div className="rounded-lg bg-card/60 p-2 border border-border/50">
                {c.icon}
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className={`text-2xl font-bold sm:text-3xl font-display ${c.accent}`}>
                {c.value}
              </span>
              {c.alert && (
                <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded">
                  Action required
                </span>
              )}
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">{c.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Review Detail & Edit Dialog                                       */
/* ------------------------------------------------------------------ */

function TestimonialDetailDialog({
  item,
  open,
  onOpenChange,
  onUpdateStatus,
  onToggleHero,
  onDelete,
}: {
  item: Testimonial | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateStatus: (id: string, status: TestimonialStatus, adminNote?: string) => Promise<void>;
  onToggleHero: (id: string, isHero: boolean) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [adminNote, setAdminNote] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  if (!item) return null;

  const handleStatusChange = async (status: TestimonialStatus) => {
    setIsUpdating(true);
    try {
      await onUpdateStatus(item.id, status, adminNote.trim() || undefined);
      toast.success(`Testimonial status changed to ${STATUS_LABELS[status]}`);
      onOpenChange(false);
    } catch {
      toast.error("Failed to update status");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleHeroToggle = async () => {
    setIsUpdating(true);
    try {
      await onToggleHero(item.id, !item.isHero);
      toast.success(
        !item.isHero
          ? "Placed on hero section! It is now featured on the homepage."
          : "Removed from hero section."
      );
      onOpenChange(false);
    } catch {
      toast.error("Failed to update hero placement");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this testimonial?")) return;
    setIsUpdating(true);
    try {
      await onDelete(item.id);
      toast.success("Testimonial deleted successfully");
      onOpenChange(false);
    } catch {
      toast.error("Failed to delete testimonial");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl border-border/80 bg-background/95 backdrop-blur-xl">
        <DialogHeader>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-violet-400">
                Testimonial Review
              </span>
              <Badge className={STATUS_STYLES[item.status]}>
                {STATUS_LABELS[item.status]}
              </Badge>
              {item.isHero && (
                <Badge className="bg-purple-600 text-white flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  Hero Featured
                </Badge>
              )}
            </div>
            <span className="text-[11px] text-muted-foreground">
              {formatDateTime(item.createdAt)}
            </span>
          </div>
          <DialogTitle className="text-lg font-bold">
            {item.headline ? `"${item.headline}"` : "Player Testimonial"}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Submitted by {item.user.name} ({item.user.email})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Rating */}
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                className={`h-5 w-5 ${
                  s <= item.rating
                    ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.6)]"
                    : "fill-neutral-800 text-neutral-700"
                }`}
              />
            ))}
            <span className="ml-2 text-xs font-semibold text-amber-400">
              {item.rating} / 5 Stars
            </span>
          </div>

          {/* Full content */}
          <div className="rounded-lg bg-card/60 p-4 border border-border/70">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
              Review Content
            </p>
            <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
              {item.content}
            </p>
          </div>

          {/* Admin Note input */}
          <div className="space-y-1.5">
            <Label htmlFor="admin-note" className="text-xs font-semibold">
              Admin Note / Feedback (Optional)
            </Label>
            <Input
              id="admin-note"
              placeholder="Internal note or feedback visible to user if rejected"
              defaultValue={item.adminNote || ""}
              onChange={(e) => setAdminNote(e.target.value)}
              className="bg-card/50 text-xs"
            />
          </div>

          {/* Placement control */}
          <div className="flex items-center justify-between p-3 rounded-lg border border-violet-500/30 bg-violet-500/5">
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-violet-400" />
                Hero Landing Page Feature
              </p>
              <p className="text-[11px] text-muted-foreground">
                Toggles whether this testimonial is placed directly in the website homepage hero.
              </p>
            </div>
            <Button
              size="sm"
              variant={item.isHero ? "default" : "outline"}
              onClick={handleHeroToggle}
              disabled={isUpdating}
              className={
                item.isHero
                  ? "bg-violet-600 hover:bg-violet-500 text-white font-bold"
                  : "border-violet-500/40 text-violet-400 hover:bg-violet-500/10"
              }
            >
              <Star className={`h-3.5 w-3.5 mr-1 ${item.isHero ? "fill-white" : ""}`} />
              {item.isHero ? "Hero Active" : "Place on Hero"}
            </Button>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-4 flex-wrap">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            disabled={isUpdating}
            className="text-destructive hover:bg-destructive/10 mr-auto"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>

          {item.status !== "REJECTED" && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleStatusChange("REJECTED")}
              disabled={isUpdating}
              className="border-destructive/30 text-destructive hover:bg-destructive/10"
            >
              <XCircle className="h-4 w-4 mr-1" />
              Reject
            </Button>
          )}

          {item.status !== "APPROVED" && (
            <Button
              type="button"
              size="sm"
              onClick={() => handleStatusChange("APPROVED")}
              disabled={isUpdating}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
            >
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Approve
            </Button>
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isUpdating}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                    */
/* ------------------------------------------------------------------ */

export function AdminTestimonials() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | TestimonialStatus>("ALL");
  const [heroFilter, setHeroFilter] = useState<"ALL" | "HERO" | "NOT_HERO">("ALL");
  const [selectedItem, setSelectedItem] = useState<Testimonial | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data, isPending, error, refetch } = useAdminTestimonials({ limit: 100 });
  const updateStatusMutation = useUpdateTestimonialStatus();
  const setHeroMutation = useSetHeroTestimonial();
  const deleteMutation = useDeleteTestimonial();

  const handleQuickApprove = async (t: Testimonial, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await updateStatusMutation.mutateAsync({
        id: t.id,
        data: { status: "APPROVED" },
      });
      toast.success(`Approved review from ${t.user.name}`);
    } catch {
      toast.error("Failed to approve testimonial");
    }
  };

  const handleQuickReject = async (t: Testimonial, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await updateStatusMutation.mutateAsync({
        id: t.id,
        data: { status: "REJECTED" },
      });
      toast.success(`Rejected review from ${t.user.name}`);
    } catch {
      toast.error("Failed to reject testimonial");
    }
  };

  const handleQuickHeroToggle = async (t: Testimonial, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await setHeroMutation.mutateAsync({
        id: t.id,
        isHero: !t.isHero,
      });
      toast.success(
        !t.isHero
          ? `Placed ${t.user.name}'s review on the Hero page!`
          : `Removed from Hero page.`
      );
    } catch {
      toast.error("Failed to toggle Hero placement");
    }
  };

  const columns = useMemo<ColumnDef<Testimonial>[]>(
    () => [
      {
        accessorKey: "user",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 text-xs font-semibold"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Player
            <ArrowDownUp className="ml-1 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-violet-600/20 border border-violet-500/30 text-violet-300 font-bold flex items-center justify-center text-xs">
              {row.original.user.name?.slice(0, 2) || "PL"}
            </div>
            <div>
              <p className="font-semibold text-xs text-foreground leading-tight">
                {row.original.user.name}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {row.original.user.email}
              </p>
            </div>
          </div>
        ),
      },
      {
        accessorKey: "rating",
        header: "Rating",
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                className={`h-3.5 w-3.5 ${
                  s <= row.original.rating
                    ? "fill-amber-400 text-amber-400"
                    : "fill-neutral-800 text-neutral-700"
                }`}
              />
            ))}
          </div>
        ),
      },
      {
        accessorKey: "content",
        header: "Review",
        cell: ({ row }) => (
          <div className="max-w-xs md:max-w-md">
            {row.original.headline && (
              <p className="font-bold text-xs text-foreground truncate">
                &ldquo;{row.original.headline}&rdquo;
              </p>
            )}
            <p className="text-xs text-muted-foreground line-clamp-2">
              {row.original.content}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge className={STATUS_STYLES[row.original.status]}>
            {STATUS_LABELS[row.original.status]}
          </Badge>
        ),
      },
      {
        accessorKey: "isHero",
        header: "Hero Placement",
        cell: ({ row }) => (
          <Button
            size="sm"
            variant={row.original.isHero ? "default" : "outline"}
            className={`h-7 px-2.5 text-xs font-semibold ${
              row.original.isHero
                ? "bg-violet-600 hover:bg-violet-500 text-white shadow-[0_0_12px_rgba(139,92,246,0.5)]"
                : "border-dashed border-border/80 text-muted-foreground hover:text-foreground"
            }`}
            onClick={(e) => handleQuickHeroToggle(row.original, e)}
          >
            <Star
              className={`h-3 w-3 mr-1 ${
                row.original.isHero ? "fill-amber-300 text-amber-300" : ""
              }`}
            />
            {row.original.isHero ? "Hero Active" : "Place on Hero"}
          </Button>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Submitted",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {formatDateTime(row.original.createdAt)}
          </span>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            {row.original.status !== "APPROVED" && (
              <Button
                variant="ghost"
                size="icon"
                title="Approve"
                className="h-7 w-7 text-emerald-500 hover:bg-emerald-500/10 hover:text-emerald-400"
                onClick={(e) => handleQuickApprove(row.original, e)}
              >
                <CheckCircle2 className="h-4 w-4" />
              </Button>
            )}
            {row.original.status !== "REJECTED" && (
              <Button
                variant="ghost"
                size="icon"
                title="Reject"
                className="h-7 w-7 text-destructive hover:bg-destructive/10"
                onClick={(e) => handleQuickReject(row.original, e)}
              >
                <XCircle className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              title="View full review"
              className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted/50"
              onClick={() => {
                setSelectedItem(row.original);
                setDialogOpen(true);
              }}
            >
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const testimonials = useMemo(() => {
    const all = Array.isArray(data?.data) ? data.data : [];
    const q = search.trim().toLowerCase();

    return all.filter((t) => {
      if (statusFilter !== "ALL" && t.status !== statusFilter) return false;
      if (heroFilter === "HERO" && !t.isHero) return false;
      if (heroFilter === "NOT_HERO" && t.isHero) return false;

      if (!q) return true;

      const userName = t.user?.name?.toLowerCase() || "";
      const userEmail = t.user?.email?.toLowerCase() || "";
      const headline = t.headline?.toLowerCase() || "";
      const content = t.content?.toLowerCase() || "";

      return (
        userName.includes(q) ||
        userEmail.includes(q) ||
        headline.includes(q) ||
        content.includes(q)
      );
    });
  }, [data, search, statusFilter, heroFilter]);

  const statsMeta = (data?.meta as { stats?: TestimonialStats })?.stats;

  return (
    <div className="space-y-6">
      {/* Heading */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground font-display">
            Testimonials Management
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Review player feedback, approve submissions, and choose which reviews to place on the website hero.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="self-start sm:self-auto gap-1.5"
          onClick={() => refetch()}
          disabled={isPending}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isPending ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Overview Cards */}
      <SummaryCards testimonials={testimonials} statsFromMeta={statsMeta} />

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="testimonials-search"
            placeholder="Search by player, headline, keyword…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 pl-9 text-xs"
          />
        </div>

        {/* Status filter */}
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as "ALL" | TestimonialStatus)}
        >
          <SelectTrigger id="testimonials-status-filter" className="h-9 w-40 text-xs">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="APPROVED">Approved</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
          </SelectContent>
        </Select>

        {/* Hero filter */}
        <Select
          value={heroFilter}
          onValueChange={(v) => setHeroFilter(v as "ALL" | "HERO" | "NOT_HERO")}
        >
          <SelectTrigger id="testimonials-hero-filter" className="h-9 w-44 text-xs">
            <SelectValue placeholder="All Hero States" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Hero placements</SelectItem>
            <SelectItem value="HERO">⭐ Placed on Hero</SelectItem>
            <SelectItem value="NOT_HERO">Not on Hero</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="sm"
          className="h-9 text-xs"
          onClick={() => {
            setSearch("");
            setStatusFilter("ALL");
            setHeroFilter("ALL");
          }}
        >
          Clear filters
        </Button>
      </div>

      {/* Loading state */}
      {isPending && (
        <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-violet-400" />
          Loading testimonials…
        </div>
      )}

      {/* Error state */}
      {error && !isPending && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              Failed to load testimonials. Please try refreshing.
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="text-xs"
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {!isPending && !error && testimonials.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border/70 py-16 text-center">
          <MessageSquareQuote className="h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm font-medium">No testimonials found</p>
          <p className="text-xs text-muted-foreground">
            {search || statusFilter !== "ALL" || heroFilter !== "ALL"
              ? "Try a different search or filter."
              : "Customer testimonials will appear here."}
          </p>
        </div>
      )}

      {/* Data Table */}
      {!isPending && !error && testimonials.length > 0 && (
        <div className="glass-card rounded-lg border border-border/80 overflow-hidden">
          <GenericTable
            columns={columns}
            data={testimonials}
            sort
            pagination
          />
        </div>
      )}

      {/* Detail / Action Dialog */}
      <TestimonialDetailDialog
        item={selectedItem}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onUpdateStatus={async (id, status, adminNote) => {
          await updateStatusMutation.mutateAsync({
            id,
            data: { status, adminNote },
          });
        }}
        onToggleHero={async (id, isHero) => {
          await setHeroMutation.mutateAsync({ id, isHero });
        }}
        onDelete={async (id) => {
          await deleteMutation.mutateAsync(id);
        }}
      />
    </div>
  );
}
