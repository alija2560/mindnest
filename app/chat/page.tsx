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

// کامپوننت موج صوتی متحرک هنگام ضبط صدا
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
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

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
      <head><meta charset="utf-8"><title>Chat Export</title></head>
      <body style="font-family: Tahoma, sans-serif; direction: ${lang === 'fa' ? 'rtl' : 'ltr'};">
        <h2 style="color: #0d9488; text-align: center;">خروجی گفتگو با دستیار نوا</h2>
        ${messages.map(m => `
          <div style="margin-bottom: 15px; padding: 12px; border-radius: 8px; background-color: ${m.role === 'user' ? '#e0f2f1' : '#f8fafc'}; border: 1px solid #cbd5e1;">
            <strong style="color: ${m.role === 'user' ? '#0f766e' : '#334155'};">${m.role === 'user' ? 'شما:' : 'نوا:'}</strong>
            <p style="white-space: pre-wrap; margin-top: 5px; color: #1e293b;">${m.content}</p>
          </div>
        `).join('')}
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff' + htmlContent], { type: "application/msword" });
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

  const handleNewChat = () => {
    if (isLoading || isTranscribing) return;
    setConversationId(null);
    setMessages([INITIAL_GREETING]);
    clearSelectedFile();
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  const clearSelectedFile = () => {
    if (selectedFilePreviewUrl) {
      URL.revokeObjectURL(selectedFilePreviewUrl);
    }
    setSelectedFile(null);
    setSelectedFilePreviewUrl(null);
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

  // ضبط صدا و ارسال خودکار جهت تبدیل به متن و نمایش در لحظه
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

        // ارسال به سرور جهت تبدیل صوت به متن
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

        // نمایش فوری متن تبدیل‌شده در همان لحظه در چت
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

  const handleLogout = async () => {
    setIsHeaderMenuOpen(false);
    setIsLoggingOut(true);
    try {
      // ۱. ارسال درخواست به سرور برای پاک کردن کوکی سشن
      await fetch("/api/auth/logout", { 
        method: "POST", 
        credentials: "include" 
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // ۲. هدایت قاطع به صفحه لاگین با رفرش کامل حافظه کلاینت
      window.location.href = "/login";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && !selectedFile) || isLoading || isTranscribing) return;

    const userMessageText = input.trim();
    const fileToSend = selectedFile;
    
    setMessages((prev) => [
      ...prev,
      { role: "user", content: userMessageText || "📎 ارسال فایل پیوست" },
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
      
      {/* سایدبار کشویی در موبایل و ثابت در دسکتاپ */}
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
                      {/* دکمه‌های ویرایش و حذف مخفی که با هاور یا لمس ظاهر می‌شوند */}
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
            
            {/* منوی گزارش‌ها (دسکتاپ) */}
            <div className="relative hidden md:block" ref={reportMenuRef}>
              <button
                onClick={() => setIsReportMenuOpen(!isReportMenuOpen)}
                className={`px-3 py-1.5 rounded-xl ${isDark ? "bg-slate-800/60 text-slate-200 hover:text-teal-400 border-slate-700" : "bg-slate-100 text-slate-700 hover:text-teal-600 border-slate-200"} border text-xs cursor-pointer transition-all flex items-center gap-1.5 font-medium`}
              >
                <span>📊 {t("reports")}</span>
                <span className={`text-[10px] transition-transform duration-200 ${isReportMenuOpen ? "rotate-180" : ""}`}>▾</span>
              </button>

              {isReportMenuOpen && (
                <div className={`absolute left-0 mt-2 w-44 rounded-2xl shadow-xl ${isDark ? "bg-slate-900 border-slate-800 text-slate-200" : "bg-white border-slate-200 text-slate-800"} border py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150`}>
                  <button onClick={handleExportPdf} className={`w-full text-right px-4 py-2 text-xs flex items-center gap-2 transition-colors ${isDark ? "hover:bg-slate-800 hover:text-teal-400" : "hover:bg-slate-100 hover:text-teal-600"}`}>
                    <span>📄</span> {t("exportPdf")}
                  </button>
                  <button onClick={handleExportDocx} className={`w-full text-right px-4 py-2 text-xs flex items-center gap-2 transition-colors ${isDark ? "hover:bg-slate-800 hover:text-teal-400" : "hover:bg-slate-100 hover:text-teal-600"}`}>
                    <span>📝</span> {t("exportWord")}
                  </button>
                  <button onClick={handleExportTxt} className={`w-full text-right px-4 py-2 text-xs flex items-center gap-2 transition-colors ${isDark ? "hover:bg-slate-800 hover:text-teal-400" : "hover:bg-slate-100 hover:text-teal-600"}`}>
                    <span>📋</span> {t("exportText")}
                  </button>
                </div>
              )}
            </div>

            <div className={`hidden md:block h-4 w-[1px] ${isDark ? "bg-slate-800" : "bg-slate-200"} mx-1`} />

            {/* دکمه‌های افقی کامل (دسکتاپ) */}
            <div className="hidden md:flex items-center gap-2">
              <a href="/settings" className={`px-3 py-1.5 rounded-xl ${isDark ? "bg-slate-800/60 text-slate-300 hover:text-teal-400" : "bg-slate-100 text-slate-600 hover:text-teal-600"} border text-xs transition-all`}>
                ⚙️ {t("settings")}
              </a>

              <button onClick={toggleTheme} className={`p-2 rounded-xl ${isDark ? "bg-slate-800/60 text-amber-400" : "bg-slate-100 text-amber-600"} border text-xs cursor-pointer`}>
                {isDark ? "☀" : "🌙"}
              </button>

              <button onClick={handleClearCurrentChat} disabled={isClearing} className={`px-3 py-1.5 rounded-xl ${isDark ? "bg-slate-800/60 text-slate-300" : "bg-slate-100 text-slate-600"} border text-xs cursor-pointer`}>
                {t("clearHistory")}
              </button>

              <button onClick={handleLogout} disabled={isLoggingOut} className={`px-3 py-1.5 rounded-xl ${isDark ? "bg-slate-800/60 text-slate-300" : "bg-slate-100 text-slate-600"} border text-xs cursor-pointer`}>
                {t("exit")}
              </button>

              <button onClick={NextBack} disabled={isLoggingOut} className={`px-3 py-1.5 rounded-xl ${isDark ? "bg-slate-800/60 text-slate-300" : "bg-slate-100 text-slate-600"} border text-xs cursor-pointer`}>
                 {isLoggingOut ? "در حال انتقال..." : t("backToDashboard")}
              </button>
            </div>

            {/* منوی سه نقطه کشویی (موبایل) */}
            <div className="relative md:hidden" ref={headerMenuRef}>
              <button
                onClick={() => setIsHeaderMenuOpen(!isHeaderMenuOpen)}
                className={`p-2 rounded-xl ${isDark ? "bg-slate-800/60 text-slate-200 border-slate-700" : "bg-slate-100 text-slate-700 border-slate-200"} border text-sm`}
              >
                ⋮
              </button>

              {isHeaderMenuOpen && (
                <div className={`absolute left-0 mt-2 w-48 rounded-2xl shadow-xl ${isDark ? "bg-slate-900 border-slate-800 text-slate-200" : "bg-white border-slate-200 text-slate-800"} border py-2 z-50 flex flex-col gap-1`}>
                  <div className="px-3 py-1 text-[10px] text-slate-400 font-bold border-b border-slate-700/50">{t("reports")}</div>
                  <button onClick={handleExportPdf} className="w-full text-right px-4 py-1.5 text-xs hover:bg-teal-500/10 hover:text-teal-400">📄 {t("exportPdf")}</button>
                  <button onClick={handleExportDocx} className="w-full text-right px-4 py-1.5 text-xs hover:bg-teal-500/10 hover:text-teal-400">📝 {t("exportWord")}</button>
                  <button onClick={handleExportTxt} className="w-full text-right px-4 py-1.5 text-xs hover:bg-teal-500/10 hover:text-teal-400">📋 {t("exportText")}</button>
                  <div className="border-t border-slate-700/50 my-1"></div>
                  <a href="/settings" className="w-full text-right px-4 py-1.5 text-xs hover:bg-teal-500/10 hover:text-teal-400">⚙️ {t("settings")}</a>
                  <button onClick={toggleTheme} className="w-full text-right px-4 py-1.5 text-xs hover:bg-teal-500/10 hover:text-teal-400">{isDark ? "☀ حالت روشن" : "🌙 حالت تاریک"}</button>
                  <button onClick={handleClearCurrentChat} className="w-full text-right px-4 py-1.5 text-xs hover:bg-teal-500/10 hover:text-teal-400">🗑️ {t("clearHistory")}</button>
                  <button onClick={NextBack} className="w-full text-right px-4 py-1.5 text-xs hover:bg-teal-500/10 hover:text-teal-400">📊 {t("backToDashboard")}</button>
                  <button onClick={handleLogout} className="w-full text-right px-4 py-1.5 text-xs text-red-400 hover:bg-red-500/10">🚪 {t("exit")}</button>
                </div>
              )}
            </div>

          </div>
        </header>

        {/* بنر هشدار سهمیه */}
        {showWarningBanner && (
          <div className="bg-amber-500/15 border-b border-amber-500/30 text-amber-500 px-4 py-2 text-xs text-center font-medium">
            ⚠️ {warningText}
          </div>
        )}

        {/* بخش نمایش پیام‌ها (تراز دقیق راست برای کاربر و چپ برای نوا) */}
        <div 
          ref={chatContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 relative flex flex-col"
        >
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex flex-col gap-1 max-w-[85%] md:max-w-[70%] w-full ${
                msg.role === "user" ? "ml-auto items-end text-right" : "mr-auto items-start text-right"
              }`}
            >
              <div
                className={`p-4 rounded-2xl text-xs md:text-sm leading-relaxed relative group ${
                  msg.role === "user"
                    ? "bg-teal-600 text-white rounded-br-none"
                    : isDark
                    ? "bg-slate-800 text-slate-100 rounded-bl-none border border-slate-700/50"
                    : "bg-white text-slate-800 rounded-bl-none border border-slate-200 shadow-sm"
                }`}
              >
                {msg.content === "typing-indicator" ? (
                  <TypingIndicator isDark={isDark} />
                ) : (
                  <>
                    <div className="whitespace-pre-wrap">{msg.content}</div>

                    {/* دکمه کپی متن (نمایش فقط هنگام هاور یا لمس روی پیام) */}
                    {msg.content !== "typing-indicator" && (
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(msg.content);
                          setCopiedIndex(index);
                          setTimeout(() => setCopiedIndex(null), 2000);
                        }}
                        className={`absolute top-2 ${msg.role === 'user' ? 'left-2' : 'right-2'} opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity p-1 rounded bg-black/20 text-white text-[10px] cursor-pointer`}
                        title="کپی متن"
                      >
                        {copiedIndex === index ? "✓ کپی شد" : "📋 کپی"}
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
          
          {/* حباب وضعیت در حال تبدیل صوت به متن */}
          {isTranscribing && (
            <div className="flex flex-col gap-1 max-w-[85%] md:max-w-[70%] ml-auto items-end w-full">
              <div className="p-4 rounded-2xl text-xs md:text-sm bg-teal-600/70 text-white rounded-br-none animate-pulse">
                🎤 در حال تبدیل صوت به متن و ارسال...
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* دکمه شناور پیمایش سریع به بالا (گوشه سمت چپ و پایین) */}
        {showScrollTopBtn && (
          <button
            onClick={scrollToTop}
            className={`absolute bottom-24 left-6 z-30 w-10 h-10 rounded-full shadow-lg border flex items-center justify-center transition-all cursor-pointer ${
              isDark 
                ? "bg-slate-800/90 text-teal-400 border-slate-700 hover:bg-slate-700" 
                : "bg-white/90 text-teal-600 border-slate-200 hover:bg-slate-50"
            }`}
            title="بازگشت به بالای صفحه"
          >
            ↑
          </button>
        )}

        {/* نوار پایین برای ارسال پیام */}
        <div className={`p-3 md:p-4 border-t ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"} shrink-0`}>
          {selectedFilePreviewUrl && (
            <div className="mb-2 flex items-center gap-2 p-2 rounded-xl bg-teal-500/10 border border-teal-500/20 max-w-xs">
              <span className="text-xs text-teal-500 truncate flex-1">📎 {selectedFile?.name}</span>
              <button onClick={clearSelectedFile} className="text-red-400 hover:text-red-500 text-xs px-1">✕</button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex items-end gap-2 max-w-4xl mx-auto">
            {/* تکس باکس با افکت امواج صوتی متحرک و قاب قرمز شکیل */}
            <div className={`flex-1 flex items-center rounded-2xl border transition-all px-3 py-2 ${
              isRecording 
                ? "bg-red-500/10 border-red-500 shadow-lg shadow-red-500/10 ring-2 ring-red-500/20" 
                : isTranscribing
                ? "bg-amber-500/10 border-amber-500 animate-pulse"
                : isDark ? "bg-slate-950 border-slate-800 focus-within:border-teal-500" : "bg-slate-100 border-slate-200 focus-within:border-teal-500"
            }`}>
              
              {isRecording ? (
                <div className="w-full flex items-center justify-between py-1">
                  <AudioWaveform />
                  <span className="text-[10px] text-red-500 font-medium">برای اتمام روی میکروفون کلیک کنید</span>
                </div>
              ) : isTranscribing ? (
                <div className="w-full py-1 text-xs text-amber-500 font-medium px-2 animate-pulse">
                  ⏳ در حال تبدیل صوت به متن توسط سرور...
                </div>
              ) : (
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                  rows={1}
                  placeholder={t("typeMessage")}
                  className={`w-full bg-transparent text-xs md:text-sm outline-none resize-none max-h-32 py-1 leading-relaxed ${
                    isDark ? "text-slate-100 placeholder-slate-500" : "text-slate-800 placeholder-slate-400"
                  }`}
                  style={{ minHeight: '24px' }}
                />
              )}

              <div className="flex items-center gap-1 shrink-0 mr-2">
                <button
                  type="button"
                  onClick={toggleRecording}
                  disabled={isTranscribing}
                  className={`p-2 rounded-xl text-xs transition-all cursor-pointer ${
                    isRecording 
                      ? "bg-red-500 text-white shadow-md shadow-red-500/50 scale-110 animate-pulse" 
                      : isDark ? "text-slate-400 hover:text-slate-200" : "text-slate-500 hover:text-slate-800"
                  }`}
                  title={isRecording ? "توقف ضبط و تبدیل به متن" : "ضبط صوت و تبدیل خودکار به متن"}
                >
                  🎤
                </button>

                {/* پیوست تصویر، PDF یا اکسل */}
                <label className={`p-2 rounded-xl text-xs cursor-pointer transition-colors ${isDark ? "text-slate-400 hover:text-slate-200" : "text-slate-500 hover:text-slate-800"}`} title="پیوست تصویر، PDF یا اکسل">
                  📎
                  <input
                    type="file"
                    accept="image/*,application/pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setSelectedFile(e.target.files[0]);
                        setSelectedFilePreviewUrl(URL.createObjectURL(e.target.files[0]));
                      }
                    }}
                  />
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || isTranscribing || (!input.trim() && !selectedFile)}
              className="bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white px-4 py-3 rounded-2xl text-xs md:text-sm font-medium transition-all shrink-0 cursor-pointer shadow-lg shadow-teal-600/20"
            >
              {isLoading || isTranscribing ? "..." : t("send")}
            </button>
          </form>
        </div>

      </div>

      {/* مدال اتمام سهمیه / قفل */}
      {showCreditModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`max-w-md w-full p-6 rounded-3xl shadow-2xl ${isDark ? "bg-slate-900 border border-slate-800 text-slate-100" : "bg-white text-slate-800"} text-center space-y-4`}>
            <div className="text-4xl">⏳</div>
            <h3 className="font-bold text-lg text-teal-500">پایان سهمیه رایگان</h3>
            <p className="text-xs md:text-sm leading-relaxed text-slate-400">{modalMessage}</p>
            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={() => router.push("/dashboard/subscription")}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-lg shadow-teal-600/20"
              >
                ارتقای اشتراک و ادامه گفتگو
              </button>
              <button
                onClick={() => setShowCreditModal(false)}
                className={`w-full py-2.5 rounded-xl text-xs font-medium ${isDark ? "bg-slate-800 hover:bg-slate-700 text-slate-300" : "bg-slate-100 hover:bg-slate-200 text-slate-700"}`}
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}