<?php
if (!defined('ABSPATH')) exit;

const STRIPLINE_OPT = 'stripline_settings';
const STRIPLINE_CONN = 'stripline_connection';

/**
 * REST view of the site settings. Every saved field is sent as saved, so emptying a field removes that
 * text from the site; fields never saved are left out and the site shows its default copy.
 */
function stripline_get_settings(): array {
    $saved = get_option(STRIPLINE_OPT, []);
    if (!is_array($saved)) $saved = [];
    $out = [];
    foreach (stripline_settings_fields() as $k => $def) {
        if (!array_key_exists($k, $saved)) continue;
        $v = stripline_field_out($def, (string) $saved[$k]);
        if ($v === null) continue;
        $out[$k] = $v;
    }
    return $out;
}

/** Field types edited in a multi-line box. */
function stripline_multiline_types(): array {
    return ['textarea', 'rich', 'lines', 'pairs', 'links', 'cards', 'agents', 'rows', 'entries', 'json', 'gallery', 'logos'];
}

function stripline_get_connection(): array {
    return wp_parse_args(get_option(STRIPLINE_CONN, []), ['next_url' => '', 'secret' => '', 'notify_email' => get_option('admin_email')]);
}

add_action('admin_menu', function () {
    add_menu_page('תוכן האתר', 'תוכן האתר', 'manage_options', 'stripline', 'stripline_settings_page', 'dashicons-edit-page', 4);
});

add_action('admin_init', function () {
    register_setting('stripline', STRIPLINE_OPT, ['sanitize_callback' => function ($in) {
        // Each tab posts only its own fields: merge into what is saved instead of replacing it.
        $out = get_option(STRIPLINE_OPT, []);
        if (!is_array($out)) $out = [];
        foreach (stripline_settings_fields() as $k => $def) {
            if (!isset($in[$k])) continue;
            $v = wp_unslash($in[$k]);
            if ($def['type'] === 'html') $out[$k] = wp_kses_post($v);
            elseif (in_array($def['type'], ['text', 'image', 'file', 'video'], true)) $out[$k] = sanitize_text_field($v);
            else $out[$k] = sanitize_textarea_field($v);
        }
        return $out;
    }]);
    register_setting('stripline_connection', STRIPLINE_CONN, ['sanitize_callback' => function ($in) {
        return [
            'next_url'     => esc_url_raw(rtrim($in['next_url'] ?? '', '/')),
            'secret'       => sanitize_text_field($in['secret'] ?? ''),
            'notify_email' => sanitize_email($in['notify_email'] ?? ''),
        ];
    }]);
});

function stripline_settings_page() {
    $saved = get_option(STRIPLINE_OPT, []);
    $conn = stripline_get_connection();
    $groups = stripline_settings_groups();
    $tab = sanitize_key($_GET['tab'] ?? 'general');
    $page = sanitize_key($_GET['page'] ?? 'stripline');
    $link = fn($t) => admin_url('admin.php?page=' . $page . '&tab=' . $t);
    ?>
    <div class="wrap stripline-settings" dir="rtl">
        <h1>תוכן האתר – STRIPLINE</h1>
        <p class="description">כל הטקסטים, התמונות והסרטונים באתר, לפי עמודים. שדה שמרוקנים ושומרים לא יוצג באתר; הטקסט באפור הוא ברירת המחדל. בטקסטים אפשר לכתוב <code>**מילים**</code> להדגשה, <code>[טקסט](/כתובת)</code> לקישור, ו-STRIPLINE מוצג כלוגו. מוצרים, משפחות מוצרים ופרויקטים נערכים בתפריטים שלהם. כל שמירה מתעדכנת באתר תוך כמה שניות.</p>
        <nav class="nav-tab-wrapper">
            <?php foreach ($groups as $g => $label) : ?>
                <a href="<?php echo esc_url($link($g)); ?>" class="nav-tab <?php echo $tab === $g ? 'nav-tab-active' : ''; ?>"><?php echo esc_html($label); ?></a>
            <?php endforeach; ?>
            <a href="<?php echo esc_url($link('connection')); ?>" class="nav-tab <?php echo $tab === 'connection' ? 'nav-tab-active' : ''; ?>">חיבור</a>
            <a href="<?php echo esc_url($link('import')); ?>" class="nav-tab <?php echo $tab === 'import' ? 'nav-tab-active' : ''; ?>">ייבוא</a>
        </nav>

        <?php if (isset($groups[$tab])) : ?>
        <form method="post" action="options.php">
            <?php settings_fields('stripline'); ?>
            <table class="form-table" role="presentation">
                <?php foreach (stripline_settings_fields() as $k => $def) :
                    if ($def['group'] !== $tab) continue;
                    $val = $saved[$k] ?? '';
                    $id = 'sl_' . $k;
                    $name = STRIPLINE_OPT . '[' . $k . ']';
                    $ltr = $def['dir'] === 'ltr' ? ' dir="ltr"' : '';
                    $multi = in_array($def['type'], stripline_multiline_types(), true);
                    $rows = max(3, substr_count($def['default'] . "\n" . $val, "\n") + 2); ?>
                    <tr>
                        <th scope="row"><label for="<?php echo $id; ?>"><?php echo esc_html($def['label']); ?></label></th>
                        <td>
                            <?php if ($def['type'] === 'html') : ?>
                                <?php wp_editor($val !== '' ? $val : $def['default'], $id, ['textarea_name' => $name, 'textarea_rows' => 12, 'media_buttons' => true]); ?>
                            <?php elseif (in_array($def['type'], stripline_media_types(), true)) : ?>
                                <?php // A picker never saved starts from the default, so saving the tab keeps it.
                                echo stripline_media_control($def['type'], $name, array_key_exists($k, $saved) ? (string) $val : $def['default'], $id); ?>
                            <?php elseif ($multi) : ?>
                                <textarea id="<?php echo $id; ?>" name="<?php echo esc_attr($name); ?>" rows="<?php echo (int) $rows; ?>" class="large-text" placeholder="<?php echo esc_attr($def['default']); ?>"<?php echo $ltr; ?>><?php echo esc_textarea($val); ?></textarea>
                            <?php else : ?>
                                <input type="text" id="<?php echo $id; ?>" name="<?php echo esc_attr($name); ?>" value="<?php echo esc_attr($val); ?>" class="regular-text" placeholder="<?php echo esc_attr($def['default']); ?>"<?php echo $ltr; ?>>
                            <?php endif; ?>
                        </td>
                    </tr>
                <?php endforeach; ?>
            </table>
            <?php submit_button('שמירה'); ?>
        </form>

        <?php elseif ($tab === 'connection') : ?>
        <form method="post" action="options.php">
            <?php settings_fields('stripline_connection'); ?>
            <table class="form-table">
                <tr><th>כתובת האתר (Next.js)</th><td><input type="url" name="<?php echo STRIPLINE_CONN; ?>[next_url]" value="<?php echo esc_attr($conn['next_url']); ?>" class="regular-text" dir="ltr" placeholder="https://www.stripline.co.il"><p class="description">אחרי כל שמירה וורדפרס קורא ל-<code>/api/revalidate</code> באתר כדי לרענן את התוכן מיד.</p></td></tr>
                <tr><th>מפתח סודי (REVALIDATE_SECRET)</th><td><input type="text" name="<?php echo STRIPLINE_CONN; ?>[secret]" value="<?php echo esc_attr($conn['secret']); ?>" class="regular-text" dir="ltr"><p class="description">אותו ערך כמו במשתנה הסביבה REVALIDATE_SECRET באתר.</p></td></tr>
                <tr><th>אימייל לפניות מהאתר</th><td><input type="email" name="<?php echo STRIPLINE_CONN; ?>[notify_email]" value="<?php echo esc_attr($conn['notify_email']); ?>" class="regular-text" dir="ltr"></td></tr>
            </table>
            <?php submit_button('שמירת חיבור'); ?>
        </form>
        <h2>סנכרון ידני</h2>
        <p>מרענן את כל האתר מהתוכן שבוורדפרס ומראה אם החיבור תקין. אותו כפתור נמצא גם בסרגל העליון ("⟳ סנכרון האתר").</p>
        <p><a class="button button-primary" href="<?php echo esc_url(wp_nonce_url(admin_url('admin-post.php?action=stripline_sync'), 'stripline_sync')); ?>">סנכרון עכשיו</a></p>
        <h2>נקודות הקצה</h2>
        <ul dir="ltr" style="text-align:left">
            <?php foreach (['settings', 'families', 'products', 'products/eilat', 'projects'] as $ep) : ?>
                <li><a href="<?php echo esc_url(rest_url('stripline/v1/' . $ep)); ?>" target="_blank"><?php echo esc_html(rest_url('stripline/v1/' . $ep)); ?></a></li>
            <?php endforeach; ?>
        </ul>

        <?php else : stripline_import_tab(); endif; ?>
    </div>
    <?php
}
