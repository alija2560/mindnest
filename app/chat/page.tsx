"use client";

import { NavaLogo } from "@/app/components/NavaLogo";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { dictionary, Lang } from "@/lib/dictionary";

interface Message {
  role: "user" | "assistant";
  content: string;
  attachmentName?: string;
  audioUrl?: string;
}

interface ConversationItem {
  id: string;
  title: string;
  updatedAt: string;
}

const TypingIndicator = ({ isDark }: { isDark: boolean }) => {
  return (
    <div className={`flex items-center gap-2 p-4 rounded-2xl ${isDark ? "bg-slate-800" : "bg-slate-100"} self-start`}>
      <div className={`w-2 h-2 ${isDark ? "bg-slate-500" : "bg-slate-400"} rounded-full animate-bounce [animation-delay:-0.3s]`}></div>
      <div className={`w-2 h-2 ${isDark ? "bg-slate-500" : "bg-slate-400"} rounded-full animate-bounce [animation-delay:-0.15s]`}></div>
      <div className={`w-2 h-2 ${isDark ? "bg-slate-500" : "bg-slate-400"} rounded-full animate-bounce`}></div>
      <span className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>در حال نوشتن...</span>
    </div>
  );
};

const AudioWaveform = () => {
  return (
    <div className="flex items-center gap-1.5 h-6 px-2">
      <span className="text-xs font-medium text-red-500 ml-2">در حال ضبط صدا...</span>
      <div className="w-1 bg-red-500 rounded-full animate-[bounce_1s_infinite_-0.4s] h-3"></div>
      <div className="w-1 bg-red-500 rounded-full animate-[bounce_1s_infinite_-0.2s] h-6"></div>
      <div className="w-1 bg-red-500 rounded-full animate-[bounce_1s_infinite_-0.6s] h-4"></div>
      <div className="w-1 bg-red-500 rounded-full animate-[bounce_1s_infinite_-0.1s] h-5"></div>
      <div className="w-1 bg-red-500 rounded-full animate-[bounce_1s_infinite_-0.5s] h-3"></div>
    </div>
  );
};

const formatGregorianDate = (dateString: string) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const formatJalaliDate = (dateString: string, lang: Lang) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";
  try {
    return new Intl.DateTimeFormat(lang === 'fa' ? 'fa-IR' : 'en-US', {
      ...(lang === 'fa' ? { calendar: 'persian' } : {}),
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch (e) {
    return "";
  }
};

export default function ChatPage() {
  const router = useRouter();

  const [lang, setLang] = useState<Lang>("fa");

  useEffect(() => {
    const savedLang = localStorage.getItem("nava_lang") as Lang;
    if (savedLang === "fa" || savedLang === "en") {
      setLang(savedLang);
    }
  }, []);

  const t = (key: keyof typeof dictionary.fa) => {
    return dictionary[lang]?.[key] || dictionary["fa"][key] || key;
  };

  const INITIAL_GREETING: Message = {
    role: "assistant",
    content: lang === 'fa'
      ? "سلام دوست عزیزم. من «نوا» هستم؛ همراه و گوش شنوای تو. امروز حالت چطوره؟ هر چیزی که ذهنت رو درگیر کرده می‌تونی راحت با من در میان بذاری."
      : "Hello my dear friend. I am Nava; your companion and listener. How are you today? You can comfortably share anything on your mind with me."
  };

  const [showWarningBanner, setShowWarningBanner] = useState(false);
  const [warningText, setWarningText] = useState("");
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("سهمیه پیام‌های رایگان شما به اتمام رسیده است.");
  
  const [remainingFreeMessages, setRemainingFreeMessages] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([INITIAL_GREETING]);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (window.innerWidth >= 768) {
      setIsSidebarOpen(true);
    }
  }, []);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFilePreviewUrl, setSelectedFilePreviewUrl] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitleText, setEditTitleText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  const [isReportMenuOpen, setIsReportMenuOpen] = useState(false);
  const reportMenuRef = useRef<HTMLDivElement>(null);

  const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false);
  const headerMenuRef = useRef<HTMLDivElement>(null);

  const [showScrollTopBtn, setShowScrollTopBtn] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem("nava_theme") as "dark" | "light" | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (reportMenuRef.current && !reportMenuRef.current.contains(event.target as Node)) {
        setIsReportMenuOpen(false);
      }
      if (headerMenuRef.current && !headerMenuRef.current.contains(event.target as Node)) {
        setIsHeaderMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("nava_theme", nextTheme);
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToTop = () => {
    chatContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleScroll = () => {
    if (chatContainerRef.current) {
      const { scrollTop } = chatContainerRef.current;
      setShowScrollTopBtn(scrollTop > 250);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, isTranscribing]);

  const fetchConversationsList = async () => {
    try {
      const res = await fetch("/api/ai/conversations", {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.conversations)) {
          setConversations(data.conversations);
        } else if (Array.isArray(data)) {
          setConversations(data);
        }
      }
    } catch (err) {
      console.error("Failed to fetch conversations list", err);
    }
  };

  useEffect(() => {
    fetchConversationsList();
  }, []);

  const handleExportPdf = () => {
    setIsReportMenuOpen(false);
    setIsHeaderMenuOpen(false);
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("لطفاً اجازه باز شدن پنجره پاپ‌آپ را به مرورگر بدهید.");
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="${lang}" dir="${lang === 'fa' ? 'rtl' : 'ltr'}">
      <head>
        <meta charset="UTF-8">
        <title>گزارش گفتگو - دستیار نوا</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;500;700&display=swap');
          body {
            font-family: 'Vazirmatn', Tahoma, sans-serif;
            background-color: #f8fafc;
            color: #1e293b;
            margin: 0;
            padding: 40px;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #0d9488;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .header h1 {
            color: #0d9488;
            margin: 0 0 5px 0;
            font-size: 24px;
          }
          .header p {
            color: #64748b;
            margin: 0;
            font-size: 13px;
          }
          .chat-container {
            max-width: 750px;
            margin: 0 auto;
          }
          .message {
            margin-bottom: 20px;
            padding: 15px 20px;
            border-radius: 12px;
            line-height: 1.8;
            font-size: 14px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
          }
          .message.user {
            background-color: #ccfbf1;
            border-right: 4px solid #0d9488;
            margin-left: 50px;
          }
          .message.assistant {
            background-color: #ffffff;
            border-right: 4px solid #64748b;
            border: 1px solid #e2e8f0;
            margin-right: 50px;
          }
          .sender-name {
            font-weight: 700;
            font-size: 12px;
            margin-bottom: 6px;
            color: #0f766e;
          }
          .message.assistant .sender-name {
            color: #475569;
          }
          .content {
            white-space: pre-wrap;
          }
          @media print {
            body { background-color: #fff; padding: 10px; }
            .message { break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="chat-container">
          <div class="header">
            <h1>گزارش گفتگو با دستیار هوشمند نوا</h1>
            <p>تاریخ استخراج: ${new Date().toLocaleDateString(lang === 'fa' ? 'fa-IR' : 'en-US')}</p>
          </div>
          ${messages.map(m => `
            <div class="message ${m.role}">
              <div class="sender-name">${m.role === 'user' ? 'شما' : 'نوا'}</div>
              <div class="content">${m.content}</div>
            </div>
          `).join('')}
        </div>
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const handleExportTxt = () => {
    setIsReportMenuOpen(false);
    setIsHeaderMenuOpen(false);
    const textContent = messages
      .map((m) => `${m.role === "user" ? "شما" : "نوا"}:\n${m.content}\n\n-----------------------------------\n`)
      .join("");
    
    const blob = new Blob([textContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `nava-chat-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportDocx = () => {
    setIsReportMenuOpen(false);
    setIsHeaderMenuOpen(false);
    const htmlContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <title>Chat Export</title>
        <style>
          body { font-family: 'Tahoma', sans-serif; direction: ${lang === 'fa' ? 'rtl' : 'ltr'}; }
          .message-box { margin-bottom: 15px; padding: 12px; border-radius: 8px; border: 1px solid #cbd5e1; page-break-inside: avoid; }
          .user-box { background-color: #e0f2f1; }
          .assistant-box { background-color: #f8fafc; }
          .sender-title { font-weight: bold; margin-bottom: 5px; }
          .user-title { color: #0f766e; }
          .assistant-title { color: #334155; }
          .content { white-space: pre-wrap; margin-top: 5px; color: #1e293b; line-height: 1.6; }
        </style>
      </head>
      <body>
        <h2 style="color: #0d9488; text-align: center; margin-bottom: 25px;">خروجی گفتگو با دستیار نوا</h2>
        ${messages.map(m => {
          const isUser = m.role === 'user';
          return `
            <div class="message-box ${isUser ? 'user-box' : 'assistant-box'}">
              <div class="sender-title ${isUser ? 'user-title' : 'assistant-title'}">
                ${isUser ? 'شما:' : 'نوا:'}
              </div>
              <div class="content">${m.content}</div>
            </div>
          `;
        }).join('')}
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff' + htmlContent], { type: "application/msword;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `nava-chat-${Date.now()}.doc`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleSelectConversation = async (id: string) => {
    if (isLoading || isTranscribing || editingId === id) return;
    setIsLoading(true);

    try {
      const res = await fetch(`/api/ai/load-chat?conversationId=${id}`, {
        credentials: "include",
      });
      
      if (res.ok) {
        const data = await res.json();
        setConversationId(data.conversationId);
        
        if (data.messages && data.messages.length > 0) {
          const loadedMessages = data.messages.map((m: any) => ({
            role: m.sender === "user" ? ("user" as const) : ("assistant" as const),
            content: m.content,
          }));
          setMessages(loadedMessages);
        } else {
          setMessages([INITIAL_GREETING]);
        }
      }
    } catch (err) {
      console.error("Error loading specific conversation:", err);
    } finally {
      setIsLoading(false);
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      }
    }
  };  

  const clearSelectedFile = () => {
    if (selectedFilePreviewUrl) {
      URL.revokeObjectURL(selectedFilePreviewUrl);
    }
    setSelectedFile(null);
    setSelectedFilePreviewUrl(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      if (file.type.startsWith('image/')) {
        setSelectedFilePreviewUrl(URL.createObjectURL(file));
      } else {
        setSelectedFilePreviewUrl(null);
      }
    }
  };

  const handleNewChat = () => {
    if (isLoading || isTranscribing) return;
    setConversationId(null);
    setMessages([INITIAL_GREETING]);
    clearSelectedFile();
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  const startEditing = (e: React.MouseEvent, conv: ConversationItem) => {
    e.stopPropagation();
    setEditingId(conv.id);
    setEditTitleText(conv.title || "");
  };

  const saveTitle = async (id: string) => {
    if (!editTitleText.trim()) {
      setEditingId(null);
      return;
    }

    try {
      const res = await fetch("/api/ai/update-title", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ conversationId: id, title: editTitleText.trim() }),
      });

      if (res.ok) {
        setConversations((prev) =>
          prev.map((c) => (c.id === id ? { ...c, title: editTitleText.trim() } : c))
        );
      }
    } catch (error) {
      console.error("Failed to update title:", error);
    } finally {
      setEditingId(null);
    }
  };

  const handleDeleteConversation = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm(t("confirmDeleteChat"))) return;

    try {
      const res = await fetch("/api/ai/delete-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ conversationId: id }),
      });

      if (res.ok) {
        setConversations((prev) => prev.filter((c) => c.id !== id));
        if (conversationId === id) {
          setConversationId(null);
          setMessages([INITIAL_GREETING]);
        }
      }
    } catch (error) {
      console.error("Failed to delete conversation:", error);
    }
  };

  const handleClearCurrentChat = async () => {
    setIsHeaderMenuOpen(false);
    if (!conversationId) {
      setMessages([INITIAL_GREETING]);
      return;
    }

    if (!confirm(t("confirmClearChat"))) return;

    setIsClearing(true);
    try {
      const res = await fetch("/api/ai/delete-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ conversationId }),
      });

      if (res.ok) {
        setMessages([INITIAL_GREETING]);
        setConversationId(null);
        fetchConversationsList();
      }
    } catch (error) {
      console.error("Failed to delete conversation:", error);
    } finally {
      setIsClearing(false);
    }
  };

  const handleLogout = async () => {
    setIsHeaderMenuOpen(false);
    setIsLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      document.cookie = "nava_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      window.location.href = '/login';
    }
  };

  const NextBack = async () => {
    setIsHeaderMenuOpen(false);
    setIsLoggingOut(true);
    try {
      await fetch("/api/Dashboard", { method: "POST", credentials: "include" });
    } catch (error) {
      console.error("خطا:", error);
    } finally {
      window.location.href = "/dashboard";
    }
  };

  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("مرورگر شما از قابلیت ضبط صدا پشتیبانی نمی‌کند.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      let options = { mimeType: 'audio/webm' };
      if (!MediaRecorder.isTypeSupported('audio/webm')) {
        if (MediaRecorder.isTypeSupported('audio/mp4')) {
          options = { mimeType: 'audio/mp4' };
        } else {
          options = {} as any;
        }
      }

      mediaRecorderRef.current = new MediaRecorder(stream, options);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorderRef.current?.mimeType || 'audio/webm' });
        const audioFile = new File([audioBlob], `voice-${Date.now()}.webm`, { type: audioBlob.type });
        
        stream.getTracks().forEach(track => track.stop());
        await transcribeAudioToServer(audioFile);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("دسترسی به میکروفون رد شد.");
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const transcribeAudioToServer = async (audioFile: File) => {
    setIsTranscribing(true);
    try {
      const formData = new FormData();
      formData.append("audio", audioFile);
      if (conversationId) {
        formData.append("conversationId", conversationId);
      }

      const savedTone = localStorage.getItem("nava_tone") || "friendly";
      formData.append("tone", savedTone);

      const res = await fetch("/api/ai/chat/", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const responseText = await res.text();
      let data = null;
      try {
        data = JSON.parse(responseText);
      } catch (e) {}

      if (res.status === 403 || data?.error === "LIMIT_EXCEEDED" || data?.code === "TEMPORARY_LOCKED" || data?.error === "TEMPORARY_LOCKED") {
        setShowCreditModal(true);
        setModalMessage(data?.message || t("outOfQuota"));
        setIsTranscribing(false);
        return;
      }

      if (data && typeof data.remainingFree === "number") {
        setRemainingFreeMessages(data.remainingFree);
        if (data.remainingFree <= 5 && data.remainingFree > 0) {
          setShowWarningBanner(true);
          setWarningText(`فقط ${data.remainingFree} پیام رایگان دیگر برای امروز باقی مانده است.`);
        } else if (data.remainingFree === 0) {
          setShowWarningBanner(true);
          setWarningText("سهمیه پیام‌های رایگان امروز شما تمام شده است.");
        } else {
          setShowWarningBanner(false);
        }
      }

      if (res.ok && data) {
        if (!conversationId && data?.conversationId) {
          setConversationId(data.conversationId);
        }

        const transcript = data?.transcribedText || data?.transcript || data?.userMessage || "🎤 پیام صوتی";
        const assistantResponse = data?.response || data?.text || data?.message || "پاسخی دریافت نشد.";

        setMessages((prev) => [
          ...prev,
          { role: "user", content: transcript },
          { role: "assistant", content: assistantResponse }
        ]);

        fetchConversationsList();
      } else {
        alert("خطا در تبدیل صوت به متن: " + (data?.error || "خطای سرور"));
      }
    } catch (error) {
      console.error("Transcription error:", error);
      alert("خطای شبکه در پردازش صوت.");
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && !selectedFile) || isLoading || isTranscribing) return;

    const userMessageText = input.trim();
    const fileToSend = selectedFile;
    
    setMessages((prev) => [
      ...prev,
      { role: "user", content: userMessageText || "📎 ارسال فایل پیوست", attachmentName: fileToSend?.name },
      { role: "assistant", content: "typing-indicator" }
    ]);

    setIsLoading(true);
    setInput("");
    clearSelectedFile();

    const activeConvId = conversationId;

    try {
      const formData = new FormData();
      if (userMessageText) {
        formData.append("message", userMessageText);
      }
      if (activeConvId) {
        formData.append("conversationId", activeConvId);
      }
      if (fileToSend) {
        formData.append("file", fileToSend);
      }

      const savedTone = localStorage.getItem("nava_tone") || "friendly";
      formData.append("tone", savedTone);

      const res = await fetch("/api/ai/chat/", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const responseText = await res.text();
      let data = null;
      try {
        data = JSON.parse(responseText);
      } catch (e) {}
      
      if (res.status === 403 || data?.error === "LIMIT_EXCEEDED" || data?.code === "TEMPORARY_LOCKED" || data?.error === "TEMPORARY_LOCKED") {
        setShowCreditModal(true);
        setModalMessage(data?.message || t("outOfQuota"));
        setMessages((prev) => prev.filter((msg) => msg.content !== "typing-indicator"));
        setIsLoading(false);
        return;
      }

      if (data && typeof data.remainingFree === "number") {
        setRemainingFreeMessages(data.remainingFree);
        if (data.remainingFree <= 5 && data.remainingFree > 0) {
          setShowWarningBanner(true);
          setWarningText(`فقط ${data.remainingFree} پیام رایگان دیگر برای امروز باقی مانده است.`);
        } else if (data.remainingFree === 0) {
          setShowWarningBanner(true);
          setWarningText("سهمیه پیام‌های رایگان امروز شما تمام شده است.");
        } else {
          setShowWarningBanner(false);
        }
      }

      if (res.ok) {
        if (!activeConvId && data?.conversationId) {
          setConversationId(data.conversationId);
        }
        
        const assistantResponse = data?.response || data?.text || data?.message || "پاسخی دریافت نشد.";

        setMessages((prev) => {
          const newMsgs = prev.filter((msg) => msg.content !== "typing-indicator");
          return [...newMsgs, { role: "assistant", content: assistantResponse }];
        });

        fetchConversationsList();
      } else {
        console.error("Server error raw text:", responseText);
        alert("خطای سرور: " + (data?.error || responseText.slice(0, 150)));
        setMessages((prev) => prev.filter((msg) => msg.content !== "typing-indicator"));
      }
    } catch (error) {
      console.error("Fetch failed:", error);
      alert("خطای شبکه در ارتباط با سرور");
      setMessages((prev) => prev.filter((msg) => msg.content !== "typing-indicator"));
    } finally {
      setIsLoading(false);
    }
  };

  const filteredConversations = conversations.filter((conv) =>
    (conv.title || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isDark = theme === "dark";

  return (
    <div dir={lang === 'fa' ? 'rtl' : 'ltr'} className={`flex h-screen w-screen font-sans overflow-hidden ${isDark ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-800"}`}>
      
      {/* سایدبار */}
      <aside className={`fixed md:relative inset-y-0 right-0 md:right-auto ${isSidebarOpen ? 'w-72 translate-x-0' : 'w-0 translate-x-full md:translate-x-0'} transition-all duration-300 ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"} border-l flex flex-col shrink-0 overflow-hidden z-40`}>
        <div className={`p-4 border-b ${isDark ? "border-slate-800" : "border-slate-200"} flex flex-col gap-3 shrink-0`}>
          <div className="flex items-center justify-between">
            <span className={`font-bold text-sm ${isDark ? "text-slate-200" : "text-slate-700"}`}>{t("chatHistory")}</span>
            <button
              type="button"
              onClick={handleNewChat}
              className="text-xs bg-teal-500/10 hover:bg-teal-500/20 text-teal-500 border border-teal-500/30 px-3 py-1.5 rounded-xl transition-all font-medium cursor-pointer"
            >
              + {t("newChat")}
            </button>
          </div>

          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("searchChats")}
            className={`w-full ${isDark ? "bg-slate-950 border-slate-800 text-slate-200 placeholder-slate-500" : "bg-slate-100 border-slate-200 text-slate-800 placeholder-slate-400"} border focus:border-teal-500 text-xs rounded-xl px-3 py-2 outline-none`}
          />
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          <div>
            <div className="text-[10px] font-bold text-slate-400 mb-2 px-1">{t("chatHistory")}</div>
            <div className="space-y-1">
              {filteredConversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => handleSelectConversation(conv.id)}
                  title={formatJalaliDate(conv.updatedAt, lang)}
                  className={`w-full text-right px-3 py-2.5 rounded-xl text-xs transition-all cursor-pointer flex flex-col gap-1 group relative ${
                    conversationId === conv.id
                      ? "bg-teal-500/15 text-teal-500 border border-teal-500/30 font-bold"
                      : isDark ? "text-slate-400 hover:bg-slate-800 hover:text-slate-200" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  {editingId === conv.id ? (
                    <div className="flex items-center gap-1 my-0.5" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        value={editTitleText}
                        onChange={(e) => setEditTitleText(e.target.value)}
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveTitle(conv.id);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        className={`w-full ${isDark ? "bg-slate-950 text-slate-100 border-teal-500" : "bg-white text-slate-800 border-teal-500"} border px-2 py-1 rounded text-xs outline-none`}
                      />
                      <button onClick={() => saveTitle(conv.id)} className="bg-teal-600 text-white px-2 py-1 rounded text-[10px]">تایید</button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className={`truncate font-medium flex-1 ${isDark ? "text-slate-200" : "text-slate-700"}`}>
                        {conv.title || t("untitledChat")}
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 group-active:opacity-100 focus-within:opacity-100 transition-opacity">
                        <button onClick={(e) => startEditing(e, conv)} className="text-slate-400 hover:text-teal-500 p-1" title="ویرایش">✏️</button>
                        <button onClick={(e) => handleDeleteConversation(e, conv.id)} className="text-slate-400 hover:text-red-400 p-1" title="حذف">🗑️</button>
                      </div>
                    </div>
                  )}

                  {conv.updatedAt && (
                    <div className="text-[10px] text-slate-400 font-mono">
                      {formatGregorianDate(conv.updatedAt)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </aside>
      
      {/* صفحه اصلی */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        
        {/* هدر */}
        <header className={`flex items-center justify-between px-4 md:px-6 py-4 ${isDark ? "bg-slate-900/80 border-slate-800" : "bg-white/80 border-slate-200"} backdrop-blur-xl border-b shrink-0 z-20`}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={`p-2 rounded-xl ${isDark ? "bg-slate-800/60 text-slate-300" : "bg-slate-100 text-slate-600"} cursor-pointer`}>
              ☰
            </button>
            <div className="flex items-center gap-2">
              <NavaLogo className="w-8 h-8 drop-shadow-lg" />
              <h1 className={`font-bold text-sm ${isDark ? "text-slate-100" : "text-slate-900"}`}>نوا</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            
            {/* منوی گزارش‌ها */}
            <div className="relative hidden md:block" ref={reportMenuRef}>
              <button
                onClick={() => setIsReportMenuOpen(!isReportMenuOpen)}
                className={`px-3 py-1.5 rounded-xl ${isDark ? "bg-slate-800/60 text-slate-200 hover:text-teal-400 border-slate-700" : "bg-slate-100 text-slate-700 hover:text-teal-600 border-slate-200"} border text-xs cursor-pointer transition-all flex items-center gap-1.5 font-medium`}
              >
                <span>📊 {t("reports")}</span>
                <span className={`text-[10px] transition-transform duration-200 ${isReportMenuOpen ? "rotate-180" : ""}`}>▾</span>
              </button>

              {isReportMenuOpen && (
                <div className={`absolute left-0 mt-2 w-44 rounded-2xl shadow-xl ${isDark ? "bg-slate-900 border-slate-800 text-slate-200" : "bg-white border-slate-200 text-slate-800"} border py-1.5 z-50`}>
                  <button onClick={handleExportPdf} className={`w-full text-right px-4 py-2 text-xs flex items-center gap-2 ${isDark ? "hover:bg-slate-800 hover:text-teal-400" : "hover:bg-slate-100 hover:text-teal-600"}`}>
                    <span>📄</span> {t("exportPdf")}
                  </button>
                  <button onClick={handleExportDocx} className={`w-full text-right px-4 py-2 text-xs flex items-center gap-2 ${isDark ? "hover:bg-slate-800 hover:text-teal-400" : "hover:bg-slate-100 hover:text-teal-600"}`}>
                    <span>📝</span> {t("exportWord")}
                  </button>
                  <button onClick={handleExportTxt} className={`w-full text-right px-4 py-2 text-xs flex items-center gap-2 ${isDark ? "hover:bg-slate-800 hover:text-teal-400" : "hover:bg-slate-100 hover:text-teal-600"}`}>
                    <span>📑</span> {t("exportTxt")}
                  </button>
                </div>
              )}
            </div>

            {/* تم */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-xl ${isDark ? "bg-slate-800 text-amber-400" : "bg-slate-100 text-slate-700"} cursor-pointer text-xs`}
              title="تغییر تم"
            >
              {isDark ? "☀️" : "🌙"}
            </button>

            {/* دکمه خروج اصلاح‌شده و مستقیم */}
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className={`px-3 py-1.5 rounded-xl ${isDark ? "bg-red-500/10 text-red-400 hover:bg-red-500/20 border-red-500/20" : "bg-red-50 text-red-600 hover:bg-red-100 border-red-200"} border text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer`}
              title="خروج از حساب کاربری"
            >
              <span>🚪</span>
              <span className="hidden sm:inline">خروج</span>
            </button>

            {/* منوی تنظیمات */}
            <div className="relative" ref={headerMenuRef}>
              <button
                onClick={() => setIsHeaderMenuOpen(!isHeaderMenuOpen)}
                className={`p-2 rounded-xl ${isDark ? "bg-slate-800/60 text-slate-200" : "bg-slate-100 text-slate-700"} cursor-pointer flex items-center gap-1`}
              >
                <span>⚙️</span>
              </button>

              {isHeaderMenuOpen && (
                <div className={`absolute left-0 mt-2 w-48 rounded-2xl shadow-xl ${isDark ? "bg-slate-900 border-slate-800 text-slate-200" : "bg-white border-slate-200 text-slate-800"} border py-1.5 z-50`}>
                  <div className="md:hidden border-b border-slate-700/50 pb-1 mb-1">
                    <div className="px-4 py-1 text-[10px] text-slate-400 font-bold">خروجی‌ها</div>
                    <button onClick={handleExportPdf} className="w-full text-right px-4 py-1.5 text-xs hover:bg-teal-500/10 hover:text-teal-500">📄 خروجی PDF</button>
                    <button onClick={handleExportDocx} className="w-full text-right px-4 py-1.5 text-xs hover:bg-teal-500/10 hover:text-teal-500">📝 خروجی Word</button>
                    <button onClick={handleExportTxt} className="w-full text-right px-4 py-1.5 text-xs hover:bg-teal-500/10 hover:text-teal-500">📑 خروجی متن</button>
                  </div>

                  <button onClick={handleClearCurrentChat} className="w-full text-right px-4 py-2 text-xs hover:bg-red-500/10 hover:text-red-400 flex items-center gap-2">
                    <span>🧹</span> پاکسازی این گفتگو
                  </button>
                </div>
              )}
            </div>

          </div>
        </header>

        {/* بدنه پیام‌ها */}
        <div
          ref={chatContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 pb-32"
        >
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex flex-col max-w-[85%] md:max-w-[70%] ${
                msg.role === "user" ? "ml-auto items-end" : "mr-auto items-start"
              }`}
            >
              <div
                className={`p-4 rounded-2xl leading-relaxed text-sm ${
                  msg.content === "typing-indicator"
                    ? "bg-transparent p-0 shadow-none"
                    : msg.role === "user"
                    ? "bg-teal-600 text-white rounded-br-none shadow-md"
                    : isDark
                    ? "bg-slate-900 text-slate-100 border border-slate-800 rounded-bl-none shadow-md"
                    : "bg-white text-slate-800 border border-slate-200 rounded-bl-none shadow-sm"
                }`}
              >
                {msg.content === "typing-indicator" ? (
                  <TypingIndicator isDark={isDark} />
                ) : (
                  <div>
                    {msg.attachmentName && (
                      <div className="text-xs opacity-80 mb-1 pb-1 border-b border-white/20 flex items-center gap-1">
                        <span>📎</span> {msg.attachmentName}
                      </div>
                    )}
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* فوتر و ورودی */}
        <div className={`absolute bottom-0 inset-x-0 p-4 ${isDark ? "bg-slate-950/80 border-slate-900" : "bg-slate-50/80 border-slate-200"} backdrop-blur-xl border-t z-20`}>
          
          {selectedFile && (
            <div className="max-w-4xl mx-auto mb-2 flex items-center gap-2 bg-teal-500/10 border border-teal-500/30 px-3 py-1.5 rounded-xl text-xs w-fit">
              <span>📎 {selectedFile.name}</span>
              <button type="button" onClick={clearSelectedFile} className="text-red-400 hover:text-red-300 font-bold ml-1">✕</button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`p-3 rounded-2xl transition-all cursor-pointer ${
                isDark ? "bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800" : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
              }`}
              title="ارسال فایل"
            >
              📎
            </button>

            <button
              type="button"
              onClick={toggleRecording}
              className={`p-3 rounded-2xl transition-all cursor-pointer ${
                isRecording ? "bg-red-500 text-white animate-pulse" : isDark ? "bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800" : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
              }`}
              title="ضبط پیام صوتی"
            >
              🎙️
            </button>

            {isRecording && <AudioWaveform />}

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t("typeMessage")}
              disabled={isRecording || isTranscribing}
              className={`flex-1 ${isDark ? "bg-slate-900 border-slate-800 text-slate-100 placeholder-slate-500" : "bg-white border-slate-200 text-slate-800 placeholder-slate-400"} border focus:border-teal-500 rounded-2xl px-4 py-3 text-sm outline-none`}
            />

            <button
              type="submit"
              disabled={(!input.trim() && !selectedFile) || isLoading || isTranscribing}
              className="bg-teal-600 hover:bg-teal-500 text-white px-5 py-3 rounded-2xl text-sm font-medium transition-all shadow-lg shadow-teal-600/20 disabled:opacity-50 cursor-pointer"
            >
              {isLoading || isTranscribing ? "..." : t("send")}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}