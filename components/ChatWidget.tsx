import React, { useState, useEffect, useRef } from 'react';
import { Chat, GenerateContentResponse } from "@google/genai";
import { UserPortfolio } from '../types';
import { createFinancialChatSession } from '../services/geminiService';

interface ChatWidgetProps {
  portfolio: UserPortfolio;
  analysisContext: string;
}

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
}

const ChatWidget: React.FC<ChatWidgetProps> = ({ portfolio, analysisContext }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init',
      role: 'model',
      text: "I'm ready to discuss your portfolio analysis. What would you like to know?"
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const session = createFinancialChatSession(portfolio, analysisContext);
      setChatSession(session);
    } catch (err) {
      console.error("Failed to init chat", err);
    }
  }, [portfolio, analysisContext]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!inputValue.trim() || !chatSession || isStreaming) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: inputValue
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsStreaming(true);

    try {
      const result = await chatSession.sendMessageStream({ message: userMsg.text });
      
      const botMsgId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, { id: botMsgId, role: 'model', text: '' }]);

      let fullText = '';
      
      for await (const chunk of result) {
        const c = chunk as GenerateContentResponse;
        const text = c.text; 
        if (text) {
          fullText += text;
          setMessages(prev => 
            prev.map(msg => msg.id === botMsgId ? { ...msg, text: fullText } : msg)
          );
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { 
        id: Date.now().toString(), 
        role: 'model', 
        text: "I apologize, but I encountered an error processing your request." 
      }]);
    } finally {
      setIsStreaming(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Simple Markdown-ish formatter for chat bubbles
  const renderMessageText = (text: string) => {
    return text.split('\n').map((line, i) => {
      if (!line) return <div key={i} className="h-2" />;
      if (line.startsWith('- ') || line.startsWith('* ')) {
        return <div key={i} className="pl-2">• {line.substring(2)}</div>;
      }
      return <div key={i}>{line}</div>;
    });
  };

  return (
    <>
      {/* Launcher Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-2xl transition-all transform hover:scale-105 ${
          isOpen ? 'bg-slate-700 rotate-90' : 'bg-gradient-to-r from-blue-600 to-emerald-600'
        }`}
      >
        {isOpen ? (
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[500px] max-h-[80vh] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="bg-slate-800 p-4 border-b border-slate-700 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <h3 className="font-semibold text-white">Harmonia Assistant</h3>
            </div>
            <span className="text-xs text-slate-400">Gemini 2.5 Flash</span>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-900/95">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700'
                  }`}
                >
                  {renderMessageText(msg.text)}
                </div>
              </div>
            ))}
            {isStreaming && (
              <div className="flex justify-start">
                <div className="bg-slate-800 rounded-2xl rounded-bl-none px-4 py-3 border border-slate-700">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 bg-slate-800 border-t border-slate-700">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Ask follow-up questions..."
                className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                disabled={isStreaming}
              />
              <button
                onClick={handleSend}
                disabled={!inputValue.trim() || isStreaming}
                className={`p-2 rounded-lg ${
                  !inputValue.trim() || isStreaming
                    ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-500'
                } transition-colors`}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatWidget;