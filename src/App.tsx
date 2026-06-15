import { useState, useRef, useEffect } from 'react';
import { Send, Trash2, Languages, Loader2, Rabbit, Turtle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Message, TranslationResponse } from './types.ts';

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      parts: [{ text: input }],
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      });

      const data: TranslationResponse = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      if (data.text) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'model',
            parts: [{ text: data.text! }],
          },
        ]);
      }
    } catch (error) {
      console.error('Translation failed:', error);
      alert('翻譯失敗，請稍後再試。');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    if (confirm('確定要清除所有對話紀錄嗎？')) {
      setMessages([]);
    }
  };

  const speak = (text: string, rate: number = 1.0) => {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = rate;
      window.speechSynthesis.speak(utterance);
    } else {
      alert('您的瀏覽器不支援語音合成功能。');
    }
  };

  const parseTranslation = (text: string) => {
    // Split by single or multiple newlines
    const lines = text.split(/\n+/).filter(l => l.trim() !== '');
    const pairs: { en: string; zh: string }[] = [];
    
    for (let i = 0; i < lines.length; i += 2) {
      pairs.push({
        en: lines[i] || '',
        zh: lines[i+1] || ''
      });
    }
    return pairs;
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 font-sans text-slate-900">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Languages className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">文章翻譯助手</h1>
            <p className="text-xs text-slate-500 font-medium">專業英翻中對照閱讀</p>
          </div>
        </div>
        <button
          onClick={handleClear}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:text-red-600 border border-slate-200 rounded-lg hover:bg-red-50 transition-colors"
          title="清除對話"
        >
          <Trash2 className="w-4 h-4" />
          <span className="hidden sm:inline">清除對話</span>
        </button>
      </header>

      {/* Main Content Area */}
      <main 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-6 max-w-4xl mx-auto w-full scroll-smooth"
      >
        {messages.length === 0 && !isLoading && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-60 mt-20">
            <div className="bg-slate-200 p-6 rounded-full">
              <Languages className="w-12 h-12 text-slate-400" />
            </div>
            <div>
              <p className="text-lg font-medium">尚未開始翻譯</p>
              <p className="text-sm">在下方輸入框貼入英文文章，我將為您提供逐句對照翻譯。</p>
            </div>
          </div>
        )}

        <AnimatePresence>
          {messages.map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              {msg.role === 'user' ? (
                <div className="bg-blue-600 text-white px-4 py-3 rounded-2xl rounded-tr-none max-w-[85%] shadow-sm overflow-wrap-anywhere">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.parts[0].text}</p>
                </div>
              ) : (
                <div className="w-full space-y-4">
                  {parseTranslation(msg.parts[0].text).map((pair, pIdx) => (
                    <div 
                      key={pIdx} 
                      className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-blue-200 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-slate-500 text-xs font-mono uppercase tracking-widest opacity-50">English</p>
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={() => speak(pair.en, 1.0)}
                            className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all flex items-center gap-1"
                            title="正常速度朗讀"
                          >
                            <Rabbit className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-bold">1x</span>
                          </button>
                          <button 
                            onClick={() => speak(pair.en, 0.6)}
                            className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all flex items-center gap-1"
                            title="慢速朗讀"
                          >
                            <Turtle className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-bold">0.6x</span>
                          </button>
                        </div>
                      </div>
                      <p className="text-slate-800 font-medium mb-3 leading-relaxed">{pair.en}</p>
                      <div className="h-px bg-slate-100 my-3" />
                      <p className="text-slate-500 text-xs font-mono mb-2 uppercase tracking-widest opacity-50">繁體中文</p>
                      <p className="text-blue-900 text-lg leading-relaxed font-medium">
                        {pair.zh || <span className="text-slate-300 italic text-sm">正在翻譯中...</span>}
                      </p>
                      <div className="mt-2 flex gap-2">
                        <button className="px-3 py-1 bg-slate-200 text-sm rounded hover:bg-slate-300">正常速度讀出</button>
                        <button className="px-3 py-1 bg-slate-200 text-sm rounded hover:bg-slate-300">較慢速度讀出</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-3 text-blue-600 font-medium"
          >
            <div className="bg-white border border-slate-200 rounded-full p-2 shadow-sm">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
            <span className="text-sm animate-pulse">輸入中...</span>
          </motion.div>
        )}
      </main>

      {/* Input Area */}
      <footer className="bg-white border-t border-slate-200 p-4 sticky bottom-0">
        <div className="max-w-4xl mx-auto relative flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="請輸入欲翻譯的英文內容..."
            className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 min-h-[56px] max-h-48 resize-none transition-all text-sm leading-relaxed"
            rows={1}
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="h-11 w-11 flex items-center justify-center bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:bg-slate-400 transition-all shadow-md active:scale-95"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <p className="text-[10px] text-center text-slate-400 mt-2 font-medium">
          由 Google Gemini 提供高品質翻譯支援
        </p>
      </footer>
    </div>
  );
}
