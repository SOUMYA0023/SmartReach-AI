"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TopBar } from "@/components/layout/top-bar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn, formatCurrency, formatDate, formatRelativeDate } from "@/lib/utils";
import { Search, X, Filter, Mail, Phone, MapPin, ShoppingBag, Star, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ApiCustomer } from "@/lib/api";

const segmentColors: Record<string, string> = {
  VIP: "bg-amber-100 text-amber-800 border border-amber-200",
  Loyal: "bg-[#E7F5EF] text-success border border-success-subtle",
  "Potential Loyalist": "bg-surface-elevated text-text-primary border border-border-subtle",
  New: "bg-success/15 text-success border border-success-subtle/30",
  "At Risk": "bg-warning/15 text-warning border border-warning-subtle/30",
  Dormant: "bg-[var(--color-signal-dim)] text-[var(--color-signal)] border border-danger-subtle/30",
};

const SEGMENTS = [
  { label: "All", value: "" },
  { label: "VIP", value: "VIP" },
  { label: "Loyal", value: "Loyal" },
  { label: "Potential Loyalist", value: "Potential Loyalist" },
  { label: "New", value: "New" },
  { label: "At Risk", value: "At Risk" },
  { label: "Dormant", value: "Dormant" },
];

function EngagementBar({ score }: { score: number }) {
  const color = score >= 70 ? "bg-success" : score >= 40 ? "bg-warning" : "bg-danger";
  return (
    <div className="flex items-center gap-2 w-24">
      <div className="flex-1 h-1.5 rounded-full bg-surface-elevated overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
      <span className="text-xs text-text-muted w-6 text-right">{score}</span>
    </div>
  );
}

function CustomerDetailDrawer({
  customer,
  open,
  onClose,
}: {
  customer: ApiCustomer | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!customer) return null;
  const segment = customer.segment ?? "New";

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-[420px] bg-surface border-l border-border-subtle p-0 overflow-y-auto">
        <SheetHeader className="p-6 pb-4 border-b border-border-subtle">
          <SheetTitle className="text-text-primary">Customer Profile</SheetTitle>
        </SheetHeader>

        <div className="p-6 space-y-6">
          {/* Profile Card */}
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-[2px] bg-[#111110] mx-auto flex items-center justify-center text-xl font-bold text-white">
              {customer.name.split(" ").map((n) => n[0]).join("")}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-text-primary">{customer.name}</h3>
              <Badge className={cn("text-[10px] mt-1", segmentColors[segment] ?? "")}>
                {segment}
              </Badge>
            </div>
          </div>

          {/* Contact */}
          <div className="space-y-2">
            <div className="flex items-center gap-3 text-sm">
              <Mail className="w-4 h-4 text-text-muted" />
              <span className="text-text-primary">{customer.email}</span>
            </div>
            {customer.phone && (
              <div className="flex items-center gap-3 text-sm">
                <Phone className="w-4 h-4 text-text-muted" />
                <span className="text-text-primary">{customer.phone}</span>
              </div>
            )}
            {customer.city && (
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="w-4 h-4 text-text-muted" />
                <span className="text-text-primary">{customer.city}</span>
              </div>
            )}
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Lifetime Value", value: formatCurrency(customer.total_spend), icon: Star },
              { label: "Total Orders", value: customer.total_orders.toString(), icon: ShoppingBag },
              { label: "Preferred Channel", value: customer.preferred_channel ?? "—", icon: TrendingUp },
              { label: "Segment", value: segment, icon: Filter },
            ].map((metric) => (
              <div key={metric.label} className="p-3 rounded-[2px] bg-surface border border-border-subtle">
                <div className="flex items-center gap-2 mb-1">
                  <metric.icon className="w-3 h-3 text-text-muted" />
                  <span className="text-[10px] text-text-muted uppercase tracking-wider">{metric.label}</span>
                </div>
                <p className="text-sm font-semibold text-text-primary">{metric.value}</p>
              </div>
            ))}
          </div>

          {customer.last_order_date && (
            <div className="p-3 rounded-[2px] bg-[var(--color-signal-dim)] border border-border-subtle">
              <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Last Order</p>
              <p className="text-sm font-semibold text-text-primary">
                {formatDate(customer.last_order_date)}
              </p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default function CustomersPage() {
  const [search, setSearch] = useState("");
  const [selectedSegment, setSelectedSegment] = useState<string>("");
  const [selectedCustomer, setSelectedCustomer] = useState<ApiCustomer | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["customers", selectedSegment],
    queryFn: () => api.getCustomers({ limit: 500, segment: selectedSegment || undefined }),
    refetchInterval: 60_000,
  });

  const customers = data?.items ?? [];

  const filtered = useMemo(() => {
    return customers.filter((c) => {
      const matchesSearch =
        search === "" ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.email.toLowerCase().includes(search.toLowerCase()) ||
        (c.city ?? "").toLowerCase().includes(search.toLowerCase());
      return matchesSearch;
    });
  }, [search, customers]);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <TopBar
        title="Customers"
        subtitle={
          isLoading
            ? "Loading customers…"
            : isError
            ? "Could not reach backend"
            : `${data?.total ?? 0} customers`
        }
      />

      <div className="flex-1 space-y-6 overflow-y-auto p-8">
        {/* Filters */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <Input
              placeholder="Search customers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-surface border-border-subtle text-text-primary placeholder:text-text-muted focus:border-text-primary focus:ring-text-primary/10"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-3.5 h-3.5 text-text-muted hover:text-text-primary" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap border-b border-[var(--color-border)]">
            {SEGMENTS.map((seg) => (
              <button
                key={seg.label}
                onClick={() => setSelectedSegment(seg.value)}
                className={cn(
                  "border-b-2 px-4 py-2 font-body text-xs transition-colors duration-150",
                  selectedSegment === seg.value
                    ? "border-[var(--color-ink)] font-medium text-[var(--color-ink)]"
                    : "border-transparent text-[var(--color-muted)] hover:text-[var(--color-ink)]"
                )}
              >
                {seg.label} {selectedSegment === seg.value && `(${filtered.length})`}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="overflow-hidden rounded-[2px] border border-[var(--color-border)] bg-white"
        >
          {isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-10 animate-pulse rounded-[2px] bg-[#F5F2EC]" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-subtle">
                    {["Customer", "City", "Total Spend", "Orders", "Last Order", "Segment", "Channel"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold text-text-muted uppercase tracking-wider whitespace-nowrap sticky top-0 bg-surface">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence mode="popLayout">
                    {filtered.map((customer, index) => (
                      <motion.tr
                        key={customer.id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1, transition: { delay: index * 0.02 } }}
                        exit={{ opacity: 0 }}
                        onClick={() => { setSelectedCustomer(customer); setDrawerOpen(true); }}
                        className="group cursor-pointer border-b border-[#F5F2EC] transition-colors duration-150 hover:bg-[var(--color-bg)]"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-[2px] bg-[#111110] flex items-center justify-center text-xs font-semibold text-white flex-shrink-0">
                              {customer.name.split(" ").map((n) => n[0]).join("")}
                            </div>
                            <div>
                              <p className="font-medium text-text-primary group-hover:text-text-primary transition-colors">{customer.name}</p>
                              <p className="text-xs text-text-muted">{customer.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-text-muted">{customer.city ?? "—"}</td>
                        <td className="px-4 py-3 font-medium text-text-primary">{formatCurrency(customer.total_spend)}</td>
                        <td className="px-4 py-3 text-text-muted">{customer.total_orders}</td>
                        <td className="px-4 py-3 text-text-muted">
                          {customer.last_order_date ? formatRelativeDate(customer.last_order_date) : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={cn("text-[10px] font-medium border-0", segmentColors[customer.segment ?? ""] ?? "")}>
                            {customer.segment ?? "—"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-text-muted text-xs">{customer.preferred_channel ?? "—"}</td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}
          {!isLoading && filtered.length === 0 && (
            <div className="text-center py-12">
              <p className="text-text-muted text-sm">No customers found matching your filters</p>
            </div>
          )}
        </motion.div>
      </div>

      <CustomerDetailDrawer customer={selectedCustomer} open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  );
}
