# פריסה ל-DirectAdmin (חשבון אחד, בלי קונטיינרים)

יש שתי אפשרויות. עם גישת root לשרת יש אפשרות שלישית: אפליקציית Node בלי "Setup Node.js App" (סעיף **ג** למטה).

| | **א. HTML סטטי** (בלי Node) | **ב. אפליקציית Node** |
|---|---|---|
| דרישות בשרת | אחסון רגיל: Apache + PHP | "Setup Node.js App" בפאנל |
| עדכון תוכן מוורדפרס | **בנייה והעלאה מחדש** אחרי כל שינוי | אוטומטי, מיד אחרי השמירה |
| טופס יצירת קשר | `contact.php` שמעביר לוורדפרס, או שולח מייל | נתיב ה-API של Next |
| פקודה | `npm run pack:static` | `npm run pack:hosting` |

---

## א. HTML סטטי (בלי Node)

### בנייה על המחשב

מתוך `site/`, צרו `.env.production` (לפי `.env.example`):

```
# עם וורדפרס (התוכן והתמונות נמשכים ממנו בזמן הבנייה):
WP_API_URL=https://cms.stripline.co.il/wp-json/stripline/v1
REVALIDATE_SECRET=<המפתח מוורדפרס>   # contact.php משתמש בו כדי לשמור פניות בוורדפרס

# בלי וורדפרס (נתוני הקטלוג המקומיים), הפניות נשלחות ישירות למייל:
CONTACT_EMAIL=office@stripline.co.il
```

```bash
npm install
npm run pack:static
```

התוצאה היא `site/dist-static/stripline-static.tar.gz` (כ-180MB). הקובץ כולל את כל העמודים כ-HTML (`products/eilat/index.html` וכו'), JS ו-CSS, תמונות, PDF, `contact.php`, `contact-config.php` ו-`.htaccess`.

### העלאה

1. **File Manager** ← `domains/stripline.co.il/public_html`. מחקו את `index.html` של ברירת המחדל, אם יש.
2. העלו את `stripline-static.tar.gz` ← **Extract** לתוך `public_html` ← מחקו את קובץ ה-tar.gz.
3. ודאו שהקובץ המוסתר `.htaccess` נחלץ (בהגדרות File Manager אפשר להציג קבצים מוסתרים).
4. גלשו לאתר ובדקו שליחה של טופס יצירת הקשר.

> וורדפרס יכול לשבת על `cms.stripline.co.il` באותו חשבון. **אל** תחלצו את החבילה לתיקייה של תת־הדומיין.

### עדכון תוכן או גרסה

אחרי שינוי בוורדפרס או בקוד: מריצים שוב `npm run pack:static`, מוחקים מ-`public_html` את התיקיות הישנות של האתר (לא את `cms/` אם וורדפרס יושב שם) ומחלצים את החבילה החדשה.

הקריאה של וורדפרס ל-`/api/revalidate` אחרי שמירה פשוט תיכשל בשקט. אין לה השפעה.

---

## ב. אפליקציית Node

שני חלקים באותו חשבון:

```
stripline.co.il        → אתר Next.js (אפליקציית Node דרך "Setup Node.js App")
cms.stripline.co.il    → וורדפרס עם התוסף stripline-headless
```

**דרישה:** בפאנל של DirectAdmin צריך להופיע **Setup Node.js App** (CloudLinux Node.js Selector), בדרך כלל תחת *Extra Features* או *Advanced Features*. אם הוא לא מופיע, בקשו מחברת האחסון להפעיל אותו (Node 20 ומעלה). בלי האפשרות הזאת אי אפשר להריץ את האתר כמו שהוא.

---

## 1. וורדפרס (פעם אחת)

1. **Subdomain Management** ← הוסיפו את `cms`. אחר כך **SSL Certificates** ← Let's Encrypt לדומיין ולתת־הדומיין.
2. התקינו וורדפרס על `cms.stripline.co.il` דרך Installatron / Softaculous, או ידנית.
3. העלו את `wordpress-plugin/stripline-headless` ל-`wp-content/plugins/` והפעילו את התוסף.
4. **הגדרות ← STRIPLINE:**
   - לשונית *חיבור ל-Next.js*: כתובת `https://stripline.co.il` + מפתח סודי ארוך. שמרו את המפתח, תצטרכו אותו בשלב 2.
   - לשונית *ייבוא קטלוג*: בשדה "כתובת בסיס לקבצים" הזינו `https://stripline.co.il` ולחצו "ייבוא הקטלוג". את השלב הזה עושים **אחרי** שהאתר עולה (שלב 3), כי התמונות נמשכות ממנו.

## 2. בנייה על המחשב

מתוך `site/`, צרו `.env.production` (העתק של `.env.example`):

```
WP_API_URL=https://cms.stripline.co.il/wp-json/stripline/v1
REVALIDATE_SECRET=<אותו מפתח מוורדפרס>
```

> `WP_API_URL` נקרא בזמן הבנייה (ניתוב תמונות המדיה), לכן הקובץ חייב להיות קיים **לפני** הבנייה.

```bash
npm install
npm run pack:hosting
```

התוצאה היא `site/dist-hosting/stripline-app.tar.gz` (כ-190MB). הקובץ כולל את השרת, התלויות, `public/`, הקבצים הסטטיים, ספריית התמונות sharp ל-Linux ואת `.env.production`.

## 3. העלאה ראשונה

1. **Setup Node.js App ← Create Application:**
   - Node.js version: **20** ומעלה (מומלץ 22)
   - Application mode: **Production**
   - Application root: `stripline-app` (תיקייה בבית החשבון, **לא** בתוך `public_html`)
   - Application URL: `stripline.co.il`
   - Application startup file: `server.js`
   - Environment variables (אופציונלי, גוברים על `.env.production`): `REVALIDATE_SECRET`, `WP_REVALIDATE_SECONDS`, `SITE_NOINDEX=1` לדומיין זמני
   - לחצו **Create** ואחר כך **Stop**.
2. **File Manager** ← תיקיית `stripline-app`:
   - אם נוצר שם `node_modules` (קישור שהפאנל יוצר), מחקו אותו.
   - העלו את `stripline-app.tar.gz` ← **Extract** לתוך אותה תיקייה ← מחקו את קובץ ה-tar.gz.
   - בסוף צריכים להיות בתיקייה: `server.js`, `package.json`, `node_modules/`, `.next/`, `public/`, `.env.production`.
3. חזרה ל-Setup Node.js App ← **Start / Restart**.
   **אל תלחצו "Run NPM Install"**: התלויות כבר בתוך החבילה, וההתקנה תדרוס אותן.
4. גלשו ל-`https://stripline.co.il`. אחר כך חזרו לשלב 1.4 לייבוא הקטלוג.

## 4. עדכון גרסה

```bash
npm run pack:hosting
```

Stop ← מחיקת התוכן הישן של `stripline-app` (חוץ מ-`.next/cache` אם רוצים לשמור מטמון) ← העלאה ו-Extract ← Start.

**שינויי תוכן בוורדפרס לא דורשים פריסה מחדש.** וורדפרס קורא ל-`/api/revalidate` והאתר מתעדכן מיד.

---

## ג. שרת עם גישת root, בלי "Setup Node.js App"

Node רץ כשירות (systemd) על `127.0.0.1:3000`, ו-Apache מעביר אליו את `stripline.co.il`. וורדפרס נשאר על `cms.stripline.co.il` כמו שהוא. הקבצים נמצאים בתיקייה `deploy/`.

### התקנה (פעם אחת)

1. **התקנת Node והשירות.** מעלים את `deploy/server-setup.sh` ו-`deploy/update-app.sh` ל-`/root/` ומריצים ב-SSH כ-root:
   ```bash
   bash /root/server-setup.sh <שם המשתמש ב-DirectAdmin>
   ```
2. **העלאת האתר.** מעלים את `site/dist-hosting/stripline-app.tar.gz` ל-`/home/<משתמש>/` ומריצים:
   ```bash
   bash /root/update-app.sh <משתמש>
   ```
   ההודעה `OK – the site answers` אומרת שהאתר עלה.
3. **הפניית הדומיין ל-Node.** ב-DirectAdmin ברמת Admin: **Custom HTTPD Configurations** ← `stripline.co.il` ← לוחצים על `httpd.conf`, מדביקים את התוכן של `deploy/apache-proxy.conf` ושומרים.
   השורה `|*if !SUB|` שומרת על `cms.stripline.co.il` מחוץ להפניה.
   (אם שרת האינטרנט הוא nginx בלבד או OpenLiteSpeed, `server-setup.sh` מדפיס את זה ובמקרה כזה צריך הגדרה אחרת.)
4. **חיבור וורדפרס.** הגדרות ← STRIPLINE ← לשונית *חיבור ל-Next.js*: כתובת `https://stripline.co.il` ואותו `REVALIDATE_SECRET` שב-`site/.env.production`. שומרים.

מעכשיו כל שמירה בוורדפרס מרעננת את האתר תוך שניות, בלי בנייה ובלי העלאה. הקבצים הסטטיים שב-`public_html` כבר לא מוגשים, אבל אפשר להשאיר אותם כגיבוי.

### עדכון קוד

```bash
npm run pack:hosting
```
מעלים את `stripline-app.tar.gz` ל-`/home/<משתמש>/` ומריצים שוב `bash /root/update-app.sh <משתמש>`.

### פקודות שימושיות

| | |
|---|---|
| מצב השירות | `systemctl status stripline` |
| לוג | `journalctl -u stripline -n 100` |
| הפעלה מחדש | `systemctl restart stripline` |

## תקלות נפוצות

| תסמין | מה לבדוק |
|---|---|
| 503 / "Incomplete response" | Setup Node.js App ← גרסת Node 20 ומעלה, startup file `server.js`. את הלוג רואים ב-`stripline-app/stderr.log` (או בקובץ הלוג שמוגדר באפליקציה) |
| `Cannot find module 'next'` | `node_modules` חסר או שנדרס ב-"Run NPM Install". חלצו את החבילה שוב |
| עיצוב חסר / 404 על `/_next/static` | לא נחלצה התיקייה המוסתרת `.next/`. ודאו שב-File Manager מוצגים קבצים מוסתרים |
| שמירה בוורדפרס לא מרעננת | אותו `REVALIDATE_SECRET` בשני הצדדים, וכתובת האתר בוורדפרס עם `https://` |
| תמונות מוורדפרס לא נטענות | `WP_API_URL` לא היה מוגדר בזמן הבנייה. בנו ואחר כך ארזו מחדש |
| זיכרון / האתר נופל | בקשו מחברת האחסון להגדיל את מגבלת הזיכרון (LVE) ל-1GB לפחות |
