type Decision = "PENDING" | "INCLUDE" | "EXCLUDE" | "MAYBE";

const cfg: Record<Decision, { icon: string; label: string; cls: string }> = {
  INCLUDE: { icon: "✓", label: "Include", cls: "bg-[rgba(52,211,153,0.1)]  text-[var(--slr-include)] border-[rgba(52,211,153,0.2)]"  },
  EXCLUDE: { icon: "✕", label: "Exclude", cls: "bg-[rgba(248,113,113,0.1)] text-[var(--slr-exclude)] border-[rgba(248,113,113,0.2)]" },
  MAYBE:   { icon: "?", label: "Maybe",   cls: "bg-[rgba(251,191,36,0.1)]  text-[var(--slr-maybe)] border-[rgba(251,191,36,0.2)]"  },
  PENDING: { icon: "·", label: "Pending", cls: "bg-[rgba(75,100,120,0.2)]  text-[var(--slr-dim)] border-[rgba(75,100,120,0.3)]"  },
};

export function DecisionBadge({ decision }: { decision: Decision }) {
  const { icon, label, cls } = cfg[decision];
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-all duration-200 ${cls}`}>
      <span className="text-[10px] font-bold">{icon}</span>
      {label}
    </span>
  );
}
