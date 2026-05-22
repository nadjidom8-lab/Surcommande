# Qandoura Orders — إدارة الطلبيات

## الملفات

| الملف | الوصف |
|---|---|
| `index.html` | الصفحة الرئيسية (نقطة الدخول) |
| `app.jsx` | كامل كود التطبيق (React + JSX) |
| `manifest.json` | إعدادات PWA |
| `sw.js` | Service Worker للعمل offline |
| `icon-192.png` | أيقونة التطبيق 192×192 |
| `icon-512.png` | أيقونة التطبيق 512×512 |

## النشر على GitHub Pages

1. ارفع كل الملفات في المستودع (root).
2. اذهب إلى **Settings → Pages → Source → main branch / root**.
3. سيكون التطبيق متاحاً على: `https://username.github.io/repo-name`

## تحويل لتطبيق عبر PWABuilder

1. افتح [pwabuilder.com](https://www.pwabuilder.com)
2. أدخل رابط GitHub Pages الخاص بك
3. اضغط **Package for stores** للحصول على APK / IPA / MSIX
