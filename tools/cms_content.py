"""
Every editable text, list and image of the site, in one place.

    python -I tools/cms_content.py

writes the WordPress field list (wordpress-plugin/.../includes/fields.php, between the
CMS-FIELDS markers) and the default copy shared by the plugin and the site
(seed/settings.json, site/src/data/settings.json).

Text conventions (explained to the client in the field labels):
  **מילים**          bold
  STRIPLINE           the wordmark
  [תווית](/קישור)     a link
  new line            a new paragraph / a new line of a heading
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PLUGIN = ROOT / "wordpress-plugin" / "stripline-headless"
SITE_DATA = ROOT / "site" / "src" / "data"

RICH = " (**מודגש**, [קישור](/כתובת))"
PARAS = " – פסקה בכל שורה" + RICH
HEAD = " – שורה לכל שורת כותרת" + RICH

GROUPS = {
    "general": "כללי, תפריט ופוטר",
    "home": "עמוד הבית",
    "about": "אודות",
    "products": "משפחות מוצרים",
    "product": "עמוד מוצר",
    "sheet": "דף מוצר PDF",
    "catalog": "קטלוג",
    "projects": "פרויקטים",
    "contact": "דברו איתנו",
    "form": "טופס פנייה",
    "pages": "תודה ו-404",
    "legal": "עמודים משפטיים",
    "seo": "גוגל (SEO)",
    "professional": "מרחב מקצועי (עמוד לא מקושר)",
}

legal = json.loads((SITE_DATA / "legal.json").read_text(encoding="utf-8"))

# (key, group, label, type, default) – type: text | textarea | rich | image | file | lines | links |
# pairs | cards | agents | rows | html. A default of None keeps the value the live site shows now.
F = [
    # ---- general
    ("site_name", "general", "שם האתר", "text", None),
    ("site_tagline", "general", "סלוגן באנגלית (טקסט חלופי ללוגו)", "text", None),
    ("logo_dark", "general", "לוגו כהה (כותרת עליונה ופוטר)", "image", "/n/stripline-logo-dark.svg"),
    ("logo_light", "general", "לוגו לבן (על תמונות)", "image", "/n/stripline-logo-white.svg"),
    ("address", "general", "כתובת", "text", None),
    ("email", "general", "אימייל", "text", None),
    ("phone", "general", "טלפון", "text", None),
    ("website", "general", "כתובת אתר (מודפסת בדף המוצר PDF)", "text", None),
    ("solutions_agents", "general", "אנשי מכירות – שורה לכל אחד: שם | טלפון | וואטסאפ (972…)", "agents", None),
    ("agent_cta", "general", "כפתור וואטסאפ – מילים לפני השם", "text", "דברו עם"),
    ("nav_links", "general", "תפריט עליון – שורה לכל קישור: תווית | /כתובת", "links", [
        {"label": "דף הבית", "href": "/"}, {"label": "אודות", "href": "/about"},
        {"label": "משפחות מוצרים", "href": "/products"}, {"label": "פרויקטים", "href": "/projects"},
        {"label": "קטלוג", "href": "/catalog"}, {"label": "דברו איתנו", "href": "/contact"}]),
    ("footer_links", "general", "קישורי פוטר – שורה לכל קישור: תווית | /כתובת", "links", [
        {"label": "מדיניות פרטיות", "href": "/privacy"}, {"label": "הצהרת נגישות", "href": "/accessibility"},
        {"label": "תנאי שימוש", "href": "/terms"}]),
    ("visual_disclosure", "general", "תווית על תמונות פרויקטים", "text", None),
    ("default_scene", "general", "תמונת אווירה כשאין תמונה למשפחה או למוצר", "image", "/n/n-office.webp"),

    # ---- home
    ("hero_title", "home", "כותרת ראשית" + HEAD, "textarea", None),
    ("hero_subtitle", "home", "כותרת משנה", "textarea", None),
    ("book_cta", "home", "כפתור הקטלוג (בהירו ובאזור הקטלוג)", "text", None),
    ("hero_video", "home", "סרטון ההירו (מחשב)", "video", "/video/hero-1080.mp4"),
    ("hero_video_mobile", "home", "סרטון ההירו (נייד, קובץ קטן יותר)", "video", "/video/hero-720.mp4"),
    ("hero_poster", "home", "תמונה עד שהסרטון נטען", "image", "/video/hero-poster.webp"),
    ("home_cards", "home", "שלושת השערים מתחת להירו – שורה לכל שער: כותרת | טקסט | תווית הקישור | /קישור", "cards", [
        {"title": "פתרונות", "text": "פתרונות אדריכליים למיזוג ואוורור", "label": "לכל הפתרונות", "href": "#solutions"},
        {"title": "משפחות מוצרים", "text": "מגוון רחב של מוצרים ומערכות מתקדמות", "label": "לכל המשפחות", "href": "/products"},
        {"title": "פרויקטים נבחרים", "text": "השראה מתכנון פרויקטים שביצענו", "label": "לכל הפרויקטים", "href": "/projects"}]),
    ("book_title", "home", "אזור הקטלוג – כותרת", "textarea", None),
    ("solutions_heading", "home", "פתרונות – כותרת" + RICH, "rich", "כל פתרון **מתחיל בתכנון החלל**"),
    ("solutions_intro", "home", "פתרונות – טקסט" + PARAS, "lines", None),
    ("sol_images", "home", "פתרונות – תמונות מתחלפות (גררו לשינוי הסדר)", "gallery", [
        f"/n/{n}.webp" for n in ["n-contact", "n-family-hero", "n-gallery", "n-hotel", "n-lobby", "n-loft", "n-office",
                                 "n-penthouse", "n-restaurant", "n-retail", "n-villa-caesarea", "n-villa-modern", "n-villa"]]),
    ("solutions_items", "home", "פתרונות – הרשימה הנפתחת, שורה לכל פתרון: כותרת | טקסט (// לפסקה חדשה)", "pairs", None),
    ("air_image", "home", "רצועת הסיום – תמונה", "image", "/n/n-hotel.webp"),
    ("solutions_closing_title", "home", "רצועת הסיום – כותרת" + RICH, "rich", "האוויר הוא **חלק מהתכנון.**"),
    ("solutions_closing_text", "home", "רצועת הסיום – טקסט", "textarea", None),
    ("solutions_closing_kicker", "home", "רצועת הסיום – שורה מעל הכפתורים", "text", None),
    ("air_link", "home", "רצועת הסיום – קישור: תווית | /כתובת", "links", [{"label": "למשפחות המוצרים", "href": "/products"}]),

    # ---- about
    ("about_image", "about", "תמונה ראשית", "image", "/n/n-about-team.webp"),
    ("about_title", "about", "כותרת ראשית" + HEAD, "textarea", "כבר קרוב ל30 שנה\nאנחנו חיים את עולם\n**המיזוג, הבנייה והתכנון.**"),
    ("about_text", "about", "פתיחה" + PARAS, "textarea", "\n".join([
        "חברת STRIPLINE צמחה מתוך ניסיון מקצועי רחב שנבנה לאורך עשרות שנים במסגרת חברת האם, התותח מיזוג אוויר, הפועלת משנת 1998. לאורך השנים ליווינו פרויקטים בהיקפים גדולים, עבדנו לצד חברות בנייה ויזמות מהמובילות בישראל, והיינו שותפים לתהליכי תכנון וביצוע במגוון רחב של פרויקטים למגורים, מסחר ומבני ציבור.",
        "הניסיון הזה הוביל להתמחות מדויקת יותר: החיבור שבין מערכות מיזוג ואוורור לבין האדריכלות של החלל.",
        "חברת STRIPLINE מפתחת ומייצרת בישראל פתרונות אדריכליים למיזוג ואוורור, בתוצרת כחול לבן, מתוך היכרות עמוקה עם הצרכים של אדריכלים, מעצבים, מתכננים, קבלנים ויזמים. המפעל שלנו מאפשר לנו לשלוט בתהליך, לשמור על רמת גימור גבוהה ולהתאים פתרונות לפרויקטים שונים, מהתכנון ועד לביצוע.",
        "עבורנו, פתחי מיזוג ואוורור הם חלק בלתי נפרד מהשפה האדריכלית. הקו, הפרופורציה, המיקום, החומר והגמר משפיעים על האופן שבו החלל נראה ומרגיש, ולכן כל פתרון נבחן כחלק מהמכלול התכנוני."])),
    ("about_stats", "about", "שני המספרים – שורה לכל אחד: מספר | טקסט", "pairs", [
        {"title": "1998", "text": "חברת האם, התותח מיזוג אוויר, פועלת משנת"},
        {"title": "30", "text": "קרוב ל30 שנה בעולם המיזוג, הבנייה והתכנון"}]),
    ("about_dark", "about", "המשבצת הכהה" + RICH, "rich", "זה בדיוק המקום שבו **ניסיון טכני פוגש עיצוב.**"),
    ("about_intro_image", "about", "תמונה ליד המספרים", "image", "/n/n-office.webp"),
    ("about_clients_title", "about", "לקוחות – כותרת", "text", "בין לקוחותינו"),
    ("about_clients_text", "about", "לקוחות – טקסט", "text", "וחברות נוספות מהשורה הראשונה בענף"),
    ("about_clients", "about", "לקוחות – לוגו ושם לכל חברה", "logos", [
        {"title": t, "text": f"/n/logos/{s}.webp"} for s, t in [
            ("dimri", "י.ח. דמרי"), ("psagot", "פסגות א.ג ניהול והנדסה"), ("briga", "בריגה"), ("aura", "אאורה ישראל"),
            ("azorim", "אזורים"), ("shikun", "שיכון ובינוי"), ("tshuva", "קבוצת איציק תשובה"), ("abrahami", "יוסי אברהמי")]]),
    ("about_split_image", "about", "\"פתרון שמתוכנן יחד עם החלל\" – תמונה", "image", "/n/n-loft.webp"),
    ("about_split_title", "about", "\"פתרון שמתוכנן יחד עם החלל\" – כותרת" + RICH, "rich", "אנחנו מייצרים לכם **פתרון שמתוכנן יחד עם החלל**"),
    ("about_split_text", "about", "\"פתרון שמתוכנן יחד עם החלל\" – טקסט (הפסקה הראשונה מודגשת)" + PARAS, "textarea", "\n".join([
        "לכל פרויקט יש שפה משלו: קווים, חומרים, פרופורציות, תקרות, נגרות, תאורה ופרטי גמר. לכן בחירת פתרון האוויר צריכה להיעשות כחלק מהתכנון הכולל ולא כהחלטה שמתקבלת בסופו.",
        "אנחנו עובדים יחד עם אנשי המקצוע של הפרויקט כדי לחבר בין דרישות המערכת לבין החזון האדריכלי, וליצור פתרונות שמשתלבים באופן טבעי בתקרה, בקירות, בנגרות וביתר מרכיבי החלל.",
        "כך נראית מבחינתנו אדריכלות טובה: כל מערכת ממלאת את תפקידה, וכל פרט משתלב בשפה אחת ברורה, מדויקת ושלמה."])),
    ("about_band_title", "about", "הרצועה הכהה – כותרת" + RICH, "rich", "**כשהאוויר הופך לחלק מהאדריכלות**"),
    ("about_band_text", "about", "הרצועה הכהה – טקסט (הפסקה הראשונה גדולה)" + PARAS, "textarea", "\n".join([
        "זהו העיקרון שמוביל את חברת STRIPLINE בכל פרויקט.",
        "שילוב של ניסיון מצטבר, ייצור ישראלי, הבנה עמוקה של עולם המיזוג ורגישות לפרטים האדריכליים — כדי ליצור פתרונות שנראים נכון, עובדים נכון ומרגישים כחלק טבעי מהחלל."])),
    ("about_factory_title", "about", "המפעל – כותרת" + RICH, "rich", "תכירו את המפעל של חברת STRIPLINE **באזור התעשייה שחק**"),
    ("about_factory_text", "about", "המפעל – טקסט (הפסקה הראשונה גדולה)" + PARAS, "textarea", "\n".join([
        "מאחורי הפתרונות האדריכליים של STRIPLINE עומד מפעל ייצור ישראלי, 30 עובדים ומערך ייצור מקצועי המשלב חיתוך, הרכבה, הלחמה, צביעה וגימור.",
        "אלפי מוצרים יוצאים מהמפעל שלנו מדי שנה ומגיעים למאות לקוחות ולעשרות פרויקטי בנייה. במפעל פועלות מחלקות ייצור המתמחות בחיתוך, הרכבה, הלחמה, צביעה וגימור."])),
    ("about_video", "about", "סרטון המפעל", "video", "/video/factory-720.mp4"),
    ("about_video_poster", "about", "תמונה על סרטון המפעל", "image", "/video/hero-poster.webp"),
    ("about_exp_title", "about", "\"הניסיון שלנו\" – כותרת" + RICH, "rich", "הניסיון שלנו נבנה ממאות פרויקטים."),
    ("about_exp_text", "about", "\"הניסיון שלנו\" – טקסט" + PARAS, "textarea", "\n".join([
        "מאחורי העשייה שלנו עומד צוות מקצועי, שמכיר את תהליכי הייצור לפרטי פרטים. כל הזמנה שמגיעה למפעל עוברת דרך הידיים המיומנות של העובדים וכל מחלקה תורמת את חלקה בדרך למוצר המוגמר.",
        "לאורך השנים זכינו לשרת אלפי לקוחות ולעבוד עם עשרות קבלנים מובילים, אדריכלים ומעצבי פנים. כל פרויקט הביא איתו דרישות משלו, וכל הזמנה הוסיפה עוד ידע וניסיון.",
        "היום, היכולת הזו מאפשרת לנו להציע מגוון רחב של פתרונות אוויר מעוצבים לצד ייצור בהתאמה אישית, במידות שונות, בגימורים מגוונים ובמבחר צבעים מתוך מניפת RAL."])),
    ("about_custom_image", "about", "\"התאמה אישית\" – תמונה", "image", "/n/n-villa-modern.webp"),
    ("about_custom_title", "about", "\"התאמה אישית\" – כותרת" + RICH, "rich", "STRIPLINE משלבת את הדיוק של התעשייה עם הדרישות של האדריכלות המודרנית"),
    ("about_custom_text", "about", "\"התאמה אישית\" – טקסט" + PARAS, "textarea", "\n".join([
        "ההתאמה האישית היא חלק משמעותי מהעשייה שלנו. לפעמים מדובר במידה מדויקת שנדרשת לחלל מסוים, לפעמים בגוון שמשתלב עם התקרה או הקיר ולפעמים בפתרון מיוחד שמתחיל מרעיון של אדריכל או מעצב.",
        "במקרים האלה נכנסים לתמונה אנשי המקצוע שלנו. הסוכנים מלווים את הלקוחות, מבינים את הצרכים ובוחנים את האפשרויות. כשהפתרון מתגבש, ההזמנה מגיעה למפעל ושם הידע והניסיון של צוות הייצור מקבלים ביטוי. בחיתוך המדויק, בחיבורים, בצביעה ובגימור הסופי. בכל הפרטים הקטנים שמעניקים למוצר את המראה שלו ואת היכולת להשתלב בחלל בצורה טבעית ואלגנטית."])),
    ("about_idea", "about", "\"הרעיון הבא שלכם\" – פסקה בכל שורה. שורה שמתחילה ב-+ גדולה, ב-# כותרת, ב-! מודגשת" + RICH, "textarea", "\n".join([
        "+ אנחנו אוהבים את מה שאנחנו עושים. אוהבים לראות מוצר יוצא מהמפעל, מגיע לפרויקט והופך לחלק מהאדריכלות שלו.",
        "בסופו של דבר, מאחורי כל מוצר שיוצא מהמפעל שלנו נמצאים אנשים, ניסיון, מקצועיות והרבה מאוד עשייה.",
        "# ויש לנו מקום גם לרעיון הבא שלכם.",
        "! יש לכם רעיון לפתרון מיזוג אוויר מעוצב? אנחנו יודעים לייצר אותו.",
        "הצוות המקצועי שלנו ישמח לבחון את הצורך יחד איתכם, לבדוק את אפשרויות הביצוע ולסייע במציאת פתרון שניתן לייצר גם מעבר למידות הסטנדרטיות."])),
    ("about_close", "about", "משפט הסיום של המפעל" + RICH, "rich", "עוצמה תעשייתית. **דיוק אדריכלי.**"),
    ("about_partners_title", "about", "\"עובדים לצד\" – כותרת", "text", "עובדים לצד"),
    ("about_partners", "about", "\"עובדים לצד\" – שורה לכל אחד", "lines", ["אדריכלים", "מעצבי פנים", "יועצי מיזוג"]),
    ("about_wordmark", "about", "הלוגו שלפני הסלוגן", "image", "/n/stripline-wordmark.svg"),
    ("about_summary", "about", "הסלוגן ליד הלוגו", "text", "יוצאים מהקווים בשבילכם"),
    ("about_cta_title", "about", "רצועת הסיום – כותרת" + RICH, "rich", "יש לכם חלל בתכנון? **בואו נדייק לו את האוויר.**"),
    ("about_cta_text", "about", "רצועת הסיום – טקסט", "textarea", "שלחו לנו תוכנית, פרט או תיאור קצר של הפרויקט, ונחשוב יחד על פתרון שישתלב נכון בחלל."),
    ("about_cta_links", "about", "רצועת הסיום – כפתורים: תווית | /כתובת", "links", [
        {"label": "שלחו תוכנית", "href": "/contact"}, {"label": "לעיון בקטלוג", "href": "/catalog"}]),

    # ---- products (families)
    ("products_title", "products", "כותרת העמוד (וגם קישור החזרה מעמודי המשפחות)", "text", "משפחות מוצרים"),
    ("products_image", "products", "תמונה ראשית", "image", "/n/n-office.webp"),
    ("products_search", "products", "חיפוש – טקסט בתיבה", "text", "חיפוש מוצר לפי שם או מק״ט"),
    ("products_none", "products", "חיפוש – אין תוצאות", "text", "לא נמצאו מוצרים"),
    ("products_more", "products", "חיפוש – עוד תוצאות ({n} = המספר)", "text", "ועוד {n} מוצרים"),
    ("card_more", "products", "כרטיס מוצר – \"לפרטי המוצר\"", "text", "לפרטי המוצר"),

    # ---- product page
    ("pp_sizes", "product", "כותרת \"מידות\"", "text", "מידות"),
    ("pp_length", "product", "\"אורך\" לפני רשימת האורכים", "text", "אורך (L):"),
    ("pp_height", "product", "\"גובה\" לפני רשימת הגבהים", "text", "גובה (H):"),
    ("pp_mm", "product", "יחידת המידה", "text", "מ״מ"),
    ("pp_materials", "product", "כותרת \"חומרים וגימור\"", "text", "חומרים וגימור"),
    ("pp_accessories", "product", "כותרת \"אביזרים\"", "text", "אביזרים"),
    ("pp_usage", "product", "כותרת \"שימוש\"", "text", "שימוש"),
    ("pp_sheet_btn", "product", "כפתור דף מוצר PDF", "text", "הורדת דף מוצר PDF"),
    ("pp_wa_title", "product", "כפתורי וואטסאפ – כותרת מעל הכפתורים", "text", "מעוניינים במוצר הזה? יש לכם שאלה?"),
    ("pp_wa_sub", "product", "כפתורי וואטסאפ – שורה מתחת לכותרת", "text", "צוות STRIPLINE זמין לכם בוואטסאפ"),
    ("pp_whatsapp_msg", "product", "הודעת הוואטסאפ המוכנה בכפתורי \"דברו עם\" ({product} = שם המוצר והמק\"ט)", "text", "היי, ראיתי את המוצר {product} באתר ואשמח לקבל פרטים"),
    ("pp_drawing", "product", "\"שרטוט טכני\" (כפתור, חלון וכותרת)", "text", "שרטוט טכני"),
    ("pp_install", "product", "\"הוראות התקנה\" (כפתור וחלון)", "text", "הוראות התקנה"),
    ("pp_pdf", "product", "כפתור \"הורדת PDF\" (בחלונות ובקטלוג)", "text", "הורדת PDF"),
    ("pp_drawing_note", "product", "טקסט השרטוט כשאין הערה למוצר", "text", "שרטוט היצרן מתוך הקטלוג, עם מידות ההתקנה."),
    ("pp_drawing_pdf", "product", "כפתור הורדת השרטוט", "text", "הורדת השרטוט PDF"),
    ("pp_drawing_empty", "product", "כשאין שרטוט", "text", "המידות ופרטי ההרכבה מופיעים בדף המוצר להורדה."),
    ("pp_related", "product", "\"עוד ב...\" לפני שם המשפחה", "text", "עוד ב"),
    ("pp_cta_title", "product", "רצועת הסיום – כותרת" + RICH, "rich", "צריכים מידה, גוון או פרט מיוחד? **נשמח לעזור.**"),
    ("pp_cta_text", "product", "רצועת הסיום – טקסט", "textarea", "שלחו לנו תוכנית או תיאור קצר של החלל, ונחזור אליכם עם הצעה לפתרון המתאים."),
    ("pp_cta_contact", "product", "רצועת הסיום – כפתור יצירת קשר", "text", "צרו קשר"),
    ("pp_cta_catalog", "product", "רצועת הסיום – כפתור קטלוג", "text", "לעיון בקטלוג"),
    ("pp_modal_note", "product", "חלון השרטוט – טקסט כשאין הערה", "text", "שרטוט היצרן מתוך הקטלוג"),
    ("pp_modal_figure", "product", "חלון השרטוט – \"איור X מתוך Y\" ({n}, {total})", "text", "איור {n} מתוך {total}"),
    ("pp_install_source", "product", "חלון ההתקנה – מקור כשלא צוין", "text", "לפי קטלוג הספק"),
    ("pp_install_empty", "product", "חלון ההתקנה – כשאין שרטוט", "text", "המידות ופרטי ההרכבה מופיעים בדף הקטלוג הטכני של המוצר."),
    ("pp_fig_maker", "product", "חלון ההתקנה – כיתוב שרטוט יצרן", "text", "שרטוט יצרן"),
    ("pp_fig_schematic", "product", "חלון ההתקנה – כיתוב איור סכמטי", "text", "איור סכמטי / נתוני מוצר"),
    ("pp_fig_connection", "product", "חלון ההתקנה – כיתוב פרט חיבור", "text", "פרט חיבור למסגרת CC"),
    ("pp_fig_product", "product", "חלון ההתקנה – כיתוב תמונת המוצר", "text", "תמונת המוצר"),
    ("pp_install_title", "product", "הוראות התקנה כשלא הוזנו – כותרת", "text", "שיטת התקנה"),
    ("pp_install_text", "product", "הוראות התקנה כשלא הוזנו – טקסט", "text", "פרטי ההתקנה מפורטים בדף הקטלוג הטכני המצורף למוצר."),
    ("pp_install_acc", "product", "הוראות התקנה כשלא הוזנו – כותרת האביזרים", "text", "אביזרים נלווים"),

    # ---- product sheet PDF
    ("sheet_logo", "sheet", "לוגו (PNG)", "image", "/n/stripline-logo-dark.png"),
    ("sheet_label", "sheet", "\"דף מוצר\" בראש הדף", "text", "דף מוצר"),
    ("sheet_preview", "sheet", "מעל התצוגה המקדימה", "text", "תצוגה מקדימה של דף המוצר"),
    ("sheet_family", "sheet", "\"משפחה:\"", "text", "משפחה:"),
    ("sheet_code", "sheet", "\"מק״ט:\"", "text", "מק״ט:"),
    ("sheet_drawing_empty", "sheet", "כשאין שרטוט", "text", "פרטי המוצר וטבלאות המידות מופיעים בדף הקטלוג הטכני המצורף."),
    ("sheet_finishes", "sheet", "כותרת אפשרויות הגימור", "text", "אפשרויות גימור"),
    ("sheet_finish_list", "sheet", "אפשרויות הגימור – שורה לכל גוון: שם | תיאור | צבע (#hex)", "rows", [
        ["RAL 9016", "סטנדרטי", "#f4f4f2"], ["RAL 9005", "שחור", "#111111"], ["RAL 9006", "אפור", "#a3a5a6"],
        ["צבע לפי דרישה", "(RAL)", "linear-gradient(135deg,#b8894a,#e9d3b0)"]]),
    ("sheet_scan", "sheet", "מתחת לברקוד", "text", "סריקה לעמוד המוצר"),
    ("sheet_error", "sheet", "הודעת שגיאה", "text", "לא הצלחנו ליצור את ה־PDF. אפשר לנסות שוב או להוריד את דף הקטלוג המקורי."),
    ("sheet_original", "sheet", "קישור לדף הקטלוג המקורי", "text", "דף הקטלוג המקורי"),

    # ---- catalogue
    ("catalog_title", "catalog", "כותרת העמוד", "text", "קטלוג מוצרים"),
    ("catalog_toc", "catalog", "\"תוכן עניינים\"", "text", "תוכן עניינים"),
    ("catalog_page", "catalog", "\"עמ׳\" ליד מספר העמוד", "text", "עמ׳"),
    ("catalog_jump", "catalog", "\"מעבר לעמוד\"", "text", "מעבר לעמוד"),
    ("catalog_go", "catalog", "כפתור \"מעבר\"", "text", "מעבר"),
    ("catalog_jump_err", "catalog", "שגיאת מספר עמוד ({total} = מספר העמודים)", "text", "יש להזין מספר עמוד בין 1 ל־{total}"),

    # ---- projects
    ("projects_title", "projects", "כותרת העמוד", "text", "פרויקטים"),
    ("projects_image", "projects", "תמונה ראשית", "image", "/n/n-office.webp"),
    ("projects_empty", "projects", "כשאין פרויקטים", "text", None),
    ("project_link", "projects", "קישור לעמוד הפרויקט", "text", "לעמוד הפרויקט"),
    ("projects_cta_title", "projects", "רצועת הסיום – כותרת" + RICH, "rich", None),
    ("projects_cta_text", "projects", "רצועת הסיום – טקסט", "textarea", None),
    ("projects_cta_links", "projects", "רצועת הסיום – כפתורים: תווית | /כתובת", "links", [{"label": "צרו קשר", "href": "/contact"}]),
    ("project_back", "projects", "עמוד פרויקט – קישור החזרה", "text", "כל הפרויקטים"),
    ("project_fact_type", "projects", "עמוד פרויקט – \"תחום\"", "text", "תחום"),
    ("project_fact_location", "projects", "עמוד פרויקט – \"מיקום\"", "text", "מיקום"),
    ("project_fact_year", "projects", "עמוד פרויקט – \"שנה\"", "text", "שנה"),
    ("project_fact_products", "projects", "עמוד פרויקט – \"מוצרים\"", "text", "מוצרים"),
    ("project_story_label", "projects", "עמוד פרויקט – כותרת התיאור", "text", None),
    ("project_products_label", "projects", "עמוד פרויקט – כותרת המוצרים", "text", None),

    # ---- contact
    ("contact_image", "contact", "תמונה ראשית", "image", "/n/n-contact-office.webp"),
    ("contact_title", "contact", "כותרת", "text", None),
    ("contact_text", "contact", "טקסט", "textarea", None),
    ("contact_agents_title", "contact", "אנשי הקשר – כותרת", "text", "לייעוץ, תכנון והזמנות"),
    ("contact_agents_text", "contact", "אנשי הקשר – טקסט" + RICH, "rich", "הצוות המקצועי של STRIPLINE עומד לשירותכם"),
    ("contact_whatsapp", "contact", "קישור הוואטסאפ", "text", "וואטסאפ ←"),
    ("contact_email_label", "contact", "\"אימייל\"", "text", "אימייל"),
    ("contact_address_label", "contact", "\"כתובת\"", "text", "כתובת"),
    ("contact_attach_title", "contact", "\"כדאי לציין\" – כותרת", "text", None),
    ("contact_attach", "contact", "\"כדאי לציין\" – שורה לכל פריט", "lines", None),

    # ---- contact form
    ("form_about", "form", "\"פנייה בנושא\" (כשמגיעים מעמוד מוצר)", "text", "פנייה בנושא"),
    ("form_name", "form", "שם", "text", "שם מלא"),
    ("form_name_err", "form", "שם – שגיאה", "text", "נא למלא שם מלא"),
    ("form_tel", "form", "טלפון", "text", "טלפון"),
    ("form_tel_err", "form", "טלפון – שגיאה", "text", "מספר הטלפון לא תקין"),
    ("form_email", "form", "אימייל", "text", "אימייל"),
    ("form_email_err", "form", "אימייל – שגיאה", "text", "נא למלא כתובת אימייל תקינה"),
    ("form_optional", "form", "\"לא חובה\"", "text", "לא חובה"),
    ("form_role", "form", "שאלת התפקיד", "text", "מה התפקיד שלכם?"),
    ("form_roles", "form", "התפקידים – שורה לכל אחד", "lines", ["אדריכל/ית", "מעצב/ת פנים", "יועץ/ת מיזוג", "קבלן", "לקוח פרטי"]),
    ("form_msg", "form", "שדה ההודעה", "text", "איך נוכל לעזור?"),
    ("form_consent", "form", "אישור התנאים" + RICH, "rich", "קראתי ואני מסכים/ה ל[תנאי השימוש](/terms) ול[מדיניות הפרטיות](/privacy)"),
    ("form_consent_err", "form", "אישור התנאים – שגיאה", "text", "יש לאשר את תנאי השימוש ומדיניות הפרטיות"),
    ("form_news", "form", "הרשמה לעדכונים", "text", "אשמח לקבל עדכונים על מוצרים ופרויקטים חדשים"),
    ("form_send", "form", "כפתור שליחה", "text", "שליחת הפנייה"),
    ("form_sending", "form", "כפתור שליחה – בזמן השליחה", "text", "שולחים..."),
    ("form_note", "form", "שורה מתחת לכפתור", "text", "הפרטים משמשים רק כדי לחזור אליכם."),
    ("form_fail", "form", "כשהשליחה נכשלה (האימייל מתווסף בסוף)" + RICH, "rich", "**הפנייה לא נשלחה.** אפשר לנסות שוב, או לכתוב לנו ישירות ל־"),

    # ---- thank-you and 404
    ("thanks_title", "pages", "תודה – כותרת", "text", "תודה, הפנייה התקבלה."),
    ("thanks_text", "pages", "תודה – טקסט", "text", "נציג מהצוות יחזור אליכם לפי הפרטים שהשארתם."),
    ("thanks_links", "pages", "תודה – קישורים: תווית | /כתובת (הראשון כפתור)", "links", [
        {"label": "למשפחות המוצרים", "href": "/products"}, {"label": "לדף הבית", "href": "/"}]),
    ("notfound_title", "pages", "404 – כותרת", "text", "העמוד הזה לא קיים."),
    ("notfound_text", "pages", "404 – טקסט", "text", "ייתכן שהקישור השתנה. אפשר להמשיך מכאן:"),
    ("notfound_links", "pages", "404 – קישורים: תווית | /כתובת", "links", [
        {"label": "דף הבית", "href": "/"}, {"label": "משפחות מוצרים", "href": "/products"},
        {"label": "פרויקטים", "href": "/projects"}, {"label": "דברו איתנו", "href": "/contact"}]),

    # ---- legal (rich editor)
    *[x for page, label in [("privacy", "מדיניות פרטיות"), ("terms", "תנאי שימוש"), ("accessibility", "הצהרת נגישות")] for x in [
        (f"{page}_title", "legal", f"{label} – כותרת", "text", legal[page]["title"]),
        (f"{page}_meta", "legal", f"{label} – שורה מתחת לכותרת", "html", legal[page]["meta"]),
        (f"{page}_body", "legal", f"{label} – תוכן", "html", legal[page]["body"].strip()),
    ]],

    # ---- SEO
    ("seo_suffix", "seo", "סיומת לכל כותרת בלשונית הדפדפן (אחרי שם האתר בדף הבית)", "text", "פתרונות אוויר אדריכליים"),
    ("seo_home_desc", "seo", "דף הבית – תיאור לגוגל (ריק = הכותרת הראשית)", "textarea", ""),
    ("seo_about_title", "seo", "אודות – כותרת", "text", "אודות"),
    ("seo_about_desc", "seo", "אודות – תיאור", "textarea", "קרוב ל-30 שנה בעולם המיזוג, הבנייה והתכנון. מפעל ישראלי לפתרונות אוויר אדריכליים."),
    ("seo_products_desc", "seo", "משפחות מוצרים – תיאור", "textarea", "תריסים, מפזרים ופתרונות אוויר אדריכליים. חיפוש לפי שם או מק״ט."),
    ("seo_projects_desc", "seo", "פרויקטים – תיאור", "textarea", "פרויקטים שבהם מוצרי STRIPLINE שולבו בתכנון האדריכלי."),
    ("seo_contact_title", "seo", "דברו איתנו – כותרת", "text", "דברו איתנו"),
    ("seo_contact_desc", "seo", "דברו איתנו – תיאור", "textarea", "השאירו פרטים ונחזור אליכם עם ייעוץ, מפרטים והצעת מחיר."),
    ("seo_catalog_desc", "seo", "קטלוג – תיאור", "textarea", "הקטלוג המדפדף של STRIPLINE: בכל כפולה תמונת האווירה של המוצר ולצידה עמוד פרטי המוצר, עם תוכן עניינים ומעבר לפי מספר עמוד."),
    ("seo_thanks_title", "seo", "תודה – כותרת", "text", "תודה"),

    # ---- the unlinked /professional page
    ("pro_kicker", "professional", "שורה עליונה", "text", None),
    ("pro_title", "professional", "כותרת", "text", None),
    ("pro_text", "professional", "טקסט", "textarea", None),
    ("catalog_pdf", "professional", "קובץ הקטלוג הטכני המלא (PDF)", "file", None),
    ("catalog_pdf_page_offset", "professional", "היסט עמודים בקובץ (0 אם עמוד 1 בקובץ = עמוד 1 בקטלוג)", "text", None),
]

LTR = {"email", "phone", "website", "site_tagline", "catalog_pdf_page_offset"}
URL_TYPES = {"image", "file", "video"}


def current_value(key: str, seed: dict, live: dict):
    """What the live site shows today: the WordPress value when one is saved, else the site default."""
    if key in live:
        return live[key]
    if key in seed:
        return seed[key]
    raise SystemExit(f"no current value for {key}")


def php_str(s: str) -> str:
    return "'" + s.replace("\\", "\\\\").replace("'", "\\'") + "'"


def main() -> None:
    # The copy before the CMS move and the WordPress values saved then: together, what the site showed.
    seed = json.loads((ROOT / "tmp" / "cms" / "site-settings-original.json").read_text(encoding="utf-8"))
    live = json.loads((ROOT / "tmp" / "cms" / "wp-settings-backup-2026-10-26.json").read_text(encoding="utf-8"))
    keys = [f[0] for f in F]
    assert len(keys) == len(set(keys)), "duplicate keys"
    assert all(f[1] in GROUPS for f in F)

    defaults = {}
    for key, _group, _label, _type, default in F:
        defaults[key] = current_value(key, seed, live) if default is None else default
    # WordPress media saved before SSL comes back as http://; keep the defaults on https.
    defaults = json.loads(json.dumps(defaults, ensure_ascii=False).replace("http://stripline-cms.olas.co.il", "https://stripline-cms.olas.co.il"))

    dump = lambda d: json.dumps(d, ensure_ascii=False, indent=2) + "\n"
    # The site keeps the older keys too (the unlinked pages still read some of them).
    (SITE_DATA / "settings.json").write_text(dump({**seed, **defaults}), encoding="utf-8")
    (PLUGIN / "seed" / "settings.json").write_text(dump(defaults), encoding="utf-8")

    ts_types = {
        "lines": "string[]", "gallery": "string[]", "links": "Link[]", "pairs": "{ title: string; text: string }[]", "logos": "{ title: string; text: string }[]",
        "cards": "{ title: string; text: string; label: string; href: string }[]",
        "agents": "{ name: string; phone: string; whatsapp: string }[]", "rows": "string[][]",
    }
    ts = ["// Generated by tools/cms_content.py: every field of WordPress > תוכן האתר.", 'import type { Link } from "./types";', "",
          "export type CmsSettings = {"]
    ts += [f"  /** {GROUPS[group]}: {label} */\n  {key}: {ts_types.get(typ, 'string')};" for key, group, label, typ, _ in F]
    ts += ["};", ""]
    (ROOT / "site" / "src" / "lib" / "cms-settings.ts").write_text("\n".join(ts), encoding="utf-8")

    php = PLUGIN / "includes" / "fields.php"
    src = php.read_text(encoding="utf-8")
    rows = []
    for key, group, label, typ, _ in F:
        ltr = ", 'ltr'" if key in LTR or typ in URL_TYPES else ""
        rows.append(f"        {php_str(key)} => [{php_str(group)}, {php_str(label)}, {php_str(typ)}{ltr}],")
    groups = "\n".join(f"        {php_str(k)} => {php_str(v)}," for k, v in GROUPS.items())
    for marker, body in (("GROUPS", groups), ("FIELDS", "\n".join(rows))):
        pattern = rf"(// CMS-{marker}-START\n).*?(^[ \t]*// CMS-{marker}-END)"
        src, n = re.subn(pattern, lambda m: m.group(1) + body + "\n" + m.group(2), src, flags=re.S | re.M)
        assert n == 1, marker
    php.write_text(src, encoding="utf-8")
    print(f"{len(F)} fields in {len(GROUPS)} tabs")


if __name__ == "__main__":
    main()
