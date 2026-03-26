import { useState, useRef, useEffect } from "react";
import Icon from "@/components/ui/icon";

interface Message {
  id: number;
  senderId: string;
  text: string;
  time: string;
  read: boolean;
}

interface Chat {
  id: string;
  type: "direct" | "group";
  name: string;
  avatar: string;
  color: string;
  members: string[];
  messages: Message[];
  online?: boolean;
}

const ME = "me";

function getTime() {
  return new Date().toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" });
}

function lastMsgTime(msgs: Message[]) {
  if (!msgs.length) return "";
  return msgs[msgs.length - 1].time;
}

function unread(msgs: Message[]) {
  return msgs.filter((m) => m.senderId !== ME && !m.read).length;
}

const AVATAR_COLORS = [
  "#7c6df8", "#4f9cf9", "#34d399", "#f59e0b",
  "#f87171", "#a78bfa", "#fb923c", "#38bdf8",
];

const INITIAL_CHATS: Chat[] = [
  {
    id: "1", type: "direct", name: "Алексей Смирнов",
    avatar: "А", color: "#7c6df8", members: ["me", "alexey"], online: true,
    messages: [
      { id: 1, senderId: "alexey", text: "Привет! Как дела?", time: "10:15", read: true },
      { id: 2, senderId: ME, text: "Отлично! Занимаюсь проектом", time: "10:17", read: true },
      { id: 3, senderId: "alexey", text: "Круто! Увидимся завтра?", time: "10:20", read: false },
    ],
  },
  {
    id: "2", type: "direct", name: "Маша Иванова",
    avatar: "М", color: "#f59e0b", members: ["me", "masha"], online: false,
    messages: [
      { id: 1, senderId: "masha", text: "Ты видел новое расписание?", time: "09:00", read: true },
      { id: 2, senderId: ME, text: "Да, в четверг математика первой парой 😅", time: "09:05", read: true },
      { id: 3, senderId: "masha", text: "Ужас... ладно, увидимся!", time: "09:06", read: false },
    ],
  },
  {
    id: "3", type: "group", name: "Класс 9А",
    avatar: "9А", color: "#34d399", members: ["me", "alexey", "masha", "dima", "katya"],
    messages: [
      { id: 1, senderId: "dima", text: "Ребята, домашку по физике кто-нибудь сделал?", time: "вчера", read: true },
      { id: 2, senderId: "katya", text: "Я сделала, могу скинуть задачи", time: "вчера", read: true },
      { id: 3, senderId: "alexey", text: "Скинь пожалуйста!", time: "08:30", read: false },
      { id: 4, senderId: "masha", text: "Катя спасительница 🙏", time: "08:31", read: false },
    ],
  },
  {
    id: "4", type: "group", name: "Команда проекта",
    avatar: "ТП", color: "#a78bfa", members: ["me", "alexey", "dima"],
    messages: [
      { id: 1, senderId: ME, text: "Встреча в субботу в 14:00, все могут?", time: "вчера", read: true },
      { id: 2, senderId: "dima", text: "Да, буду!", time: "вчера", read: true },
      { id: 3, senderId: "alexey", text: "Тоже приду 👍", time: "вчера", read: true },
    ],
  },
];

const KNOWN_USERS = [
  { id: "alexey", name: "Алексей Смирнов", avatar: "А", color: "#7c6df8", online: true },
  { id: "masha", name: "Маша Иванова", avatar: "М", color: "#f59e0b", online: false },
  { id: "dima", name: "Дима Козлов", avatar: "Д", color: "#4f9cf9", online: true },
  { id: "katya", name: "Катя Новикова", avatar: "К", color: "#f87171", online: false },
  { id: "sasha", name: "Саша Петров", avatar: "С", color: "#34d399", online: true },
  { id: "lena", name: "Лена Морозова", avatar: "Л", color: "#fb923c", online: false },
];

function getMemberName(id: string) {
  if (id === ME) return "Вы";
  return KNOWN_USERS.find((u) => u.id === id)?.name.split(" ")[0] || id;
}

type Modal = "new-chat" | "new-group" | null;

export default function MessengerSection() {
  const [chats, setChats] = useState<Chat[]>(INITIAL_CHATS);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [input, setInput] = useState("");
  const [modal, setModal] = useState<Modal>(null);
  const [search, setSearch] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  // New group form
  const [groupName, setGroupName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeChat?.messages]);

  const sendMessage = () => {
    const text = input.trim();
    if (!text || !activeChat) return;
    const msg: Message = { id: Date.now(), senderId: ME, text, time: getTime(), read: true };
    const updated = chats.map((c) =>
      c.id === activeChat.id ? { ...c, messages: [...c.messages, msg] } : c
    );
    setChats(updated);
    setActiveChat((prev) => prev ? { ...prev, messages: [...prev.messages, msg] } : prev);
    setInput("");

    // Simulate reply in group/direct
    if (activeChat.type === "direct" || activeChat.type === "group") {
      const replyDelay = 1500 + Math.random() * 1500;
      const replies = [
        "Понял, спасибо!", "Хорошо!", "Окей 👍", "Отлично!", "Ясно",
        "Договорились!", "Ок, увидимся", "Спасибо за инфо!", "Принято!",
      ];
      const responderId = activeChat.members.find((m) => m !== ME) || "alexey";
      setTimeout(() => {
        const reply: Message = {
          id: Date.now() + 1,
          senderId: responderId,
          text: replies[Math.floor(Math.random() * replies.length)],
          time: getTime(),
          read: false,
        };
        setChats((prev) =>
          prev.map((c) =>
            c.id === activeChat.id ? { ...c, messages: [...c.messages, reply] } : c
          )
        );
        setActiveChat((prev) =>
          prev ? { ...prev, messages: [...prev.messages, reply] } : prev
        );
      }, replyDelay);
    }
  };

  const openChat = (chat: Chat) => {
    // Mark as read
    const updated = chats.map((c) =>
      c.id === chat.id
        ? { ...c, messages: c.messages.map((m) => ({ ...m, read: true })) }
        : c
    );
    setChats(updated);
    setActiveChat({ ...chat, messages: chat.messages.map((m) => ({ ...m, read: true })) });
  };

  const createDirectChat = (userId: string) => {
    const user = KNOWN_USERS.find((u) => u.id === userId);
    if (!user) return;
    const exists = chats.find((c) => c.type === "direct" && c.members.includes(userId));
    if (exists) { openChat(exists); setModal(null); return; }
    const newChat: Chat = {
      id: Date.now().toString(), type: "direct",
      name: user.name, avatar: user.avatar, color: user.color,
      members: [ME, userId], online: user.online, messages: [],
    };
    setChats((prev) => [newChat, ...prev]);
    openChat(newChat);
    setModal(null);
  };

  const createGroup = () => {
    if (!groupName.trim() || selectedMembers.length < 1) return;
    const colorIdx = Math.floor(Math.random() * AVATAR_COLORS.length);
    const initials = groupName.trim().split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
    const newGroup: Chat = {
      id: Date.now().toString(), type: "group",
      name: groupName.trim(), avatar: initials,
      color: AVATAR_COLORS[colorIdx],
      members: [ME, ...selectedMembers],
      messages: [{
        id: 1, senderId: ME,
        text: `Группа "${groupName.trim()}" создана! 🎉`,
        time: getTime(), read: true,
      }],
    };
    setChats((prev) => [newGroup, ...prev]);
    openChat(newGroup);
    setGroupName(""); setSelectedMembers([]);
    setModal(null);
  };

  const toggleMember = (id: string) => {
    setSelectedMembers((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const filtered = chats.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  // ── CHAT VIEW ──
  if (activeChat) {
    const chat = chats.find((c) => c.id === activeChat.id) || activeChat;
    return (
      <div className="flex flex-col h-full animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[var(--nova-border)]">
          <button
            onClick={() => setActiveChat(null)}
            className="p-2 rounded-lg glass glass-hover text-[var(--nova-text-muted)] hover:text-[var(--nova-text)] transition-colors"
          >
            <Icon name="ArrowLeft" size={15} />
          </button>
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
            style={{ background: chat.color }}
          >
            {chat.avatar}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-[var(--nova-text)] text-sm truncate">{chat.name}</div>
            <div className="text-xs text-[var(--nova-text-muted)]">
              {chat.type === "group"
                ? `${chat.members.length} участников`
                : chat.online ? <span className="text-emerald-400">онлайн</span> : "не в сети"}
            </div>
          </div>
          {chat.type === "group" && (
            <button className="p-2 rounded-lg glass glass-hover text-[var(--nova-text-muted)] hover:text-[var(--nova-text)] transition-colors">
              <Icon name="Users" size={15} />
            </button>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {chat.messages.map((msg, i) => {
            const isMe = msg.senderId === ME;
            const sender = KNOWN_USERS.find((u) => u.id === msg.senderId);
            const showName = chat.type === "group" && !isMe &&
              (i === 0 || chat.messages[i - 1].senderId !== msg.senderId);
            return (
              <div key={msg.id} className={`flex gap-2 animate-fade-in ${isMe ? "flex-row-reverse" : ""}`}>
                {!isMe && (
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 mt-auto"
                    style={{ background: sender?.color || "#7c6df8" }}
                  >
                    {sender?.avatar || msg.senderId[0].toUpperCase()}
                  </div>
                )}
                <div className={`max-w-[72%] flex flex-col ${isMe ? "items-end" : "items-start"} gap-0.5`}>
                  {showName && (
                    <div className="text-[10px] text-[var(--nova-text-muted)] px-1 mb-0.5">
                      {getMemberName(msg.senderId)}
                    </div>
                  )}
                  <div
                    className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      isMe
                        ? "bg-gradient-to-br from-[#7c6df8] to-[#5b50d6] text-white rounded-tr-sm"
                        : "glass text-[var(--nova-text)] rounded-tl-sm"
                    }`}
                  >
                    {msg.text}
                  </div>
                  <div className="flex items-center gap-1 px-1">
                    <span className="text-[9px] text-[var(--nova-text-muted)]">{msg.time}</span>
                    {isMe && (
                      <Icon
                        name={msg.read ? "CheckCheck" : "Check"}
                        size={10}
                        className={msg.read ? "text-[var(--nova-indigo)]" : "text-[var(--nova-text-muted)]"}
                      />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {chat.messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-[var(--nova-text-muted)]">
              <div className="text-3xl">👋</div>
              <div className="text-sm">Начните переписку!</div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t border-[var(--nova-border)]">
          <div className="flex gap-2 items-end glass rounded-2xl px-4 py-2.5">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Сообщение..."
              rows={1}
              className="flex-1 bg-transparent text-[var(--nova-text)] placeholder:text-[var(--nova-text-muted)] text-sm resize-none outline-none leading-relaxed max-h-28"
              style={{ scrollbarWidth: "none" }}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim()}
              className="w-8 h-8 rounded-xl bg-[var(--nova-indigo)] disabled:opacity-30 flex items-center justify-center text-white transition-all hover:bg-[#6b5ce7] active:scale-95 flex-shrink-0"
            >
              <Icon name="Send" size={14} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── CHAT LIST ──
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-4 border-b border-[var(--nova-border)]">
        <div className="flex items-center justify-between mb-3">
          <div className="font-semibold text-[var(--nova-text)] text-sm">Сообщения</div>
          <div className="flex gap-2">
            <button
              onClick={() => setModal("new-chat")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass glass-hover text-[var(--nova-text-muted)] text-xs font-medium hover:text-[var(--nova-text)] transition-colors"
              title="Новый чат"
            >
              <Icon name="UserPlus" size={13} />
              Друг
            </button>
            <button
              onClick={() => setModal("new-group")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--nova-indigo)] text-white text-xs font-medium hover:bg-[#6b5ce7] transition-colors"
              title="Создать группу"
            >
              <Icon name="Users" size={13} />
              Группа
            </button>
          </div>
        </div>
        {/* Search */}
        <div className="flex items-center gap-2 glass rounded-xl px-3 py-2">
          <Icon name="Search" size={14} className="text-[var(--nova-text-muted)] flex-shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск..."
            className="flex-1 bg-transparent text-sm text-[var(--nova-text)] placeholder:text-[var(--nova-text-muted)] outline-none"
          />
        </div>
      </div>

      {/* Chat list */}
      <div className="flex-1 overflow-y-auto py-2">
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-[var(--nova-text-muted)]">
            <Icon name="MessageSquare" size={36} />
            <div className="text-sm">Нет чатов</div>
            <button onClick={() => setModal("new-chat")} className="text-xs text-[var(--nova-indigo)] hover:underline">
              Написать другу
            </button>
          </div>
        )}
        {filtered.map((chat, i) => {
          const last = chat.messages[chat.messages.length - 1];
          const u = unread(chat.messages);
          return (
            <button
              key={chat.id}
              onClick={() => openChat(chat)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/3 transition-colors animate-fade-in"
              style={{ animationDelay: `${i * 0.04}s` }}
            >
              <div className="relative flex-shrink-0">
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-bold"
                  style={{ background: chat.color }}
                >
                  {chat.avatar}
                </div>
                {chat.type === "direct" && chat.online && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#0b0c14]" />
                )}
                {chat.type === "group" && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#1a1b2e] border border-[var(--nova-border)] flex items-center justify-center">
                    <Icon name="Users" size={9} className="text-[var(--nova-text-muted)]" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="font-medium text-[var(--nova-text)] text-sm truncate">{chat.name}</span>
                  <span className="text-[10px] text-[var(--nova-text-muted)] flex-shrink-0 ml-2">{lastMsgTime(chat.messages)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--nova-text-muted)] truncate">
                    {last
                      ? `${last.senderId === ME ? "Вы: " : chat.type === "group" ? getMemberName(last.senderId) + ": " : ""}${last.text}`
                      : "Нет сообщений"}
                  </span>
                  {u > 0 && (
                    <span className="ml-2 flex-shrink-0 w-5 h-5 rounded-full bg-[var(--nova-indigo)] text-white text-[10px] font-bold flex items-center justify-center">
                      {u > 9 ? "9+" : u}
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* ── MODAL: NEW CHAT ── */}
      {modal === "new-chat" && (
        <div className="absolute inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm px-4 pb-4 sm:pb-0">
          <div className="glass rounded-2xl p-5 w-full max-w-sm animate-scale-in">
            <div className="flex items-center justify-between mb-4">
              <div className="font-semibold text-[var(--nova-text)]">Новый чат</div>
              <button onClick={() => setModal(null)} className="text-[var(--nova-text-muted)] hover:text-[var(--nova-text)]">
                <Icon name="X" size={16} />
              </button>
            </div>
            <div className="space-y-2">
              {KNOWN_USERS.map((user) => (
                <button
                  key={user.id}
                  onClick={() => createDirectChat(user.id)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl glass glass-hover transition-all"
                >
                  <div className="relative flex-shrink-0">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ background: user.color }}>
                      {user.avatar}
                    </div>
                    {user.online && <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#0b0c14]" />}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-sm font-medium text-[var(--nova-text)]">{user.name}</div>
                    <div className="text-xs text-[var(--nova-text-muted)]">{user.online ? "онлайн" : "не в сети"}</div>
                  </div>
                  <Icon name="ChevronRight" size={14} className="text-[var(--nova-text-muted)]" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: NEW GROUP ── */}
      {modal === "new-group" && (
        <div className="absolute inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm px-4 pb-4 sm:pb-0">
          <div className="glass rounded-2xl p-5 w-full max-w-sm animate-scale-in space-y-4">
            <div className="flex items-center justify-between">
              <div className="font-semibold text-[var(--nova-text)]">Создать группу</div>
              <button onClick={() => { setModal(null); setGroupName(""); setSelectedMembers([]); }} className="text-[var(--nova-text-muted)] hover:text-[var(--nova-text)]">
                <Icon name="X" size={16} />
              </button>
            </div>
            <input
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Название группы..."
              className="w-full bg-white/5 border border-[var(--nova-border)] rounded-xl px-3 py-2.5 text-sm text-[var(--nova-text)] outline-none focus:border-[var(--nova-indigo)] transition-colors"
            />
            <div>
              <div className="text-xs text-[var(--nova-text-muted)] mb-2">Участники ({selectedMembers.length} выбрано)</div>
              <div className="space-y-2 max-h-52 overflow-y-auto">
                {KNOWN_USERS.map((user) => {
                  const selected = selectedMembers.includes(user.id);
                  return (
                    <button
                      key={user.id}
                      onClick={() => toggleMember(user.id)}
                      className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all ${
                        selected ? "bg-[var(--nova-indigo-dim)] border border-[var(--nova-indigo)]/30" : "glass glass-hover"
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: user.color }}>
                        {user.avatar}
                      </div>
                      <div className="flex-1 text-left">
                        <div className="text-sm font-medium text-[var(--nova-text)]">{user.name}</div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                        selected ? "bg-[var(--nova-indigo)] border-[var(--nova-indigo)]" : "border-[var(--nova-text-muted)]"
                      }`}>
                        {selected && <Icon name="Check" size={10} className="text-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setModal(null); setGroupName(""); setSelectedMembers([]); }} className="flex-1 py-2.5 rounded-xl glass text-[var(--nova-text-muted)] text-sm">
                Отмена
              </button>
              <button
                onClick={createGroup}
                disabled={!groupName.trim() || selectedMembers.length < 1}
                className="flex-1 py-2.5 rounded-xl bg-[var(--nova-indigo)] text-white text-sm font-medium hover:bg-[#6b5ce7] disabled:opacity-40 transition-colors"
              >
                Создать
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
