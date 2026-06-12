"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TopBar } from "@/components/layout/top-bar";
import { knowledgeSnippets, playbooks } from "@/data/knowledge";
import { Badge } from "@/components/ui/badge";
import { cn, formatDate } from "@/lib/utils";
import {
  BookOpen, Search, Sparkles, Brain, Target, Radio, Users,
  ArrowRight, FileText, TrendingUp, Star, Clock, Zap,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import type { Playbook, KnowledgeSnippet } from "@/types";

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
  const [selectedPlaybook, setSelectedPlaybook] = useState<Playbook | null>(null);
  const [showPlaybook, setShowPlaybook] = useState(false);

  const filteredPlaybooks = useMemo(() => {
    return playbooks.filter((p) => {
      const matchesCategory = activeCategory === "All" || p.category === activeCategory;
      const matchesSearch = search === "" || p.title.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, search]);

  const filteredSnippets = useMemo(() => {
    return knowledgeSnippets.filter((s) => {
      const matchesCategory = activeCategory === "All" || s.category === activeCategory;
      const matchesSearch = search === "" || s.title.toLowerCase().includes(search.toLowerCase()) || s.content.toLowerCase().includes(search.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, search]);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <TopBar title="Marketing Intelligence Hub" subtitle="AI knowledge base & marketing playbooks" />

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
              <span>{knowledgeSnippets.length} knowledge snippets</span>
            </div>
            <div className="flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              <span>{playbooks.length} playbooks</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[var(--color-signal)]" />
              <span>{knowledgeSnippets.filter((s) => s.usedByAi).length} used by AI</span>
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

        {/* Playbooks */}
        <div>
          <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[var(--color-signal)]" />
            Playbooks
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {filteredPlaybooks.map((playbook, index) => {
                const Icon = categoryIcons[playbook.category] || FileText;
                return (
                  <motion.div
                    key={playbook.id}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0, transition: { delay: index * 0.05 } }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    onClick={() => { setSelectedPlaybook(playbook); setShowPlaybook(true); }}
                    className="group cursor-pointer rounded-[2px] border border-[var(--color-border)] bg-white p-5 transition-colors duration-150 hover:border-[#BFBCB4]"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className="p-2 rounded-[2px] bg-surface-elevated group-hover:bg-surface-elevated transition-colors">
                        <Icon className="w-4 h-4 text-text-muted group-hover:text-text-primary transition-colors" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-text-primary group-hover:text-text-primary transition-colors">{playbook.title}</h4>
                        <Badge className={cn("text-[9px] mt-1", categoryColors[playbook.category])}>{playbook.category}</Badge>
                      </div>
                    </div>
                    <p className="text-xs text-text-muted leading-relaxed mb-4 line-clamp-2">{playbook.description}</p>
                    <div className="flex items-center justify-between text-[10px] text-text-muted">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1"><FileText className="w-3 h-3" />{playbook.snippets.length} snippets</span>
                        <span className="flex items-center gap-1"><Zap className="w-3 h-3" />{playbook.usageCount} uses</span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-text-primary" />
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        {/* Knowledge Snippets */}
        <div>
          <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[var(--color-signal)]" />
            Knowledge Snippets
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <AnimatePresence mode="popLayout">
              {filteredSnippets.map((snippet, index) => (
                <motion.div
                  key={snippet.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: index * 0.03 } }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="rounded-[2px] bg-surface border border-border-subtle p-4 hover:border-[#BFBCB4] transition-colors"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={cn("text-[9px]", categoryColors[snippet.category])}>{snippet.category}</Badge>
                    {snippet.usedByAi && (
                      <Badge className="bg-[var(--color-signal-dim)] text-[var(--color-signal)] text-[9px]">
                        <Sparkles className="w-2.5 h-2.5 mr-0.5 inline" />Used by AI
                      </Badge>
                    )}
                    <span className="text-[10px] text-text-muted ml-auto">{snippet.source}</span>
                  </div>
                  <h4 className="text-sm font-medium text-text-primary mb-1">{snippet.title}</h4>
                  <p className="text-xs text-text-muted leading-relaxed line-clamp-3">{snippet.content}</p>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Playbook Detail Modal */}
      <Dialog open={showPlaybook} onOpenChange={setShowPlaybook}>
        <DialogContent className="bg-surface border border-border-subtle max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-text-primary flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[var(--color-signal)]" />
              {selectedPlaybook?.title}
            </DialogTitle>
            <DialogDescription className="text-text-muted text-xs">{selectedPlaybook?.description}</DialogDescription>
          </DialogHeader>
          {selectedPlaybook && (
            <div className="space-y-4 mt-2">
              <div className="flex items-center gap-4 text-xs text-text-muted">
                <Badge className={cn("text-[10px]", categoryColors[selectedPlaybook.category])}>{selectedPlaybook.category}</Badge>
                <span>{selectedPlaybook.snippets.length} snippets</span>
                <span>{selectedPlaybook.usageCount} times used</span>
                <span>Last used: {formatDate(selectedPlaybook.lastUsed)}</span>
              </div>
              <div className="space-y-3">
                {selectedPlaybook.snippets.map((snippet) => (
                  <div key={snippet.id} className="p-4 rounded-[2px] bg-surface border border-border-subtle">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="text-sm font-medium text-text-primary">{snippet.title}</h4>
                      {snippet.usedByAi && (
                        <Badge className="bg-[var(--color-signal-dim)] text-[var(--color-signal)] text-[9px]">
                          <Sparkles className="w-2.5 h-2.5 mr-0.5 inline" />AI
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-text-muted leading-relaxed">{snippet.content}</p>
                    <p className="text-[10px] text-text-muted/60 mt-2">Source: {snippet.source}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
