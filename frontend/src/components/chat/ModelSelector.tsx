interface ModelSelectorProps {
  models: string[];
  selected: string;
  onSelect: (model: string) => void;
}

export default function ModelSelector({ models, selected, onSelect }: ModelSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-[var(--color-text-muted)]">模型:</span>
      <select
        value={selected}
        onChange={(e) => onSelect(e.target.value)}
        className="bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg
                   px-2.5 py-1.5 text-xs focus:outline-none focus:border-[var(--color-accent)]
                   text-[var(--color-text-secondary)]"
      >
        {models.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>
    </div>
  );
}
