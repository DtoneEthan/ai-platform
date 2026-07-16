import { useState, useRef, useEffect } from 'react';
import { Send, Square } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string) => void;
  onStop?: () => void;
  isStreaming: boolean;
  disabled?: boolean;
}

export default function ChatInput({ onSend, onStop, isStreaming, disabled }: ChatInputProps) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 150) + 'px';
    }
  }, [input]);

  const handleSubmit = () => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming || disabled) return;
    onSend(trimmed);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="border-t border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-4">
      <div className="max-w-3xl mx-auto flex items-end gap-2">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入消息... (Shift+Enter 换行)"
            rows={1}
            disabled={disabled}
            className="w-full px-4 py-3 pr-4 bg-[var(--color-bg-primary)] border border-[var(--color-border)]
                       rounded-xl text-sm resize-none focus:outline-none focus:border-[var(--color-accent)]
                       placeholder:text-[var(--color-text-muted)] disabled:opacity-50"
          />
        </div>

        {isStreaming ? (
          <button
            onClick={onStop}
            className="p-3 rounded-xl bg-[var(--color-danger)] hover:bg-[var(--color-danger-hover)]
                       transition-colors flex-shrink-0"
          >
            <Square size={18} fill="white" className="text-white" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!input.trim() || disabled}
            className="p-3 rounded-xl bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)]
                       transition-colors flex-shrink-0 disabled:opacity-40"
          >
            <Send size={18} />
          </button>
        )}
      </div>
    </div>
  );
}
