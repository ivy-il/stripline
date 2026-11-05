<?php
/**
 * Plugin Name: STRIPLINE Headless CMS
 * Description: מוצרים, משפחות, פרויקטים וטקסטי האתר של STRIPLINE, חשופים ל-Next.js דרך REST API (stripline/v1) עם רענון אוטומטי (ISR).
 * Version: 1.5.0
 * Author: STRIPLINE
 * Text Domain: stripline
 */

if (!defined('ABSPATH')) exit;

define('STRIPLINE_VER', '1.5.0');
define('STRIPLINE_DIR', plugin_dir_path(__FILE__));
define('STRIPLINE_URL', plugin_dir_url(__FILE__));
// The Next.js site, for previewing its default images when "חיבור" has no site address.
if (!defined('STRIPLINE_SITE_URL')) define('STRIPLINE_SITE_URL', 'https://stripline.olas.co.il');

require_once STRIPLINE_DIR . 'includes/fields.php';
require_once STRIPLINE_DIR . 'includes/post-types.php';
require_once STRIPLINE_DIR . 'includes/meta-boxes.php';
require_once STRIPLINE_DIR . 'includes/settings.php';
require_once STRIPLINE_DIR . 'includes/rest.php';
require_once STRIPLINE_DIR . 'includes/revalidate.php';
require_once STRIPLINE_DIR . 'includes/import.php';

register_activation_hook(__FILE__, function () {
    stripline_register_post_types();
    flush_rewrite_rules();
});
register_deactivation_hook(__FILE__, 'flush_rewrite_rules');
