"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TopBar } from "@/components/layout/top-bar";
import { Badge } from "@/components/ui/badge";
import { cn, formatDate } from "@/lib/utils";
import {
  BookOpen, Search, Sparkles, Brain, Target, Radio, Users,
  ArrowRight, FileText, TrendingUp, Star, Zap,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ApiKnowledgeDoc } from "@/lib/api";

const categoryColors: Record<string, string> = {
  "Win-back": "bg-[var(--color-signal-dim)] text-[#7A5200]",
  Retention: "bg-[#EAF3DE] text-[#3B6D11]",
  Acquisition: "bg-[#EAF3DE] text-[#3B6D11]",
  "Channel Strategy": "bg-[var(--color-signal-dim)] text-[#7A5200]",
  Segmentation: "bg-[#F1EFE8] text-[var(--color-muted)]",
  Personalization: "bg-[var(--color-signal-dim)] text-[#7A5200]",
};

const categoryIcons: Record<string, React.ElementType> = {
  "Win-back": Target,
  Retention: Users,
  Acquisition: TrendingUp,
  "Channel Strategy": Radio,
  Segmentation: Brain,
  Personalization: Star,
};

const categories = ["All", "Win-back", "Retention", "Acquisition", "Channel Strategy", "Segmentation", "Personalization"];

export default function KnowledgePage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [selectedDoc, setSelectedDoc] = useState<ApiKnowledgeDoc | null>(null);
  const [showDoc, setShowDoc] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["knowledge"],
    queryFn: () => api.getKnowledge({ limit: 200 }),
    refetchInterval: 60_000,
  });

  const docs = data?.items ?? [];

  const filtered = useMemo(() => {
    return docs.filter((d) => {
      const matchesCategory = activeCategory === "All" || d.category === activeCategory;
      const matchesSearch =
        search === "" ||
        d.title.toLowerCase().includes(search.toLowerCase()) ||
        d.content.toLowerCase().includes(search.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, search, docs]);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <TopBar
        title="Marketing Intelligence Hub"
        subtitle={
          isLoading
            ? "Loading knowledge base…"
            : isError
            ? "Could not reach backend"
            : `${data?.total ?? 0} knowledge documents`
        }
      />

      <div className="flex-1 space-y-6 overflow-y-auto p-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[2px] border border-[var(--color-border)] bg-white p-6"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-[2px] bg-[var(--color-signal-dim)]">
              <Brain className="w-5 h-5 text-text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-text-primary">Marketing Intelligence Hub</h2>
              <p className="text-xs text-text-muted">Proprietary marketing knowledge that powers SmartReach AI&apos;s campaign intelligence</p>
            </div>
          </div>
          <div className="flex items-center gap-6 text-xs text-text-muted mt-4">
            <div className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              <span>{data?.total ?? "—"} knowledge documents</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[var(--color-signal)]" />
              <span>All used by AI for RAG retrieval</span>
            </div>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="flex flex-col sm:flex-row items-start sm:items-center gap-4"
        >
          <div className="flex flex-wrap border-b border-[var(--color-border)]">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "border-b-2 px-4 py-2 font-body text-xs transition-colors duration-150",
                  activeCategory === cat
                    ? "border-[var(--color-ink)] font-medium text-[var(--color-ink)]"
                    : "border-transparent text-[var(--color-muted)] hover:text-[var(--color-ink)]"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="relative w-full sm:w-64 ml-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <Input
              placeholder="Search knowledge..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-surface border-border-subtle text-text-primary placeholder:text-text-muted focus:border-text-primary text-sm"
            />
          </div>
        </motion.div>

        {/* Knowledge Documents */}
        <div>
          <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[var(--color-signal)]" />
            Knowledge Documents ({filtered.length})
          </h3>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-32 animate-pulse rounded-[2px] border border-[var(--color-border)] bg-white" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-text-muted text-sm">
                {docs.length === 0
                  ? "No knowledge documents yet. Add documents via the AI Workspace or API."
                  : "No documents match your filters"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <AnimatePresence mode="popLayout">
                {filtered.map((doc, index) => {
                  const Icon = categoryIcons[doc.category] || FileText;
                  return (
                    <motion.div
                      key={doc.id}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0, transition: { delay: index * 0.03 } }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      onClick={() => { setSelectedDoc(doc); setShowDoc(true); }}
                      className="group cursor-pointer rounded-[2px] bg-surface border border-border-subtle p-5 hover:border-[#BFBCB4] transition-colors"
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div className="p-2 rounded-[2px] bg-surface-elevated group-hover:bg-surface-elevated transition-colors">
                          <Icon className="w-4 h-4 text-text-muted group-hover:text-text-primary transition-colors" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-text-primary group-hover:text-text-primary transition-colors">{doc.title}</h4>
                          <Badge className={cn("text-[9px] mt-1", categoryColors[doc.category] ?? "bg-[#F1EFE8] text-[var(--color-muted)]")}>
                            {doc.category}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-xs text-text-muted leading-relaxed mb-4 line-clamp-2">{doc.content}</p>
                      <div className="flex items-center justify-between text-[10px] text-text-muted">
                        <div className="flex items-center gap-1.5">
                          <Sparkles className="w-3 h-3 text-[var(--color-signal)]" />
                          <span>Used by AI · RAG indexed</span>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-text-primary" />
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Document Detail Modal */}
      <Dialog open={showDoc} onOpenChange={setShowDoc}>
        <DialogContent className="bg-surface border border-border-subtle max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-text-primary flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[var(--color-signal)]" />
              {selectedDoc?.title}
            </DialogTitle>
            <DialogDescription className="text-text-muted text-xs">
              {selectedDoc?.category} · Added {selectedDoc?.created_at ? formatDate(selectedDoc.created_at) : "recently"}
            </DialogDescription>
          </DialogHeader>
          {selectedDoc && (
            <div className="space-y-4 mt-2">
              <div className="p-4 rounded-[2px] bg-surface border border-border-subtle">
                <p className="text-sm text-text-primary leading-relaxed">{selectedDoc.content}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={cn("text-[10px]", categoryColors[selectedDoc.category] ?? "")}>
                  {selectedDoc.category}
                </Badge>
                <span className="text-[10px] text-text-muted">RAG indexed · used by AI for campaign generation</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
