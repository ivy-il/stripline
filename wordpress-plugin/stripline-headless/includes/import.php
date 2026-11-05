<?php
if (!defined('ABSPATH')) exit;

/**
 * Catalogue import: families, products, projects and all site copy from seed/*.json.
 *
 * Every image, PDF and DWG referenced by the seed can be copied into the media library, so the
 * client edits and replaces everything from WordPress. Two sources for those files:
 *   - WP-CLI (recommended, no timeouts):  wp stripline import --assets=/path/to/site/public [--update]
 *   - Admin tab: downloads each file from the live Next.js site (slow; may hit PHP time limits).
 */

// DWG is not an allowed upload type by default.
add_filter('upload_mimes', function ($m) {
    $m['dwg'] = 'image/vnd.dwg';
    return $m;
});
add_filter('wp_check_filetype_and_ext', function ($data, $file, $filename) {
    if (strtolower(pathinfo($filename, PATHINFO_EXTENSION)) === 'dwg') {
        return ['ext' => 'dwg', 'type' => 'image/vnd.dwg', 'proper_filename' => false];
    }
    return $data;
}, 10, 3);

function stripline_import_tab() {
    if (isset($_POST['stripline_import']) && check_admin_referer('stripline_import')) {
        @set_time_limit(0);
        $res = stripline_run_import([
            'base'     => esc_url_raw(rtrim(wp_unslash($_POST['asset_base'] ?? ''), '/')),
            'sideload' => !empty($_POST['sideload']),
            'update'   => !empty($_POST['update']),
        ]);
        echo '<div class="notice notice-success"><p>' . esc_html(stripline_import_summary($res)) . '</p></div>';
    }
    $conn = stripline_get_connection();
    ?>
    <form method="post">
        <?php wp_nonce_field('stripline_import'); ?>
        <p>מייבא את כל המשפחות, המוצרים, הפרויקטים וטקסטי האתר. פריטים קיימים (לפי slug) ושדות שכבר מולאו לא נדרסים, אלא אם מסמנים "לעדכן קיימים".</p>
        <table class="form-table">
            <tr><th>כתובת בסיס לקבצים</th><td><input type="url" name="asset_base" class="regular-text" dir="ltr" value="<?php echo esc_attr($conn['next_url']); ?>" placeholder="https://www.stripline.co.il"><p class="description">תמונות, PDF ו-DWG נמצאים באתר תחת <code>/products/…</code>, <code>/pdf/…</code> ו-<code>/images/…</code>.</p></td></tr>
            <tr><th>להעתיק קבצים לספריית המדיה</th><td><label><input type="checkbox" name="sideload" value="1"> כן (איטי; לייבוא מלא עדיף <code dir="ltr">wp stripline import</code>)</label></td></tr>
            <tr><th>לעדכן קיימים</th><td><label><input type="checkbox" name="update" value="1"> לדרוס שדות של פריטים שכבר יובאו</label></td></tr>
        </table>
        <?php submit_button('ייבוא', 'primary', 'stripline_import'); ?>
    </form>
    <?php
}

function stripline_import_summary(array $r): string {
    return sprintf('הייבוא הסתיים: %d משפחות, %d מוצרים, %d פרויקטים, %d טקסטים, %d קבצים הועלו למדיה%s.',
        $r['families'], $r['products'], $r['projects'], $r['settings'], $r['media'],
        $r['errors'] ? ' (' . count($r['errors']) . ' קבצים נכשלו)' : '');
}

/**
 * Resolve a seed asset path ("/products/photos/x.png") to a URL, uploading it to the media library
 * when a source is available. Uploads are cached by path, so re-running never duplicates media.
 */
function stripline_import_asset(string $url, array $opts, array &$counts, int $parent = 0): string {
    if ($url === '' || preg_match('#^https?://#', $url)) return $url;
    $map = get_option('stripline_media_map', []);
    if (isset($map[$url]) && get_post($map[$url])) return wp_get_attachment_url($map[$url]);

    $tmp = '';
    if (!empty($opts['assets'])) {
        $src = rtrim($opts['assets'], '/') . $url;
        if (!is_file($src)) { $counts['errors'][] = $url . ' (missing)'; return $opts['base'] ? $opts['base'] . $url : $url; }
        $tmp = wp_tempnam(basename($src));
        copy($src, $tmp);
    } elseif (!empty($opts['sideload']) && !empty($opts['base'])) {
        require_once ABSPATH . 'wp-admin/includes/file.php';
        $tmp = download_url($opts['base'] . str_replace('%2F', '/', rawurlencode($url)), 120);
        if (is_wp_error($tmp)) { $counts['errors'][] = $url . ' (' . $tmp->get_error_message() . ')'; return $opts['base'] . $url; }
    } else {
        return !empty($opts['base']) ? $opts['base'] . $url : $url;
    }

    require_once ABSPATH . 'wp-admin/includes/file.php';
    require_once ABSPATH . 'wp-admin/includes/media.php';
    require_once ABSPATH . 'wp-admin/includes/image.php';
    $id = media_handle_sideload(['name' => basename($url), 'tmp_name' => $tmp], $parent);
    if (is_wp_error($id)) {
        @unlink($tmp);
        $counts['errors'][] = $url . ' (' . $id->get_error_message() . ')';
        return !empty($opts['base']) ? $opts['base'] . $url : $url;
    }
    $map[$url] = $id;
    update_option('stripline_media_map', $map, false);
    $counts['media']++;
    return wp_get_attachment_url($id);
}

function stripline_run_import(array $opts): array {
    $opts = wp_parse_args($opts, ['base' => '', 'assets' => '', 'sideload' => false, 'update' => false, 'log' => null]);
    $log = is_callable($opts['log']) ? $opts['log'] : fn($m) => null;
    $read = fn($f) => json_decode(file_get_contents(STRIPLINE_DIR . 'seed/' . $f), true) ?: [];
    $counts = ['families' => 0, 'products' => 0, 'projects' => 0, 'settings' => 0, 'media' => 0, 'errors' => []];
    $asset = function (string $url, int $parent = 0) use ($opts, &$counts) { return stripline_import_asset($url, $opts, $counts, $parent); };

    // Families
    foreach ($read('families.json') as $f) {
        $term = term_exists($f['slug'], 'sl_family');
        if (!$term) {
            $term = wp_insert_term($f['name_he'], 'sl_family', ['slug' => $f['slug'], 'description' => $f['description_he']]);
            if (is_wp_error($term)) continue;
            $counts['families']++;
        } elseif ($opts['update']) {
            wp_update_term((int) $term['term_id'], 'sl_family', ['name' => $f['name_he'], 'description' => $f['description_he']]);
        }
        $tid = (int) $term['term_id'];
        update_term_meta($tid, 'sl_name_en', $f['name']);
        update_term_meta($tid, 'sl_order', $f['order']);
        if (!empty($f['image']) && ($opts['update'] || !get_term_meta($tid, 'sl_image', true))) update_term_meta($tid, 'sl_image', $asset($f['image']));
    }
    $log('families done');

    // Products
    $fields = stripline_product_fields();
    foreach ($read('products.json') as $i => $p) {
        $existing = get_page_by_path($p['slug'], OBJECT, 'sl_product');
        if ($existing && !$opts['update']) {
            // Still fill fields that were added after the first import (documents, DWG).
            $id = $existing->ID;
            $only_empty = true;
        } else {
            $id = $existing ? $existing->ID : wp_insert_post(['post_type' => 'sl_product', 'post_status' => 'publish', 'post_title' => $p['name_he'], 'post_name' => $p['slug'], 'menu_order' => $i]);
            if (is_wp_error($id) || !$id) continue;
            $only_empty = false;
        }
        foreach ($fields as $k => $def) {
            if (!array_key_exists($k, $p)) continue;
            if ($only_empty && get_post_meta($id, $k, true) !== '') continue;
            $v = $p[$k];
            if ($k === 'catalog_pages') $v = implode('-', (array) $v);
            elseif ($def['type'] === 'install') $v = stripline_install_to_text((array) $v);
            elseif ($def['type'] === 'check') $v = $v ? '1' : '0';
            elseif (in_array($def['type'], ['image', 'file', 'video'], true)) {
                $v = $asset((string) $v, $id);
                if ($k === 'image' && $v && ($map = get_option('stripline_media_map', [])) && isset($map[$p[$k]])) set_post_thumbnail($id, $map[$p[$k]]);
            } elseif (in_array($def['type'], ['lines', 'gallery'], true)) {
                $items = (array) $v;
                if ($def['type'] === 'gallery') $items = array_map(fn($u) => $asset((string) $u, $id), $items);
                $v = implode("\n", $items);
            }
            update_post_meta($id, $k, is_array($v) ? wp_json_encode($v) : $v);
        }
        if (!$only_empty) wp_set_object_terms($id, $p['family'], 'sl_family');
        $counts['products']++;
        if ($i % 10 === 9) $log(($i + 1) . ' products');
    }
    $log('products done');

    // Projects
    foreach ($read('projects.json') as $i => $pr) {
        $existing = get_page_by_path($pr['slug'], OBJECT, 'sl_project');
        if ($existing && !$opts['update']) continue;
        $id = $existing ? $existing->ID : wp_insert_post(['post_type' => 'sl_project', 'post_status' => 'publish', 'post_title' => $pr['title'], 'post_name' => $pr['slug'], 'menu_order' => $i]);
        if (is_wp_error($id) || !$id) continue;
        foreach (stripline_project_fields() as $k => $def) {
            $v = $pr[$k] ?? '';
            if ($k === 'gallery') $v = implode("\n", array_map(fn($u) => $asset((string) $u, $id), (array) $v));
            elseif (in_array($def['type'], ['lines', 'products'], true)) $v = implode("\n", (array) $v);
            elseif ($def['type'] === 'image') {
                $v = $asset((string) $v, $id);
                $map = get_option('stripline_media_map', []);
                if ($k === 'image' && isset($map[$pr[$k]])) set_post_thumbnail($id, $map[$pr[$k]]);
            }
            update_post_meta($id, $k, $v);
        }
        $counts['projects']++;
    }
    $log('projects done');

    // Site copy: pre-fill every field so the client edits the real text, not an empty box.
    $saved = get_option(STRIPLINE_OPT, []);
    if (!is_array($saved)) $saved = [];
    $seed = stripline_settings_seed();
    foreach (stripline_settings_fields() as $k => $def) {
        if (!array_key_exists($k, $seed)) continue;
        if (!$opts['update'] && isset($saved[$k]) && trim((string) $saved[$k]) !== '') continue;
        $v = stripline_setting_to_text($def['type'], $seed[$k]);
        if (in_array($def['type'], ['image', 'file', 'video'], true)) $v = $asset($v);
        elseif ($def['type'] === 'gallery') $v = implode("\n", array_map(fn($c) => $asset($c[0]), stripline_cells($v)));
        elseif ($def['type'] === 'logos') $v = implode("\n", array_map(fn($c) => $c[0] . ' | ' . $asset($c[1] ?? ''), stripline_cells($v)));
        $saved[$k] = $v;
        $counts['settings']++;
    }
    // Save without triggering one revalidate per field; one ping follows below.
    remove_all_actions('update_option_' . STRIPLINE_OPT);
    update_option(STRIPLINE_OPT, $saved);
    $log('settings done');

    stripline_revalidate(['products', 'families', 'projects', 'settings']);
    return $counts;
}

if (defined('WP_CLI') && WP_CLI) {
    /**
     * Import the STRIPLINE catalogue and site copy.
     *
     * ## OPTIONS
     * [--assets=<dir>]
     * : Local copy of the Next.js `public/` folder. Every referenced file is uploaded to the media library.
     * [--base=<url>]
     * : Fallback URL prefix for files that are not found locally.
     * [--update]
     * : Overwrite fields of items that were already imported.
     *
     * ## EXAMPLES
     *     wp stripline import --assets=/home/stripline/import/public
     */
    WP_CLI::add_command('stripline import', function ($args, $assoc) {
        $res = stripline_run_import([
            'assets' => $assoc['assets'] ?? '',
            'base'   => rtrim($assoc['base'] ?? '', '/'),
            'update' => isset($assoc['update']),
            'log'    => fn($m) => WP_CLI::log($m),
        ]);
        foreach ($res['errors'] as $e) WP_CLI::warning($e);
        WP_CLI::success(stripline_import_summary($res));
    });
}
