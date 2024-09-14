// engine.js
// @author octopoulo <polluxyz@gmail.com>
// @version 2021-03-11
//
// used as a base for all frameworks
// unlike common.js, states are required
// contains global vars but the script will be imported in a function => they become local
//
// included after: common
// jshint -W069
/*
globals
_, A, Abs, AnimationFrame, Assign, Attrs, C, CacheId, cancelAnimationFrame, Ceil, Clamp, Class, Clear, clearInterval,
clearTimeout, CreateNode,
DefaultFloat, DefaultInt, document, DownloadObject, E, Events, exports, Floor, From, global, HasClass, Hide, history,
HTML, Input, IS_NODE, IsArray, IsDigit, IsFloat, IsFunction, IsObject, IsString, Keys,
LoadLibrary, location, Lower, LS, Max, Min, NAMESPACE_SVG, navigator, Now, Parent, ParseJSON, PD, Pow, QueryString,
require, Resource,
S, Safe, ScrollDocument, SetDefault, setInterval, setTimeout, Show, Sign, SP, Stringify, Style, TextHTML, Title,
Undefined, Upper, Visible, VisibleHeight, VisibleWidth, WebSocket, window
*/
'use strict';

// <<
if (typeof global != 'undefined' && typeof require != 'undefined') {
    ['common'].forEach(key => {
        Object.assign(global, require(`./${key}.js`));
    });
}
// >>

let __PREFIX = '_',
    ANCHORS = {},
    animation,
    api = {},
    api_times = {},
    AUTO_ON_OFF = ['auto', 'on', 'off'],
    change_queue,
    click_target,
    context_areas = {},
    context_target,
    DEFAULTS = {
        'language': '',
        'theme': '',
    },
    DEV = {},
    DEV_NAMES = {
        'd': 'debug',
    },
    device = {},
    drag,
    drag_moved,
    drag_scroll = 3,
    drag_target,
    drag_type,
    FONTS = {
        '': {
            '': 615,
        },
    },
    full_scroll = {x: 0, y: 0},
    full_target,
    HIDES = {},
    HOST = '',
    ICONS = {},
    KEY_TIMES = {},
    KEYS = {},
    LANGUAGES = {},
    // only if they're different from the first 2 letters, ex: it:ita is not necessary
    LANGUAGES_23 = {
        'es': 'spa',
        'ja': 'jpn',
        'pl': 'pol',
        'sv': 'swe',
    },
    last_scroll = 0,
    libraries = {},
    LINKS = {},
    LOCALHOST = (typeof location == 'object') && location.port == 8080,
    localStorage = (IS_NODE || window).localStorage,
    MAX_HISTORY = 20,
    me = {},
    // &1:no import/export, &2:no change setting, &4:update Y but no localStorage
    NO_IMPORTS = {
        'import_settings': 2,
        'language': 1,
        'password': 2,
        'preset': 1,
        'seen': 1,
    },
    NO_TRANSLATES = {
        '#': 1,
    },
    ON_OFF = ['on', 'off'],
    PANES = {},
    ping = 0,
    pong = 0,
    POPUP_ADJUSTS = {},
    popup_classes = new Set(),
    QUERY_KEYS = {
        '': '?',
        'hash': '#',
    },
    scroll_target,
    socket,
    socket_fail = 0,
    STATE_KEYS = {},
    TAB_NAMES = {},
    THEMES = [''],
    TIMEOUT_activate = 500,                             // activate tabs in populate_areas
    TIMEOUT_adjust = 250,
    TIMEOUT_preset = LOCALHOST? 60: 3600 * 2,
    TIMEOUT_touch = 0.5,
    TIMEOUT_translate = LOCALHOST? 60: 3600 * 2,
    timers = {},
    TITLES = {},
    touch_done = 0,                                     // time when the touch was released
    TOUCH_ENDS = {
        'mouseleave': 1,
        'mouseup': 1,
        'touchend': 1,
    },
    touch_last = {x: 0, y: 0},
    touch_moves = [],
    TOUCH_MOVES = {
        'mousemove': 1,
        'touchmove': 2,
    },
    touch_now,
    touch_scroll = {x: 0, y: 0},
    touch_speed = {x: 0, y: 0},
    touch_start,
    TOUCH_STARTS = {
        'mousedown': 1,
        'mouseenter': 1,
        'touchstart': 2,
    },
    TRANSLATE_SPECIALS = {},
    translates = {},
    TRANSLATES = {},
    TYPES = {},
    // virtual functions, can be assigned
    virtual_change_setting_special,
    virtual_check_hash_special,
    virtual_click_tab,
    virtual_drag_done,
    virtual_hide_areas,
    virtual_import_settings,
    virtual_logout,
    virtual_populate_areas_special,
    virtual_rename_option,
    virtual_reset_settings_special,
    virtual_sanitise_data_special,
    virtual_set_combo_special,
    virtual_set_modal_events_special,
    virtual_socket_message,
    virtual_socket_open,
    WS = (typeof WebSocket != 'undefined')? WebSocket: null,
    X_SETTINGS = {},
    Y = {},                                             // params
    y_index = -1,
    y_states = [],
    y_x = '';

/** @typedef {{x:number, y:number}} */
let Vector2;

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// HELPERS
//////////

/**
 * Add a timeout / interval
 * @param {string} name
 * @param {Function} func function to be called after the timer
 * @param {number} timer milliseconds <0: does nothing, =0: executes directly, >0: timer
 * @param {boolean=} is_interval
 */
function add_timeout(name, func, timer, is_interval) {
    clear_timeout(name);
    if (timer < 0)
        return;

    if (timer)
        timers[name] = [
            is_interval? setInterval(func, timer): setTimeout(() => {delete timers[name]; func();}, timer),
            is_interval? 1: 0,
        ];
    else
        func();
    if (DEV['frame']) {
        LS(`add_timeout: ${name} : ${timer} : ${is_interval}`);
        LS(timers);
    }
}

/**
 * Cancel the animation
 */
function cancel_animation() {
    if (!isNaN(animation)) {
        cancelAnimationFrame(/** @type {number} */(animation));
        animation = null;
    }
}

/**
 * Clear a timeout / interval
 * @param {string} name
 */
function clear_timeout(name) {
    let timer = timers[name];
    if (!timer)
        return;

    if (timer[1])
        clearInterval(timer[0]);
    else
        clearTimeout(timer[0]);

    delete timers[name];
    if (DEV['frame'])
        LS(`clear_timeout: ${name} : ${timer}`);
}

/**
 * Create a field for a table value
 * @param {string} text
 * @returns {!Array<string>} field, value
 */
function create_field_value(text) {
    let field = text,
        indices = [field.indexOf(' ['), field.indexOf(' <')].filter(pos => pos > 0).sort(),
        pos = field.indexOf('=');

    if (indices.length && (pos < 0 || pos > indices[0]))
        field = field.slice(0, indices[0]);

    pos = field.indexOf('=');
    if (pos > 0)
        return [field.slice(0, pos), field.slice(pos + 1)];

    // startTime => start_time
    field = Lower(field.replace(/([a-z])([A-Z])/g, (_match, p1, p2) => `${p1}_${p2}`));
    return [field.replace(/[{}]/g, '').replace(/[_() ./#-]+/g, '_').replace(/^_+|_+$/, ''), text];
}

/**
 * Set the current section
 * @param {string} section
 */
function set_section(section) {
    y_x = section;
    if (IS_NODE)
        IS_NODE.y_x = y_x;
}

// SETTINGS
///////////

/**
 * Remember the setting state
 */
function add_history() {
    let text = Stringify(Y);
    if (text == y_states[y_index])
        return;
    y_index ++;
    y_states[y_index] = text;
    y_states.length = y_index + 1;
    if (y_states.length > MAX_HISTORY)
        y_states.shift();
}

/**
 * Change a setting
 * @param {string} name
 * @param {string|number=} value
 * @param {boolean=} close close the popup
 */
function change_setting(name, value, close) {
    let old_value = Y[name];

    if (value != undefined) {
        // TODO: clamp the value if min/max are defined
        if ('fi'.includes(TYPES[name]) && !isNaN(value))
            value *= 1;

        let no_import = NO_IMPORTS[name] || 0;
        if (!(no_import & 2)) {
            if (no_import & 4)
                Y[name] = value;
            else
                save_option(name, value);
        }
    }

    // holding down a key => skip
    if (KEYS[38] || KEYS[40]) {
        change_queue = [name, value, close];
        return;
    }
    change_queue = null;

    if (virtual_change_setting_special && virtual_change_setting_special(name, value, close))
        return;

    switch (name) {
    case 'language':
        // load a language file?
        if (value == 'zzz') {
            if (old_value == 'eng')
                old_value = 'fra';
            _('select[name="language"]').value = old_value;
            save_option(name, old_value);

            let file = CacheId('file');
            Attrs(file, {'data-x': name});
            file.click();
            break;
        }
        else if (value == 'eng' || translates['_lan'] == value)
            translate_nodes('body');
        else if (value != 'eng')
            api_translate_get();
        break;
    case 'theme':
        update_theme([value]);
        break;
    }
}

/**
 * Destroy a popup content + style
 * @param {Node} node
 * @param {number} &1:html, &2:style
 */
function destroy_popup(node, flag) {
    if (flag & 1)
        HTML(node, '');
    if (flag & 2)
        Style(node, [['height', 'unset'], ['transform', 'unset'], ['width', 'unset']]);
}

/**
 * Export settings
 * @param {string} name
 */
function export_settings(name) {
    Assign(Y, {
        '_dpr': Floor(window.devicePixelRatio * 1000 + 0.5) / 1000,
        '_height': window.innerHeight,
        '_width': window.innerWidth,
        '_zoom': Floor(window.outerWidth / window.innerWidth * 1000 + 0.5) / 1000,
    });
    let keys = Keys(Y).filter(key => !NO_IMPORTS[key]).sort((a, b) => Lower(a).localeCompare(Lower(b))),
        object = Assign({}, ...keys.map(key => ({[key]: Y[key]})));
    DownloadObject(object, `${name}.json`, 0, '  ');
}

/**
 * Local Storage - get float
 * @param {string} name
 * @param {number} def
 * @returns {number}
 */
function get_float(name, def) {
    return DefaultFloat(get_string(name), def);
}

/**
 * Local Storage - get int/bool
 * + keep the string when fails to convert
 * @param {string} name
 * @param {number|boolean} def also used if the value cannot be converted to an `int`
 * @param {boolean=} force force int, otherwise keep the string
 * @returns {number|boolean|string}
 */
function get_int(name, def, force) {
    let text = get_string(name),
        value = DefaultInt(text, force? def: (text || def));
    if (typeof(def) == 'boolean')
        value = !!value;
    return value;
}

/**
 * Local Storage - get an object
 * @param {string} name
 * @param {*=} def
 * @returns {*}
 */
function get_object(name, def) {
    let text = get_string(name);
    if (!text)
        return def;
    return ParseJSON(text, def);
}

/**
 * Local Storage - get string
 * @param {string} name
 * @param {string=} def
 * @returns {string}
 */
function get_string(name, def) {
    let value = localStorage.getItem(`${__PREFIX}${name}`);
    return (value == 'undefined')? def: (value || def);
}

/**
 * Guess the types
 * @param {!Object} settings
 * @param {Array<string>=} keys
 */
function guess_types(settings, keys) {
    if (!keys)
        keys = Keys(settings);

    keys.forEach(key => {
        let type,
            def = DEFAULTS[key],
            def_type = typeof(def),
            setting = settings[key];

        if (def_type == 'boolean')
            type = 'b';
        else if (def_type == 'object' && def != undefined)
            type = 'o';
        else if (def_type == 'string') {
            type = 's';
            // auto, on, off => i
            if (IsArray(setting)) {
                let first = setting[0],
                    is_array = IsArray(first);
                if (is_array && first.length && first.includes(ON_OFF[1]))
                    type = 'i';
            }
        }
        else if (IsFloat(def))
            type = 'f';
        // integer default could still be a float type
        else {
            let obj_type = typeof(setting);

            if (IsArray(setting)) {
                let first = setting[0],
                    is_array = IsArray(first);

                if (!is_array) {
                    switch (first.type) {
                    case 'number':
                        type = IsFloat(first.step || 1)? 'f': 'i';
                        break;
                    case 'color':
                    case 'text':
                        type = 's';
                        break;
                    case 'list':
                        type = 'u';
                        break;
                    default:
                        type = 'o';
                    }
                }
                // contains 'off'?
                else if (first.length && first.includes(ON_OFF[1]))
                    type = 'i';

                if (!type && is_array) {
                    type = 'i';
                    for (let item of first) {
                        if (IsString(item)) {
                            type = 's';
                            break;
                        }
                        if (IsFloat(item)) {
                            type = 'f';
                            break;
                        }
                    }
                }
            }
            else if (obj_type == 'boolean')
                type = 'b';
            else if (obj_type == 'object')
                type = 'o';
            else if (obj_type == 'string')
                type = 's';
            else if (obj_type == 'number')
                type = IsFloat(setting)? 'f': 'i';
        }

        if (type)
            TYPES[key] = type;
    });
}

/**
 * Import settings from an object
 * @param {*} data
 * @param {boolean=} reset
 */
function import_settings(data, reset) {
    if (!IsObject(data))
        return;

    Keys(/** @type {!Object} */(data)).forEach(key => {
        if (!NO_IMPORTS[key])
            save_option(key, data[key]);
    });

    if (reset)
        reset_settings();
    if (virtual_import_settings)
        virtual_import_settings();
}

/**
 * Load default settings
 */
function load_defaults() {
    Keys(DEFAULTS).forEach(key => {
        let value,
            def = DEFAULTS[key],
            type = TYPES[key];

        switch (type) {
        case 'f':
            value = get_float(key, def);
            break;
        case 'b':
        case 'i':
            value = get_int(key, def);
            break;
        case 'o':
            value = get_object(key, def);
            break;
        case 's':
            value = get_string(key, def);
            break;
        case 'u':
            return;
        default:
            LS(`unknown type: ${key} : ${def}`);
        }

        Y[key] = value;
    });

    // use browser language
    guess_browser_language();
}

/**
 * Load a preset
 * @param {string} name
 */
function load_preset(name) {
    if (name == 'custom')
        return;
    if (name == 'default settings')
        reset_settings(true);
    else {
        Resource(`preset/${name}.json?v=${Ceil(Now() / TIMEOUT_preset)}`, (code, data) => {
            if (code != 200)
                return;
            import_settings(data, true);
        });
    }
}

/**
 * Merge settings
 * + updates DEFAULTS and TYPES
 * @param {!Object} x_settings
 */
function merge_settings(x_settings) {
    Keys(x_settings).forEach(name => {
        let value = x_settings[name];

        // audio: { ... }
        if (IsObject(value)) {
            let exists = /** @type {!Object} */(SetDefault(X_SETTINGS, name, {}));
            Assign(exists, value);
            X_SETTINGS[name] = Assign({}, ...Keys(exists).map(key => ({[key]: exists[key]})));
        }
        // _split: 8
        else
            X_SETTINGS[name] = value;
    });

    // update defaults
    // + skip undefined values
    Keys(X_SETTINGS).forEach(name => {
        let settings = X_SETTINGS[name];
        if (!IsObject(settings))
            return;

        let dico = {},
            sub_settings = {};

        Keys(settings).forEach(key => {
            if (key[0] == '_')
                return;
            let setting = settings[key];
            if (!IsObject(setting))
                return;

            // support {_value: [...]}
            if (setting['_value'])
                setting = setting['_value'];

            // support {_multi: 2, a: [...], b: [...]}
            if (setting['_multi'] && !setting['_main']) {
                Keys(setting).forEach(sub_key => {
                    if (sub_key[0] == '_')
                        return;
                    let sub = setting[sub_key];
                    if (sub[1] != undefined)
                        dico[sub_key] = sub[1];
                    sub_settings[sub_key] = sub;
                });
            }
            else {
                if (setting[1] != undefined)
                    dico[key] = setting[1];
                sub_settings[key] = setting;
            }
        });

        // update defaults + types
        Assign(DEFAULTS, dico);
        guess_types(sub_settings, Keys(dico));
    });
}

/**
 * Utility for creating settings
 * @param {number|string} def
 * @param {number} min
 * @param {number} max
 * @param {number=} step
 * @param {Object=} options
 * @param {string=} help
 * @returns {!Array<*>}
 */
function option_number(def, min, max, step=1, options={}, help='') {
    return [Assign({max: max, min: min, step: step, type: 'number'}, options), def, help];
}

/**
 * Parse DEV
 */
function parse_dev() {
    let text = Y['dev'] || '';
    Clear(DEV);

    for (let i = 0, length = text.length; i < length; i ++) {
        let letter = text[i];
        if (letter == 'Z') {
            Clear(DEV);
            continue;
        }

        let name = DEV_NAMES[letter];
        if (!name)
            continue;

        let i2 = i + 1,
            value = 0;
        for (; i2 < length && IsDigit(text[i2]); i2 ++)
            value = value * 10 + text[i2] * 1;
        if (i2 == i + 1)
            value = 1;
        i = i2 - 1;

        if (!value)
            DEV[name] = 0;
        else {
            (value.toString(2)).split('').reverse().forEach((bit, id) => {
                if (bit == '1')
                    DEV[`${name}${id? (1 << id): ''}`] = value;
            });
        }
    }

    if (DEV['debug'])
        LS(DEV);
}

/**
 * Local Storage - remove a key
 * @param {string} name
 */
function remove_storage(name) {
    localStorage.removeItem(`${__PREFIX}${name}`);
}

/**
 * Reset a default value
 * + remove it from localStorage
 * @param {string} name
 * @returns {*} default value
 */
function reset_default(name) {
    let value = DEFAULTS[name];
    Y[name] = value;
    remove_storage(name);
    return value;
}

/**
 * Reset to the default/other settings
 * @param {boolean=} is_default
 */
function reset_settings(is_default) {
    if (is_default) {
        localStorage.clear();
        Assign(Y, DEFAULTS);
    }

    if (virtual_reset_settings_special)
        virtual_reset_settings_special(is_default);
}

/**
 * Restore history
 * @param {number} dir -1 (undo), 0, 1 (redo)
 */
function restore_history(dir) {
    let y_copy = y_states[y_index + dir];
    if (!y_copy)
        return;
    y_index += dir;
    let data = ParseJSON(y_copy);
    if (!IsObject(data))
        return;

    Assign(Y, /** @type {!Object} */(data));
    import_settings(data, true);
}

/**
 * Make sure there is no garbage data
 */
function sanitise_data() {
    // convert string to number
    Keys(DEFAULTS).forEach(key => {
        let value = Y[key];
        if (!IsString(value))
            return;

        let def = DEFAULTS[key],
            type = TYPES[key];

        if (type == 'f')
            Y[key] = DefaultFloat(value, def);
        // new: allow int to be string sometimes
        else if (type == 'i')
            Y[key] = DefaultInt(value, value);
    });

    if (virtual_sanitise_data_special)
        virtual_sanitise_data_special();
}

/**
 * Save a Y value + to Local Storage if different from default, otherwise removes it
 * @param {string} name
 * @param {*=} value value for the name, undefined to save Y[name]
 */
function save_default(name, value) {
    if (value === undefined) {
        value = Y[name];
        if (value === undefined) {
            value = DEFAULTS[name];
            Y[name] = value;
        }
    }
    else
        Y[name] = value;
    if (value == DEFAULTS[name])
        remove_storage(name);
    else
        save_storage(name, value);
}

/**
 * Save a Y value + to Local Storage
 * @param {string} name
 * @param {*=} value value for the name, undefined to save Y[name]
 */
function save_option(name, value) {
    if (value === undefined)
        value = Y[name];
    else
        Y[name] = value;
    save_storage(name, value);
}

/**
 * Local Storage - save a value
 * - true is converted to 1
 * - false and undefined are converted to 0
 * @param {string} name
 * @param {*} value value for the name
 */
function save_storage(name, value) {
    if (IsObject(value))
        value = Stringify(value);
    else if (value === true)
        value = 1;
    else if (value === false || value === undefined)
        value = 0;

    localStorage.setItem(`${__PREFIX}${name}`, value);
}

/**
 * Show/hide popup
 * @param {string=} name
 * @param {?(boolean|string)=} show
 * @param {Object} obj
 * @param {boolean=} obj.adjust only change its position
 * @param {number=} obj.bar_x width of the scrollbar
 * @param {boolean=} obj.center place the popup in the center of the screen
 * @param {string=} obj.class_ extra class
 * @param {number=} obj.event 0 to disable set_modal_events
 * @param {string=} obj.html 0 to skip => keep the current HTML
 * @param {string=} obj.id id of the element that us used for adjust
 * @param {boolean=} obj.instant popup appears instantly
 * @param {number=} obj.margin_y
 * @param {number=} obj.offset mouse offset from the popup
 * @param {string=} obj.node_id popup id
 * @param {boolean=} obj.overlay dark overlay is used behind the popup
 * @param {string=} obj.setting
 * @param {number=} obj.shadow 0:none, 1:normal, 2:light
 * @param {Node=} obj.target element that was clicked
 * @param {Array<number>=} obj.xy
 */
function show_popup(name, show, {
        adjust, bar_x=20, center, class_, event=1, html='', id, instant=true, margin_y=0, node_id, offset=[0, 0],
        overlay, setting, shadow=1, target, xy}={}) {
    // remove the red rectangle
    if (!adjust)
        set_draggable();
    else if (device.iphone)
        return;

    // if clicked on home-form => make sure to reset click_target
    let is_toggle = (show == 'toggle');
    if (is_toggle || show == undefined)
        click_target = null;

    // find the modal
    let node = click_target || CacheId(node_id || 'modal');
    if (!node)
        return;

    let dataset = node.dataset,
        data_id = dataset['id'],
        data_name = dataset['name'],
        is_modal = (node.id == 'modal'),
        popup_adjust = POPUP_ADJUSTS[name] || POPUP_ADJUSTS[data_id || data_name];
    if (adjust && !popup_adjust)
        adjust = false;
    if (center == undefined)
        center = dataset['center'] || '';

    // smart toggle
    if (is_toggle)
        show = (data_id != (id || name) || !HasClass(node, 'popup-show') || (xy && xy + '' != dataset['xy']));

    if (!adjust && overlay != undefined)
        S(CacheId('overlay'), show && overlay);

    if (!adjust && is_modal) {
        let node2 = CacheId('modal2');
        Style(node2, [['display', show? 'block': 'none']]);
    }

    if (show || adjust) {
        let px = 0,
            py = 0,
            win_x = VisibleWidth() - 8,
            win_y = VisibleHeight(),
            x = 0,
            x2 = 0,
            y = 0,
            y2 = 0;

        if (show)
            click_target = Parent(target, {class_: 'popup', self: true});

        // create the html
        switch (name) {
        case 'options':
            if (!xy)
                context_target = null;
            html = show_settings(setting, {xy: xy});
            break;
        default:
            let link = LINKS[name];
            if (link)
                html = create_url_list(LINKS[name]);
            break;
        }

        if (show) {
            destroy_popup(node, 2);
            if (html !== 0)
                HTML(node, html);
            // focus?
            let focus = _('[data-f]', node);
            if (focus)
                focus.focus();
        }
        else {
            id = data_id;
            name = data_name;
        }

        Class(node, 'settings', !!(name == 'options' && (adjust || setting)));
        translate_nodes(node);
        update_svg();

        if (is_modal) {
            // make sure the popup remains inside the window
            let height = node.clientHeight,
                width = node.clientWidth;

            // center?
            if (center) {
                x = win_x / 2 - width / 2;
                y = win_y / 2 - height / 2;
            }
            else {
                let target = CacheId(id),
                    rect = target? target.getBoundingClientRect(): null;

                // align the popup with the target, if any
                if (adjust) {
                    // &1:adjust &2:top &4:right &8:bottom &16:left & 32:vcenter &64:hcenter
                    if (rect && popup_adjust > 1) {
                        if (popup_adjust & 2)
                            y = rect.top;
                        if (popup_adjust & 4)
                            x = rect.right;
                        if (popup_adjust & 8)
                            y = rect.bottom;
                        if (popup_adjust & 16)
                            x = rect.left;
                        if (popup_adjust & 32)
                            y = (rect.top + rect.bottom) / 2;
                        if (popup_adjust & 64)
                            x = (rect.left + rect.right) / 2;
                        xy = [x, y];
                    }
                    else if (!xy) {
                        let item = dataset['xy'];
                        if (item)
                            xy = item.split(',').map(item => item * 1);
                    }

                    let data_margin = dataset['my'];
                    if (data_margin)
                        margin_y = data_margin * 1;
                }

                // xy[2] => can align to the rect.right
                if (xy) {
                    x = xy[0];
                    y = xy[1];
                    x2 = xy[2] || x;
                    y2 = xy[3] || y;
                }
                else if (name && !px && rect)
                    [x, y, x2, y2] = [rect.left, rect.bottom, rect.right, rect.top];
            }

            x += offset[0];
            y += offset[1];

            // align left doesn't work => try align right, and if not then center
            if (x + width > win_x - bar_x) {
                if (x2 >= win_x - bar_x)
                    x2 = win_x - bar_x;

                if (x2 - width > 0) {
                    px = -100;
                    x = Max(0, x2 - offset[0]);
                }
                else {
                    px = -50;
                    x = Max(0, win_x / 2 - offset[0]);
                }
            }
            // same for y
            if (y + height + margin_y > win_y) {
                if (y2 >= win_y - 1)
                    y2 = win_y - 1;

                if (y2 < win_y && y2 - height > 0) {
                    py = -100;
                    y = Max(0, y2 - offset[1]);
                }
                else {
                    py = -50;
                    y = Max(0, win_y / 2 - offset[1]);
                }
            }

            dataset['center'] = center || '';
            dataset['my'] = margin_y || '';
            dataset['xy'] = xy || '';
            x += full_scroll.x;
            y += full_scroll.y;
            Style(node, [['transform', `translate(${px}%, ${py}%) translate(${x}px, ${y}px)`]]);
        }
    }

    if (!adjust) {
        if (is_modal) {
            if (instant != undefined)
                Class(node, 'instant', instant);

            // update classes
            let removes = [...popup_classes].filter(item => item != class_).map(item => ` -${item}`).join(''),
                sclass = class_? ` ${class_}`: '';
            Class(node, `popup-show popup-enable${sclass}${removes}`, !!show);
            if (class_)
                popup_classes.add(class_);

            // remember which popup it is, so if we click again on the same id => it closes it
            dataset['id'] = show? (id || ''): '';
            dataset['name'] = show? name: '';
            if (!show)
                destroy_popup(node, 3);
        }
        if (show) {
            dataset['ev'] = event;
            let height = 'unset',
                width = 'unset';
            if (popup_adjust) {
                if (popup_adjust & 128)
                    height = '100%';
                if (popup_adjust & 256)
                    width = '100%';
            }
            Style(node, [['height', height], ['width', width]]);

            // shadow
            Class(node, `${shadow == 0? '': '-'}shadow0 ${shadow == 2? '': '-'}shadow2`);
        }
        else {
            dataset['center'] = '';
            dataset['my'] = '';
            dataset['xy'] = '';
        }

        set_modal_events(node);
        Show(node);
    }
}

/**
 * Show a settings page
 * @param {string} name
 * @param {Object} obj
 * @param {number=} obj.flag &1:title &2:OK
 * @param {string=} obj.grid_class
 * @param {string=} obj.item_class
 * @param {string=} obj.title
 * @param {boolean=} obj.unique true if the dialog comes from a contextual popup, otherwise from main options
 * @param {boolean=} obj.xy
 * @returns {string} html
 */
function show_settings(name, {flag, grid_class='options', item_class='item', title, unique, xy}={}) {
    let settings = name? (X_SETTINGS[name] || []): X_SETTINGS,
        class_ = settings['_class'] || '',
        keys = Keys(settings),
        lines = [`<grid class="${grid_class}${class_? ' ': ''}${class_}">`],
        parent_id = get_drop_id(context_target).id,
        prefix = settings['_prefix'],
        split = settings['_split'],
        suffix = settings['_suffix'];

    flag = /** @type {number} */(Undefined(flag, settings['_flag']) || 0);

    // set multiple columns
    if (split) {
        let new_keys = [],
            offset = split;
        keys = keys.filter(key => (key != '_split' && !settings[key]['_pop']));

        for (let i = 0; i < split; i ++) {
            new_keys.push(keys[i]);
            if (keys[i][0] == '_')
                new_keys.push('');
            else {
                new_keys.push(keys[offset] || '');
                offset ++;
            }
        }
        keys = new_keys;
    }

    if (!(flag & 1)) {
        if (parent_id)
            lines.push(`<div class="item2 span" data-set="-1">${parent_id}</div>`);
        else if (name) {
            if (!title)
                title = settings['_title'] || `${Title(name).replace(/_/g, ' ')}${settings['_same']? '': ' options'}`;
            lines.push(
                `<div class="item-title span" data-set="${unique? -1: ''}" data-n="${name}" data-t="${title}"></div>`);
        }
    }

    keys.forEach(key => {
        if (!key && split) {
            lines.push('<div></div>');
            return;
        }

        // only in popup
        let setting = settings[key];
        if (setting['_pop'])
            return;

        // extra _keys: class, color, flag, on, span, value
        let sclass = setting['_class'],
            scolor = setting['_color'],
            sextra = setting['_extra'],
            sflag = setting['_flag'],
            sid = setting['_id'],
            slabel = setting['_label'],
            smain = setting['_main'],                   // use the main key
            smulti = setting['_multi'],
            son = setting['_on'],
            sset = setting['_set'],
            sspan = setting['_span'],
            ssvg = setting['_svg'],
            ssyn = setting['_syn'] || '',               // ~2
            stitle = setting['_title'],
            svalue = setting['_value'];
        if (sflag && sflag & flag)
            return;
        if (son && !son())
            return;
        if (svalue != undefined)
            setting = svalue;

        // separator
        if (key[0] == '_') {
            if (parseInt(key[1], 10))
                lines.push(`<hr${split? '': ' class="span"'}>`);
            return;
        }

        // link or list
        let clean = key,
            data = setting[0],
            fourth = setting[4],
            is_string = IsString(data)? ` name="${key}"`: '',
            more_class = (split || (data && !is_string) || smulti)? '': ' span',
            more_data = data? '': ` data-set="${sset || key}"`,
            string_digit = is_string? data * 1: 0,
            third = setting[3],
            title = setting[2] || stitle,
            y_key = Y[key];

        // only in popup2?
        if (!xy && (string_digit & 4))
            return;

        if (sclass)
            more_class = ` ${sclass}`;
        else if (sspan)
            more_class = ' item-title span';
        sid = sid? ` data-id="${sid}"`: '';

        if (IsFunction(third) && !third())
            return;
        if (IsFunction(fourth))
            y_key = fourth();

        // only contextual actions?
        if (title && title[0] == '!') {
            if (!parent_id)
                return;
            title = title.slice(1);
        }

        // remove prefix and suffix
        if (clean.length == 2 && IsDigit(clean[1]))
            clean = '';
        else {
            if (suffix && clean.slice(-suffix.length) == suffix)
                clean = clean.slice(0, -suffix.length);
            if (prefix && clean.slice(0, prefix.length) == prefix)
                clean = clean.slice(prefix.length);
        }

        // TODO: improve that part, it can be customised better
        if (string_digit & 2)
            scolor = '#f00';
        let label = slabel? slabel: `${Title(clean).replace(/_/g, ' ')}${ssyn}`,
            style = scolor? `${(Y['theme'] == 'dark')? ' class="tshadow"': ''} style="color:${scolor}"`: '',
            title2 = title? `data-t="${title}" data-t2="title"`: '';

        // price [min/max]
        if (sextra) {
            if (!sextra.includes('{'))
                sextra = `{${sextra}}`;
            label = `{${label}} [<i class='nowrap'>${sextra}</i>]`;
        }

        if (!smulti || !sclass || !sclass.includes('span')) {
            lines.push(
                `<a${is_string} class="${item_class}${more_class}${title === 0? ' off': ''}"${more_data}${title2}>`
                    + (ssvg? `<i class="icon" data-svg="${ssvg}"></i>`: '')
                    + `<i${sid} data-t="${label}"${style}></i>`
                    + ((setting == '')? ' ...': '')
                + '</a>'
            );
        }

        if (is_string)
            return;

        // multi data? ex: center min-max
        let datas = smulti? setting: {[key]: data},
            id = -1,
            main_key = key;

        Keys(datas).forEach(key => {
            // a) get data info
            let data = datas[key];
            if (!data || key[0] == '_')
                return;
            id ++;

            // multi
            if (smulti) {
                title = data[2];
                third = data[3];
                fourth = data[4];
                data = data[0] || data || {};
                data['class'] = `multi${smulti}`;
                y_key = Y[key];

                if (IsFunction(third) && !third())
                    return;
                if (IsFunction(fourth))
                    y_key = fourth();
            }

            // b) create element
            let iclass = sclass? ` ${sclass}`: '';

            if (IsArray(data)) {
                if (data == ON_OFF)
                    lines.push(
                        `<vert class="fcenter fastart${iclass}">`
                            + `<input name="${key}" type="checkbox" ${y_key? 'checked': ''}>`
                        + '</vert>'
                    );
                else
                    lines.push(
                        `<vert class="fcenter${iclass}">`
                        + `<select name="${key}">`
                            + data.map(option => {
                                let splits = (option + '').split('='),
                                    value = Undefined({'off': 0, 'on': 1}[option], option);
                                if (splits.length > 1) {
                                    option = splits[1];
                                    value = splits[0];
                                }
                                let selected = (y_key == value)? ' selected': '';
                                return `<option value="${value}"${selected} data-t="${option}"></option>`;
                            }).join('')
                        + '</select>'
                        + '</vert>'
                    );
                return;
            }

            let auto = data.auto || '',
                class_ = data['class'] || '',
                focus = data.focus || '',
                holder = data.text || '',
                type = data.type || '';
            class_ = ` class="setting${class_? ' ': ''}${class_}"`;
            if (focus)
                focus = ` data-f="${focus}"`;

            // title
            title = title || data.title;
            if (title)
                title = ` title="${translate_expression(title)}"`;

            if (id == 0)
                lines.push(smulti? `<hori class="faround${iclass}">`: `<vert class="fcenter${iclass}">`);

            // c) placeholder + autocomplete
            if (holder)
                holder = ` data-t="${data.text}" data-t2="placeholder"`;
            if (auto)
                auto = ` autocomplete="${auto}"`;

            let found = true;
            switch (type) {
            case 'area':
                lines.push(`<textarea name="${key}"${class_}${holder}${auto}${focus}${title}>${y_key}</textarea>`);
                break;
            case 'info':
            case 'upper':
                lines.push(`<div class="${type}" name="${key}" data-t="${data.text || ''}${title}"></div>`);
                break;
            case 'link':
                if (data.text)
                    lines.push(`<input name="${key}" type="text"${class_}${holder} value=""${focus}${title}>`);
                lines.push('<label for="file" data-t="Choose file"></label>');
                Attrs(CacheId('file'), {'data-x': key});
                break;
            case 'list':
                lines.push([
                    '<hori class="w100">',
                    data.list.map(item => {
                        let parts = item.split('='),
                            name = parts[0],
                            title = parts[1]? ` title="${name}"`: '';
                        return `<a class="item item3" name="${key}_${name}"${title} data-t="${parts[1] || name}"></a>`;
                    }).join(''),
                    '</hori>',
                ].join(''));
                break;
            case 'number':
                lines.push(`<input name="${key}" type="${type}"${class_} min="${data.min}" max="${data.max}" step="${data.step || 1}"${holder} value="${y_key}"${focus}${title}>`);
                break;
            default:
                found = false;
            }

            if (found) {
            }
            else if (type)
                lines.push(`<input name="${key}" type="${type}"${class_}${holder}${auto} value="${y_key}"${focus}${title}>`);
            // dictionary / string
            else {
                let keys = Keys(data).filter(item => item[0] != '_' && item != 'class');
                if (keys.length) {
                    lines.push(
                        `<select name="${key}"${focus}>`
                            + Keys(data).map(value => {
                                let option = data[value],
                                    selected = (Y[key] == value)? ' selected': '';
                                return `<option value="${value}"${selected} data-t="${option}"></option>`;
                            }).join('')
                        + '</select>'
                    );
                }
                // string
                else {
                    let class_ = item_class,
                        iname = key;
                    if (data['_class'])
                        class_ = `${class_} ${data['_class']}`;
                    if (smain)
                        iname = `${main_key}_${iname}`;
                    lines.push(`<a class="${class_}" name="${iname}" data-t="${Title(key).replace(/_/g, ' ')}"></a>`);
                }
            }

            if (!smulti || id == smulti - 1)
                lines.push(smulti? '</hori>': '</vert>');
        });
    });

    // -1 to close the popup
    if (!(flag & 2)) {
        if (parent_id && !(flag & 4) && (Y['join_next'] || Y['drag_and_drop'])) {
            let context_area = context_areas[parent_id] || {};
            lines.push(
                `<hori class="span">`
                    + `<div class="item2" data-set="-1" data-t="ok"></div>`
                    + `<div class="item2${context_area[1]? ' active': ''}" data-t="join next"></div>`
                    + `<div class="item2" data-t="hide"></div>`
                + '</hori>'
            );
        }
        else if (name)
            lines.push(
                `<a class="item item-title span" data-set="-1" data-t="${settings['_cancel']? 'CANCEL': 'OK'}"></a>`);
    }

    lines.push('</grid>');
    return lines.join('');
}

// TRANSLATIONS
///////////////

/**
 * Resize text if it's too long
 * @param {string} text
 * @param {number} resize maximum size
 * @param {string=} class_ class to use
 * @returns {string} the resized text
 */
function resize_text(text, resize, class_='resize') {
    if (!text || resize < 1)
        return text;

    let len;
    if (IsString(text)) {
        len = text.length;
        if (Upper(text) == text)
            len *= 4/3;
        else if (text.includes('='))
            len += 0.5;
    }
    else {
        text += '';
        len = text.length;
    }

    if (len > resize)
        text = `<span class="${class_}">${text}</span>`;
    return text;
}

/**
 * Set the text of a node and update its data-t
 * @param {string|Node} node CSS selector or node
 * @param {string} text
 */
function set_text(node, text) {
    Attrs(node, {'data-t': text});
    TextHTML(node, translate_expression(text));
}

/**
 * Translate a text, return null if not found
 * @param {string} text
 * @returns {string|null} translated text
 */
function translate(text) {
    if (!text)
        return text;
    if (DEV['translate'])
        TRANSLATES[text] = '';

    if (Y['language'] == 'eng')
        return text.includes('{')? null: text.split('~')[0];

    // mode
    if (!translates)
        return text;
    let result = translates[text];
    if (result)
        return result;

    let lower = Lower(text);
    if (lower == text)
        return null;

    result = translates[lower];
    if (!result)
        return null;

    // MODE
    if (text == Upper(text))
        return Upper(result);

    // Mode
    if (text[0] == Upper(text[0]))
        return Title(result);
    return null;
}

/**
 * Translate a text, defaults to itself
 * @param {string} text
 * @returns {string|null} translated text
 */
function translate_default(text) {
    return translate(text) || text;
}

/**
 * Translate an expression
 * @param {string} text
 * @returns {string} translated text
 */
function translate_expression(text) {
    if (!text)
        return '';

    // 1) try a direct translation
    let result = translate(text);
    if (result)
        text = result;
    // 2) translate {...}
    else if (text.includes('{'))
        text = text.replace(/{(.*?)}/g, (_match, p1) => translate_default(p1));

    // 3) translate [...]
    if (text.includes('['))
        text = text.replace(/\[(.*?)\]/g, (_match, p1) => TRANSLATE_SPECIALS[p1] || `[${p1}]`);

    // 4) Animations|geschwindigkeit
    if (text.includes('|')) {
        let middle = text.split('|').map(part => `<i class="nowrap">${part}</i>`).join('');
        text = `<i class="breakall">${middle}</i>`;
    }
    return text;
}

/**
 * Translate a single node
 * - resolve all data-t, data-t2=target, data-tr=resize
 * @param {Node=} node
 */
function translate_node(node) {
    // 1) skip?
    if (!node)
        return;
    let text = node.dataset['t'];
    if (text == undefined)
        return;

    // 2) translate
    let tag = node.tagName,
        target = node.dataset['t2'],
        translated = translate_expression(text);

    if (!target)
        if (tag == 'INPUT')
            target = 'value';
        else if (tag == 'IMG')
            target = 'title';

    if (target)
        node.setAttribute(target, translated);
    else {
        let resize = node.dataset['tr'];
        if (resize)
            translated = resize_text(translated, parseInt(resize, 10));
        TextHTML(node, translated);
    }
}

/**
 * Translate nodes
 * - resolve all data-t, data-t2=target, data-tr=resize
 * @param {string|Node?} parent CSS selector or node
 */
function translate_nodes(parent) {
    parent = _(parent);
    if (!parent)
        return;
    E('[data-t]', translate_node, parent);
    translate_node(parent);
}

// NODES
////////

/**
 * Create a canvas for a texture
 * @param {number} width
 * @param {number=} height
 * @returns {!Object}
 */
function create_canvas(width, height) {
    let canvas = document.createElement('canvas'),
        ctx = canvas.getContext('2d');

    canvas.width = width;
    canvas.height = height || width;
    return ctx;
}

/**
 * Create an SVG icon
 * @param {string} name
 * @returns {string}
 */
function create_svg_icon(name) {
    let image = ICONS[name.split(' ')[0]];
    if (!image)
        return '';
    // VB=viewBox=; PFC=path fill="currentColor"
    image = image.replace('VB=', 'viewBox=').replace('PFC', 'path fill="currentColor"');
    return `<svg class="svg ${name}" xmlns="${NAMESPACE_SVG}" ${image}</svg>`;
}

/**
 * Fill a combo filter
 * @param {string?} letter, ex: m=mode, v=view ... or a selector; null => get the HTML
 * @param {Array<string>|Object<string, string>=} values list of values for the combo, default to [DEFAULTS[letter]]
 * @param {string=} select the value to be selected, default to Y[letter]
 * @param {Object=} dico used to name the values, ex: 01 => cheater
 * @param {boolean=} no_translate don't translate the options
 * @returns {string} the selected value, or the HTML
 */
function fill_combo(letter, values, select, dico, no_translate) {
    dico = Undefined(dico, {});

    if (letter != null) {
        if (values == null)
            values = [DEFAULTS[letter]];
        if (select == null)
            select = Y[letter];
    }

    // {be: 'Belgium', fr: 'France'}
    if (!IsArray(values) && IsObject(values)) {
        dico = /** @type {!Object} */(values);
        values = Keys(dico);
    }

    let found = 'all',
        group = false,
        lines = [];

    for (let value_ of /** @type {!Array<string|number>} */(values)) {
        let selected,
            items = (value_ + '').split('='),
            text = items.slice(-1)[0],
            value = Lower(items.slice(-2)[0]);

        if (value.slice(0, 2) == '* ') {
            if (group) lines.push('</optgroup>');
            group = true;
            lines.push(`<optgroup data-t="${text.slice(2)}" data-t2="label">`);
            continue;
        }

        if (select == value.split('|')[0]) {
            selected = ' selected="selected"';
            found = value;
        }
        else
            selected = '';

        // 'name of event|extra|info' => 'name of event'
        text = text.split('|')[0];
        // rename using dico or custom function
        if (items.length < 2) {
            text = dico[text] || text;
            if (virtual_rename_option)
                text = virtual_rename_option(value, text);
        }

        // parent:child => {parent}: {child}
        let splits = text.split(':');
        if (splits.length > 1)
            text = `{${splits[0]}}: {${splits[1]}}`;

        if (no_translate)
            lines.push(`<option value="${value}"${selected}>${text}</option>`);
        else
            lines.push(`<option value="${value}"${selected} data-t="${text}"></option>`);
    }
    if (group)
        lines.push('</optgroup>');

    if (letter == null)
        return lines.join('');

    // set the HTML: 1 letter => #co+letter, otherwise letter is a selector
    if (letter) {
        let sel = letter_selector(letter);
        HTML(sel, lines.join(''));
        translate_nodes(sel);
    }
    return found.split('|')[0];
}

/**
 * Get the selector for a single letter
 * + letter is a selector if it has more than 1 letter
 * @param {string} letter
 * @returns {string} CSS selector
 */
function letter_selector(letter) {
    if (letter.length == 1)
        letter = `#co${letter}`;
    return letter;
}

/**
 * Set a combo value
 * @param {string} letter combo letter: g, m, t, c, f + special cases: n, o, s
 * @param {string} value
 * @param {boolean|string=} save in memory, if string: use this for saving, ex: #classes => class
 */
function set_combo_value(letter, value, save=true) {
    // n, o, s special cases
    if (virtual_set_combo_special && !virtual_set_combo_special(letter, value)) {
        let combo = _(letter_selector(letter)),
            index = 0;
        if (!combo)
            return;

        for (let option of combo.options) {
            if (option.value.split('|')[0] == value) {
                combo.selectedIndex = index;
                break;
            }
            index ++;
        }
    }

    // save in memory
    if (save) {
        if (IsString(save))
            letter = /** @type {string} */(save);

        if (Y[letter] !== value) {
            Y[letter] = value;
            // filter changed => go back to page 1
            Y.skip = 0;
        }
        save_storage(letter, value);
    }
}

/**
 * Update the theme
 * @param {Array<string>=} themes if null, will use Y.theme
 * @param {Function=} callback
 * @param {number=} version CSS version, use Now() to force reload
 * @returns {boolean} true if the theme was changed
 */
function update_theme(themes, callback, version=1) {
    let parent = CacheId('extra-style');
    if (!parent)
        return false;
    if (!themes)
        themes = [Y['theme']];

    // default theme is skipped because it's already loaded
    if (themes[0] == THEMES[0])
        themes = themes.slice(1);

    let changes = 0,
        children = A('link', parent),
        links = themes.map(theme => `css/${theme}.css?v=${version}`),
        num_child = children.length,
        num_theme = themes.length,
        min = Min(num_child, num_theme);

    // 1) replace existing links
    for (let i = 0; i < min; i ++) {
        let child = children[i],
            base_href = child.href.split('/').slice(-1)[0].split('.')[0],
            theme = themes[i];

        if (base_href != theme) {
            child.setAttribute('href', links[i]);
            changes ++;
        }
    }

    // 2) remove extra links
    if (num_child > num_theme) {
        changes ++;
        for (let i = num_theme; i < num_child; i ++)
            children[i].removeAttribute('href');
    }
    // 3) add extra links
    else if (num_child < num_theme) {
        changes ++;
        for (let i = num_child; i < num_theme; i ++) {
            let child = CreateNode('link', null, {'href': links[i], rel: 'stylesheet'});
            parent.appendChild(child);
        }
    }

    if (!changes)
        return false;

    // post-process
    update_svg();
    if (callback)
        callback();
    return true;
}

/**
 * Resolve the SVG
 * @param {Node=} parent
 */
function update_svg(parent) {
    E('[data-svg]', node => {
        let name = node.dataset['svg'],
            image = create_svg_icon(name);
        if (image) {
            HTML(node, image);
            delete node.dataset['svg'];
        }
    }, parent);
}

// BROWSER
//////////

/**
 * Check the query hash/string
 * @param {boolean=} no_special
 */
function check_hash(no_special) {
    let string = /** @type {!Object} */(QueryString({key: 'hash'})),
        dico = Assign({}, ...Keys(string).map(key => ({[key]: (string[key] == 'undefined')? undefined: string[key]})));
    Assign(Y, dico);
    sanitise_data();
    parse_dev();

    // section
    if (dico['x'] != undefined)
        set_section(dico['x']);

    if (!no_special && virtual_check_hash_special)
        virtual_check_hash_special(dico);
}

/**
 * Detect the device
 */
function detect_device() {
    let agent = navigator.userAgent || navigator.vendor || window.opera,
        mobile = false,
        os = '?';

    if (/windows phone/i.test(agent))
        os = 'windows';
    else if (/android/i.test(agent))
        os = 'android';
    else if (/iPad|iPhone|iPod/.test(agent) && !window.MSStream)
        os = 'ios';

    if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|ipad|iris|kindle|Android|Silk|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(agent))
        mobile = true;

    device.iphone = mobile && (os == 'ios');
    device.os = os;
    device.mobile = mobile;
}

/**
 * Guess the browser language
 */
function guess_browser_language() {
    let indices = Assign({}, ...Keys(LANGUAGES).map(lan => ({[lan.slice(0, 2)]: lan}))),
        languages = [...[navigator.language], ...(navigator.languages || [])];
    Assign(indices, LANGUAGES_23);

    for (let lan of languages) {
        lan = lan.split('-')[0];
        let index = indices[lan];
        if (!index)
            continue;

        if (!Y['language'])
            Y['language'] = index;
        DEFAULTS['language'] = index;
        break;
    }
}

/**
 * Check if the browser is in full screen mode
 * @returns {Node}
 */
function is_fullscreen() {
    let full = document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement;
    full_target = full? CacheId('body'): null;
    return full;
}

/**
 * Load a library only once
 * @param {string} url
 * @param {Function=} callback
 * @param {Object=} extra
 */
function load_library(url, callback, extra) {
    if (!libraries[url])
        LoadLibrary(url, () => {
            if (DEV['load'])
                LS(`loaded: ${url}`);
            libraries[url] = Now();
            if (callback)
                callback();
        }, extra);
    else
        LS(`already loaded: ${url}`);
}

/**
 * Push history state if it changed
 * @param {Object=} query
 * @param {boolean=} replace replace the state instead of pushing it
 * @param {string=} query_key
 * @param {string=} go change URL location
 * @returns {Object} dictionary of changes, or null if empty
 */
function push_state(query, replace, query_key='hash', go=undefined) {
    query = query || {};
    let changes = [],
        state_keys = STATE_KEYS[y_x] || STATE_KEYS['_'] || [],
        new_state = Assign({}, ...state_keys.filter(x => query[x] || Y[x]).map(x =>
            ({[x]: Undefined(query[x], Y[x])})
        )),
        state = history.state,
        url = QueryString({key: null, replace: new_state, string: true});

    // state didn't change => return
    if (state) {
        changes = state_keys.filter(key => (new_state[key] !== state[key]));
        if (!changes.length)
            return null;
    }

    if (go)
        location[go] = url;
    else {
        url = `${QUERY_KEYS[query_key]}${url}`;
        let exist = location[query_key];
        if (exist == url)
            return null;
        if (replace)
            history.replaceState(new_state, '', url);
        else
            history.pushState(new_state, '', url);
    }

    return Assign({}, ...changes.map(change => ({[change]: 1})));
}

/**
 * Change mouse cursor
 * @param {string} cursor
 */
function set_cursor(cursor='') {
    if (!device.mobile)
        document.body.style.cursor = cursor;
}

/**
 * Toggle full screen mode
 * @param {Function=} callback
 */
function toggle_fullscreen(callback) {
    let full = is_fullscreen();
    if (full) {
        let exit = document.exitFullscreen || document.webkitExitFullscreen || document.mozCancelFullScreen;
        if (exit)
            exit.call(document);
    }
    else {
        let body = document.body,
            enter = body.requestFullscreen || body.webkitRequestFullScreen || body.mozRequestFullScreen;
        if (enter)
            enter.call(body);
    }

    if (callback)
        callback(full);
}

// SOCKETS
//////////

/**
 * Check sockets: ping + reconnection
 */
function check_sockets() {
    add_timeout('ws', () => {
        let now = Now(true);
        if (now < pong + 15)
            return;

        let ready = socket? socket.readyState: WS.CLOSED;
        if (ready == WS.OPEN) {
            socket.send(Uint8Array.of(0));
            if (DEV['socket'])
                LS('ping');
            ping = now;
        }
        else if (ready == WS.CLOSED)
            init_websockets();
    }, 8000, true);
}

/**
 * Initialise websockets
 */
function init_websockets() {
    if (socket && socket.readyState <= WS.OPEN)
        return;
    if (DEV['socket'])
        LS('init websockets');

    socket = new WS(`ws${location.protocol == 'https:'? 's': ''}://${location.host}/api/`);
    socket.binaryType = 'arraybuffer';

    // reconnect when closed
    socket.onclose = () => {
        socket = null;
        socket_error(`socket close: ${Now(true)}`);
    };
    socket.onopen = () => {
        socket_fail = 0;
        if (virtual_socket_open)
            virtual_socket_open();
    };
    socket.onmessage = message => {
        pong = Now(true);
        let vector = new Uint8Array(message.data);
        if (vector[0] == 0) {
            if (DEV['socket'])
                LS(`pong: ${pong - ping}`);
        }
        else if (virtual_socket_message)
            virtual_socket_message(message);
    };

    check_sockets();
}

/**
 * Socket error
 * @param {string} text
 */
function socket_error(text) {
    LS(text);
    socket_fail ++;
    if (socket_fail > 3 && virtual_logout)
        virtual_logout();
    else
        add_timeout('socket_init', init_websockets, Pow(socket_fail, 2) * 1000);
}

/**
 * Send data to a socket
 * @param {!Object} data
 * @returns {boolean?}
 */
function socket_send(data) {
    if (!socket || socket.readyState != WS.OPEN)
        return false;
    let success = null;
    try {
        socket.send(Stringify(data));
        success = true;
    }
    catch(error) {
        socket_error(`socket_send: ${Now()} : ${error}`);
    }
    return success;
}

// TOUCH
////////

/**
 * Add a touch move
 * @param {Vector2} change
 * @param {number} stamp
 * @param {number=} ratio_x
 * @param {number=} ratio_y
 * @returns {!Array<number>} deltas
 */
function add_move(change, stamp, ratio_x=1, ratio_y=1) {
    if (!drag)
        return [0, 0];
    let dx = (change.x - drag[0].x) * ratio_x,
        dy = (change.y - drag[0].y) * ratio_y;
    touch_moves.push([dx, dy, (stamp - drag[1])]);
    return [dx, dy];
}

/**
 * We cannot click just after a touch drop, as that would cause misclick events
 * @returns {boolean|Node}
 */
function cannot_click() {
    if (Now(true) < touch_done + TIMEOUT_touch)
        return true;
    let active = document.activeElement;
    if (active && {'INPUT': 1, 'TEXTAREA': 1}[active.tagName])
        return active;
    return false;
}

/**
 * Check if we can't right click to popup
 * @returns {boolean}
 */
function cannot_popup() {
    let is_control = KEYS[17],
        cannot = !Undefined(Y['popup_right_click'], 1) || is_control;
    if (cannot && is_control)
        KEYS[17] = 0;
    return cannot;
}

/**
 * Finished touching which means we cannot click for a bit
 * @param {number=} delta
 */
function done_touch(delta=0) {
    touch_done = Now(true) + delta;
}

/**
 * Get the parent area of a node
 * @param {Node} node
 * @returns {Node}
 */
function get_area(node) {
    return Parent(node, {class_: 'area'});
}

/**
 * Get the changed touches + stamp
 * @param {Event} e
 * @returns {!Array<Vector2>}
 */
function get_changed_touches(e) {
    let touches = e.changedTouches || e.touches;
    if (touches)
        touches = [...touches].map(touch => ({x: touch.clientX, y: touch.clientY}));
    else
        touches = [{x: e.clientX, y: e.clientY}];
    return touches;
}

/**
 * Render the inertial scrolling
 */
function render_scroll() {
    let ratio = Y['scroll_inertia'];
    if (!ratio)
        return;

    let now = Now(true),
        delta = Min(33, (now - touch_now) * 1000);

    touch_scroll.x -= touch_speed.x * delta;
    touch_scroll.y -= touch_speed.y * delta;
    if (full_target) {
        full_scroll.x -= touch_speed.x * delta;
        full_scroll.y -= touch_speed.y * delta;
    }
    set_scroll();

    if (Abs(touch_speed.x) > 0.03 || Abs(touch_speed.y) > 0.03) {
        touch_speed.x *= ratio;
        touch_speed.y *= ratio;
        animation = AnimationFrame(render_scroll);
    }
    touch_now = now;
}

/**
 * Adjust the scrolling to the nearest anchor (if near enough)
 * - can be used to scroll to a specific target
 * - can be used after mouse wheel
 * @param {string} target
 * @param {number=} max_delta
 * @param {number=} depth
 */
function scroll_adjust(target, max_delta, depth=0) {
    if (max_delta == undefined)
        max_delta = Y['wheel_adjust'];

    let keys = target? [target]: Keys(ANCHORS),
        max_allowed = 100,
        window_height = window.innerHeight,
        y = ScrollDocument(),
        y_old = y;

    if ((!y || y >= document.scrollingElement.offsetHeight - window_height) && !target)
        return;

    // 1) gather anchor data
    let deltas = keys.map(key => {
        let [flag, gap, priority] = ANCHORS[key] || [0, 0, 0],
            nodes = From(A(key)).filter(child => Visible(child));
        if (!nodes.length)
            return;

        let delta1, delta2,
            rect = nodes[0].getBoundingClientRect(),
            bottom = rect.bottom + y - gap - window_height,
            top = rect.top + y - gap;

        if (flag & 1) {
            delta1 = top - y;
            if (Abs(delta1) > max_allowed)
                return;
        }
        if (flag & 2) {
            delta2 = bottom - y;
            if (Abs(delta2) > max_allowed)
                return;
        }

        return [priority, key, delta1, delta2, top, bottom, gap];
    }).filter(vector => vector).sort((a, b) => {
        if (a[0] != b[0])
            return b[0] - a[0];
        return (b[2] || b[3]) - (a[2] || a[3]);
    });

    // 2) no anchors found => scroll to the target if any
    if (!deltas.length) {
        if (target) {
            y = Safe(target).getBoundingClientRect().top + y;
            ScrollDocument(y, true);
        }
        return;
    }

    // 3) get the closest matches
    let offset, y1, y2, y3,
        diff = max_delta,
        diff3 = diff;
    for (let [priority, key, delta1, delta2, top, bottom] of deltas) {
        if (DEV['ui'])
            LS(`${priority} : ${key} : ${delta1} : ${delta2} : ${top} : ${bottom}`);
        if (delta2 != undefined && Abs(delta2) < max_delta) {
            y2 = bottom;
            offset = -delta2;
        }
        if (delta1 != undefined) {
            if (offset) {
                delta1 += offset;
                if (delta1 < 0) {
                    if (delta1 > -max_delta && Abs(delta1) < Abs(diff3)) {
                        diff3 = delta1;
                        y3 = top;
                    }
                    continue;
                }
            }
            if (Abs(delta1) < Abs(diff)) {
                diff = delta1;
                y1 = top;
            }
        }
    }

    // 4) combine the best matches
    let combined = 0;
    if (y1 == undefined && y3 != undefined)
        y = y3;
    else {
        let ys = [y1, y2].filter(value => value != undefined);
        combined = ys.length;
        if (!combined)
            return;
        y = ys.reduce((a, b) => a + b) / ys.length;
    }
    ScrollDocument(y, true);

    // 5) adjust again?
    if (!target && depth < 1 && combined < 2) {
        let new_delta = max_delta - Abs(y - y_old);
        if (new_delta > 0)
            add_timeout('adjust', () => scroll_adjust(target, new_delta, depth + 1), TIMEOUT_adjust);
    }
}

/**
 * Set the scroll
 */
function set_scroll() {
    let node = drag_target || scroll_target;

    if (node) {
        // horizontal
        if (drag_scroll & 1) {
            node.scrollLeft = touch_scroll.x;
            touch_scroll.x = node.scrollLeft;
        }
        // vertical
        if (drag_scroll & 2) {
            ScrollDocument(touch_scroll.y);
            touch_scroll.y = ScrollDocument();
        }
    }

    if (full_target) {
        full_scroll.x = Clamp(full_scroll.x, 0, full_target.clientWidth - window.innerWidth);
        full_scroll.y = Clamp(full_scroll.y, 0, full_target.clientHeight - window.innerHeight);
        Style(full_target, [['transform', `translate(${-full_scroll.x}px,${-full_scroll.y}px)`]]);
    }
}

/**
 * Stop dragging
 */
function stop_drag() {
    drag = null;
    drag_moved = false;
    drag_scroll = 3;
    drag_target = null;
}

/**
 * Handle a touch/mouse event
 * @param {Event} e
 * @returns {{change:Vector2, error:number, stamp:number}}
 */
function touch_event(e) {
    let changes = get_changed_touches(e),
        change = changes[0],
        error = -1,
        length = changes.length,
        stamp = e.timeStamp;

    // multiple inputs => keep the one closer to the previous input
    if (length > 1) {
        if (drag) {
            let best_x = 0,
                best_y = 0;
            for (let touch of changes) {
                let dx = (touch.x - touch_last.x),
                    dy = (touch.y - touch_last.y),
                    delta = dx * dx + dy * dy;

                if (error < 0 || delta < error) {
                    error = delta;
                    best_x = touch.x;
                    best_y = touch.y;
                }
            }
            if (error >= 0)
                change = {x: best_x, y: best_y};
        }
        else {
            let total = [0, 0];
            for (let touch of changes) {
                total[0] += touch.x;
                total[1] += touch.y;
            }
            change = {x: total[0] / length, y: total[1] / length};
        }
    }
    else if (drag) {
        let dx = (change.x - touch_last.x),
            dy = (change.y - touch_last.y);
        error = dx * dx + dy * dy;
    }

    return {
        change: change,
        error: error,
        stamp: stamp,
    };
}

/**
 * Handle a touch event
 * - supports full screen scroll
 * @param {Event} e
 * @param {boolean=} full full screen scrolling
 * @param {boolean=} prevent_default
 */
function touch_handle(e, full, prevent_default) {
    if (full == undefined)
        full = !!is_fullscreen();

    let buttons = e.buttons,
        event = touch_event(e),
        change = event.change,
        stamp = event.stamp,
        target = e.target,
        type = e.type,
        type5 = type.slice(0, 5),
        is_start = TOUCH_STARTS[type];

    if (is_start) {
        let old_target = drag_target;
        stop_drag();
        if (type5 == 'mouse' && buttons != 1)
            return;
        // input => skip
        if (['INPUT', 'SELECT'].includes(target.tagName))
            return;
        // can only acquire a new target with a click
        if (type == 'mouseenter' && !old_target)
            return;

        clear_timeout('touch_end');

        drag_target = Parent(/** @type {Node} */(target), {class_: 'scroller', self: true, tag: 'div'});
        if (drag_target && !full_target) {
            // maybe the object is already fully visible?
            // TODO: limit x and y directions individually
            let child = drag_target.firstElementChild;
            if (child) {
                let child_height = child.clientHeight,
                    child_width = child.clientWidth;
                if (child_height <= drag_target.clientHeight && child_width <= drag_target.clientWidth)
                    return;
            }
        }

        drag = [change, stamp];
        drag_type = type5;
        touch_last = change;
        touch_moves.length = 0;
        touch_now = Now(true);
        touch_speed = {x: 0, y: 0};
        touch_start = touch_now;

        touch_scroll = {
            x: drag_target? drag_target.scrollLeft: 0,
            y: ScrollDocument(),
        };
    }
    else if (TOUCH_MOVES[type]) {
        if (!drag)
            return;
        // reset needed when we move the mouse outside the window, then come back
        if (type == 'mousemove' && !buttons) {
            stop_drag();
            return;
        }

        drag_moved = true;
        let [dx, dy] = add_move(change, stamp);
        touch_last = change;

        touch_scroll.x -= dx;
        touch_scroll.y -= dy;
        if (full_target) {
            full_scroll.x -= dx;
            full_scroll.y -= dy;
        }
        set_scroll();

        drag = [change, stamp];
        if (prevent_default && (e.cancelable != false || type5 != 'touch'))
            PD(e);
    }
    else if (TOUCH_ENDS[type]) {
        if (!drag || !drag_moved)
            return;

        add_move(change, stamp);

        // inertia during the last 100ms
        let sumx = 0,
            sumy = 0,
            time = 0;
        for (let [dx, dy, ms] of touch_moves.reverse()) {
            sumx += dx;
            sumy += dy;
            time += ms;
            if (time >= 100)
                break;
        }

        done_touch();
        touch_now = touch_done;
        let absx = Abs(sumx),
            absy = Abs(sumy),
            elapsed = touch_now - touch_start;

        // some movement => scroll
        if (absx > 1 || absy > 1) {
            scroll_target = drag_target;
            touch_speed = {x: sumx / time, y: sumy / time};

            if (virtual_drag_done)
                virtual_drag_done(sumx, sumy, touch_speed);

            cancel_animation();
            if (drag_target || full_target || scroll_target)
                animation = AnimationFrame(render_scroll);
        }
        // big movement or average duration => prevent click
        if (type != 'mouseleave') {
            drag = null;
            if (absx > 2 || absy > 2 || (elapsed > 0.3 && elapsed < 1))
                add_timeout('touch_end', stop_drag, 10);
            else
                stop_drag();
        }
    }

    SP(e);
}

/**
 * Handle a wheel event
 * @param {Event} e
 * @param {boolean=} full full screen scrolling
 */
function wheel_event(e, full) {
    if (full_target) {
        full_scroll.x -= e.wheelDeltaX / 3;
        full_scroll.y -= e.wheelDeltaY / 3;
    }
    if (!full) {
        scroll_target = window;
        touch_scroll.y -= e.wheelDeltaY / 3;
    }

    set_scroll();
    PD(e);
}

// UI
/////

/**
 * Activate tabs after populating the areas
 */
function activate_tabs() {
    E('.tabs', (node, id) => {
        let tabs = From(A('.tab', node)),
            actives = tabs.filter(node => HasClass(node, 'active'));

        // few tabs => show full label
        if (tabs.length < 4)
            for (let tab of tabs) {
                let dataset = tab.dataset;
                dataset['t'] = dataset['label'] || dataset['abbr'];
            }

        add_timeout(`active:${id}`, () => {
            virtual_click_tab(actives.length? actives[0]: tabs[0]);
        }, node.id == 'table-tabs'? TIMEOUT_activate: 0);
    });
}

/**
 * Add font + sizes
 * @param {string} font
 * @param {!Object} sizes sizes when font-size = 1280px
 */
function add_font(font, sizes) {
    let widths = /** @type {!Object} */(SetDefault(FONTS, font, {}));
    Assign(widths, sizes);
}

/**
 * Calculate the text width in px
 * @param {string} text
 * @param {string=} font
 * @returns {number}
 */
function calculate_text_width(text, font) {
    let default_width = FONTS[''][''],
        width = 0,
        widths = FONTS[font] || {};

    for (let char of text.split(''))
        width += widths[char] || widths[''] || default_width;
    return width;
}

/**
 * Create an array of pages
 * @param {number} num_page
 * @param {number} page
 * @param {number} extra
 * @returns {!Array<number>}
 */
function create_page_array(num_page, page, extra) {
    if (num_page < 2)
        return [2];

    let array = Array(num_page),
        left = extra + (page <= 1 || page >= num_page - 2) * 1;

    array.fill(0);
    array[1] = 1;
    array[num_page - 2] = 1;
    array[0] = 2;
    array[num_page - 1] = 2;
    array[page]= 2;

    let off = 1;
    for (let i = 0; i < num_page && left > 0; i ++) {
        let id = page + off;
        if (id >= 0 && id < num_page && !array[id]) {
            array[id] = 2;
            left --;
        }

        off = -off;
        if (off > 0)
            off ++;
    }

    if (array[2])
        array[1] = 2;
    if (array[num_page - 3])
        array[num_page - 2] = 2;
    return array;
}

/**
 * Create an URL list
 * @param {!Object} dico {key:value, ...}
 * - value is string => URL is created unless empty string
 * - otherwise insert separator
 * @returns {string}
 */
function create_url_list(dico) {
    if (!dico)
        return '';

    let ext, is_grid,
        html = Keys(dico).map(key => {
            let data = '',
                text = '',
                value = dico[key];

            // grid?
            if (key[0] == '_') {
                if (key == '_ext') {
                    ext = value;
                    return '';
                }

                let lines = is_grid? ['</grid>']: [];
                if (value)
                    lines.push(`<grid class="w100" style="grid-template-columns:repeat(${value}, 1fr)">`);
                is_grid = !!value;
                return lines.join('');
            }

            if (!IsString(value))
                return '<hr>';

            if (!value)
                return `<a class="item" data-id="${create_field_value(key)[0]}" data-t="${key}"></a>`;

            if (!'./'.includes(value[0]) && value.slice(0, 4) != 'http')
                value = `${HOST}/${value}`;

            if (ext && key.includes(ext))
                text = key.replace(ext, `<i class="ext">${ext}</i>`);
            else
                data = ` data-t="${key}"`;

            return `<a class="item" href="${value}" target="_blank"${data}>${text}</a>`;
        }).join('');

    if (is_grid)
        html += '</grid>';

    if (is_grid)
        html += '</grid>';

    return `<vert class="fastart">${html}</vert>`;
}

/**
 * Draw a rectangle around the node
 * @param {Node} node
 * @param {number=} orient &1:hori &2:vert
 * @param {number=} mx mouse x
 * @param {number=} my mouse y
 */
function draw_rectangle(node, orient, mx, my) {
    let rect_node = CacheId('rect');
    if (!node) {
        Hide(rect_node);
        return;
    }
    let rect = node.getBoundingClientRect(),
        w = rect.width,
        x = rect.left,
        y1 = Max(rect.top - 1, 0),
        y2 = Min(rect.top + rect.height, window.innerHeight);

    if (orient & 1) {
        if (mx > x + w / 2)
            x += w - 6;
        else
            x -= 6;
        w = 6;
    }
    if (orient & 2) {
        if (my > (y1 + y2) / 2)
            y1 = y2 - 6;
        else {
            y1 -= 6;
            y2 = y1 + 6;
        }
    }

    Style(rect_node, [['left', `${x}px`], ['height', `${y2 - y1}px`], ['top', `${y1}px`], ['width', `${w}px`]]);
    Show(rect_node);
}

/**
 * Find an element in areas
 * @param {string} name
 * @returns {{area: (Array<string|number>|undefined), id: number, key: (string|undefined)}}
 */
function find_area(name) {
    let areas = Y['areas'];
    for (let key of Keys(areas)) {
        let vector = areas[key];
        for (let i = 0; i < vector.length; i ++)
            if (vector[i][0] == name)
                return {area: vector[i], id: i, key: key};
    }
    return {id: -1};
}

/**
 * Get the drag and drop id
 * @param {Node|EventTarget} target
 * @returns {{id:string, node:Node?}}
 */
function get_drop_id(target) {
    let parent = Parent(/** @type {Node} */(target), {class_: 'drag|drop', self: true});
    return {
        id: parent? (parent.id || parent.dataset['x']): null,
        node: parent,
    };
}

/**
 * Move a pane left or right, swapping it with another
 * @param {Node} node
 * @param {number} dir <<[-3] <[-1] >[1] >>[3]
 */
function move_pane(node, dir) {
    // 1) gather pane info
    let areas = Y['areas'],
        index = -1,
        panes = Keys(PANES)
            .filter(pane => Y[`min_${pane}`] > 0 || Y[`max_${pane}`] > 0)
            .map((pane, id) => {
                if (pane == node.id)
                    index = id;
                return [pane, [...areas[`${pane}0`]]];
            }),
        num_pane = panes.length,
        orders = panes.map(pane => pane[0]);

    // 2) move pane, but skip if already where it should be
    if ((dir == -3 && !index) || (dir == 3 && index == num_pane - 1))
        return;

    let pane = panes.splice(index, 1)[0],
        target = (dir == -3)? 0: (dir == 3)? num_pane - 1: index + dir;
    if (target < 0 || target >= num_pane)
        return;
    panes.splice(target, 0, pane);

    // 3) update sizes
    let dico = {};
    panes.forEach((pane, id) => {
        let order = orders[id];
        dico[`max_${order}`] = Y[`max_${pane[0]}`];
        dico[`min_${order}`] = Y[`min_${pane[0]}`];
    });
    Assign(Y, dico);
    for (let order of orders) {
        save_option(`max_${order}`);
        save_option(`min_${order}`);
    }

    // 4) update areas
    let new_areas = Assign({}, ...panes.map((pane, id) => ({[`${orders[id]}0`]: pane[1]})));
    Assign(areas, new_areas);
    populate_areas();
}

/**
 * Populate areas
 * @param {boolean=} activate activate the tabs
 */
function populate_areas(activate) {
    let areas = Y['areas'] || {},
        default_areas = DEFAULTS['areas'],
        section = y_x,
        hides = Assign({}, HIDES[section]);

    if (virtual_hide_areas)
        virtual_hide_areas(hides);

    // 1) count existing
    Keys(areas).forEach(key => {
        for (let vector of areas[key])
            context_areas[vector[0]] = vector;
    });

    // 2) process all areas
    Keys(areas).forEach(key => {
        let parent = CacheId(key);
        if (!parent)
            return;

        // a) add missing defaults
        for (let vector of default_areas[key])
            if (!context_areas[vector[0]])
                areas[key].push(vector);

        // b) check if we already have the correct order, if yes then skip
        let prev_tab, tabs,
            children = parent.children,
            child = children[0],
            child_id = 0,
            error = '',
            sorder = areas[key].filter(item => (item[2] & 1)).map(item => item[0]).join(' ');

        for (let [id, tab, show] of areas[key]) {
            let node = CacheId(id);
            if (!node)
                continue;

            let is_tab;
            if (tab || prev_tab) {
                if (show & 1) {
                    if (!prev_tab || !tabs) {
                        tabs = child;
                        // check if in the tabs and in the right order
                        if (!HasClass(child, 'tabs')) {
                            error = 'tabs';
                            break;
                        }
                        let torder = From(tabs.children).map(sub => sub.dataset['x']).join(' ');
                        if (!sorder.includes(torder))
                            error = `sub: ${sorder} : ${torder}`;

                        child_id ++;
                        child = children[child_id];
                    }

                    is_tab = true;
                    prev_tab = tab;
                }
                show = show & 2;
            }
            else
                tabs = null;

            if (!child || child.id != id) {
                error = `id=${id}`;
                break;
            }
            else if (!is_tab) {
                let is_show = ((show & 1) && !hides[id])? true: false,
                    visible = Visible(child);

                if (is_show != visible) {
                    error = `vis=${id}`;
                    break;
                }
            }

            child_id ++;
            child = children[child_id];
        }

        if (!error) {
            if (child)
                error = `last=${child.id}`;
            else
                return;
        }
        if (DEV['ui']) {
            LS(key, `populate ${key} : ${error}`);
            LS(child);
        }

        // c) restructure the panel => this will cause the chat to reload too
        // remove tabs
        E('.tabs', node => {
            node.remove();
        }, parent);

        // add children + create tabs
        let exist = 0;
        prev_tab = 0;
        tabs = null;
        for (let vector of areas[key]) {
            let no_tab,
                [id, tab, show] = vector,
                node = CacheId(id);
            if (!node)
                continue;

            if (tab || prev_tab) {
                if (show & 1) {
                    if (!prev_tab || !tabs) {
                        tabs = CreateNode('horis', '', {'class': 'tabs', 'style': exist? 'margin-top:1em': ''});
                        parent.appendChild(tabs);
                        exist ++;
                    }

                    let text = id.split('-');
                    text = text.slice(-text.length + 1).join('-');
                    text = TAB_NAMES[text] || Title(text);

                    let dico = {
                            'class': `tab drop${(show & 2)? ' active': ''}`,
                            'data-abbr': text,
                            'data-label': HTML('.label', undefined, node) || '',
                            'data-x': id,
                        },
                        title = TITLES[text];

                    if (title)
                        Assign(dico, {
                            'data-t': title,
                            'data-t2': 'title',
                        });

                    tabs.appendChild(CreateNode('div', `<i data-t="${text}"></i>`, dico));
                    prev_tab = tab;
                }
                show = show & 2;
            }
            // no tab => show label under the graph
            else
                no_tab = true;

            if (!tab) {
                prev_tab = 0;
                tabs = null;
            }

            parent.appendChild(node);
            S(node, show & 1);
            S('.label', no_tab, node);

            context_areas[id] = vector;
            if (show & 1)
                exist ++;
        }
    });

    // 3) activate tabs
    if (activate)
        activate_tabs();

    save_option('areas');
    translate_nodes('body');
    set_draggable();

    if (virtual_populate_areas_special)
        virtual_populate_areas_special();
}

/**
 * Set some elements to be draggable or not
 */
function set_draggable() {
    let drag = !!Y['drag_and_drop'];
    Attrs('.drag, .drop', {'draggable': drag});
    Hide(CacheId('rect'));
    Class('.area', '-dragging');
}

// API
//////

/**
 * Get translations
 * @param {boolean=} force
 * @param {Function=} callback
 * @param {Object=} custom_data provide translations directly
 */
function api_translate_get(force, callback, custom_data) {
    /**
     * @param {Object=} data
     */
    function _done(data) {
        if (data) {
            translates = data;
            api_times.translate = Now(true);
            save_storage('trans', translates);
            save_storage('times', api_times);
        }
        translate_nodes('body');
        if (callback)
            callback();
    }

    // 0) custom data
    if (custom_data) {
        _done(custom_data);
        return;
    }

    // 1) cached?
    let language = Y['language'],
        now = Now();
    if (!force)
        if (language == 'eng' || (translates['_lan'] == language && now < (api_times.translate || 0) + TIMEOUT_translate)) {
            _done();
            return;
        }

    // 2) call the API
    if (language == 'eng')
        _done({});
    else
        Resource(`translate/${language}.json?v=${Ceil(now / TIMEOUT_translate)}`, (code, data) => {
            if (code != 200)
                return;
            _done(data);
        });
}

// EVENTS
/////////

function set_engine_events() {
    Events(window, 'mousedown touchstart', () => {
        cancel_animation();
    });

    // iframe support: scroll going to opposite expected way => stop the animation
    Events(window, 'scroll', () => {
        last_scroll = Now(true);
        if (Abs(touch_speed.x) <= 0.03 && Abs(touch_speed.y) <= 0.03)
            return;
        let y = ScrollDocument(),
            sign = Sign(y - touch_scroll.y);
        if (sign && sign != -Sign(touch_speed.y)) {
            cancel_animation();
            stop_drag();
        }
    });
}

/**
 * Used when showing a modal
 * @param {Node=} parent
 */
function set_modal_events(parent) {
    // settings events
    parent = parent || CacheId('modal');
    if (parent.dataset['ev'] == 0)
        return;

    // click on item => toggle if possible
    C('.item', function() {
        // button
        let name = this.name;
        if (name || HasClass(this, 'item-title')) {
            click_target = Parent(this, {class_: 'popup', self: true});
            change_setting(name, undefined, (this.dataset['set'] == '-1' || HasClass(this, 'span'))? 2: 0);
            return;
        }

        // input + select
        let next = this.nextElementSibling;
        if (!next)
            return;
        next = _('input, select', next);
        if (!next)
            return;
        switch (next.tagName) {
        case 'INPUT':
            if (next.type == 'checkbox') {
                next.checked = !next.checked;
                change_setting(next.name, next.checked * 1);
            }
            break;
        case 'SELECT':
            if (next.options.length == 2) {
                next.selectedIndex ^= 1;
                change_setting(next.name, next.value);
            }
            break;
        }
    }, parent);
    C('.item2', function() {
        let name = this.dataset['t'];
        change_setting(name? name.replace(/ /g, '_'): name);
    }, parent);

    // right click on item => reset to default
    Events('.item', 'contextmenu', function(e) {
        if (cannot_popup())
            return;
        let next = this.nextElementSibling;
        if (next) {
            E('input, select, textarea', node => {
                let name = node.name,
                    def = DEFAULTS[name];
                if (def == undefined)
                    return;
                if (node.type == 'checkbox')
                    node.checked = def? true: false;
                else
                    node.value = def;
                save_option(name, def);
                change_setting(name, def);
            }, next);
        }
        PD(e);
        SP(e);
    }, parent);

    // inputs
    Events('input, select, textarea', 'change', function() {
        done_touch();
        change_setting(this.name, (this.type == 'checkbox')? this.checked * 1: this.value);
    }, {}, parent);
    //
    Input('input, select, textarea', function() {
        done_touch();
        change_setting('');
    }, parent);
    //
    C('input, select, textarea', function() {
        if (cannot_click())
            return;
        change_setting('');
    }, parent);
    //
    C('div[name]', function() {
        change_setting(this.getAttribute('name'));
    }, parent);

    if (virtual_set_modal_events_special)
        virtual_set_modal_events_special();
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// <<
if (typeof exports != 'undefined') {
    Object.assign(exports, {
        activate_tabs: activate_tabs,
        add_font: add_font,
        add_history: add_history,
        add_timeout: add_timeout,
        AUTO_ON_OFF: AUTO_ON_OFF,
        calculate_text_width: calculate_text_width,
        cannot_click: cannot_click,
        cannot_popup: cannot_popup,
        clear_timeout: clear_timeout,
        create_field_value: create_field_value,
        create_page_array: create_page_array,
        create_svg_icon: create_svg_icon,
        create_url_list: create_url_list,
        DEFAULTS: DEFAULTS,
        DEV: DEV,
        DEV_NAMES: DEV_NAMES,
        device: device,
        done_touch: done_touch,
        find_area: find_area,
        FONTS: FONTS,
        get_float: get_float,
        get_int: get_int,
        get_object: get_object,
        get_string: get_string,
        guess_types: guess_types,
        HIDES: HIDES,
        ICONS: ICONS,
        import_settings: import_settings,
        KEYS: KEYS,
        LANGUAGES: LANGUAGES,
        load_defaults: load_defaults,
        LOCALHOST: LOCALHOST,
        me: me,
        merge_settings: merge_settings,
        move_pane: move_pane,
        NO_IMPORTS: NO_IMPORTS,
        ON_OFF: ON_OFF,
        option_number: option_number,
        PANES: PANES,
        parse_dev: parse_dev,
        populate_areas: populate_areas,
        POPUP_ADJUSTS: POPUP_ADJUSTS,
        reset_default: reset_default,
        reset_settings: reset_settings,
        resize_text: resize_text,
        restore_history: restore_history,
        sanitise_data: sanitise_data,
        save_default: save_default,
        save_option: save_option,
        set_section: set_section,
        show_settings: show_settings,
        socket: socket,
        TAB_NAMES: TAB_NAMES,
        THEMES: THEMES,
        timers: timers,
        translate: translate,
        translate_default: translate_default,
        translate_expression: translate_expression,
        TRANSLATE_SPECIALS: TRANSLATE_SPECIALS,
        translates: translates,
        TYPES: TYPES,
        update_svg: update_svg,
        X_SETTINGS: X_SETTINGS,
        Y: Y,
        y_states: y_states,
    });
}
// >>
