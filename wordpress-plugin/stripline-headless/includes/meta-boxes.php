<?php
if (!defined('ABSPATH')) exit;

add_action('add_meta_boxes', function () {
    add_meta_box('sl_product_fields', 'פרטי המוצר', 'stripline_render_product_box', 'sl_product', 'normal', 'high');
    add_meta_box('sl_project_fields', 'פרטי הפרויקט', 'stripline_render_project_box', 'sl_project', 'normal', 'high');
});

function stripline_render_product_box($post) { stripline_render_fields($post, stripline_product_fields(), 'sl_product'); }
function stripline_render_project_box($post) { stripline_render_fields($post, stripline_project_fields(), 'sl_project'); }

/** Field types picked from the media library (uploaded there), never typed as a URL. */
function stripline_media_types(): array {
    return ['image', 'file', 'video', 'gallery', 'logos'];
}

/**
 * Upload / choose / remove control for a media field. The value (a URL, or one URL per line for a
 * gallery, or "name | URL" lines for logos) sits in a hidden input; the script below draws the preview.
 */
function stripline_media_control(string $type, string $name, string $value, string $id = ''): string {
    $conn = stripline_get_connection();
    $base = $conn['next_url'] ?: STRIPLINE_SITE_URL;
    $attrs = ' class="sl-media sl-media-' . esc_attr($type) . '" data-type="' . esc_attr($type) . '" data-base="' . esc_attr($base) . '"';
    $id = $id !== '' ? ' id="' . esc_attr($id) . '"' : '';
    if ($type === 'gallery' || $type === 'logos') {
        return '<div' . $attrs . '>'
            . '<textarea class="sl-media-value" name="' . esc_attr($name) . '"' . $id . ' hidden>' . esc_textarea($value) . '</textarea>'
            . '<ul class="sl-media-list"></ul>'
            . '<button type="button" class="button button-primary sl-media-add">' . ($type === 'gallery' ? 'העלאת תמונות' : 'הוספת לוגו') . '</button>'
            . '</div>';
    }
    return '<div' . $attrs . '>'
        . '<input type="hidden" class="sl-media-value" name="' . esc_attr($name) . '"' . $id . ' value="' . esc_attr($value) . '">'
        . '<div class="sl-media-preview"></div>'
        . '<button type="button" class="button button-primary sl-media-pick"></button> '
        . '<button type="button" class="button sl-media-clear">הסרה</button>'
        . '</div>';
}

/** Checkboxes of all products; the value is one product slug per line. */
function stripline_products_control(string $name, string $value): string {
    $chosen = array_filter(array_map('trim', preg_split('/\r\n|\r|\n/', $value)));
    $products = get_posts(['post_type' => 'sl_product', 'post_status' => 'publish', 'numberposts' => -1, 'orderby' => 'title', 'order' => 'ASC']);
    $h = '<input type="hidden" name="' . esc_attr($name) . '[]" value=""><div class="sl-products">';
    foreach ($products as $p) {
        $code = get_post_meta($p->ID, 'code', true);
        $h .= '<label><input type="checkbox" name="' . esc_attr($name) . '[]" value="' . esc_attr($p->post_name) . '"' . checked(in_array($p->post_name, $chosen, true), true, false) . '> '
            . esc_html($p->post_title) . ($code ? ' <span dir="ltr">(' . esc_html($code) . ')</span>' : '') . '</label>';
    }
    return $h . '</div>';
}

function stripline_render_fields($post, array $fields, string $nonce) {
    wp_nonce_field($nonce . '_save', $nonce . '_nonce');
    echo '<div class="stripline-fields">';
    foreach ($fields as $key => $def) {
        $raw = (string) get_post_meta($post->ID, $key, true);
        $dir = !empty($def['dir']) ? ' dir="' . esc_attr($def['dir']) . '"' : '';
        $id  = 'sl_' . $key;
        echo '<div class="sl-field sl-type-' . esc_attr($def['type']) . '"><label for="' . $id . '"><strong>' . esc_html($def['label']) . '</strong></label><br>';
        switch ($def['type']) {
            case 'textarea':
            case 'lines':
                echo '<textarea id="' . $id . '" name="' . $key . '" rows="' . ($def['type'] === 'lines' ? 4 : 5) . '" class="large-text"' . $dir . '>' . esc_textarea($raw) . '</textarea>';
                break;
            case 'install':
                echo '<textarea id="' . $id . '" name="' . $key . '" rows="10" class="large-text" placeholder="שיטת התקנה&#10;- הגריל מיועד להתקנה בקיר או בתקרה.&#10;- יש לקבוע פתח הכנה בהתאם למידה.&#10;&#10;הערות לביצוע&#10;- ...">' . esc_textarea($raw) . '</textarea>';
                break;
            case 'check':
                echo '<input type="checkbox" id="' . $id . '" name="' . $key . '" value="1"' . checked($raw, '1', false) . '> כן';
                break;
            case 'products':
                echo stripline_products_control($key, $raw);
                break;
            case 'image':
            case 'file':
            case 'video':
            case 'gallery':
                echo stripline_media_control($def['type'], $key, $raw, $id);
                break;
            default:
                echo '<input type="text" id="' . $id . '" name="' . $key . '" value="' . esc_attr($raw) . '" class="regular-text"' . $dir . '>';
        }
        echo '</div>';
    }
    echo '</div>';
}

add_action('save_post', function ($post_id, $post) {
    if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) return;
    if (!current_user_can('edit_post', $post_id)) return;
    $map = ['sl_product' => stripline_product_fields(), 'sl_project' => stripline_project_fields()];
    if (!isset($map[$post->post_type])) return;
    $nonce = $post->post_type . '_nonce';
    if (!isset($_POST[$nonce]) || !wp_verify_nonce($_POST[$nonce], $post->post_type . '_save')) return;
    foreach ($map[$post->post_type] as $key => $def) {
        if ($def['type'] === 'check') {
            update_post_meta($post_id, $key, isset($_POST[$key]) ? '1' : '0');
            continue;
        }
        if (!isset($_POST[$key])) continue;
        $v = wp_unslash($_POST[$key]);
        if ($def['type'] === 'products') $v = implode("\n", array_filter(array_map('sanitize_title', (array) $v)));
        else $v = in_array($def['type'], ['textarea', 'lines', 'install', 'json', 'gallery'], true) ? sanitize_textarea_field($v) : sanitize_text_field($v);
        update_post_meta($post_id, $key, $v);
    }
}, 10, 2);

/* media picker */
add_action('admin_enqueue_scripts', function ($hook) {
    if (!in_array($hook, ['post.php', 'post-new.php', 'edit-tags.php', 'term.php', 'settings_page_stripline', 'toplevel_page_stripline'], true)) return;
    wp_enqueue_media();
    wp_register_script('stripline-admin', false, ['jquery', 'jquery-ui-sortable', 'media-editor'], STRIPLINE_VER, true);
    wp_enqueue_script('stripline-admin');
    wp_add_inline_script('stripline-admin', <<<'JS'
jQuery(function($){
  var WORDS = {image: ['העלאת תמונה', 'החלפת תמונה', 'אין תמונה'], video: ['העלאת סרטון', 'החלפת סרטון', 'אין סרטון'], file: ['העלאת קובץ', 'החלפת קובץ', 'אין קובץ']};
  // Default copy points at the Next.js site ("/n/x.webp"); preview it from there.
  function abs(box, url){ return !url || /^(https?:)?\/\//.test(url) ? url : (box.data('base') || '') + url; }

  // The media window opens on "upload files"; the library tab is one click away.
  function pick(kind, multiple, done){
    var frame = wp.media({
      title: kind === 'video' ? 'העלאת סרטון' : kind === 'file' ? 'העלאת קובץ' : 'העלאת תמונה',
      button: {text: 'בחירה'}, multiple: multiple ? 'add' : false,
      library: kind === 'file' ? {} : {type: kind}
    });
    frame.on('open', function(){ if (frame.content && frame.content.mode) frame.content.mode('upload'); });
    frame.on('select', function(){ done(frame.state().get('selection').toJSON()); });
    frame.open();
  }

  function renderOne(box){
    var kind = box.data('type'), url = box.find('.sl-media-value').val(), pv = box.find('.sl-media-preview').empty();
    if (!url) pv.append($('<span class="sl-media-empty">').text(WORDS[kind][2]));
    else if (kind === 'image') pv.append($('<img alt="">').attr('src', abs(box, url)));
    else if (kind === 'video') pv.append($('<video muted controls preload="metadata">').attr('src', abs(box, url)));
    else pv.append($('<a target="_blank" rel="noopener" dir="ltr">').attr('href', abs(box, url)).text(decodeURIComponent(url.split('/').pop())));
    box.find('.sl-media-pick').text(WORDS[kind][url ? 1 : 0]);
    box.find('.sl-media-clear').toggle(!!url);
  }

  function item(box, url, name){
    var li = $('<li class="sl-media-item">').attr('data-url', url);
    li.append($('<img alt="" title="לחיצה להחלפת התמונה">').attr('src', abs(box, url)));
    if (box.data('type') === 'logos') li.append($('<input type="text" class="sl-media-name" placeholder="שם החברה">').val(name));
    li.append($('<button type="button" class="sl-media-remove" aria-label="הסרה" title="הסרה">×</button>'));
    return li;
  }
  function renderList(box){
    var list = box.find('.sl-media-list').empty(), logos = box.data('type') === 'logos';
    box.find('.sl-media-value').val().split(/\r?\n/).forEach(function(line){
      if (!$.trim(line)) return;
      var cells = line.split('|');
      list.append(logos ? item(box, $.trim(cells.slice(1).join('|')), $.trim(cells[0])) : item(box, $.trim(line), ''));
    });
  }
  function saveList(box){
    var logos = box.data('type') === 'logos';
    box.find('.sl-media-value').val(box.find('.sl-media-item').map(function(){
      var li = $(this);
      return logos ? $.trim(li.find('.sl-media-name').val()).replace(/\|/g, '/') + ' | ' + li.attr('data-url') : li.attr('data-url');
    }).get().join('\n'));
  }

  function render(box){ box.is('.sl-media-gallery, .sl-media-logos') ? renderList(box) : renderOne(box); }
  function init(box){
    render(box);
    box.find('.sl-media-list').sortable({items: '> li', cancel: 'input, button', update: function(){ saveList(box); }});
  }
  $('.sl-media').each(function(){ init($(this)); });

  $(document).on('click', '.sl-media-pick', function(e){
    e.preventDefault();
    var box = $(this).closest('.sl-media');
    pick(box.data('type'), false, function(sel){ box.find('.sl-media-value').val(sel[0].url).trigger('change'); renderOne(box); });
  });
  $(document).on('click', '.sl-media-clear', function(e){
    e.preventDefault();
    var box = $(this).closest('.sl-media');
    box.find('.sl-media-value').val('').trigger('change');
    renderOne(box);
  });
  $(document).on('click', '.sl-media-add', function(e){
    e.preventDefault();
    var box = $(this).closest('.sl-media');
    pick('image', true, function(sel){
      sel.forEach(function(a){ box.find('.sl-media-list').append(item(box, a.url, box.data('type') === 'logos' ? (a.title || '') : '')); });
      saveList(box);
    });
  });
  $(document).on('click', '.sl-media-remove', function(e){
    e.preventDefault();
    var box = $(this).closest('.sl-media');
    $(this).closest('li').remove();
    saveList(box);
  });
  $(document).on('click', '.sl-media-item img', function(){
    var li = $(this).closest('li'), box = li.closest('.sl-media'), img = $(this);
    pick('image', false, function(sel){ li.attr('data-url', sel[0].url); img.attr('src', sel[0].url); saveList(box); });
  });
  $(document).on('input', '.sl-media-name', function(){ saveList($(this).closest('.sl-media')); });

  // "Add family" posts by AJAX and keeps the form: empty its pickers for the next one.
  $(document).ajaxSuccess(function(e, xhr, opts){
    if (opts && typeof opts.data === 'string' && opts.data.indexOf('action=add-tag') !== -1) {
      $('#addtag .sl-media').each(function(){ $(this).find('.sl-media-value').val(''); render($(this)); });
    }
  });
});
JS
    );
    wp_add_inline_style('wp-admin', implode("\n", [
        '.stripline-fields .sl-field{padding:10px 0;border-bottom:1px solid #f0f0f0} .stripline-fields textarea,.stripline-settings textarea{direction:rtl} .stripline-fields [dir=ltr],.stripline-settings [dir=ltr]{direction:ltr;text-align:left} .stripline-settings textarea::placeholder,.stripline-settings input::placeholder{color:#a7aaad}',
        '.sl-media{margin-top:6px} .sl-media-preview{margin-bottom:8px} .sl-media-preview img,.sl-media-preview video{display:block;max-width:320px;max-height:180px;border:1px solid #dcdcde;border-radius:4px;background:#f6f7f7 repeating-conic-gradient(#f0f0f1 0 25%,#fff 0 50%) 0 0/16px 16px}',
        '.sl-media-empty{display:inline-block;padding:18px 26px;border:1px dashed #c3c4c7;border-radius:4px;color:#787c82}',
        '.sl-media-list{display:flex;flex-wrap:wrap;gap:10px;margin:0 0 10px;padding:0} .sl-media-item{position:relative;margin:0;padding:4px;border:1px solid #dcdcde;border-radius:4px;background:#fff;cursor:move}',
        '.sl-media-item img{display:block;width:130px;height:90px;object-fit:cover;border-radius:3px;cursor:pointer} .sl-media-logos .sl-media-item img{object-fit:contain;background:#f6f7f7}',
        '.sl-media-name{display:block;width:130px;margin-top:4px} .sl-media-remove{position:absolute;top:-8px;left:-8px;width:22px;height:22px;padding:0;border:0;border-radius:50%;background:#d63638;color:#fff;font-size:15px;line-height:22px;cursor:pointer}',
        '.sl-products{max-height:220px;overflow:auto;padding:8px;border:1px solid #dcdcde;border-radius:4px;columns:3 220px} .sl-products label{display:block;padding:2px 0;break-inside:avoid}',
    ]));
});
