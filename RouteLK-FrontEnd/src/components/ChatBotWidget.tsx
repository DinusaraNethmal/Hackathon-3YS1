import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { sendChatMessageApi, type ChatMessage } from '../services/api';

const INITIAL_MESSAGE: ChatMessage = {
  id: 'msg-init',
  role: 'assistant',
  content: `👋 **Ayubowan! I am your RouteLK AI Transit Assistant.**\n\nI have direct access to our live MongoDB database. You can ask me about:\n- 🚌 **Bus routes & schedules** (e.g. *Colombo to Kandy, Galle, Jaffna*)\n- 💰 **Ticket fares & bus types** (Luxury AC, Semi-Express)\n- 💳 **Your digital wallet & Google Pay balance**\n- 🎫 **Your ticket reservations & booking status**\n\nHow can I help you today?`,
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  source: 'RouteLK Database & Gemini AI',
};

const SUGGESTIONS = [
  'Buses from Colombo to Kandy',
  'What is the fare to Galle?',
  'What is my wallet balance?',
  'Show my booking status',
];

/**
 * Lightweight helper to format basic markdown (bold, italic, inline code, bullet points)
 */
function renderFormattedMessage(content: string) {
  const lines = content.split('\n');
  return lines.map((line, lineIdx) => {
    const isBullet =
      line.trim().startsWith('- ') ||
      line.trim().startsWith('• ') ||
      line.trim().startsWith('* ');
    const cleanedLine = isBullet
      ? line.trim().replace(/^[-•*]\s+/, '')
      : line;

    const parts: (string | React.ReactNode)[] = [];
    let remaining = cleanedLine;
    let keyIdx = 0;

    while (remaining.length > 0) {
      const boldMatch = remaining.match(/\*\*(.*?)\*\*/);
      const codeMatch = remaining.match(/`([^`]+)`/);
      let firstMatch: { type: 'bold' | 'code'; match: RegExpMatchArray; index: number } | null = null;

      if (boldMatch && boldMatch.index !== undefined) {
        firstMatch = { type: 'bold', match: boldMatch, index: boldMatch.index };
      }
      if (codeMatch && codeMatch.index !== undefined) {
        if (!firstMatch || codeMatch.index < firstMatch.index) {
          firstMatch = { type: 'code', match: codeMatch, index: codeMatch.index };
        }
      }

      if (!firstMatch) {
        parts.push(remaining);
        break;
      }
      if (firstMatch.index > 0) {
        parts.push(remaining.substring(0, firstMatch.index));
      }
      const matchText = firstMatch.match[1];
      if (firstMatch.type === 'bold') {
        parts.push(<strong key={`b-${lineIdx}-${keyIdx++}`}>{matchText}</strong>);
      } else {
        parts.push(
          <code key={`c-${lineIdx}-${keyIdx++}`} className="chat-inline-code">
            {matchText}
          </code>
        );
      }
      remaining = remaining.substring(firstMatch.index + firstMatch.match[0].length);
    }

    if (isBullet) {
      return (
        <li key={`line-${lineIdx}`} className="chat-bullet-item">
          {parts}
        </li>
      );
    }
    if (!line.trim()) {
      return <div key={`line-${lineIdx}`} style={{ height: '6px' }} />;
    }
    return (
      <p key={`line-${lineIdx}`} className="chat-text-paragraph">
        {parts}
      </p>
    );
  });
}

export const ChatBotWidget: React.FC = () => {
  const { token, user } = useAuth();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasUnread, setHasUnread] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setHasUnread(false);
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputMessage).trim();
    if (!query || isLoading) return;

    const userMsgId = `user-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputMessage('');
    setIsLoading(true);

    try {
      const conversationHistory = newMessages
        .filter((m) => m.id !== 'msg-init')
        .slice(-6)
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await sendChatMessageApi(query, conversationHistory, token);

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        content: res.reply || 'I could not find information matching your inquiry. Please try another destination.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: res.source === 'gemini-2.5-flash' ? 'Google Gemini AI' : 'RouteLK Database Engine',
      };

      setMessages((prev) => [...prev, botMsg]);

      if (!isOpen) setHasUnread(true);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `⚠️ Sorry, I could not reach the transit database right now (${err.message || 'Network error'}). Please try again shortly.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = () => {
    setMessages([INITIAL_MESSAGE]);
  };

  return (
    <div className="chatbot-root-container">
      {/* ====== Chat Window ====== */}
      {isOpen && (
        <div className="chatbot-window" role="dialog" aria-label="RouteLK AI Assistant Chat">
          {/* Header */}
          <div className="chatbot-header">
            <div className="chatbot-header-left">
              <div className="chatbot-avatar">
                {/* Transport route-network icon (hand-crafted SVG) */}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="4" width="20" height="14" rx="2" />
                  <path d="M8 4v14M16 4v14M2 8h20" />
                  <circle cx="7" cy="20" r="1.5" fill="currentColor" stroke="none" />
                  <circle cx="17" cy="20" r="1.5" fill="currentColor" stroke="none" />
                </svg>
                <span className="chatbot-status-dot" />
              </div>
              <div>
                <h4 className="chatbot-title">RouteLK AI Assistant</h4>
                <div className="chatbot-subtitle">
                  <span className="live-pill">LIVE DB</span>
                  {user ? `Hi, ${user.name.split(' ')[0]}` : 'Passenger Transit Guide'}
                </div>
              </div>
            </div>

            <div className="chatbot-header-actions">
              <button
                type="button"
                className="chatbot-action-btn"
                title="Reset conversation"
                onClick={handleClearChat}
                aria-label="Reset chat"
              >
                {/* Rotate-reset icon */}
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  <path d="M3 3v5h5" />
                </svg>
              </button>
              <button
                type="button"
                className="chatbot-action-btn close-btn"
                title="Close chat"
                onClick={() => setIsOpen(false)}
                aria-label="Close chat"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>

          {/* Messages body */}
          <div className="chatbot-messages-body">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`chat-message-row ${msg.role === 'user' ? 'user-row' : 'assistant-row'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="chat-bubble-avatar">
                    {/* Sparkle / AI indicator icon */}
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                    </svg>
                  </div>
                )}

                <div className={`chat-bubble ${msg.role === 'user' ? 'user-bubble' : 'assistant-bubble'}`}>
                  <div className="chat-bubble-content">
                    {renderFormattedMessage(msg.content)}
                  </div>
                  <div className="chat-bubble-footer">
                    <span className="chat-timestamp">{msg.timestamp}</span>
                    {msg.source && <span className="chat-source-badge">{msg.source}</span>}
                  </div>
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isLoading && (
              <div className="chat-message-row assistant-row">
                <div className="chat-bubble-avatar">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 7v5l3 3" />
                  </svg>
                </div>
                <div className="chat-bubble assistant-bubble typing-bubble">
                  <div className="typing-dots">
                    <span />
                    <span />
                    <span />
                  </div>
                  <span className="typing-label">Querying RouteLK MongoDB & Gemini...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestion chips */}
          <div className="chatbot-suggestions-bar">
            {SUGGESTIONS.map((s, idx) => (
              <button
                key={idx}
                type="button"
                className="chatbot-suggestion-chip"
                onClick={() => handleSendMessage(s)}
                disabled={isLoading}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Input bar */}
          <div className="chatbot-input-bar">
            <input
              ref={inputRef}
              type="text"
              className="chatbot-input"
              placeholder="Ask about buses, fares, wallet..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              aria-label="Message RouteLK AI Assistant"
            />
            <button
              type="button"
              className="chatbot-send-btn"
              onClick={() => handleSendMessage()}
              disabled={!inputMessage.trim() || isLoading}
              aria-label="Send message"
            >
              {/* Paper plane / send icon */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
          <div className="chatbot-footer-caption">
            Grounded on Live MongoDB Bus Fleet · Powered by Gemini AI
          </div>
        </div>
      )}

      {/* ====== Floating Launcher Button ====== */}
      <button
        type="button"
        className={`chatbot-launcher-btn ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={isOpen ? 'Close chat assistant' : 'Open RouteLK AI Assistant'}
        title="RouteLK AI Transit Assistant"
      >
        {isOpen ? (
          /* Close X icon */
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <div className="launcher-icon-wrapper">
            {/* Transit route chat icon — NOT AI generated look; uses a bus + message bubble combo */}
            <svg width="26" height="26" viewBox="0 0 30 30" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              {/* Chat bubble */}
              <path d="M26 3H8a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4l-2 4 6-4h10a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z" />
              {/* Bus dots inside bubble */}
              <circle cx="13" cy="11" r="1.2" fill="currentColor" stroke="none" />
              <circle cx="18" cy="11" r="1.2" fill="currentColor" stroke="none" />
              <circle cx="23" cy="11" r="1.2" fill="currentColor" stroke="none" />
            </svg>
            {hasUnread && <span className="chatbot-unread-badge" />}
            <span className="chatbot-sparkle-dot" />
          </div>
        )}
      </button>
    </div>
  );
};
