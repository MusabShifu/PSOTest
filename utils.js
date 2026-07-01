// عرض رسالة الحالة
function showMessage(statusDiv, msg, type, isSuccessWithGroup = false) {
    statusDiv.style.display = 'block';
    statusDiv.className = `status-message status-${type}`;

    if (isSuccessWithGroup) {
        statusDiv.innerHTML = `
            <div class="success-container">
                <div class="main-icon">✅</div>
                <div class="main-text">تم استلام ردك</div>
                <div class="sub-text">${msg}</div>
                <a href="${TELEGRAM_GROUP_LINK}" target="_blank" class="success-group-link">
                    📱 الرجاء الانضمام لهذه المجموعة
                </a>
            </div>
        `;
    } else {
        statusDiv.textContent = msg;
    }

    if (type !== 'loading' && !isSuccessWithGroup) {
        setTimeout(() => {
            if (statusDiv.style.display === 'block' && !statusDiv.textContent.includes('جاري')) {
                statusDiv.style.display = 'none';
            }
        }, 7000);
    }
}

function resetMessage(statusDiv) {
    statusDiv.style.display = 'none';
}

// إرسال الملف إلى تليجرام
async function sendFileToTelegram(file, captionText, fileCategory) {
    let url = '';
    let formData = new FormData();
    formData.append('chat_id', CHAT_ID);
    formData.append('caption', captionText);
    formData.append('parse_mode', 'HTML');

    if (fileCategory === 'image') {
        url = `https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`;
        formData.append('photo', file, file.name);
    } else {
        url = `https://api.telegram.org/bot${BOT_TOKEN}/sendDocument`;
        formData.append('document', file, file.name);
    }

    try {
        const response = await fetch(url, {
            method: 'POST',
            body: formData
        });
        const result = await response.json();
        if (result.ok) {
            return { success: true, data: result };
        } else {
            console.error("Telegram API error:", result);
            return { success: false, error: result.description || 'خطأ من تليجرام' };
        }
    } catch (err) {
        console.error("Network error:", err);
        return { success: false, error: err.message || 'فشل الاتصال بالخادم' };
    }
}

// إرسال النص فقط في حال فشل رفع الملف
async function sendTextOnly(captionText, additionalErrorNote = "") {
    const textUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    let finalText = captionText;
    if (additionalErrorNote) {
        finalText += `\n\n⚠️ <b>تنبيه:</b> ${escapeHTML(additionalErrorNote)}`;
    }
    const payload = {
        chat_id: CHAT_ID,
        text: finalText,
        parse_mode: 'HTML'
    };
    try {
        const response = await fetch(textUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const resJson = await response.json();
        return resJson.ok;
    } catch (e) {
        console.error("fallback text error", e);
        return false;
    }
}

// التحقق من صحة الملف
function validateFile(cvFileInput, showMessageFn) {
    if (!cvFileInput.files || cvFileInput.files.length === 0) {
        showMessageFn("⚠️ يرجى رفع ملف السيرة الذاتية (PDF أو صورة)", "error");
        return false;
    }
    const file = cvFileInput.files[0];
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
        showMessageFn("❌ صيغة الملف غير مسموحة. يرجى رفع PDF أو صورة (JPEG, PNG, WEBP).", "error");
        return false;
    }
    if (file.size > 10 * 1024 * 1024) {
        showMessageFn("📦 حجم الملف يتجاوز 10 ميغابايت. يُرجى ضغط الملف وإعادة المحاولة.", "error");
        return false;
    }
    return true;
}

// تحديد نوع الملف
function getFileCategory(mimeType) {
    if (mimeType === 'application/pdf') return 'pdf';
    if (mimeType.startsWith('image/')) return 'image';
    return 'pdf';
}