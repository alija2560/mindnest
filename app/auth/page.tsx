"use client";

import { useState, useEffect } from "react";
import { NavaLogo } from "@/app/components/NavaLogo";

// 🌍 لیست کامل تمامی کشورهای جهان به همراه طول استاندارد شماره موبایل
const COUNTRIES = [
  { code: "+93", name: "Afghanistan", fa: "افغانستان", flag: "🇦🇫", length: 9 },
  { code: "+355", name: "Albania", fa: "آلبانی", flag: "🇦🇱", length: 9 },
  { code: "+213", name: "Algeria", fa: "الجزایر", flag: "🇩🇿", length: 9 },
  { code: "+376", name: "Andorra", fa: "آندورا", flag: "🇦🇩", length: 6 },
  { code: "+244", name: "Angola", fa: "آنگولا", flag: "🇦🇴", length: 9 },
  { code: "+54", name: "Argentina", fa: "آرژانتین", flag: "🇦🇷", length: 10 },
  { code: "+374", name: "Armenia", fa: "ارمنستان", flag: "🇦🇲", length: 8 },
  { code: "+61", name: "Australia", fa: "استرالیا", flag: "🇦🇺", length: 9 },
  { code: "+43", name: "Austria", fa: "اتریش", flag: "🇦🇹", length: 10 },
  { code: "+994", name: "Azerbaijan", fa: "آذربایجان", flag: "🇦🇿", length: 9 },
  { code: "+973", name: "Bahrain", fa: "بحرین", flag: "🇧🇭", length: 8 },
  { code: "+880", name: "Bangladesh", fa: "بنگلادش", flag: "🇧🇩", length: 10 },
  { code: "+375", name: "Belarus", fa: "بلاروس", flag: "🇧🇾", length: 9 },
  { code: "+32", name: "Belgium", fa: "بلژیک", flag: "🇧🇪", length: 9 },
  { code: "+501", name: "Belize", fa: "بلیز", flag: "🇧🇿", length: 7 },
  { code: "+229", name: "Benin", fa: "بنین", flag: "🇧🇯", length: 8 },
  { code: "+975", name: "Bhutan", fa: "بوتان", flag: "🇧🇹", length: 8 },
  { code: "+591", name: "Bolivia", fa: "بولیوی", flag: "🇧🇴", length: 8 },
  { code: "+387", name: "Bosnia and Herzegovina", fa: "بوسنی و هرزگوین", flag: "🇧🇦", length: 8 },
  { code: "+267", name: "Botswana", fa: "بوتسوانا", flag: "🇧🇼", length: 8 },
  { code: "+55", name: "Brazil", fa: "برزیل", flag: "🇧🇷", length: 11 },
  { code: "+673", name: "Brunei", fa: "برونئی", flag: "🇧🇳", length: 7 },
  { code: "+359", name: "Bulgaria", fa: "بلغارستان", flag: "🇧🇬", length: 9 },
  { code: "+226", name: "Burkina Faso", fa: "بورکینافاسو", flag: "🇧🇫", length: 8 },
  { code: "+257", name: "Burundi", fa: "بوروندی", flag: "🇧🇮", length: 8 },
  { code: "+855", name: "Cambodia", fa: "کامبوج", flag: "🇰🇭", length: 9 },
  { code: "+237", name: "Cameroon", fa: "کامرون", flag: "🇨🇲", length: 9 },
  { code: "+1", name: "Canada", fa: "کانادا", flag: "🇨🇦", length: 10 },
  { code: "+238", name: "Cape Verde", fa: "کیپ ورد", flag: "🇨🇻", length: 7 },
  { code: "+236", name: "Central African Republic", fa: "جمهوری آفریقای مرکزی", flag: "🇨🇫", length: 8 },
  { code: "+235", name: "Chad", fa: "چاد", flag: "🇹🇩", length: 8 },
  { code: "+56", name: "Chile", fa: "شیلی", flag: "🇨🇱", length: 9 },
  { code: "+86", name: "China", fa: "چین", flag: "🇨🇳", length: 11 },
  { code: "+57", name: "Colombia", fa: "کلمبیا", flag: "🇨🇴", length: 10 },
  { code: "+269", name: "Comoros", fa: "کومور", flag: "🇰🇲", length: 7 },
  { code: "+242", name: "Congo", fa: "کنگو", flag: "🇨🇬", length: 9 },
  { code: "+506", name: "Costa Rica", fa: "کاستاریکا", flag: "🇨🇷", length: 8 },
  { code: "+385", name: "Croatia", fa: "کرواسی", flag: "🇭🇷", length: 9 },
  { code: "+53", name: "Cuba", fa: "کوبا", flag: "🇨🇺", length: 8 },
  { code: "+357", name: "Cyprus", fa: "قبرس", flag: "🇨🇾", length: 8 },
  { code: "+420", name: "Czech Republic", fa: "جمهوری چک", flag: "🇨🇿", length: 9 },
  { code: "+45", name: "Denmark", fa: "دانمارک", flag: "🇩🇰", length: 8 },
  { code: "+253", name: "Djibouti", fa: "جیبوتی", flag: "🇩🇯", length: 8 },
  { code: "+1767", name: "Dominica", fa: "دومینیکا", flag: "🇩🇲", length: 7 },
  { code: "+1809", name: "Dominican Republic", fa: "جمهوری دومینیکن", flag: "🇩🇴", length: 10 },
  { code: "+593", name: "Ecuador", fa: "اکوادور", flag: "🇪🇨", length: 9 },
  { code: "+20", name: "Egypt", fa: "مصر", flag: "🇪🇬", length: 10 },
  { code: "+503", name: "El Salvador", fa: "السالوادور", flag: "🇸🇻", length: 8 },
  { code: "+240", name: "Equatorial Guinea", fa: "گینه استوایی", flag: "🇬🇶", length: 9 },
  { code: "+291", name: "Eritrea", fa: "اریتره", flag: "🇪🇷", length: 7 },
  { code: "+372", name: "Estonia", fa: "استونی", flag: "🇪🇪", length: 8 },
  { code: "+251", name: "Ethiopia", fa: "اتیوپی", flag: "🇪🇹", length: 9 },
  { code: "+679", name: "Fiji", fa: "فیجی", flag: "🇫🇯", length: 7 },
  { code: "+358", name: "Finland", fa: "فنلاند", flag: "🇫🇮", length: 9 },
  { code: "+33", name: "France", fa: "فرانسه", flag: "🇫🇷", length: 9 },
  { code: "+241", name: "Gabon", fa: "گابن", flag: "🇬🇦", length: 7 },
  { code: "+220", name: "Gambia", fa: "گامبیا", flag: "🇬🇲", length: 7 },
  { code: "+995", name: "Georgia", fa: "گرجستان", flag: "🇬🇪", length: 9 },
  { code: "+49", name: "Germany", fa: "آلمان", flag: "🇩🇪", length: 11 },
  { code: "+233", name: "Ghana", fa: "غنا", flag: "🇬🇭", length: 9 },
  { code: "+30", name: "Greece", fa: "یونان", flag: "🇬🇷", length: 10 },
  { code: "+502", name: "Guatemala", fa: "گواتمالا", flag: "🇬🇹", length: 8 },
  { code: "+224", name: "Guinea", fa: "گینه", flag: "🇬🇳", length: 9 },
  { code: "+245", name: "Guinea-Bissau", fa: "گینه بیسائو", flag: "🇬🇼", length: 7 },
  { code: "+592", name: "Guyana", fa: "گویان", flag: "🇬🇾", length: 7 },
  { code: "+509", name: "Haiti", fa: "هائیتی", flag: "🇭🇹", length: 8 },
  { code: "+504", name: "Honduras", fa: "هندوراس", flag: "🇭🇳", length: 8 },
  { code: "+36", name: "Hungary", fa: "مجارستان", flag: "🇭🇺", length: 9 },
  { code: "+354", name: "Iceland", fa: "ایسلند", flag: "🇮🇸", length: 7 },
  { code: "+91", name: "India", fa: "هند", flag: "🇮🇳", length: 10 },
  { code: "+62", name: "Indonesia", fa: "اندونزی", flag: "🇮🇩", length: 10 },
  { code: "+98", name: "Iran", fa: "ایران", flag: "🇮🇷", length: 10 },
  { code: "+964", name: "Iraq", fa: "عراق", flag: "🇮🇶", length: 10 },
  { code: "+353", name: "Ireland", fa: "ایرلند", flag: "🇮🇪", length: 9 },
  { code: "+972", name: "Israel", fa: "اسرائیل", flag: "🇮🇱", length: 9 },
  { code: "+39", name: "Italy", fa: "ایتالیا", flag: "🇮🇹", length: 10 },
  { code: "+81", name: "Japan", fa: "ژاپن", flag: "🇯🇵", length: 10 },
  { code: "+962", name: "Jordan", fa: "اردن", flag: "🇯🇴", length: 9 },
  { code: "+7", name: "Kazakhstan", fa: "قزاقستان", flag: "🇰🇿", length: 10 },
  { code: "+254", name: "Kenya", fa: "کنیا", flag: "🇰🇪", length: 9 },
  { code: "+965", name: "Kuwait", fa: "کویت", flag: "🇰🇼", length: 8 },
  { code: "+996", name: "Kyrgyzstan", fa: "قرقیزستان", flag: "🇰🇬", length: 9 },
  { code: "+856", name: "Laos", fa: "لائوس", flag: "🇱🇦", length: 10 },
  { code: "+371", name: "Latvia", fa: "لتونی", flag: "🇱🇻", length: 8 },
  { code: "+961", name: "Lebanon", fa: "لبنان", flag: "🇱🇧", length: 8 },
  { code: "+266", name: "Lesotho", fa: "لسوتو", flag: "🇱🇸", length: 8 },
  { code: "+231", name: "Liberia", fa: "لیبریا", flag: "🇱🇷", length: 8 },
  { code: "+218", name: "Libya", fa: "لیبی", flag: "🇱🇾", length: 9 },
  { code: "+423", name: "Liechtenstein", fa: "لیختن‌اشتاین", flag: "🇱🇮", length: 7 },
  { code: "+370", name: "Lithuania", fa: "لیتوانی", flag: "🇱🇹", length: 8 },
  { code: "+352", name: "Luxembourg", fa: "لوکزامبورگ", flag: "🇱🇺", length: 9 },
  { code: "+261", name: "Madagascar", fa: "ماداگاسکار", flag: "🇲🇬", length: 9 },
  { code: "+265", name: "Malawi", fa: "مالاوی", flag: "🇲🇼", length: 9 },
  { code: "+60", name: "Malaysia", fa: "مالزی", flag: "🇲🇾", length: 9 },
  { code: "+960", name: "Maldives", fa: "مالدیو", flag: "🇲🇻", length: 7 },
  { code: "+223", name: "Mali", fa: "مالی", flag: "🇲🇱", length: 8 },
  { code: "+356", name: "Malta", fa: "مالت", flag: "🇲🇹", length: 8 },
  { code: "+222", name: "Mauritania", fa: "موریتانی", flag: "🇲🇷", length: 8 },
  { code: "+230", name: "Mauritius", fa: "موریس", flag: "🇲🇺", length: 7 },
  { code: "+52", name: "Mexico", fa: "مکزیک", flag: "🇲🇽", length: 10 },
  { code: "+373", name: "Moldova", fa: "مولداوی", flag: "🇲🇩", length: 8 },
  { code: "+377", name: "Monaco", fa: "موناکو", flag: "🇲🇨", length: 8 },
  { code: "+976", name: "Mongolia", fa: "مغولستان", flag: "🇲🇳", length: 8 },
  { code: "+382", name: "Montenegro", fa: "مونته‌نگرو", flag: "🇲🇪", length: 8 },
  { code: "+212", name: "Morocco", fa: "مراکش", flag: "🇲🇦", length: 9 },
  { code: "+258", name: "Mozambique", fa: "موزامبیک", flag: "🇲🇿", length: 9 },
  { code: "+95", name: "Myanmar", fa: "میانمار", flag: "🇲🇲", length: 9 },
  { code: "+264", name: "Namibia", fa: "نامیبیا", flag: "🇳🇦", length: 9 },
  { code: "+977", name: "Nepal", fa: "نپال", flag: "🇳🇵", length: 10 },
  { code: "+31", name: "Netherlands", fa: "هلند", flag: "🇳🇱", length: 9 },
  { code: "+64", name: "New Zealand", fa: "نیوزیلند", flag: "🇳🇿", length: 9 },
  { code: "+505", name: "Nicaragua", fa: "نیکاراگوئه", flag: "🇳🇮", length: 8 },
  { code: "+227", name: "Niger", fa: "نیجر", flag: "🇳🇪", length: 8 },
  { code: "+234", name: "Nigeria", fa: "نیجریه", flag: "🇳🇬", length: 10 },
  { code: "+47", name: "Norway", fa: "نروژ", flag: "🇳🇴", length: 8 },
  { code: "+968", name: "Oman", fa: "عمان", flag: "🇴🇲", length: 8 },
  { code: "+92", name: "Pakistan", fa: "پاکستان", flag: "🇵🇰", length: 10 },
  { code: "+970", name: "Palestine", fa: "فلسطین", flag: "🇵🇸", length: 9 },
  { code: "+507", name: "Panama", fa: "پاناما", flag: "🇵🇦", length: 8 },
  { code: "+675", name: "Papua New Guinea", fa: "پاپوآ گینه نو", flag: "🇵🇬", length: 8 },
  { code: "+595", name: "Paraguay", fa: "پاراگوئه", flag: "🇵🇾", length: 9 },
  { code: "+51", name: "Peru", fa: "پرو", flag: "🇵🇪", length: 9 },
  { code: "+63", name: "Philippines", fa: "فیلیپین", flag: "🇵🇭", length: 10 },
  { code: "+48", name: "Poland", fa: "لهستان", flag: "🇵🇱", length: 9 },
  { code: "+351", name: "Portugal", fa: "پرتغال", flag: "🇵🇹", length: 9 },
  { code: "+974", name: "Qatar", fa: "قطر", flag: "🇶🇦", length: 8 },
  { code: "+40", name: "Romania", fa: "رومانی", flag: "🇷🇴", length: 10 },
  { code: "+7", name: "Russia", fa: "روسیه", flag: "🇷🇺", length: 10 },
  { code: "+250", name: "Rwanda", fa: "رواندا", flag: "🇷🇼", length: 9 },
  { code: "+966", name: "Saudi Arabia", fa: "عربستان سعودی", flag: "🇸🇦", length: 9 },
  { code: "+221", name: "Senegal", fa: "سنگال", flag: "🇸🇳", length: 9 },
  { code: "+381", name: "Serbia", fa: "صربستان", flag: "🇷🇸", length: 9 },
  { code: "+65", name: "Singapore", fa: "سنگاپور", flag: "🇸🇬", length: 8 },
  { code: "+421", name: "Slovakia", fa: "اسلواکی", flag: "🇸🇰", length: 9 },
  { code: "+386", name: "Slovenia", fa: "اسلوونی", flag: "🇸🇮", length: 9 },
  { code: "+27", name: "South Africa", fa: "آفریقای جنوبی", flag: "🇿🇦", length: 9 },
  { code: "+82", name: "South Korea", fa: "کره جنوبی", flag: "🇰🇷", length: 10 },
  { code: "+34", name: "Spain", fa: "اسپانیا", flag: "🇪🇸", length: 9 },
  { code: "+94", name: "Sri Lanka", fa: "سریلانکا", flag: "🇱🇰", length: 9 },
  { code: "+249", name: "Sudan", fa: "سودان", flag: "🇸🇩", length: 9 },
  { code: "+46", name: "Sweden", fa: "سوئد", flag: "🇸🇪", length: 9 },
  { code: "+41", name: "Switzerland", fa: "سوئیس", flag: "🇨🇭", length: 9 },
  { code: "+963", name: "Syria", fa: "سوریه", flag: "🇸🇾", length: 9 },
  { code: "+886", name: "Taiwan", fa: "تایوان", flag: "🇹🇼", length: 9 },
  { code: "+992", name: "Tajikistan", fa: "تاجیکستان", flag: "🇹🇯", length: 9 },
  { code: "+255", name: "Tanzania", fa: "تانزانیا", flag: "🇹🇿", length: 9 },
  { code: "+66", name: "Thailand", fa: "تایلند", flag: "🇹🇭", length: 9 },
  { code: "+228", name: "Togo", fa: "توگو", flag: "🇹🇬", length: 8 },
  { code: "+216", name: "Tunisia", fa: "تونس", flag: "🇹🇳", length: 8 },
  { code: "+90", name: "Turkey", fa: "ترکیه", flag: "🇹🇷", length: 10 },
  { code: "+993", name: "Turkmenistan", fa: "ترکمنستان", flag: "🇹🇲", length: 8 },
  { code: "+256", name: "Uganda", fa: "اوگاندا", flag: "🇺🇬", length: 9 },
  { code: "+380", name: "Ukraine", fa: "اوکراین", flag: "🇺🇦", length: 9 },
  { code: "+971", name: "United Arab Emirates", fa: "امارات", flag: "🇦🇪", length: 9 },
  { code: "+44", name: "United Kingdom", fa: "انگلستان", flag: "🇬🇧", length: 10 },
  { code: "+1", name: "United States", fa: "ایالات متحده", flag: "🇺🇸", length: 10 },
  { code: "+598", name: "Uruguay", fa: "اوروگوئه", flag: "🇺🇾", length: 9 },
  { code: "+998", name: "Uzbekistan", fa: "ازبکستان", flag: "🇺🇿", length: 9 },
  { code: "+58", name: "Venezuela", fa: "ونزوئلا", flag: "🇻🇪", length: 10 },
  { code: "+84", name: "Vietnam", fa: "ویتنام", flag: "🇻🇳", length: 10 },
  { code: "+967", name: "Yemen", fa: "یمن", flag: "🇾🇪", length: 9 },
  { code: "+260", name: "Zambia", fa: "زامبیا", flag: "🇿🇲", length: 9 },
  { code: "+263", name: "Zimbabwe", fa: "زیمبابوه", flag: "🇿🇼", length: 9 },
];

export default function AuthPage() {
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [countryCode, setCountryCode] = useState("+98");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [captchaCode, setCaptchaCode] = useState("");
  const [captchaInput, setCaptchaInput] = useState("");

  const [timeLeft, setTimeLeft] = useState(120);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    generateAdvancedCaptcha();
  }, []);

  const generateAdvancedCaptcha = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let result = "";
    for (let i = 0; i < 4; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaCode(result);
    setCaptchaInput("");
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === "otp" && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setCanResend(true);
    }
    return () => clearInterval(timer);
  }, [step, timeLeft]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "");
    const selectedCountry = COUNTRIES.find((c) => c.code === countryCode);
    const maxLen = selectedCountry ? selectedCountry.length : 10;

    if (val.length <= maxLen) {
      setPhone(val);
      setError("");
    } else {
      setError(`شماره تماس وارد شده نباید بیشتر از ${maxLen} رقم باشد.`);
    }
  };

  const handleSendPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    const selectedCountry = COUNTRIES.find((c) => c.code === countryCode);
    const targetLen = selectedCountry ? selectedCountry.length : 10;

    if (!phone || phone.length < targetLen) {
      setError(`لطفاً شماره موبایل کامل و معتبر (${targetLen} رقمی) وارد کنید.`);
      return;
    }

    if (captchaInput.trim().toUpperCase() !== captchaCode) {
      setError("کد امنیتی (کپچا) وارد شده اشتباه است.");
      generateAdvancedCaptcha();
      return;
    }

    setLoading(true);
    setError("");

    try {
      const fullPhone = `${countryCode}${phone.startsWith('0') ? phone.slice(1) : phone}`;

      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: fullPhone }),
      });

      const data = await res.json();

      if (res.ok) {
        setStep("otp");
        setTimeLeft(120);
        setCanResend(false);
      } else {
        setError(data.error || data.message || "خطا در ارسال کد تایید. لطفاً دوباره تلاش کنید.");
        generateAdvancedCaptcha();
      }
    } catch (err) {
      setError("خطا در ارتباط با سرور.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length !== 4) {
      setError("کد تایید باید دقیقاً ۴ رقم باشد.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const fullPhone = `${countryCode}${phone.startsWith('0') ? phone.slice(1) : phone}`;

      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ phone: fullPhone, otp }),
      });

      const data = await res.json();

      if (res.ok) {
        window.location.href = "/dashboard";
      } else {
        setError(data.error || data.message || "کد تایید نادرست است یا منقضی شده است.");
      }
    } catch (err) {
      setError("خطا در ارتباط با سرور.");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div dir="rtl" className="flex h-screen w-screen items-center justify-center bg-slate-950 text-slate-100 font-sans px-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl">
        
        <div className="text-center mb-8">
            <NavaLogo className="w-14 h-14 mx-auto mb-4 drop-shadow-lg" />
            <h1 className="text-xl font-bold">ورود به نوا</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">پناهگاه امن ذهن و افکار شما</p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center leading-relaxed">
            {error}
          </div>
        )}

        {step === "phone" ? (
          <form onSubmit={handleSendPhone} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">شماره موبایل</label>
              
              {/* بخش انتخاب کد کشور (جمع‌وجور و شیک) و فیلد شماره در کنار هم */}
              <div className="flex gap-2" dir="ltr">
                <select
                  value={countryCode}
                  onChange={(e) => {
                    setCountryCode(e.target.value);
                    setPhone("");
                    setError("");
                  }}
                  className="w-[110px] bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-2xl px-2 py-3 text-xs text-slate-200 outline-none focus:border-teal-500 transition-all font-mono tracking-wide cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:12px_12px] bg-[left_6px_center] bg-no-repeat pl-6 text-center"
                >
                  {COUNTRIES.map((c) => (
                    <option key={`${c.code}-${c.name}`} value={c.code} className="bg-slate-900 text-slate-100 py-1 font-mono">
                      {c.flag} {c.code} ({c.fa})
                    </option>
                  ))}
                </select>

                <input
                  type="tel"
                  value={phone}
                  onChange={handlePhoneChange}
                  placeholder={countryCode === "+98" ? "9123456789" : "شماره موبایل"}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-slate-100 placeholder-slate-600 outline-none focus:border-teal-500 transition-all text-left font-mono"
                  dir="ltr"
                />
              </div>
            </div>

            {/* بخش کپچای حرفه‌ای‌تر تصویری با قابلیت ریفرش */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">کد امنیتی</label>
              <div className="flex gap-3 items-center">
                <div 
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl py-3 text-center tracking-[8px] font-mono font-bold text-teal-400 text-lg select-none relative overflow-hidden shadow-inner"
                  style={{ textDecoration: "line-through", fontStyle: "italic" }}
                >
                  {captchaCode}
                </div>
                <button
                  type="button"
                  onClick={generateAdvancedCaptcha}
                  className="p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-2xl text-slate-400 hover:text-teal-400 transition-all cursor-pointer"
                  title="تغییر کد امنیتی"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                  </svg>
                </button>
              </div>
              <input
                type="text"
                value={captchaInput}
                onChange={(e) => setCaptchaInput(e.target.value)}
                placeholder="کد داخل تصویر را وارد کنید"
                className="w-full mt-3 bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-slate-100 placeholder-slate-600 outline-none focus:border-teal-500 transition-all text-center font-mono tracking-widest uppercase"
                dir="ltr"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold py-3 rounded-2xl transition-all shadow-lg shadow-teal-500/20 disabled:opacity-50 cursor-pointer text-sm"
            >
              {loading ? "در حال ارسال..." : "دریافت کد تایید"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">
                کد تایید ۴ رقمی ارسال شده به {countryCode} {phone}
              </label>
              <input
                type="text"
                maxLength={4}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="----"
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-slate-100 placeholder-slate-600 outline-none focus:border-teal-500 transition-all text-center tracking-widest font-mono text-xl"
                dir="ltr"
              />
            </div>

            <div className="text-center text-xs text-slate-400">
              {timeLeft > 0 ? (
                <span>اعتبار کد تایید: <strong className="text-teal-400 font-mono">{formatTime(timeLeft)}</strong></span>
              ) : (
                <span className="text-red-400">کد تایید منقضی شد. لطفاً درخواست مجدد دهید.</span>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || timeLeft === 0}
              className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold py-3 rounded-2xl transition-all shadow-lg shadow-teal-500/20 disabled:opacity-50 cursor-pointer text-sm"
            >
              {loading ? "در حال بررسی..." : "تایید و ورود"}
            </button>

            {canResend && (
              <button
                type="button"
                onClick={() => {
                  setStep("phone");
                  generateAdvancedCaptcha();
                }}
                className="w-full text-xs text-teal-400 hover:underline pt-1 text-center cursor-pointer"
              >
                ارسال مجدد کد تایید (تغییر شماره یا دریافت کد جدید)
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setStep("phone");
                generateAdvancedCaptcha();
              }}
              className="w-full text-xs text-slate-400 hover:text-teal-400 transition-colors pt-2 text-center cursor-pointer"
            >
              ویرایش شماره موبایل
            </button>
          </form>
        )}

      </div>
    </div>
  );
}