(function() {
    const form = document.getElementById('registrationForm');
    const statusDiv = document.getElementById('statusMessage');
    const submitBtn = document.getElementById('submitBtn');
    const cvFileInput = document.getElementById('cvFile');

    // دالة عرض الرسالة الخاصة
    function showMessageFn(msg, type, isSuccessWithGroup = false) {
        showMessage(statusDiv, msg, type, isSuccessWithGroup);
    }

    function buildDataCaption() {
        const fullName = document.getElementById('fullName').value.trim() || "—";
        const universityWork = document.getElementById('universityWork').value.trim() || "—";
        const job = document.getElementById('job').value.trim() || "—";
        const residence = document.getElementById('residence').value.trim() || "—";
        const college = document.getElementById('college').value.trim() || "—";
        const level = document.getElementById('level').value.trim() || "—";
        const phone = document.getElementById('phone').value.trim() || "—";
        const telegramIdentifier = document.getElementById('telegramIdentifier').value.trim() || "—";
        const email = document.getElementById('email').value.trim() || "—";
        const desiredOffice = document.getElementById('desiredOffice').value.trim() || "—";

        let caption = `<b>📌 استمارة التسجيل المبدئي</b>\n\n`;
        caption += `• <b>الاسم رباعي</b> : ${escapeHTML(fullName)}\n`;
        caption += `• <b>الجامعة/جهة العمل</b> : ${escapeHTML(universityWork)}\n`;
        caption += `• <b>الوظيفة إن وجدت</b> : ${escapeHTML(job)}\n`;
        caption += `• <b>السكن</b> : ${escapeHTML(residence)}\n`;
        caption += `• <b>الكلية</b> : ${escapeHTML(college)}\n`;
        caption += `• <b>المستوى</b> : ${escapeHTML(level)}\n`;
        caption += `• <b>رقم الهاتف</b> : ${escapeHTML(phone)}\n`;
        caption += `• <b>معرف التليجرام / رقم الحساب</b> : ${escapeHTML(telegramIdentifier)}\n`;
        caption += `• <b>الايميل</b> : ${escapeHTML(email)}\n`;
        caption += `• <b>المكتب الذي تود العمل به / اللجنة</b> : ${escapeHTML(desiredOffice)}\n`;
        caption += `\n📎 السيرة الذاتية مرفقة (ملف PDF / صورة).`;
        return caption;
    }

    function validateAllTextFields() {
        const fields = [
            'fullName', 'universityWork', 'job', 'residence', 'college',
            'level', 'phone', 'telegramIdentifier', 'email', 'desiredOffice'
        ];
        const labels = {
            fullName: 'الاسم رباعي',
            universityWork: 'الجامعة/جهة العمل',
            job: 'الوظيفة',
            residence: 'السكن',
            college: 'الكلية',
            level: 'المستوى',
            phone: 'رقم الهاتف',
            telegramIdentifier: 'معرف التليجرام أو رقم حساب التلجرام',
            email: 'البريد الإلكتروني',
            desiredOffice: 'المكتب الذي تود العمل به / اللجنة'
        };
        for (let id of fields) {
            const el = document.getElementById(id);
            if (!el.value.trim()) {
                showMessageFn(`❌ الحقل "${labels[id]}" مطلوب. الرجاء تعبئته.`, "error");
                return false;
            }
        }
        return true;
    }

    form.addEventListener('submit', async function(event) {
        event.preventDefault();
        resetMessage(statusDiv);

        if (!validateAllTextFields()) return;
        if (!validateFile(cvFileInput, showMessageFn)) return;

        submitBtn.disabled = true;
        submitBtn.textContent = "⏳ جاري إرسال البيانات والملف ...";
        showMessageFn("جاري الرفع إلى تليجرام (مجموعة التسجيل)، الرجاء الانتظار...", "loading");

        const file = cvFileInput.files[0];
        const fileCategory = getFileCategory(file.type);
        const captionText = buildDataCaption();

        let sendResult = null;
        try {
            sendResult = await sendFileToTelegram(file, captionText, fileCategory);
            if (sendResult && sendResult.success) {
                showMessageFn("", "success", true);
                form.reset();
                cvFileInput.value = '';
                document.getElementById('fullName').focus();
            } else {
                const errorDetail = sendResult ? sendResult.error : "خطأ غير معروف";
                const textFallbackSuccess = await sendTextOnly(captionText,
                    `فشل رفع ملف السيرة الذاتية: ${errorDetail.substring(0, 150)}. الرجاء التواصل مع الإدارة.`
                );
                if (textFallbackSuccess) {
                    showMessageFn("⚠️ تم إرسال البيانات النصية فقط (فشل رفع الملف). يرجى إعادة المحاولة لاحقاً.", "error");
                } else {
                    showMessageFn(`❌ فشل تام في الإرسال: ${errorDetail || 'خطأ في البوت أو معرف المجموعة'}`, "error");
                }
            }
        } catch (err) {
            console.error("exception during submit:", err);
            showMessageFn(`خطأ في الاتصال: ${err.message || 'يرجى التحقق من اتصالك بالإنترنت'}.`, "error");
            await sendTextOnly(captionText, `خطأ فني أثناء الإرسال: ${err.message || 'unknown'}`);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = "📨 إرسال الاستمارة إلى تليجرام";
            setTimeout(() => {
                if (statusDiv.className.includes('loading') && statusDiv.style.display === 'block') {
                    if (!statusDiv.textContent.includes('نجاح') && !statusDiv.textContent.includes('فشل')) {
                        statusDiv.style.display = 'none';
                    }
                }
            }, 5000);
        }
    });

    cvFileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
            if (!allowed.includes(file.type)) {
                showMessageFn("⚠️ صيغة غير مدعومة. يرجى رفع PDF أو صورة (JPEG, PNG, WEBP).", "error");
                cvFileInput.value = '';
            } else if (file.size > 10 * 1024 * 1024) {
                showMessageFn("⚠️ حجم الملف يتجاوز الحد الأقصى 10 ميجابايت.", "error");
                cvFileInput.value = '';
            } else {
                const fileTypeName = file.type === 'application/pdf' ? 'ملف PDF' : 'صورة';
                showMessageFn(`✅ تم اختيار ${fileTypeName}: "${file.name.substring(0, 45)}"`, "success");
                setTimeout(() => {
                    if (statusDiv.textContent.includes("تم اختيار")) statusDiv.style.display = 'none';
                }, 2500);
            }
        }
    });

    const allInputs = document.querySelectorAll('input, textarea');
    allInputs.forEach(input => {
        input.addEventListener('blur', function() {
            if (this.value.trim() === '' && this.hasAttribute('required') && this.type !== 'file') {
                this.style.borderColor = "#f0b3b3";
            } else {
                this.style.borderColor = "#e2e8f0";
            }
        });
        input.addEventListener('input', function() {
            if (this.value.trim() !== '') {
                this.style.borderColor = "#cbd5e1";
            }
        });
    });
})();