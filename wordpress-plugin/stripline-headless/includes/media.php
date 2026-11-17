<?php
/**
 * GET /wp-json/stripline/v1/media – the resized copies WordPress keeps of every image, so the site
 * can offer them in a srcset (instead of an image service). Keyed by the image's URL:
 *   { "<url>": { "w": 2172, "h": 724, "bytes": 903072, "sizes": [ { "w": 300, "src": "<url>", "bytes": 19936 }, … ] } }
 * Only copies with the image's proportions (not the square thumbnail crop), narrower than it, and –
 * when both sizes are known – lighter than it. Kept for a day and cleared whenever media changes.
 * The site reads WordPress's own media listing when this route is missing (plugin before 1.6.0).
 */
if (!defined('ABSPATH')) exit;

const STRIPLINE_MEDIA_CACHE = 'stripline_media_sizes';

add_action('rest_api_init', function () {
    register_rest_route('stripline/v1', '/media', [
        'methods'             => 'GET',
        'callback'            => 'stripline_rest_media',
        'permission_callback' => '__return_true',
    ]);
});

function stripline_rest_media() {
    $cached = get_transient(STRIPLINE_MEDIA_CACHE);
    if (is_array($cached)) return $cached;

    $base = wp_get_upload_dir()['baseurl'];
    $out = [];
    $ids = get_posts([
        'post_type'      => 'attachment',
        'post_status'    => 'inherit',
        'post_mime_type' => 'image',
        'posts_per_page' => -1,
        'fields'         => 'ids',
        'no_found_rows'  => true,
    ]);
    foreach ($ids as $id) {
        $meta = wp_get_attachment_metadata($id);
        if (empty($meta['file']) || empty($meta['width']) || empty($meta['height'])) continue;
        $w = (int) $meta['width'];
        $h = (int) $meta['height'];
        $bytes = (int) ($meta['filesize'] ?? 0);
        $dir = dirname($meta['file']);
        $prefix = $base . '/' . ($dir === '.' ? '' : $dir . '/');
        $ratio = $w / $h;
        $sizes = [];
        foreach (($meta['sizes'] ?? []) as $size) {
            $sw = (int) ($size['width'] ?? 0);
            $sh = (int) ($size['height'] ?? 0);
            if (!$sw || !$sh || empty($size['file']) || $sw >= $w) continue;
            if (abs($sw / $sh - $ratio) / $ratio > 0.02) continue;
            $sbytes = (int) ($size['filesize'] ?? 0);
            if ($bytes && $sbytes && $sbytes >= $bytes) continue;
            $sizes[$sw] = ['w' => $sw, 'src' => $prefix . $size['file'], 'bytes' => $sbytes];
        }
        ksort($sizes);
        $out[$base . '/' . $meta['file']] = ['w' => $w, 'h' => $h, 'bytes' => $bytes, 'sizes' => array_values($sizes)];
    }
    set_transient(STRIPLINE_MEDIA_CACHE, $out, DAY_IN_SECONDS);
    return $out;
}

function stripline_media_cache_clear() {
    delete_transient(STRIPLINE_MEDIA_CACHE);
}
add_action('add_attachment', 'stripline_media_cache_clear');
add_action('edit_attachment', 'stripline_media_cache_clear');
add_action('delete_attachment', 'stripline_media_cache_clear');
add_filter('wp_update_attachment_metadata', function ($data) {
    stripline_media_cache_clear();
    return $data;
});
