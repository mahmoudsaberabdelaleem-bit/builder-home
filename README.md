# المكتب الفني بالعربي (builder-home)

موقع static على GitHub Pages: HTML/CSS/JS عادي، من غير backend.

## هيكل المشروع
- `/` الرئيسية · `/tools/` الحاسبات والأدوات (كل أداة في فولدر) · `/prices/` أسعار مواد البناء · `/articles/` المقالات · `/services/` الخدمات · `/about/` `/contact/` `/privacy/` `/terms/`
- `assets/` ملفات مشتركة (`style.css`, الأيقونات). `data/prices.json` بيانات الأسعار.
- `site.config.json` إعدادات الموقع: الدومين، الاسم، واتساب، سنين الخبرة، الشهادات.
- `build.py` بيولّد `sitemap.xml` و`robots.txt` ويبدّل الدومين في كل الملفات.
- الأماكن القديمة (`/articles/calculator/` وغيرها) فيها stub بـ`meta refresh` و`rel="canonical"` للمكان الجديد.

## تغيير الدومين
1. غيّر `site_url` في `site.config.json` (مثال: `https://example.com/`).
2. شغّل `python3 build.py`. بيبدّل الرابط القديم (`built_url`) بالجديد في كل canonical وOG وsitemap وrobots.
3. لو الموقع هيشتغل من جذر الدومين (مش `/builder-home/`)، راجع الروابط اللي بتبدأ بـ`/builder-home/assets/` (الأيقونات في `<head>`).

## تحديث الأسعار
`data/prices.json` فيه `egypt.history` (سجل يومي) و`saudi` (شهري). كل رقم له تاريخ ومصدر. بعد التعديل شغّل `python3 build.py`. صفحة `/prices/` بتتولد من القالب، والتحديث الآلي اليومي بيفحص الأرقام (نطاقات منطقية، تغيير يومي أقل من 5%، مصدرين متفقين) قبل ما ينشر.

## إضافة أداة أو مقال
- أداة: فولدر جديد تحت `tools/<slug>/index.html`، انسخ هيكل أداة موجودة (نفس `<head>` والـnav)، وضيف كارت في `tools/index.html`.
- مقال: `articles/<slug>/index.html` وكارت في `articles/index.html`.
- بعد أي إضافة شغّل `python3 build.py` عشان تتضاف في الـsitemap.
