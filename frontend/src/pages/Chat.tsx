import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../services/api';
import ConversationList from '../components/chat/ConversationList';
import ChatInput from '../components/chat/ChatInput';
import MessageBubble from '../components/chat/MessageBubble';
import ModelSelector from '../components/chat/ModelSelector';
import LoadingDots from '../components/common/LoadingDots';
import { Bot, PanelLeftClose, PanelLeft } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}

interface Conversation {
  id: string;
  title: string;
  model: string;
  created_at: string;
  updated_at: string;
}

export default function Chat() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [streamingContent, setStreamingContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [models, setModels] = useState<string[]>(['llama3']);
  const [selectedModel, setSelectedModel] = useState('llama3');
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // 加载对话列表
  const loadConversations = useCallback(async () => {
    try {
      const data = await api.get('/conversations');
      setConversations(data);
    } catch (err) {
      console.error('加载对话列表失败:', err);
    }
  }, []);

  // 加载模型列表
  const loadModels = useCallback(async () => {
    try {
      const data = await api.get('/models');
      if (data.models?.length > 0) {
        setModels(data.models);
        setSelectedModel(data.models[0]);
      }
    } catch {
      // 使用默认模型
    }
  }, []);

  useEffect(() => {
    loadConversations();
    loadModels();
  }, [loadConversations, loadModels]);

  // 滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  // 加载对话详情
  const loadConversation = async (convId: string) => {
    try {
      const data = await api.get(`/conversations/${convId}`);
      setMessages(data.messages || []);
      setSelectedModel(data.model);
      setActiveConvId(convId);
    } catch (err) {
      console.error('加载对话失败:', err);
    }
  };

  // 发送消息
  const handleSend = async (message: string) => {
    if (isStreaming) return;

    const userMsg: Message = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: message,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setStreamingContent('');
    setIsStreaming(true);

    let fullContent = '';

    try {
      await api.streamChat(
        '/chat',
        {
          conversation_id: activeConvId,
          message,
          model: selectedModel,
        },
        (chunk) => {
          fullContent += chunk;
          setStreamingContent(fullContent);
        },
        async (convId) => {
          // 流式完成
          const assistantMsg: Message = {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: fullContent,
            created_at: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, assistantMsg]);
          setStreamingContent('');
          setActiveConvId(convId);
          setIsStreaming(false);

          // 刷新对话列表以更新标题
          await loadConversations();
        },
        (error) => {
          setStreamingContent('');
          setIsStreaming(false);
          console.error('聊天错误:', error);
        },
      );
    } catch (err) {
      setStreamingContent('');
      setIsStreaming(false);
    }
  };

  // 停止生成
  const handleStop = () => {
    if (abortRef.current) {
      abortRef.current.abort();
    }
    // 保存当前已生成的内容
    if (streamingContent) {
      const assistantMsg: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: streamingContent + '\n\n*[已停止生成]*',
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setStreamingContent('');
    }
    setIsStreaming(false);
  };

  // 删除对话
  const handleDelete = async (convId: string) => {
    try {
      await api.delete(`/conversations/${convId}`);
      if (activeConvId === convId) {
        setActiveConvId(null);
        setMessages([]);
      }
      setConversations((prev) => prev.filter((c) => c.id !== convId));
    } catch (err) {
      console.error('删除对话失败:', err);
    }
  };

  // 新建对话
  const handleNew = () => {
    setActiveConvId(null);
    setMessages([]);
    setStreamingContent('');
  };

  return (
    <div className="flex h-full">
      {/* 对话列表面板 */}
      <div
        className={`
          border-r border-[var(--color-border)] bg-[var(--color-bg-secondary)]
          transition-all duration-200 flex-shrink-0
          ${sidebarVisible ? 'w-64' : 'w-0 overflow-hidden border-r-0'}
        `}
      >
        <ConversationList
          conversations={conversations}
          activeId={activeConvId}
          onSelect={loadConversation}
          onDelete={handleDelete}
          onNew={handleNew}
        />
      </div>

      {/* 聊天区域 */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 顶部工具栏 */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSidebarVisible(!sidebarVisible)}
              className="p-1.5 rounded-lg hover:bg-[var(--color-bg-hover)] text-[var(--color-text-muted)]
                         hover:text-[var(--color-text-secondary)] transition-colors"
            >
              {sidebarVisible ? <PanelLeftClose size={18} /> : <PanelLeft size={18} />}
            </button>
            <ModelSelector models={models} selected={selectedModel} onSelect={setSelectedModel} />
          </div>
        </div>

        {/* 消息区域 */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 && !streamingContent ? (
            <div className="flex flex-col items-center justify-center h-full text-[var(--color-text-muted)]">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-600/20 flex items-center justify-center mb-4">
                <Bot size={32} className="text-[var(--color-accent)]" />
              </div>
              <h2 className="text-lg font-medium text-[var(--color-text-secondary)] mb-1">
                AI 智能问答
              </h2>
              <p className="text-sm">选择一个模型，开始对话吧</p>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
              {messages.map((msg) => (
                <MessageBubble key={msg.id} role={msg.role} content={msg.content} />
              ))}
              {streamingContent && (
                <MessageBubble
                  role="assistant"
                  content={streamingContent}
                  isStreaming={isStreaming}
                />
              )}
              {isStreaming && !streamingContent && <LoadingDots />}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* 输入区域 */}
        <ChatInput
          onSend={handleSend}
          onStop={handleStop}
          isStreaming={isStreaming}
        />
      </div>
    </div>
  );
}
