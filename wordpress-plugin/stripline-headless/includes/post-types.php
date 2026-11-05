<?php
if (!defined('ABSPATH')) exit;

function stripline_register_post_types(): void {
    register_post_type('sl_product', [
        'labels' => [
            'name' => 'מוצרים', 'singular_name' => 'מוצר', 'add_new' => 'מוצר חדש', 'add_new_item' => 'הוספת מוצר',
            'edit_item' => 'עריכת מוצר', 'menu_name' => 'מוצרים STRIPLINE', 'search_items' => 'חיפוש מוצר',
        ],
        'public' => true,
        'publicly_queryable' => false,
        'show_in_rest' => true,
        'menu_icon' => 'dashicons-grid-view',
        'menu_position' => 5,
        'supports' => ['title', 'thumbnail', 'page-attributes'],
        'has_archive' => false,
        'rewrite' => ['slug' => 'product'],
    ]);

    register_taxonomy('sl_family', 'sl_product', [
        'labels' => ['name' => 'משפחות מוצרים', 'singular_name' => 'משפחה', 'menu_name' => 'משפחות מוצרים', 'add_new_item' => 'הוספת משפחה'],
        'public' => true,
        'hierarchical' => true,
        'show_in_rest' => true,
        'show_admin_column' => true,
        'rewrite' => ['slug' => 'family'],
    ]);

    register_post_type('sl_project', [
        'labels' => ['name' => 'פרויקטים', 'singular_name' => 'פרויקט', 'add_new_item' => 'הוספת פרויקט', 'edit_item' => 'עריכת פרויקט', 'menu_name' => 'פרויקטים'],
        'public' => true,
        'publicly_queryable' => false,
        'show_in_rest' => true,
        'menu_icon' => 'dashicons-building',
        'menu_position' => 6,
        'supports' => ['title', 'thumbnail', 'page-attributes'],
    ]);

    register_post_type('sl_lead', [
        'labels' => ['name' => 'פניות מהאתר', 'singular_name' => 'פנייה', 'menu_name' => 'פניות מהאתר'],
        'public' => false,
        'show_ui' => true,
        'menu_icon' => 'dashicons-email',
        'menu_position' => 7,
        'supports' => ['title', 'editor'],
        'capabilities' => ['create_posts' => 'do_not_allow'],
        'map_meta_cap' => true,
    ]);
}
add_action('init', 'stripline_register_post_types');

/* Family term meta: english name, hebrew description, room photo (sl_image), grid tile (sl_tile), order */
add_action('sl_family_add_form_fields', function () {
    ?>
    <div class="form-field"><label for="sl_name_en">שם באנגלית</label><input type="text" name="sl_name_en" id="sl_name_en" dir="ltr"></div>
    <div class="form-field"><label for="sl_image">תמונת אווירה (בראש עמוד המשפחה ובעמודי המוצרים)</label><?php echo stripline_media_control('image', 'sl_image', '', 'sl_image'); ?></div>
    <div class="form-field"><label for="sl_tile">תמונת המשבצת בעמוד משפחות המוצרים</label><?php echo stripline_media_control('image', 'sl_tile', '', 'sl_tile'); ?></div>
    <div class="form-field"><label for="sl_order">סדר</label><input type="number" name="sl_order" id="sl_order" value="0"></div>
    <?php
});
add_action('sl_family_edit_form_fields', function ($term) {
    $en = get_term_meta($term->term_id, 'sl_name_en', true);
    $img = get_term_meta($term->term_id, 'sl_image', true);
    $tile = get_term_meta($term->term_id, 'sl_tile', true);
    $ord = get_term_meta($term->term_id, 'sl_order', true);
    ?>
    <tr class="form-field"><th><label for="sl_name_en">שם באנגלית</label></th><td><input type="text" name="sl_name_en" id="sl_name_en" dir="ltr" value="<?php echo esc_attr($en); ?>"></td></tr>
    <tr class="form-field"><th><label for="sl_image">תמונת אווירה (בראש עמוד המשפחה ובעמודי המוצרים)</label></th><td><?php echo stripline_media_control('image', 'sl_image', (string) $img, 'sl_image'); ?></td></tr>
    <tr class="form-field"><th><label for="sl_tile">תמונת המשבצת בעמוד משפחות המוצרים</label></th><td><?php echo stripline_media_control('image', 'sl_tile', (string) $tile, 'sl_tile'); ?></td></tr>
    <tr class="form-field"><th><label for="sl_order">סדר</label></th><td><input type="number" name="sl_order" id="sl_order" value="<?php echo esc_attr($ord ?: 0); ?>"></td></tr>
    <?php
});
foreach (['created_sl_family', 'edited_sl_family'] as $hook) {
    add_action($hook, function ($term_id) {
        foreach (['sl_name_en', 'sl_image', 'sl_tile', 'sl_order'] as $k) {
            if (isset($_POST[$k])) update_term_meta($term_id, $k, sanitize_text_field(wp_unslash($_POST[$k])));
        }
    });
}
