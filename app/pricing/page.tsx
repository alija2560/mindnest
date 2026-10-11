async function handleBuyCredit() {
  const res = await fetch("/api/credits/buy", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ packageType: "standard" }),
  });

  const data = await res.json();
  if (res.ok) {
    alert("خرید اعتبار با موفقیت انجام شد! می‌توانید به گفتگو ادامه دهید.");
    window.location.reload(); // رفرش صفحه جهت به‌روزرسانی وضعیت سهمیه
  } else {
    alert(data.error || "خطا در خرید اعتبار");
  }
}