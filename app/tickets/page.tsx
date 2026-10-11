"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

interface TicketMessage {
  id: string;
  senderId: string;
  message: string;
  createdAt: string;
}

interface Ticket {
  id: string;
  subject: string;
  status: string;
  priority: string;
  createdAt: string;
  hasUnreadResponse?: boolean;
  userId?: string;
  user?: { name?: string; phone?: string };
  messages: TicketMessage[];
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // فرم تیکت جدید
  const [showNewModal, setShowNewModal] = useState(false);
  const [newSubject, setNewSubject] = useState("");
  const [newPriority, setNewPriority] = useState("MEDIUM");
  const [newMessage, setNewMessage] = useState("");

  // حالت‌های ویرایش تیکت
  const [showEditModal, setShowEditModal] = useState(false);
  const [editSubject, setEditSubject] = useState("");
  const [editPriority, setEditPriority] = useState("MEDIUM");

  // فرم پاسخ
  const [replyText, setReplyText] = useState("");

  // رفرنس برای اسکرول خودکار به آخرین پیام
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [selectedTicket?.messages]);

  const fetchTickets = async () => {
    try {
      const res = await fetch("/api/tickets");
      const data = await res.json();
      if (data.success) {
        setTickets(data.data);
        setIsAdmin(data.isAdmin);
        if (data.data.length > 0 && !selectedTicket) {
          setSelectedTicket(data.data[0]);
        } else if (selectedTicket) {
          // آپدیت تیکت انتخاب شده فعلی پس از رفرش
          const current = data.data.find((t: Ticket) => t.id === selectedTicket.id);
          if (current) setSelectedTicket(current);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleSelectTicket = async (ticket: Ticket) => {
    setSelectedTicket(ticket);

    if (ticket.hasUnreadResponse && !isAdmin) {
      try {
        await fetch(`/api/tickets/${ticket.id}`, { method: "PATCH" });
        setTickets(prev =>
          prev.map(t => (t.id === ticket.id ? { ...t, hasUnreadResponse: false } : t))
        );
      } catch (err) {
        console.error("Error marking ticket as read:", err);
      }
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject || !newMessage) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: newSubject, message: newMessage, priority: newPriority })
      });
      const data = await res.json();
      if (data.success) {
        setShowNewModal(false);
        setNewSubject("");
        setNewMessage("");
        fetchTickets();
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert("خطا در ارسال تیکت");
    } finally {
      setIsSubmitting(false);
    }
  };

  // حذف تیکت
  const handleDeleteTicket = async (ticketId: string) => {
    if (!confirm("آیا از حذف این تیکت اطمینان دارید؟")) return;

    try {
      const res = await fetch(`/api/tickets/${ticketId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setSelectedTicket(null);
        fetchTickets();
      } else {
        alert(data.message || "خطا در حذف تیکت");
      }
    } catch (err) {
      alert("خطا در ارتباط با سرور");
    }
  };

  // باز کردن مودال ویرایش
  const handleOpenEditModal = () => {
    if (!selectedTicket) return;
    setEditSubject(selectedTicket.subject);
    setEditPriority(selectedTicket.priority);
    setShowEditModal(true);
  };

  // ثبت ویرایش تیکت
  const handleUpdateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !editSubject.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/tickets/${selectedTicket.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: editSubject, priority: editPriority })
      });
      const data = await res.json();
      if (data.success) {
        setShowEditModal(false);
        fetchTickets();
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert("خطا در ویرایش تیکت");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicket) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/tickets/${selectedTicket.id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: replyText })
      });
      const data = await res.json();
      if (data.success) {
        setReplyText("");
        await fetchTickets();
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert("خطا در ارسال پاسخ");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 font-sans" dir="rtl">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* هدر صفحه */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-slate-900/80 border border-slate-800 p-6 rounded-2xl shadow-xl gap-4">
          <div>
            <h1 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-indigo-400">
              💬 پشتیبانی و تیکت‌های کاربران
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              {isAdmin ? "پنل مدیریت تیکت‌های ارسالی کاربران" : "ارسال سوالات، پیشنهادات و پیگیری مشکلات"}
            </p>
          </div>
          <div className="flex gap-3 w-full sm:w-auto justify-end">
            <Link
              href="/dashboard"
              className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2.5 rounded-xl transition border border-slate-700 flex items-center gap-1.5"
            >
              <span>←</span> بازگشت به داشبورد
            </Link>
            {!isAdmin && (
              <button
                onClick={() => setShowNewModal(true)}
                className="text-xs bg-teal-600 hover:bg-teal-500 text-white px-5 py-2.5 rounded-xl font-bold transition shadow-lg shadow-teal-900/30"
              >
                + تیکت جدید
              </button>
            )}
          </div>
        </div>

        {/* بدنه اصلی سیستم تیکت */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* لیست تیکت‌ها */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3 h-[600px] overflow-y-auto">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2">لیست تیکت‌ها</h2>
            {isLoading ? (
              <div className="text-center py-20 text-xs text-slate-500 animate-pulse">در حال بارگذاری...</div>
            ) : tickets.length === 0 ? (
              <div className="text-center py-20 text-xs text-slate-500">تیکتی وجود ندارد.</div>
            ) : (
              tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  onClick={() => handleSelectTicket(ticket)}
                  className={`p-4 rounded-xl cursor-pointer transition border relative ${
                    selectedTicket?.id === ticket.id
                      ? "bg-slate-800/90 border-teal-500/50 shadow-md ring-1 ring-teal-500/30"
                      : "bg-slate-950/40 border-slate-800/60 hover:bg-slate-800/40"
                  }`}
                >
                  {ticket.hasUnreadResponse && !isAdmin && (
                    <span className="absolute top-4 left-4 w-2.5 h-2.5 bg-rose-500 rounded-full animate-pulse shadow-lg shadow-rose-500/50" title="پاسخ جدید"></span>
                  )}

                  <div className="flex justify-between items-start mb-1 gap-2">
                    <h3 className="text-sm font-bold text-slate-200 truncate flex-1">{ticket.subject}</h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${
                      ticket.status === 'OPEN' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                      ticket.status === 'ANSWERED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                      'bg-slate-700 text-slate-300'
                    }`}>
                      {ticket.status === 'OPEN' ? 'باز' : ticket.status === 'ANSWERED' ? 'پاسخ داده شده' : 'بسته شده'}
                    </span>
                  </div>
                  {isAdmin && ticket.user && (
                    <p className="text-[11px] text-teal-400 mb-1">کاربر: {ticket.user.name || ticket.user.phone}</p>
                  )}
                  <p className="text-[11px] text-slate-400 truncate">
                    {ticket.messages[ticket.messages.length - 1]?.message || "بدون پیام"}
                  </p>
                </div>
              ))
            )}
          </div>

          {/* پنل مکالمه و جزئیات تیکت */}
          <div className="md:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col h-[600px]">
            {selectedTicket ? (
              <>
                {/* اطلاعات بالای تیکت و دکمه‌های ویرایش/حذف */}
                <div className="border-b border-slate-800 pb-4 mb-4 flex justify-between items-center gap-2">
                  <div className="overflow-hidden">
                    <h2 className="text-base font-bold text-slate-100 truncate">{selectedTicket.subject}</h2>
                    <p className="text-xs text-slate-400 mt-0.5 truncate">
                      شناسه: <span className="font-mono text-slate-300">{selectedTicket.id}</span> | تاریخ: {new Date(selectedTicket.createdAt).toLocaleString('fa-IR')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={handleOpenEditModal}
                      className="text-xs bg-slate-800 hover:bg-slate-700 text-teal-400 border border-slate-700 px-3 py-1.5 rounded-xl transition"
                      title="ویرایش موضوع یا اولویت"
                    >
                      ✏️ ویرایش
                    </button>
                    <button
                      onClick={() => handleDeleteTicket(selectedTicket.id)}
                      className="text-xs bg-slate-800 hover:bg-rose-900/40 text-rose-400 border border-slate-700 px-3 py-1.5 rounded-xl transition"
                      title="حذف تیکت"
                    >
                      🗑️ حذف
                    </button>
                  </div>
                </div>

                {/* پیام‌های تیکت با اسکرول خودکار به پایین */}
                <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                  {selectedTicket.messages.map((msg) => {
                    const isMe = msg.senderId === selectedTicket.userId;
                    return (
                      <div key={msg.id} className={`flex flex-col ${isMe ? 'items-start' : 'items-end'}`}>
                        <div className={`max-w-[80%] p-4 rounded-2xl text-xs leading-relaxed shadow-sm ${
                          isMe 
                            ? 'bg-slate-800/90 text-slate-200 border border-slate-700/60 rounded-tr-none' 
                            : 'bg-teal-600/20 text-teal-200 border border-teal-500/30 rounded-tl-none'
                        }`}>
                          <p className="whitespace-pre-wrap">{msg.message}</p>
                          <span className="block text-[9px] text-slate-400 mt-2 text-left">
                            {new Date(msg.createdAt).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  {/* المان هدف برای اسکرول خودکار به آخرین پیام */}
                  <div ref={messagesEndRef} />
                </div>

                {/* فرم ارسال پاسخ */}
                <form onSubmit={handleReply} className="mt-4 pt-4 border-t border-slate-800 flex gap-3">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="پاسخ خود را بنویسید..."
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-200 focus:outline-none focus:border-teal-500 transition"
                  />
                  <button
                    type="submit"
                    disabled={isSubmitting || !replyText.trim()}
                    className="bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white px-6 py-3 rounded-xl text-xs font-bold transition shadow-lg shadow-teal-900/30 shrink-0"
                  >
                    {isSubmitting ? "در حال ارسال..." : "ارسال پاسخ"}
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-xs text-slate-500">
                یک تیکت را از لیست انتخاب کنید تا جزئیات و گفتگوها نمایش داده شود.
              </div>
            )}
          </div>

        </div>

      </div>

      {/* مودال ایجاد تیکت جدید */}
      {showNewModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-5">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100">ارسال تیکت پشتیبانی جدید</h3>
              <button onClick={() => setShowNewModal(false)} className="text-slate-400 hover:text-slate-200 text-sm font-bold px-2 py-1">✕</button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">موضوع تیکت</label>
                <input
                  type="text"
                  required
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  placeholder="مثال: مشکل در محصولات یا سفارشات"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1.5">اولویت</label>
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
                >
                  <option value="LOW">کم</option>
                  <option value="MEDIUM">متوسط</option>
                  <option value="HIGH">زیاد / فوری</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1.5">متن پیام</label>
                <textarea
                  required
                  rows={4}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="توضیحات کامل درخواست خود را بنویسید..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs text-slate-200 focus:outline-none focus:border-teal-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowNewModal(false)} className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-xs rounded-xl text-slate-300 transition">انصراف</button>
                <button type="submit" disabled={isSubmitting} className="px-6 py-2.5 bg-teal-600 hover:bg-teal-500 text-xs font-bold rounded-xl text-white transition shadow-lg shadow-teal-900/30">
                  {isSubmitting ? "در حال ثبت..." : "ارسال تیکت"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* مودال ویرایش تیکت */}
      {showEditModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-5">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100">ویرایش اطلاعات تیکت</h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-200 text-sm font-bold px-2 py-1">✕</button>
            </div>

            <form onSubmit={handleUpdateTicket} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">موضوع جدید</label>
                <input
                  type="text"
                  required
                  value={editSubject}
                  onChange={(e) => setEditSubject(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1.5">اولویت</label>
                <select
                  value={editPriority}
                  onChange={(e) => setEditPriority(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
                >
                  <option value="LOW">کم</option>
                  <option value="MEDIUM">متوسط</option>
                  <option value="HIGH">زیاد / فوری</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowEditModal(false)} className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-xs rounded-xl text-slate-300 transition">انصراف</button>
                <button type="submit" disabled={isSubmitting} className="px-6 py-2.5 bg-teal-600 hover:bg-teal-500 text-xs font-bold rounded-xl text-white transition shadow-lg shadow-teal-900/30">
                  {isSubmitting ? "در حال ذخیره..." : "ذخیره تغییرات"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}