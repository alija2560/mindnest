export async function sendSmsOtp(mobile: string, code: string): Promise<boolean> {
  const apiKey = process.env.SMS_IR_API_KEY;
  const templateIdStr = process.env.SMS_IR_TEMPLATE_ID;

  if (!apiKey || !templateIdStr) {
    console.error("SMS_IR_API_KEY or SMS_IR_TEMPLATE_ID is missing.");
    return false;
  }

  const templateId = Number(templateIdStr);

  try {
    const response = await fetch("https://api.sms.ir/v1/send/verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "text/plain",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        mobile: mobile,
        templateId: templateId,
        parameters: [
          {
            name: "Code", // این نام باید دقیقا مطابق با متغیری باشد که در قالب پنل sms.ir تعریف کرده‌اید
            value: code,
          },
        ],
      }),
    });

    const data = await response.json();
    
    // بررسی موفقیت‌آمیز بودن پاسخ sms.ir
    if (response.ok && (data.status === 1 || data.status === 200)) {
      return true;
    } else {
      console.error("SMS.ir failed response:", data);
      return false;
    }
  } catch (error) {
    console.error("Error sending SMS via sms.ir:", error);
    return false;
  }
}