export async function sendSmsOtp(mobile: string, code: string): Promise<boolean> {
  const apiKey = process.env.SMS_IR_API_KEY;
  const templateIdStr = process.env.SMS_IR_TEMPLATE_ID;

  if (!apiKey || !templateIdStr) {
    console.error("SMS_IR_API_KEY or SMS_IR_TEMPLATE_ID is missing.");
    return false;
  }

  const templateId = Number(templateIdStr);
  
  // تولید تاریخ جاری برای متغیر #DATE#
  const currentDate = new Date().toLocaleDateString('fa-IR');

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
            name: "OTP", // نام این متغیر باید دقیقاً مطابق با #OTP# در قالب باشد
            value: code,
          },
          {
            name: "DATE", // نام این متغیر باید دقیقاً مطابق با #DATE# در قالب باشد
            value: currentDate,
          },
        ],
      }),
    });

    const data = await response.json();
    
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