import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../services/api';
import { Bot, Calculator, Code, Search, ChevronDown, ChevronRight, Clock, Play } from 'lucide-react';

interface ToolCall {
  tool: string;
  args: Record<string, string>;
  result?: string;
}

interface AgentHistory {
  id: string;
  task: string;
  model: string;
  result: string;
  tool_calls: string;
  created_at: string;
}

const toolIcons: Record<string, React.ReactNode> = {
  calculator: <Calculator size={16} />,
  python_exec: <Code size={16} />,
  web_search: <Search size={16} />,
};

const toolColors: Record<string, string> = {
  calculator: 'text-blue-400',
  python_exec: 'text-green-400',
  web_search: 'text-yellow-400',
};

export default function Agent() {
  const [task, setTask] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [toolCalls, setToolCalls] = useState<ToolCall[]>([]);
  const [finalResult, setFinalResult] = useState('');
  const [history, setHistory] = useState<AgentHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [expandedTools, setExpandedTools] = useState<Record<number, boolean>>({});
  const [error, setError] = useState('');
  const resultRef = useRef<HTMLDivElement>(null);

  const loadHistory = useCallback(async () => {
    try {
      const data = await api.get('/agent/history');
      setHistory(data);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleRun = async () => {
    if (!task.trim() || isRunning) return;

    setIsRunning(true);
    setToolCalls([]);
    setFinalResult('');
    setError('');
    setExpandedTools({});

    const currentTask = task;

    try {
      const response = await fetch('/api/agent/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${api.getToken()}`,
        },
        body: JSON.stringify({ task: currentTask }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ detail: '执行失败' }));
        throw new Error(err.detail || '执行失败');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('无法读取响应流');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const parsed = JSON.parse(line.startsWith('data: ') ? line.slice(6) : line);

            if (parsed.type === 'tool_call') {
              setToolCalls((prev) => [
                ...prev,
                { tool: parsed.tool, args: parsed.args },
              ]);
            } else if (parsed.type === 'tool_result') {
              setToolCalls((prev) =>
                prev.map((tc, i) =>
                  i === prev.length - 1 ? { ...tc, result: parsed.result } : tc
                )
              );
            } else if (parsed.type === 'final') {
              setFinalResult(parsed.content);
            }
          } catch {
            // skip
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '执行失败');
    } finally {
      setIsRunning(false);
      loadHistory();
      // 滚动到结果区域
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  const toggleTool = (index: number) => {
    setExpandedTools((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  return (
    <div className="flex h-full">
      {/* 主内容区 */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
            {/* 标题 */}
            <div className="text-center mb-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center mx-auto mb-3">
                <Bot size={26} className="text-white" />
              </div>
              <h2 className="text-lg font-medium">AI Agent</h2>
              <p className="text-sm text-[var(--color-text-muted)] mt-1">
                Agent 可以自主调用工具来完成复杂任务
              </p>
            </div>

            {/* 错误提示 */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm">
                {error}
              </div>
            )}

            {/* 任务输入 */}
            <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-4">
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                任务描述
              </label>
              <textarea
                value={task}
                onChange={(e) => setTask(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && !isRunning) {
                    e.preventDefault();
                    handleRun();
                  }
                }}
                placeholder="描述你想要Agent完成的任务，例如：计算 (123 * 456) / 789 的结果，并用Python验证"
                rows={3}
                disabled={isRunning}
                className="w-full px-4 py-3 bg-[var(--color-bg-primary)] border border-[var(--color-border)]
                           rounded-lg text-sm resize-none focus:outline-none focus:border-[var(--color-accent)]
                           placeholder:text-[var(--color-text-muted)] disabled:opacity-50"
              />
              <div className="flex justify-end mt-3">
                <button
                  onClick={handleRun}
                  disabled={!task.trim() || isRunning}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--color-accent)]
                             hover:bg-[var(--color-accent-hover)] text-sm font-medium transition-colors
                             disabled:opacity-50"
                >
                  {isRunning ? (
                    <>
                      <div className="flex gap-1">
                        <span className="typing-dot" style={{ width: 5, height: 5 }} />
                        <span className="typing-dot" style={{ width: 5, height: 5 }} />
                        <span className="typing-dot" style={{ width: 5, height: 5 }} />
                      </div>
                      执行中...
                    </>
                  ) : (
                    <>
                      <Play size={16} />
                      执行任务
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* 工具调用过程 */}
            {toolCalls.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-[var(--color-text-secondary)] flex items-center gap-2">
                  <Code size={16} />
                  工具调用过程
                </h3>
                {toolCalls.map((tc, i) => (
                  <div
                    key={i}
                    className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl overflow-hidden"
                  >
                    <button
                      onClick={() => toggleTool(i)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-[var(--color-bg-hover)] transition-colors"
                    >
                      <span className={toolColors[tc.tool] || 'text-[var(--color-text-muted)]'}>
                        {toolIcons[tc.tool] || <Search size={16} />}
                      </span>
                      <span className="font-medium flex-1 text-left">
                        {tc.tool === 'calculator'
                          ? '计算器'
                          : tc.tool === 'python_exec'
                          ? 'Python 执行'
                          : tc.tool === 'web_search'
                          ? '网络搜索'
                          : tc.tool}
                      </span>
                      <span className="text-xs text-[var(--color-text-muted)] truncate max-w-[200px]">
                        {JSON.stringify(tc.args)}
                      </span>
                      {expandedTools[i] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </button>
                    {expandedTools[i] && (
                      <div className="px-4 pb-3 space-y-2">
                        <div>
                          <span className="text-xs text-[var(--color-text-muted)]">参数:</span>
                          <pre className="mt-1 text-xs bg-[var(--color-bg-primary)] rounded-lg p-2 overflow-x-auto">
                            {JSON.stringify(tc.args, null, 2)}
                          </pre>
                        </div>
                        {tc.result !== undefined && (
                          <div>
                            <span className="text-xs text-[var(--color-text-muted)]">结果:</span>
                            <pre className="mt-1 text-xs bg-[var(--color-bg-primary)] rounded-lg p-2 overflow-x-auto whitespace-pre-wrap">
                              {tc.result}
                            </pre>
                          </div>
                        )}
                        {tc.result === undefined && (
                          <div className="text-xs text-[var(--color-text-muted)]">执行中...</div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* 最终结果 */}
            {finalResult && (
              <div ref={resultRef} className="space-y-3 animate-fade-in">
                <h3 className="text-sm font-medium text-[var(--color-text-secondary)] flex items-center gap-2">
                  <Bot size={16} />
                  执行结果
                </h3>
                <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-4">
                  <div className="markdown-body text-sm">{finalResult}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 历史记录侧边栏 */}
      <div
        className={`
          border-l border-[var(--color-border)] bg-[var(--color-bg-secondary)]
          transition-all duration-200 flex-shrink-0 overflow-hidden
          ${showHistory ? 'w-80' : 'w-0 border-l-0'}
        `}
      >
        <div className="w-80 h-full flex flex-col">
          <div className="p-3 border-b border-[var(--color-border)]">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <Clock size={14} />
              历史记录
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {history.length === 0 ? (
              <p className="text-xs text-[var(--color-text-muted)] text-center py-8">
                暂无执行记录
              </p>
            ) : (
              history.map((h) => (
                <div
                  key={h.id}
                  className="bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-lg p-3 text-xs"
                >
                  <p className="text-[var(--color-text-secondary)] mb-1 line-clamp-2">{h.task}</p>
                  <p className="text-[var(--color-text-muted)]">
                    {new Date(h.created_at).toLocaleString('zh-CN')}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 历史切换按钮 */}
      <button
        onClick={() => setShowHistory(!showHistory)}
        className="absolute right-0 top-1/2 -translate-y-1/2 p-2 bg-[var(--color-bg-secondary)]
                   border border-[var(--color-border)] rounded-l-lg text-[var(--color-text-muted)]
                   hover:text-[var(--color-text-secondary)] transition-colors"
        style={{ marginRight: showHistory ? '320px' : '0' }}
      >
        <Clock size={16} />
      </button>
    </div>
  );
}
