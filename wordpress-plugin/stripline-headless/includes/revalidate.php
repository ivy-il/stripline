<?php
if (!defined('ABSPATH')) exit;

/** Ping the Next.js site so the change shows immediately (on-demand ISR). */
function stripline_revalidate(array $tags): void {
    $conn = stripline_get_connection();
    if (!$conn['next_url'] || !$conn['secret']) return;
    wp_remote_post($conn['next_url'] . '/api/revalidate?secret=' . rawurlencode($conn['secret']), [
        'timeout'  => 5,
        'blocking' => false,
        'headers'  => ['Content-Type' => 'application/json'],
        'body'     => wp_json_encode(['tags' => $tags]),
    ]);
}

add_action('save_post', function ($post_id, $post) {
    if (wp_is_post_revision($post_id) || (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE)) return;
    if ($post->post_type === 'sl_product') stripline_revalidate(['products']);
    if ($post->post_type === 'sl_project') stripline_revalidate(['projects']);
}, 20, 2);
add_action('deleted_post', function ($post_id, $post) {
    if ($post && in_array($post->post_type, ['sl_product', 'sl_project'], true)) stripline_revalidate(['products', 'projects']);
}, 10, 2);
foreach (['created_sl_family', 'edited_sl_family', 'delete_sl_family'] as $h) {
    add_action($h, fn() => stripline_revalidate(['families', 'products']));
}
add_action('update_option_' . STRIPLINE_OPT, fn() => stripline_revalidate(['settings']));

/**
 * "Sync now": refresh the whole site and report the result. It waits for the answer (unlike the automatic
 * calls), so a wrong address or secret, or a server that cannot reach the site, shows up as a message.
 */
function stripline_revalidate_now(): array {
    $conn = stripline_get_connection();
    if (!$conn['next_url'] || !$conn['secret']) return [false, 'חסרים כתובת אתר או מפתח סודי (הגדרות ← תוכן האתר ← חיבור).'];
    $res = wp_remote_post($conn['next_url'] . '/api/revalidate?secret=' . rawurlencode($conn['secret']), [
        'timeout' => 20,
        'headers' => ['Content-Type' => 'application/json'],
        'body'    => wp_json_encode(['tags' => ['stripline']]),
    ]);
    if (is_wp_error($res)) return [false, 'האתר לא ענה: ' . $res->get_error_message()];
    $code = wp_remote_retrieve_response_code($res);
    if ($code === 200) return [true, 'האתר סונכרן. השינויים מופיעים עכשיו ב-' . $conn['next_url']];
    if ($code === 401) return [false, 'המפתח הסודי לא תואם ל-REVALIDATE_SECRET של האתר.'];
    return [false, "האתר החזיר שגיאה $code. בדקו שהכתובת " . $conn['next_url'] . ' היא האתר החדש.'];
}

add_action('admin_bar_menu', function (WP_Admin_Bar $bar) {
    if (!current_user_can('edit_posts')) return;
    $bar->add_node([
        'id'    => 'stripline-sync',
        'title' => '⟳ סנכרון האתר',
        'href'  => wp_nonce_url(admin_url('admin-post.php?action=stripline_sync'), 'stripline_sync'),
    ]);
}, 100);

add_action('admin_post_stripline_sync', function () {
    if (!current_user_can('edit_posts')) wp_die('אין הרשאה.');
    check_admin_referer('stripline_sync');
    set_transient('stripline_sync_result_' . get_current_user_id(), stripline_revalidate_now(), 60);
    wp_safe_redirect(wp_get_referer() ?: admin_url());
    exit;
});

add_action('admin_notices', function () {
    $key = 'stripline_sync_result_' . get_current_user_id();
    $r = get_transient($key);
    if (!$r) return;
    delete_transient($key);
    printf('<div class="notice notice-%s is-dismissible"><p>%s</p></div>', $r[0] ? 'success' : 'error', esc_html($r[1]));
});
