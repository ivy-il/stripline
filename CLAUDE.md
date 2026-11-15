# STRIPLINE – הקשר לעבודה עם Claude

אתר תדמית וקטלוג ל-STRIPLINE. האתר ב-Next.js 16 והתוכן מנוהל בוורדפרס headless. פרטים מלאים ב-[README.md](README.md).

## מבנה

| | איפה | הערות |
|---|---|---|
| אתר | `site/` | Next.js 16 (App Router, Turbopack, Tailwind v4, Three.js). לפני שכותבים קוד קוראים את `site/AGENTS.md`, כי ה-API שונה ממה שמוכר |
| תוסף וורדפרס | `wordpress-plugin/stripline-headless/` | REST בכתובת `/wp-json/stripline/v1`, וקריאה ל-`/api/revalidate` אחרי כל שמירה. בונים zip עם `tar.exe -a -c -f stripline-headless.zip stripline-headless`, מתוך `wordpress-plugin/` |
| כלי חילוץ | `tools/` | סקריפטי Python חד-פעמיים שחילצו את הקטלוג |
| פריסה חלופית | `deploy/`, `DEPLOY-DIRECTADMIN.md` | גרסה סטטית ושרת Node עם root. **לא בשימוש כרגע** |

## איך האתר באוויר

- **אתר:** `https://stripline.co.il` רץ ב-**Vercel** (צוות Stripline, פרויקט `stripline`). ה-DNS נמצא ב-Cloudflare: רשומת השורש מפנה ל-Vercel, ו-`www` מפנה לשורש.
- **פריסה:** כל push ל-`main` במאגר `ivy-il/stripline` נפרס אוטומטית לייצור תוך כדקה. כל branch אחר מקבל כתובת Preview.
  - **Root Directory בפרויקט ב-Vercel חייב להיות `site`.** פעם אחת הוא היה `.`, וזה הפיל את האתר ל-404.
  - חזרה לגרסה קודמת: `npx vercel rollback <deployment-url>`, ואחר כך `npx vercel promote` לגרסה הטובה.
- **וורדפרס:** `https://cms.stripline.co.il` רץ על שרת DirectAdmin, מאחורי Cloudflare (ענן כתום).
  - רשומת ה-DNS של `cms` חייבת להפנות לשרת ולא ל-Vercel. פעם אחת היא הפנתה ל-Vercel, וזה גרם לשגיאה 525 / `DEPLOYMENT_NOT_FOUND`.
- **סנכרון:** בכל שמירה בוורדפרס התוסף שולח קריאה ל-`https://stripline.co.il/api/revalidate` עם `REVALIDATE_SECRET`, והאתר מתעדכן תוך שניות.
  - כגיבוי, הנתונים מתרעננים לבד כל 300 שניות.
  - בגרסה 1.5.0 של התוסף יש גם כפתור "⟳ סנכרון האתר" בסרגל העליון של וורדפרס.
- **משתני סביבה:** `WP_API_URL` ו-`REVALIDATE_SECRET` מוגדרים ב-Vercel (Production).
  - מקומית הם נמצאים ב-`site/.env.production`, שלא נכנס לגיט. **לעולם לא מעלים את המפתח לגיט ולא מדפיסים אותו בצ'אט.**

## עבודה מקומית

```bash
cd site
npm ci
npm run dev            # http://localhost:3000. בלי WP_API_URL האתר רץ מנתוני ה-seed שב-src/data
```

כדי לעבוד מול וורדפרס האמיתי, צריך `WP_API_URL` ב-`.env.local` או במשתנה סביבה.

לפני push מריצים:
- `npx tsc --noEmit -p .`
- `npx eslint <קבצים>`
- בדיקה בדפדפן של עמוד שהשתנה

## נתונים: מה כדאי לדעת

- `src/lib/wp.ts`:
  - כל קריאה לוורדפרס נופלת חזרה לנתוני ה-seed אם וורדפרס לא עונה.
  - slug בעברית מגיע מקודד, ולכן `decodeSlug` מפענח אותו.
  - מדיה מוורדפרס מוגשת דרך `/wp-media/*`, כי הקנבס בספר וב-PDF צריך אותה מאותו מקור.
- `src/lib/product-text.ts` מכיל את ההחלטות "האם להציג":
  - `productHasDrawing`: האם להציג את כפתור השרטוט.
  - `productHasInstallation`: כפתור הוראות ההתקנה מוצג רק כשיש תוכן התקנה אמיתי (שלבים, הערות הרכבה, PDF או שרטוט התקנה). אביזרים בלבד לא מספיקים.
- הטקסטים הקבועים של האתר נמצאים ב-`src/data/settings.json`, ווורדפרס גובר עליהם.

## פתוח

- טופס יצירת הקשר ב-Vercel עוד לא נבדק מקצה לקצה: האם הפנייה מגיעה למייל ונשמרת בוורדפרס תחת "פניות מהאתר".
- לא ידוע אם גרסה 1.5.0 של התוסף (כפתור הסנכרון) הותקנה בוורדפרס.
- ב-`public_html` של `stripline.co.il` ב-DirectAdmin נשארו קבצים סטטיים ישנים שכבר לא מוגשים. אפשר למחוק אותם, אבל לא לגעת בוורדפרס.

## העדפות עבודה

- מדברים בעברית.
- כשנותנים הוראות לפעולות ידניות (פאנלים, שרתים, הגדרות), נותנים **צעד אחד בכל פעם** ומחכים לאישור.
- לפני שינוי בודקים שיש גיבוי. גיט מסונכרן עם GitHub נחשב גיבוי.
- עובדים על branch. מעלים ל-`main` רק אחרי אישור, ומאמתים באתר החי אחרי הפריסה.
