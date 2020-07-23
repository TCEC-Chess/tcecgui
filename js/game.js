// game.js
// @author octopoulo <polluxyz@gmail.com>
// @version 2020-07-21
//
// Game specific code:
// - control the board, moves
// - create the tables
// - handle live updates
// - update stats
//
// included after: common, engine, global, 3d, xboard
/*
globals
_, A, Abs, add_timeout, Assign, Attrs, audiobox,
C, calculate_feature_q, cannot_click, Ceil, change_setting, charts, check_hash, Clamp, Class, clear_timeout,
context_areas, context_target:true, controls, CopyClipboard, create_field_value, create_page_array, create_svg_icon,
CreateNode, CreateSVG, cube:true, DefaultFloat, DefaultInt, DEV, device, document, E, Events, exports, fill_combo,
fix_move_format, Floor, FormatUnit, From, FromSeconds, FromTimestamp, get_area, get_move_ply, get_object, getSelection,
global, HasClass, HasClasses, Hide, HOST_ARCHIVE, HTML, Id, Input, InsertNodes, invert_eval, is_overlay_visible,
IsArray, IsObject, IsString, Keys, KEYS,
listen_log, load_library, load_model, LOCALHOST, location, Lower, LS, Max, Min, Module, navigator, Now, Pad, Parent,
parse_time, play_sound, push_state, QueryString, redraw_eval_charts, require, reset_charts, resize_3d, resize_text,
Resource, restore_history, resume_sleep, Round,
S, save_option, save_storage, scene, scroll_adjust, set_3d_events, SetDefault, Show, show_modal, slice_charts, SP,
Split, split_move_string, SPRITE_OFFSETS, Sqrt, STATE_KEYS, stockfish_wdl, Style, TEXT, TIMEOUTS, Title, Toggle,
touch_handle, translate_default, translate_node, Undefined, update_chart_options, update_live_chart,
update_player_charts, update_svg, Upper, virtual_init_3d_special:true, virtual_random_position:true, Visible, window,
XBoard, Y
*/
'use strict';

// <<
if (typeof global != 'undefined') {
    let req = require,
        {Assign, DEV, Floor, Keys, IsObject, Lower, LS} = req('./common');
    Assign(global, {
        Assign: Assign,
        DEV: DEV,
        Floor: Floor,
        Keys: Keys,
        IsObject: IsObject,
        Lower: Lower,
        LS: LS,
    });
}
// >>

let ANALYSIS_URLS = {
        chessdb: 'https://www.chessdb.cn/queryc_en/?{FEN}',
        evalguide: 'https://hxim.github.io/Stockfish-Evaluation-Guide/index.html?p={FEN}',
        lichess: 'https://lichess.org/analysis/standard/{FEN}',
    },
    ARCHIVE_KEYS = ['season', 'div', 'round', 'stage', 'game'],
    BOARD_THEMES = {
        blue: ['#e0e0e0', '#87a6bc'],
        brown: ['#eaded0', '#927b6d'],
        chess24: ['#9e7863', '#633526'],
        custom: [],
        dark: ['#797877', '#585655'],
        dilena: ['#ffe5b6', '#b16228'],
        green: ['#f0e9db', '#7b9d86'],
        leipzig: ['#ffffff', '#e1e1e1'],
        metro: ['#ffffff', '#efefef'],
        red: ['#eaded0', '#b17278'],
        symbol: ['#ffffff', '#58ac8a'],
        uscf: ['#c3c6be', '#727fa2'],
        wikipedia: ['#ffce9e', '#d18b47'],
    },
    board_target,
    // vis: selector of the element to check visibility against, indicating that the board is visible or not
    BOARDS = {
        archive: {
            last: '*',
            main: true,
            pv_id: '#moves-archive',
            vis: 'archive',
        },
        live: {
            //manual: true, // CHECK THIS: should not be here, set_voting_status sets this
            count: 'end',
            last: '*',
            main: true,
            pv_id: '#moves-live',
            vis: 'live',
        },
        live0: {
            dual: 'live1',
            live_id: 2,
            pv_id: '#table-live0 .live-pv',
            sub: 2,
            tab: 'kibitz',
            vis: 'table-kibitz',
        },
        live1: {
            dual: 'live0',
            live_id: 3,
            pv_id: '#table-live1 .live-pv',
            sub: 2,
            tab: 'kibitz',
            vis: 'table-kibitz',
        },
        pv0: {
            dual: 'pv1',
            live_id: 0,
            pv_id: '#moves-pv0 .live-pv',
            sub: 2,
            tab: 'pv',
            vis: 'table-pv',
        },
        pv1: {
            dual: 'pv0',
            live_id: 1,
            pv_id: '#moves-pv1 .live-pv',
            sub: 2,
            tab: 'pv',
            vis: 'table-pv',
        },
        pva: {
            manual: true,
            size: 36,
            sub: 1,
            tab: 'pva',
            vis: 'table-pva',
        },
        three: {
            id: '#canvas',
            mode: '3d',
        },
        xfen: {
            hook: null,
            size: 24,
        }
    },
    bracket_link,
    CACHE_TIMEOUTS = {
        brak: 60,
        crash: 600,
        cross: 60,
        sched: 240,
        season: 1200,
        tour: 60,
        winner: 3600 * 24,
    },
    CONNECTORS = [
        [
            [0, 'win', [1, 1]]
        ],
        [
            [2, 'loss', [2, 1]],
            [0, 'win', [1, 2]],
        ],
    ],
    DEFAULT_ACTIVES = {
        archive: 'season',
        live: 'stand',
    },
    ENGINE_FEATURES = {
        AllieStein: 1 + 4,              // & 1 => NN engine
        LCZero: 1 + 2,                  // & 2 => Leela variations
        ScorpioNN: 1,
        Stoofvlees: 1 + 8,
	Chat: 256,
    },
    event_stats = {
        archive: {},
        live: {},
    },
    game_link,                          // current game link in the archive
    hashes = {
        archive: {},
        live: {},
    },
    LIVE_TABLES = [
        ['#table-live0', '#box-live0 .status'],
        ['#table-live1', '#box-live1 .status'],
        ['#moves-pv0', '#box-pv0 .status'],
        ['#moves-pv1', '#box-pv1 .status'],
    ],
    // number items, type (0:string, 1:int, 2:float)
    LOG_KEYS = {
        cp: [1, 2],
        depth: [1, 1],
        hashfull: [1, 1],
        nodes: [1, 1],
        nps: [1, 1],
        pv: [-1, 0],
        seldepth: [1, 1],
        tbhits: [1, 1],
        time: [1, 1],
        wdl: [3, 1],
    },
    old_cup,
    old_width,
    PAGINATION_PARENTS = ['quick', 'table'],
    PAGINATIONS = {
        h2h: 10,
        sched: 10,
    },
    PIECE_SIZES = {
        _: 80,
        metro: 160,
    },
    // defaults: {ext: png, off: [0, 0], size: 80}
    PIECE_THEMES = {
        alpha: {},
        chess24: {},
        dilena: {
            off: [0, -15],
        },
        leipzig: {
            off: [5, 5],
        },
        metro: {
            off: [0, -4],
            size: 160,
        },
        symbol: {},
        uscf: {},
        wikipedia: {},
    },
    queued_tables = new Set(),          // tables that cannot be created yet because of missing info
    QUEUES = ['h2h', 'stats'],
    RESULTS = {
        '*': 0,
        '0-1': -1,
        '1-0': 1,
        '1/2-1/2': 0.5,
    },
    ROUND_LINKS = {
        1: 'fl',                        // final
        2: 'sf',                        // semifinal
        3: 'bz',                        // bronze
        4: 'qf',                        // quarterfinal
    },
    ROUND_NAMES = {
        1: 'Final',
        2: 'Semi-finals',
        4: 'Quarter-finals',
    },
    SCORE_NAMES = {
        0: 'loss',
        0.5: 'draw',
        1: 'win',
        '=': 'draw',
    },
    table_data = {
        archive: {},
        live: {},
    },
    TABLES = {
        crash: 'gameno={Game}#|White|Black|Reason|decision=Final decision|action=Action taken|Result|Log',
        cross: 'Rank|Engine|Points',
        event: 'Round|Winner|Points|runner=Runner-up|# {Games}|Score',
        h2h: '{Game}#|White|white_ev=W.ev|black_ev=B.ev|Black|Result|Moves|Duration|Opening|Termination|ECO|Final FEN|Start',
        overview: 'TC|Adj Rule|50|Draw|Win|TB|Result|Round|Opening|ECO|Event|Viewers',
        sched: '{Game}#|White|white_ev=W.ev|black_ev=B.ev|Black|Result|Moves|Duration|Opening|Termination|ECO|Final FEN|Start',
        season: 'Season|Download',
        stand: 'Rank|Engine|Games|Points|{Wins} [{W/B}]|{Losses} [{W/B}]|Crashes|SB|Elo|{Diff} [{Live}]',
        winner: 'name=S#|winner=Champion|runner=Runner-up|Score|Date',
    },
    TB_URL = 'https://syzygy-tables.info/?fen={FEN}',
    THREAD_KEYS = {
        cores: 4,
        cpus: 3,
        max_cpus: 1,
        maxthreads: 2,
        number_of_threads: 5,
        numberofprocessors: 3,
        'search_smp_[threads_count]': 5,
        smp_threads: 5,
        threads: 5,
    },
    TIMEOUT_live_delay = 2,
    TIMEOUT_live_reload = 30,
    TIMEOUT_queue = 100,                // check the queue after updating a table
    TIMEOUT_scroll = 300,
    TIMEOUT_search = 100,               // filtering the table when input changes
    TITLES = {
        50: 'Fifty-move rule',
        ECO: 'Encyclopaedia of Chess Openings',
        H2H: 'Head to head',
        SB: 'Sonneborn–Berger',
        TB: 'Tablebase',
        TC: 'Time control',
    },
    tour_info = {
        archive: {},
        live: {},
    },
    virtual_opened_table_special,
    xboards = {},
    WB_TITLES = ['White', 'Black'];

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// HELPERS
//////////

/**
 * Calculate the probability to draw or win
 * - works for AA and NN engines
 * @param {string} short_engine short engine name
 * @param {number} eval_
 * @param {number} ply
 * @param {string=} wdl '437 550 13'
 * @returns {string}
 */
function calculate_probability(short_engine, eval_, ply, wdl)
{
    if (isNaN(eval_))
        return eval_;

    let draw, loss, win;

    if (wdl) {
        [win, draw, loss] = wdl.split(' ');
        win = (win || 0) / 10;
        draw = (draw || 0) / 10;
        loss = (loss || 0) / 10;
    }
    else {
        let feature = ENGINE_FEATURES[short_engine];

        // stockfish + AB engines
        if (!feature && ply >= 0) {
            [win, draw, loss] = stockfish_wdl(eval_ * 100, ply);
            win /= 10;
            draw /= 10;
            loss /= 10;
        }
        // NN engines
        else {
            let white_win = calculate_feature_q(feature, eval_, ply);
            if (eval_ < 0) {
                loss = Max(0, -white_win * 2);
                win = 0;
            }
            else {
                win = Max(0, white_win * 2);
                loss = 0;
            }
            draw = Max(0, 100 - loss - win);
        }
    }

    return `${win.toFixed(1)}% W | ${draw.toFixed(1)}% D | ${loss.toFixed(1)}% B`;
}

/**
 * Calculate White and Black points
 * @param {string} text
 * @returns {Object}
 */
function calculate_score(text) {
    let black = 0,
        white = 0;

    for (let i = 0, length = text.length; i < length; i ++) {
        let char = text[i];
        if (char == '0')
            black ++;
        else if (char == '1')
            white ++;
        else if (char == '=') {
            black += 0.5;
            white += 0.5;
        }
    }

    return {w: white, b: black};
}

/**
 * Create a link to a game
 * @param {string} section archive, live
 * @param {number} game
 * @param {string=} text if not set, then use game as the text
 * @param {boolean=} only_link returns the link directly, instead of the <a ... > HTML
 * @returns {string}
 */
function create_game_link(section, game, text, only_link) {
    let link = '#' + QueryString({query: `${tour_info[section].link}&game=${game}`, string: true});
    if (only_link)
        return link;
    return `<a class="game" href="${link}">${text || game}</a>`;
}

/**
 * Format a full engine name
 * @param {string} engine
 * @param {boolean=} multi_line engine + version on 2 different lines
 * @param {number=} scale
 * @returns {string}
 */
function format_engine(engine, multi_line, scale) {
    if (!engine)
        return '';
    let pos = engine.indexOf(' ');
    if (pos < 0)
        return engine;
    let tag = multi_line? 'div': 'i',
        version = engine.slice(pos + 1),
        version_class = `version${(scale && version.length >= scale)? ' version-small': ''}`;
    return `${engine.slice(0, pos)}${multi_line? '': ' '}<${tag} class="${version_class}">${version}</${tag}>`;
}

/**
 * Format the eval to make the 2 decimals smaller if the eval is high
 * @param {number} value
 * @param {boolean=} process can make decimals smaller
 * @returns {number}
 */
function format_eval(value, process) {
    let float = parseFloat(value);
    if (isNaN(float))
        return value;

    let small_decimal = Y.small_decimal,
        text = float.toFixed(2);

    if (!process || small_decimal == 'never')
        return text;

    let items = text.split('.');

    if (small_decimal != 'always') {
        let abs = Abs(float);
        if (abs < 10 && small_decimal == '>= 10')
            return text;
        if (abs < 100 && small_decimal == '>= 100')
            return text;
    }
    return `<i>${items[0]}.</i><i class="smaller">${items[1]}</i>`;
}

/**
 * Format a FEN
 * @param {string} fen
 * @returns {string}
 */
function format_fen(fen) {
    if (!fen)
        return '';
    let pos = fen.indexOf(' ');
    if (pos < 0)
        return fen;
    let left = fen.slice(0, pos).split('/').map(item => `<i class="nowrap">${item}</i>`).join('/');
    return `${left} <i class="nowrap">${fen.slice(pos + 1)}</i>`;
}

/**
 * Format seconds to hh:mm:ss + handle days
 * @param {number} seconds
 * @returns {string}
 */
function format_hhmmss(seconds) {
    let days = Floor(seconds / 86400);
    seconds = seconds % 86400;
    let text = FromSeconds(seconds).slice(0, -1).map(item => Pad(item)).join(':');
    if (days)
        text = `${days}d, ${text}`;
    return text;
}

/**
 * Format an opening
 * @param {string} opening
 * @returns {string}
 */
function format_opening(opening) {
    if (!opening)
        return '';
    let pos = opening.indexOf(', ');
    if (pos < 0)
        return opening;

    let left = opening.slice(0, pos),
        replaces = [],
        right = opening.slice(pos) + ',';

    // (with ...g6, without ...d6) => {{1}}
    right = right.replace(/ \((.*?)\)/g, (_match, p1) => {
        p1 = p1.replace(/ /g, '&nbsp;');
        if (p1.indexOf(',') >= 0)
            p1 = `,${p1}`;
        replaces.push(p1);
        return `{{${replaces.length}}}`;
    });

    // , modern, Larsen variation, => , modern, Larsen&nbsp;variation,
    right = right.replace(/, (.*?)(?=,)/g, (_match, p1) => `, ${p1.replace(/ /g, '&nbsp;')}`);

    // restore replaces
    if (replaces.length)
        right = right.replace(/\{\{(\d+)\}\}/g, (_match, p1) => {
            let replace = replaces[p1 * 1 - 1];
            if (replace[0] == ',')
                replace = replace.slice(1);
            return ` (${replace})`;
        });

    return `<i class="nowrap">${left}</i><i class="small">${right.slice(0, -1)}</i>`;
}

/**
 * Format a value to %
 * @param {number} value
 * @returns {string}
 */
function format_percent(value) {
    return `${Round(value * 10000) / 100}%`;
}

/**
 * Get the active tab name
 * + translate shortcuts
 * @param {string} parent
 * @returns {[string, string, Node]} name, original, node
 */
function get_active_tab(parent) {
    let active = _(`#${parent}-tabs .active`);
    if (!active)
        return [];

    let name = active.dataset.x,
        translated = name;
    if (name.slice(0, 8) == 'shortcut')
        translated = Y[name];

    return [translated, name, active];
}

/**
 * Get the short name of an engine
 * @param {string} engine Stockfish 20200407DC
 * @returns {string} Stockfish
 */
function get_short_name(engine)
{
    if (!engine)
        return '';
    return engine.includes('Baron')? 'Baron': Split(engine)[0];
}

/**
 * Get XHR elapsed time
 * @param {Object} xhr
 * @returns {number}
 */
function get_xhr_elapsed(xhr) {
    let curr_time = new Date(xhr.getResponseHeader('date')),
        last_mod = new Date(xhr.getResponseHeader('last-modified'));
    return curr_time.getTime() - last_mod.getTime();
}

/**
 * Get the timestamp in seconds from a date time
 * - assume it's UTC
 * @param {string} text
 * @returns {number}
 */
function parse_date_time(text) {
    if (!text)
        return 0;

    let seconds,
        items = text.split(' on ');
    if (items.length < 2)
        seconds = Date.parse(text.replace(/\./g, '-')) / 1000;
    else
        seconds = Date.parse(`${items[1].replace(/\./g, '-')}T${items[0]}Z`) / 1000;
    return seconds || text;
}

// BOARD
////////

/**
 * Set the target board and make all sub boards point to that board
 */
function assign_boards() {
    board_target = xboards[Y.x];

    Keys(xboards).forEach(key => {
        let board = BOARDS[key],
            xboard = xboards[key];

        xboard.real = board_target;
        if (board.dual)
            xboard.dual = xboards[board.dual];
    });
}

/**
 * Check if the live ID can draw an arrow
 * @param {XBoard} xboard
 */
function check_draw_arrow(board) {
    let id = board.live_id,
        main = xboards[Y.x];

    if (id == undefined || !['all', id < 2? 'player': 'kibitzer'].includes(Y.arrow_from))
        return;

    let draw = false,
        moves = main.moves,
        board_moves = board.moves,
        next = board.next,
        ply = main.ply,
        next_ply = ply + 1;

    // wrong color?
    if (board.name.slice(0, 2) == 'pv' && next_ply % 2 != id % 2)
        return;

    // wrong current move?
    if (moves[ply] && board_moves[ply]) {
        let fen = moves[ply].fen;

        if (fen != board_moves[ply].fen) {
            if (DEV.arrow)
                LS(`${board.id} wrong fen @${ply} / ${ply / 2 + 1}`);
        }
        else {
            if (DEV.arrow)
                LS(`${board.id} correct fen @${ply} / ${ply / 2 + 1}`);

            next = board_moves[next_ply];
            if (next) {
                board.next = next;
                if (next.from == undefined && next.m) {
                    board.chess_load(fen);
                    let result = board.chess_move(next.m);
                    Assign(next, result);
                    next.ply = next_ply;
                    if (DEV.arrow)
                        LS(`${board.id} chess ${next.m} => ${next.from} - ${next.to} @${next_ply} / ${next_ply / 2 + 1}`);
                }
                draw = true;
            }
        }
    }
    else if (next && next.ply == next_ply) {
        if (DEV.arrow)
            LS(`${board.id} OK next @${next_ply} / ${next_ply / 2 + 1}`);
        draw = true;
    }

    if (draw) {
        main.arrow(id, next);
        if (DEV.arrow)
            LS(`     => draw: ${next.m} : ${next.from} => ${next.to} @${next.ply} / ${next.ply / 2 + 1}`);
    }
    else if (DEV.arrow)
        LS(`${board.id} no arrow`);
}

/**
 * Create 9 boards
 * - should be done at startup since we want to see the boards ASAP
 * @param {string=} mode
 */
function create_boards(mode='html') {
    // 1) create all boards
    let keys = Keys(BOARDS);

    keys.forEach(key => {
        let options = {...{
                border: 2,
                hook: handle_board_events,
                id: `#${key}`,
                list: true,
                name: key,
                mode: mode,
                size: 24,
            }, ...BOARDS[key]},
            xboard = new XBoard(options);

        xboard.initialise();
        // make sure not to render => false
        xboard.resize(options.size * 8 + options.border * 2, false);
        xboards[key] = xboard;
    });

    // 2) set pointers: real board + duals
    assign_boards();

    // 3) update themes: this will render the boards too
    update_board_theme(7);

    // 4) pva colors
    let lines = [0, 1, 2, 3].map(id => {
        let color = Y[`graph_color_${id}`];
        return `<div class="color${id? '': ' active'}" data-id="${id < 2? 'pv': 'live'}${id % 2}" style="background:${color}"></div>`;
    });
    HTML(Id('colors'), lines.join(''));

    C('.color', function() {
        let board = xboards[this.dataset.id];
        xboards.pva.set_fen(board.fen, true);
        Class('.color', '-active');
        Class(this, 'active');
    });
}

/**
 * PV board order
 */
function order_boards() {
    if (HasClass(Id('table-pv'), 'frow'))
        Style('#box-pv0, #box-pv1', 'order:unset');
    else {
        let main = xboards[Y.x];
        if (main) {
            let rotate = main.rotate;
            Style(Id('box-pv0'), `order:${1 - rotate}`);
            Style(Id('box-pv1'), `order:${rotate}`);
        }
    }
}

/**
 * Redraw the arrows
 */
function redraw_arrows() {
    Keys(xboards).forEach(key => {
        check_draw_arrow(xboards[key]);
    });
}

/**
 * Reset sub boards
 * @param {number} mode:
 * - &1: mark board invalid
 * - &2: reset the board completely
 * - &4: reset board evals
 * @param {string=} start_fen
 */
function reset_sub_boards(mode, start_fen) {
    Keys(xboards).forEach(key => {
        let board = xboards[key];
        if (board.main_manual)
            return;

        if (mode & 1)
            board.valid = false;
        if (mode & 2)
            board.reset(mode & 4, start_fen);
    });
}

/**
 * Show/hide the timers around the board
 * @param {string} name
 * @param {boolean=} show undefined => show when center/engine is disabled
 */
function show_board_info(name, show) {
    let board = xboards[name],
        node = board.node,
        players = board.players,
        status = (name == 'pva')? Y.status_pva: Y.status;

    if (show == undefined) {
        // auto => if engine is not visible => show the status
        if (status == 'auto') {
            let window_height = window.innerHeight,
                window_width = window.innerWidth;

            if (window_width <= 568)
                show = true;
            else {
                let engine = Id('engine'),
                    rect_e = engine.getBoundingClientRect();

                if (!Visible(engine) || rect_e.top > window_height || rect_e.top + rect_e.height < 0
                        || rect_e.left > window_width || rect_e.left + rect_e.width < 0)
                    show = true;
            }
        }
        else
            show = (status != 0);
    }

    S('.xbottom, .xtop', show, node);
    Class('.xbottom', '-xcolor0 xcolor1', board.rotate, node);
    Class('.xtop', 'xcolor0 -xcolor1', board.rotate, node);
    Style('.xframe', `top:${show? 23: 0}px`, true, node);

    for (let id = 0; id < 2; id ++) {
        let player = players[id],
            mini = _(`.xcolor${id}`, node);
        HTML('.xeval', format_eval(player.eval, true), mini);
        HTML(`.xleft`, player.sleft, mini);
        HTML('.xshort', player.short, mini);
        HTML(`.xtime`, player.stime, mini);
    }
}

/**
 * Update the boards' theme
 * @param {number} mode update mode:
 * - &1: board
 * - &2: pv (all other boards)
 * - &4: pva
 * - &8: just re-render all but don't update settings
 */
function update_board_theme(mode) {
    Keys(xboards).forEach(key => {
        // 1) skip?
        let board = xboards[key],
            is_main = board.main,
            is_manual = board.manual;

        if (!(mode & 8)) {
            if (is_main) {
                if (!(mode & 1))
                    return;
            }
            else if (is_manual) {
                if (!(mode & 4))
                    return;
            }
            else if (!(mode & 2))
                return;
        }

        // 2) update board
        if (mode & 7) {
            let suffix = is_manual? '_pva': (is_main? '': '_pv'),
                board_theme = Y[`board_theme${suffix}`],
                colors = (board_theme == 'custom')? [Y[`custom_white${suffix}`], Y[`custom_black${suffix}`]]: BOARD_THEMES[board_theme],
                piece_theme = Y[`piece_theme${suffix}`],
                smooth = Y[`animate${suffix}`],
                theme = {...{ext: 'png', name: piece_theme, off: [0, 0], size: 80}, ...PIECE_THEMES[piece_theme]};

            Assign(board, {
                colors: colors,
                dirty: 3,
                high_color: Y[`highlight_color${suffix}`],
                high_size: Y[`highlight_size${suffix}`],
                notation: Y[`notation${suffix}`]? 6: 0,
                smooth: smooth,
                smooth0: smooth,
                theme: theme,
            });
        }

        // 3) render
        board.instant();
        board.render(7);
    });

    update_engine_pieces();
}

/**
 * Update engine pieces using the main board theme
 */
function update_engine_pieces() {
    let main = xboards.live,
        [piece_size, style] = main.get_piece_background(20);

    for (let i = 0; i < 2; i ++) {
        let node = Id(`king${i}`),
            offset = -SPRITE_OFFSETS[['K', 'k'][i]] * piece_size;
        Style('div', `${style};background-position-x:${offset}px`, true, node);
        Style(node, `transform:scale(${20 / piece_size})`);
    }
}

// TABLES
/////////

/**
 * Add a table to the queue
 * @param {string} section
 * @param {string} parent
 */
function add_queue(section, parent) {
    for (let queue of QUEUES)
        queued_tables.add(`${section}/${parent}/${queue}`);

    let main = xboards[section];
    if (main.players[0].name)
        add_timeout('queue', check_queued_tables, TIMEOUT_queue);
}

/**
 * Analyse the crosstable data
 * - create table-stand + table-cross
 * @param {string} section archive, live
 * @param {Object} data
 */
function analyse_crosstable(section, data) {
    if (!data)
        return;
    SetDefault(table_data, section, {}).crossx = data;

    let cross_rows = [],
        dicos = data.Table,
        max_game = 0,
        orders = data.Order,
        abbrevs = orders.map(name => dicos[name].Abbreviation),
        stand_rows = [],
        titles = Assign({}, ...orders.map(name => ({[dicos[name].Abbreviation]: get_short_name(name)})));

    // 1) analyse all data => create rows for both tables
    for (let name of orders) {
        let dico = dicos[name],
            results = dico.Results;
        for (let order of orders) {
            let games = results[order];
            if (games) {
                let scores = games.Scores;
                max_game = Max(max_game, scores.length);
            }
        }
    }
    let max_column = Max(2, Ceil(Sqrt(max_game)));

    for (let name of orders) {
        let dico = dicos[name],
            elo = dico.Rating,
            new_elo = Round(elo + (dico.Elo || 0)),
            results = dico.Results;

        // cross
        let cross_row = {
            abbrev: Lower(dico.Abbreviation),
            engine: name,
            num_break: Floor(max_game / max_column),
            points: dico.Score,
            rank: dico.Rank,
        };
        abbrevs.forEach((abbrev, id) => {
            let games = results[orders[id]];
            if (games) {
                let scores = games.Scores.map((game, i) => {
                    let link = create_game_link(section, game.Game, '', true),
                        score = game.Result,
                        sep = i? ((max_column && (i % max_column == 0))? '<br>': ' '): '';
                    return `${sep}<a href="${link}" data-g="${game.Game}" class="${SCORE_NAMES[score]}">${(score > 0 && score < 1)? '½': score}</a>`;
                }).join('');
                cross_row[abbrev] = `<div class="cross">${scores}</div>`;
            }
        });
        cross_rows.push(cross_row);

        // stand
        let loss_b = Undefined(dico.LossAsBlack, dico.LossesAsBlack),
            loss_w = Undefined(dico.LossAsWhite, dico.LossesAsWhite);

        stand_rows.push({
            crashes: dico.Strikes,
            diff: `${new_elo - elo} [${new_elo}]`,
            elo: elo,
            engine: name,
            games: dico.Games,
            losses: `${loss_w + loss_b} [${loss_w}/${loss_b}]`,
            points: dico.Score,
            rank: dico.Rank,
            sb: dico.Neustadtl,
            wins: `${dico.WinsAsWhite + dico.WinsAsBlack} [${dico.WinsAsWhite}/${dico.WinsAsBlack}]`,
        });
    }

    update_table(section, 'stand', stand_rows);

    // 2) table-cross: might need to update the columns too
    let node = Id('table-cross'),
        new_columns = [...Split(TABLES.cross), ...abbrevs],
        scolumns = From(A('th', node)).map(node => node.textContent).join('|'),
        snew_columns = new_columns.join('|');

    if (scolumns != snew_columns && Y.x == section) {
        // make the extra columns the same size
        let extras = new_columns.slice(3),
            width = `${Floor(71 / (extras.length + 0.001))}%`,
            widths = [...['4%', '18%', '7%'], ...extras.map(() => width)],
            head = create_table_columns(new_columns, widths, abbrevs, titles);
        HTML('thead', head, node);
        translate_node(node);
    }

    update_table(section, 'cross', cross_rows);
}

/**
 * Calculate H2H
 * - filter the rows
 * - calculate the scores
 * @param {string} section
 * @param {Object[]} rows
 * @returns {Object[]} filtered rows
 */
function calculate_h2h(section, rows) {
    let main = xboards[section],
        players = main.players,
        names = {[players[0].name]: 1, [players[1].name]: 1},
        new_rows = rows.filter(row => names[row.white] && names[row.black]);

    // calculate h2h scores
    for (let row of new_rows) {
        let result = RESULTS[row.result];
        if (result) {
            if (result == 1)
                names[row.white] += 1;
            else if (result == -1)
                names[row.black] += 1;
            else {
                names[row.black] += 0.5;
                names[row.white] += 0.5;
            }
        }
    }

    // update players + UI info
    for (let id = 0; id < 2; id ++) {
        let player = players[id];
        player.score = (names[player.name] - 1).toFixed(1);
    }
    update_scores(section);

    return new_rows;
}

/**
 * Change the page from quick/table
 * @param {string} parent quick, table
 * @param {string} value +1, -1, 0, 1, 2, ...
 */
function change_page(parent, value) {
    let [active, output] = get_active_tab(parent);
    if (DEV.ui)
        LS(`change_page: ${parent} : ${value} ~ ${active}`);

    let page,
        page_key = `page_${parent}`,
        section = Y.x,
        data_x = SetDefault(table_data[section], active, {data: []}),
        num_row = data_x[`rows_${parent}`],
        num_page = Ceil(num_row / Y.rows_per_page);

    if ('+-'.includes(value[0]))
        page = (data_x[page_key] || 0) + parseInt(value);
    else
        page = value * 1;

    if (page < 0)
        page += num_page;
    else if (page >= num_page)
        page -= num_page;

    // refresh the table
    data_x[page_key] = page;
    update_table(section, active, null, parent, {output: output});
}

/**
 * Create pagination if required
 * @param {string} parent
 * @returns {number} number of pages (negative if virtual)
 */
function check_pagination(parent) {
    // check if the active tab can be paginated
    let [name] = get_active_tab(parent);
    if (!PAGINATIONS[name])
        return 0;

    if (DEV.queue)
        LS(`check_pagination: ${parent}/${name}`);

    // check if there's enough data
    let section = Y.x,
        data_x = table_data[section][name];
    if (!data_x)
        return 0;

    let num_row = data_x[`rows_${parent}`] || 0,
        num_page = Ceil(num_row / Y.rows_per_page),
        page = Clamp(data_x[`page_${parent}`], 0, num_page - 1),
        total = data_x.data.length;

    if (num_page < 2)
        return -Ceil(total / Y.rows_per_page);

    // many rows => enable pagination
    // - only create the HTML if it doesn't already exist
    let node = Id(`${parent}-pagin`),
        pages = A('.page', node);

    if (pages.length != num_page + 2) {
        let lines = ['<a class="page page-prev" data-p="-1">&lt;</a>'];
        if (parent == 'table') {
            let array = create_page_array(num_page, page, 2);
            for (let id = 0; id < num_page; id ++) {
                if (array[id] == 2)
                    lines.push(`<a class="page${page == id? ' active': ''}" data-p="${id}">${id + 1}</a>`);
                else if (array[id])
                    lines.push('<a class="page2">...</a>');
            }
        }

        lines.push('<a class="page page-next" data-p="+1">&gt;</a>');
        HTML('.pages', lines.join(''), node);
        HTML('.row-filter', num_row, node);
        HTML('.row-total', total, node);
    }

    return num_page;
}

/**
 * Check pagination for the currently active tables
 */
function check_paginations() {
    for (let parent of PAGINATION_PARENTS) {
        let num_page = check_pagination(parent);
        S(Id(`${parent}-pagin`), num_page > 1);
        S(Id(`${parent}-search`), Abs(num_page) >= 1);
    }
}

/**
 * Check if some queued tables can be created
 */
function check_queued_tables() {
    clear_timeout('queue');
    let removes = [];

    for (let queued of queued_tables) {
        if (DEV.queue)
            LS(`queued: ${queued}`);

        let [section, parent, table] = queued.split('/');
        if (!QUEUES.includes(table))
            continue;

        let data_x = table_data[section].sched;
        if (!data_x)
            continue;

        let data = data_x.data;
        if (table == 'h2h') {
            let new_rows = calculate_h2h(section, data);
            update_table(section, table, new_rows, parent);
            check_paginations();
        }
        else
            calculate_event_stats(section, data);
        removes.push(queued);
    }

    for (let remove of removes)
        queued_tables.delete(remove);
}

/**
 * Create a Live table
 * - we don't want to recreate the table each time, that's why this creation will give a boost
 * @param {boolean} is_live live => has more info
 * @param {number} id 0, 1
 * @returns {string}
 */
function create_live_table(is_live, id) {
    let html =
        '<vert class="live fastart">'
            + '<grid class="live-basic">'
                + '<div class="engine" data-x="name"></div>'
                + '<div class="eval" data-x="eval"></div>'
                + '<div class="percent">[<i data-x="score"></i>]</div>'
            + '</grid>';

    if (is_live)
        html +=
            '<div class="live-more">'
                + '[D: <i data-x="depth"></i> | TB: <i data-x="tb"></i> | Sp: <i data-x="speed"></i> | N: <i data-x="node"></i>]'
            + '</div>'
            + `<div class="hardware engine" data-x="live+${id}"></div>`;

    html +=
            '{TEMP}'
        + '</vert>';
    return html;
}

/**
 * Create a table
 * @param {string[]} columns
 * @param {boolean=} add_empty add an empty row (good for overview)
 * @returns {string}
 */
function create_table(columns, add_empty) {
    let lines = [
        '<table><thead>',
            create_table_columns(columns),
        '</thead><tbody>',
            (add_empty? columns.map(column => `<td data-x="${create_field_value(column)[0]}">&nbsp;</td>`).join(''): ''),
        '</tbody></table>',
    ];
    return lines.join('');
}

/**
 * Create <th> columns to be used in a table
 * - used by create_table
 * - used when generating the dynamic Crosstable
 * @param {string[]} columns
 * @param {number[]=} widths optional width for each column
 * @param {string[]=} no_translates don't translate those terms
 * @param {Object=} titles
 * @returns {string}
 */
function create_table_columns(columns, widths, no_translates=[], titles={}) {
    return columns.map((column, id) => {
        let [field, value] = create_field_value(column),
            style = widths? ` style="width:${widths[id]}"`: '',
            title = titles[value] || TITLES[value],
            translate = no_translates.includes(value)? '': ` data-t="${value}"`;

        title = title? ` title="${title}"`: '';
        return `<th${style} ${id? '': 'class="rounded" '}data-x="${field}"${translate}${title}>${translate? '': value}</th>`;
    }).join('');
}

/**
 * Create all the tables
 */
function create_tables() {
    // 1) normal tables
    Keys(TABLES).forEach(name => {
        let is_overview = (name == 'overview'),
            table = TABLES[name],
            html = create_table(Split(table), is_overview);
        HTML(`#${is_overview? '': 'table-'}${name}`, html);
    });
    translate_node('body');

    // 2) live tables
    for (let [node, box_node] of LIVE_TABLES) {
        let html = create_live_table(node.includes('live'), node.slice(-1));
        HTML(node, html.replace('{TEMP}', '<horis class="live-pv"></horis>'));
        HTML(box_node, html.replace('{TEMP}', ''));
    }

    // 3) mouse/touch scroll
    Events('.scroller', '!touchstart touchmove touchend', () => {});
    Events('.scroller', 'mousedown mouseenter mouseleave mousemove mouseup touchstart touchmove touchend', e => {
        if (!device.iphone)
            touch_handle(e);
    }, {passive: false});
}

/**
 * Download live data when the graph is ready
 * @param {function} callback called when all data has been loaded
 */
function download_live(callback) {
    let left = 4,
        section = 'live';
    if (section != Y.x)
        return;

    function _done() {
        left --;
        if (!left && callback)
            callback();
    }

    // evals
    let dico = {no_cache: true};
    download_table(section, 'data.json', null, data => {
        update_live_eval(section, data, 0);
        _done();
    }, dico);
    download_table(section, 'data1.json', null, data => {
        update_live_eval(section, data, 1);
        _done();
    }, dico);

    // live engines
    download_table(section, 'liveeval.json', null, data => {
        update_live_eval(section, data, 0);
        _done();
    }, dico);
    download_table(section, 'liveeval1.json', null, data => {
        update_live_eval(section, data, 1);
        _done();
    }, dico);
}

/**
 * Download static JSON for a table
 * + cache support = can load the data from localStorage if it was recent
 * @param {string} section archive, live
 * @param {string} url url
 * @param {string=} name table name
 * @param {function=} callback
 * @param {boolean=} add_delta calculate time delta, and add it to the data
 * @param {boolean=} no_cache force to skip the cache
 * @param {boolean=} only_cache only load data if it's cached
 * @param {boolean=} show open the table after wards
 */
function download_table(section, url, name, callback, {add_delta, no_cache, only_cache, show}={}) {
    function _done(data, cached) {
        if (DEV.json) {
            LS(`${url}:`);
            LS(data);
        }

        // if cached and table was already filled => skip
        let skip;
        if (cached) {
            let nodes = A(`#table-${name} tr`);
            skip = (nodes.length > 1);
        }

        // fill the table
        if (!skip) {
            if (callback)
                callback(data);
            else if (name) {
                update_table(section, name, data);
                if (show && section == Y.x) {
                    open_table(name);
                    let is_game = hashes[section].game;
                    add_timeout('scroll', () => {
                        scroll_adjust(Y.scroll || (is_game? '#overview': '#tables'));
                    }, TIMEOUT_scroll);
                }
            }
        }
    }

    let key,
        timeout = CACHE_TIMEOUTS[name];

    if (!no_cache && timeout) {
        // save cache separately for Live and Archive
        key = `table_${name}_${section}`;
        let cache = get_object(key);
        if (cache && (only_cache || Now() < cache.time + timeout)) {
            if (DEV.json)
                LS(`cache found: ${key} : ${Now() - cache.time} < ${timeout}`);
            _done(cache.data, true);
            return;
        }
        else if (DEV.json)
            LS(`no cache: ${key}`);
    }

    if (only_cache)
        return;

    // get the data
    Resource(`${url}?ts=${Now()}`, (code, data, xhr) => {
        if (code != 200)
            return;

        let now = Now(true);
        if (data && add_delta)
            data.delta = get_xhr_elapsed(xhr);

        if (key) {
            save_storage(key, {data: data, time: Floor(now)});
            if (DEV.json)
                LS(`cache saved: ${key}`);
        }
        _done(data, false);
    });
}

/**
 * Download static JSON files at startup
 * @param {boolean=} only_cache
 * @param {boolean=} no_live
 */
function download_tables(only_cache, no_live) {
    if (!only_cache)
        download_gamelist();

    let section = 'live';
    if (!only_cache && !no_live) {
        download_pgn(section, 'live.pgn');
        download_live();
    }

    let dico = {only_cache: only_cache};
    download_table(section, 'crosstable.json', 'cross', data => {
        analyse_crosstable(section, data);
    }, dico);
    download_table(section, 'schedule.json', 'sched', null, dico);
    download_table(section, 'tournament.json', 'tour', data => {
        analyse_tournament(section, data);
    }, dico);
}

/**
 * Filter table rows based on text matching
 * - only works if the table is active + paginated
 * @param {string} parent
 * @param {string} text
 * @param {string[]=} force
 */
function filter_table_rows(parent, text, force) {
    let [active, output] = force || get_active_tab(parent),
        section = Y.x,
        data_x = table_data[section][active];

    if (data_x) {
        data_x[`filter_${parent}`] = text;
        update_table(section, active, null, parent, {output: output});
    }
}

/**
 * Set the games filter
 * @param {string} text
 */
function set_games_filter(text) {
    _('#table-search .search').value = text;
    filter_table_rows('table', text, ['sched', 'sched']);
}

/**
 * Show filtered games
 * @param {string} text
 */
function show_filtered_games(text) {
    set_games_filter(text);
    add_timeout('table', () => {
        open_table('sched');
        scroll_adjust('#tables');
    }, TIMEOUT_search);
}

/**
 * Show tables depending on the event type
 * @param {string} section
 * @param {boolean=} is_cup
 */
function show_tables(section, is_cup) {
    if (section != Y.x || is_cup == old_cup)
        return;
    old_cup = is_cup;

    let active = get_active_tab('table')[0],
        parent = Id('tables'),
        target = (active == 'sched')? active: (is_cup? 'brak': 'stand');
    S('[data-x="brak"], [data-x="event"]', is_cup, parent);
    S('[data-x="cross"], [data-x="h2h"], [data-x="stand"]', !is_cup, parent);

    Class('div.tab', '-active', true, parent);
    Class(`[data-x="${target}"]`, 'active', true, parent);
    Hide('div.scroller', parent);
    Show(Id(`table-${target}`));
}

/**
 * Update a table by adding rows
 * - handles all the tables
 * @param {string} section archive, live
 * @param {string} name h2h, sched, stand, ...
 * @param {Object[]} rows if null then uses the cached table_data
 * @param {string=} parent chart, engine, quick, table
 * @param {string=} output output the result to another name
 * @param {boolean=} reset clear the table before adding data to it (so far always the case)
 */
function update_table(section, name, rows, parent='table', {output, reset=true}={}) {
    // 1) resolve shortcut
    let is_shortcut,
        source = name;
    if (name.slice(0, 8) == 'shortcut') {
        name = Y[name];
        is_shortcut = true;
        parent = 'quick';
    }

    // 2) update table data
    let data_x = SetDefault(table_data[section], name, {data: []}),
        data = data_x.data,
        is_sched = (name == 'sched'),
        // live cup has wrong Game# too
        is_sched_archive = (is_sched && (section == 'archive' || tour_info[section].cup)),
        page_key = `page_${parent}`,
        table = Id(`${(is_shortcut || parent == 'quick')? '': 'table-'}${output || source}`),
        body = _('tbody', table);

    if (!table)
        return;

    // wrap text?
    let wrap = Undefined(Y[`wrap_${name}`], Y.wrap);
    if (wrap == 'auto')
        wrap = Y.wrap;
    Style(body, 'white-space:nowrap', !wrap);

    // reset or append?
    // - except if rows is null
    if (reset) {
        HTML(body, '');
        if (rows) {
            data.length = 0;
            for (let pagin of PAGINATION_PARENTS) {
                data_x[`page_${pagin}`] = -1;
                data_x[`rows_${pagin}`] = -1;
            }
        }
    }

    if (rows) {
        if (!IsArray(rows))
            return;

        // translate row keys + calculate _id and _text
        rows.forEach((row, row_id) => {
            let lines = [];
            row = Assign({_id: row_id}, ...Keys(row).map(key => {
                let value = row[key];
                if (value)
                    lines.push(value + '');
                return {[create_field_value(key)[0]]: value};
            }));
            row._text = Lower(lines.join(' '));
            data.push(row);
        });

        // special case
        if (is_sched)
            calculate_estimates(section, data);
    }

    // 3) handle pagination + filtering
    let paginated,
        active_row = -1;

    if (PAGINATIONS[name]) {
        let [active] = get_active_tab(parent),
            page = data_x[page_key],
            row_page = Y.rows_per_page,
            total = data.length;

        if (active == name || is_shortcut) {
            let filter = data_x[`filter_${parent}`];
            if (filter) {
                let words = Lower(filter).split(' ');
                data = data.filter(item => words.every(word => item._text.includes(word)));
            }

            let node = Id(`${parent}-pagin`),
                num_row = data.length,
                num_page = Ceil(num_row / row_page);

            // find the active row + update initial page
            if (section == 'archive')
                active_row = Y.game - 1;
            else
                for (let row of data) {
                    if (!row.moves) {
                        active_row = row._id;
                        break;
                    }
                }

            if (active_row >= 0)
                data_x.row = active_row;
            if (page < 0)
                page = (active_row >= 0)? Floor(active_row / row_page): 0;
            page = Min(page, num_page - 1);

            if (node) {
                HTML('.row-filter', num_row, node);
                HTML('.row-total', total, node);
                Class('.active', '-active', true, node);
                Class(`[data-p="${page}"]`, 'active', true, node);
            }
            data_x[`rows_${parent}`] = num_row;
        }

        let start = page * row_page;
        data = data.slice(start, start + row_page);
        paginated = true;
        data_x[page_key] = page;
    }

    // 4) process all rows => render the HTML
    let columns = From(A('th', table)).map(node => node.dataset.x),
        is_cross = (name == 'cross'),
        is_game = (name == 'game'),
        is_winner = (name == 'winner'),
        nodes = [],
        tour_url = tour_info[section].url;

    for (let row of data) {
        let row_id = row._id;

        let vector = columns.map(key => {
            let class_ = '',
                td_class = '',
                value = row[key];

            if (value == undefined) {
                if (is_cross) {
                    if (row.abbrev == key)
                        td_class = 'void';
                    value = '';
                }
                else
                    value = '-';
            }

            // special cases
            switch (key) {
            case 'action':
            case 'decision':
            case 'reason':
                td_class = 'opening';
                break;
            case 'black':
                if (row.result == '0-1')
                    class_ = 'win';
                else if (row.result == '1-0')
                    class_ = 'loss';
                value = format_engine(value);
                break;
            case 'download':
            case 'pgn':
                value = `<a href="${HOST_ARCHIVE}/${value}"><i data-svg="download"></i></a>`;
                break;
            case 'engine':
            case 'runner':
            case 'winner':
                if (!is_winner) {
                    td_class = 'tal';
                    value = `<hori><img class="left-image" src="image/engine/${get_short_name(value)}.jpg"><div>${format_engine(value, row.num_break)}</div></hori>`;
                }
                break;
            case 'final_fen':
                if (value.length > 1)
                    td_class = 'fen';
                value = format_fen(value);
                break;
            case 'game':
            case 'gameno':
                let game = is_sched_archive? row_id + 1: value;
                if (row.moves || row.reason) {
                    value = create_game_link(section, game);
                    if (is_sched && tour_url)
                        value = `<hori><a href="${HOST_ARCHIVE}/${tour_url}_${game}.pgn"><i style="margin-right:1em" data-svg="download"></i></a>${value}</hori>`;
                }
                break;
            case 'name':
                if (row.link) {
                    let query = QueryString({query: row.link.split('?').slice(-1)[0], string: true});
                    value = `<a class="loss" href="#${query}">${value}</a>`;
                }
                break;
            case 'opening':
                td_class = 'opening';
                value = format_opening(value);
                break;
            case 'result':
                td_class = 'nowrap';
                value = value.replace(/1\/2/g, '½');
                break;
            case 'score':
                if (is_winner)
                    value = value.replace(/-/g, '<br>- ').replace('Abandonded', '-');
                else {
                    let numbers = Split(row.gamesno || '', ',');
                    value = value.split('').map((item, id) => {
                        return ` <a class="${SCORE_NAMES[item]}" title="${numbers[id] || 0}">${item.replace('=', '½')}</a>`;
                    }).join('');
                }
                break;
            case 'season':
                td_class = 'mono';
                let items = value.split(' '),
                    name = (items.length > 1)? `{${items[0]}} ${items[1]}`: value,
                    lines = [`<a class="season"><i data-t="${name}"></i> <i data-svg="down"></i></a>`];
                if (row.sub) {
                    lines.push('<grid class="dn">');
                    let subs = row.sub.sort((a, b) => (b.dno + '').localeCompare(a.dno + ''));
                    for (let sub of subs)
                        lines.push(
                            `<a class="sub" data-u="${sub.url}">${sub.menu}</a>`
                            + `<a href="${HOST_ARCHIVE}/${sub.abb}.pgn.zip"><i data-svg="download"></i></a>`
                        );
                    lines.push('</grid>');
                }
                value = lines.join('');
                break;
            case 'start':
                let [date, time] = FromTimestamp(value);
                value = `${row.started? '': '<i data-t="{Estd}: "></i>'}${time} <i class="year">20${date}</i>`;
                break;
            case 'termination':
                value = `<i data-t="${value}"></i>`;
                break;
            case 'white':
                if (row.result == '1-0')
                    class_ = 'win';
                else if (row.result == '0-1')
                    class_ = 'loss';
                value = format_engine(value);
                break;
            default:
                if (IsString(value)) {
                    if (is_cross && !td_class & key.length == 2)
                        td_class = 'mono';
                    else if (value.slice(0, 4) == 'http')
                        value = `<a href="${value}" class="url">${value}</a>`;
                }
            }

            if (class_)
                value = `<i class="${class_}">${value}</i>`;
            if (td_class)
                td_class = ` class="${td_class}"`;

            return `<td${td_class}>${value}</td>`;
        });

        // create a new row node
        let dico = null;
        if (is_game || is_sched || name == 'h2h')
            dico = {
                class: `pointer${row_id == active_row? ' active': ''}`,
                'data-g': row_id + 1,
            };

        let node = CreateNode('tr', vector.join(''), dico);
        nodes.push(node);
    }

    InsertNodes(body, nodes);
    update_svg(table);
    translate_node(table);

    // 5) add events
    if (name == 'season')
        set_season_events();

    // download game
    C('a[href]', function(e) {
        if (!this.href.includes('#'))
            SP(e);
    });
    // open game
    C('[data-g]', function(e) {
        if (Parent(e.target, {class_: 'fen', self: true}))
            return;
        if (cannot_click())
            return;

        if (this.tagName == 'TR') {
            Class('tr.active', '-active', true, table);
            Class(this, 'active');
        }
        let game = this.dataset.g * 1;
        Y.scroll = '#overview';
        if (section == 'archive') {
            save_option('game', game);
            open_game();
        }
        // make sure the game is over
        else if (_('a.game[href]', this))
            location.hash = create_game_link(section, game, '', true);
    }, table);

    // fen preview
    Events('td.fen', 'click mouseenter mousemove mouseleave', function(e) {
        if (e.type == 'click') {
            CopyClipboard(TEXT(this));
            let overlay = xboards.xfen.overlay;
            HTML(overlay,
                '<vert class="fcenter facenter h100">'
                    + `<div class="xcopy">${translate_default('COPIED')}</div>`
                + '</vert>'
            );
            Style(overlay, 'opacity:1;transition:opacity 0s');
        }
        else
            popup_custom('popup-fen', 'fen', e);
    });

    // 6) update shortcuts
    if (parent == 'table') {
        for (let id = 1; id <= 2; id ++) {
            // shortcut matches this table?
            let key = `shortcut_${id}`;
            if (name != Y[key])
                continue;

            if (!paginated || data_x.page_quick < 0)
                data_x.page_quick = data_x[page_key];
            update_table(section, key);
        }
    }

    // 7) create another table?
    if (!is_shortcut && is_sched)
        add_queue(section, parent);
}

// ARCHIVE
//////////

/**
 * Handle the seasons file
 * @param {Object} data
 */
function analyse_seasons(data) {
    let seasons = (data || {}).Seasons,
        section = 'archive',
        is_archive = (Y.x == section);
    if (!seasons)
        return;

    let link = current_archive_link(section),
        rows = Keys(seasons).reverse().map(key => Assign({season: isNaN(key)? key: `Season ${key}`}, seasons[key]));
    update_table(section, 'season', rows);

    // don't load an archive game unless we're in the archive
    if (is_archive) {
        let node = _(`[data-u="${link}"]`);
        if (!node)
            return;

        let parent = Parent(node, {tag: 'grid'});
        if (!parent)
            return;
        Class(node, 'active');
        Class(node.nextElementSibling, 'active');
        expand_season(parent.previousElementSibling, true);
        tour_info[section].link = link;
    }

    open_event(Y.x);
}

/**
 * Create an archive link with the default Y state
 * @param {string} section
 * @param {boolean=} is_game include the game= ...
 * @returns {string}
 */
function current_archive_link(section, is_game) {
    if (section == 'live')
        return tour_info[section].link;

    let keys = ARCHIVE_KEYS;
    if (!is_game)
        keys = keys.slice(0, -1);
    return keys.filter(key => Y[key]).map(key => `${key}=${Y[key]}`).join('&');
}

/**
 * Download the game list, necessary for the archive and for the game links in Live
 */
function download_gamelist() {
    download_table('archive', 'gamelist.json', 'season', analyse_seasons);
}

/**
 * Expand / collapse a season
 * @param {Node} node
 * @param {boolean=} show if not defined, then toggle
 */
function expand_season(node, show) {
    let next = node.nextElementSibling;
    if (show == undefined)
        Toggle(next);
    else
        S(next, show);
    Style('svg.down', `transform:${Visible(next)? 'rotate(-90deg)': 'none'}`, true, node);
}

/**
 * Open an event
 * - show the event games
 * - open various tables
 * @param {string} section
 * @param {function=} callback
 */
function open_event(section, callback) {
    let data_x = table_data.archive.season;
    if (!data_x)
        return;

    let found,
        data = data_x.data,
        info = Assign(tour_info[section], {
            cup: 0,
            eventtag: '',
            frc: 0,
        }),
        link = current_archive_link(section);

    Keys(data).forEach(key => {
        let subs = data[key].sub;
        Keys(subs).forEach(sub_key => {
            let sub = subs[sub_key];
            if (sub.url == link) {
                found = sub.abb;
                Assign(info, data[key]);
                return;
            }
        });
        if (found)
            return;
    });

    Assign(info, {
        link: link,
        url: found,
    });
    if (!found || section != 'archive')
        return;

    let dico = {no_cache: true},
        event_tag = info.eventtag,
        prefix = `${HOST_ARCHIVE}/${found}`;

    // cup?
    show_tables(section, !!event_tag);
    if (event_tag) {
        if (bracket_link != event_tag)
            download_table(section, `${HOST_ARCHIVE}/${event_tag}_Eventcrosstable.cjson`, 'brak', data => {
                create_cup(section, data, true);
                bracket_link = event_tag;
            }, dico);
    }
    else
        download_table(section, `${prefix}_Crosstable.cjson`, 'cross', data => {
            analyse_crosstable(section, data);
        }, dico);

    download_table(section, `${prefix}_crash.xjson`, 'crash', null, dico);
    download_table(section, `${prefix}_Enginerating.egjson`, null, null, dico);
    download_table(section, `${prefix}_Schedule.sjson`, 'sched', null, {...{show: !event_tag}, ...dico});

    open_game();
    if (callback)
        callback();
}

/**
 * Open an archived game
 */
function open_game() {
    let info = tour_info.archive,
        event = info.url;
    if (!event)
        return;

    if (Y.season && (Y.div || Y.round || Y.stage) && Y.game) {
        push_state();
        check_hash();
    }
    if (Y.game)
        download_pgn('archive', `${HOST_ARCHIVE}/${event}_${Y.game}.pgn`);
}

/**
 * Set table-season events
 */
function set_season_events() {
    let table = Id('table-season');

    // expand/collapse
    C('.season', function() {
        if (cannot_click())
            return;
        expand_season(this);
    }, table);

    // open games
    C('a[data-u]', function() {
        if (cannot_click())
            return;

        // 'season=18&div=l3' or 'season=cup5&round=round16'
        let dico = {...{div: '', round: '', stage: ''}, ...QueryString({query: this.dataset.u})};
        Keys(dico).forEach(key => {
            save_option(key, dico[key]);
        });
        save_option('game', 1);

        set_games_filter('');
        Y.scroll = '#tables';
        open_event('archive');

        Class('a.active', '-active', true, table);
        Class(this, 'active');
        Class(this.nextElementSibling, 'active');
    }, table);

    // hover
    Events('#table-season a', 'mouseenter mouseleave', function(e) {
        Class('a.hover', '-hover');
        if (e.type == 'mouseenter') {
            Class(this, 'hover');
            Class(this.dataset.u? this.nextElementSibling: this.previousElementSibling, 'hover');
        }
    });
}

// BRACKETS / TOURNAMENT
////////////////////////

/**
 * Handle tournament data
 * @param {string} section archive, live
 * @param {Object} data
 */
function analyse_tournament(section, data) {
    let tour = tour_info[section];
    Assign(tour, data);
    if (DEV.cup)
        tour.cup = 6;

    if (tour.cup)
        download_table(section, 'Eventcrosstable.json', 'brak', data => {
            create_cup(section, data);
        }, {no_cache: true});

    open_event(section);
    update_table(section, 'sched', null);
    if (DEV.global)
        window.tour_info = tour_info;
}

/**
 * Calculate the seeds
 * - assume the final will be 1-2 then work backwards
 * - support non power of 2 => 0 will be the 'skip' seed
 * @param {number} num_team
 * @param {number=} new_mode
 * @returns {number[]}
 */
function calculate_seeds(num_team, new_mode) {
    let number = 2,
        nexts = [1, 2];

    while (number < num_team) {
        number *= 2;
        let seeds = [];
        for (let i = 0; i < number; i ++) {
            let value = (i % 2)? (new_mode? (number/2 + seeds[i - 1]) % (number + 1): (number + 1 - seeds[i - 1])): nexts[Floor(i / 2)];
            seeds[i] = (value <= num_team)? value: 0;
        }
        nexts = seeds;
    }

    return nexts;
}

/**
 * Calculate tournament stats
 * - called after sched data is available, so, from queued tables
 * - called after calculate_estimates
 * @param {string} section archive, live
 * @param {Object[]=} rows
 */
function calculate_event_stats(section, rows) {
    if (!rows) {
        let data_x = table_data[section].sched;
        if (!data_x)
            return;
        rows = data_x.data;
    }

    let crashes = 0,
        games = 0,
        length = rows.length,
        max_moves = [-1, 0],
        max_time = [-1, 0],
        min_moves = [Infinity, 0],
        min_time = [Infinity, 0],
        moves = 0,
        results = {
            '0-1': 0,
            '1-0': 0,
            '1/2-1/2': 0,
        },
        seconds = 0,
        start = length? rows[0].start: '';

    for (let row of rows) {
        let game = row._id + 1,
            move = row.moves;
        if (!move)
            continue;

        // 01:04:50 => seconds
        let time = parse_time(row.duration);

        games ++;
        moves += move;
        results[row.result] = (results[row.result] || 0) + 1;
        seconds += time;

        if (max_moves[0] < move)
            max_moves = [move, game];
        if (min_moves[0] > move)
            min_moves = [move, game];

        if (max_time[0] < time)
            max_time = [time, game];
        if (min_time[0] > time)
            min_time = [time, game];
    }

    let stats = event_stats[section],
        [end_date, end_time] = FromTimestamp(stats._end),
        [start_date, start_time] = FromTimestamp(start);

    Assign(stats, {
        //
        start_time: `${start_time} <i class="year">20${start_date}</i>`,
        end_time: `${end_time} <i class="year">20${end_date}</i>`,
        duration: format_hhmmss(stats._duration),
        //
        white_wins: `${results['1-0']} [${format_percent(results['1-0'] / games)}]`,
        black_wins: `${results['0-1']} [${format_percent(results['0-1'] / games)}]`,
        draws: `${results['1/2-1/2']} [${format_percent(results['1/2-1/2'] / games)}]`,
        //
        average_moves: Round(moves / games),
        min_moves: `${min_moves[0]} [${create_game_link(section, min_moves[1])}]`,
        max_moves: `${max_moves[0]} [${create_game_link(section, max_moves[1])}]`,
        //
        average_time: format_hhmmss(seconds / games),
        min_time: `${format_hhmmss(min_time[0])} [${create_game_link(section, min_time[1])}]`,
        max_time: `${format_hhmmss(max_time[0])} [${create_game_link(section, max_time[1])}]`,
        //
        games: `${games}/${length}`,
        progress: length? format_percent(games/length): '-',
        crashes: crashes,
    });

    // create the table
    let lines = Keys(stats)
        .filter(key => (key[0] != '_'))
        .map(key => {
            let title = Title(key.replace(/_/g, ' '));
            return `<vert class="stats faround"><div class="stats-title" data-t="${title}"></div><div>${stats[key]}</div></vert>`;
        });

    let node = Id('table-stats');
    HTML(node, lines.join(''));
    translate_node(node);
}

/**
 * Calculate the estimated times
 * - called when new schedule data is available
 * @param {string} section
 * @param {Object[]} rows
 */
function calculate_estimates(section, rows) {
    let games = 0,
        last = 0,
        seconds = 0;

    for (let row of rows) {
        let start = row.start,
            time = row.duration;
        if (!start)
            continue;

        if (time) {
            // 01:04:50 => seconds
            let [hour, min, sec] = time.split(':');
            time = hour * 3600 + min * 60 + sec * 1;
            games ++;
            seconds += time;
        }
        row.start = parse_date_time(start);
        row.started = true;
        last = row.start;
    }
    if (!last)
        return;

    // 18:18:54 on 2020.05.06
    // => '2020.05.06 18:18:54': can be parsed by javascript correctly
    let average = seconds / games,
        offset = average;

    // set the estimates
    for (let row of rows) {
        if (row.start)
            continue;

        row.start = last + offset;
        offset += average;
    }

    // update some stats
    let start = rows[0].start;

    Assign(event_stats[section], {
        _duration: last + offset - start,
        _end: last + offset,
        _start: start,
    });
}

/**
 * Create the brackets
 * @param {string} section archive, live
 * @param {Object=} data
 */
function create_bracket(section, data) {
    if (section != Y.x)
        return;

    // 1) create seeds
    let game = 1,
        lines = ['<hori id="bracket" class="fastart noselect pr">'],
        matches = data.matchresults || [],
        forwards = Assign({}, ...matches.map(item => ({[`${item[0].name}|${item[1].name}`]: [item[0].origscore, item[1].origscore]}))),
        reverses = Assign({}, ...matches.map(item => ({[`${item[1].name}|${item[0].name}`]: [item[1].origscore, item[0].origscore]}))),
        teams = data.teams,
        num_team = teams.length,
        prev_finished = true,
        round = 0,
        round_results = data.results[0] || [],
        seeds = calculate_seeds(num_team * 2, tour_info[section].cup >= 6);

    // assign seeds
    teams.forEach((team, id) => {
        team[0].seed = seeds[id * 2];
        team[1].seed = seeds[id * 2 + 1];
    });

    // 2) create each round
    for (let number = num_team; number >= 1; number /= 2) {
        let name = ROUND_NAMES[number] || `Round of ${number * 2}`,
            nexts = [],
            number2 = (number == 1)? 2: number,
            // only good to know if the game has ended or not
            results = round_results[round] || [];

        lines.push(
            `<vert class="rounds fstart h100">`
            + `<div class="round" data-t="${name}"></div>`
            + `<vert class="${number == 1? 'fcenter final': 'faround'} h100" data-r="${round}">`
        );
        for (let i = 0; i < number2; i ++) {
            let finished = false,
                link = ROUND_LINKS[number] || `round${number * 2}`,
                names = [0, 0],
                result = results[i] || [],
                scores = [0, 0],
                team = teams[i];

            if (!result[0] && !result[1])
                result = [];

            if (team) {
                // get the real scores + check if a game has finished
                let key = `${team[0].name}|${team[1].name}`,
                    exist = forwards[key] || reverses[key];
                if (exist) {
                    if (result[0] != undefined && result[1] != undefined)
                        finished = true;
                    result = exist;
                }

                team.forEach((item, id) => {
                    let class_ = '',
                        seed = item.seed,
                        short = get_short_name(item.name);

                    if (result[0] != result[1])
                        class_ = (item.winner && result[id] > result[1 - id])? ' win': ' loss';

                    names[id] = [
                        class_,
                        seed?
                        `<hori title="${item.name}">`
                            + `<img class="match-logo" src="image/engine/${short}.jpg">`
                            + `<div class="seed">#${seed}</div><div>${resize_text(short, 17)}</div>`
                        + '</hori>' : '',
                        short,
                    ];
                    scores[id] = [
                        class_,
                        result[id],
                        seed,
                        (number == 1 && finished && class_)? (i * 2 + (class_ == ' win'? 1: 2)): 0,
                    ];

                    // propagate the winner to the next round
                    if (finished) {
                        if (class_ == ' win')
                            SetDefault(nexts, Floor(i / 2), [{}, {}])[i % 2] = item;
                        // match for 3rd place
                        else if (class_ == ' loss' && number == 2)
                            SetDefault(nexts, 1, [{}, {}])[i % 2] = item;
                    }

                    if (number == 1 && i == 1)
                        link = ROUND_LINKS[3];
                });
            }

            let is_current = (prev_finished && !finished),
                active_class = is_current? ' active': '',
                done_class = finished? ' done': '',
                undone_class = finished? '': ' undone';

            lines.push(
                `<vert class="match fastart" data-n="${names[0]? names[0][2]: ''}|${names[1]? names[1][2]: ''}" data-r="${link}">`
                    // final has 3rd place game too
                    + `<div class="match-title${active_class || done_class}">#${game + (number == 1? 1 - i * 2: 0)}</div>`
                    + `<grid class="match-grid${done_class}">`
            );

            for (let id = 0; id < 2; id ++) {
                let [name_class, name] = names[id] || [],
                    [score_class, score, seed, place] = scores[id] || [];

                if (!name) {
                    name = 'TBD';
                    score = '--';
                    name_class = ' none';
                    score_class = ' none';
                }
                else
                    name_class += ' fastart';

                if (place)
                    place = ` data-p="${place}"`;
                seed |= 0;

                // game in progress or not yet started?
                if (score == undefined)
                    score = is_current? 0: '--';

                lines.push(
                    `<vert class="name${name_class}${undone_class} fcenter" data-s="${seed}">${name}</vert>`
                    + `<vert class="score${score_class}${undone_class} fcenter" data-s="${seed}"${place}>${score}</vert>`
                );
            }

            lines.push(
                    '</grid>'
                + '</vert>'
            );
            prev_finished = finished;
            game ++;
        }
        lines.push(
                '</vert>'
            + '</vert>'
        );

        round ++;
        teams = nexts;
    }

    // 3) result
    lines.push('<div id="svgs"></div></hori>');
    let node = Id('table-brak');
    HTML(node, lines.join(''));
    translate_node(node);

    // 4) swap active in final round
    let nodes = A('.final .match-title');
    if (HasClass(nodes[0], 'active') && !HasClass(nodes[1], 'done')) {
        Class(nodes[0], '-active');
        Class(nodes[1], 'active');
    }

    resize_bracket(true);
}

/**
 * Create a connector
 * @param {Node} curr
 * @param {number} id
 * @param {Node[]} nexts
 * @param {string} target
 * @param {number[]} coeffs
 * @returns {Node}
 */
function create_connector(curr, id, nexts, target, coeffs) {
    // if there's a winner => connect the winner, otherwise the center
    curr = _(`.score.${target}`, curr) || curr;
    let next = nexts[Floor(id / 2)],
        seed = curr.dataset.s;
    if (seed != undefined)
        next = _(`[data-s="${seed}"]`, next) || next;
    else {
        let subs = From(A('.name[data-s]', next)).filter(node => node.dataset.s == '0');
        if (subs.length == 1)
            next = subs[0];
    }
    if (!next)
        return null;

    // create the SVG
    let ax = curr.offsetLeft + curr.clientWidth,
        ay = curr.offsetTop + curr.offsetHeight / 2,
        bx = next.offsetLeft,
        by = next.offsetTop + next.offsetHeight / 2,
        x2 = bx - ax,
        mm = x2 * coeffs[1] / (coeffs[0] + coeffs[1]),
        y2 = by - ay,
        y1 = 1.5 + (y2 < 0? -y2: 0),
        yy = Abs(y2),
        path = CreateSVG('path', {
            d: `M${0} ${y1}L${mm} ${y1}L${mm} ${y2 + y1}L${x2} ${y2 + y1}`,
            fill: 'none',
        }),
        style = `height:${yy + 3}px;left:${ax}px;top:${Min(ay, by) - 1.5}px;width:${x2}px`,
        viewbox = `0 0 ${x2} ${yy + 3}`;

    return CreateSVG('svg', {class: `connect ${target}`, 'data-s': seed, style: style, viewBox: viewbox}, [path]);
}

/**
 * Create bracket connectors
 * + medals
 */
function create_connectors() {
    let parent = Id('bracket'),
        svg_node = Id('svgs'),
        svgs = [];

    for (let round = 0; ; round ++) {
        let nexts = A(`[data-r="${round + 1}"] .match-grid`, parent);
        if (!nexts.length)
            break;

        let currs = A(`[data-r="${round}"] .match-grid`, parent),
            final = _(`[data-r="${round + 2}"]`, parent)? 0: 1;
        currs.forEach((curr, id) => {
            for (let [offset, target, coeffs] of CONNECTORS[final]) {
                let svg = create_connector(curr, id + offset, nexts, target, coeffs);
                if (svg)
                    svgs.push(svg);
            }
        });
    }

    let medals = create_medals(parent);
    svgs = [...svgs, ...medals];

    HTML(svg_node, '');
    InsertNodes(svg_node, svgs);

    // mouse hover
    Events('[data-s]', 'click mouseenter mouseleave', function(e) {
        Class('[data-s]', 'high', false, parent);
        if (e.type != 'mouseleave')
            Class(`[data-s="${this.dataset.s}"]`, 'high', true, parent);
    }, null, parent);
}

/**
 * Create a cup
 * @param {string} section archive, live
 * @param {Object=} data
 * @param {boolean=} show
 */
function create_cup(section, data, show) {
    // 1) check data
    let tour = tour_info[section];
    if (data)
        tour.data = data;
    else
        data = tour.data;
    if (!data)
        return;

    show_tables(section, true);

    // 2) create the bracket
    let event = data.EventTable;
    if (event) {
        let rows = Keys(event).map(key => {
            return Assign({round: key.split(' ').slice(-1)}, event[key]);
        });
        update_table(section, 'event', rows);
    }

    create_bracket(section, data);
    if (show)
        open_table('brak');

    // 3) cup events
    // click on a match => load its games
    C('.match', function() {
        if (cannot_click())
            return;
        let dataset = this.dataset,
            names = Split(dataset.n),
            round = dataset.r;
        if (!names[0] || !names[1])
            return;

        let text = names.join(' ');
        Y.game = 0;
        if (Y.round != round) {
            Y.round = round;
            Y.scroll = '#tables';
            open_event(section, () => {show_filtered_games(text);});
        }
        else
            show_filtered_games(text);
    });
}

/**
 * Create svg medals
 * @param {Node} parent
 * @returns {Node[]}
 */
function create_medals(parent) {
    return From(A('[data-p]', parent)).map(node => {
        let ax = node.offsetLeft + node.clientWidth,
            ay = node.offsetTop + node.offsetHeight / 2,
            data = node.dataset,
            place = data.p,
            html = [
                `<div class="place-svg">${create_svg_icon(place < 4? 'trophy': 'medal')}</div>`,
                `<div class="place-text">#${place}</div>`,
            ].join(''),
            style = `left:${ax + 4}px;top:${ay}px`;
        return CreateNode('hori', html, {class: `place place${place} fastart`, 'data-s': data.s, style: style});
    });
}

/**
 * Resize the bracket + redo the connectors
 * @param {boolean=} force
 */
function resize_bracket(force) {
    let window_width = window.innerWidth;
    if (!force && old_width)
        if ((window_width > 640 && old_width > 640) || (window_width <= 640 && old_width <= 640))
            return;

    let node = Id('table-brak'),
        round = A('.rounds', node).length,
        width = (window_width <= 640)? (204 + 18) * round + 20: (227 + 38) * round + 10;

    old_width = window_width;
    Style(node.firstChild, `height:${node.clientHeight}px;width:${width}px`);
    create_connectors();
}

// PGN
//////

/**
 * Check the adjudication
 * @param {Object} dico
 * @param {number} total_moves
 * @returns {Object} 50, draw, win
 */
function check_adjudication(dico, total_moves) {
    if (dico)
        dico = dico.adjudication || dico;
    if (!dico)
        return {};
    let _50 = Undefined(dico.R50, dico.FiftyMoves),
        abs_draw = Abs(Undefined(dico.Rd, dico.Draw)),
        abs_win = Abs(Undefined(dico.Rr, dico.ResignOrWin));

    return {
        50: (_50 < 51)? _50: '-',
        draw: (abs_draw <= 10 && total_moves > 58)? `${Max(abs_draw, 69 - total_moves)}p`: '-',
        win: (abs_win < 11)? abs_win: '-',
    };
}

/**
 * Check if some moves are missing => reload live.pgn
 * @param {number=} ply
 * @param {string=} round used by live_eval
 * @param {number=} pos used by player_eval, last finished pos, if different then it's a new game
 */
function check_missing_moves(ply, round, pos) {
    if (!Y.reload_missing || LOCALHOST)
        return;
    let section = Y.x;
    if (section != 'live')
        return;

    let new_game,
        main = xboards.live,
        now = Now(true),
        delta = now - main.time;

    // tricks to detect a new game during live eval
    if (round)
        main.round2 = round;
    if (pos && main.pos && pos != main.pos) {
        new_game = main.pos;
        main.pos = pos;
    }

    if (delta < TIMEOUT_live_reload)
        return;

    if (new_game || (main.round2 && main.round != main.round2)) {
        if (DEV.new)
            LS(`round=${main.round} => ${main.round2} : pos=${new_game} => ${main.pos}`);
    }
    else {
        let empty = -1,
            moves = main.moves,
            num_move = moves.length;

        if (ply && !moves[ply - 1])
            empty = ply - 1;
        else
            for (let i = num_move - 1; i >= 0; i --)
                if (!moves[i]) {
                    empty = i;
                    break;
                }

        if (empty < 0)
            return;
        if (DEV.new)
            LS(`empty=${empty} : delta=${delta}`);
    }

    add_timeout(section, () => {
        Y.scroll = '';
        download_pgn(section, 'live.pgn', true);
    }, TIMEOUT_live_delay * 1000);
}

/**
 * Download live evals for the current even + a given round
 * @param {number} round
 */
function download_live_evals(round) {
    if (!round)
        return;

    let section = 'archive',
        event = tour_info[section].url;
    if (!event)
        return;

    let prefix = `${HOST_ARCHIVE}/${Lower(event)}_liveeval`;
    download_table(section, `${prefix}_${round}.json`, null, data => {
        update_live_eval(section, data, 0);
    });
    download_table(section, `${prefix}1_${round}.json`, null, data => {
        update_live_eval(section, data, 1);
    });
}

/**
 * Download the PGN
 * @param {string} section archive, live
 * @param {string} url live.pgn, live.json
 * @param {boolean=} reset_moves triggered by check_missing_moves
 */
function download_pgn(section, url, reset_moves) {
    if (DEV.new)
        LS(`download_pgn: ${section} : ${url} : ${reset_moves}`);

    let main = xboards[section];
    main.time = Now(true);
    clear_timeout(section);

    let no_cache = (section == 'live')? `?ts=${Now()}`: '';

    Resource(`${url}${no_cache}`, (code, data, xhr) => {
        if (code != 200)
            return;

        let extra = {};
        if (data) {
            Assign(extra, {
                elapsed: get_xhr_elapsed(xhr) / 1000,
                gameChanged: 1,
            });
        }

        main.pgn = {};
        update_pgn(section, data, extra, reset_moves);

        if (section == 'archive' && Y.scroll)
            scroll_adjust(Y.scroll);
    }, {type: 'text'});
}

/**
 * Extract thread count from the options
 * @param {Object} options
 * @returns {number|string}
 */
function extract_threads(options) {
    // 1) quick way
    let threads = options.Threads || options.CPUs;
    if (threads) {
        threads = parseInt(threads);
        if (threads)
            return threads;
    }

    // 2) slow way: check all keys
    let find = [0, undefined];
    Keys(options).forEach(key => {
        let match = THREAD_KEYS[Lower(key).replace(/ /g, '_')];
        if (match && match > find[0]) {
            let value = parseInt(options[key]);
            if (value) {
                find[0] = match;
                find[1] = value;
            }
        }
    });

    return find[0]? find[1]: '';
}

/**
 * Parse raw pgn data
 * @param {string} section
 * @param {string|Object} data
 * @param {number=} mode &1:header, &2:options, &4:moves
 * @param {string=} origin debug information
 * @returns {Object}
 */
function parse_pgn(section, data, mode=7, origin='') {
    if (!data)
        return null;

    // A) maybe we have a JSON already?
    if (IsObject(data))
        return data;

    try {
        data = JSON.parse(data);
        return data;
    }
    catch (e) {
    }

    // B) parse the raw PGN
    let end, inside, start,
        headers = {},
        num_header = 0,
        length = data.length,
        pgn = {};

    // 1) headers
    for (let i = 0; i < length; i ++) {
        let char = data[i];
        if (inside) {
            if (char == ']' && '\r\n '.includes(data[i + 1])) {
                if (start) {
                    // Date "2020.05.25"
                    let text = data.slice(start, i),
                        pos = text.indexOf('"'),
                        pos2 = text.lastIndexOf('"');
                    if (pos > 0 && pos2 > pos) {
                        let left = text.slice(0, pos),
                            right = text.slice(pos + 1, pos2);
                        headers[left.trim()] = right.trim();
                        num_header ++;
                    }
                    end = i + 1;
                    start = 0;
                }
                inside = false;
            }
        }
        else if (char == '[') {
            inside = true;
            start = i + 1;
        }
        else if (num_header && !' \r\n'.includes(char)) {
            end = i;
            break;
        }
    }
    if (!Keys(headers).length)
        return null;

    // fix FEN for FRC (archive)
    let fen = headers.FEN;
    if (fen) {
        let board = xboards[section] || xboards.pva;
        headers.FEN = board.chess_load(fen) || fen;
    }

    pgn.Headers = headers;
    if (!(mode & 6))
        return pgn;

    data = data.slice(end);

    // 2) options
    let pos = data.indexOf('{'),
        pos2 = data.indexOf('}');
    if (pos >= 0 && pos2 > pos) {
        let left = data.slice(0, pos).replace(/\s+/g, '');
        if (!left) {
            let engines = data.slice(pos + 1, pos2).split(';, ');
            for (let engine of engines) {
                let [name, options] = engine.split(':');
                if (options) {
                    options = Assign({}, ...options.split(';').map(item => {
                        let items = item.split('=');
                        return {[items[0].trim()]: items.slice(1).join('').trim()};
                    }));
                    delete options[''];
                    pgn[name] = options;
                }
            }
            data = data.slice(pos2 + 1);
        }
    }
    if (!(mode & 4))
        return pgn;

    // 3) moves
    let has_text,
        info = {},
        moves = [],
        ply = -1;
    length = data.length;
    start = 0;
    for (let i = 0 ; i < length; i ++) {
        let char = data[i];

        if (char == '{') {
            let pos = data.indexOf('}', i + 1);
            if (pos) {
                info = Assign({}, ...data.slice(i + 1, pos).split(',').map(text => {
                    let [left, right] = text.split('=');
                    if (right == undefined)
                        right = true;
                    else if (isNaN(right) || right.includes('.'))
                        right = right.trim();
                    else
                        right = parseInt(right);
                    return {[left.trim()]: right};
                }));
                delete info[''];

                // pv: Be3 b5 dxc5 Nxc5
                // => 16. Be3 b5 17. dxc5 Nxc5
                let pv = info.pv;
                if (pv && !pv.includes('.')) {
                    pv = pv.split(' ').map((item, id) => {
                        let curr = id + ply,
                            is_white = (curr % 2 == 0),
                            move_num = Floor(curr / 2) + 1;
                        if (!id)
                            return `${move_num}.${is_white? ' ': '..'}${item}`;
                        return `${is_white? move_num: ''}${is_white? '. ': ''}${item}`;
                    }).join(' ');
                    info.pv = pv;
                }
                Assign(moves[ply], info);

                i = pos;
                start = i + 1;
                has_text = false;
            }
        }
        else if (char == '.') {
            if (has_text) {
                let number = parseInt(data.slice(start, i));
                // error detected!!
                if (number != (ply + 1) / 2 + 1) {
                    LS(`ERROR: ${origin} : ${ply} : ${number}`);
                    LS(headers);
                    return null;
                }
            }
            start = i + 1;
            has_text = false;
        }
        else if (' \t\r\n'.includes(char)) {
            if (has_text) {
                let move = data.slice(start, i);
                if (RESULTS[move] != undefined)
                    break;

                ply ++;
                moves[ply] = {
                    m: move,
                    ply: ply,
                };
                info = {};
                if (DEV.fen)
                    LS(`${ply} : ${move}`);
            }
            start = i + 1;
            has_text = false;
        }
        else
            has_text = true;
    }

    // 4) result
    if (!headers.Opening && headers.Variant)
        headers.Opening = headers.Variant;

    pgn.Moves = moves;
    if (DEV.fen)
        LS(pgn);
    return pgn;
}

/**
 * Parse the time control
 * @param {string} value
 * @returns {[string, Object]}
 */
function parse_time_control(value) {
    let mins,
        moves = 0,
        items = value.split('+'),
        secs = 0;

    if (items.length >= 2) {
        mins = items[0] * 1;
        secs = items[1] * 1;
        value = `${mins / 60}'+${secs}"`;
    }
    else {
        items = value.split('/');
        moves = items[0] * 1;
        mins = items[1] * 1;
        value = `${moves}/${mins}'`;
    }

    return [
        value, {
            tc: mins,
            tc2: secs,
            tc3: moves,
        },
    ];
}

/**
 * Resize game elements
 */
function resize_game() {
    Keys(xboards).forEach(key => {
        let board = xboards[key];
        if (!board.main && !board.sub)
            return;

        let area = get_area(board.node),
            width = area.clientWidth,
            size = Clamp(width / Max(board.sub, 1) - 4, 196);
        board.instant();
        board.resize(size);
    });

    show_board_info(Y.x);
    resize_3d();
}

/**
 * Update material info
 * mb=+2+0+0+0+0, => +p+n+b+r+q
 * @param {Move} move
 */
function update_materials(move) {
    if (!move)
        return;

    let material = move.material || move.mb,
        materials = [[], []];

    // no material => calculate it
    if (!material) {
        let fen = move.fen;
        if (!fen)
            return;

        let stats = [0, 0, 0, 0, 0];
        for (let char of fen.split(' ')[0]) {
            let lower = Lower(char),
                pos = 'pnbrq'.indexOf(lower);
            if (pos >= 0) {
                stats[pos] += (lower == char)? -1: 1;
            }
        }
        move.mb = stats.map(item => `${item >= 0? '+': ''}${item}`).join('');
        material = move.mb;
    }

    // parse the material
    let invert = (Y.material_color == 'invert')? 1: 0,
        is_string = IsString(material),
        size = 28,
        [piece_size, style] = xboards.live.get_piece_background(size),
        scale = size / piece_size;

    'qrbnp'.split('').forEach((key, j) => {
        let pos = (4 - j) * 2,
            value = is_string? parseInt(material.slice(pos, pos + 2)): material[key];
        if (!value)
            return;

        let id = (value > 0)? 0: 1,
            id2 = invert? 1 - id: id;

        for (let i = 0; i < Abs(value); i ++) {
            let offset = -SPRITE_OFFSETS[id2? Upper(key): key] * piece_size;
            materials[id].push(
                `<div style="height:${size}px;width:${size}px;transform:scale(${scale})">`
                    + `<div style="${style};background-position-x:${offset}px"></div>`
                + '</div>'
            );
        }
    });

    for (let id = 0; id < 2; id ++) {
        let node = Id(`material${id}`),
            html = HTML(node),
            material = materials[id].join('');
        if (html != material)
            HTML(node, material);
    }
}

/**
 * Update mobility
 */
function update_mobility() {
    let main = xboards[Y.x],
        ply = main.ply,
        move = main.moves[ply] || {};

    let mobility = main.chess_mobility(move),
        node = Id('mobil'),
        [goal, gply] = move.goal || [];

    if (node) {
        HTML(node, isNaN(goal)? '?': `${goal < 0? '-': ''}G${Abs(goal)}`);
        node.dataset.i = gply;
    }
    HTML(`#mobil${1 - ply % 2}`, Abs(mobility));
}

/**
 * Update engine info from a move
 * @param {string} section
 * @param {number} ply
 * @param {Move} move
 * @param {boolean=} fresh is it the latest move?
 */
function update_move_info(section, ply, move, fresh) {
    if (!move)
        return;

    fix_move_format(move);

    let is_book = move.book,
        depth = is_book? '-': Undefined(move.d, '-'),
        eval_ = is_book? 'book': Undefined(move.wv, '-'),
        id = (ply + 2) % 2,
        main = xboards[section],
        num_ply = main.moves.length,
        players = main.players,
        stats = {
            depth: is_book? '-': `${depth}/${Undefined(move.sd, depth)}`,
            eval: format_eval(eval_, true),
            node: is_book? '-': FormatUnit(move.n, '-'),
            speed: is_book? '-': `${FormatUnit(move.s, '0')}nps`,
            tb: is_book? '-': FormatUnit(move.tb, '-'),
        };

    Keys(stats).forEach(key => {
        HTML(Id(`${key}${id}`), stats[key]);
    });

    if (fresh || Y.x == 'archive') {
        let player = players[id];
        player.eval = eval_;

        if (!isNaN(move.tl))
            Assign(player, {
                elapsed: 0,
                left: move.tl * 1,
                time: move.mt * 1,
            });
    }

    // past move?
    if (ply < num_ply - 1)
        update_clock(section, id, move);
    else {
        update_clock(section, 0);
        update_clock(section, 1);
    }
}

/**
 * Update PV info from a player move
 * - move contains pv.Moves with fen info for each move, so we can use this
 * @param {string} section archive, live
 * @param {number} ply
 * @param {Move} move
 */
function update_move_pv(section, ply, move) {
    if (!move)
        return;

    let is_book = move.book,
        eval_ = is_book? 'book': move.wv,
        id = (ply + 2) % 2,
        board = xboards[`pv${id}`],
        box_node = _(`#box-pv${id} .status`),
        main = xboards[section],
        player = main.players[id],
        node = Id(`moves-pv${id}`),
        status_eval = is_book? '': format_eval(move.wv),
        status_score = is_book? 'book': calculate_probability(player.short, eval_, ply, move.wdl || (player.info || {}).wdl);

    if (Y.eval) {
        for (let child of [box_node, node]) {
            HTML(`[data-x="eval"]`, status_eval, child);
            HTML(`[data-x="score"]`, status_score, child);
        }
        HTML(`.xcolor${id} .xeval`, format_eval(eval_, true), main.node);
    }

    // PV should jump directly to a new position, no transition
    board.reset();
    board.instant();

    if (move.pv) {
        if (IsString(move.pv))
            board.add_moves_string(move.pv, main.ply, true);
        else
            board.add_moves(move.pv.Moves, main.ply);
    }
    else {
        // no pv available =>
        // - delete it if the move is in the past (ex: "book")
        // - keep it if this is the latest move, as we don't want to see PV disappearing
        // TODO: try to readjust the existing PV to match the current move
        if (ply < main.moves.length - 1) {
            board.moves[ply] = move;
            board.set_ply(ply);
        }
    }
}

/**
 * Update engine options
 * - find hardware info
 * - when a new game has started
 * - when switching between archive & live
 * @param {string} section
 */
function update_options(section) {
    let main = xboards[section],
        pgn = main.pgn,
        players = main.players;

    for (let id = 0; id < 2; id ++) {
        let key = `${WB_TITLES[id]}EngineOptions`,
            pgn_options = pgn[key];
        if (!pgn_options)
            continue;

        // legacy support: pgjson
        if (IsArray(pgn_options)) {
            pgn_options = Assign({}, ...pgn_options.map(option => ({[option.Name]: option.Value})));
            pgn[key] = pgn_options;
        }

        // find threads + tb
        let threads = extract_threads(pgn_options),
            info = [threads? `${threads}TH`: '', ''];
        Keys(pgn_options).forEach(key => {
            let value = pgn_options[key];
            if (IsString(value)) {
                let pos = value.indexOf('/syzygy');
                if (pos >= 0) {
                    let next = value[pos + 7];
                    info[1] = `${'34567'.includes(next)? next: 6}Men TB`;
                }
            }
        });

        players[id].options = {...pgn_options};
        update_hardware(section, id, null, null, info.join(' ').trim(), [Id(`moves-pv${id}`)]);
    }
}

/**
 * Update basic overview info, before adding the moves
 * @param {string} section
 * @param {Object} headers
 */
function update_overview_basic(section, headers) {
    if (!headers)
        return;
    if (section != Y.x)
        return;

    let main = xboards[section],
        overview = Id('overview'),
        players = main.players;

    // 1) overview
    Split('ECO|Event|Opening|Result|Round|TimeControl').forEach(key => {
        let value = Undefined(headers[key], '');
        key = Lower(key);

        switch (key) {
        // TCEC Season 17 => S17
        case 'event':
            value = value.replace('TCEC Season ', 'S');
            break;
        case 'result':
            value = value.replace(/1\/2/g, '½');
            break;
        case 'timecontrol':
            if (value) {
                key = 'tc';
                let dico;
                [value, dico] = parse_time_control(value);
                Assign(players[0], dico);
                Assign(players[1], dico);
            }
            break;
        }

        HTML(`td[data-x="${key}"]`, value, overview);
    });

    // 2) engines
    WB_TITLES.forEach((title, id) => {
        let box_node = _(`#box-pv${id} .status`),
            name = headers[title],
            node = Id(`moves-pv${id}`),
            player = players[id],
            short = get_short_name(name),
            src = `image/engine/${short}.jpg`;

        Assign(player, {
            elo: headers[`${title}Elo`],
            feature: Undefined(ENGINE_FEATURES[short], 0),
            name: name,
            short: short,
        });
        update_hardware(section, id, name, short, null, [box_node, node]);

        HTML(Id(`engine${id}`), format_engine(name, true, 21));
        HTML(`.xcolor${id} .xshort`, short, xboards[section].node);

        // load engine image
        let image = Id(`logo${id}`);
        if (image && image.src != src) {
            image.onerror = function() {
                this.src = 'image/tcec2.jpg';
            };
            image.src = src;
        }
    });
    update_scores(section);

    // 3) update title if needed
    let subtitle = (section == 'live')? 'Live Computer Chess Broadcast': 'Archived Game',
        title = `${players[0].name} vs ${players[1].name} - TCEC - ${subtitle}`;
    if (document.title != title)
        document.title = title;
}

/**
 * Update overview info, after adding the moves
 * @param {string} section
 * @param {Object} headers
 * @param {Move[]} moves
 * @param {boolean=} is_new have we received new moves (from update_pgn)?
 * @returns {boolean} finished
 */
function update_overview_moves(section, headers, moves, is_new) {
    if (!headers)
        return;

    let finished,
        overview = Id('overview'),
        is_live = (section == 'live'),
        main = xboards[section],
        players = main.players,
        cur_ply = main.ply,
        num_move = moves.length,
        num_ply = main.moves.length,
        move = moves[num_move - 1],
        ply = get_move_ply(move),
        who = num_ply % 2;                      // num_ply % 2 tells us who plays next

    // 1) clock
    // time control could be different for white and black
    for (let id = 0; id < 2; id ++) {
        let tc = headers[`${WB_TITLES[id]}TimeControl`];
        if (tc) {
            let dico = parse_time_control(tc)[1];
            Assign(players[id], dico);
        }
    }
    update_time_control(section, who);

    if (section != Y.x)
        return;

    // 2) update the visible charts
    update_player_charts(null, moves);

    // 3) check adjudication
    if (move && move.fen) {
        let tb = Lower(move.fen.split(' ')[0]).split('').filter(item => 'bnprqk'.includes(item)).length - 6;
        if (tb <= 1)
            tb = `<a href="${TB_URL.replace('{FEN}', move.fen.replace(/ /g, '_'))}" target="_blank">${tb}</a>`;
        HTML('td[data-x="tb"]', tb, overview);
    }

    let result = check_adjudication(move, num_ply),
        status = headers.Termination;
    finished = headers.TerminationDetails;
    // support for old seasons
    if (!finished && status && status != 'unterminated')
        finished = status;

    result.adj_rule = finished;
    Keys(result).forEach(key => {
        HTML(`td[data-x="${key}"]`, result[key], overview);
    });

    S('[data-x="adj_rule"]', finished, overview);
    S('[data-x="50"], [data-x="draw"], [data-x="win"]', !finished, overview);
    if (finished) {
        let result = headers.Result;
        if (is_live && is_new)
            play_sound(audiobox, (result == '1/2-1/2')? Y.sound_draw: Y.sound_win);
        if (DEV.new)
            LS(`finished: result=${result} : is_live=${is_live} : is_new=${is_new}`);
        main.set_last(result);
    }
    else
        main.set_last(main.last);

    // 4) materials
    // - only update if the ply is the current one
    if (ply == cur_ply) {
        for (let i = num_move - 1; i >= 0 && i >= num_move - 2; i --) {
            let move = moves[i],
                ply2 = get_move_ply(move);
            update_move_info(section, ply2, move, true);
            update_move_pv(section, ply2, move);
        }
        update_materials(move);
    }

    return finished;
}

/**
 * Update the PGN
 * - white played => lastMoveLoaded=109
 * @param {string} section archive, live
 * @param {string|Object} data
 * @param {Object} extras
 * @param {boolean=} reset_moves triggered by check_missing_moves
 * @returns {boolean}
 */
function update_pgn(section, data, extras, reset_moves) {
    let main = xboards[section],
        pgn = parse_pgn(section, data);
    if (!pgn)
        return false;
    Assign(pgn, extras);

    // 0) trim keys, ex: " WhiteEngineOptions": ...
    Keys(pgn).forEach(key => {
        let trim = key.trim();
        if (key != trim) {
            pgn[trim] = pgn[key];
            delete pgn[key];
        }
    });

    // 1) section check
    main.pgn = pgn;

    let finished,
        headers = pgn.Headers,
        is_same = (section == Y.x),
        moves = pgn.Moves,
        new_game = pgn.gameChanged,
        num_move = moves.length,
        overview = Id('overview'),
        players = main.players;

    if (headers) {
        if (section == 'archive')
            download_live_evals(headers.Round);
        if (headers.FEN && headers.SetUp)
            pgn.frc = headers.FEN;
    }

    // 2) update overview
    if (pgn.Users)
        HTML('td[data-x="viewers"]', pgn.Users, overview);
    if (is_same)
        update_overview_basic(section, headers);

    // TODO: what's the utility of this?
    if (new_game) {
        if (DEV.new)
            LS(`new pgn: ${headers.Round}`);
        pgn.gameChanged = 0;
        new_game = 0;
    }

    // 3) check for a new game
    if (main.event != headers.Event || main.round != headers.Round) {
        if (DEV.new) {
            LS(`new game: ${main.round} => ${headers.Round} : num_ply=${main.moves.length} : num_move=${num_move} : reset_moves=${reset_moves}`);
            LS(pgn);
        }

        main.reset(1, pgn.frc);
        if (is_same) {
            reset_sub_boards(7, pgn.frc);
            reset_charts();
        }
        new_game = (main.event && main.round)? 2: 1;
        main.event = headers.Event;
        main.round = headers.Round;

        update_move_info(section, 0, {});
        update_move_info(section, 1, {});
        players[0].info = {};
        players[1].info = {};

        if (reset_moves && !LOCALHOST)
            add_timeout('tables', () => {download_tables(false, true);}, TIMEOUTS.tables);
    }
    // can happen after resume
    else if (reset_moves) {
        HTML(main.xmoves, '');
        HTML(main.pv_node, '');
    }

    // 4) add the moves
    main.add_moves(moves);
    check_missing_moves();
    main.time = Now(true);

    if (is_same)
        finished = update_overview_moves(section, headers, moves, true, true);

    // remove moves that are after the last move
    // - could have been sent by error just after a new game started
    let last_move = main.moves[main.moves.length - 1];
    if (is_same && last_move)
        slice_charts(last_move.ply);

    update_mobility();
    add_timeout('arrow', redraw_arrows, Y.arrow_history_lag);

    // got player info => can do h2h
    check_queued_tables();

    if (new_game) {
        // 2: a new game was started and we already had a game before
        if (new_game == 2) {
            for (let id = 0; id < 2; id ++) {
                let player = players[id];
                Assign(player, {
                    elapsed: 0,
                    left: player.tc * 1000,
                    time: 0,
                });
            }
            add_queue(section, 'table');
        }
        else {
            for (let id = 0; id < 2; id ++) {
                let player = players[id];
                if (!player.elapsed)
                    player.elapsed = 0;
                if (!player.left)
                    player.left = player.tc * 1000;
                if (!player.time)
                    player.time = 0;
            }
        }
        update_options(section);
    }

    // 5) clock
    if (section == 'live' && last_move) {
        let who = 1 - last_move.ply % 2;
        if (!new_game)
            players[who].time = 0;
        start_clock(who, finished, pgn.elapsed || 0);
    }
    return true;
}

/**
 * Update players' score in the UI
 * @param {string} section
 */
function update_scores(section) {
    let main = xboards[section],
        players = main.players;
    for (let id = 0; id < 2; id ++) {
        let player = players[id];
        HTML(Id(`score${id}`), `${Undefined(player.score, '-')} (${Undefined(player.elo, '-')})`);
    }
}

/**
 * Update time control, player-specific
 * @param {string} section
 * @param {number} id
 */
function update_time_control(section, id) {
    let main = xboards[section],
        player = main.players[id],
        mins = Round(player.tc / 60);
    HTML(`#overview td[data-x="tc"]`, player.tc3? `${player.tc3}/${mins}'`: `${mins}'+${player.tc2}"`);
}

// LIVE ACTION / DATA
/////////////////////

/**
 * Analyse a log line that contains a PV
 * @param {string} line
 */
function analyse_log(line) {
    if (!Y.live_pv)
        return;

    // 1) get engine name
    let pos = line.indexOf(' '),
        pos2 = line.indexOf(': ');
    if (pos < 0 || pos2 <= pos)
        return;

    let left = line.slice(pos + 1, pos2),
        pos3 = left.lastIndexOf('(');
    if (pos3 <= 0)
        return;

    let id,
        engine = left.slice(0, pos3),
        main = xboards.live,
        players = main.players;

    if (engine == players[0].name)
        id = 0;
    else if (engine == players[1].name)
        id = 1;
    else
        return;

    // 2) analyse info
    let info = {
            engine: engine,
            id: id,
        },
        items = line.slice(pos2 + 2).split(' '),
        num_item = items.length,
        player = players[id];

    for (let i = 0; i < num_item; i ++) {
        let key = items[i],
            log_key = LOG_KEYS[key];
        if (!log_key)
            continue;

        let [number, type] = log_key,
            value,
            values = [];
        i ++;
        for (let j = 0; i < num_item && (number < 0 || j < number); j ++) {
            let item = items[i];
            if (LOG_KEYS[item])
                break;
            values.push(item);
            i ++;
        }
        i --;
        if (number == 1) {
            value = values[0];
            if (type == 1)
                value = DefaultInt(value, value);
            else if (type == 2)
                value = DefaultFloat(value, value);
        }
        else
            value = values.join(' ');
        info[key] = value;

        // invert scores when black
        if (key == 'cp')
            info.eval = (value / 100) * (id == 1? -1: 1);
        else if (key == 'wdl' && id == 1)
            info.wdl = value.split(' ').reverse().join(' ');
    }

    player.info = info;
    if (Y.x != 'live')
        return;

    // 3) update eval + WDL
    if (!DEV.wasm) {
        if (Y.eval && info.eval != undefined) {
            let box_node = _(`#box-pv${id} .status`),
                node = Id(`moves-pv${id}`),
                status_eval = format_eval(info.eval),
                status_score = calculate_probability(player.short, info.eval, main.moves.length, info.wdl);

            for (let child of [box_node, node]) {
                HTML(`[data-x="eval"]`, status_eval, child);
                HTML(`[data-x="score"]`, status_score, child);
            }
        }
    }
    // 4) update PV (need chess.wasm)
    else if (main.wasm) {
        LS(info.pv);
        main.chess.load(main.fen);
        let moves = main.chess.multiUci(info.pv, false);
        info.moves = new Array(moves.size()).fill(0).map((_, id) => moves.get(id));
        LS(info);
        update_player_eval('live', info);
    }
}

/**
 * Clock countdown
 * @param {number} id
 */
function clock_tick(id) {
    let main = xboards.live,
        now = Now(true),
        player = main.players[id],
        elapsed = (now - player.start) * 1000,
        left = player.left - elapsed,
        // try to synchronise it with the left time
        timeout = Floor(left) % 1000 - 1;

    if (isNaN(timeout))
        return;

    if (timeout < 50)
        timeout += 100;

    player.elapsed = elapsed;
    update_clock('live', id);
    add_timeout(`clock${id}`, () => {clock_tick(id, now);}, timeout);
}

/**
 * Set the number of viewers
 * @param {number} count
 */
function set_viewers(count) {
    HTML('#overview td[data-x="viewers"]', count);
}

/**
 * Start the clock for one player, and stop it for the other
 * @param {number} id
 * @param {boolean} finished if true, then both clocks are stopped
 * @param {number} delta elapsed time since pgn creation
 */
function start_clock(id, finished, delta) {
    if (Y.x != 'live')
        return;

    S(Id(`cog${id}`), !finished);
    Hide(`#cog${1 - id}`);

    let main = xboards.live,
        node = main.node,
        player = main.players[id];
    S(`.xcolor${id} .xcog`, !finished, node);
    Hide(`.xcolor${1 - id} .xcog`, node);

    stop_clock([0, 1]);
    // handle Chat player
    main.manual = (!finished && (player.feature & 256));

    if (!finished) {
        Assign(player, {
            elapsed: 0.000001,
            start: Now(true) - player.time / 1000 - delta,
        });
        clock_tick(id);
    }
}

/**
 * Stop the clock(s)
 * @param {number[]} ids
 */
function stop_clock(ids) {
    for (let id of ids)
        clear_timeout(`clock${id}`);
}

/**
 * Update the left + time UI info
 * @param {string} section
 * @param {number} id
 * @param {Move} move move from the past
 */
function update_clock(section, id, move) {
    let elapsed, left, time,
        main = xboards[section],
        player = main.players[id],
        same = (section == Y.x);

    if (move) {
        elapsed = 0;
        left = move.tl;
        time = move.mt / 1000;
    }
    else {
        // looking at the past => don't update anything
        if (main && main.ply < main.moves.length - 1)
            return;

        elapsed = player.elapsed;
        left = player.left;
        time = Round((elapsed > 0? elapsed: player.time) / 1000);
    }

    left = isNaN(left)? '-': FromSeconds(Round((left - elapsed) / 1000)).slice(0, -1).map(item => Pad(item)).join(':');
    time = isNaN(time)? '-': FromSeconds(time).slice(1, -1).map(item => Pad(item)).join(':');

    if (same) {
        HTML(Id(`remain${id}`), left);
        HTML(Id(`time${id}`), time);
    }
    player.sleft = left;
    player.stime = time;

    let mini = _(`.xcolor${id}`, main.node);
    if (same) {
        HTML(`.xleft`, left, mini);
        HTML(`.xtime`, time, mini);
    }
}

/**
 * Update hardware info
 * @param {string} section
 * @param {number} id
 * @param {string} engine
 * @param {string} short
 * @param {string} hardware
 * @param {Node[]} nodes
 */
function update_hardware(section, id, engine, short, hardware, nodes) {
    let main = xboards[section],
        player = main.players[id];
    engine = engine || player.name;
    if (!engine)
        return;

    short = short || player.short || get_short_name(engine);
    if (hardware)
        player.hardware = hardware;

    let full_engine = `${engine}\n${player.hardware}`;
    for (let child of nodes) {
        let node = _('[data-x="name"]', child);
        if (node && node.title != full_engine) {
            HTML(node, short);
            Attrs(node, {title: full_engine});
            Assign(player, {
                feature: Undefined(ENGINE_FEATURES[short], 0),
                name: engine,
                short: short,
            });
        }
    }
}

/**
 * Update data from one of the Live engines
 * - data contains a PV string, but no FEN info => this fen will be computed only when needed
 * @param {string} section archive, live
 * @param {Object} data
 * @param {number} id 0, 1
 * @param {number=} force_ply update with this data.pv even if there's more recent text + forces invert_black
 * @returns {boolean}
 */
function update_live_eval(section, data, id, force_ply) {
    if (section != Y.x || !data)
        return false;

    let board = xboards[`live${id}`],
        desc = data.desc,
        engine = data.engine,
        main = xboards[section],
        moves = data.moves,
        round = data.round,
        wdl = data.wdl;

    // maybe old data?
    if (round && round != main.round) {
        if (DEV.new)
            LS(`maybe old data => SKIP: ${round} vs ${main.round}`);
        return false;
    }

    if (moves) {
        // ply is offset by 1
        for (let move of moves) {
            // LS(`move.ply=${move.ply} : ${split_move_string(move.pv)[0]}`);
            board.evals[move.ply - 1] = move;
            move.invert = true;
        }
        data = moves[moves.length - 1];
    }
    else if (data)
        data.invert = force_ply;

    let box_node = _(`#box-live${id} .status`),
        cur_ply = main.ply,
        eval_ = data.eval,
        node = Id(`table-live${id}`),
        [ply] = split_move_string(data.pv);

    board.evals[ply] = data;

    // live engine is not desired?
    if (!Y[`live_engine_${id + 1}`]) {
        HTML('.live-pv', `<i>${translate_default('off')}</i>`, node);
        return false;
    }

    // update engine name if it has changed
    engine = engine || data.engine;
    let short = get_short_name(engine);
    update_hardware(section, id + 2, engine, short, desc, [box_node, node]);

    // invert eval for black?
    if (data.invert && data.ply % 2 == 0)
        eval_ = invert_eval(eval_);

    if (ply == cur_ply + 1 || force_ply) {
        let is_hide = !Y.eval,
            dico = {
                depth: data.depth,
                eval: is_hide? 'hide*': format_eval(eval_),
                node: FormatUnit(data.nodes),
                score: is_hide? 'hide*': calculate_probability(short, eval_, ply, wdl),
                speed: data.speed,
                tb: FormatUnit(data.tbhits),
            };

        Keys(dico).forEach(key => {
            let value = dico[key];
            if (value == 'hide*')
                return;

            for (let child of [box_node, node])
                HTML(`[data-x="${key}"]`, Undefined(value, '-'), child);
        });
    }

    if (force_ply)
        board.text = '';
    board.add_moves_string(data.pv, force_ply);

    update_live_chart(moves || [data], id + 2);
    check_missing_moves(ply, round);
    return true;
}

/**
 * Update data from a Player
 * - data contains a PV string, but no FEN info => this fen will be computed only when needed
 * @param {string} section archive, live
 * @param {Object} data
 * @returns {boolean}
 */
function update_player_eval(section, data) {
    if (!Y.live_pv || section != Y.x)
        return false;

    let main = xboards[section],
        cur_ply = main.ply,
        engine = data.engine,
        eval_ = data.eval,
        id = Undefined(data.id, data.color),
        mini = _(`.xcolor${id}`, main.node),
        node = Id(`moves-pv${id}`),
        player = main.players[id],
        short = get_short_name(engine);

    // 1) update the live part on the left
    let dico = {
        eval: format_eval(eval_),
        score: calculate_probability(short, eval_, cur_ply, data.wdl || (player.info || {}).wdl),
    };

    // update engine name if it has changed
    update_hardware(section, id, engine, short, null, [node]);

    Keys(dico).forEach(key => {
        HTML(`[data-x="${key}"]`, dico[key], node);
    });

    HTML(`.xshort`, short, mini);
    HTML(`.xeval`, format_eval(eval_), mini);

    // 2) add moves
    let board = xboards[`pv${id}`],
        moves = data.moves;
    if (moves && moves.length) {
        data.ply = moves[0].ply;
        board.reset();
        board.instant();
        board.add_moves(moves, cur_ply);
        LS(`added ${moves.length} moves : ${data.ply} <> ${cur_ply}`);
        LS(board.moves);
    }
    else {
        data.ply = split_move_string(data.pv)[0];
        board.add_moves_string(data.pv);
    }

    if (DEV.eval) {
        LS(`PE#${id} : cur_ply=${cur_ply} : ply=${data.ply}`);
        LS(data);
    }

    // 3) update the engine info in the center
    // - only if the ply is the currently selected ply + 1
    if (data.ply == cur_ply + 1) {
        let stats = {
            depth: data.depth,
            engine: format_engine(data.engine, true, 21),
            eval: format_eval(eval_, true),
            logo: short,
            node: FormatUnit(data.nodes),
            speed: (data.nps != undefined)? `${FormatUnit(data.nps)}nps`: data.speed,
            tb: FormatUnit(data.tbhits),
        };
        Keys(stats).forEach(key => {
            HTML(Id(`${key}${id}`), stats[key]);
        });
    }

    board.evals[data.ply] = data;
    update_live_chart([data], id);
    check_missing_moves(data.ply, null, data.pos);
    return true;
}

// INPUT / OUTPUT
/////////////////

/**
 * Handle keys, when input is not active
 * @param {number} code hardware keycode
 * @param {Object=} active active input element, if any
 */
function action_key_no_input(code, active) {
}

/**
 * Handle keys, when input is not active
 * @param {number} code hardware keycode
 */
function game_action_key(code) {
    if (is_overlay_visible()) {
        let changes = 0,
            modal_node = Id('modal'),
            parent = Visible(modal_node)? modal_node: Id('modal2'),
            items = From(A('.item', parent)).filter(item => Visible(item)),
            length = items.length,
            index = (items.findIndex(item => HasClass(item, 'selected')) + length) % length,
            node = items[index],
            tag = node.tagName,
            is_grid = HasClass(node.parentNode, 'grid');

        switch (code) {
        // escape, e
        // case 27:
        case 69:
            LS(`game_action_key: ${code}`);
            if (Visible(Id('modal2')))
                show_modal(true);
            else
                resume_sleep();
            break;
        // enter, space, x
        case 13:
        case 32:
        case 83:
            node.click();
            break;
        // left
        case 37:
            if (tag == 'DIV' && is_grid) {
                node = node.nextElementSibling;
                tag = node.tagName;
            }
            if (tag == 'SELECT') {
                node.selectedIndex = (node.selectedIndex - 1 + node.options.length) % node.options.length;
                changes ++;
            }
            else if (tag == 'INPUT') {
                let min = parseInt(node.min);
                if (isNaN(min) || node.value > min) {
                    node.value --;
                    changes ++;
                }
            }
            break;
        // up
        case 38:
            index = (index - 1 + length) % length;
            break;
        // right
        case 39:
            if (tag == 'DIV' && is_grid) {
                node = node.nextElementSibling;
                tag = node.tagName;
            }
            if (tag == 'SELECT') {
                node.selectedIndex = (node.selectedIndex + 1) % node.options.length;
                changes ++;
            }
            else if (tag == 'INPUT') {
                let max = parseInt(node.max);
                if (isNaN(max) || node.value < max) {
                    node.value ++;
                    changes ++;
                }
            }
            break;
        // down
        case 40:
            index = (index + 1) % length;
            break;
        }

        // changed a setting?
        if (changes && node.name)
            change_setting(node.name, node.value);

        // moved?
        Class('.selected', '-selected', true, parent);
        Class(items[index], 'selected');
    }
    else if (!KEYS[code]) {
        switch (code) {
        // left
        case 37:
            clear_timeout('click_play');
            board_target.hold = 'prev';
            board_target.hold_button('prev', 0);
            break;
        // right
        case 39:
            clear_timeout('click_play');
            board_target.hold = 'next';
            board_target.hold_button('next', 0);
            break;
        // c, v, y, z
        case 67:
        case 86:
        case 89:
        case 90:
            if (KEYS[17])
                if (code == 67) {
                    // selected text => skip
                    let select = getSelection();
                    if (select && select.toString())
                        break;

                    if (!copy_moves()) {
                        let text = board_target.fen;
                        CopyClipboard(text);
                        if (Y.auto_paste)
                            paste_text(text);
                    }
                }
                // paste => try to add the FEN, if fails then moves string
                else if (code == 86) {
                    if (board_target.manual)
                        navigator.clipboard.readText().then(text => {
                            paste_text(text);
                        });
                }
                // redo/undo
                else
                    restore_history(code == 89? 1: -1);
            break;
        }

        HTML(Id('keycode'), code);
    }
}

/**
 * Handle a keyup
 * @param {number} code
 */
function game_action_keyup(code) {
    switch (code) {
    // left
    case 37:
        clear_timeout('click_prev');
        break;
    // right
    case 39:
        clear_timeout('click_next');
        break;
    }

    if ([37, 39].includes(code))
        Keys(xboards).forEach(key => {
            xboards[key].hold = null;
        });
}

/**
 * Paste text to PVA
 * @param {string} text
 */
function paste_text(text) {
    text = text.replace(/\s+/g, ' ');

    let board = board_target.manual? board_target: xboards.pva;
    if (!board.set_fen(text, true))
        board.add_moves_string(text);
}

// 3D SCENE
///////////

/**
 * Initialise the 3D engine
 */
function init_3d_special() {
    load_model('pieces', 'export/pieces-draco.glb', object => {
        cube = object;
        scene.add(cube);
    });
}

/**
 * Random position for looking at the chessboard
 * @returns {Object}
 */
function random_position() {
    return {x: -1.34, y: -1.98, z: 0.97};
}

// EVENTS
/////////

/**
 * Changed a game setting
 * - called by change_setting_special
 * @param {string} name
 * @param {*} value
 */
function change_setting_game(name, value) {
    let prefix = name.split('_')[0],
        section = Y.x,
        main = xboards[section];

    // using exact name
    switch (name) {
    case 'analysis_chessdb':
    case 'analysis_evalguide':
    case 'analysis_lichess':
        let parent = Parent(context_target, {class_: 'xboard'});
        if (parent) {
            let board = xboards[parent.id],
                url = ANALYSIS_URLS[name.split('_')[1]];
            if (board)
                window.open(url.replace('{FEN}', board.fen), '_blank');
        }
        break;
    case 'copy_moves':
        copy_moves();
        break;
    case 'material_color':
        update_materials(main.moves[main.ply]);
        break;
    case 'show_ply':
        Keys(xboards).forEach(key => {
            let board = xboards[key];
            if (!board.main)
                board.compare_duals(main.ply);
        });
        break;
    case 'status':
        show_board_info(Y.x);
        break;
    case 'status_pva':
        show_board_info('pva');
        break;
    }

    // using prefix
    switch (prefix) {
    case 'arrow':
        redraw_arrows();
        break;
    case 'wrap':
        update_table(section, get_active_tab('table')[0], null, 'table');
        break;
    }
}

/**
 * Hash was changed => check if we should load a game
 */
function changed_hash() {
    let section = Y.x;
    show_tables(section, tour_info[section].cup);

    let missing = 0,
        string = ARCHIVE_KEYS.map(key => {
            let value = Y[key];
            if (value == undefined)
                missing ++;
            return `${key}=${value}`;
        }).join('&');

    if (missing || game_link == string)
        return;

    // new game link detected => try to load it
    if (DEV.load)
        LS(`changed_hash: ${game_link} => ${string} : ${missing}`);
    game_link = string;

    if (section == 'live')
        open_event(section);

    if (DEV.global)
        window.xboards = xboards;
}

/**
 * The section was changed archive <-> live
 */
function changed_section() {
    let section = Y.x,
        is_cup = tour_info[section].cup;
    assign_boards();

    old_cup = null;
    show_tables(section, is_cup);

    // click on the active tab, ex: schedule, stats
    // - if doesn't exist, then active the default tab
    let active = get_active_tab('table')[2];
    if (active && Visible(active))
        open_table(active);
    else {
        active = is_cup? 'brak': DEFAULT_ACTIVES[section];
        open_table(active);
    }

    // reset some stuff
    reset_sub_boards(3);
    reset_charts();

    if (section == 'live')
        download_live(redraw_eval_charts);
    else {
        let hash = hashes[section];
        if (Y.archive_scroll && !hash.game) {
            if (!['sched', 'season'].includes(get_active_tab('table')[0]))
                open_table('season');
            scroll_adjust('#tables');
        }
        if (hash.game) {
            set_games_filter('');
            Y.scroll = '#overview';
            open_event(section);
        }
    }

    // update overview
    let main = xboards[section],
        headers = main.pgn.Headers;
    update_overview_basic(section, headers);
    update_overview_moves(section, headers, xboards[section].moves);
    update_options(section);
}

/**
 * Copy moves list to the clipboard
 * @returns {string}
 */
function copy_moves() {
    let target = Parent(context_target, {class_: 'live-pv|xmoves', self: true});
    if (!target)
        return '';

    let text = target.innerText.replace(/\s/g, ' ');
    if (text.slice(0, 3) == '0. ')
        text = text.slice(3);
    if (text.slice(-2) == ' *')
        text = text.slice(0, -2);
    CopyClipboard(text);
    if (Y.auto_paste)
        paste_text(text);
    return text;
}

/**
 * Handle xboard events
 * @param {XBoard} board
 * @param {string} type
 * @param {Event|string} value
 */
function handle_board_events(board, type, value) {
    let section = Y.x;

    switch (type) {
    case 'activate':
        board_target = board;
        // used for CTRL+C
        context_target = HasClasses(value, 'live-pv|xmoves')? value: null;
        break;
    // controls: play, next, ...
    case 'control':
        board_target = board;
        if (value == 'cube') {
            board.mode = (board.mode == 'html')? 'text': 'html';
            board.render(3);
        }
        else if (value == 'rotate') {
            show_board_info(board.name);
            redraw_arrows();
            order_boards();
        }
        break;
    // move list => ply selected
    case 'move':
        board_target = board;
        if (value != undefined && !Visible(board.vis))
            open_table(board.tab);
        break;
    // PV list was updated => next move is sent
    // - if move is null, then hide the arrow
    case 'next':
        if (!xboards[section].hold)
            check_draw_arrow(board);
        break;
    // ply was set
    // !! make sure it's set manually
    case 'ply':
        if (board.name == section) {
            // update main board stats
            let cur_ply = board.ply,
                prev_ply = cur_ply - 1,
                prev_move = board.moves[prev_ply];
            update_move_info(section, prev_ply, prev_move);
            update_move_info(section, cur_ply, value);

            // show PV's
            // - important to reset the boards to prevent wrong compare_duals
            reset_sub_boards(1);
            update_move_pv(section, prev_ply, prev_move);
            update_move_pv(section, cur_ply, value);

            // show live engines
            update_live_eval(section, xboards.live0.evals[cur_ply], 0, cur_ply);
            update_live_eval(section, xboards.live1.evals[cur_ply], 1, cur_ply);

            update_materials(value);
            update_mobility();
            if (Y.arrow_moves == 'all')
                add_timeout('arrow', redraw_arrows, Y.arrow_history_lag);

            update_time_control(section, (cur_ply + 3) % 2);
        }
        break;
    }
}

/**
 * Select a tab and open the corresponding table
 * @param {string|Node} sel
 */
function open_table(sel) {
    let tab = sel;

    if (IsString(tab)) {
        tab = _(`[data-x="${sel}"]`);
        if (!tab)
            tab = _(`[data-x="table-${sel}"]`);
    }
    if (!tab)
        return;

    let parent = Parent(tab, {class_: 'tabs'}),
        target = tab.dataset.x;

    // table?
    if (parent.id == 'table-tabs') {
        Y.table_tab[Y.x] = target;
        save_option('table_tab');

        // TODO: ugly hack, fix this later
        if (target.slice(0, 6) != 'table-')
            target = `table-${target}`;

        for (let child of Id('tables').children)
            if (!HasClass(child, 'tabs') && child.id.slice(0, 6) == 'table-')
                Hide(child);
    }

    // deactivate other tabs
    E('.tab', node => {
        let context_area = context_areas[node.dataset.x];
        if (context_area)
            context_area[2] &= ~2;
        Class(node, '-active');
        Hide(Id(node.dataset.x));
    }, parent);

    // activate 1 tab
    Class(tab, 'active');
    let context_area = context_areas[target];
    if (context_area)
        context_area[2] |= 2;

    save_option('areas');

    let key = target,
        node = Id(target);
    Show(node);

    // further processing
    if (key.slice(0, 6) == 'table-')
        key = key.slice(6);
    opened_table(node, key, tab);
}

/**
 * Special handling after user clicked on a tab
 * @param {Node} node table node
 * @param {string} name
 * @param {Node} tab
 */
function opened_table(node, name, tab) {
    // 1) save the tab
    let parent = Parent(tab).id,
        is_chart = _('canvas', node),
        section = Y.x,
        main = xboards[section];
    if (DEV.open)
        LS(`opened_table: ${parent}/${name}`);

    // 2) special cases
    if (is_chart && charts[name] && main) {
        update_player_charts(name, main.moves);
        update_chart_options(name, 3);
    }

    switch (name) {
    case 'brak':
        create_cup(section);
        break;
    case 'crash':
        download_table(section, 'crash.json', name);
        break;
    case 'cross':
        analyse_crosstable(section, table_data[section].crossx);
        break;
    case 'info':
        HTML(node, HTML(Id('desc')));
        break;
    case 'log':
        fill_combo('#nlog', [0, 5, 10, 'all'], Y.live_log);
        listen_log();
        break;
    case 'season':
        download_gamelist();
        break;
    case 'stats':
        calculate_event_stats(section);
        break;
    case 'winner':
        download_table(section, 'winners.json', name);
        break;
    default:
        update_table(section, name);
    }

    check_paginations();
    show_board_info(section);

    if (virtual_opened_table_special)
        virtual_opened_table_special(node, name, tab);
}

/**
 * Show a popup with the engine info
 * @param {string} id popup id
 * @param {string} name timeout name
 * @param {Event} e
 * @param {string|number} scolor 0, 1, popup
 */
function popup_custom(id, name, e, scolor) {
    if (e.buttons)
        return;

    let num_col, show,
        popup = Id(id),
        type = e.type;

    if (type == 'mouseleave')
        show = false;
    else if (scolor == 'popup')
        show = true;
    else {
        if (name == 'engine') {
            let main = xboards[Y.x],
                pgn = main.pgn,
                headers = pgn.Headers;
            if (!headers)
                return;

            let players = main.players,
                player = players[scolor],
                engine = Split(player.name),
                options = players[scolor].options || {},
                lines = Keys(options).sort((a, b) => Lower(a).localeCompare(Lower(b))).map(key => [key, options[key]]);

            // add engine + version
            lines.splice(0, 0, ['Engine', engine[0]], ['Version', engine.slice(1).join(' ')]);
            lines = lines.map(([left, right]) => {
                return `<div><div>${resize_text(left, 20)}</div><div class="indent">${resize_text(right, 20) || '&nbsp;'}</div></div>`;
            });

            num_col = Ceil(lines.length / 11);
            HTML(popup, `<verts class="list fastart">${lines.join('')}</verts>`);
        }
        else if (name == 'fen') {
            let fen = TEXT(e.target),
                xfen = xboards.xfen;
            xfen.instant();
            if (!xfen.set_fen(fen, true))
                return;
            Style(xfen.overlay, 'opacity:0;transition:opacity 0.5s');
        }

        // place the popup in a visible area on the screen
        let x = e.clientX + 10,
            y = e.clientY + 10,
            x2 = 0,
            y2 = 0;
        if (x >= window.innerWidth / 2) {
            x -= 20;
            x2 = -100;
        }
        if (y >= window.innerHeight / 2) {
            y -= 20;
            y2 = -100;
        }

        Style(popup, `transform:translate(${x}px,${y}px) translate(${x2}%, ${y2}%)`);
        show = true;
    }

    Class(popup, 'popup-show', show);
    Style(popup, `min-width:${Min(num_col * 165 + 32, window.innerWidth * 2/3)}px`, num_col);

    // trick to be able to put the mouse on the popup and copy text
    if (show) {
        clear_timeout(`popup-${name}`);
        Class(popup, 'popup-enable');
        Show(popup);
    }
    else
        add_timeout(`popup-${name}`, () => {Class(popup, '-popup-enable');}, 300);
}

/**
 * Compute woke up
 */
function resume_sleep() {
    check_missing_moves();
    show_board_info(Y.x);
}

/**
 * Game events
 */
function set_game_events() {
    set_3d_events();

    // engine popup
    Events('#info0, #info1, #popup', 'click mouseenter mousemove mouseleave', function(e) {
        let id = this.id;
        popup_custom('popup', 'engine', e, (id == 'popup')? id: id.slice(-1));
    });
    C('#mobil', function() {
        let ply = this.dataset.i;
        if (ply != undefined)
            xboards[Y.x].set_ply(ply, {manual: true});
    });

    // tabs
    C('div.tab', function() {
        open_table(this);
    });
    // search
    Input('input.search', function() {
        add_timeout('search', () => {
            let parent = this.parentNode.id.split('-')[0];
            filter_table_rows(parent, this.value);
        }, TIMEOUT_search);
    });

    // live_log
    C('#nlog', function() {
        let value = this.value;
        save_option('live_log', value);
        if (value == 0)
            Y.log_auto_start = 0;
        listen_log();
    });
}

// STARTUP
//////////

/**
 * Call this after the structures have been initialised
 */
function start_game() {
    create_tables();
    create_boards();
    show_board_info('pva', true);

    if (Y.wasm)
        load_library('js/chess-wasm.js', () => {
            Module().then(instance => {
                let ChessWASM = instance.Chess;
                Keys(xboards).forEach(key => {
                    xboards[key].chess = new ChessWASM();
                    xboards[key].wasm = true;
                });
            });
        }, {async: ''});
}

/**
 * Initialise structures with game specific data
 */
function startup_game() {
    Assign(STATE_KEYS, {
        archive: ARCHIVE_KEYS,
        live: [],
    });

    virtual_init_3d_special = init_3d_special;
    virtual_random_position = random_position;
}

// <<
if (typeof exports != 'undefined')
    Assign(exports, {
        calculate_seeds: calculate_seeds,
        extract_threads: extract_threads,
        parse_pgn: parse_pgn,
    });
// >>
