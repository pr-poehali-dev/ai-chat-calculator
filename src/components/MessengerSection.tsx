import { useState, useRef, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";

const AUTH_URL = "https://functions.poehali.dev/838463b7-064f-41e8-b0b0-1f697df826b4";
const CHATS_URL = "https://functions.poehali.dev/6164cf90-40a9-45a7-a922-bf718582e34d";
const MSGS_URL = "https://functions.poehali.dev/dec9f594-bfee-4977-8fd8-8ae33ddb27dd";

const SESSION_KEY = "nova_messenger_session";
const USER_KEY = "nova_messenger_user";

// ── типы ──
interface User { id: number; username: string; display_name: string; color: string; }
interface ChatItem {
  id: number; type: string; name: string; color: string; avatar: string;
  last_text?: string; last_time?: string; last_sender_id?: number; other_username?: string;
}
interface Msg {
  id: number; sender_id: number; text: string; time: string;
  sender_name: string; sender_color: string;
}

function api(url: string, params: Record<string, string>, opts: RequestInit = {}, session?: string) {
  const qs = new URLSearchParams(params).toString();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (session) headers["X-Session-Id"] = session;
  return fetch(`${url}?${qs}`, { ...opts, headers }).then((r) => r.json());
}

// ─────────────────────────────────────────────
export default function MessengerSection() {
  const [session, setSession] = useState<string | null>(() => localStorage.getItem(SESSION_KEY));
  const [me, setMe] = useState<User | null>(() => {
    const s = localStorage.getItem(USER_KEY);
    return s ? JSON.parse(s) : null;
  });

  // Auth screens
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authUsername, setAuthUsername] = useState("");
  const [authName, setAuthName] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // Chats
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [chatsLoading, setChatsLoading] = useState(false);
  const [activeChat, setActiveChat] = useState<ChatItem | null>(null);

  // Messages
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [msgsLoading, setMsgsLoading] = useState(false);
  const [input, setInput] = useState("");
  const [lastMsgId, setLastMsgId] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Search
  const [searchQ, setSearchQ] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [modal, setModal] = useState<"new-chat" | "new-group" | null>(null);

  // Group form
  const [groupName, setGroupName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<number[]>([]);

  // ── Auth ──
  const saveSession = (sid: string, user: User) => {
    localStorage.setItem(SESSION_KEY, sid);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    setSession(sid); setMe(user);
  };

  const logout = () => {
    localStorage.removeItem(SESSION_KEY); localStorage.removeItem(USER_KEY);
    setSession(null); setMe(null); setChats([]); setActiveChat(null);
  };

  const doAuth = async () => {
    setAuthError(""); setAuthLoading(true);
    const action = authMode;
    const body = action === "register"
      ? JSON.stringify({ username: authUsername, display_name: authName })
      : JSON.stringify({ username: authUsername });
    const res = await api(AUTH_URL, { action }, { method: "POST", body });
    setAuthLoading(false);
    if (res.error) { setAuthError(res.error); return; }
    saveSession(res.session_id, res.user);
  };

  // ── Load chats ──
  const loadChats = useCallback(async () => {
    if (!session) return;
    setChatsLoading(true);
    const res = await api(CHATS_URL, { action: "list" }, {}, session);
    setChatsLoading(false);
    if (res.chats) setChats(res.chats);
  }, [session]);

  useEffect(() => { if (session) loadChats(); }, [session, loadChats]);

  // ── Open chat ──
  const openChat = async (chat: ChatItem) => {
    setActiveChat(chat); setMsgs([]); setLastMsgId(0); setInput("");
    setMsgsLoading(true);
    const res = await api(MSGS_URL, { action: "history", chat_id: String(chat.id) }, {}, session!);
    setMsgsLoading(false);
    if (res.messages) {
      setMsgs(res.messages);
      const maxId = res.messages.reduce((m: number, msg: Msg) => Math.max(m, msg.id), 0);
      setLastMsgId(maxId);
    }
  };

  // ── Polling ──
  const poll = useCallback(async (chatId: number, afterId: number) => {
    if (!session) return 0;
    const res = await api(MSGS_URL, { action: "poll", chat_id: String(chatId), after_id: String(afterId) }, {}, session);
    if (res.messages && res.messages.length > 0) {
      setMsgs((prev) => [...prev, ...res.messages]);
      const maxId = res.messages.reduce((m: number, msg: Msg) => Math.max(m, msg.id), afterId);
      setLastMsgId(maxId);
      return maxId;
    }
    return afterId;
  }, [session]);

  useEffect(() => {
    if (!activeChat) { if (pollRef.current) clearInterval(pollRef.current); return; }
    let currentId = lastMsgId;
    pollRef.current = setInterval(async () => {
      currentId = await poll(activeChat.id, currentId);
    }, 2000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [activeChat?.id, poll]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  // ── Send message ──
  const sendMsg = async () => {
    const text = input.trim();
    if (!text || !activeChat || !session || !me) return;
    setInput("");
    const optimistic: Msg = {
      id: Date.now(), sender_id: me.id, text,
      time: new Date().toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" }),
      sender_name: me.display_name, sender_color: me.color,
    };
    setMsgs((prev) => [...prev, optimistic]);
    const res = await api(MSGS_URL, { action: "send" }, { method: "POST", body: JSON.stringify({ chat_id: activeChat.id, text }) }, session);
    if (res.message) {
      setMsgs((prev) => prev.map((m) => m.id === optimistic.id ? res.message : m));
      setLastMsgId(res.message.id);
      loadChats();
    }
  };

  // ── Search users ──
  const searchUsers = async (q: string) => {
    setSearchQ(q);
    if (q.length < 2) { setSearchResults([]); return; }
    setSearchLoading(true);
    const res = await api(AUTH_URL, { action: "search", q }, {}, session!);
    setSearchLoading(false);
    if (res.users) setSearchResults(res.users);
  };

  // ── Start direct chat ──
  const startDirectChat = async (userId: number) => {
    if (!session) return;
    const res = await api(CHATS_URL, { action: "direct" }, { method: "POST", body: JSON.stringify({ user_id: userId }) }, session);
    setModal(null); setSearchQ(""); setSearchResults([]);
    await loadChats();
    if (res.chat_id) {
      const updated = await api(CHATS_URL, { action: "list" }, {}, session);
      if (updated.chats) {
        setChats(updated.chats);
        const found = updated.chats.find((c: ChatItem) => c.id === res.chat_id);
        if (found) openChat(found);
      }
    }
  };

  // ── Create group ──
  const createGroup = async () => {
    if (!groupName.trim() || selectedMembers.length < 1 || !session) return;
    const res = await api(CHATS_URL, { action: "group" }, { method: "POST", body: JSON.stringify({ name: groupName, member_ids: selectedMembers }) }, session);
    setModal(null); setGroupName(""); setSelectedMembers([]);
    await loadChats();
    if (res.chat_id) {
      const updated = await api(CHATS_URL, { action: "list" }, {}, session);
      if (updated.chats) {
        setChats(updated.chats);
        const found = updated.chats.find((c: ChatItem) => c.id === res.chat_id);
        if (found) openChat(found);
      }
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMsg(); }
  };

  // ──────────────────────────────────────────
  // ЭКРАН АВТОРИЗАЦИИ
  // ──────────────────────────────────────────
  if (!session || !me) {
    return (
      <div className="flex flex-col h-full items-center justify-center px-6 animate-fade-in">
        <div className="w-full max-w-xs space-y-5">
          <div className="text-center">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#7c6df8] to-[#4f46e5] flex items-center justify-center text-white text-2xl mx-auto mb-3">
              💬
            </div>
            <div className="font-semibold text-[var(--nova-text)] text-lg">Мессенджер</div>
            <div className="text-xs text-[var(--nova-text-muted)] mt-1">Общайтесь с реальными людьми в реальном времени</div>
          </div>

          {/* Tabs */}
          <div className="flex glass rounded-xl p-1">
            {(["login", "register"] as const).map((m) => (
              <button key={m} onClick={() => { setAuthMode(m); setAuthError(""); }}
                className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${authMode === m ? "bg-[var(--nova-indigo)] text-white" : "text-[var(--nova-text-muted)]"}`}>
                {m === "login" ? "Войти" : "Регистрация"}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs text-[var(--nova-text-muted)] mb-1.5 block">Логин <span className="text-[var(--nova-text-muted)]">(латиница, цифры, _)</span></label>
              <input value={authUsername} onChange={(e) => setAuthUsername(e.target.value.toLowerCase())}
                placeholder="например: ivan_petrov"
                className="w-full glass rounded-xl px-3 py-2.5 text-sm text-[var(--nova-text)] outline-none focus:border-[var(--nova-indigo)] border border-transparent transition-colors" />
            </div>
            {authMode === "register" && (
              <div>
                <label className="text-xs text-[var(--nova-text-muted)] mb-1.5 block">Имя (как отображается)</label>
                <input value={authName} onChange={(e) => setAuthName(e.target.value)}
                  placeholder="Иван Петров"
                  className="w-full glass rounded-xl px-3 py-2.5 text-sm text-[var(--nova-text)] outline-none focus:border-[var(--nova-indigo)] border border-transparent transition-colors" />
              </div>
            )}
            {authError && <div className="text-xs text-red-400 glass rounded-xl px-3 py-2">{authError}</div>}
            <button onClick={doAuth} disabled={authLoading || !authUsername.trim() || (authMode === "register" && !authName.trim())}
              className="w-full py-3 rounded-xl bg-[var(--nova-indigo)] text-white font-medium text-sm hover:bg-[#6b5ce7] disabled:opacity-40 transition-colors">
              {authLoading ? "Подождите..." : authMode === "login" ? "Войти" : "Создать аккаунт"}
            </button>
          </div>
          <div className="text-center text-xs text-[var(--nova-text-muted)]">
            Ваш логин — это ваш уникальный адрес для поиска
          </div>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────
  // ОТКРЫТЫЙ ЧАТ
  // ──────────────────────────────────────────
  if (activeChat) {
    return (
      <div className="flex flex-col h-full animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[var(--nova-border)]">
          <button onClick={() => { setActiveChat(null); loadChats(); }}
            className="p-2 rounded-lg glass glass-hover text-[var(--nova-text-muted)] hover:text-[var(--nova-text)] transition-colors">
            <Icon name="ArrowLeft" size={15} />
          </button>
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
            style={{ background: activeChat.color }}>{activeChat.avatar}</div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-[var(--nova-text)] text-sm truncate">{activeChat.name}</div>
            <div className="text-xs text-[var(--nova-text-muted)]">
              {activeChat.type === "group" ? "Группа" : activeChat.other_username ? `@${activeChat.other_username}` : ""}
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {msgsLoading && (
            <div className="flex justify-center py-8">
              <div className="flex gap-1.5"><div className="typing-dot"/><div className="typing-dot"/><div className="typing-dot"/></div>
            </div>
          )}
          {!msgsLoading && msgs.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-[var(--nova-text-muted)]">
              <div className="text-3xl">👋</div>
              <div className="text-sm">Начните переписку!</div>
            </div>
          )}
          {msgs.map((msg) => {
            const isMe = msg.sender_id === me.id;
            return (
              <div key={msg.id} className={`flex gap-2 animate-fade-in ${isMe ? "flex-row-reverse" : ""}`}>
                {!isMe && (
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 mt-auto"
                    style={{ background: msg.sender_color }}>
                    {msg.sender_name[0]?.toUpperCase()}
                  </div>
                )}
                <div className={`max-w-[72%] flex flex-col gap-0.5 ${isMe ? "items-end" : "items-start"}`}>
                  {activeChat.type === "group" && !isMe && (
                    <div className="text-[10px] text-[var(--nova-text-muted)] px-1">{msg.sender_name}</div>
                  )}
                  <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    isMe ? "bg-gradient-to-br from-[#7c6df8] to-[#5b50d6] text-white rounded-tr-sm"
                         : "glass text-[var(--nova-text)] rounded-tl-sm"}`}>
                    {msg.text}
                  </div>
                  <div className="flex items-center gap-1 px-1">
                    <span className="text-[9px] text-[var(--nova-text-muted)]">{msg.time}</span>
                    {isMe && <Icon name="CheckCheck" size={10} className="text-[var(--nova-indigo)]" />}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t border-[var(--nova-border)]">
          <div className="flex gap-2 items-end glass rounded-2xl px-4 py-2.5">
            <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKey}
              placeholder="Сообщение..." rows={1}
              className="flex-1 bg-transparent text-[var(--nova-text)] placeholder:text-[var(--nova-text-muted)] text-sm resize-none outline-none leading-relaxed max-h-28"
              style={{ scrollbarWidth: "none" }} />
            <button onClick={sendMsg} disabled={!input.trim()}
              className="w-8 h-8 rounded-xl bg-[var(--nova-indigo)] disabled:opacity-30 flex items-center justify-center text-white transition-all hover:bg-[#6b5ce7] active:scale-95 flex-shrink-0">
              <Icon name="Send" size={14} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────
  // СПИСОК ЧАТОВ
  // ──────────────────────────────────────────
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-4 border-b border-[var(--nova-border)]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
              style={{ background: me.color }}>{me.display_name[0]?.toUpperCase()}</div>
            <div>
              <div className="text-sm font-medium text-[var(--nova-text)]">{me.display_name}</div>
              <div className="text-[10px] text-[var(--nova-text-muted)]">@{me.username}</div>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setModal("new-chat")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass glass-hover text-[var(--nova-text-muted)] text-xs hover:text-[var(--nova-text)] transition-colors">
              <Icon name="UserPlus" size={13} />Написать
            </button>
            <button onClick={() => setModal("new-group")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--nova-indigo)] text-white text-xs font-medium hover:bg-[#6b5ce7] transition-colors">
              <Icon name="Users" size={13} />Группа
            </button>
          </div>
        </div>
      </div>

      {/* Chat list */}
      <div className="flex-1 overflow-y-auto py-2">
        {chatsLoading && (
          <div className="flex justify-center py-8">
            <div className="flex gap-1.5"><div className="typing-dot"/><div className="typing-dot"/><div className="typing-dot"/></div>
          </div>
        )}
        {!chatsLoading && chats.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-[var(--nova-text-muted)] px-6 text-center">
            <Icon name="MessageSquare" size={40} />
            <div className="text-sm font-medium text-[var(--nova-text)]">Пока нет чатов</div>
            <div className="text-xs">Найдите друга по логину и начните переписку</div>
            <button onClick={() => setModal("new-chat")}
              className="text-xs text-[var(--nova-indigo)] hover:underline">Найти пользователя →</button>
          </div>
        )}
        {chats.map((chat, i) => (
          <button key={chat.id} onClick={() => openChat(chat)}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/3 transition-colors animate-fade-in"
            style={{ animationDelay: `${i * 0.04}s` }}>
            <div className="relative flex-shrink-0">
              <div className="w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-bold"
                style={{ background: chat.color }}>{chat.avatar}</div>
              {chat.type === "group" && (
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#1a1b2e] border border-[var(--nova-border)] flex items-center justify-center">
                  <Icon name="Users" size={9} className="text-[var(--nova-text-muted)]" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <span className="font-medium text-[var(--nova-text)] text-sm truncate">{chat.name}</span>
                <span className="text-[10px] text-[var(--nova-text-muted)] flex-shrink-0 ml-2">{chat.last_time || ""}</span>
              </div>
              <div className="text-xs text-[var(--nova-text-muted)] truncate">
                {chat.last_text
                  ? (chat.last_sender_id === me.id ? "Вы: " : "") + chat.last_text
                  : "Нет сообщений"}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Logout */}
      <div className="px-4 pb-3 pt-2 border-t border-[var(--nova-border)]">
        <button onClick={logout} className="w-full flex items-center justify-center gap-2 py-2 rounded-xl glass glass-hover text-[var(--nova-text-muted)] text-xs hover:text-red-400 transition-colors">
          <Icon name="LogOut" size={13} />Выйти из аккаунта
        </button>
      </div>

      {/* ── MODAL: NEW CHAT ── */}
      {modal === "new-chat" && (
        <div className="absolute inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm px-4 pb-4 sm:pb-0">
          <div className="glass rounded-2xl p-5 w-full max-w-sm animate-scale-in space-y-4">
            <div className="flex items-center justify-between">
              <div className="font-semibold text-[var(--nova-text)]">Найти пользователя</div>
              <button onClick={() => { setModal(null); setSearchQ(""); setSearchResults([]); }}
                className="text-[var(--nova-text-muted)] hover:text-[var(--nova-text)]"><Icon name="X" size={16} /></button>
            </div>
            <div className="flex items-center gap-2 glass rounded-xl px-3 py-2">
              <Icon name="Search" size={14} className="text-[var(--nova-text-muted)]" />
              <input value={searchQ} onChange={(e) => searchUsers(e.target.value)}
                placeholder="Поиск по логину или имени..."
                className="flex-1 bg-transparent text-sm text-[var(--nova-text)] placeholder:text-[var(--nova-text-muted)] outline-none" />
            </div>
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {searchLoading && <div className="text-center text-xs text-[var(--nova-text-muted)] py-3">Поиск...</div>}
              {!searchLoading && searchQ.length >= 2 && searchResults.length === 0 && (
                <div className="text-center text-xs text-[var(--nova-text-muted)] py-3">Пользователи не найдены</div>
              )}
              {searchResults.map((u) => (
                <button key={u.id} onClick={() => startDirectChat(u.id)}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl glass glass-hover transition-all">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                    style={{ background: u.color }}>{u.display_name[0]?.toUpperCase()}</div>
                  <div className="flex-1 text-left">
                    <div className="text-sm font-medium text-[var(--nova-text)]">{u.display_name}</div>
                    <div className="text-xs text-[var(--nova-text-muted)]">@{u.username}</div>
                  </div>
                  <Icon name="MessageCircle" size={14} className="text-[var(--nova-indigo)]" />
                </button>
              ))}
            </div>
            {searchQ.length < 2 && (
              <div className="text-xs text-[var(--nova-text-muted)] text-center">
                Введите минимум 2 символа для поиска.<br/>
                Ваш логин: <span className="text-[var(--nova-indigo)]">@{me.username}</span> — поделитесь им с друзьями!
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MODAL: NEW GROUP ── */}
      {modal === "new-group" && (
        <div className="absolute inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm px-4 pb-4 sm:pb-0">
          <div className="glass rounded-2xl p-5 w-full max-w-sm animate-scale-in space-y-4">
            <div className="flex items-center justify-between">
              <div className="font-semibold text-[var(--nova-text)]">Создать группу</div>
              <button onClick={() => { setModal(null); setGroupName(""); setSelectedMembers([]); setSearchQ(""); setSearchResults([]); }}
                className="text-[var(--nova-text-muted)] hover:text-[var(--nova-text)]"><Icon name="X" size={16} /></button>
            </div>
            <input value={groupName} onChange={(e) => setGroupName(e.target.value)}
              placeholder="Название группы..."
              className="w-full glass rounded-xl px-3 py-2.5 text-sm text-[var(--nova-text)] outline-none focus:border-[var(--nova-indigo)] border border-transparent transition-colors" />
            <div className="flex items-center gap-2 glass rounded-xl px-3 py-2">
              <Icon name="Search" size={14} className="text-[var(--nova-text-muted)]" />
              <input value={searchQ} onChange={(e) => searchUsers(e.target.value)}
                placeholder="Добавить участника..."
                className="flex-1 bg-transparent text-sm text-[var(--nova-text)] placeholder:text-[var(--nova-text-muted)] outline-none" />
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {searchResults.map((u) => {
                const sel = selectedMembers.includes(u.id);
                return (
                  <button key={u.id} onClick={() => setSelectedMembers((prev) => sel ? prev.filter((id) => id !== u.id) : [...prev, u.id])}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all ${sel ? "bg-[var(--nova-indigo-dim)] border border-[var(--nova-indigo)]/30" : "glass glass-hover"}`}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                      style={{ background: u.color }}>{u.display_name[0]?.toUpperCase()}</div>
                    <div className="flex-1 text-left">
                      <div className="text-sm font-medium text-[var(--nova-text)]">{u.display_name}</div>
                      <div className="text-xs text-[var(--nova-text-muted)]">@{u.username}</div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${sel ? "bg-[var(--nova-indigo)] border-[var(--nova-indigo)]" : "border-[var(--nova-text-muted)]"}`}>
                      {sel && <Icon name="Check" size={10} className="text-white" />}
                    </div>
                  </button>
                );
              })}
            </div>
            {selectedMembers.length > 0 && (
              <div className="text-xs text-[var(--nova-text-muted)]">Выбрано: {selectedMembers.length} участников</div>
            )}
            <div className="flex gap-2">
              <button onClick={() => { setModal(null); setGroupName(""); setSelectedMembers([]); }} className="flex-1 py-2.5 rounded-xl glass text-[var(--nova-text-muted)] text-sm">Отмена</button>
              <button onClick={createGroup} disabled={!groupName.trim() || selectedMembers.length < 1}
                className="flex-1 py-2.5 rounded-xl bg-[var(--nova-indigo)] text-white text-sm font-medium hover:bg-[#6b5ce7] disabled:opacity-40 transition-colors">
                Создать
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
