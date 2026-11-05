<?php
/**
 * Single source of truth for product / project meta fields.
 * type: text | textarea | lines (one item per line) | image | file | video | gallery (images, one URL per line)
 *       | products (product slugs, one per line) | check | json
 */
if (!defined('ABSPATH')) exit;

function stripline_product_fields(): array {
    return [
        'code'              => ['label' => 'מק״ט (אנגלית, למשל DD, DD1)', 'type' => 'text', 'dir' => 'ltr'],
        'name'              => ['label' => 'שם המוצר באנגלית (EILAT)', 'type' => 'text', 'dir' => 'ltr'],
        'name_he'           => ['label' => 'שם המוצר בעברית', 'type' => 'text'],
        'subtitle_he'       => ['label' => 'כותרת משנה (גריל פליטת אוויר)', 'type' => 'text'],
        'short_he'          => ['label' => 'תיאור קצר (כרטיס / קטלוג)', 'type' => 'textarea'],
        'description_he'    => ['label' => 'תיאור מלא', 'type' => 'textarea'],
        'features_he'       => ['label' => 'חמש נקודות בולטות (שורה לכל נקודה)', 'type' => 'lines'],
        'sizes_he'          => ['label' => 'מידות (שורה לכל שורה)', 'type' => 'lines'],
        'accessories_he'    => ['label' => 'אביזרים (שורה לכל פריט)', 'type' => 'lines'],
        'materials_he'      => ['label' => 'חומרים וגימור (שורה לכל פריט)', 'type' => 'lines'],
        'usage_he'          => ['label' => 'שימוש', 'type' => 'textarea'],
        'lengths'           => ['label' => 'אורכים זמינים (מ״מ, שורה לכל ערך)', 'type' => 'lines', 'dir' => 'ltr'],
        'heights'           => ['label' => 'גבהים זמינים (מ״מ, שורה לכל ערך)', 'type' => 'lines', 'dir' => 'ltr'],
        'install_he'        => ['label' => 'הוראות התקנה – כותרת ואחריה שורות עם "- " (ראו דוגמה)', 'type' => 'install'],
        'image'             => ['label' => 'תמונת מוצר (על רקע בהיר)', 'type' => 'image'],
        'hero_image'        => ['label' => 'תמונת אווירה לעמוד המוצר (אופציונלי)', 'type' => 'image'],
        'drawing_image'     => ['label' => 'שרטוט טכני (תמונה, אופציונלי)', 'type' => 'image'],
        'drawing_images'    => ['label' => 'שרטוטים נוספים (גררו לשינוי הסדר)', 'type' => 'gallery'],
        'drawing_pdf_url'   => ['label' => 'שרטוט טכני PDF', 'type' => 'file'],
        'drawing_note'      => ['label' => 'הערה לשרטוט', 'type' => 'textarea'],
        'drawing_kind'      => ['label' => 'סוג השרטוט (טכני, לא לשנות)', 'type' => 'text', 'dir' => 'ltr'],
        'installation_pdf_url'       => ['label' => 'הוראות התקנה PDF', 'type' => 'file'],
        'installation_drawing_image' => ['label' => 'שרטוט התקנה (תמונה)', 'type' => 'image'],
        'installation_source'        => ['label' => 'מקור הוראות ההתקנה (טכני, לא לשנות)', 'type' => 'text', 'dir' => 'ltr'],
        'dwg_url'           => ['label' => 'קובץ DWG', 'type' => 'file'],
        'pdf_url'           => ['label' => 'דף קטלוג טכני PDF', 'type' => 'file'],
        'catalog_pages'     => ['label' => 'עמודי קטלוג (למשל 7-8)', 'type' => 'text', 'dir' => 'ltr'],
        'featured'          => ['label' => 'להציג בעמוד הבית', 'type' => 'check'],
        'description_en'    => ['label' => 'Description (EN)', 'type' => 'textarea', 'dir' => 'ltr'],
        'application_en'    => ['label' => 'Application (EN)', 'type' => 'text', 'dir' => 'ltr'],
        'characteristics_en'=> ['label' => 'Characteristics (EN, one per line)', 'type' => 'lines', 'dir' => 'ltr'],
        'accessories_en'    => ['label' => 'Accessories (EN, one per line)', 'type' => 'lines', 'dir' => 'ltr'],
        'materials_en'      => ['label' => 'Materials (EN, one per line)', 'type' => 'lines', 'dir' => 'ltr'],
        'assembly_en'       => ['label' => 'Assembly (EN, one per line)', 'type' => 'lines', 'dir' => 'ltr'],
    ];
}

function stripline_project_fields(): array {
    return [
        'location'       => ['label' => 'מיקום', 'type' => 'text'],
        'year'           => ['label' => 'שנה', 'type' => 'text', 'dir' => 'ltr'],
        'type'           => ['label' => 'סוג (מגורים / משרדים / מסחר)', 'type' => 'text'],
        'description_he' => ['label' => 'תיאור', 'type' => 'textarea'],
        'image'          => ['label' => 'תמונה ראשית', 'type' => 'image'],
        'gallery'        => ['label' => 'גלריה (גררו לשינוי הסדר)', 'type' => 'gallery'],
        'products'       => ['label' => 'מוצרים בפרויקט', 'type' => 'products'],
    ];
}

/** Tabs of the settings screen, in order. */
function stripline_settings_groups(): array {
    return [
        // CMS-GROUPS-START
        'general' => 'כללי, תפריט ופוטר',
        'home' => 'עמוד הבית',
        'about' => 'אודות',
        'products' => 'משפחות מוצרים',
        'product' => 'עמוד מוצר',
        'sheet' => 'דף מוצר PDF',
        'catalog' => 'קטלוג',
        'projects' => 'פרויקטים',
        'contact' => 'דברו איתנו',
        'form' => 'טופס פנייה',
        'pages' => 'תודה ו-404',
        'legal' => 'עמודים משפטיים',
        'seo' => 'גוגל (SEO)',
        'professional' => 'מרחב מקצועי (עמוד לא מקושר)',
        // CMS-GROUPS-END
    ];
}

/**
 * Every text, list and image on the site. A saved field is shown as saved, even when emptied (so a
 * text can be removed); a field never saved shows the default copy, given here as the placeholder.
 * Types: text, textarea, rich (textarea with **bold**, [link](/href), STRIPLINE = the wordmark),
 * html (rich editor), image / file / video (uploaded to the media library), gallery (images), lines (one item per line),
 * pairs ("כותרת | טקסט", // = new paragraph), logos (pairs of name | image), links ("תווית | /קישור"), cards ("כותרת | טקסט | תווית | /קישור"),
 * agents ("שם | טלפון | וואטסאפ"), rows (cells split by |).
 */
function stripline_settings_fields(): array {
    // Generated by tools/cms_content.py, which also writes the default copy (seed/settings.json).
    $f = [
        // CMS-FIELDS-START
        'site_name' => ['general', 'שם האתר', 'text'],
        'site_tagline' => ['general', 'סלוגן באנגלית (טקסט חלופי ללוגו)', 'text', 'ltr'],
        'logo_dark' => ['general', 'לוגו כהה (כותרת עליונה ופוטר)', 'image', 'ltr'],
        'logo_light' => ['general', 'לוגו לבן (על תמונות)', 'image', 'ltr'],
        'address' => ['general', 'כתובת', 'text'],
        'email' => ['general', 'אימייל', 'text', 'ltr'],
        'phone' => ['general', 'טלפון', 'text', 'ltr'],
        'website' => ['general', 'כתובת אתר (מודפסת בדף המוצר PDF)', 'text', 'ltr'],
        'solutions_agents' => ['general', 'אנשי מכירות – שורה לכל אחד: שם | טלפון | וואטסאפ (972…)', 'agents'],
        'agent_cta' => ['general', 'כפתור וואטסאפ – מילים לפני השם', 'text'],
        'nav_links' => ['general', 'תפריט עליון – שורה לכל קישור: תווית | /כתובת', 'links'],
        'footer_links' => ['general', 'קישורי פוטר – שורה לכל קישור: תווית | /כתובת', 'links'],
        'visual_disclosure' => ['general', 'תווית על תמונות פרויקטים', 'text'],
        'default_scene' => ['general', 'תמונת אווירה כשאין תמונה למשפחה או למוצר', 'image', 'ltr'],
        'hero_title' => ['home', 'כותרת ראשית – שורה לכל שורת כותרת (**מודגש**, [קישור](/כתובת))', 'textarea'],
        'hero_subtitle' => ['home', 'כותרת משנה', 'textarea'],
        'book_cta' => ['home', 'כפתור הקטלוג (בהירו ובאזור הקטלוג)', 'text'],
        'hero_video' => ['home', 'סרטון ההירו (מחשב)', 'video', 'ltr'],
        'hero_video_mobile' => ['home', 'סרטון ההירו (נייד, קובץ קטן יותר)', 'video', 'ltr'],
        'hero_poster' => ['home', 'תמונה עד שהסרטון נטען', 'image', 'ltr'],
        'home_cards' => ['home', 'שלושת השערים מתחת להירו – שורה לכל שער: כותרת | טקסט | תווית הקישור | /קישור', 'cards'],
        'book_title' => ['home', 'אזור הקטלוג – כותרת', 'textarea'],
        'solutions_heading' => ['home', 'פתרונות – כותרת (**מודגש**, [קישור](/כתובת))', 'rich'],
        'solutions_intro' => ['home', 'פתרונות – טקסט – פסקה בכל שורה (**מודגש**, [קישור](/כתובת))', 'lines'],
        'sol_images' => ['home', 'פתרונות – תמונות מתחלפות (גררו לשינוי הסדר)', 'gallery'],
        'solutions_items' => ['home', 'פתרונות – הרשימה הנפתחת, שורה לכל פתרון: כותרת | טקסט (// לפסקה חדשה)', 'pairs'],
        'air_image' => ['home', 'רצועת הסיום – תמונה', 'image', 'ltr'],
        'solutions_closing_title' => ['home', 'רצועת הסיום – כותרת (**מודגש**, [קישור](/כתובת))', 'rich'],
        'solutions_closing_text' => ['home', 'רצועת הסיום – טקסט', 'textarea'],
        'solutions_closing_kicker' => ['home', 'רצועת הסיום – שורה מעל הכפתורים', 'text'],
        'air_link' => ['home', 'רצועת הסיום – קישור: תווית | /כתובת', 'links'],
        'about_image' => ['about', 'תמונה ראשית', 'image', 'ltr'],
        'about_title' => ['about', 'כותרת ראשית – שורה לכל שורת כותרת (**מודגש**, [קישור](/כתובת))', 'textarea'],
        'about_text' => ['about', 'פתיחה – פסקה בכל שורה (**מודגש**, [קישור](/כתובת))', 'textarea'],
        'about_stats' => ['about', 'שני המספרים – שורה לכל אחד: מספר | טקסט', 'pairs'],
        'about_dark' => ['about', 'המשבצת הכהה (**מודגש**, [קישור](/כתובת))', 'rich'],
        'about_intro_image' => ['about', 'תמונה ליד המספרים', 'image', 'ltr'],
        'about_clients_title' => ['about', 'לקוחות – כותרת', 'text'],
        'about_clients_text' => ['about', 'לקוחות – טקסט', 'text'],
        'about_clients' => ['about', 'לקוחות – לוגו ושם לכל חברה', 'logos'],
        'about_split_image' => ['about', '"פתרון שמתוכנן יחד עם החלל" – תמונה', 'image', 'ltr'],
        'about_split_title' => ['about', '"פתרון שמתוכנן יחד עם החלל" – כותרת (**מודגש**, [קישור](/כתובת))', 'rich'],
        'about_split_text' => ['about', '"פתרון שמתוכנן יחד עם החלל" – טקסט (הפסקה הראשונה מודגשת) – פסקה בכל שורה (**מודגש**, [קישור](/כתובת))', 'textarea'],
        'about_band_title' => ['about', 'הרצועה הכהה – כותרת (**מודגש**, [קישור](/כתובת))', 'rich'],
        'about_band_text' => ['about', 'הרצועה הכהה – טקסט (הפסקה הראשונה גדולה) – פסקה בכל שורה (**מודגש**, [קישור](/כתובת))', 'textarea'],
        'about_factory_title' => ['about', 'המפעל – כותרת (**מודגש**, [קישור](/כתובת))', 'rich'],
        'about_factory_text' => ['about', 'המפעל – טקסט (הפסקה הראשונה גדולה) – פסקה בכל שורה (**מודגש**, [קישור](/כתובת))', 'textarea'],
        'about_video' => ['about', 'סרטון המפעל', 'video', 'ltr'],
        'about_video_poster' => ['about', 'תמונה על סרטון המפעל', 'image', 'ltr'],
        'about_exp_title' => ['about', '"הניסיון שלנו" – כותרת (**מודגש**, [קישור](/כתובת))', 'rich'],
        'about_exp_text' => ['about', '"הניסיון שלנו" – טקסט – פסקה בכל שורה (**מודגש**, [קישור](/כתובת))', 'textarea'],
        'about_custom_image' => ['about', '"התאמה אישית" – תמונה', 'image', 'ltr'],
        'about_custom_title' => ['about', '"התאמה אישית" – כותרת (**מודגש**, [קישור](/כתובת))', 'rich'],
        'about_custom_text' => ['about', '"התאמה אישית" – טקסט – פסקה בכל שורה (**מודגש**, [קישור](/כתובת))', 'textarea'],
        'about_idea' => ['about', '"הרעיון הבא שלכם" – פסקה בכל שורה. שורה שמתחילה ב-+ גדולה, ב-# כותרת, ב-! מודגשת (**מודגש**, [קישור](/כתובת))', 'textarea'],
        'about_close' => ['about', 'משפט הסיום של המפעל (**מודגש**, [קישור](/כתובת))', 'rich'],
        'about_partners_title' => ['about', '"עובדים לצד" – כותרת', 'text'],
        'about_partners' => ['about', '"עובדים לצד" – שורה לכל אחד', 'lines'],
        'about_wordmark' => ['about', 'הלוגו שלפני הסלוגן', 'image', 'ltr'],
        'about_summary' => ['about', 'הסלוגן ליד הלוגו', 'text'],
        'about_cta_title' => ['about', 'רצועת הסיום – כותרת (**מודגש**, [קישור](/כתובת))', 'rich'],
        'about_cta_text' => ['about', 'רצועת הסיום – טקסט', 'textarea'],
        'about_cta_links' => ['about', 'רצועת הסיום – כפתורים: תווית | /כתובת', 'links'],
        'products_title' => ['products', 'כותרת העמוד (וגם קישור החזרה מעמודי המשפחות)', 'text'],
        'products_image' => ['products', 'תמונה ראשית', 'image', 'ltr'],
        'products_search' => ['products', 'חיפוש – טקסט בתיבה', 'text'],
        'products_none' => ['products', 'חיפוש – אין תוצאות', 'text'],
        'products_more' => ['products', 'חיפוש – עוד תוצאות ({n} = המספר)', 'text'],
        'card_more' => ['products', 'כרטיס מוצר – "לפרטי המוצר"', 'text'],
        'pp_sizes' => ['product', 'כותרת "מידות"', 'text'],
        'pp_length' => ['product', '"אורך" לפני רשימת האורכים', 'text'],
        'pp_height' => ['product', '"גובה" לפני רשימת הגבהים', 'text'],
        'pp_mm' => ['product', 'יחידת המידה', 'text'],
        'pp_materials' => ['product', 'כותרת "חומרים וגימור"', 'text'],
        'pp_accessories' => ['product', 'כותרת "אביזרים"', 'text'],
        'pp_usage' => ['product', 'כותרת "שימוש"', 'text'],
        'pp_sheet_btn' => ['product', 'כפתור דף מוצר PDF', 'text'],
        'pp_whatsapp_msg' => ['product', 'הודעת הוואטסאפ המוכנה בכפתורי "דברו עם" ({product} = שם המוצר והמק"ט)', 'text'],
        'pp_drawing' => ['product', '"שרטוט טכני" (כפתור, חלון וכותרת)', 'text'],
        'pp_install' => ['product', '"הוראות התקנה" (כפתור וחלון)', 'text'],
        'pp_pdf' => ['product', 'כפתור "הורדת PDF" (בחלונות ובקטלוג)', 'text'],
        'pp_drawing_note' => ['product', 'טקסט השרטוט כשאין הערה למוצר', 'text'],
        'pp_drawing_pdf' => ['product', 'כפתור הורדת השרטוט', 'text'],
        'pp_drawing_empty' => ['product', 'כשאין שרטוט', 'text'],
        'pp_related' => ['product', '"עוד ב..." לפני שם המשפחה', 'text'],
        'pp_cta_title' => ['product', 'רצועת הסיום – כותרת (**מודגש**, [קישור](/כתובת))', 'rich'],
        'pp_cta_text' => ['product', 'רצועת הסיום – טקסט', 'textarea'],
        'pp_cta_contact' => ['product', 'רצועת הסיום – כפתור יצירת קשר', 'text'],
        'pp_cta_catalog' => ['product', 'רצועת הסיום – כפתור קטלוג', 'text'],
        'pp_modal_note' => ['product', 'חלון השרטוט – טקסט כשאין הערה', 'text'],
        'pp_modal_figure' => ['product', 'חלון השרטוט – "איור X מתוך Y" ({n}, {total})', 'text'],
        'pp_install_source' => ['product', 'חלון ההתקנה – מקור כשלא צוין', 'text'],
        'pp_install_empty' => ['product', 'חלון ההתקנה – כשאין שרטוט', 'text'],
        'pp_fig_maker' => ['product', 'חלון ההתקנה – כיתוב שרטוט יצרן', 'text'],
        'pp_fig_schematic' => ['product', 'חלון ההתקנה – כיתוב איור סכמטי', 'text'],
        'pp_fig_connection' => ['product', 'חלון ההתקנה – כיתוב פרט חיבור', 'text'],
        'pp_fig_product' => ['product', 'חלון ההתקנה – כיתוב תמונת המוצר', 'text'],
        'pp_install_title' => ['product', 'הוראות התקנה כשלא הוזנו – כותרת', 'text'],
        'pp_install_text' => ['product', 'הוראות התקנה כשלא הוזנו – טקסט', 'text'],
        'pp_install_acc' => ['product', 'הוראות התקנה כשלא הוזנו – כותרת האביזרים', 'text'],
        'sheet_logo' => ['sheet', 'לוגו (PNG)', 'image', 'ltr'],
        'sheet_label' => ['sheet', '"דף מוצר" בראש הדף', 'text'],
        'sheet_preview' => ['sheet', 'מעל התצוגה המקדימה', 'text'],
        'sheet_family' => ['sheet', '"משפחה:"', 'text'],
        'sheet_code' => ['sheet', '"מק״ט:"', 'text'],
        'sheet_drawing_empty' => ['sheet', 'כשאין שרטוט', 'text'],
        'sheet_finishes' => ['sheet', 'כותרת אפשרויות הגימור', 'text'],
        'sheet_finish_list' => ['sheet', 'אפשרויות הגימור – שורה לכל גוון: שם | תיאור | צבע (#hex)', 'rows'],
        'sheet_scan' => ['sheet', 'מתחת לברקוד', 'text'],
        'sheet_error' => ['sheet', 'הודעת שגיאה', 'text'],
        'sheet_original' => ['sheet', 'קישור לדף הקטלוג המקורי', 'text'],
        'catalog_title' => ['catalog', 'כותרת העמוד', 'text'],
        'catalog_toc' => ['catalog', '"תוכן עניינים"', 'text'],
        'catalog_page' => ['catalog', '"עמ׳" ליד מספר העמוד', 'text'],
        'catalog_jump' => ['catalog', '"מעבר לעמוד"', 'text'],
        'catalog_go' => ['catalog', 'כפתור "מעבר"', 'text'],
        'catalog_jump_err' => ['catalog', 'שגיאת מספר עמוד ({total} = מספר העמודים)', 'text'],
        'projects_title' => ['projects', 'כותרת העמוד', 'text'],
        'projects_image' => ['projects', 'תמונה ראשית', 'image', 'ltr'],
        'projects_empty' => ['projects', 'כשאין פרויקטים', 'text'],
        'project_link' => ['projects', 'קישור לעמוד הפרויקט', 'text'],
        'projects_cta_title' => ['projects', 'רצועת הסיום – כותרת (**מודגש**, [קישור](/כתובת))', 'rich'],
        'projects_cta_text' => ['projects', 'רצועת הסיום – טקסט', 'textarea'],
        'projects_cta_links' => ['projects', 'רצועת הסיום – כפתורים: תווית | /כתובת', 'links'],
        'project_back' => ['projects', 'עמוד פרויקט – קישור החזרה', 'text'],
        'project_fact_type' => ['projects', 'עמוד פרויקט – "תחום"', 'text'],
        'project_fact_location' => ['projects', 'עמוד פרויקט – "מיקום"', 'text'],
        'project_fact_year' => ['projects', 'עמוד פרויקט – "שנה"', 'text'],
        'project_fact_products' => ['projects', 'עמוד פרויקט – "מוצרים"', 'text'],
        'project_story_label' => ['projects', 'עמוד פרויקט – כותרת התיאור', 'text'],
        'project_products_label' => ['projects', 'עמוד פרויקט – כותרת המוצרים', 'text'],
        'contact_image' => ['contact', 'תמונה ראשית', 'image', 'ltr'],
        'contact_title' => ['contact', 'כותרת', 'text'],
        'contact_text' => ['contact', 'טקסט', 'textarea'],
        'contact_agents_title' => ['contact', 'אנשי הקשר – כותרת', 'text'],
        'contact_agents_text' => ['contact', 'אנשי הקשר – טקסט (**מודגש**, [קישור](/כתובת))', 'rich'],
        'contact_whatsapp' => ['contact', 'קישור הוואטסאפ', 'text'],
        'contact_email_label' => ['contact', '"אימייל"', 'text'],
        'contact_address_label' => ['contact', '"כתובת"', 'text'],
        'contact_attach_title' => ['contact', '"כדאי לציין" – כותרת', 'text'],
        'contact_attach' => ['contact', '"כדאי לציין" – שורה לכל פריט', 'lines'],
        'form_about' => ['form', '"פנייה בנושא" (כשמגיעים מעמוד מוצר)', 'text'],
        'form_name' => ['form', 'שם', 'text'],
        'form_name_err' => ['form', 'שם – שגיאה', 'text'],
        'form_tel' => ['form', 'טלפון', 'text'],
        'form_tel_err' => ['form', 'טלפון – שגיאה', 'text'],
        'form_email' => ['form', 'אימייל', 'text'],
        'form_email_err' => ['form', 'אימייל – שגיאה', 'text'],
        'form_optional' => ['form', '"לא חובה"', 'text'],
        'form_role' => ['form', 'שאלת התפקיד', 'text'],
        'form_roles' => ['form', 'התפקידים – שורה לכל אחד', 'lines'],
        'form_msg' => ['form', 'שדה ההודעה', 'text'],
        'form_consent' => ['form', 'אישור התנאים (**מודגש**, [קישור](/כתובת))', 'rich'],
        'form_consent_err' => ['form', 'אישור התנאים – שגיאה', 'text'],
        'form_news' => ['form', 'הרשמה לעדכונים', 'text'],
        'form_send' => ['form', 'כפתור שליחה', 'text'],
        'form_sending' => ['form', 'כפתור שליחה – בזמן השליחה', 'text'],
        'form_note' => ['form', 'שורה מתחת לכפתור', 'text'],
        'form_fail' => ['form', 'כשהשליחה נכשלה (האימייל מתווסף בסוף) (**מודגש**, [קישור](/כתובת))', 'rich'],
        'thanks_title' => ['pages', 'תודה – כותרת', 'text'],
        'thanks_text' => ['pages', 'תודה – טקסט', 'text'],
        'thanks_links' => ['pages', 'תודה – קישורים: תווית | /כתובת (הראשון כפתור)', 'links'],
        'notfound_title' => ['pages', '404 – כותרת', 'text'],
        'notfound_text' => ['pages', '404 – טקסט', 'text'],
        'notfound_links' => ['pages', '404 – קישורים: תווית | /כתובת', 'links'],
        'privacy_title' => ['legal', 'מדיניות פרטיות – כותרת', 'text'],
        'privacy_meta' => ['legal', 'מדיניות פרטיות – שורה מתחת לכותרת', 'html'],
        'privacy_body' => ['legal', 'מדיניות פרטיות – תוכן', 'html'],
        'terms_title' => ['legal', 'תנאי שימוש – כותרת', 'text'],
        'terms_meta' => ['legal', 'תנאי שימוש – שורה מתחת לכותרת', 'html'],
        'terms_body' => ['legal', 'תנאי שימוש – תוכן', 'html'],
        'accessibility_title' => ['legal', 'הצהרת נגישות – כותרת', 'text'],
        'accessibility_meta' => ['legal', 'הצהרת נגישות – שורה מתחת לכותרת', 'html'],
        'accessibility_body' => ['legal', 'הצהרת נגישות – תוכן', 'html'],
        'seo_suffix' => ['seo', 'סיומת לכל כותרת בלשונית הדפדפן (אחרי שם האתר בדף הבית)', 'text'],
        'seo_home_desc' => ['seo', 'דף הבית – תיאור לגוגל (ריק = הכותרת הראשית)', 'textarea'],
        'seo_about_title' => ['seo', 'אודות – כותרת', 'text'],
        'seo_about_desc' => ['seo', 'אודות – תיאור', 'textarea'],
        'seo_products_desc' => ['seo', 'משפחות מוצרים – תיאור', 'textarea'],
        'seo_projects_desc' => ['seo', 'פרויקטים – תיאור', 'textarea'],
        'seo_contact_title' => ['seo', 'דברו איתנו – כותרת', 'text'],
        'seo_contact_desc' => ['seo', 'דברו איתנו – תיאור', 'textarea'],
        'seo_catalog_desc' => ['seo', 'קטלוג – תיאור', 'textarea'],
        'seo_thanks_title' => ['seo', 'תודה – כותרת', 'text'],
        'pro_kicker' => ['professional', 'שורה עליונה', 'text'],
        'pro_title' => ['professional', 'כותרת', 'text'],
        'pro_text' => ['professional', 'טקסט', 'textarea'],
        'catalog_pdf' => ['professional', 'קובץ הקטלוג הטכני המלא (PDF)', 'file', 'ltr'],
        'catalog_pdf_page_offset' => ['professional', 'היסט עמודים בקובץ (0 אם עמוד 1 בקובץ = עמוד 1 בקטלוג)', 'text', 'ltr'],
        // CMS-FIELDS-END
    ];
    $seed = stripline_settings_seed();
    $out = [];
    foreach ($f as $k => $d) {
        $out[$k] = ['group' => $d[0], 'label' => $d[1], 'type' => $d[2], 'dir' => $d[3] ?? '', 'default' => stripline_setting_to_text($d[2], $seed[$k] ?? '')];
    }
    return $out;
}

/** The site's default copy (seed/settings.json), used for placeholders and the first import. */
function stripline_settings_seed(): array {
    static $seed = null;
    if ($seed === null) {
        $file = STRIPLINE_DIR . 'seed/settings.json';
        $seed = file_exists($file) ? (json_decode(file_get_contents($file), true) ?: []) : [];
    }
    return $seed;
}

/** Structured value (from the JSON seed) => the editable text form of that field type. */
function stripline_setting_to_text(string $type, $v): string {
    if (!is_array($v)) return (string) $v;
    switch ($type) {
        case 'lines':
        case 'gallery':
            return implode("\n", $v);
        case 'pairs':
        case 'logos':
            return implode("\n", array_map(fn($r) => ($r['title'] ?? '') . ' | ' . str_replace("\n", ' // ', $r['text'] ?? ''), $v));
        case 'cards':
            return implode("\n", array_map(fn($r) => implode(' | ', [$r['title'] ?? '', $r['text'] ?? '', $r['label'] ?? '', $r['href'] ?? '']), $v));
        case 'agents':
            return implode("\n", array_map(fn($r) => implode(' | ', [$r['name'] ?? '', $r['phone'] ?? '', $r['whatsapp'] ?? '']), $v));
        case 'rows':
            return implode("\n", array_map(fn($r) => implode(' | ', $r), $v));
        case 'links':
            return implode("\n", array_map(fn($r) => ($r['label'] ?? '') . ' | ' . ($r['href'] ?? ''), $v));
        case 'entries':
            return implode("\n", array_map(fn($r) => implode(' | ', [$r['title'] ?? '', str_replace("\n", ' // ', $r['text'] ?? ''), $r['href'] ?? '', $r['icon'] ?? '']), $v));
        default:
            return wp_json_encode($v, JSON_UNESCAPED_UNICODE);
    }
}

/** Split "a | b | c" lines into trimmed cells, skipping empty lines. */
function stripline_cells(string $raw): array {
    $rows = [];
    foreach (preg_split('/\r\n|\r|\n/', $raw) as $line) {
        if (trim($line) === '') continue;
        $rows[] = array_map('trim', explode('|', $line));
    }
    return $rows;
}

/** Convert a stored meta value to its REST representation. */
function stripline_field_out(array $def, $raw) {
    switch ($def['type']) {
        case 'lines':
        case 'gallery':
        case 'products':
            return array_values(array_filter(array_map('trim', preg_split('/\r\n|\r|\n/', (string) $raw)), 'strlen'));
        case 'check':
            return (bool) $raw;
        case 'json':
            $v = json_decode((string) $raw, true);
            return is_array($v) ? $v : null;
        case 'install':
            return stripline_parse_install((string) $raw);
        case 'pairs':
        case 'logos':
            return array_map(fn($c) => ['title' => $c[0], 'text' => str_replace(' // ', "\n", $c[1] ?? '')], stripline_cells((string) $raw));
        case 'cards':
            return array_map(fn($c) => ['title' => $c[0], 'text' => $c[1] ?? '', 'label' => $c[2] ?? '', 'href' => $c[3] ?? '/'], stripline_cells((string) $raw));
        case 'agents':
            return array_map(fn($c) => ['name' => $c[0], 'phone' => $c[1] ?? '', 'whatsapp' => preg_replace('/\D+/', '', $c[2] ?? '')], stripline_cells((string) $raw));
        case 'rows':
            return stripline_cells((string) $raw);
        case 'links':
            return array_map(fn($c) => ['label' => $c[0], 'href' => $c[1] ?? '/'], stripline_cells((string) $raw));
        case 'entries':
            return array_map(fn($c) => [
                'title' => $c[0], 'text' => str_replace(' // ', "\n", $c[1] ?? ''),
                'href' => $c[2] ?? '/', 'icon' => $c[3] ?? 'products',
            ], stripline_cells((string) $raw));
        default:
            return (string) $raw;
    }
}

/** "כותרת\n- שורה\n- שורה\n\nכותרת 2\n- ..." => [{title, items[]}] */
function stripline_parse_install(string $raw): array {
    $out = [];
    $cur = null;
    foreach (preg_split('/\r\n|\r|\n/', $raw) as $line) {
        $line = trim($line);
        if ($line === '') continue;
        if (preg_match('/^[-•*]\s*(.+)$/u', $line, $m)) {
            if ($cur === null) $cur = ['title' => '', 'items' => []];
            $cur['items'][] = trim($m[1]);
        } else {
            if ($cur !== null) $out[] = $cur;
            $cur = ['title' => $line, 'items' => []];
        }
    }
    if ($cur !== null) $out[] = $cur;
    return $out;
}

function stripline_install_to_text(array $sections): string {
    $lines = [];
    foreach ($sections as $s) {
        $lines[] = $s['title'] ?? '';
        foreach ($s['items'] ?? [] as $it) $lines[] = '- ' . $it;
        $lines[] = '';
    }
    return trim(implode("\n", $lines));
}
