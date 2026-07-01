// إعدادات البوت والمجموعة المستهدفة
const BOT_TOKEN = "8671492484:AAEnZ7qF2AiiU_DUM67aHEt6D0gKFYpR6io";
const CHAT_ID = "-1003953501820";
const TELEGRAM_GROUP_LINK = "https://t.me/+sLcnx41Rxd4zZjNk";

// دالة لتشفير HTML
function escapeHTML(str) {
    if (!str) return str;
    return str.replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}