// startup.js
// @author octopoulo <polluxyz@gmail.com>
// @version 2021-05-02
//
// Startup
// - start everything: 3d, game, ...
// - global window events
// - resize window and elements
// - handle most events / settings
//
// included after: common, engine, global, 3d, xboard, game, network
// jshint -W069
/*
globals
_, __PREFIX:true, A, action_key, action_key_no_input, action_keyup_no_input, activate_tabs, add_history, add_timeout,
ANCHORS:true, api_times:true, api_translate_get, ARCHIVE_KEYS, Assign, Attrs, AUTO_ON_OFF, BOARD_THEMES,
C, CacheId, cannot_click, cannot_popup, change_page, change_queue, change_setting, change_setting_game, change_theme,
changed_hash, changed_section, charts, check_hash, check_socket_io, Clamp, Class, Clear, clear_timeout, close_popups,
context_areas, context_target:true,
DEFAULT_SCALES, DEFAULTS, detect_device, DEV, DEV_NAMES, device, document, download_tables, draw_rectangle,
E, Events, export_settings, exports, FileReader, find_area, Floor, From, game_action_key, game_action_keyup, get_area,
get_drop_id, get_object, global, guess_types, handle_board_events, HasClass, HasClasses, hashes, Hide, HIDES, HTML,
ICONS:true, import_settings, Index, init_graph, is_fullscreen, KEY_TIMES, Keys, KEYS,
LANGUAGES:true, listen_log, load_defaults, load_library, load_preset, LOCALHOST, location, Max, merge_settings, Min,
move_pane, navigator, NO_IMPORTS, Now, ON_OFF, open_table, option_number, order_boards, PANES, Parent, ParseJSON, PD,
PIECE_THEMES, populate_areas, POPUP_ADJUSTS, require, reset_defaults, reset_old_settings, reset_settings,
resize_bracket, resize_game, resize_move_lists, resize_table, resume_sleep,
S, SafeId, save_option, scroll_adjust, ScrollDocument, set_draggable, set_engine_events, set_game_events, set_section,
SetDefault, SHADOW_QUALITIES, Show, show_banner, show_board_info, show_filtered_games, show_popup, SP, start_3d,
start_game, startup_3d, startup_config, startup_game, startup_graph, Style, TAB_NAMES, TABLES, TEXT, TextHTML, THEMES,
TIMEOUT_adjust, TIMEOUT_tables, timers, toggle_fullscreen, touch_handle, translate_nodes, TRANSLATE_SPECIALS,
translates:true, TYPES,
Undefined, update_board_theme, update_debug, update_pgn, update_theme, update_twitch, VERSION,
virtual_change_setting_special:true, virtual_check_hash_special:true, virtual_hide_areas:true,
virtual_import_settings:true, virtual_opened_table_special:true, virtual_populate_areas_special:true,
virtual_reset_settings_special:true, virtual_resize:true, virtual_set_modal_events_special:true, Visible, VisibleWidth,
WB_LOWER, wheel_event, window, X_SETTINGS, xboards, Y, y_x
*/
'use strict';

// <<
if (typeof global != 'undefined') {
    ['3d', 'common', 'engine', 'game', 'global'].forEach(key => {
        Object.assign(global, require(`./${key}.js`));
    });
}
// >>

let AD_STYLES = {},
    CHAMPIONS = [],
    CONFIGURE_KEYS = {
        'd': 'depth',
        'D': 1,
        'e': 'evaluation',
        'h': 1,
        'n': 1,
        'o': 1,
        'p': 1,
        'q': 1,
        's': 'search',
        't': 'time',
        'x': 1,
        'X': 1,
    },
    CONTEXT_MENUS = {
        '#engine': 'engine',
        '#eval0, #eval1, #table-search': 'extra',
        '.moves': 'copy_copy',
        '.pagin, #table-tabs': 'extra',
        '#pva-pv': 'copy_pva',
        '.status': 'hide',
        '#table-chat': 'quick',
        '#table-agree, #table-depth, #table-eval, #table-mobil, #table-node, #table-speed, #table-tb, #table-time':
            'graph',
        '.swaps': 'panel',
    },
    drag_source,
    LEVELS = {
        'custom': '',
        'dog': 'd=3 e=hce h=1 q=0 s=ab t=0',
        'ninja dog': 'd=4 e=hce h=1 q=0 s=ab t=0',
        'novice': 'd=4 e=hce h=1 o=2 q=5 s=ab t=0 x=20',
        'amateur': 'd=4 e=att h=1 o=2 q=8 s=ab t=2 x=20',
        'engine maker': 'd=5 e=att h=1 o=2 q=12 s=ab t=5 x=20',
        'chess player': 'd=6 e=att h=1 o=2 q=15 s=ab t=10 x=20',
        'chess teacher': 'd=7 e=att h=1 o=2 q=20 s=ab t=12 x=20',
        'other engine': 'd=8 e=att h=1 o=2 q=30 s=ab t=20 x=20',
    },
    old_font_height,
    old_stream = 0,
    old_window_height,
    old_x,
    PRESETS = [
        'custom',
        'default settings',
        '4 columns',
        'jerehmia',
        'kanchess',
        'low battery',
        'minimal',
        'octopoulo',
        'sopel',
        'stream',
        'stream2',
        'terjeweiss',
    ],
    ready = 0,
    resume_time = Now(),
    SCALES = [
        '4=eval',
        '16=boom',
        '0=linear',
        '1=logarithmic',
        '10=split auto',
        '2=split linear',
        '3=split logarithmic',
    ],
    SHORTCUT_NAMES = {
        'Event Stats': 'Stats',
    },
    stream_click = 0,
    TIMEOUT_adblock = 15000,
    TIMEOUT_font = 2000,
    TIMEOUT_google_ad = 5000,
    TIMEOUT_quick = 20,
    TIMEOUT_resume = 3000,
    TIMEOUT_size = 1000,
    TIMEOUT_stream = 40000,
    TIMEOUT_three = 5000,
    TIMEOUT_twitch = 5000;

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Same as action_key_no_input, but when the key is up
 * @param {number} code hardware keycode
 */
function action_keyup_no_input(code) {
}

/**
 * Handle keys, even when an input is active
 * @param {number} code hardware keycode
 */
function action_key(code) {
    switch (code) {
    // escape
    case 27:
        close_popups();
        break;
    }
}

/**
 * Adjust popup position
 */
function adjust_popups() {
    show_popup('', null, {adjust: true});
}

/**
 * Use an audio set
 * @param {string|number} set custom, bamboo
 */
function audio_set(set) {
    let audio_settings = X_SETTINGS['audio'],
        prefix = `${set} - `;

    Keys(audio_settings).forEach(key => {
        if (key.slice(0, 6) != 'sound_')
            return;
        let choice = audio_settings[key][0].filter(value => value.slice(0, prefix.length) == prefix)[0];
        if (choice != undefined) {
            save_option(key, choice);
            _(`select[name="${key}"]`).value = choice;
        }
    });
}

/**
 * Handler for change settings
 * @param {string} name
 * @param {string|number} value
 * @param {boolean=} close close the popup
 * @returns {boolean} true if we've handled the setting
 */
function change_setting_special(name, value, close) {
    clear_timeout('close_popup');
    if (!name)
        return false;

    // close contextual popup?
    if (close) {
        let modal = SafeId('modal');
        if (modal.dataset['xy'] || close == 2)
            close_popups();
    }

    //
    if (name != 'preset')
        Y.preset = 'custom';

    let main = xboards[y_x],
        pva = xboards['pva'],
        result = true;

    add_history();

    switch (name) {
    case 'animate':
    case 'board_theme':
    case 'highlight_color':
    case 'highlight_size':
    case 'notation':
    case 'piece_theme':
        update_board_theme(1);
        break;
    case 'animate_pv':
    case 'board_theme_pv':
    case 'highlight_color_pv':
    case 'highlight_size_pv':
    case 'notation_pv':
    case 'piece_theme_pv':
        update_board_theme(2);
        break;
    case 'animate_pva':
    case 'board_theme_pva':
    case 'highlight_color_pva':
    case 'highlight_size_pva':
    case 'notation_pva':
    case 'piece_theme_pva':
        update_board_theme(4);
        break;
    case 'audio_set':
        audio_set(value);
        break;
    case 'background_color':
    case 'background_opacity':
        update_background();
        break;
    case 'background_reset':
        reset_defaults(/^background_/);
        update_background();
        break;
    case 'chat_height':
    case 'column_bottom':
    case 'column_top':
    case 'controls':
    case 'graph_min_width':
    case 'max_center':
    case 'max_left_2':
    case 'max_left':
    case 'max_right_2':
    case 'max_right':
    case 'max_window':
    case 'min_center':
    case 'min_left_2':
    case 'min_left':
    case 'min_right_2':
    case 'min_right':
    case 'panel_gap':
    case 'tabs_per_row':
        resize();
        break;
    case 'click_here_to_RESET_everything':
        reset_settings(true);
        save_option('last_preset', '');
        add_timeout('quick', () => quick_setup(true), TIMEOUT_quick);
        break;
    case 'custom_black':
    case 'custom_black_pv':
    case 'custom_black_pva':
    case 'custom_white':
    case 'custom_white_pv':
    case 'custom_white_pva':
        let is_pv = (name.slice(-2) == 'pv'),
            is_pva = (name.slice(-3) == 'pva'),
            field = `board_theme${is_pva? '_pva': (is_pv? '_pv': '')}`;
        save_option(field, 'custom');
        (_(`select[name="${field}"]`) || {}).value = Y[field];
        update_board_theme(is_pva? 4: (is_pv? 2: 1));
        break;
    case 'default_positions':
        Y['areas'] = Assign({}, DEFAULTS['areas']);
        populate_areas(true);
        break;
    case 'drag_and_drop':
        set_draggable();
        break;
    case 'engine_font':
    case 'engine_spacing':
    case 'graph_aspect_ratio':
    case 'panel_adjust':
    case 'status_pv':
        resize_panels();
        break;
    case 'eval':
    case 'eval_left':
    case 'moves':
    case 'moves_live':
    case 'moves_pv':
    case 'moves_pva':
    case 'percent':
    case 'percent_width':
    case 'single_line':
        resize_panels();
        resize_game();
        break;
    case 'export_settings':
        export_settings(Y['last_preset'] || 'tcec-settings');
        break;
    case 'game_960':
        pva.frc = value;
        pva.delayed_picks();
        break;
    case 'game_advice':
        pva.finished = false;
        pva.set_ai(false);
        pva.think(true);
        break;
    case 'game_depth':
        configure('d', value);
        break;
    case 'game_evaluation':
        configure('e', value);
        break;
    case 'game_level':
        configure_string(value + '');
        break;
    case 'game_new_FEN':
    case 'game_new_game':
        pva.frc = Y['game_960'];
        pva.new_game();
        break;
    case 'game_search':
        configure('s', value);
        break;
    case 'game_think':
        pva.finished = false;
        pva.set_ai(true);
        pva.think();
        break;
    case 'game_time':
        configure('t', value);
        break;
    case 'grid':
    case 'grid_copy':
    case 'grid_live':
    case 'grid_pv':
    case 'grid_pva':
    case 'move_font':
    case 'move_font_copy':
    case 'move_font_live':
    case 'move_font_pv':
    case 'move_font_pva':
    case 'move_height':
    case 'move_height_copy':
    case 'move_height_live':
    case 'move_height_pv':
    case 'move_height_pva':
    case 'PV_height':
        resize_move_lists();
        break;
    case 'hardware':
        resize();
        break;
    case 'hide':
        hide_element(context_target);
        break;
    case 'import_settings':
        let json = ParseJSON(value + '');
        if (json)
            import_settings(json, true);
        break;
    case 'join_next':
        tab_element(context_target);
        break;
    case 'live_log':
        if (Visible(CacheId('table-log')))
            listen_log();
        break;
    case 'mobility':
        update_visible();
        break;
    case 'moves_copy':
        populate_areas();
        break;
    case 'preset':
        load_preset(value + '');
        save_option('last_preset', value);
        break;
    case 'shortcut_1':
    case 'shortcut_2':
    case 'shortcut_3':
        update_shortcuts();
        break;
    // refresh the Engine tab
    case 'SI_units':
    case 'small_decimal':
        handle_board_events(main, 'ply', main.moves[main.ply]);
        break;
    case 'theme':
        change_theme(value);
        break;
    case 'unhide':
        Keys(context_areas).forEach(key => {
            context_areas[key][2] |= 1;
        });
        populate_areas(true);
        break;
    case 'use_for_arrow':
        for (let id of [2, 3])
            save_option(`arrow_color_${id}`, Y[`graph_color_${id}`]);
        break;
    default:
        result = change_setting_game(name, value);
    }

    // show custom colors
    if (name.includes('board_theme'))
        show_custom_colors(name);

    add_history();
    return !!result;
}

/**
 * Update the theme
 * - if we're in the archive, then also add the [theme]-archive.css
 * @param {string|number=} theme
 */
function change_theme(theme) {
    let def = THEMES[0];
    if (theme != undefined)
        save_option('theme', theme || def);

    theme = Y['theme'] || '';
    let themes = [theme];
    // TODO: make sure every theme is included in THEMES
    if (y_x == 'archive')
        themes.push(`${theme}-archive`);

    // update favicon only when needed
    let icon = `image/favicon${theme.includes('dark')? 'b': ''}.ico`,
        node = _('link[rel="shortcut icon"]');
    if (node && node.href.slice(-icon.length) != icon)
        node.href = icon;

    S(CacheId('theme0'), theme != def);
    S(CacheId('theme1'), theme == def);
    update_theme(themes);
}

/**
 * Called whenever the page loads and whenever the hash changes
 * @param {Object} dico
 */
function check_hash_special(dico) {
    check_stream();

    // handle a short url
    let archive_keys = ARCHIVE_KEYS.filter(key => dico[key] != undefined),
        section = y_x;
    if (archive_keys.length) {
        for (let key of ARCHIVE_KEYS)
            if (dico[key] == undefined)
                Y[key] = undefined;
        section = 'archive';
    }
    else if (!dico['x'])
        section = 'live';

    if (!['archive', 'live'].includes(section))
        section = 'live';
    hashes[section] = dico;
    set_section(section);
    Y.s = section;

    let is_live = (section == 'live'),
        parent = CacheId('tables');
    Class(CacheId('nav-archive'), 'yellow', !is_live);
    Class(CacheId('nav-live'), 'red', is_live);
    change_theme();

    populate_areas();
    S('.tab[data-x="season"]', !is_live, parent);
    S('.tab[data-x="log"]', is_live, parent);

    Attrs('[data-x="sched"] i[data-t]', {'data-t': is_live? 'Schedule': 'Games'});
    translate_nodes(CacheId('table-tabs'));

    // changed section
    if (ready)
        changed_hash();

    if (section != old_x) {
        old_x = section;
        if (old_x == 'live')
            Y.game = 0;

        changed_section();
        close_popups();
    }

    if (!ready)
        activate_tabs();
}

/**
 * Check stream settings
 */
function check_stream() {
    // stream.html => also activates stream=1
    if (location.pathname.includes('stream.html')) {
        Y.stream = 1;
        set_section('live');
        Y.s = 'live';
    }

    let stream = Y.stream;
    if (stream == old_stream)
        return;
    Y.stream = stream;

    if (!stream) {
        clear_timeout('stream');
        return;
    }

    load_preset('stream2');
    Assign(Y, {
        'language': 'eng',
        'twitch_chat': 0,
        'twitch_video': 0,
    });
    scroll_adjust('#overview');
    Hide('.adblock, .google-ad');

    // alternate between shortcut_1/2/3
    if (!timers['stream'])
        add_timeout('stream', () => {
            stream_click ++;

            let shortcuts = [1, 2, 3].map(id => _(`.tab[data-x="shortcut_${id}"]`)).filter(node => Visible(node)),
                target = shortcuts[stream_click % 3];
            if (target)
                target.click();

            if (!Y.stream)
                clear_timeout('stream');
        }, TIMEOUT_stream, true);
}

/**
 * Create the player options
 * @param {string} name
 * @param {number|string} value
 * @param {string=} only_color only process this color
 */
function configure(name, value, only_color) {
    for (let scolor of WB_LOWER) {
        if (only_color && scolor != only_color)
            continue;

        // create the dico
        let key = `game_options_${scolor}`,
            options = Y[key].split(' '),
            result = {};
        for (let option of options) {
            let items = option.split('=');
            if (items.length < 2 || !CONFIGURE_KEYS[items[0]])
                continue;
            result[items[0]] = items[1];
        }
        result[name] = value;

        // create the command line
        let line = Keys(result).sort().map(key => `${key}=${result[key]}`).join(' '),
            node = _(`textarea[name="${key}"]`);
        save_option(key, line);
        if (node)
            node.value = Y[key];

        // existing level?
        let found = 'custom';
        Keys(LEVELS).forEach(name => {
            let level = LEVELS[name];
            if (level == line)
                found = name;
        });
        let input = _('#modal select[name="game_level"]');
        if (input)
            input.value = found;
    }
}

/**
 * Configure a game preset
 * @param {string} name
 */
function configure_string(name) {
    let level = LEVELS[name],
        options = level.split(' ');

    // options b&w
    if (name != 'custom')
        for (let scolor of WB_LOWER) {
            let key = `game_options_${scolor}`,
                input = _(`#modal [name="${key}"]`);
            if (input)
                input.value = level;
            save_option(key, level);
        }

    // other inputs
    for (let option of options) {
        let items = option.split('='),
            config = CONFIGURE_KEYS[items[0]];
        if (items.length < 2 || !config)
            continue;
        let key = `game_${config}`,
            input = _(`#modal [name="${key}"]`),
            value = items[1];
        if (input)
            input.value = value;
        save_option(key, value);
    }
}

/**
 * Create the swap elements for each panel
 */
function create_swaps() {
    let swaps = ['end|1', 'next|1', 'next', 'end', 'minus', 'plus'].map(svg => {
        let items = svg.split('|');
        return [
            `<div class="swap${items[1]? ' mirror': ''}">`,
                `<i data-svg="${items[0]}"></i>`,
            '</div>',
        ].join('');
    });

    let html = [
        swaps.join(''),
        '<div class="swap size dn"></div>',
    ].join('');

    HTML('.swaps', html);

    // events
    C('.swap', function(e) {
        let index = Index(this),
            node = this.parentNode.parentNode;
        // 1, 2, 3, 4 => <<[-3] <[-1] >[1] >>[3]
        if (index <= 4)
            move_pane(node, index * 2 - 5);
        // 5, 6 => -[-1] +[1]
        else if (index <= 6) {
            let add = index * 2 - 11,
                name = `max_${node.id}`,
                sizer = _('.size', node),
                value = Y[name];

            if (add > 0)
                value += (value < 0)? 1: add * 10;
            else if (value > 0 && value < 10)
                value = 0;
            else
                value += add * 10;

            save_option(name, Clamp(value, -1, 1200));
            TEXT(sizer, Y[name]);
            Show(sizer);
            add_timeout('size', () => Hide('.size'), TIMEOUT_size);
            resize();
        }
        SP(e);
    });
}

/**
 * Fix old settings
 */
function fix_old_settings() {
    // 1) add missing panel
    let areas = Y['areas'],
        default_areas = DEFAULTS['areas'],
        populate = 0;
    Keys(default_areas).forEach(key => {
        if (!areas[key])
            areas[key] = default_areas[key];
    });

    // 2) insert "agree" somewhere if doesn't exist
    let found = find_area('table-agree');
    if (found.id < 0) {
        for (let key of Keys(areas)) {
            let id, prev,
                vector = areas[key];

            for (let i = vector.length - 1; i >= 0; i --) {
                let item = vector[i];
                if ((item[1] & 1) && (item[2] & 1) && item[0].slice(0, 6) == 'table-') {
                    id = i;
                    prev = item;
                    break;
                }
            }
            if (prev) {
                vector.splice(id + 1, 0, ['table-agree', prev[1], 1]);
                prev[1] = 1;
                populate ++;
                break;
            }
        }
    }

    // 3) insert shortcut_3 after shortcut_2
    let name = 'shortcut_3',
        found3 = find_area(name);
    if (found3.id < 0) {
        let found = find_area('shortcut_2');
        if (found.id >= 0) {
            let area = found.area,
                vector = areas[found.key];
            vector.splice(found.id + 1, 0, [name, area[1], 1]);
            area[1] = 1;
            area[2] |= 1;
            populate ++;
        }
    }

    if (populate && ready)
        populate_areas();

    // 4) move height from em => px
    // - guess, min height is 39px normally, so anything under that = old setting, but will miss values over
    Keys(Y).filter(key => key.slice(0, 11) == 'move_height').forEach(key => {
        let value = Y[key];
        if (value < 39)
            save_option(key, Floor(value * 26) / 2);
    });
}

/**
 * Handle a drop event
 * @param {Event} e
 */
function handle_drop(e) {
    if (!Y['drag_and_drop'])
        return;
    add_history();

    let child = get_drop_id(e.target).node,
        in_tab = 0,
        parent = Parent(e.target, {class_: 'area', self: true}),
        rect = child? child.getBoundingClientRect(): null;

    // 1) resolve tab => nodes
    if (HasClass(drag_source, 'drop')) {
        drag_source = CacheId(drag_source.dataset['x']);
        in_tab |= 1;
    }
    if (HasClass(child, 'drop')) {
        child = CacheId(child.dataset['x']);
        in_tab |= 2;
    }

    if (parent && drag_source != child) {
        let next,
            parent_areas = new Set([
                get_area(drag_source).id,
                parent.id,
            ]),
            prev_source = drag_source.previousElementSibling,
            prev_tabbed = (context_areas[drag_source.id] || [])[1];

        // 2) insert before or after
        if (child) {
            if (parent.tagName == 'HORIS' || (in_tab & 2)) {
                if (e.clientX >= rect.left + rect.width / 2)
                    next = true;
            }
            else if (e.clientY >= rect.top + rect.height / 2)
                next = true;
        }
        parent.insertBefore(drag_source, next? child.nextElementSibling: child);

        // 3) from/to tabs
        let context_area = SetDefault(context_areas, drag_source.id, [drag_source.id, 0, 1]);
        if (in_tab & 2) {
            if (next) {
                let prev_context = context_areas[child.id] || [];
                context_area[1] = prev_context[1] || 0;
                prev_context[1] = 1;
            }
            else
                context_area[1] = 1;
        }
        else
            context_area[1] = 0;

        // zero the last tab
        if ((in_tab & 1) && prev_source && prev_tabbed == 0) {
            let prev_context = context_areas[prev_source.id || prev_source.dataset['x']] || [];
            prev_context[1] = 0;
        }

        // 4) update areas
        let areas = Y['areas'];
        for (let parent of parent_areas)
            areas[parent] = From(SafeId(parent).children).filter(child => child.id).map(child => {
                let context_area = context_areas[child.id] || [];
                return [child.id, context_area[1] || 0, Undefined(context_area[2], 1)];
            });

        populate_areas();
    }

    set_draggable();
    SP(e);
    PD(e);
    add_history();
}

/**
 * Which elements should be hidden dynamically?
 * - used at the start of populate_areas
 * @param {Object} hides
 */
function hide_areas(hides) {
    if (!Y['moves_copy'])
        hides[`moves-${y_x}`] = 1;
}

/**
 * Hide a drag element
 * @param {Node} target
 */
function hide_element(target) {
    let drop = get_drop_id(target),
        areas = Y['areas'];
    if (!drop.node)
        return;

    Keys(areas).forEach(key => {
        for (let vector of areas[key])
            if (vector[0] == drop.id) {
                vector[2] &= ~1;
                break;
            }
    });

    Hide(drop.node);
    populate_areas();
}

/**
 * Happens after the settings are imported
 */
function import_settings_special() {
    fix_old_settings();
    activate_tabs();
    resize();
}

/**
 * Init custom settings
 * @param {boolean=} initial
 */
function init_customs(initial) {
    add_timeout('twitch', update_twitch, initial? TIMEOUT_twitch: 0);
    change_theme();
    resize_move_lists();
    show_live_engines();
    set_draggable();
    populate_areas();
    update_board_theme(7);
    update_background();
}

/**
 * Ran once at the last initialisation step
 */
function init_globals() {
    changed_hash();
    api_translate_get(Y.new_version);

    TEXT(CacheId('version'), VERSION);
    HTML(CacheId('champions'), CHAMPIONS.map(text => {
        let [season, winner] = text.split('|');
        return `<i data-t="Season"></i> ${season}: ${winner}`;
    }).join(' | '));

    // load local data directly, and later online data
    download_tables(true);
    download_tables(false, 2);
    add_timeout('tables', () => download_tables(false, 1), TIMEOUT_tables);

    // delayed loading
    show_banner();
    update_twitch(null, null, true);
    if (Y.three)
        add_timeout('three', () => set_3d_scene, TIMEOUT_three);

    // google ads
    if (!Y.no_ad && !DEV['ad'] && !LOCALHOST) {
        add_timeout('adblock', () => {
            if (_('.google-ad').clientHeight <= 0) {
                HTML('.adblock', HTML(CacheId('adblock')));
                Show('.adblock');
            }
        }, TIMEOUT_adblock);

        add_timeout('ad', insert_google_ads, TIMEOUT_google_ad);
    }
    // load_google_analytics();

    // font size detector
    add_timeout('font', () => {
        let font_height = SafeId('text').offsetHeight;
        if (font_height != old_font_height || window.innerHeight != old_window_height)
            resize();

        if (Y.stream)
            ScrollDocument(CacheId('overview'));
    }, TIMEOUT_font, true);

    // suspend/resume
    add_timeout('resume', () => {
        let now = Now(),
            diff = now - resume_time;
        if (diff * 1000 > TIMEOUT_resume * 3)
            resume_sleep(resume_time);
        resume_time = now;
    }, TIMEOUT_resume, true);

    if (ready == 1)
        create_swaps();
}

/**
 * Insert one google ad
 * @param {number} id
 */
function insert_google_ad(id) {
    let [suffix, width, height] = [
            [9, 252, 210],
            [2021, 438, 250],
        ][id],
        html = [
            // '<ins class="adsbygoogle"',
            //     `style="display:block;${AD_STYLES[id] || ''}"`,
            //     'data-ad-client="ca-pub-6544406400639567"',
            //     'data-ad-slot="4926769371"',
            //     'data-ad-format="auto"',
            //     'data-full-width-responsive="true">',
            // '</ins>',
            '<a rel="nofollow" href="https://www.chessdom.com/" target="_blank">',
                `<img src="image/Chessdom_${suffix}.png" width="${width}" height="${height}">`,
            '</a>'
        ].join('');

    HTML(`#ad${id} > hori`, html);
    (window.adsbygoogle = window.adsbygoogle || []).push({});
}

/**
 * Insert google ads after some time
 */
function insert_google_ads() {
    insert_google_ad(0);
    insert_google_ad(1);

    // load_library('//pagead2.googlesyndication.com/pagead/js/adsbygoogle.js', null, {async: ''});
}

/**
 * Load Google Analytics library
 */
function load_google_analytics() {
    window._gaq = window._gaq || [];
    window._gaq.push(
        ['_setAccount', 'UA-37458566-1'],
        ['_trackPageview'],
        ['b._setAccount', 'UA-1679851-1'],
        ['b._trackPageview']
    );

    load_library(('https:' == location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js');
}

/**
 * A table was opened => extra handling
 * @param {Node} node
 * @param {string} name
 * @param {Node} tab
 */
function opened_table_special(node, name, tab) {
    if (['chat', 'information', 'winner'].includes(name))
        update_twitch(null, null, true);
}

/**
 * Called after populate_areas
 */
function populate_areas_special() {
    show_archive_live();
    update_shortcuts();
    add_timeout('populate', resize, 100);
}

/**
 * Quick setup when the site is loaded for the first time
 * - except if #seen=1, or if in the archive
 * @param {boolean=} force
 */
function quick_setup(force) {
    let old = Y.new_version;
    if (!force && (old == undefined || old >= '20210109e' || Y.seen || y_x == 'archive' || Y.stream))
        return;
    activate_tabs();
    show_popup('options', true, {center: 1, overlay: 1, setting: 'quick_setup'});
}

/**
 * Reset to the default/other settings
 * @param {boolean} is_default
 */
function reset_settings_special(is_default) {
    if (is_default) {
        load_settings();
        check_hash();
        init_globals();
    }

    init_customs();
    close_popups();
    resize();
}

/**
 * Resize the window => resize some other elements
 */
function resize() {
    // 1) tabs per row
    Style('.tabs > .tab', `flex-basis:${Floor(200 / Y['tabs_per_row']) / 2}%`);

    // 2) limit each panel
    Style(
        '#banners, #bottom, #main, .pagin, .scroller, #sub-header, #table-log, #table-search, #table-status'
        + ', #table-tabs, #top',
        `max-width:${Y['max_window']}px`
    );

    // 3) chat height => resize all sibling tabs
    let chat_height = Clamp(Y['chat_height'], 350, window.height),
        chat_tab = _('.tab[data-x="table-chat"]'),
        parent = Parent(chat_tab),
        siblings = '#shortcut_1, #shortcut_2, #shortcut_3, #table-chat, #table-info, #table-winner',
        yheight = (window.innerWidth <= 866)? 'auto': `${chat_height + 32}px`;
    if (parent)
        siblings = From(parent.children).map(child => `#${child.dataset['x']}`).join(', ');

    Style(siblings, [['height', yheight], ['width', '100%']]);
    Style('#chat, #chat2', [['height', `${chat_height}px`], ['width', '100%']]);

    // 4) resize panels + stats
    resize_panels();
    resize_table('stats');

    // 5) resize charts
    E('.chart', node => {
        let parent = node.parentNode,
            width = parent.clientWidth - 2,
            height = width / Max(0.5, Y['graph_aspect_ratio']);
        Style(node, [['height', `${height}px`], ['width', `${width}px`]]);
    });

    if (Visible('#table-brak'))
        resize_bracket();

    // 6) resize game
    adjust_popups();
    show_board_info(y_x, 1);

    old_font_height = SafeId('text').offsetHeight;
    old_window_height = window.innerHeight;
}

/**
 * Resize the left & right panels
 */
function resize_panels() {
    update_visible();

    // panel full + width
    let panel_gap = Y['panel_gap'],
        panels = From(A('.panel')).sort((a, b) => a.style.order - b.style.order),
        visible_width = VisibleWidth();
    for (let panel of panels) {
        let name = panel.id,
            max_width = Min(visible_width - 8, Y[`max_${name}`]),
            min_width = Min(visible_width - 8, Y[`min_${name}`]),
            styles = [`margin:0 ${panel_gap}px`];

        if (max_width <= 0 && min_width <= 0)
            Hide(panel);
        else {
            if (max_width > -1)
                styles.push(`max-width:${max_width}px`);
            if (min_width > -1)
                styles.push(`min-width:${min_width}px`);

            Class(panel, 'full', panel.style.order == 2 && visible_width <= 866);
            Style(panel, styles.join(';'));
            Show(panel);
        }
    }

    // swaps
    S('.swap', Y['panel_adjust']);
    Style('.swaps', [['min-height', '0.6em']], !Y['panel_adjust']);

    Style('.area > *', 'max-width:100%');
    Style('#bottom > *', `max-width:calc(${(100 / Y['column_bottom'])}% - ${Y['column_bottom'] * 2}px)`);
    Style('#top > *', `max-width:calc(${(100 / Y['column_top'])}% - ${Y['column_top'] * 2}px)`);

    // special cases
    let node = CacheId('engine');
    if (node) {
        Attrs(CacheId('eval'), {'data-t': (node.clientWidth > 330)? 'Evaluation': 'Eval'});
        translate_nodes(node);
    }

    // column/row mode
    E('.status', node => {
        let area = get_area(node);
        Style(node, [['margin-bottom', '1em'], ['margin-top', 0]], area.clientWidth < 390);
    });
    Keys(xboards).forEach(key => {
        let board = xboards[key];
        if (!board.sub || board.manual)
            return;
        let node = board.node,
            area_width = get_area(node).clientWidth;
        Class(board.xmoves, 'column', area_width < 390);
        Class(node, 'fcol', area_width >= 390);
    });
    E('#table-kibitz, #table-pv', node => {
        let area = get_area(node);
        Class(node, 'frow fastart', area.clientWidth >= 390);
    });

    order_boards();
    resize_move_lists();

    Style(CacheId('engine'), [['font-size', `${Y['engine_font']}px`]]);
    Style('#engine > div', `padding:${Y['engine_spacing']}em`);

    // resize all charts
    E('.chart', node => {
        let area = get_area(node);
        if (area && !['bottom', 'top'].includes(area.id)) {
            let width = area.clientWidth;
            Style(node, [['height', `${width / Max(0.5, Y['graph_aspect_ratio'])}px`], ['width', `${width}px`]]);
        }
    });
    Keys(charts).forEach(key => charts[key].rect = null);
}

/**
 * Enable/disable 3d scene rendering
 * + start the 3d engine if on
 * @param {boolean} three
 */
function set_3d_scene(three) {
    if (three != undefined)
        save_option('three', three);
    three = Y.three;

    Style(CacheId('three'), [['color', three? '#fff': '#555']]);
    S(CacheId('canvas'), three);
    if (three)
        start_3d();
}
/**
 *
 * Show the About popup
 */
function show_about() {
    HTML(CacheId('popup-desc'), HTML(CacheId('desc')));
    show_popup('about', true, {center: true, html: HTML(CacheId('about')), overlay: 1});
}

/**
 * Show / hide the archive/live boards
 */
function show_archive_live() {
    let section = y_x,
        is_live = (section == 'live');

    Hide(is_live? '#archive': '#live');
    Hide(`#moves-${is_live? 'archive': 'live'}`);
    if (!Y['moves_copy'])
        Hide(CacheId(`moves-${section}`));
}

/**
 * Show/hide custom white & black
 * @param {string} name
 */
function show_custom_colors(name) {
    let modal = CacheId('modal'),
        show = (Y[name] == 'custom');
    for (let color of WB_LOWER) {
        let node = _(`[data-t="Custom ${color}"]`, modal);
        if (!node)
            continue;
        node = node.parentNode;
        S(node, show);
        S(node.nextElementSibling, show);
    }
}

/**
 * Show live engines
 */
function show_live_engines() {
    let main = xboards[y_x],
        players = main.players,
        single_line = Y['single_line'];

    for (let id of [0, 1]) {
        let hardware = players[id + 2].hardware;
        if (!hardware)
            continue;
        hardware = hardware.replace(/th/g, 'TH').replace(/ TB$/, '');
        let sel = `[data-x="live+${id}"]`;
        TextHTML(sel, hardware);
        Style(sel, [['top', `${single_line? 0.35: 1.9}em`]]);
    }
}

/**
 * Add a drag element to a tab group
 * @param {Node} target
 */
function tab_element(target) {
    let id = get_drop_id(target).id,
        areas = Y['areas'];
    if (id == null)
        return;

    Keys(areas).forEach(key => {
        for (let vector of areas[key])
            if (vector[0] == id) {
                vector[1] = vector[1]? 0: 1;
                // update the modal
                Class('#modal .item2[data-t="join next"]', 'active', vector[1]);
                break;
            }
    });

    populate_areas();
}

/**
 * Update the background
 */
function update_background() {
    let node = CacheId('background');
    if (!node)
        return;

    let color = Y['background_color'],
        image = Y['background_image'],
        image_url = image? `url(${image})`: '',
        opacity = image? Y['background_opacity']: 0;

    if (node.style.backgroundImage != image_url)
        node.style.backgroundImage = image_url;

    Style(node, [['background-color', (color == '#000000')? '': color], ['opacity', opacity]]);
}

/**
 * Update the shortcuts on the top right
 * - copy the tab text
 * - copy the table html
 * TODO: delete this
 */
function update_shortcuts() {
    let names = new Set();

    for (let id = 1; id <= 3; id ++) {
        let tab = _(`.tab[data-x="shortcut_${id}"]`),
            shortcut = Y[`shortcut_${id}`];
        if (!tab)
            continue;

        if (shortcut) {
            let target = _(`.tab[data-x="${shortcut}"]`);
            if (target && !target.dataset['t'])
                target = _('[data-t]', target);
            if (target) {
                let name = target.dataset['t'];
                tab.dataset['t'] = SHORTCUT_NAMES[name] || name;
                translate_nodes(tab.parentNode);
                let node = CacheId(`shortcut_${id}`),
                    table = CacheId(`table-${shortcut}`);

                // not in tables => direct copy, ex: "stats"
                HTML(node, HTML(table));
                names.add(shortcut);
            }
        }
        S(tab, shortcut);
    }

    // resize
    for (let name of names)
        resize_table(name);
}

/**
 * Show/hide stuff
 */
function update_visible() {
    let eval_left = Y['eval_left'],
        hardware = Y['hardware'],
        single_line = Y['single_line'],
        templates = [eval_left? '3em': 'auto', 'auto', '1fr'];

    S('.status', Y['status_pv']);
    S('.eval', Y['eval']);
    Class('.eval', 'eval-left', eval_left);
    S('.hardware', hardware);
    Class('.live-basic', 'w100', !hardware || !single_line);
    Style('.live-basic', [['grid-template-columns', templates.join(' ')]]);
    S('.live-more', !single_line);
    S('.percent', Y['percent']);
    Class('.percent', 'tar', !hardware || !single_line);
    S('#archive .xcontrol, #live .xcontrol', Y['controls']);
    S('#archive .xmoves, #live .xmoves', Y['moves']);
    S('#live0 .xcontrol, #live1 .xcontrol, #pv0 .xcontrol, #pv1 .xcontrol', Y['controls_pv']);
    S('#live0 .xmoves, #live1 .xmoves, #pv0 .xmoves, #pv1 .xmoves', Y['moves_pv']);
    S('#pva .xcontrol', Y['controls_pva']);
    S('#pva .xmoves', Y['moves_pva']);
    S('#moves-pv0 .live-pv, #moves-pv1 .live-pv, #table-live0 .live-pv, #table-live1 .live-pv', Y['moves_live']);
    S('#mobil_, #mobil0, #mobil1', Y['mobility']);

    show_live_engines();
}

/**
 * Handle a general window click
 * @param {Event} e
 */
function window_click(e) {
    Clear(KEYS);
    let cannot = cannot_click();
    if (cannot == 1)
        return;

    let in_modal,
        target = e.target,
        type = e.type,
        is_click = (type == 'click'),
        dataset = target.dataset;

    // special cases
    if (dataset) {
        let id = dataset['id'];
        switch (id) {
        case 'about':
            show_about();
            return;
        case 'load_pgn':
            let file = CacheId('file');
            Attrs(file, {'data-x': id});
            file.click();
            return;
        }
    }

    while (target) {
        let id = target.id;
        if (id) {
            if (['archive', 'live'].includes(id))
                break;
            if (id.includes('modal') || id.includes('popup')) {
                in_modal = id;
                return;
            }
        }
        if (HasClasses(target, 'fen|nav'))
            return;
        if (HasClasses(target, 'live-pv|xmoves'))
            context_target = target;

        if (is_click) {
            if (HasClass(target, 'popup-close')) {
                in_modal = false;
                break;
            }
            if (HasClass(target, 'tab')) {
                open_table(target, true);
                break;
            }

            // sub settings
            let dataset = target.dataset;
            if (dataset) {
                let set = target.dataset['set'];
                if (set != undefined) {
                    let parent = Parent(target, {class_: 'popup'}),
                        xy = '';
                    if (parent && parent.dataset) {
                        let item = parent.dataset['xy'];
                        if (item)
                            xy = item.split(',').map(item => item * 1);
                    }
                    if (set == -1)
                        close_popups();
                    else
                        show_popup('options', true, {id: 'options', setting: set, target: parent, xy: xy});
                    return;
                }

                let seek = dataset['seek'];
                if (seek) {
                    show_filtered_games(seek);
                    return;
                }
            }
        }

        target = target.parentNode;
    }

    if (!in_modal)
        close_popups();
}

// EVENTS
/////////

/**
 * Happens after a popup is displayed
 */
function set_modal_events_special() {
    let modal = CacheId('modal'),
        node = _('[data-t="Board theme"]', modal);
    if (!node)
        return;
    node = _('select', node.parentNode.nextElementSibling);
    if (node)
        show_custom_colors(node.name);
}

/**
 * Global events
 */
function set_global_events() {
    // general
    Events(window, 'resize', resize);
    Events(window, 'scroll', adjust_popups);
    // it won't be triggered by pushState and replaceState
    Events(window, 'hashchange', () => check_hash());
    Events(window, 'popstate', e => {
        let state = e.state;
        if (!state)
            return;
        Assign(Y, state);
        check_hash_special(state);
    });

    // keys
    Events(window, 'keydown keyup', e => {
        let okay,
            active = document.activeElement,
            code = e.keyCode,
            is_game = true,
            type = e.type;

        if (!code)
            return;
        if (type == 'keydown')
            action_key(code);

        // ignore keys when on inputs, except ENTER & TAB
        if (active && {INPUT: 1, TEXTAREA: 1}[active.tagName])
            return;

        if (type == 'keydown') {
            if (is_game)
                okay = game_action_key(code);
            else
                okay = action_key_no_input(code, active);
            if (!KEYS[code])
                KEY_TIMES[code] = Now(true);
            KEYS[code] = 1;
        }
        else {
            if (is_game)
                okay = game_action_keyup(code);
            else
                okay = action_keyup_no_input(code);
            KEYS[code] = 0;
            if (change_queue)
                change_setting(change_queue[0], change_queue[1], change_queue[2]);
        }

        // prevent some default actions
        if ([9, 112].includes(code) || okay === false)
            PD(e);

        update_debug();
    });

    // popups
    C('#banner', function() {
        Hide(this);
    });
    C('#articles, #download, #info, #navigate, #options', function() {
        if (SafeId('modal').dataset['id'] == this.id)
            show_popup('');
        else
            show_popup(this.id, 'toggle', {id: this.id});
    });
    C('#overlay', () => close_popups());

    // click somewhere => close the popups
    Events(window, 'click touchstart', window_click);

    C('.pages', e => {
        let target = e.target;
        if (HasClass(target, 'page')) {
            let parent = Parent(target, {class_: 'pagin'});
            change_page(parent.id.split('-')[0], target.dataset['p']);
        }
        SP(e);
    });

    // swap panes
    Events('#center, #left, #left_2, #right, #right_2', 'mouseenter mouseleave', function(e) {
        if (Y['panel_adjust'])
            Style('.swap', [['opacity', (e.type == 'mouseenter')? 1: 0]], true, this);
    });

    // theme + twitch
    C('#theme0, #theme1', function() {
        change_theme((this.id.slice(-1) == '1')? 'dark': 'light');
    });
    C('#twitch0, #twitch1', function() {
        update_twitch((this.id.slice(-1) == '1') * 1);
    });
    C('#hide-chat, #hide-video, #show-chat, #show-video', function() {
        let [left, right] = this.id.split('-');
        save_option(`twitch_${right}`, (left == 'show') * 1);
        update_twitch();
    });
    C('#three', () => set_3d_scene(!Y.three));
    C('#full0, #full1', () => {
        toggle_fullscreen(full => {
            S(CacheId('full0'), full);
            S(CacheId('full1'), !full);
            resize();
        });
    });

    // fullscreen scrolling
    Events(window, 'mousedown mouseenter mouseleave mousemove mouseup touchstart touchmove touchend', e => {
        if (!is_fullscreen())
            return;
        touch_handle(e, true);
    });
    Events(window, 'wheel', e => {
        if (!is_fullscreen()) {
            if (Y['wheel_adjust'])
                add_timeout('adjust', scroll_adjust, TIMEOUT_adjust);
            return;
        }
        wheel_event(e, true);
    }, {passive: true});

    // context menus
    Keys(CONTEXT_MENUS).forEach(key => {
        Events(key, 'contextmenu', function(e) {
            if (cannot_popup())
                return;
            context_target = e.target;

            // skip some elements
            let tag = context_target.tagName;
            if (['INPUT', 'SELECT'].includes(tag))
                return;
            if (tag == 'A' && context_target.href)
                return;

            show_popup('options', true, {setting: CONTEXT_MENUS[key], xy: [e.clientX, e.clientY]});
            PD(e);
        });
    });
    Events(
        '#archive, #live, #live0, #live1, #moves-archive, #moves-live, #moves-pv0, #moves-pv1, #pv0, #pv1, #pva,'
        + '#table-live0, #table-live1', 'contextmenu', function(e) {
        if (cannot_popup())
            return;
        let is_pv = '01'.includes(this.id.slice(-1)),
            is_pva = (this.id == 'pva'),
            target = e.target;

        while (target) {
            let dataset = target.dataset,
                name;
            if (dataset && ['next', 'prev'].includes(dataset['x']))
                return;
            else if (HasClasses(target, 'hardware|live-basic|live-more'))
                name = 'eval';
            else if (HasClass(target, 'live-pv'))
                name = 'live';
            else if (HasClass(target, 'xbottom'))
                return;
            else if (HasClass(target, 'xcontain'))
                name = is_pva? 'game': (is_pv? 'board_pv': 'board');
            else if (HasClass(target, 'xcontrol'))
                name = 'control';
            else if (HasClass(target, 'xmoves'))
                name = `copy${is_pva? '_pva': (is_pv? '_pv': '')}`;

            if (name) {
                context_target = target;
                show_popup('options', true, {setting: name, xy: [e.clientX, e.clientY]});
                PD(e);
                return;
            }
            target = target.parentNode;
        }
    });
    Events(window, 'contextmenu', e => {
        if (cannot_popup())
            return;
        let target = e.target;
        if (HasClasses(target, 'tab drop')) {
            let id = target.dataset['x'],
                name = (id.includes('shortcut') || id.includes('chat'))? 'quick': 'tab';
            context_target = target;
            show_popup('options', true, {setting: name, xy: [e.clientX, e.clientY]});
            PD(e);
        }
    });

    // drag and drop
    Events(window, 'dragstart', e => {
        if (!Y['drag_and_drop'])
            return;
        // no drag and drop on text
        let target = e.target;
        if (target.nodeType != 1)
            return;
        let parent = Parent(target, {attrs: 'draggable=true', self: true});
        if (parent)
            drag_source = parent;
    });
    Events(window, 'dragenter dragover', e => {
        if (!Y['drag_and_drop'])
            return;
        let child = get_drop_id(e.target).node,
            parent = Parent(e.target, {class_: 'area', self: true});
        if (child == drag_source)
            child = null;
        else if (!child)
            child = parent;

        // tab=drop or top/bottom area => vertical bar, otherwise horizontal
        let orient = ((parent && ['bottom', 'top'].includes(parent.id)) || HasClass(child, 'drop'))? 1: 2;
        draw_rectangle(child, orient, e.clientX, e.clientY);
        if (!child)
            return;

        Class('.area', 'dragging');
        SP(e);
        PD(e);
    });
    Events(window, 'dragexit dragleave', e => {
        if (!Y['drag_and_drop'])
            return;
        if (e.target.tagName == 'HTML') {
            Class('.area', '-dragging');
            Hide(CacheId('rect'));
        }
    });
    Events(window, 'drop', handle_drop);

    // file
    Events(CacheId('file'), 'change', function() {
        let file = this.files[0],
            id = this.dataset['x'],
            reader = new FileReader();
        if (!file)
            return;

        if (id == 'background_image') {
            reader.readAsDataURL(file);
            reader.onloadend = function() {
                let result = reader.result,
                    save = (result.length < 1e6),
                    sopacity = 'background_opacity';

                Y[id] = result;
                if (save)
                    save_option(id, result);

                if (!Y[sopacity]) {
                    Y[sopacity] = 0.2;
                    if (save)
                        save_option(sopacity);
                }
                update_background();
            };
            return;
        }

        reader.readAsText(file);
        reader.onloadend = () => {
            let data = /** @type {string} */(reader.result);
            switch (id) {
                case 'import_settings':
                    change_setting(id, data);
                    save_option('last_preset', file.name.split('.').slice(0, -1).join('.'));
                    break;
                case 'language':
                    api_translate_get(false, undefined, ParseJSON(data));
                    break;
                case 'load_pgn':
                    let new_section = 'archive';
                    if (update_pgn(new_section, data)) {
                        Y.scroll = '#overview';
                        set_section(new_section);
                        Y.s = new_section;
                        check_hash_special({x: new_section});
                    }
                    break;
                }
        };
    });
}

// MAIN
///////

/**
 * Load settings from Local Storage
 */
function load_settings() {
    load_defaults();
    Y.preset = 'custom';
    reset_old_settings();
    fix_old_settings();

    api_times = get_object('times') || {};
    translates = get_object('trans') || {};
}

/**
 * Prepare combined settings
 */
function prepare_settings() {
    // globals
    Y.no_ad = 0;
    Y.scroll = 0;
    Y.three = 0;
    set_section('live');

    let DEFAULT_NO_IMPORTS = {
        'div': '',                          // archive link
        'game': 0,
        'link': '',                         // live link
        'offset': 0,                        // move height offset
        'round': '',                        // archive link + live round
        'scroll': 0,
        'season': '',                       // archive link
        'stage': '',                        // archive link
        'stream': 0,
        'three': 0,                         // 3d scene
    };

    Assign(DEFAULTS, {
        // name, join_next, shown (&2: active)
        'areas': {
            'bottom': [],
            'center0': [
                ['engine', 1, 3],
                ['table-pv', 0, 1],
                ['table-eval', 1, 1],
                ['table-mobil', 1, 1],
                ['table-time', 1, 1],
                ['table-depth', 1, 1],
                ['table-speed', 1, 1],
                ['table-node', 1, 1],
                ['table-tb', 1, 1],
                ['table-agree', 1, 1],
                ['table-kibitz', 0, 1],
                ['moves-archive', 0, 1],
                ['moves-live', 0, 1],
            ],
            'left_20': [],
            'left0': [
                ['archive', 0, 1],
                ['live', 0, 1],
                ['moves-pv1', 0, 1],
                ['moves-pv0', 0, 1],
                ['table-live0', 0, 1],
                ['table-live1', 0, 1],
            ],
            'right_20': [],
            'right0': [
                ['table-chat', 1, 3],
                ['table-winner', 1, 1],
                ['table-pva', 1, 1],
                ['shortcut_1', 1, 1],
                ['shortcut_2', 1, 1],
                ['shortcut_3', 0, 1],
                ['table-info', 0, 0],
            ],
            'top': [],
        },
        'last_preset': '',
        'live_log': 'all',
        'scales': {},
        'seen': 0,                          // show quick setup?
        'table_tab': {
            'archive': 'season',
            'live': 'stand',
        },
        'twitch_chat': 1,
        'twitch_dark': 0,
        'twitch_video': 1,
        'version': '0',
    });
    guess_types(DEFAULTS);

    Assign(DEV_NAMES, {
        'a': 'arrow',
        'A': 'ad',                  // disable ads (for development)
        'b': 'board',
        'B': 'boom',
        'c': 'chart',
        'C': 'cup',                 // force loading bracket.json
        'd': 'debug',
        'D': 'div',
        'e': 'eval',                // live eval
        'E': 'engine',
        'f': 'fen',                 // parse_fen
        'F': 'effect',
        'G': 'global',
        'h': 'hold',                // hold button
        'i': 'input',               // gamepad input
        'j': 'json',                // static json files
        'l': 'log',                 // analyse_log
        'L': 'load',
        'm': 'mobil',
        'o': 'open',
        'n': 'new',                 // new game debugging
        'q': 'queue',
        's': 'socket',              // socket messages
        'S': 'no_socket',
        't': 'time',                // clock + pause/start click
        'T': 'translate',           // gather translations
        'U': 'ui',                  // UI events
        'w': 'wasm',
        'W': 'worker',              // web worker
        'X': 'explode',
        'y': 'ply',
    });

    Assign(HIDES, {
        'archive': {
            'live': 1,
            'moves-live': 1,
        },
        'live': {
            'archive': 1,
            'moves-archive': 1,
        },
    });

    let no_imports = Assign({}, ...Keys(DEFAULT_NO_IMPORTS).map(key => ({[key]: 1})));
    Assign(NO_IMPORTS, no_imports);
    Assign(NO_IMPORTS, {
        'dev': 1,
        'game_960': 1,
        'game_depth': 1,
        'game_evaluation': 1,
        'game_level': 1,
        'game_new_FEN': 1,
        'game_options_black': 1,
        'game_options_white': 1,
        'game_search': 1,
        'game_time': 1,
        'game_wasm': 1,
        'import_settings': 2,
        'language': 1,
        'last_preset': 1,
        'new_version': 1,
        'no_ad': 1,
        'preset': 1,
        's': 1,
        'twitch_chat': 1,
        'twitch_video': 1,
        'version': 1,
        'x': 1,
    });

    Assign(PANES, {
        'left_2': 0,
        'left': 1,
        'center': 2,
        'right': 3,
        'right_2': 4,
    });

    // &1:adjust &2:top &4:right &8:bottom &16:left & 32:vcenter &64:hcenter, &128:h100, &256:w100
    Assign(POPUP_ADJUSTS, {
        'about': 1,
        'articles': 1,
        'download': 1,
        'info': 1,
        'options': 1,
    });

    Assign(TAB_NAMES, {
        'depth': 'D/SD',
        'mobil': 'Mob',
        'node': 'Nodes',
        'pv': 'PV',
        'pv0': 'White',
        'pv1': 'Black',
        'pva': 'PVA',
        'tb': 'TB',
    });

    Assign(TRANSLATE_SPECIALS, {
        'CODER': 'octopoulo',
        'SPONSOR': 'Noobpwnftw',
        'TCEC': '<b>TCEC</b> (Top Chess Engine Championship)',
        'TCEC_URL': '<i class="nowrap">https://tcec-chess.com</i>',
        'UI': '<a href="https://github.com/TCEC-Chess/tcecgui" target="_blank">UI</a>',
    });

    // settings
    let agree_length = [ON_OFF, 1, 'show how many plies are in agreement between 2 players / kibitzers'],
        analyses = [{list: ['lichess', 'chessdb', 'evalguide=eguide'], type: 'list'}],
        bamboo = 'bamboo',
        bamboo2 = `${bamboo} - `,
        boom_sounds = ['off', 'random', 'boom', 'boom2', 'boom3', 'boom4', 'boom5', 'boom6'],
        boom_visuals = ['off', 'all', 'color', 'shake'],
        copy_download = [{list: ['FEN', 'PGN', 'download'], type: 'list'}],
        copy_moves = {
            '_class': 'span nopad',
            '_main': 1,
            '_multi': 3,
            'FEN': {},
            'PGN': {},
            'moves': {},
        },
        cores = navigator.hardwareConcurrency,
        min_max = 'min and max values, hidden if both are 0',
        old = 'move',
        shortcuts = [...['off'], ...[...Keys(TABLES).filter(table => table != 'overview'), ...['stats']].sort()],
        show_plies = [['first', 'diverging', 'last'], 'diverging'];

    merge_settings({
        // new column after 10 items
        '_split': 11,
        'general': {
            'export_settings': '1',
            'import_settings': [{text: 'Enter JSON data', type: 'link'}, ''],
            'language': [LANGUAGES, ''],
            'preset': [PRESETS, 'custom'],
            'theme': [THEMES, THEMES[0]],
        },
        'audio': {
            'audio_book': [ON_OFF, 1],
            'audio_delay': option_number(150, 0, 2000, 1, {}, 'audio delay when animation speed is 500ms'),
            'audio_live_archive': [ON_OFF, 0],
            'audio_moves': [['none', 'all', 'last'], 'all'],
            'audio_pva': [ON_OFF, 1],
            'audio_set': [['custom', bamboo, 'kan'], 'custom'],
            'capture_delay': option_number(-200, -1000, 1000, 1, {}, 'capture delay when animation speed is 500ms'),
            'sound_capture': [['off', `${bamboo2}capture`, 'kan - capture', old], `${bamboo2}capture`],
            'sound_check': [['off', `${bamboo2}check`, old], `${bamboo2}check`],
            'sound_checkmate': [['off', `${bamboo2}checkmate`, old], `${bamboo2}checkmate`],
            'sound_draw': [['off', 'draw', 'win'], 'draw'],
            'sound_move': [['off', `${bamboo2}move`, 'kan - move', old], `${bamboo2}move`],
            'sound_move_pawn': [['off', `${bamboo2}pawn`, 'kan - move', old], `${bamboo2}pawn`],
            'sound_win': [['off', 'draw', 'win'], 'win'],
            'volume': option_number(10, 0, 20, 0.5),
        },
        'video': {
            'background_color': [{type: 'color'}, '#000000'],
            'background_image': [{type: 'link'}, ''],
            'background_opacity': option_number(0, 0, 1, 0.01),
            'background_reset': '1',
            'encoding': [['Gamma', 'Linear', 'sRGB'], 'sRGB'],
            'exposure': option_number(1, 0.1, 10, 0.1),
            'gamma': option_number(1.5, 0, 10, 0.1),
            'lighting': [['low', 'medium', 'high'], 'high'],
            'resolution': [['1:4', '1:3', '1:2', '1:1'], '1:2'],
            'shadow': [Keys(SHADOW_QUALITIES), 'high'],
            'texture': [AUTO_ON_OFF, 'auto'],
        },
        // separator
        '_1': {},
        'arrow': {
            '_prefix': 'arrow_',
            'arrow_base_border': option_number(0, 0, 5, 0.01),
            'arrow_base_color': {
                '_multi': 2,
                'arrow_base_color': [{type: 'color'}, '#a5a5a5'],
                'arrow_base_mix': option_number(0.7, 0, 1, 0.01, {}, 'mix'),
            },
            'arrow_base_size': option_number(2.05, 0, 5, 0.05),
            'color_01': {
                '_label': '{Color} 0, 1',
                '_multi': 2,
                'arrow_color_0': [{type: 'color'}, '#cdcdbe', 'white'],
                'arrow_color_1': [{type: 'color'}, '#666666', 'black'],
            },
            'color_23': {
                '_label': '{Color} 2, 3',
                '_multi': 2,
                'arrow_color_2': [{type: 'color'}, '#236ad6', 'blue'],
                'arrow_color_3': [{type: 'color'}, '#eb282d', 'red'],
            },
            'combine': {
                '_label': '{Color} 01, 23',
                '_multi': 2,
                'arrow_color_01': [{type: 'color'}, '#c6bf7b', '{white} + {black}'],
                'arrow_color_23': [{type: 'color'}, '#007700', '{blue} + {red}'],
            },
            'arrow_from': [['none', 'all', 'kibitzer', 'player'], 'all'],
            'arrow_from_opponent': option_number(0.6, 0, 1, 0.01),
            'arrow_head_border': option_number(0.5, 0, 5, 0.01),
            'arrow_head_color': {
                '_multi': 2,
                'arrow_head_color': [{type: 'color'}, '#a5a5a5'],
                'arrow_head_mix': option_number(0.7, 0, 1, 0.01, {}, 'mix'),
            },
            'arrow_head_size': option_number(2.05, 0, 5, 0.05),
            'arrow_history_lag': option_number(1300, 0, 5000),
            'arrow_moves': [['all', 'last'], 'all'],
            'arrow_opacity': option_number(0.7, 0, 1, 0.01),
            'arrow_width': option_number(1.6, 0, 5, 0.01),
        },
        'board': {
            'analysis': analyses,
            'animate': [ON_OFF, 1],
            'animation_speed': {
                '_multi': 2,
                '_title': 'how fast pieces can move, in ms',
                'smooth_min': option_number(250, 0, 2000, 10, {}, 'min'),
                'smooth_max': option_number(500, 0, 2000, 10, {}, 'max'),
            },
            'arrow': '',
            'board_theme': [Keys(BOARD_THEMES), 'chess24'],
            'custom_black': {
                '_class': 'dn',
                '_value': [{type: 'color'}, '#000000'],
            },
            'custom_white': {
                '_class': 'dn',
                '_value': [{type: 'color'}, '#ffffff'],
            },
            'controls': [ON_OFF, 1],
            'copy': copy_download,
            'draw_right_click': [ON_OFF, 0],
            'highlight_color': [{type: 'color'}, '#ffff00'],
            'highlight_delay': option_number(0, -100, 1500, 100),
            'highlight_size': option_number(0.055, 0, 0.4, 0.001),
            'notation': [ON_OFF, 1],
            'piece_theme': [Keys(PIECE_THEMES), 'chess24'],
            'status': [AUTO_ON_OFF, 'auto'],
        },
        'board_pv': {
            '_suffix': '_pv',
            'analysis': analyses,
            'animate_pv': [ON_OFF, 1],
            'board_theme_pv': [Keys(BOARD_THEMES), 'uscf'],
            'custom_black_pv': {
                '_class': 'dn',
                '_value': [{type: 'color'}, '#000000'],
            },
            'custom_white_pv': {
                '_class': 'dn',
                '_value': [{type: 'color'}, '#ffffff'],
            },
            'controls_pv': [ON_OFF, 1],
            'copy': copy_download,
            'highlight_color_pv': [{type: 'color'}, '#ffff00'],
            'highlight_size_pv': option_number(0.088, 0, 0.4, 0.001),
            'notation_pv': [ON_OFF, 1],
            'piece_theme_pv': [Keys(PIECE_THEMES), 'chess24'],
            // 'show_delay': option_number(100, 0, 2000, 10),
            'show_ply': show_plies,
            'status_pv': [ON_OFF, 1],
        },
        'board_pva': {
            '_suffix': '_pva',
            'animate_pva': [ON_OFF, 1],
            'auto_paste': [ON_OFF, 1],
            'board_theme_pva': [Keys(BOARD_THEMES), 'uscf'],
            'custom_black_pva': {
                '_class': 'dn',
                '_value': [{type: 'color'}, '#000000'],
            },
            'custom_white_pva': {
                '_class': 'dn',
                '_value': [{type: 'color'}, '#ffffff'],
            },
            'controls_pva': [ON_OFF, 1],
            'highlight_color_pva': [{type: 'color'}, '#ffff00'],
            'highlight_size_pva': option_number(0.055, 0, 0.4, 0.001),
            'notation_pva': [ON_OFF, 1],
            'piece_theme_pva': [Keys(PIECE_THEMES), 'chess24'],
            'source_color': {
                '_multi': 2,
                '_title': 'clicked piece',
                'source_color': [{type: 'color'}, '#ffb400'],
                'source_opacity': option_number(0.7, 0, 1, 0.01, {}, 'opacity'),
            },
            'status_pva': [ON_OFF, 1],
            'target_color': {
                '_multi': 2,
                '_title': 'legal squares',
                'target_color': [{type: 'color'}, '#ff5a00'],
                'target_opacity': option_number(0.7, 0, 1, 0.01, {}, 'opacity'),
            },
            'turn_color': {
                '_multi': 2,
                '_title': 'legal pieces',
                'turn_color': [{type: 'color'}, '#ff5a00'],
                'turn_opacity': option_number(0, 0, 1, 0.01, {}, 'opacity'),
            },
        },
        'boom': {
            'disable_everything': [ON_OFF, 0],
            'every': option_number(30, 0, 1800, 0.5, {}, 'no more than 1 sound every X seconds, -1 to disable sounds'),
            'boom_sound': [boom_sounds, 0],
            'boom_threshold': option_number(1.2, 0, 10, 0.05, {}, 'threshold to exceed in graph scale => boom'),
            'boom_visual': [boom_visuals, 0],
            'boom_volume': option_number(3.5, 0, 20, 0.5, {}, 'maximum volume'),
            'moob_sound': [['off', 'random', 'moob', 'moob2', 'moob3'], 0],
            'moob_visual': [ON_OFF, 0],
            'moob_volume': option_number(3.5, 0, 20, 0.5, {}, 'maximum volume'),
            'explosion_buildup': option_number(2, 0, 10, 1, {}, 'need to exceed the threshold for X plies'),
            'explosion_ply_reset': option_number(8, 0, 100, 1, {}, 'reactivate after X plies under threshold'),
            'explosion_sound': [boom_sounds, 'random'],
            'explosion_threshold':
                option_number(2.3, 0, 10, 0.1, {}, 'strict majority of unique engines must exceed this eval'),
            'explosion_visual': [boom_visuals, 'all'],
            'explosion_volume': option_number(5, 0, 20, 0.5),
            'PVA': [ON_OFF, 0],
            'test': [{list: ['boom', 'moob', 'explosion'], type: 'list'}],
        },
        'control': {
            'book_every': option_number(600, 100, 5000, 50, {}, 'opening book play speed'),
            'key_accelerate':
                option_number(1.04, 0.5, 1, 0.001, {}, 'divide key repeat time by this value, 1 for no acceleration'),
            'key_repeat': option_number(70, 10, 2000, 10),
            'key_repeat_initial': option_number(500, 10, 2000, 10),
            'play_every': option_number(1200, 100, 5000, 50, {}, 'speed when clicking on PLAY'),
            'quick_every': {
                '_multi': 2,
                '_title': 'live moves play speed',
                'quick_min': option_number(100, 100, 50000, 10, {}, 'min'),
                'quick_max': option_number(500, 100, 50000, 10, {}, 'max'),
            },
            // 'wasm': [ON_OFF, 0],
        },
        'engine': {
            'engine_font': option_number(16, 8, 24, 0.25),
            'engine_spacing': option_number(0.2, 0, 5, 0.0025),
            'material_color': [['inverted', 'normal'], 'normal', 'normal will show black pieces under white player'],
            'mobility': [ON_OFF, 1, 'show r-mobility goal + mobilities'],
            'moves_left': [ON_OFF, 1, 'show moves left when Lc0 is playing'],
            'small_decimal': [['on', 'off', 10, 100], 100, 'decimals format for the eval'],
            'SI_units': [ON_OFF, 1],
        },
        'extra': {
            'archive_scroll': [ON_OFF, 1],
            'benchmark': {
                '_main': 1,
                '_multi': 2,
                'now': {},
                'game': {},
            },
            'drag_and_drop': [ON_OFF, 0],
            'join_next': [ON_OFF, 0],
            'log_auto_start': [ON_OFF, 1],
            'log_history': option_number(100, -1, 1000),
            'log_pv': [ON_OFF, 1, 'use livelog pv'],
            'popup_right_click': [ON_OFF, 1, 'right click on elements for a popup menu'],
            'reload_missing': [ON_OFF, 1],
            'rows_per_page': [[10, 20, 50, 100, 1000], 10],
            'scroll_inertia': option_number(0.95, 0, 0.99, 0.01),
            'wheel_adjust': option_number(63, 0, 240),
            'wrap': [ON_OFF, 1],
            'wrap_cross': [AUTO_ON_OFF, 'auto'],
            'wrap_h2h': [AUTO_ON_OFF, 'auto'],
            'wrap_sched': [AUTO_ON_OFF, 'auto'],
            'wrap_stand': [AUTO_ON_OFF, 'auto'],
        },
        'game': {
            '_prefix': 'game_',
            'game_960': [ON_OFF, 1],
            'game_advice': '1',
            'analysis': analyses,
            'game_arrow': [['none', 'color', 'kibitz', 'color 0', 'color 1', 'color 2', 'color 3'], 'kibitz'],
            'board_pva': '',
            'copy': copy_download,
            'game_every': option_number(200, 50, 5000, 50),
            'game_level': [Keys(LEVELS), 'amateur'],
            'game_new_FEN': [{type: 'text'}, '', 'FEN to be used for a new game, empty for default'],
            'game_new_game': '1',
            'game_options_black': [{type: 'area'}, 'd=4 e=att h=1 o=2 q=8 s=ab t=2 x=20'],
            'game_options_white': [{type: 'area'}, 'd=4 e=att h=1 o=2 q=8 s=ab t=2 x=20'],
            'parameters': '',
            'game_PV': [ON_OFF, 1],
            'game_think': '1',
            'game_time': option_number(5, -1, 120),
        },
        'graph': {
            '_prefix': 'graph_',
            'graph_aspect_ratio': option_number(1.5, 0.5, 5, 0.005),
            'color_01': {
                '_label': '{Color} 0, 1',
                '_multi': 2,
                'graph_color_0': [{type: 'color'}, '#fefdde', 'white'],
                'graph_color_1': [{type: 'color'}, '#02031e', 'black'],
            },
            'color_23': {
                '_label': '{Color} 2, 3',
                '_multi': 2,
                'graph_color_2': [{type: 'color'}, '#236ad6', 'blue'],
                'graph_color_3': [{type: 'color'}, '#eb282d', 'red'],
            },
            'graph_eval_clamp': option_number(10, 0, 256, 0.5, {}, 'works with scale=linear'),
            'graph_eval_mode': [['percent', 'score'], 'score'],
            'graph_line': option_number(1.5, 0, 10, 0.1),
            'marker_color': {
                '_multi': 2,
                'marker_color': [{type: 'color'}, '#299bff'],
                'marker_opacity': option_number(0.5, 0, 1, 0.01, {}, 'opacity'),
            },
            'graph_min_width': option_number(240, 40, 640),
            'graph_radius': option_number(1.2, 0, 10, 0.1),
            'graph_scale': [SCALES, 0, '!', null, () => {
                let name = ((context_target || {}).id || '').split('-')[1],
                    value = Y['scales'][name];
                DEFAULTS['graph_scale'] = DEFAULT_SCALES[name];
                return (value & 10)? 10: value;
            }],
            'graph_tension': option_number(0.1, 0, 0.5, 0.01),
            'graph_text': option_number(10, 1, 30),
            'use_for_arrow': '1',
        },
        'info': {
            'eval': [ON_OFF, 1],
            'eval_left': [ON_OFF, 1],
            'hardware': [ON_OFF, 0],
            'more': [ON_OFF, 1],
            'moves': [ON_OFF, 1],
            'moves_copy': [ON_OFF, 0],
            'moves_live': [ON_OFF, 1],
            'moves_pv': [ON_OFF, 1],
            'moves_pva': [ON_OFF, 1],
            'percent': [ON_OFF, 1],
            'percent_width': option_number(58, 0, 100, 0.5, {}, 'max width in %'),
            'single_line': [ON_OFF, 0],
        },
        'live': {
            'agree_length': agree_length,
            'copy': copy_moves,
            'download_PGN': '1',
            'grid_live': option_number(0, 0, 10),
            'live_engine_1': [ON_OFF, 1],
            'live_engine_2': [ON_OFF, 1],
            'live_pv': [ON_OFF, 1],
            'move_font_live': option_number(13, 6, 30, 0.1),
            'move_height_live': option_number(52, 39, 1600, 0.5),
            'moves_live': [ON_OFF, 1],
            'show_ply': show_plies,
        },
        'moves': {
            'agree_length': agree_length,
            'grid': option_number(0, 0, 10),
            'grid_copy': option_number(2, 0, 10),
            'grid_live': option_number(0, 0, 10),
            'grid_pv': option_number(2, 0, 10),
            'grid_pva': option_number(0, 0, 10),
            'move_font': option_number(13, 6, 30, 0.1),
            'move_font_copy': option_number(13, 6, 30, 0.1),
            'move_font_live': option_number(13, 6, 30, 0.1),
            'move_font_pv': option_number(13, 6, 30, 0.1),
            'move_font_pva': option_number(13, 6, 30, 0.1),
            'move_height': option_number(70, 3, 1600, 0.5),
            'move_height_copy': option_number(260, 39, 1600, 0.5),
            'move_height_live': option_number(52, 39, 1600, 0.5),
            'move_height_pv': option_number(91, 65, 1600, 0.5),
            'move_height_pva': option_number(70, 65, 1600, 0.5),
        },
        'panel': {
            'column_bottom': option_number(4, 1, 8),
            'column_top': option_number(2, 1, 8),
            'default_positions': '1',
            'drag_and_drop': [ON_OFF, 0],
            'left_2': {
                '_multi': 2,
                '_title': min_max,
                'min_left_2': option_number(0, -1, 1200),
                'max_left_2': option_number(0, -1, 1200),
            },
            'left': {
                '_multi': 2,
                '_title': min_max,
                'min_left': option_number(300, -1, 1200),
                'max_left': option_number(500, -1, 1200),
            },
            'center': {
                '_multi': 2,
                '_title': min_max,
                'min_center': option_number(300, -1, 1200),
                'max_center': option_number(500, -1, 1200),
            },
            'right': {
                '_multi': 2,
                '_title': min_max,
                'min_right': option_number(300, -1, 1200),
                'max_right': option_number(500, -1, 1200),
            },
            'right_2': {
                '_multi': 2,
                '_title': min_max,
                'min_right_2': option_number(0, -1, 1200),
                'max_right_2': option_number(0, -1, 1200),
            },
            'max_window': option_number(2560, 256, 32000),
            'panel_adjust': [ON_OFF, 0, 'show the < > - + above the panel'],
            'panel_gap': option_number(device.mobile? 5: 10, 0, 100),
            'quick': '',
            'tabs_per_row': option_number(7, 1, 100),
            'unhide': '1',
        },
        'quick': {
            'chat_height': option_number(828, 100, 1600, 0.5),
            'shortcut_1': [shortcuts, 'stand'],
            'shortcut_2': [shortcuts, 'stats'],
            'shortcut_3': [shortcuts, 0],
        },
        'reset': {
            '_cancel': true,
            '_color': '#f00',
            'click_here_to_RESET_everything': '2',
        },
        // popup only
        'copy': {
            '_pop': true,
            'copy': copy_moves,
            'download_PGN': '1',
            'grid': option_number(0, 0, 10),
            'move_font': option_number(13, 6, 30, 0.1),
            'move_height': option_number(70, 39, 1600, 0.5),
            'moves': [ON_OFF, 1],
            'moves_copy': [ON_OFF, 0],
        },
        'copy_copy': {
            '_pop': true,
            'copy': copy_moves,
            'download_PGN': '1',
            'grid_copy': option_number(2, 0, 10),
            'move_font_copy': option_number(13, 6, 30, 0.1),
            'move_height_copy': option_number(260, 39, 1600, 0.5),
            'moves': [ON_OFF, 1],
            'moves_copy': [ON_OFF, 0],
        },
        'copy_pv': {
            '_pop': true,
            'agree_length': agree_length,
            'copy': copy_moves,
            'download_PGN': '1',
            'grid_pv': option_number(2, 0, 10),
            'move_font_pv': option_number(13, 6, 30, 0.1),
            'move_height_pv': option_number(91, 39, 1600, 0.5),
            'moves_pv': [ON_OFF, 1],
            'show_ply': show_plies,
        },
        'copy_pva': {
            '_pop': true,
            '_prefix': 'game_',
            'copy': copy_moves,
            'download_PGN': '1',
            'grid_pva': option_number(0, 0, 10),
            'move_font_pva': option_number(13, 6, 30, 0.1),
            'move_height_pva': option_number(70, 39, 1600, 0.5),
            'moves_pva': [ON_OFF, 1],
            'game_PV': [ON_OFF, 1],
            'PV_height': option_number(60, 39, 1600, 0.5),
        },
        'eval': {
            '_pop': true,
            'eval': [ON_OFF, 1],
            'eval_left': [ON_OFF, 1],
            'hardware': [ON_OFF, 0],
            'moves_live': [ON_OFF, 1],
            'percent': [ON_OFF, 1],
            'percent_width': option_number(58, 0, 100, 0.5, {}, 'max width in %'),
            'single_line': [ON_OFF, 0],
        },
        'parameters': {
            '_pop': true,
            '_prefix': 'game_',
            'game_depth': option_number(4, 0, 8),
            'game_evaluation': [['nul', 'mat', 'mob', 'hce', 'att', 'paw', 'kin', 'nn'], 'att'],
            'game_options_black': [{type: 'area'}, 'd=4 e=att h=1 o=2 q=8 s=ab t=2 x=20'],
            'game_options_white': [{type: 'area'}, 'd=4 e=att h=1 o=2 q=8 s=ab t=2 x=20'],
            'game_search': [['ab=AlphaBeta', 'mm=Minimax', 'rnd=RandomMove'], 'ab'],
            'game_threads': option_number(1, 1, cores),   // Max(1, cores / 2)
            'game_wasm': [ON_OFF, 1],
        },
        'quick_copy': {
            '_flag': 3,
            '_pop': true,
            'copy': copy_moves,
            'download_PGN': '1',
            'load_PGN': {_id: 'load_pgn', _value: ''},
        },
        'quick_setup': {
            '_pop': true,
            '_title': 'Quick setup',
            'boom_effect': [ON_OFF, 0],
            'moob_effect': [ON_OFF, 0],
            'explosion_effect': [ON_OFF, 1],
            'language': [LANGUAGES, ''],
            'theme': [THEMES, THEMES[0]],
            'volume': option_number(10, 0, 15, 0.5, {}, 'general volume, 10: 100%, affects all sounds'),
        },
    });

    Assign(TYPES, {
        'graph_scale': 'i',
    });
}

/**
 * Startup
 */
function startup() {
    // engine overrides
    __PREFIX = 'tc_';

    // 1:align_top, 2:align_bottom, + gap, priority
    ANCHORS = {
        '#bottom': [2, 0, 4],
        '#center0': [1, 4, 1],
        '#left0': [1, 4, 1],
        '#main': [2, 4, 3],
        '#overview tbody': [1, 0, 1],
        '#overview': [1, 0, 2],
        '#right0': [1, 4, 1],
        '#table-brak': [1, 2, 1],
        '#table-pagin': [1, 2, 1],
        '#table-search': [2, -2, 1],
        '#tables .scroller': [1, 2, 1],
        '#tables': [1, 2, 1],
    };

    // VB=viewBox=; PFC=path fill="currentColor"
    ICONS = {
        'burger': 'viewBox="0 0 448 512"><PFC d="M16 132h416c8.837 0 16-7.163 16-16V76c0-8.837-7.163-16-16-16H16C7.163 60 0 67.163 0 76v40c0 8.837 7.163 16 16 16zm0 160h416c8.837 0 16-7.163 16-16v-40c0-8.837-7.163-16-16-16H16c-8.837 0-16 7.163-16 16v40c0 8.837 7.163 16 16 16zm0 160h416c8.837 0 16-7.163 16-16v-40c0-8.837-7.163-16-16-16H16c-8.837 0-16 7.163-16 16v40c0 8.837 7.163 16 16 16z"/>',
        'calendar': 'VB="0 0 448 512"><PFC d="M0 464c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48V192H0v272zm320-196c0-6.6 5.4-12 12-12h40c6.6 0 12 5.4 12 12v40c0 6.6-5.4 12-12 12h-40c-6.6 0-12-5.4-12-12v-40zm0 128c0-6.6 5.4-12 12-12h40c6.6 0 12 5.4 12 12v40c0 6.6-5.4 12-12 12h-40c-6.6 0-12-5.4-12-12v-40zM192 268c0-6.6 5.4-12 12-12h40c6.6 0 12 5.4 12 12v40c0 6.6-5.4 12-12 12h-40c-6.6 0-12-5.4-12-12v-40zm0 128c0-6.6 5.4-12 12-12h40c6.6 0 12 5.4 12 12v40c0 6.6-5.4 12-12 12h-40c-6.6 0-12-5.4-12-12v-40zM64 268c0-6.6 5.4-12 12-12h40c6.6 0 12 5.4 12 12v40c0 6.6-5.4 12-12 12H76c-6.6 0-12-5.4-12-12v-40zm0 128c0-6.6 5.4-12 12-12h40c6.6 0 12 5.4 12 12v40c0 6.6-5.4 12-12 12H76c-6.6 0-12-5.4-12-12v-40zM400 64h-48V16c0-8.8-7.2-16-16-16h-32c-8.8 0-16 7.2-16 16v48H160V16c0-8.8-7.2-16-16-16h-32c-8.8 0-16 7.2-16 16v48H48C21.5 64 0 85.5 0 112v48h448v-48c0-26.5-21.5-48-48-48z"/>',
        'cog': 'VB="0 0 512 512"><PFC d="M487.4 315.7l-42.6-24.6c4.3-23.2 4.3-47 0-70.2l42.6-24.6c4.9-2.8 7.1-8.6 5.5-14-11.1-35.6-30-67.8-54.7-94.6-3.8-4.1-10-5.1-14.8-2.3L380.8 110c-17.9-15.4-38.5-27.3-60.8-35.1V25.8c0-5.6-3.9-10.5-9.4-11.7-36.7-8.2-74.3-7.8-109.2 0-5.5 1.2-9.4 6.1-9.4 11.7V75c-22.2 7.9-42.8 19.8-60.8 35.1L88.7 85.5c-4.9-2.8-11-1.9-14.8 2.3-24.7 26.7-43.6 58.9-54.7 94.6-1.7 5.4.6 11.2 5.5 14L67.3 221c-4.3 23.2-4.3 47 0 70.2l-42.6 24.6c-4.9 2.8-7.1 8.6-5.5 14 11.1 35.6 30 67.8 54.7 94.6 3.8 4.1 10 5.1 14.8 2.3l42.6-24.6c17.9 15.4 38.5 27.3 60.8 35.1v49.2c0 5.6 3.9 10.5 9.4 11.7 36.7 8.2 74.3 7.8 109.2 0 5.5-1.2 9.4-6.1 9.4-11.7v-49.2c22.2-7.9 42.8-19.8 60.8-35.1l42.6 24.6c4.9 2.8 11 1.9 14.8-2.3 24.7-26.7 43.6-58.9 54.7-94.6 1.5-5.5-.7-11.3-5.6-14.1zM256 336c-44.1 0-80-35.9-80-80s35.9-80 80-80 80 35.9 80 80-35.9 80-80 80z"/>',
        'compress': 'VB="0 0 448 512"><PFC d="M436 192H312c-13.3 0-24-10.7-24-24V44c0-6.6 5.4-12 12-12h40c6.6 0 12 5.4 12 12v84h84c6.6 0 12 5.4 12 12v40c0 6.6-5.4 12-12 12zm-276-24V44c0-6.6-5.4-12-12-12h-40c-6.6 0-12 5.4-12 12v84H12c-6.6 0-12 5.4-12 12v40c0 6.6 5.4 12 12 12h124c13.3 0 24-10.7 24-24zm0 300V344c0-13.3-10.7-24-24-24H12c-6.6 0-12 5.4-12 12v40c0 6.6 5.4 12 12 12h84v84c0 6.6 5.4 12 12 12h40c6.6 0 12-5.4 12-12zm192 0v-84h84c6.6 0 12-5.4 12-12v-40c0-6.6-5.4-12-12-12H312c-13.3 0-24 10.7-24 24v124c0 6.6 5.4 12 12 12h40c6.6 0 12-5.4 12-12z"/>',
        'copy': 'VB="0 0 448 512"><PFC d="M320 448v40c0 13.255-10.745 24-24 24H24c-13.255 0-24-10.745-24-24V120c0-13.255 10.745-24 24-24h72v296c0 30.879 25.121 56 56 56h168zm0-344V0H152c-13.255 0-24 10.745-24 24v368c0 13.255 10.745 24 24 24h272c13.255 0 24-10.745 24-24V128H344c-13.2 0-24-10.8-24-24zm120.971-31.029L375.029 7.029A24 24 0 0 0 358.059 0H352v96h96v-6.059a24 24 0 0 0-7.029-16.97z"/>',
        'crash': 'VB="0 0 640 512"><PFC d="M143.25 220.81l-12.42 46.37c-3.01 11.25-3.63 22.89-2.41 34.39l-35.2 28.98c-6.57 5.41-16.31-.43-14.62-8.77l15.44-76.68c1.06-5.26-2.66-10.28-8-10.79l-77.86-7.55c-8.47-.82-11.23-11.83-4.14-16.54l65.15-43.3c4.46-2.97 5.38-9.15 1.98-13.29L21.46 93.22c-5.41-6.57.43-16.3 8.78-14.62l76.68 15.44c5.26 1.06 10.28-2.66 10.8-8l7.55-77.86c.82-8.48 11.83-11.23 16.55-4.14l43.3 65.14c2.97 4.46 9.15 5.38 13.29 1.98l60.4-49.71c6.57-5.41 16.3.43 14.62 8.77L262.1 86.38c-2.71 3.05-5.43 6.09-7.91 9.4l-32.15 42.97-10.71 14.32c-32.73 8.76-59.18 34.53-68.08 67.74zm494.57 132.51l-12.42 46.36c-3.13 11.68-9.38 21.61-17.55 29.36a66.876 66.876 0 0 1-8.76 7l-13.99 52.23c-1.14 4.27-3.1 8.1-5.65 11.38-7.67 9.84-20.74 14.68-33.54 11.25L515 502.62c-17.07-4.57-27.2-22.12-22.63-39.19l8.28-30.91-247.28-66.26-8.28 30.91c-4.57 17.07-22.12 27.2-39.19 22.63l-30.91-8.28c-12.8-3.43-21.7-14.16-23.42-26.51-.57-4.12-.35-8.42.79-12.68l13.99-52.23a66.62 66.62 0 0 1-4.09-10.45c-3.2-10.79-3.65-22.52-.52-34.2l12.42-46.37c5.31-19.8 19.36-34.83 36.89-42.21a64.336 64.336 0 0 1 18.49-4.72l18.13-24.23 32.15-42.97c3.45-4.61 7.19-8.9 11.2-12.84 8-7.89 17.03-14.44 26.74-19.51 4.86-2.54 9.89-4.71 15.05-6.49 10.33-3.58 21.19-5.63 32.24-6.04 11.05-.41 22.31.82 33.43 3.8l122.68 32.87c11.12 2.98 21.48 7.54 30.85 13.43a111.11 111.11 0 0 1 34.69 34.5c8.82 13.88 14.64 29.84 16.68 46.99l6.36 53.29 3.59 30.05a64.49 64.49 0 0 1 22.74 29.93c4.39 11.88 5.29 25.19 1.75 38.39zM255.58 234.34c-18.55-4.97-34.21 4.04-39.17 22.53-4.96 18.49 4.11 34.12 22.65 39.09 18.55 4.97 45.54 15.51 50.49-2.98 4.96-18.49-15.43-53.67-33.97-58.64zm290.61 28.17l-6.36-53.29c-.58-4.87-1.89-9.53-3.82-13.86-5.8-12.99-17.2-23.01-31.42-26.82l-122.68-32.87a48.008 48.008 0 0 0-50.86 17.61l-32.15 42.97 172 46.08 75.29 20.18zm18.49 54.65c-18.55-4.97-53.8 15.31-58.75 33.79-4.95 18.49 23.69 22.86 42.24 27.83 18.55 4.97 34.21-4.04 39.17-22.53 4.95-18.48-4.11-34.12-22.66-39.09z"/>',
        'cube': 'VB="0 0 576 512"><PFC d="M498.11,206.4,445.31,14.72,248.2,66.08,219,116.14l-59.2-.43L15.54,256,159.82,396.32l59.17-.43,29.24,50,197.08,51.36,52.8-191.62-30-49.63ZM223.77,124.2,374.55,86.51,288,232.33H114.87Zm0,263.63L114.87,279.71H288l86.55,145.81Zm193,14L330.17,256l86.58-145.84L458.56,256Z"/>',
        'down': 'VB="0 0 320 512"><PFC d="M31.3 192h257.3c17.8 0 26.7 21.5 14.1 34.1L174.1 354.8c-7.8 7.8-20.5 7.8-28.3 0L17.2 226.1C4.6 213.5 13.5 192 31.3 192z"/>',
        'download': 'VB="0 0 512 512"><PFC d="M216 0h80c13.3 0 24 10.7 24 24v168h87.7c17.8 0 26.7 21.5 14.1 34.1L269.7 378.3c-7.5 7.5-19.8 7.5-27.3 0L90.1 226.1c-12.6-12.6-3.7-34.1 14.1-34.1H192V24c0-13.3 10.7-24 24-24zm296 376v112c0 13.3-10.7 24-24 24H24c-13.3 0-24-10.7-24-24V376c0-13.3 10.7-24 24-24h146.7l49 49c20.1 20.1 52.5 20.1 72.6 0l49-49H488c13.3 0 24 10.7 24 24zm-124 88c0-11-9-20-20-20s-20 9-20 20 9 20 20 20 20-9 20-20zm64 0c0-11-9-20-20-20s-20 9-20 20 9 20 20 20 20-9 20-20z"/>',
        'end': 'VB="0 0 448 512"><PFC d="M224.3 273l-136 136c-9.4 9.4-24.6 9.4-33.9 0l-22.6-22.6c-9.4-9.4-9.4-24.6 0-33.9l96.4-96.4-96.4-96.4c-9.4-9.4-9.4-24.6 0-33.9L54.3 103c9.4-9.4 24.6-9.4 33.9 0l136 136c9.5 9.4 9.5 24.6.1 34zm192-34l-136-136c-9.4-9.4-24.6-9.4-33.9 0l-22.6 22.6c-9.4 9.4-9.4 24.6 0 33.9l96.4 96.4-96.4 96.4c-9.4 9.4-9.4 24.6 0 33.9l22.6 22.6c9.4 9.4 24.6 9.4 33.9 0l136-136c9.4-9.2 9.4-24.4 0-33.8z"/>',
        'expand': 'VB="0 0 448 512"><PFC d="M0 180V56c0-13.3 10.7-24 24-24h124c6.6 0 12 5.4 12 12v40c0 6.6-5.4 12-12 12H64v84c0 6.6-5.4 12-12 12H12c-6.6 0-12-5.4-12-12zM288 44v40c0 6.6 5.4 12 12 12h84v84c0 6.6 5.4 12 12 12h40c6.6 0 12-5.4 12-12V56c0-13.3-10.7-24-24-24H300c-6.6 0-12 5.4-12 12zm148 276h-40c-6.6 0-12 5.4-12 12v84h-84c-6.6 0-12 5.4-12 12v40c0 6.6 5.4 12 12 12h124c13.3 0 24-10.7 24-24V332c0-6.6-5.4-12-12-12zM160 468v-40c0-6.6-5.4-12-12-12H64v-84c0-6.6-5.4-12-12-12H12c-6.6 0-12 5.4-12 12v124c0 13.3 10.7 24 24 24h124c6.6 0 12-5.4 12-12z"/>',
        'info': 'VB="0 0 512 512"><PFC d="M256 8C119.043 8 8 119.083 8 256c0 136.997 111.043 248 248 248s248-111.003 248-248C504 119.083 392.957 8 256 8zm0 110c23.196 0 42 18.804 42 42s-18.804 42-42 42-42-18.804-42-42 18.804-42 42-42zm56 254c0 6.627-5.373 12-12 12h-88c-6.627 0-12-5.373-12-12v-24c0-6.627 5.373-12 12-12h12v-64h-12c-6.627 0-12-5.373-12-12v-24c0-6.627 5.373-12 12-12h64c6.627 0 12 5.373 12 12v100h12c6.627 0 12 5.373 12 12v24z"/>',
        'lock': 'VB="0 0 576 512"><PFC d="M423.5 0C339.5.3 272 69.5 272 153.5V224H48c-26.5 0-48 21.5-48 48v192c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48V272c0-26.5-21.5-48-48-48h-48v-71.1c0-39.6 31.7-72.5 71.3-72.9 40-.4 72.7 32.1 72.7 72v80c0 13.3 10.7 24 24 24h32c13.3 0 24-10.7 24-24v-80C576 68 507.5-.3 423.5 0z"/>',
        'log': 'VB="0 0 448 512"><PFC d="M448 360V24c0-13.3-10.7-24-24-24H96C43 0 0 43 0 96v320c0 53 43 96 96 96h328c13.3 0 24-10.7 24-24v-16c0-7.5-3.5-14.3-8.9-18.7-4.2-15.4-4.2-59.3 0-74.7 5.4-4.3 8.9-11.1 8.9-18.6zM128 134c0-3.3 2.7-6 6-6h212c3.3 0 6 2.7 6 6v20c0 3.3-2.7 6-6 6H134c-3.3 0-6-2.7-6-6v-20zm0 64c0-3.3 2.7-6 6-6h212c3.3 0 6 2.7 6 6v20c0 3.3-2.7 6-6 6H134c-3.3 0-6-2.7-6-6v-20zm253.4 250H96c-17.7 0-32-14.3-32-32 0-17.6 14.4-32 32-32h285.4c-1.9 17.1-1.9 46.9 0 64z"/>',
        'medal': 'VB="0 0 512 512"><PFC d="M223.75 130.75L154.62 15.54A31.997 31.997 0 0 0 127.18 0H16.03C3.08 0-4.5 14.57 2.92 25.18l111.27 158.96c29.72-27.77 67.52-46.83 109.56-53.39zM495.97 0H384.82c-11.24 0-21.66 5.9-27.44 15.54l-69.13 115.21c42.04 6.56 79.84 25.62 109.56 53.38L509.08 25.18C516.5 14.57 508.92 0 495.97 0zM256 160c-97.2 0-176 78.8-176 176s78.8 176 176 176 176-78.8 176-176-78.8-176-176-176zm92.52 157.26l-37.93 36.96 8.97 52.22c1.6 9.36-8.26 16.51-16.65 12.09L256 393.88l-46.9 24.65c-8.4 4.45-18.25-2.74-16.65-12.09l8.97-52.22-37.93-36.96c-6.82-6.64-3.05-18.23 6.35-19.59l52.43-7.64 23.43-47.52c2.11-4.28 6.19-6.39 10.28-6.39 4.11 0 8.22 2.14 10.33 6.39l23.43 47.52 52.43 7.64c9.4 1.36 13.17 12.95 6.35 19.59z"/>',
        'minus': 'VB="0 0 448 512"><PFC d="M416 208H32c-17.67 0-32 14.33-32 32v32c0 17.67 14.33 32 32 32h384c17.67 0 32-14.33 32-32v-32c0-17.67-14.33-32-32-32z"/>',
        'moon': 'VB="0 0 512 512"><PFC d="M283.211 512c78.962 0 151.079-35.925 198.857-94.792 7.068-8.708-.639-21.43-11.562-19.35-124.203 23.654-238.262-71.576-238.262-196.954 0-72.222 38.662-138.635 101.498-174.394 9.686-5.512 7.25-20.197-3.756-22.23A258.156 258.156 0 0 0 283.211 0c-141.309 0-256 114.511-256 256 0 141.309 114.511 256 256 256z"/>',
        'next': 'VB="0 0 256 512"><PFC d="M224.3 273l-136 136c-9.4 9.4-24.6 9.4-33.9 0l-22.6-22.6c-9.4-9.4-9.4-24.6 0-33.9l96.4-96.4-96.4-96.4c-9.4-9.4-9.4-24.6 0-33.9L54.3 103c9.4-9.4 24.6-9.4 33.9 0l136 136c9.5 9.4 9.5 24.6.1 34z"/>',
        'pause': 'VB="0 0 448 512"><PFC d="M144 479H48c-26.5 0-48-21.5-48-48V79c0-26.5 21.5-48 48-48h96c26.5 0 48 21.5 48 48v352c0 26.5-21.5 48-48 48zm304-48V79c0-26.5-21.5-48-48-48h-96c-26.5 0-48 21.5-48 48v352c0 26.5 21.5 48 48 48h96c26.5 0 48-21.5 48-48z"/>',
        'play': 'VB="0 0 448 512"><PFC d="M424.4 214.7L72.4 6.6C43.8-10.3 0 6.1 0 47.9V464c0 37.5 40.7 60.1 72.4 41.3l352-208c31.4-18.5 31.5-64.1 0-82.6z"/>',
        'plus': 'VB="0 0 448 512"><PFC d="M416 208H272V64c0-17.67-14.33-32-32-32h-32c-17.67 0-32 14.33-32 32v144H32c-17.67 0-32 14.33-32 32v32c0 17.67 14.33 32 32 32h144v144c0 17.67 14.33 32 32 32h32c17.67 0 32-14.33 32-32V304h144c17.67 0 32-14.33 32-32v-32c0-17.67-14.33-32-32-32z"/>',
        'rotate': 'VB="0 0 512 512"><PFC d="M504.971 359.029c9.373 9.373 9.373 24.569 0 33.941l-80 79.984c-15.01 15.01-40.971 4.49-40.971-16.971V416h-58.785a12.004 12.004 0 0 1-8.773-3.812l-70.556-75.596 53.333-57.143L352 336h32v-39.981c0-21.438 25.943-31.998 40.971-16.971l80 79.981zM12 176h84l52.781 56.551 53.333-57.143-70.556-75.596A11.999 11.999 0 0 0 122.785 96H12c-6.627 0-12 5.373-12 12v56c0 6.627 5.373 12 12 12zm372 0v39.984c0 21.46 25.961 31.98 40.971 16.971l80-79.984c9.373-9.373 9.373-24.569 0-33.941l-80-79.981C409.943 24.021 384 34.582 384 56.019V96h-58.785a12.004 12.004 0 0 0-8.773 3.812L96 336H12c-6.627 0-12 5.373-12 12v56c0 6.627 5.373 12 12 12h110.785c3.326 0 6.503-1.381 8.773-3.812L352 176h32z"/>',
        'sun': 'VB="0 0 512 512"><PFC d="M256 160c-52.9 0-96 43.1-96 96s43.1 96 96 96 96-43.1 96-96-43.1-96-96-96zm246.4 80.5l-94.7-47.3 33.5-100.4c4.5-13.6-8.4-26.5-21.9-21.9l-100.4 33.5-47.4-94.8c-6.4-12.8-24.6-12.8-31 0l-47.3 94.7L92.7 70.8c-13.6-4.5-26.5 8.4-21.9 21.9l33.5 100.4-94.7 47.4c-12.8 6.4-12.8 24.6 0 31l94.7 47.3-33.5 100.5c-4.5 13.6 8.4 26.5 21.9 21.9l100.4-33.5 47.3 94.7c6.4 12.8 24.6 12.8 31 0l47.3-94.7 100.4 33.5c13.6 4.5 26.5-8.4 21.9-21.9l-33.5-100.4 94.7-47.3c13-6.5 13-24.7.2-31.1zm-155.9 106c-49.9 49.9-131.1 49.9-181 0-49.9-49.9-49.9-131.1 0-181 49.9-49.9 131.1-49.9 181 0 49.9 49.9 49.9 131.1 0 181z"/>',
        'theater': 'VB="0 0 640 512"><PFC d="M206.86 245.15c-35.88 10.45-59.95 41.2-57.53 74.1 11.4-12.72 28.81-23.7 49.9-30.92l7.63-43.18zM95.81 295L64.08 115.49c-.29-1.62.28-2.62.24-2.65 57.76-32.06 123.12-49.01 189.01-49.01 1.61 0 3.23.17 4.85.19 13.95-13.47 31.73-22.83 51.59-26 18.89-3.02 38.05-4.55 57.18-5.32-9.99-13.95-24.48-24.23-41.77-27C301.27 1.89 277.24 0 253.32 0 176.66 0 101.02 19.42 33.2 57.06 9.03 70.48-3.92 98.48 1.05 126.58l31.73 179.51c14.23 80.52 136.33 142.08 204.45 142.08 3.59 0 6.75-.46 10.01-.8-13.52-17.08-28.94-40.48-39.5-67.58-47.61-12.98-106.06-51.62-111.93-84.79zm97.55-137.46c-.73-4.12-2.23-7.87-4.07-11.4-8.25 8.91-20.67 15.75-35.32 18.32-14.65 2.58-28.67.4-39.48-5.17-.52 3.94-.64 7.98.09 12.1 3.84 21.7 24.58 36.19 46.34 32.37 21.75-3.82 36.28-24.52 32.44-46.22zM606.8 120.9c-88.98-49.38-191.43-67.41-291.98-51.35-27.31 4.36-49.08 26.26-54.04 54.36l-31.73 179.51c-15.39 87.05 95.28 196.27 158.31 207.35 63.03 11.09 204.47-53.79 219.86-140.84l31.73-179.51c4.97-28.11-7.98-56.11-32.15-69.52zm-273.24 96.8c3.84-21.7 24.58-36.19 46.34-32.36 21.76 3.83 36.28 24.52 32.45 46.22-.73 4.12-2.23 7.87-4.07 11.4-8.25-8.91-20.67-15.75-35.32-18.32-14.65-2.58-28.67-.4-39.48 5.17-.53-3.95-.65-7.99.08-12.11zm70.47 198.76c-55.68-9.79-93.52-59.27-89.04-112.9 20.6 25.54 56.21 46.17 99.49 53.78 43.28 7.61 83.82.37 111.93-16.6-14.18 51.94-66.71 85.51-122.38 75.72zm130.3-151.34c-8.25-8.91-20.68-15.75-35.33-18.32-14.65-2.58-28.67-.4-39.48 5.17-.52-3.94-.64-7.98.09-12.1 3.84-21.7 24.58-36.19 46.34-32.37 21.75 3.83 36.28 24.52 32.45 46.22-.73 4.13-2.23 7.88-4.07 11.4z"/>',
        'trophy': 'VB="0 0 576 512"><PFC d="M552 64H448V24c0-13.3-10.7-24-24-24H152c-13.3 0-24 10.7-24 24v40H24C10.7 64 0 74.7 0 88v56c0 35.7 22.5 72.4 61.9 100.7 31.5 22.7 69.8 37.1 110 41.7C203.3 338.5 240 360 240 360v72h-48c-35.3 0-64 20.7-64 56v12c0 6.6 5.4 12 12 12h296c6.6 0 12-5.4 12-12v-12c0-35.3-28.7-56-64-56h-48v-72s36.7-21.5 68.1-73.6c40.3-4.6 78.6-19 110-41.7 39.3-28.3 61.9-65 61.9-100.7V88c0-13.3-10.7-24-24-24zM99.3 192.8C74.9 175.2 64 155.6 64 144v-16h64.2c1 32.6 5.8 61.2 12.8 86.2-15.1-5.2-29.2-12.4-41.7-21.4zM512 144c0 16.1-17.7 36.1-35.3 48.8-12.5 9-26.7 16.2-41.8 21.4 7-25 11.8-53.6 12.8-86.2H512v16z"/>',
        'unlock': 'VB="0 0 448 512"><PFC d="M400 224h-24v-72C376 68.2 307.8 0 224 0S72 68.2 72 152v72H48c-26.5 0-48 21.5-48 48v192c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48V272c0-26.5-21.5-48-48-48zm-104 0H152v-72c0-39.7 32.3-72 72-72s72 32.3 72 72v72z"/>',
        'x': 'VB="0 0 352 512"><PFC d="M242.72 256l100.07-100.07c12.28-12.28 12.28-32.19 0-44.48l-22.24-22.24c-12.28-12.28-32.19-12.28-44.48 0L176 189.28 75.93 89.21c-12.28-12.28-32.19-12.28-44.48 0L9.21 111.45c-12.28 12.28-12.28 32.19 0 44.48L109.28 256 9.21 356.07c-12.28 12.28-12.28 32.19 0 44.48l22.24 22.24c12.28 12.28 32.2 12.28 44.48 0L176 322.72l100.07 100.07c12.28 12.28 32.2 12.28 44.48 0l22.24-22.24c12.28-12.28 12.28-32.19 0-44.48L242.72 256z"/>',
    };

    LANGUAGES = {
        'bul': 'български',
        'deu': 'Deutsch',
        'eng': 'English',
        'spa': 'español',
        'fra': 'français',
        'jpn': '日本語',
        'pol': 'polski',
        'rus': 'русский',
        'ukr': 'українська',
        'zzz': '...',
    };

    // assign virtual functions
    virtual_change_setting_special = change_setting_special;
    virtual_check_hash_special = check_hash_special;
    virtual_hide_areas = hide_areas;
    virtual_import_settings = import_settings_special;
    virtual_opened_table_special = opened_table_special;
    virtual_populate_areas_special = populate_areas_special;
    virtual_reset_settings_special = reset_settings_special;
    virtual_resize = resize;
    virtual_set_modal_events_special = set_modal_events_special;

    // pre-process
    detect_device();
    startup_config();
    startup_3d();
    startup_game();

    prepare_settings();
    load_settings();
    change_theme();
    start_game();
    init_graph();
    check_hash();

    set_global_events();
    set_engine_events();
    set_game_events();
    startup_graph();
    add_history();
    ready ++;

    check_socket_io();
    init_globals();
    init_customs(true);
    quick_setup();
    resize();
    ready ++;
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// <<
if (typeof exports != 'undefined')
    Assign(exports, {
        prepare_settings: prepare_settings,
    });
// >>
