import { User, Bot } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';

interface MessageBubbleProps {
  role: 'user' | 'assistant' | 'system';
  content: string;
  isStreaming?: boolean;
}

export default function MessageBubble({ role, content, isStreaming }: MessageBubbleProps) {
  const isUser = role === 'user';

  return (
    <div className={`flex gap-3 animate-fade-in ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div
        className={`
          w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
          ${isUser
            ? 'bg-[var(--color-accent)]'
            : 'bg-gradient-to-br from-indigo-500 to-purple-600'
          }
        `}
      >
        {isUser ? (
          <User size={16} className="text-white" />
        ) : (
          <Bot size={16} className="text-white" />
        )}
      </div>

      {/* Content */}
      <div
        className={`
          max-w-[80%] min-w-0 rounded-2xl px-4 py-3 text-sm leading-relaxed
          ${isUser
            ? 'bg-[var(--color-accent-light)] text-[var(--color-text-primary)]'
            : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)]'
          }
        `}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{content}</p>
        ) : (
          <div className="markdown-body">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
            >
              {content}
            </ReactMarkdown>
            {isStreaming && (
              <span className="inline-block w-2 h-4 bg-[var(--color-accent)] ml-0.5 animate-pulse align-middle" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
