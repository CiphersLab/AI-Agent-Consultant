'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { consultantAPI } from '../lib/api';
import { ConversationMessage } from '../lib/types';
import { Button } from '../components/ui/Button';
import { Textarea } from '../components/ui/Textarea';
import { Card } from '../components/ui/Card';
// import { SocialProof } from '../components/SocialProof';
import { Bot, User, ArrowLeft } from 'lucide-react';
import { Logo } from '../components/ui/Logo';

export default function ConversationPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storedSessionId = localStorage.getItem('session_id');
    if (!storedSessionId) {
      router.push('/');
      return;
    }
    setSessionId(storedSessionId);

    // Load conversation history from localStorage
    const storedMessages = localStorage.getItem('conversation_messages');
    if (storedMessages) {
      setMessages(JSON.parse(storedMessages));
    }
  }, [router]);

  useEffect(() => {
    // Scroll to bottom when new message
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Save messages to localStorage
    if (messages.length > 0) {
      localStorage.setItem('conversation_messages', JSON.stringify(messages));
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !sessionId || isLoading) return;

    const userMessage: ConversationMessage = {
      role: 'user',
      content: input,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await consultantAPI.continueConversation(sessionId, input);

      const agentMessage: ConversationMessage = {
        role: 'agent',
        content: response.agent_response,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, agentMessage]);

      // Check if requirements complete
      if (response.requirements_complete) {
        setTimeout(() => {
          router.push('/preview');
        }, 2000);
      }
    } catch (error) {
      console.error('Error:', error);
      const errorMessage: ConversationMessage = {
        role: 'agent',
        content: 'Sorry, something went wrong. Please try again.',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <div className="w-full flex flex-col-reverse md:flex-row justify-between gap-2">
            <div className='flex flex-row'>
              <Button variant="ghost" size="sm" onClick={() => router.push('/')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div className="flex-1">
                <h1 className="text-lg font-semibold text-gray-900">Let's Refine Your Idea</h1>
                <p className="text-sm text-gray-600">Answer a few questions to get started</p>
              </div>

            </div>
            
            <div className='flex justify-center md:justify-normal'>
              <Logo size="lg" />
            </div>
            
          </div>
          
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex gap-4 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                  message.role === 'agent' ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-700'
                }`}
              >
                {message.role === 'agent' ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
              </div>
              <Card
                className={`flex-1 p-4 ${
                  message.role === 'user' ? 'bg-gray-900 text-white border-gray-900' : ''
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
              </Card>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-900 text-white flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </div>
              <Card className="flex-1 p-4">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </Card>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 bg-white sticky bottom-0">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex gap-3">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type your answer..."
              rows={2}
              className="flex-1"
            />
            <Button onClick={handleSend} isLoading={isLoading} disabled={!input.trim()}>
              Send
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2">Press Enter to send, Shift+Enter for new line</p>
        </div>
      </div>
    </div>
  );
}
