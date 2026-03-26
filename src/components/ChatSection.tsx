import { useState, useRef, useEffect } from "react";
import Icon from "@/components/ui/icon";

interface Message {
  id: number;
  role: "user" | "ai";
  text: string;
  time: string;
}

const AI_RESPONSES: Record<string, string> = {
  "default": "Понял вас! Я — NOVA, ваш личный ИИ-помощник. Могу помочь с любыми вопросами, задачами или просто поговорить. Что вас интересует?",
  "привет": "Привет! Рад вас видеть! Чем могу помочь сегодня?",
  "как дела": "Всё отлично, спасибо что спросили! Я всегда в отличной форме — работаю на полную мощность и готов помочь вам с любой задачей.",
  "помощь": "Конечно помогу! Я умею отвечать на вопросы, помогать с текстами, давать советы и многое другое. Просто напишите, что нужно.",
  "калькулятор": "Для расчётов рекомендую воспользоваться встроенным калькулятором — переключитесь во вкладку Калькулятор в левом меню!",
  "дневник": "Ваши заметки и мысли можно записать в Дневник — там есть удобный редактор с возможностью создавать записи по датам.",
};

function getAIResponse(text: string): string {
  const lower = text.toLowerCase();
  for (const key of Object.keys(AI_RESPONSES)) {
    if (lower.includes(key)) return AI_RESPONSES[key];
  }
  return AI_RESPONSES.default;
}

function getTime() {
  return new Date().toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" });
}

export default function ChatSection() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: "ai",
      text: "Привет! Я NOVA — ваш личный ИИ-помощник. Готов помочь с любыми вопросами, расчётами или записями. Чем займёмся?",
      time: getTime(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text) return;

    const userMsg: Message = { id: Date.now(), role: "user", text, time: getTime() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      const aiMsg: Message = {
        id: Date.now() + 1,
        role: "ai",
        text: getAIResponse(text),
        time: getTime(),
      };
      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1200 + Math.random() * 800);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-[var(--nova-border)]">
        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#7c6df8] to-[#4f46e5] flex items-center justify-center text-white font-bold text-sm">
            N
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#0b0c14]" />
        </div>
        <div>
          <div className="font-semibold text-[var(--nova-text)] text-sm">NOVA</div>
          <div className="text-xs text-emerald-400">онлайн</div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button className="p-2 rounded-lg glass glass-hover text-[var(--nova-text-muted)] hover:text-[var(--nova-text)] transition-colors">
            <Icon name="RotateCcw" size={15} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.map((msg, i) => (
          <div
            key={msg.id}
            className={`flex gap-3 animate-fade-in ${msg.role === "user" ? "flex-row-reverse" : ""}`}
            style={{ animationDelay: `${i * 0.05}s` }}
          >
            {msg.role === "ai" && (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#7c6df8] to-[#4f46e5] flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-1">
                N
              </div>
            )}
            <div className={`max-w-[75%] ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col gap-1`}>
              <div
                className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-gradient-to-br from-[#7c6df8] to-[#5b50d6] text-white rounded-tr-sm"
                    : "glass text-[var(--nova-text)] rounded-tl-sm"
                }`}
              >
                {msg.text}
              </div>
              <div className="text-[10px] text-[var(--nova-text-muted)] px-1">{msg.time}</div>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex gap-3 animate-fade-in">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#7c6df8] to-[#4f46e5] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              N
            </div>
            <div className="glass px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-1.5">
              <div className="typing-dot" />
              <div className="typing-dot" />
              <div className="typing-dot" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-6 py-4 border-t border-[var(--nova-border)]">
        <div className="flex gap-3 items-end glass rounded-2xl px-4 py-3">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Напишите сообщение..."
            rows={1}
            className="flex-1 bg-transparent text-[var(--nova-text)] placeholder:text-[var(--nova-text-muted)] text-sm resize-none outline-none leading-relaxed max-h-32 overflow-y-auto"
            style={{ scrollbarWidth: "none" }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim()}
            className="w-8 h-8 rounded-xl bg-[var(--nova-indigo)] disabled:opacity-30 flex items-center justify-center text-white transition-all hover:bg-[#6b5ce7] active:scale-95 flex-shrink-0"
          >
            <Icon name="ArrowUp" size={15} />
          </button>
        </div>
        <div className="text-[10px] text-[var(--nova-text-muted)] text-center mt-2">
          Enter — отправить · Shift+Enter — новая строка
        </div>
      </div>
    </div>
  );
}