// نسخه مستقل بدون نیاز به Prisma

export const evaluateMessageSafety = (message: string) => {
  const lowerMessage = message.toLowerCase();

  const CRISIS_KEYWORDS = [
    "خودکشی", "خودکشی کنم", "بکشم خودم رو", "تیغ زدن", 
    "خاتمه دادن به زندگی", "قرص خوردن برای مرگ", "suicide", "end my life"
  ];

  const isDanger = CRISIS_KEYWORDS.some(keyword => lowerMessage.includes(keyword));

  if (isDanger) {
    return {
      riskLevel: "IMMEDIATE_DANGER",
      triggerPhrase: "کلمه کلیدی بحران"
    };
  }

  return {
    riskLevel: "SAFE",
    triggerPhrase: null
  };
};