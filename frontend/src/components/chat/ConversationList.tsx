import { MessageSquare, Plus, Trash2 } from 'lucide-react';

interface Conversation {
  id: string;
  title: string;
  model: string;
  created_at: string;
  updated_at: string;
}

interface ConversationListProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
}

export default function ConversationList({
  conversations,
  activeId,
  onSelect,
  onDelete,
  onNew,
}: ConversationListProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-[var(--color-border)]">
        <button
          onClick={onNew}
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg
                     bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)]
                     text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          新对话
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {conversations.length === 0 ? (
          <div className="text-center py-8 text-[var(--color-text-muted)] text-sm">
            <MessageSquare size={32} className="mx-auto mb-2 opacity-50" />
            <p>暂无对话</p>
            <p className="text-xs mt-1">点击上方按钮开始新对话</p>
          </div>
        ) : (
          conversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => onSelect(conv.id)}
              className={`
                group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer text-sm
                transition-colors duration-150
                ${
                  activeId === conv.id
                    ? 'bg-[var(--color-accent-light)] text-[var(--color-accent-hover)]'
                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]'
                }
              `}
            >
              <MessageSquare size={14} className="flex-shrink-0" />
              <span className="flex-1 truncate">{conv.title}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(conv.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-[var(--color-bg-tertiary)]
                           text-[var(--color-text-muted)] hover:text-[var(--color-danger)]
                           transition-all"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
