<?php
if (!defined('ABSPATH')) exit;

add_action('rest_api_init', function () {
    $ns = 'stripline/v1';
    register_rest_route($ns, '/settings', ['methods' => 'GET', 'callback' => fn() => stripline_get_settings(), 'permission_callback' => '__return_true']);
    register_rest_route($ns, '/families', ['methods' => 'GET', 'callback' => 'stripline_rest_families', 'permission_callback' => '__return_true']);
    register_rest_route($ns, '/products', ['methods' => 'GET', 'callback' => 'stripline_rest_products', 'permission_callback' => '__return_true']);
    register_rest_route($ns, '/products/(?P<slug>[a-z0-9\-]+)', ['methods' => 'GET', 'callback' => 'stripline_rest_product', 'permission_callback' => '__return_true']);
    register_rest_route($ns, '/projects', ['methods' => 'GET', 'callback' => 'stripline_rest_projects', 'permission_callback' => '__return_true']);
    register_rest_route($ns, '/contact', ['methods' => 'POST', 'callback' => 'stripline_rest_contact', 'permission_callback' => '__return_true']);
});

function stripline_rest_families() {
    $terms = get_terms(['taxonomy' => 'sl_family', 'hide_empty' => false]);
    if (is_wp_error($terms)) return [];
    $out = [];
    foreach ($terms as $t) {
        $out[] = [
            'slug'           => $t->slug,
            'name'           => get_term_meta($t->term_id, 'sl_name_en', true) ?: $t->name,
            'name_he'        => $t->name,
            'description_he' => $t->description,
            'image'          => get_term_meta($t->term_id, 'sl_image', true) ?: '',
            'tile'           => get_term_meta($t->term_id, 'sl_tile', true) ?: '',
            'order'          => (int) get_term_meta($t->term_id, 'sl_order', true),
        ];
    }
    usort($out, fn($a, $b) => $a['order'] <=> $b['order']);
    return $out;
}

function stripline_product_to_array(WP_Post $p): array {
    $out = ['slug' => $p->post_name];
    foreach (stripline_product_fields() as $k => $def) {
        $out[$k] = stripline_field_out($def, get_post_meta($p->ID, $k, true));
    }
    // derived
    if ($out['name'] === '') $out['name'] = $p->post_title;
    if ($out['name_he'] === '') $out['name_he'] = $p->post_title;
    if ($out['subtitle_he'] === '') $out['subtitle_he'] = $out['name_he'];
    if ($out['image'] === '' && has_post_thumbnail($p)) $out['image'] = get_the_post_thumbnail_url($p, 'large');
    $out['codes'] = array_values(array_filter(array_map('trim', preg_split('/[,\/]/', $out['code']))));
    $pages = array_map('intval', array_filter(preg_split('/\D+/', $out['catalog_pages'])));
    $out['catalog_pages'] = [$pages[0] ?? 0, $pages[1] ?? ($pages[0] ?? 0)];
    $fam = get_the_terms($p, 'sl_family');
    $out['family'] = ($fam && !is_wp_error($fam)) ? $fam[0]->slug : '';
    return $out;
}

function stripline_rest_products() {
    $q = get_posts(['post_type' => 'sl_product', 'post_status' => 'publish', 'numberposts' => -1, 'orderby' => ['menu_order' => 'ASC', 'title' => 'ASC']]);
    return array_map('stripline_product_to_array', $q);
}

function stripline_rest_product(WP_REST_Request $r) {
    $q = get_posts(['post_type' => 'sl_product', 'post_status' => 'publish', 'name' => $r['slug'], 'numberposts' => 1]);
    if (!$q) return new WP_Error('not_found', 'product not found', ['status' => 404]);
    return stripline_product_to_array($q[0]);
}

function stripline_rest_projects() {
    $q = get_posts(['post_type' => 'sl_project', 'post_status' => 'publish', 'numberposts' => -1, 'orderby' => ['menu_order' => 'ASC', 'date' => 'DESC']]);
    return array_map(function (WP_Post $p) {
        $out = ['slug' => $p->post_name, 'title' => $p->post_title];
        foreach (stripline_project_fields() as $k => $def) $out[$k] = stripline_field_out($def, get_post_meta($p->ID, $k, true));
        if ($out['image'] === '' && has_post_thumbnail($p)) $out['image'] = get_the_post_thumbnail_url($p, 'large');
        if (!$out['gallery'] && $out['image']) $out['gallery'] = [$out['image']];
        return $out;
    }, $q);
}

function stripline_rest_contact(WP_REST_Request $r) {
    $conn = stripline_get_connection();
    if ($conn['secret'] && $r->get_header('x-stripline-secret') !== $conn['secret']) {
        return new WP_Error('forbidden', 'bad secret', ['status' => 403]);
    }
    $d = $r->get_json_params() ?: [];
    $name = sanitize_text_field($d['name'] ?? '');
    $email = sanitize_email($d['email'] ?? '');
    if (!$name || !$email) return new WP_Error('bad_request', 'missing fields', ['status' => 400]);
    $body = sprintf("שם: %s\nאימייל: %s\nטלפון: %s\nתפקיד: %s\nמוצר: %s\n\n%s",
        $name, $email, sanitize_text_field($d['phone'] ?? ''), sanitize_text_field($d['role'] ?? ''),
        sanitize_text_field($d['product'] ?? ''), sanitize_textarea_field($d['message'] ?? ''));
    wp_insert_post(['post_type' => 'sl_lead', 'post_status' => 'private', 'post_title' => $name . ' – ' . $email, 'post_content' => $body]);
    if ($conn['notify_email']) wp_mail($conn['notify_email'], 'פנייה חדשה מאתר STRIPLINE: ' . $name, $body, ['Reply-To: ' . $email]);
    return ['ok' => true];
}
