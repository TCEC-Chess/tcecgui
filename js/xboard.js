// xboard.js
// @author octopoulo <polluxyz@gmail.com>
// @version 2021-04-28
//
// game board:
// - 4 rendering modes:
//      ~ 3d
//      - canvas
//      + html
//      + text
// - games:
//      + chess
//      + chess960
//      - go (future)
//
// included after: common, engine, global, 3d
// jshint -W069
/*
globals
_, A, Abs, add_player_eval, add_timeout, AnimationFrame, ArrayJS, Assign, assign_move, AttrsNS, audiobox, C, CacheId,
cannot_popup, Chess, Class, Clear, clear_timeout, COLOR, CreateNode, CreateSVG,
DefaultInt, DEV, EMPTY, Events, Exp, exports, Floor, format_eval, format_unit, From, FromSeconds, GaussianRandom,
get_fen_ply, get_move_ply, global, Hide, HTML, I8, Id, InsertNodes, IS_NODE, IsDigit, IsString, Keys,
Lower, LS, Max, Min, mix_hex_colors, MoveFrom, MoveOrder, MoveTo, Now, Pad, Parent, PIECES, play_sound, RandomInt,
require, resize_text, Round,
S, SetDefault, Show, Sign, socket, SP, split_move_string, SQUARES, Style, T, TEXT, TextHTML, timers, touch_event, U32,
Undefined, update_svg, Upper, Visible, window, Worker, Y, y_x
*/
'use strict';

// <<
if (typeof global != 'undefined') {
    ['3d', 'chess', 'common', 'engine', 'global', 'graph'].forEach(key => {
        Object.assign(global, require(`./${key}.js`));
    });
}
// >>

let AI = 'ai',
    COLUMN_LETTERS = 'abcdefghijklmnopqrst'.split(''),
    CONSOLE_NULL = {
        'console': 1,
        'null': 1,
    },
    // those controls stop the play
    CONTROL_STOPS = {
        'pause': 1,
        'prev': 1,
        'start': 1,
    },
    CONTROLS = {
        'start': {
            class: 'mirror',
            icon: 'end',
        },
        'prev': {
            class: 'mirror',
            icon: 'next',
        },
        'play': {
            dual: 'pause',
        },
        'next': '',
        'end': '',
        'rotate': 'Rotate board',
        'copy': 'Copy FEN',
        'lock': {
            dual: 'unlock',
        },
    },
    FIGURES = 'bknpqrBKNPQR'.split(''),
    HUMAN = 'human',
    key_repeat = 0,
    last_key = 0,
    LETTER_COLUMNS = Assign({}, ...COLUMN_LETTERS.map((letter, id) => ({[letter]: id}))),
    MATERIAL_ORDERS = {
        'k': 1,
        'q': 2,
        'r': 3,
        'b': 4,
        'n': 5,
        'p': 6,
    },
    ROTATE = (rotate, coord) => (rotate? 7 - coord: coord),
    SMOOTHS = new Set(),
    SPRITE_OFFSETS = Assign({}, ...FIGURES.map((key, id) => ({[key]: id}))),
    SQUARES_INV = Assign({}, ...Keys(SQUARES).map(key => ({[SQUARES[key]]: key}))),
    // https://en.wikipedia.org/wiki/Forsyth%E2%80%93Edwards_Notation
    // KQkq is also supported instead of AHah
    START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    TIMEOUT_arrow = 200,
    TIMEOUT_click = 200,
    TIMEOUT_compare = 100,
    TIMEOUT_pick = 600,
    TIMEOUT_vote = 1200,
    UNICODES = [0, 9817, 9816, 9815, 9814, 9813, 9812, 0, 0, 9817, 9822, 9821, 9820, 9819, 9818],
    WB_LOWER = ['white', 'black'],
    WB_TITLE = ['White', 'Black'];

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// TYPES
////////

/**
 * Move
 * @typedef {Object} Move
 * @property {Object} adjudication
 * @property {boolean} book
 * @property {string} fen
 * @property {string|number} from
 * @property {Object} material
 * @property {string} m                     // Bf6
 * @property {Object} pv
 * @property {string|number} to
 */

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/** @class */
class XBoard {
    /**
     * Constructor
     * @param {Object} options options:
     * @example
     * - border         // frame size
     * - clock          // start_clock function
     * - count          // add a counter in a red circle
     * - dims           // [num_col, num_row]
     * - eval           // update_player_eval function
     * - hook           // events callback
     * - id             // output selector for HTML & text, can be 'console' and 'null' too
     * - last           // default result text, ex: *
     * - list           // show move list history
     * - live_id        // 0,1: player id, 2,3: live engine id => will show arrows on the main board
     * - main           // is it the main board?
     * - manual         // manual control enabled
     * - mode           // 3d, canvas, html, text
     * - name           // key in BOARDS
     * - notation       // 1:top cols, 2:bottom cols, 4:left rows, 8:right nows
     * - pv_id          // extra output selector for PV list
     * - rotate         // board rotation
     * - size           // square size in px (resize will recalculate it)
     * - smooth         // smooth piece animation
     * - sub            //
     * - tab            // tab name to use with 'open_table' to make the board visible
     * - theme          // {ext: 'png', name: 'dilena', off: 15, size: 80}
     * - vis            // id of the visible element to know if the board is visible or not
     */

    constructor(options={}) {
        // options
        this.border = options.border || 2;
        this.clock = options.clock || (() => {});
        this.count = options.count;
        this.dims = options.dims || [8, 8];
        this.eval = options.eval || (() => {});
        this.hook = options.hook;
        this.id = options.id;
        this.last = options.last || '';
        this.list = options.list;
        this.live_id = options.live_id;
        this.main = options.main;
        this.manual = options.manual;
        this.mode = options.mode || 'html';
        this.name = options.name;
        this.notation = options.notation || 6;
        this.pv_id = options.pv_id;
        this.rotate = options.rotate || 0;
        this.size = options.size || 16;
        this.smooth = options.smooth;
        this.sub = options.sub;
        this.tab = options.tab;
        this.theme = options.theme;
        this.vis = Id(options.vis);

        // initialisation
        this.chess = new Chess();
        this.chess2 = null;                             // used to calculate PV
        this.clicked = false;
        this.colors = ['#eee', '#111'];
        this.coords = {};
        this.defuses = new Set();                       // consecutive defuse plies
        this.delayed_ply = -2;
        this.depth = 0;                                 // current depth in IT
        this.dirty = 3;                                 // &1:board/notation, &2:pieces, &4:theme change
        this.dual = null;
        this.evals = {
            'archive': [],
            'live': [],
            'pva': [],
            'three': [],
        };                                              // eval history
        this.exploded = 0;                              // explosion sound happened
        this.explodes = new Set();                      // consecutive explosion plies
        this.fen = '';                                  // current fen
        this.fen2 = '';
        this.fens = {};                                 // fen counter to detect 3-fold repetition
        this.finished = false;
        this.frame = 0;                                 // rendered frames
        this.frc = (this.manual && Y['game_960']);      // fischer random
        this.goal = [-20.5, -1];
        this.grid = new Array(128);
        this.grid2 = new Array(128);
        this.high_color = '';                           // highlight color
        this.high_size = 0.06;                          // highlight size
        this.hold = null;                               // mouse/touch hold target
        this.hold_step = 0;
        this.hold_time = 0;                             // last time the event was repeated
        this.last_time = 0;                             // last render time
        this.locked = 0;                                // &1:locked, &2:manual
        this.locked_obj = null;
        this.main_manual = this.main || this.manual;
        this.max_time = 0;                              // max time in IT
        this.min_depth = 0;                             // max depth in IT
        this.move_list = [];
        this.move_time = 0;                             // when a new move happened
        this.move2 = null;                              // previous move
        /** @type {Array<Move>} */
        this.moves = [];                                // move list
        this.next = null;
        this.node = _(this.id);
        this.node_agrees = [];                          // [0]
        this.node_count = null;                         // (15)
        this.node_currents = [];                        // current ply
        this.node_lasts = [];                           // *, 1-0, ...
        this.node_locks = [];                           // lock, unlock
        this.node_markers = [];                         // marker ply
        this.node_minis = [{}, {}];
        this.node_seens = [];                           // seen ply
        this.parents = [];
        this.pgn = {};
        this.picked = null;                             // picked piece
        this.pieces = {};                               // b: [[found, row, col], ...]
        this.play_id = `click_play_${this.id}`;         // for timers
        this.play_mode = 'play';                        // book, play, quick
        this.players = [{}, {}, {}, {}];                // current 2 players + 2 live engines
        this.ply = -1;                                  // current ply
        this.pv_string = '';                            // last pv_string used
        this.pv_strings = {};                           // iterative search: pv lists per move
        this.pv_node = _(this.pv_id);
        this.quick = 300;                               // quick speed
        this.real = null;                               // pointer to a board with the real moves
        this.rect = null;                               // control rect
        this.replies = {};                              // worker replies
        this.scores = {};                               // iterative search: used for move ordering
        this.seen = 0;                                  // last seen move -> used to show the counter
        this.seens = new Set();                         // seen plies for boom/explode
        this.shared = null;
        this.smooth_prev = -1;
        this.smooth0 = -1;                              // used to temporarily prevent transitions
        this.speed = 0;
        this.squares = {};                              // square nodes
        this.start_fen = START_FEN;
        this.svgs = [
            {id: 0},
            {id: 1},
            {id: 2},
            {id: 3},
        ];                                              // svg objects for the arrows
        this.temp = new Array(128);
        this.text = '';                                 // current text from add_moves_string
        this.thinking = false;
        this.valid = true;
        this.workers = [];                              // web workers
        this.xframe = null;
        this.xmoves = null;
        this.xoverlay = null;                           // svg objects will be added there
        this.xpieces = null;
        this.xsquares = null;
    }

    /**
     * Add a highlight square
     * @param {number} coord
     * @param {string} type source, target, turn
     */
    add_high(coord, type) {
        let color = Y[`${type}_color`],
            node = _(`[data-c="${coord}"] > .xhigh`, this.xsquares),
            opacity = Y[`${type}_opacity`];

        Style(node, [['background', color], ['opacity', opacity]]);
        Class(node, [['target'], ['source', 1]], (type == 'target'));

        if (type == 'turn')
            Class(`[data-c="${coord}"]`, [['source']], true, this.xpieces);
    }

    /**
     * Add a new move
     * - faster than using set_fen, as it won't have to recompute everything
     * @param {Move} move
     */
    add_move(move) {
        this.animate(move, true);
    }

    /**
     * Add new moves
     * - handle PGN format from TCEC
     * - can handle 2 pv lists
     * - if cur_ply is defined, then create a new HTML from scratch => no node insertion
     * @param {Array<Move>} moves
     * @param {Object} obj
     * @param {number=} obj.agree agree length
     * @param {number=} obj.cur_ply if defined, then we want to go to this ply
     * @param {boolean=} obj.keep_prev keep previous moves
     */
    add_moves(moves, {agree, cur_ply, keep_prev}={}) {
        if (this.check_locked(['move', moves, {agree: agree, cur_ply: cur_ply, keep_prev: keep_prev}]))
            return;

        let first_ply = Infinity,
            is_ply = (cur_ply != undefined),
            last_ply = -2,
            move_list = this.move_list,
            num_book = 0,
            num_new = moves.length,
            num_move = this.moves.length,
            start = 0,
            texts = {},
            visibles = new Set();

        // 1) gather moves
        for (let i = start; i < num_new; i ++) {
            let move = moves[i],
                ply = get_move_ply(move),
                ply2 = (ply << 1) + 1;

            if (ply < first_ply)
                first_ply = ply;
            if (ply > last_ply)
                last_ply = ply;

            if (!move)
                continue;

            move['ply'] = ply;
            this.moves[ply] = move;
            let book = move['book']? 1: 0,
                flag = book | (move['fail']? 2: 0);
            num_book += book;

            let san = move['m'];
            if (!san)
                continue;
            if (i == start && (ply & 1) && !keep_prev) {
                texts[ply2 - 2] = ['...', flag];
                visibles.add(ply2 - 2);
            }
            let memory = move_list[ply2];
            if (!memory || memory[1] != san || memory[2] != flag)
                texts[ply2] = [san, flag];

            // make the turn visible
            visibles.add(ply2);
            visibles.add(ply2 - ((ply & 1)? 3: 1));
        }

        // 2) handle skipped moves
        if (this.main && first_ply < Infinity)
            for (let ply = num_move; ply < first_ply; ply ++) {
                let ply2 = (ply << 1) + 1;
                texts[ply2] = ['...', 0];
                visibles.add(ply2);
                visibles.add(ply2 - ((ply & 1)? 3: 1));
            }

        // 3) update HTML
        this.update_move_list('X', visibles, texts, last_ply, agree, keep_prev);
        this.delayed_memory('moves', this.node_currents, cur_ply, last_ply, 'current');

        this.valid = true;

        // 4) update the cursor
        let delta = num_move - this.ply;
        // - if live eval (is_ply) => check the dual board to know which ply to display
        if (is_ply) {
            // live engine => show an arrow for the next move
            if (this.live_id != undefined || Visible(this.vis)) {
                let move = this.set_ply(cur_ply, {instant: !this.main, render: false});
                if (this.hook) {
                    this.next = move;
                    this.hook(this, 'next', move);
                }
            }
            this.delayed_compare(cur_ply, num_move - 1);
        }
        // way behind => set mode to quick
        else if (delta >= 5 && this.ply >= this.seen) {
            if (!num_book || num_book < num_new) {
                this.play_mode = 'quick';
                let ratio = Exp((5 - delta) * 0.1);
                this.quick = Y['quick_min'] * (1 - ratio) + Y['quick_max'] * ratio;
            }
        }
        // end => play
        else if (delta <= 1 && !timers[this.play_id]) {
            if (DEV['ply'])
                LS(`num_book=${num_book} : num_new=${num_new}`);

            // play book moves 1 by 1
            if (num_book && num_book >= num_new) {
                this.set_fen(null, true);
                this.ply = -1;
                this.play_mode = 'book';
                this.play(false, false, 'add_moves');
            }
            // + play normal moves ALSO 1 by 1, but quicker
            else if ((moves[0] || {}).ply > 0 || num_new <= 8) {
                this.play_mode = 'quick';
                this.play(false, false, 'add_moves');
            }
            // got 1st move => probably just (re)loaded the page
            else
                this.set_ply(this.moves.length - 1, {animate: 1});
        }

        // 5) next move
        if (this.hook) {
            let next = this.moves[this.real.ply + 1];
            if (next) {
                this.next = next;
                this.hook(this, 'next', next);
            }
        }

        this.update_counter();
        this.update_mobility(moves);
    }

    /**
     * Same as add_moves but with a string, only contains notations, no fen
     * - used in live pv, not for real moves
     * - completely replaces the moves list with this one
     * @param {string} text
     * @param {Object} obj
     * @param {number=} obj.agree agree length
     * @param {number=} obj.cur_ply if defined, then we want to go to this ply
     * @param {boolean=} obj.force force update
     * @param {boolean=} obj.keep_prev keep previous moves
     */
    add_moves_string(string, {agree, cur_ply, force, keep_prev}={}) {
        if (!string)
            return;

        // 1) no change or older => skip
        if (this.text == string || (!this.manual && this.text.includes(string)))
            return;
        if (this.check_locked(['text', string, {agree: agree, cur_ply: cur_ply, keep_prev: keep_prev}]))
            return;

        let split = split_move_string(string),
            move_list = this.move_list,
            new_items = split.items,
            new_ply = split.ply,
            want_ply = cur_ply? cur_ply: new_ply;

        // 2) update the moves
        let moves = [],
            ply = new_ply,
            texts = {},
            visibles = new Set();

        new_items.forEach(item => {
            if (item == '...') {
                let ply2 = (ply << 1) + 1,
                    memory = move_list[ply2];
                if (!memory || memory[1] != item || memory[2] != 0)
                    texts[ply2] = [item, 0];

                visibles.add(ply2);
                visibles.add(ply2 - ((ply & 1)? 3: 1));
                ply ++;
            }
            // turn? => use it
            else if (IsDigit(item[0])) {
                let turn = parseInt(item, 10);
                ply = (turn - 1) << 1;
                visibles.add(((ply << 1) + 1) - 1);
            }
            // normal move
            else {
                let ply2 = (ply << 1) + 1,
                    memory = move_list[ply2];
                if (!memory || memory[1] != item || memory[2] != 0)
                    texts[ply2] = [item, 0];

                // make the turn visible
                visibles.add(ply2);
                visibles.add(ply2 - ((ply & 1)? 3: 1));

                moves[ply] = {'m': item};
                ply ++;
            }
        });

        this.valid = true;

        // 3) only update if this is the current ply + 1, or if we want a specific ply
        let last_ply = this.real? this.real.moves.length - 1: -1,
            is_current = (new_ply == cur_ply || force || this.manual || (cur_ply == last_ply && new_ply > last_ply));

        if (!is_current && this.real) {
            Assign(SetDefault(moves, this.real.ply, {}), {'fen': this.real.fen});
            is_current = (new_ply == this.real.ply + 1);
        }
        if (!is_current)
            return;

        // 4) update HTML
        this.update_move_list('Y', visibles, texts, ply, agree, keep_prev);
        this.delayed_memory('moves', this.node_currents, want_ply, last_ply, 'current');
        this.moves = moves;
        this.text = string;

        // 5) update the cursor
        // live engine => show an arrow for the next move
        if (this.live_id != undefined || Visible(this.vis)) {
            let move = this.set_ply(new_ply, {instant: !this.main, render: false});
            if (this.hook) {
                this.next = move;
                this.hook(this, 'next', move);
            }
        }

        // show diverging move in PV
        this.delayed_compare(want_ply, last_ply);
    }

    /**
     * Analyse the FEN and extract piece coordinates from it
     * - ideally do this only when starting a new game
     * @param {string} fen
     * @returns {boolean}
     */
    analyse_fen(fen) {
        // 1) create the grid + count the pieces
        let chars = [],
            counts = {},
            grid = this.grid2,
            items = fen.split(' '),
            off = 0,
            lines = items[0].split('/'),
            pieces = this.pieces,
            temp = this.temp;

        // accept incomplete fens (without half_moves + move_number)
        if (items.length < 4)
            return false;

        grid.fill('');
        temp.fill(0);

        for (let line of lines) {
            let col = 0;
            for (let char of line.split('')) {
                // piece
                if (isNaN(char)) {
                    grid[off + col] = char;
                    chars.push([char, off + col, Lower(char)]);
                    let count = (counts[char] || 0) + 1,
                        items = pieces[char];

                    if (!items)
                        return false;

                    counts[char] = count;
                    if (count > items.length)
                        items.push([0, -1]);
                    col ++;
                }
                // void
                else
                    col += parseInt(char, 10);
            }
            off += 16;
        }

        // 2) perfect matches
        Keys(pieces).forEach(key => {
            for (let piece of pieces[key])
                piece[0] = 0;
        });
        for (let char of chars) {
            for (let item of pieces[char[0]]) {
                if (!item[0] && char[1] == item[1]) {
                    item[0] = 1;
                    char[0] = '';
                    break;
                }
            }
        }

        // 3) imperfect matches
        // simple algorithm
        if (!this.smooth) {
            for (let [char, index] of chars) {
                if (!char)
                    continue;

                let win,
                    best = Infinity,
                    items = pieces[char];
                for (let item of items) {
                    if (item[0])
                        continue;
                    let diff = (item[1] < -7)? 999: Abs((index >> 4) - (item[1] >> 4)) + Abs((index & 15) - (item[1] & 15));
                    if (diff < best) {
                        best = diff;
                        win = item;
                    }
                }
                win[0] = 1;
                win[1] = index;
            }
        }
        // complex algorithm
        else {
            let imps = [];
            for (let [char, index, type] of chars) {
                if (!char)
                    continue;

                let items = pieces[char];
                for (let item of items) {
                    if (item[0])
                        continue;
                    let coord = item[1],
                        filec = coord >> 4,
                        filei = index >> 4,
                        hmult = (type == 'p')? 2: 1,
                        diff = (coord < -7)? 999: Abs(filei - filec) + Abs((index & 15) - (coord & 15)) * hmult;

                    // keep bishop on the same color
                    if (type == 'b' && ((filei & 1) ^ (index & 1)) != ((filec & 1) ^ (coord & 1)))
                        diff += 1280;
                    imps.push([diff, index, item]);
                }
            }

            imps.sort((a, b) => a[0] - b[0]);
            for (let [_, index, item] of imps) {
                if (item[0] || temp[index])
                    continue;
                item[0] = 1;
                item[1] = index;
                temp[index] = 1;
            }
        }

        // 4) move non found pieces off the board
        Keys(pieces).forEach(key => {
            for (let piece of pieces[key])
                if (!piece[0] && piece[1] >= 0)
                    piece[1] -= 256;
        });

        // 5) update variables
        let temp_grid = this.grid;
        this.grid = grid;
        this.grid2 = temp_grid;

        this.fen = fen;
        this.ply = get_fen_ply(fen);
        this.valid = true;
        return true;
    }

    /**
     * Animate / render a move
     * - highlight_delay = 0 => always show the highlight in smooth/history
     * -                 < 0    never  ------------------------------------
     * -                 > 0    will   ------------------------------------
     * @param {Move=} move
     * @param {number} animate
     */
    animate(move, animate) {
        this.delayed_picks(!!move);
        if (!move)
            return;

        let func = {
            '3d': this.animate_3d,
            'canvas': this.animate_canvas,
            'html': this.animate_html,
        }[this.mode];
        if (!func)
            return;

        let delay = Y['highlight_delay'];
        func.call(this, move, animate || !delay);

        if (!animate && delay > 0)
            add_timeout(`animate_${this.id}`, () => func.call(this, move, true), delay);
    }

    /**
     * Animate a move in 3D
     * @param {Move} move
     * @param {number} animate
     */
    animate_3d(move, animate) {
        if (!T)
            return;
        LS(`${move['from']}${move['to']}`);
    }

    /**
     * Animate a move on the canvas
     * @param {Move} move
     * @param {boolean} animate
     */
    animate_canvas(move, animate) {
        LS(`${move['from']}${move['to']}`);
    }

    /**
     * Animate a move in the DOM
     * @param {Move} move
     * @param {number} animate false => remove highlights
     */
    animate_html(move, animate) {
        this.clear_high();

        let prev = this.move2;
        if (prev) {
            Style(prev.node_from, [['box-shadow', 'none']]);
            Style(prev.node_to, [['box-shadow', 'none']]);
        }

        this.set_smooth(animate? this.smooth: 0);
        if (!animate)
            return;

        let color = this.high_color,
            node_from = this.squares[SQUARES_INV[move['from']] || move['from']],
            node_to = this.squares[SQUARES_INV[move['to']] || move['to']],
            size = this.high_size,
            high_style = [['box-shadow', `inset 0 0 ${size}em ${size}em ${color}`]];

        Style(node_from, high_style);
        Style(node_to, high_style);

        // remember the move + nodes
        move.node_from = node_from;
        move.node_to = node_to;
        this.move2 = move;
    }

    /**
     * Show an arrow
     * @param {number} id object id, there can be multiple arrows
     * @param {Object} dico {captured, color, from, piece, to}
     * @param {number=} opacity opacity multiplier
     */
    arrow(id, dico, opacity=1) {
        let func = {
            '3d': this.arrow_3d,
            'canvas': this.arrow_canvas,
            'html': this.arrow_html,
        }[this.mode];

        if (func)
            func.call(this, id, dico, opacity);
    }

    /**
     * Display a 3d arrow
     * @param {number} id
     * @param {Object} dico
     * @param {number} opacity
     */
    arrow_3d(id, dico, opacity) {

    }

    /**
     * Draw an arrow on the canvas
     * @param {number} id
     * @param {Object} dico
     * @param {number} opacity
     */
    arrow_canvas(id, dico, opacity) {

    }

    /**
     * Create an SVG arrow
     * @param {number} id svg id, there can be multiple arrows
     * @param {Object} dico contains move info, if null then hide the arrow
     * @param {number} opacity
     */
    arrow_html(id, dico, opacity) {
        if (DEV['arrow'])
            LS('arrow', id, dico);

        // 1) no move => hide the arrow
        // TODO: maybe some restoration is needed here
        if (!dico || dico['from'] == undefined || !Y['arrow_opacity']) {
            Hide(this.svgs[id].svg);
            return;
        }

        // 2) got a move => get coordinates
        if (IsString(dico['from'])) {
            dico['from'] = SQUARES[dico['from']];
            dico['to'] = SQUARES[dico['to']];
        }

        let path,
            name = this.name,
            rotate = this.rotate,
            x1 = ROTATE(rotate, dico['from'] & 15),
            x2 = ROTATE(rotate, dico['to'] & 15),
            y1 = ROTATE(rotate, dico['from'] >> 4),
            y2 = ROTATE(rotate, dico['to'] >> 4);

        // should not happen, but there's a bug when using PVA maybe
        if (x1 == x2 && y1 == y2) {
            LS('arrow error', id, dico);
            return;
        }

        x1 = 5 + 10 * x1;
        x2 = 5 + 10 * x2;
        y1 = 5 + 10 * y1;
        y2 = 5 + 10 * y2;
        let delta_x = Abs(x1 - x2),
            delta_y = Abs(y1 - y2),
            sx = Sign(x1 - x2),
            sy = Sign(y1 - y2);

        // 3) calculate the path
        // knight = L shape path
        if (delta_x && delta_y && delta_x != delta_y) {
            let x3, y3;
            if (delta_x > delta_y) {
                x3 = x2;
                y3 = y1;
                y2 += sy * 2.4;
            }
            else {
                x3 = x1;
                y3 = y2;
                x2 += sx * 2.4;
            }
            x1 += Sign(x3 - x1) * 1.68;
            y1 += Sign(y3 - y1) * 1.68;
            path = `M${x1} ${y1} L${x3} ${y3} L${x2} ${y2}`;
        }
        // diagonal => divide factor by sqrt(2)
        else {
            let factor = (!delta_x || !delta_y)? 2.4: 1.7;
            x1 -= sx * factor * 0.7;
            y1 -= sy * factor * 0.7;
            x2 += sx * factor;
            y2 += sy * factor;
            path = `M${x1} ${y1} L${x2} ${y2}`;
        }

        // 3) arrow conflicts
        // - arrows have the same path => hide the other + modify the color
        let shead,
            color_01 = Y['arrow_color_01'],
            dual_id = id + 1 - (id & 1) * 2,
            dual = this.svgs[dual_id],
            head_color = Y['arrow_head_color'],
            head_mix = Y['arrow_head_mix'],
            others = this.svgs.filter(svg => svg.id != id && svg.path == path),
            scolor = Y[`arrow_color_${id}`],
            shown = true;

        // player
        if (id < 2) {
            for (let other of others) {
                let other_id = other.id;
                opacity = 1;

                // player => combine
                if (other_id < 2) {
                    scolor = color_01;
                    Hide(other.svg);
                }
                // kibitzer => player head
                else {
                    AttrsNS(CacheId(`mk${name}_${other_id}_1`), {
                        'fill': mix_hex_colors(head_color, scolor, head_mix),
                    });
                    shown = false;
                    break;
                }
            }
        }
        // kibitzer
        else {
            let ids = [];
            for (let other of others) {
                let other_id = other.id;
                opacity = 1;

                // kibitzer => combine
                if (other_id >= 2)
                    scolor = Y['arrow_color_23'];
                // player => mix heads
                else
                    ids.push(other_id);
                Hide(other.svg);
            }
            if (ids.length) {
                let mix = (ids.length >= 2)? color_01: Y[`arrow_color_${ids[0]}`];
                shead = mix_hex_colors(head_color, mix, head_mix);
            }
        }

        // other color might be green => should recolor it
        if (id >= 2 && dual.svg)
            AttrsNS('svg > path', {'stroke': Y[`arrow_color_${dual_id}`]}, dual.svg);

        // 4) show the arrow
        let body = this.create_arrow(id),
            color_base = mix_hex_colors(Y['arrow_base_color'], scolor, Y['arrow_base_mix']),
            color_head = shead || mix_hex_colors(head_color, scolor, head_mix),
            markers = A('marker', body),
            paths = A('svg > path', body),
            svg = this.svgs[id];

        AttrsNS(markers[0], {'fill': color_base, 'stroke': scolor, 'stroke-width': Y['arrow_base_border']});
        AttrsNS(markers[1], {'fill': color_head, 'stroke': scolor, 'stroke-width': Y['arrow_head_border']});
        AttrsNS(paths[0], {'d': path, 'stroke': scolor, 'stroke-width': Y['arrow_width']});

        svg.dist = delta_x + delta_y;
        svg.path = path;
        Style(body, [['opacity', Y['arrow_opacity'] * opacity]]);
        S(body, shown);
        if (DEV['arrow'])
            LS(id, 'drew arrow');

        // 5) shorter distances above
        [...this.svgs]
            .sort((a, b) => ((b.dist || 0) - (a.dist || 0)))
            .forEach((svg, id) => {
                Style(svg.svg, [['z-index', id]]);
            });
    }

    /**
     * Calculate a new smooth value
     * + update smooth HTML
     */
    calculate_smooth() {
        let smooth = this.smooth,
            smooth_prev = this.smooth_prev;

        // 1) calculate
        if (this.smooth0 == -1) {
            let smooth_max = Y['smooth_max'],
                smooth_min = Y['smooth_min'];

            if (smooth_min >= smooth_max)
                smooth = smooth_min;
            else {
                let delta = Floor((Now(true) - this.last_time) * 1000),
                    moves = this.moves,
                    ply = this.ply;

                if (!moves[ply - 1] || !moves[ply + 1])
                    smooth = smooth_max;
                else {
                    // 16ms = very fast
                    // 80ms = slow enough
                    let ratio = (delta < 16)? 0: 1 - Exp((16 - delta) * 0.05);
                    smooth = Round((Y['smooth_min'] * (1 - ratio) + smooth_max * ratio) / 10) * 10;
                }
            }
            this.set_smooth(smooth);
        }

        // 2) update smooth class
        if (smooth == smooth_prev)
            return;

        let smooths = [];
        if (smooth_prev >= 0)
            smooths.push([`smooth-${Pad(smooth_prev, 3)}`, 1]);
        smooths.push([`smooth-${Pad(smooth, 3)}`]);
        Class(this.xpieces, smooths);

        this.smooth_prev = smooth;
    }

    /**
     * The ply was changed
     * @param {Move} move
     */
    changed_ply(move) {
        if (this.hook)
            this.hook(this, 'ply', move);
        if (this.manual)
            this.destroy_workers(true);
    }

    /**
     * Call this when new moves arrive
     * @param {Object} object
     * @returns {boolean}
     */
    check_locked(object) {
        if (this.locked) {
            this.locked_obj = object;
            Style(this.node_locks[1], [['color', '#f00']]);
        }
        return this.locked;
    }

    /**
     * Calculate the FEN for the ply, by looking at the previously saved FEN's
     * @param {number} ply
     * @returns {boolean}
     */
    chess_backtrack(ply) {
        if (DEV['ply'])
            LS(`${this.id}: no fen available for ply ${ply}`);

        let moves = this.moves,
            real_moves = this.real.moves;

        for (let curr = ply - 1; curr >= -1; curr --) {
            let move = moves[curr],
                fen = move? move['fen']: null;
            if (!move) {
                if (DEV['ply'])
                    LS(`${this.id}: no move at ply ${curr}`);

                if (curr == -1)
                    fen = this.start_fen;
                else {
                    let real_move = real_moves[curr];
                    if (!real_move)
                        return false;
                    fen = real_move['fen'];

                    moves[curr] = {
                        'fen': fen,
                        'ply': curr,
                    };
                    move = moves[curr];
                }
            }

            if (fen) {
                this.chess_load(fen);
                for (let next = curr + 1; next <= ply; next ++) {
                    let move_next = moves[next],
                        result = this.chess_move(move_next['m']);
                    if (result['from'] == result['to']) {
                        if (DEV['ply'])
                            LS(`${this.id}: invalid move at ply ${next}: ${move_next['m']}`);
                        return false;
                    }
                    assign_move(move_next, result);
                    move_next['fen'] = this.chess_fen();
                    move_next['ply'] = next;
                    // LS(`next=${next} : ${get_move_ply(move_next)}`);
                }
                return true;
            }
        }

        return false;
    }

    /**
     * Temporary chess.js
     * @returns {string}
     */
    chess_fen() {
        return this.chess.fen();
    }

    /**
     * Temporary chess.js
     * @param {string} fen
     * @returns {string}
     */
    chess_load(fen) {
        return this.chess.load(fen, false);
    }

    /**
     * Calculate the mobility
     * @param {Move} move
     * @param {boolean=} no_load don't load the FEN
     * @returns {number}
     */
    chess_mobility(move, no_load) {
        if (move.mobil != undefined)
            return move.mobil;

        let chess = this.chess,
            fen = move['fen'],
            ply = get_move_ply(move);

        if (ply == -2) {
            move.goal = [-20.5, -1];
            move.mobil = 20.5;
            return -20.5;
        }
        if (!fen)
            return -20.5;
        if (!no_load)
            chess.load(fen, false);

        // calculate
        let checked = chess.checked(chess.turn()),
            moves = this.chess_moves(),
            rule50 = fen.split(' ')[4] * 1,
            sign = (ply & 1)? -1: 1,
            score = sign * (moves.length + (checked? 0: 0.5));

        if (!rule50 || Abs(score) < Abs(this.goal[0]))
            this.goal = [score, ply];

        move.goal = [...this.goal];
        move.mobil = score;

        if (DEV['mobil']) {
            LS(`mobility: ${fen}`);
            LS(`=> ${score}: ${ply} :: ${this.goal}`);
        }
        return score;
    }

    /**
     * Temporary chess.js
     * @param {string|Object} text
     * @param {Object=} options
     * @returns {Object}
     */
    chess_move(text, options={}) {
        if (!text)
            return {};

        let result,
            chess = this.chess,
            decorate = Undefined(options.decorate, false),
            length = text.length;

        // handle UCI: e1g1 = O-O, e7e8q = promotion
        if (length >= 4 && length <= 5 && IsDigit(text[1]) && IsDigit(text[3])
                && text[0] == Lower(text[0]) && text[2] == Lower(text[2]))
            result = chess.moveUci(text, true);
        else
            result = IsString(text)? chess.moveSan(text, decorate, true): chess.moveObject(text, true);

        if (result['from'] != result['to']) {
            result['san'] = result['m'];
            if (!decorate)
                result['m'] = text;
        }
        return result;
    }

    /**
     * Calculate all legal moves
     * @param {number=} single_square
     * @returns {Array<number>}
     */
    chess_moves(single_square=EMPTY) {
        let moves = ArrayJS(this.chess.moves());
        if (single_square != EMPTY)
            moves = moves.filter(move => MoveFrom(move) == single_square);
        return moves;
    }

    /**
     * Clear highlight squares
     * @param {Array<*>=} types source, target, turn, restore
     * @param {boolean=} restore
     */
    clear_high(types, restore) {
        if (!types)
            types = [['source'], ['target']];

        Style('.xhigh', [['background' ,'transparent']], true, this.xsquares);
        Class('.xhigh', types, false, this.xsquares);
        if (types.length == 2 && types[0][0] == 'source' && types[1][0] == 'target')
            Class('.source', [['source']], false, this.xpieces);
        if (restore)
            Style('.source', [['background', Y['turn_color']], ['opacity', Y['turn_opacity']]], true, this.xsquares);
    }

    /**
     * Hide move list + nodes
     */
    clear_moves() {
        let last_id = (this.moves.length << 1) + 1,
            move_list = this.move_list,
            num_list = move_list.length;

        for (let i = last_id; i < num_list; i ++) {
            let list = move_list[i];
            if (!list[0])
                continue;
            list[0] = 0;
            list[2] = 0;
            for (let child of list[3])
                Class(child, [['dn'], ['book', 1], ['fail', 1]]);
        }
    }

    /**
     * Clicked on a move list => maybe selected a new ply
     * @param {Event} e
     * @param {Function} callback
     */
    clicked_move_list(e, callback) {
        let target = e.target,
            parent = Parent(target, {self: true, tag: 'a'});
        if (!parent)
            return;

        let ply = parent.dataset['i'];
        if (ply != undefined)
            this.set_ply(ply * 1, {animate: 1, manual: true});

        callback(this, 'move', ply);
        this.play(true, true, 'clicked_move_list');
    }

    /**
     * Compare plies from the duals
     * - set the ply for both the board and the dual board
     * - called from add_moves and add_moves_string
     * ! should avoid calling it on the dual unnecessarily
     * @param {number} num_ply current ply in the real game (in live mode: not played yet)
     * @param {number=} force force the lock: &1:self, &2:dual
     */
    compare_duals(num_ply, force) {
        // 0) skip?
        if (this.locked && !(force & 1))
            return;
        this.clicked = false;

        clear_timeout(`compare_${this.id}`);

        // 1) compare the moves if there's a dual
        let dual = this.dual,
            real = this.real,
            set_dico = {check: !force, instant: !this.main};
        if (!real)
            return;

        // no dual
        if (!dual || !dual.valid || (dual.locked && !(force & 2))) {
            this.set_ply(num_ply, set_dico);
            return;
        }

        // first + diverging + last  => compare the moves
        let agree = 0,
            duals = dual.moves,
            moves = this.moves,
            num_move = Min(duals.length, moves.length),
            ply = num_ply;

        for (let i = num_ply; i < num_move; i ++) {
            let dual_m = (duals[i] || {})['m'],
                move_m = (moves[i] || {})['m'];
            if (DEV['div'])
                LS(`${this.id} : i=${i} < ${num_move} : ${dual_m == move_m} : ${dual_m} = ${move_m}`);
            if (!dual_m || !move_m) {
                // first move might be void
                if (i == num_ply && dual_m == move_m)
                    continue;
                break;
            }
            ply = i;
            if (dual_m != move_m)
                break;
            agree ++;
        }

        if (DEV['div'])
            LS(`${this.id} => ply=${ply}`);

        // set marker + agree
        this.set_marker(ply, agree, num_ply);
        dual.set_marker(ply, agree, num_ply);

        // 2) set ply?
        let show_ply = Y['show_ply'];
        if (show_ply == 'first') {
            this.set_ply(num_ply, set_dico);
            dual.set_ply(num_ply, set_dico);
            return;
        }

        // render: jump directly to the position
        for (let board of [this, dual]) {
            if (board.clicked)
                continue;
            if (show_ply == 'last')
                ply = board.moves.length - 1;

            if (ply == num_ply)
                board.set_ply(ply, set_dico);
            // try to get to the ply without compute, if fails, then render the next ply + compute later
            else if (board.set_ply(ply, set_dico) == false) {
                if (DEV['div'])
                    LS(`${this.id}/${board.id} : delayed ${num_ply} => ${ply}`);
                board.set_ply(ply, set_dico);
            }
        }
    }

    /**
     * Create an svg arrow part
     * @see https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/marker-end
     * @param {string} id
     * @returns {Node}
     */
    create_arrow(id) {
        let arrow = this.svgs[id].svg;
        if (arrow)
            return arrow;

        let color = Y[`arrow_color_${id}`],
            marker_circle = CreateSVG('circle', {'cx': 5, 'cy': 5, 'r': 3}),
            marker_path = CreateSVG('path', {'d': `M0 0l5 5l-5 5z`}),
            name = this.name,
            options = {
                'markerUnits': 'strokeWidth',
                'orient': 'auto',
                'refX': 5,
                'refY': 5,
                'viewBox': '0 0 10 10',
            },
            markers = [
                CreateSVG('marker', Assign(options, {
                    'fill': color,
                    'id': `mk${name}_${id}_0`,
                    'markerHeight': Y['arrow_base_size'],
                }), [marker_circle]),
                CreateSVG('marker', Assign(options, {
                    'fill': color,
                    'id': `mk${name}_${id}_1`,
                    'markerHeight': Y['arrow_head_size'],
                    'refX': 1,
                }), [marker_path]),
            ],
            defs = CreateSVG('defs', null, markers),
            path = CreateSVG('path'),
            svg = CreateSVG('svg', {'viewBox': '0 0 80 80'}, [defs, path]);

        AttrsNS(path, {'marker-end': `url(#mk${name}_${id}_1)`, 'marker-start': `url(#mk${name}_${id}_0)`});

        arrow = CreateNode('div', null, {'class': 'arrow', 'id': `ar${id}`}, [svg]);
        if (this.xoverlay)
            this.xoverlay.appendChild(arrow);
        this.svgs[id].svg = arrow;
        return arrow;
    }

    /**
     * Create a chess piece for HTML rendering
     * @param {string} char
     * @param {string} style
     * @param {number} offset
     * @returns {string}
     */
    create_piece(char, style, offset) {
        let html,
            theme = this.theme;

        // text/symbol piece
        if (theme.font) {
            let piece = PIECES[char] || 0;
            if (theme.unicode) {
                char = UNICODES[piece] || '';
                if (char)
                    char = `&#${char};`;
            }
            html = `<vert style="${style};color:${COLOR(piece)? '#000': '#fff'}">${char}</vert>`;
        }
        // png/svg piece
        else
            html = `<div style="${style};background-position-x:${offset}px"></div>`;

        return html;
    }

    /**
     * Create web workers
     */
    create_workers() {
        if (!this.manual)
            return;

        let number = Y['game_threads'];
        if (number == this.workers.length)
            return;
        if (DEV['engine'])
            LS(`threads: ${this.workers.length} => ${number}`);

        this.destroy_workers();
        if (!window.Worker)
            return;

        let shared_array_buffer = window.SharedArrayBuffer;
        this.shared = shared_array_buffer? new shared_array_buffer(1): [];

        for (let id = 0; id < number; id ++) {
            let worker = new Worker(`js/worker.js?ts=${Now()}`);

            worker.onerror = error => {
                LS(`worker error:`);
                LS(error);
            };
            worker.onmessage = e => {
                this.worker_message(e);
            };

            worker.id = id;
            worker.postMessage({'dev': DEV, 'func': 'config'});
            this.workers.push(worker);
        }
    }

    /**
     * Compare duals with a delay
     * - direct on the last ply or previous one
     * - direct if key was not pushed/repeated recently
     * @param {number} want_ply
     * @param {number} last_ply
     */
    delayed_compare(want_ply, last_ply) {
        if (this.locked)
            return;

        let force = (!this.dual || this.dual.locked)? 1: 3;
        if (this.is_ready(want_ply, last_ply)) {
            this.compare_duals(want_ply, force);
            return;
        }

        // hide marker + seen
        let name = `compare_${this.id}`;
        if (!timers[name]) {
            this.set_marker(-2);
            if (this.dual)
                this.dual.set_marker(-2);
        }
        add_timeout(name, () => this.compare_duals(want_ply, force), TIMEOUT_compare);
    }

    /**
     * Update current/marker/seen + memory, with a possible delay
     * @param {string} prefix
     * @param {Array<Node>} memory
     * @param {number} ply
     * @param {number} last_ply
     * @param {string} class_
     * @param {Function=} callback
     */
    delayed_memory(prefix, memory, ply, last_ply, class_, callback) {
        let name = `${prefix}_${this.id}`;

        if (this.is_ready(ply, last_ply)) {
            clear_timeout(name);
            this.update_memory(memory, ply, class_, callback);
            return;
        }

        // hide current
        if (!timers[name])
            for (let node of this.node_currents)
                Class(node, [['current', 1]]);

        add_timeout(name, () => this.update_memory(memory, ply, class_, callback), TIMEOUT_compare);
    }

    /**
     * Show picks after a delay, to make sure the animation is done
     * @param {boolean} is_delay
     */
    delayed_picks(is_delay) {
        if (!this.manual)
            return;
        if (timers[this.play_id] && this.is_ai())
            return;

        AnimationFrame(() => {
            add_timeout(`pick_${this.id}`, () => this.show_picks(true), is_delay? TIMEOUT_pick: 0);
        });
    }

    /**
     * Destroy the web workers
     * - useful when starting a new game, to make sure no code is running in the threads anymore
     * @param {boolean=} manual
     */
    destroy_workers(manual) {
        if (!manual || this.thinking) {
            for (let worker of this.workers)
                worker.terminate();
            this.thinking = false;
            this.workers = [];
        }
        this.fen2 = '';

        if (manual) {
            this.finished = false;
            Clear(this.replies);
            this.clock(this.name, 0, true);
            this.hide_arrows();
        }
    }

    /**
     * Listen to clicking events
     * @param {Function} callback
     */
    event_hook(callback) {
        let that = this;

        C(this.node, e => {
            callback(that, 'activate', e.target, e);
        });

        // disable right click
        Events('[data-x]', 'contextmenu', e => {
            if (cannot_popup()) {
                SP(e);
                return;
            }
            e.preventDefault();
        }, {}, this.node);

        // controls
        C('[data-x]', function(e) {
            callback(that, 'activate', null);

            let name = this.dataset['x'];
            switch (name) {
            case 'end':
                that.go_end();
                break;
            case 'lock':
                that.set_locked(3);
                break;
            case 'play':
                that.play(false, true, 'event_hook');
                break;
            case 'rotate':
                that.set_rotate((that.rotate + 1) & 1);
                callback(that, 'control', name, e);
                break;
            case 'start':
                that.go_start();
                break;
            case 'unlock':
                that.set_locked(2);
                break;
            default:
                callback(that, 'control', name, e);
            }

            if (CONTROL_STOPS[name])
                that.play(true, true, 'event_hook');
            SP(e);
        }, this.node);

        // holding mouse/touch on prev/next => keep moving
        Events('[data-x="next"], [data-x="prev"]',
                'mousedown mouseleave mousemove mouseup touchend touchmove touchstart', function(e) {
            let name = this.dataset['x'],
                type = e.type;

            if (['mousedown', 'touchstart'].includes(type)) {
                if (name != 'next' && name != 'prev')
                    return;
                if (name == 'prev')
                    that.play(true, true, 'events');
                let target = Parent(e.target, {class_: 'control', self: true});
                if (target) {
                    that.rect = target.getBoundingClientRect();
                    that.hold_button(name, 0, true);
                }
            }
            else {
                if (!that.hold)
                    return;

                if (['mousemove', 'touchmove'].includes(type)) {
                    // no 'leave' for touch => check rect
                    let rect = that.rect;
                    if (rect) {
                        let change = touch_event(e).change;
                        if (change.x < rect.left || change.x > rect.left + rect.width
                                || change.y < rect.top || change.y > rect.bottom + rect.height)
                            that.release();
                    }
                    if (name != that.hold)
                        that.release();
                }
                else
                    that.release();

                if (!that.hold)
                    that.rect = null;
            }

            if (e.cancelable != false)
                e.preventDefault();
        }, {}, this.node);

        // pv list
        for (let parent of this.parents)
            C(parent, e => {
                this.clicked_move_list(e, callback);
            });

        // PVA => extra events
        // place a picked piece
        C(this.xsquares, e => {
            if (this.manual)
                this.place(e);
        });

        // pick a piece
        C('.xpieces', e => {
            if (!this.manual || this.place(e) || !this.pick(e))
                return;

            this.clear_high([['target']], this.picked == null);
            if (this.picked == null)
                return;

            this.chess_load(this.fen);
            let moves = this.chess_moves(this.picked);
            for (let move of moves)
                this.add_high(MoveTo(move), 'target');
            if (moves[0])
                this.add_high(MoveFrom(moves[0]), 'source');
        }, this.node);
    }

    /**
     * Find the FRC index of a FEN
     * - slow but only needed when saving the PGN
     * @param {string} fen
     * @returns {number} -1 if nothing found
     */
    frc_index(fen) {
        for (let i = 0; i < 960; i ++) {
            let fen960 = this.chess.fen960(i);
            if (fen960 == fen)
                return i;
        }
        return -1;
    }

    /**
     * Get piece background
     * @param {number} size
     * @returns {Array<*>} piece_size, style, transform
     */
    get_piece_background(size) {
        let theme = this.theme,
            font = theme.font,
            piece_size = theme.size;

        if (font)
            return [piece_size, `font-family:${font}`, `scale(${size / piece_size})`];

        let image = `url(theme/${theme.name}.${theme.ext})`,
            diff = (piece_size - size) / 2,
            style = `background-image:${image};height:${piece_size}px;width:${piece_size}px`,
            transform = `scale(${size / piece_size}) translate(${theme.off[0] - diff}px, ${theme.off[1] - diff}px)`;

        return [piece_size, style, transform];
    }

    /**
     * Navigation: end
     * @returns {boolean|Move}
     */
    go_end() {
        return this.set_ply(this.moves.length - 1, {manual: true});
    }

    /**
     * Navigation: next
     * @param {boolean=} is_manual
     * @returns {boolean|Move}
     */
    go_next(is_manual) {
        let num_move = this.moves.length,
            ply = this.ply + 1;
        while (ply < num_move - 1 && !this.moves[ply])
            ply ++;

        let success = this.set_ply(ply, {animate: 1, manual: true});
        if (!is_manual)
            return success;

        // next to think
        if (success)
            this.set_play(true);
        else if (ply >= num_move && this.manual) {
            this.set_ai(true);
            success = this.think();
            if (success)
                this.play_mode = 'game';
        }
        return success;
    }

    /**
     * Navigation: prev
     * @returns {boolean|Move}
     */
    go_prev() {
        let ply = this.ply - 1,
            start = this.main_manual? -1: 0;
        while (ply > start && !this.moves[ply])
            ply --;
        let move = this.set_ply(ply, {animate: 1, manual: true});
        this.set_ai(false, 0);
        this.set_ai(false, 1);
        this.destroy_workers(true);
        return move;
    }

    /**
     * Navigation: start
     * @returns {boolean|Move}
     */
    go_start() {
        let num_move = this.moves.length,
            ply = 0;
        while (ply < num_move - 1 && !this.moves[ply])
            ply ++;

        // initial board
        if (!ply && this.main_manual)
            ply = -1;

        return this.set_ply(ply, {manual: true});
    }

    /**
     * Hide arrows
     * - for now, only HTML code
     */
    hide_arrows() {
        // update players' arrows
        for (let player of this.players) {
            let arrow = player.arrow;
            if (arrow)
                arrow[1] = null;
        }

        for (let svg of this.svgs)
            Hide(svg.svg);
    }

    /**
     * Hold mouse button or touch => repeat the action
     * @param {string} name
     * @param {number} step -1 for no repeat
     * @param {boolean=} is_manual
     */
    hold_button(name, step, is_manual) {
        let is_play = (name == 'play');

        if (step == 0)
            this.hold = name;
        else if (!is_play && step > 0 && !this.hold)
            return;

        this.hold_step = step;

        // need this to prevent mouse up from doing another click
        let now = Now(true);
        if (step >= 0 || now > this.hold_time + TIMEOUT_click) {
            switch (name) {
            case 'next':
            case 'play':
                this.set_play(false);
                if (!this.go_next(is_manual))
                    step = -1;
                break;
            case 'prev':
                if (!this.go_prev())
                    step = -1;
                break;
            }
        }

        if (step < 0) {
            if (is_play)
                this.play(true, false, 'hold_button');
            return;
        }

        this.hold_time = now;
        last_key = now;

        // handle key repeat
        let timeout,
            time_name = `click_${name}_${this.id}`;
        if (is_play) {
            if (this.play_mode == 'quick')
                timeout = this.quick;
            else
               timeout = Y[`${this.play_mode}_every`];
        }
        else if (step) {
            if (key_repeat > Y['key_repeat'])
                key_repeat = Y['key_repeat'];
            else
                key_repeat = Max(key_repeat / Y['key_accelerate'], 8);
            timeout = key_repeat;
        }
        else {
            key_repeat = Y['key_repeat_initial'];
            timeout = key_repeat;
        }
        this.speed = timeout;

        // faster than 60Hz? => go warp speed
        if (timeout < 1000 / 59) {
            clear_timeout(time_name);
            AnimationFrame(() => this.hold_button(name, step + 1, !is_play));
        }
        else
            add_timeout(time_name, () => this.hold_button(name, step + 1, !is_play), timeout);
    }

    /**
     * Initialise the board
     * - must be run before doing anything with it
     */
    initialise() {
        let controls2 = Assign({}, CONTROLS),
            root = this.node;
        if (this.main_manual) {
            delete controls2.lock;
            controls2['burger'] = '';  // Change view';
        }

        // create elements
        let controls = Keys(controls2).map(name => {
            let value = controls2[name] || {},
                class_ = value.class || '',
                dual = value.dual,
                icon = value.icon || name,
                title = value.title || '';

            if (class_)
                class_ = ` ${class_}`;
            if (IsString(value))
                title = value;
            if (title)
                title = ` data-t="${title}" data-t2="title"`;

            // handle dual elements: play/pause
            let attr = ` data-x="${name}"`,
                svg = `<i data-svg="${icon}"${title}></i>`;
            if (dual) {
                svg = `<vert class="fcenter w100 h100"${attr}>${svg}</vert>`
                    + `<vert class="fcenter w100 h100 dn" data-x="${dual}"><i data-svg="${dual}"></i></vert>`;
                attr = '';
            }

            // counter
            if (name == this.count)
                svg += `<vert class="count fcenter dn" data-x="end"></vert>`;

            return `<vert class="control fcenter${class_}"${attr}>${svg}</vert>`;
        }).join('');

        HTML(root, [
            '<hori class="xtop xcolor1 dn">',
                '<hori class="xshort fbetween"></hori>',
                '<div class="xleft"></div>',
                '<div class="xtime"></div>',
                '<div class="xeval"></div>',
                '<div class="xcog dn"><i data-svg="cog"></i></div>',
            '</hori>',
            '<div class="xframe"></div>',
            '<div class="xcontain">',
                '<grid class="xsquares"></grid>',
                '<div class="xoverlay"></div>',
                '<div class="xpieces"></div>',
                '<hori class="xbottom xcolor0 dn">',
                    '<hori class="xshort fbetween"></hori>',
                    '<div class="xleft"></div>',
                    '<div class="xtime"></div>',
                    '<div class="xeval"></div>',
                    '<div class="xcog dn"><i data-svg="cog"></i></div>',
                '</hori>',
                `<hori class="xcontrol">${controls}</hori>`,
            '</div>',
            `<horis class="xmoves fabase${this.list? '': ' dn'}"></horis>`,
        ].join(''));

        this.xframe = _('.xframe', root);
        this.xmoves = _('.xmoves', root);
        this.xoverlay = _('.xoverlay', root);
        this.xpieces = _('.xpieces', root);
        this.xsquares = _('.xsquares', root);

        this.parents = [this.xmoves, this.pv_node].filter(parent => parent);

        let manual = this.main_manual;
        for (let parent of this.parents)
            HTML(parent, `<i class="agree${manual? ' dn': ''}">0</i><i class="last${manual? '': ' dn'}">*</i>`);

        // multi nodes
        this.node_agrees = this.parents.map(node => node.firstChild);
        this.node_currents = this.parents.map(_ => null);
        this.node_lasts = this.parents.map(node => node.children[1]);
        this.node_locks = [_(`[data-x="lock"]`, root), _(`[data-x="unlock"]`, root)];
        this.node_markers = this.parents.map(_ => null);
        this.node_minis = [0, 1].map(id => {
            let node = _(`.xcolor${id}`, root);
            return {
                _: node,
                cog: _('.xcog', node),
                eval_: _('.xeval', node),
                left: _('.xleft', node),
                short: _('.xshort', node),
                time: _('.xtime', node),
            };
        });
        this.node_seens = this.parents.map(_ => null);

        // single nodes
        this.node_count = _('.count', root);

        // initialise the pieces to zero
        this.pieces = Assign({}, ...FIGURES.map(key => ({[key]: []})));

        this.set_fen(null);
        update_svg();

        if (this.hook)
            this.event_hook(this.hook);
    }

    /**
     * Hold the smooth value for 1 render frame
     */
    instant() {
        this.smooth0 = this.smooth;
        this.set_smooth(0);
    }

    /**
     * Is it the AI turn to play?
     */
    is_ai() {
        return (this.players[(1 + this.ply) & 1].name == AI);
    }

    /**
     * Check if the game is finished
     * @param {Move} move
     * @param {string} fen
     * @param {number} ply
     * @returns {boolean}
     */
    is_finished(move, fen, ply) {
        // 1) stalemate
        let moves = this.chess_moves();
        if (!moves.length) {
            let is_mate = move['m'].slice(-1) == '#';
            LS(is_mate? `${WB_TITLE[ply & 1]} mates.`: 'Stalemate.');
            return true;
        }

        // 2) 50 move rule
        let rule50 = this.fen.split(' ')[4] * 1;
        if (rule50 >= 100) {
            LS('Fifty move rule.');
            return true;
        }

        if (rule50 == 0)
            Clear(this.fens);

        // 3) insufficient material
        let enough = 0,
            materials = ['', ''];
        fen.split(' ')[0].split('').map(item => {
            if ('BNPRQK'.includes(item))
                materials[0] += item;
            else if ('bnprqk'.includes(item))
                materials[1] += item;
        });
        for (let i of [0, 1])
            materials[i] = Lower(materials[i]).split('').sort((a, b) => MATERIAL_ORDERS[a] - MATERIAL_ORDERS[b]);

        for (let material of materials)
            if (material.some(item => 'prq'.includes(item)))
                enough ++;

        if (!enough) {
            for (let i of [0, 1])
                materials[i] = materials[i].join('');

            for (let material of materials)
                if (['k', 'kb', 'kn', 'knn'].includes(material))
                    enough ++;

            if (enough == 2) {
                LS(`Insufficient material: ${materials.join(' vs ')}.`);
                return true;
            }
        }

        // 4) 3-fold repetition
        let prune = fen.split(' ').filter((_, id) => [0, 2, 3].includes(id)).join(' '),
            count = (this.fens[prune] || 0) + 1;
        this.fens[prune] = count;
        if (count >= 3) {
            LS('3-fold repetition.');
            return true;
        }

        return false;
    }

    /**
     * Should we display markers?
     * @param {number} ply
     * @param {number} last_ply
     * @returns {boolean}
     */
    is_ready(ply, last_ply) {
        let delta = (Now(true) - last_key) * 1000;
        return (ply >= last_ply - 1 || delta > Y['key_repeat'] * 2);
    }

    /**
     * Maybe play the move as AI
     */
    maybe_play() {
        let is_ai = this.is_ai();
        this.set_play(!is_ai);
        if (is_ai) {
            this.delayed_picks(true);
            add_timeout('think', () => this.think(), Y['game_every']);
        }
    }

    /**
     * Start a new game
     */
    new_game() {
        let fen = Y['game_new_FEN'];
        if (!fen)
            if (this.frc) {
                let index = RandomInt(960);
                fen = this.chess.fen960(index);
            }
            else
                fen = START_FEN;

        this.destroy_workers(true);
        this.reset(y_x, {evals: true, start_fen: fen});

        this.instant();
        this.render(7);
        this.chess_fen(fen);

        if (this.hook)
            this.hook(this, 'new', null);
        this.maybe_play();
    }

    /**
     * Add a new move
     * @param {Move} move
     */
    new_move(move) {
        // 0) fen/ply
        let fen = this.chess_fen();
        move['fen'] = fen;
        this.chess_mobility(move, true);

        let now = Now(true),
            ply = get_move_ply(move),
            id = ply & 1,
            player = this.players[id];
        move.id = id;

        // 1) user vote?
        if (this.main) {
            let prev_fen = this.moves.length? this.moves[this.moves.length - 1]['fen']: this.start_fen,
                uci = this.chess.ucifyObject(move);
            if ((now - this.move_time) * 1000 > TIMEOUT_vote)
                socket.emit('vote', {'fen': prev_fen, 'move': uci, 'time': now});
            this.arrow(3, move);
        }
        else {
            this.set_fen(fen, true);
            this.clear_high();
            this.picked = null;

            // delete some moves when playing earlier move in PVA
            if (ply < this.moves.length)
                this.moves = this.moves.slice(0, ply);
        }

        // 2) add move + add missing info
        if (!move['mt'])
            move['mt'] = DefaultInt(player.elapsed, 0);
        if (!move['n'])
            move['n'] = '-';
        if (!move['s'])
            move['s'] = '-';

        let eval_ = move['wv'];
        if (!eval_)
            move['wv'] = '-';
        add_player_eval(player, ply, eval_);

        this.add_moves([move], {keep_prev: true});
        this.set_ply(ply);
        this.move_time = now;
        this.eval(this.name, move);

        // 3) maybe finished the game? 50MR / stalemate / win / 3-fold
        if (this.manual) {
            let finished = this.is_finished(move, fen, ply);
            if (finished) {
                this.finished = true;
                play_sound(audiobox, Y['sound_draw']);
                this.play(true, false, 'new_move');
            }

            if (this.hook)
                this.hook(this, 'ply', move);
            this.clock(this.name, (ply + 1) & 1, finished);
        }

        // 4) next player
        this.hide_arrows();
        this.maybe_play();
    }

    /**
     * Output HTML or text to an element or the console
     * @param {string} text
     */
    output(text) {
        switch (this.id) {
        case 'console':
            LS(text);
            break;
        case 'null':
            break;
        default:
            TextHTML(this.xsquares, text);
        }
    }

    /**
     * Pick / release a piece
     * - only HTML for now
     * @param {Event} e
     * @returns {boolean}
     */
    pick(e) {
        let node = Parent(e.target, {class_: 'xpiece'});
        if (!node)
            return false;

        // not highlighted => cannot pick this
        let coord = node.dataset['c'] * 1;
        if (!_(`[data-c="${coord}"] .source`, this.xsquares))
            return false;

        this.picked = (this.picked == coord)? null: coord;
        return true;
    }

    /**
     * Place a picked piece
     * - only HTML for now
     * @param {Event} e
     * @returns {boolean}
     */
    place(e) {
        if (this.picked == null)
            return false;

        // 1) find from and to
        let found = Parent(e.target, {class_: 'xpiece|xsquare'});
        if (!found)
            return false;

        found = found.dataset['c'];
        let square = _(`[data-c="${found}"] > .xhigh`, this.xsquares);
        if (square.style.background == 'transparent')
            return false;

        // 2) try to move, it might be invalid
        // TODO: handle promotions
        let promote = 'q',
            obj = this.chess_move(`${SQUARES_INV[this.picked]}${SQUARES_INV[found]}${promote}`, {decorate: true});
        if (obj['from'] == obj['to'])
            return false;

        // 3) update
        this.set_ai(false);
        this.destroy_workers();
        this.new_move(obj);
    }

    /**
     * Play button was pushed
     * @param {boolean=} stop
     * @param {boolean=} manual button was pressed
     * @param {string=} origin
     */
    play(stop, manual, origin) {
        let key = this.play_id,
            timer = timers[key];

        if (DEV['hold'])
            LS(`play: ${origin} : stop=${stop} : manual=${manual} : cp[${key}]=${timer} : mode=${this.play_mode}`);
        if (stop || timer) {
            clear_timeout(key);
            stop = true;
            this.play_mode = 'play';
        }

        if (stop && manual && this.manual) {
            this.destroy_workers(true);
            let players = this.players;
            players[0].name = HUMAN;
            players[1].name = HUMAN;
        }

        if (stop)
            this.delayed_picks(true);
        else
            this.hold_button('play', 0, manual);
        this.set_play(stop);
    }

    /**
     * Release the hold button
     */
    release() {
        this.hold = null;
    }

    /**
     * Render to the current target
     * @param {number=} dirty
     */
    render(dirty) {
        if (dirty != undefined)
            this.dirty |= dirty;

        if (DEV['board'])
            LS(`render: ${this.dirty}`);

        let func = {
            '3d': this.render_3d,
            'canvas': this.render_canvas,
            'html': this.render_html,
            'text': this.render_text,
        }[this.mode];

        if (func) {
            func.call(this);
            this.animate(this.moves[this.ply], this.smooth);
        }

        // restore smooth
        if (this.smooth0 != -1) {
            this.set_smooth(this.smooth0);
            this.smooth0 = -1;
        }
        this.last_time = Now(true);
        this.frame ++;
    }

    /**
     * 3d rendering
     */
    render_3d() {
        // LS(`render_3d: ${T}`);
        if (!T)
            return;
    }

    /**
     * 2d canvas rendering
     */
    render_canvas() {
        LS('render_canvas');
    }

    /**
     * 2d HTML rendering
     */
    render_html() {
        let colors = this.colors,
            dirty = this.dirty,
            [num_row, num_col] = this.dims,
            rotate = this.rotate;

        // 1) draw empty board + notation
        if (dirty & 1) {
            let lines = [],
                notation = this.notation;

            for (let i = 0; i < num_row; i ++) {
                let row_name = rotate? i + 1: 8 - i;

                for (let j = 0; j < num_col; j ++) {
                    let col_name = COLUMN_LETTERS[ROTATE(rotate, j)],
                        even = (i + j) & 1,
                        note_x = '',
                        note_y = '',
                        square = (i << 4) + j,
                        style = '';

                    if (notation) {
                        style = `;color:${colors[1 - even]}`;
                        if (notation & 2) {
                            if (i == num_row - 1)
                                note_x = `<div class="xnote" style="left:2.67em;top:1.17em">${Upper(col_name)}</div>`;
                        }
                        if (notation & 4) {
                            if (j == rotate * 7)
                                note_y = `<div class="xnote" style="left:${rotate? 2.7: 0.1}em;top:-1.15em">${row_name}</div>`;
                        }
                    }

                    lines.push(
                        `<div class="xsquare" data-c="${rotate? 119 - square: square}" data-q="${col_name}${row_name}" style="background:${colors[even]}${style}">${note_x}${note_y}`
                            + `<div class="xhigh"></div>`
                        + `</div>`
                    );
                }
            }

            this.output(lines.join(''));

            // remember all the nodes for quick access
            this.squares = Assign({}, ...From(A('.xsquare', this.node)).map(node => ({[node.dataset['q']]: node})));
            this.move2 = null;
        }

        // 3) draw pieces
        if (dirty & 2) {
            if (DEV['board'])
                LS(`render_html: num_piece=${this.pieces.length}`);

            let direct = true,
                nodes = [],
                [piece_size, style, transform] = this.get_piece_background(this.size);

            // smooth update?
            this.calculate_smooth();

            // a) pieces that must appear should be moved instantly to the right position
            Keys(this.pieces).forEach(char => {
                let items = this.pieces[char];
                for (let item of items) {
                    let [found, index, node] = item;
                    if (!found || !node || node.style.opacity > 0)
                        continue;

                    let col = ROTATE(rotate, index & 15),
                        row = ROTATE(rotate, index >> 4),
                        style_transform = `${transform} translate(${col * piece_size}px, ${row * piece_size}px)`;
                    Style(node, [['transform', style_transform], ['transition', 'none']]);
                    direct = false;
                }
            });

            // b) create pieces / adjust their position
            AnimationFrame(() => {
                Keys(this.pieces).forEach(char => {
                    let items = this.pieces[char],
                        offset = -SPRITE_OFFSETS[char] * piece_size;

                    for (let item of items) {
                        let [found, index, node] = item,
                            col = index & 15,
                            row = index >> 4;

                        if (!node) {
                            let html = this.create_piece(char, style, offset);
                            node = CreateNode('div', html, {'class': 'xpiece'});
                            nodes.push(node);
                            item[2] = node;
                        }
                        // theme change
                        else if (dirty & 4) {
                            let html = this.create_piece(char, style, offset);
                            HTML(node, html);
                        }

                        if (found) {
                            node.dataset['c'] = (row << 4) + col;
                            col = ROTATE(rotate, col);
                            row = ROTATE(rotate, row);

                            let style_transform =
                                    `${transform} translate(${col * piece_size}px, ${row * piece_size}px)`,
                                z_index = (node.style.transform == style_transform)? 2: 3;

                            Style(node, [
                                ['transform', style_transform],
                                ['opacity', 1],
                                ['pointer-events', 'all'],
                                ['z-index', z_index],
                            ]);
                            Style(node, [['transition', 'none']], false);
                        }
                        else
                            Style(node, [['opacity', 0], ['pointer-events', 'none']]);
                    }
                });

                if (DEV['board'])
                    LS(this.xpieces);

                // insert pieces
                InsertNodes(this.xpieces, nodes);
            }, direct);
        }

        this.dirty = 0;
        Show(this.xframe);
        Show(this.xpieces);
    }

    /**
     * 2d text rendering
     * @returns {string}
     */
    render_text() {
        let grid = this.grid,
            lines = [],
            notation = CONSOLE_NULL[this.id]? this.notation: 0,
            [num_row, num_col] = this.dims,
            off = 0;

        // column notation
        let scolumn = COLUMN_LETTERS.slice(0, num_col).join(' ');
        if (notation & 1)
            lines.push(`+ ${scolumn}`);

        // parse all cells
        for (let i = 0; i < num_row; i ++) {
            let vector = [];

            if (notation & 4)
                vector.push(`${8 - i}`);

            for (let j = 0; j < num_col; j ++)
                vector.push(grid[off + j] || '.');

            if (notation & 8)
                vector.push(`${i + 1}`);

            lines.push(vector.join(' '));
            off += 16;
        }

        if (notation & 2)
            lines.push(`  ${scolumn}`);

        // output result
        let font_size = (notation & 12)? 0.5 * num_col / (num_col + 1): 0.5,
            text = lines.join('\n');
        this.output(`<pre style="font-size:${font_size}em">${text}</pre>`);

        Hide(this.xframe);
        Hide(this.xpieces);
        return text;
    }

    /**
     * Reset the moves
     * @param {string} section
     * @param {Object} obj
     * @param {boolean=} obj.evals reset evals
     * @param {boolean=} obj.instant call instant()
     * @param {boolean=} obj.render
     * @param {string=} obj.start_fen
     */
    reset(section, {evals, instant, render, start_fen}={}) {
        if (this.check_locked())
            return;

        this.start_fen = start_fen || START_FEN;
        this.frc = this.start_fen != START_FEN;

        this.defuses.clear();
        this.exploded = 0;
        this.explodes.clear();
        this.fen = '';
        this.fen2 = '';
        Clear(this.fens);
        this.finished = false;
        this.goal = [-20.5, -1];
        this.grid.fill('');
        this.move_time = Now(true);
        this.moves.length = 0;
        this.next = null;
        this.ply = -1;
        this.seen = 0;
        this.seens.clear();
        this.text = '';

        if (evals)
            this.evals[section].length = 0;

        this.clear_moves();
        if (render)
            this.animate_html();

        this.set_fen(null, render);
        this.set_last(this.last);

        // rotate if human is black
        if (this.name == 'pva') {
            let players = this.players;
            // if (players[0].name != players[1].name)
            //     this.rotate = (players[1].name != AI);

            for (let player of players) {
                Assign(player, {
                    'elapsed': 0,
                    'left': 5400 * 1000,
                    'tc': 5400,
                    'tc2': 10,
                    'time': 0,
                });
            }
        }

        if (instant)
            this.instant();
    }

    /**
     * Resize the board to a desired width
     * @param {number=} width
     * @param {Object} obj
     * @param {boolean=} obj.instant
     * @param {boolean=} obj.render
     */
    resize(width, {instant, render=true}={}) {
        let node = this.node;
        if (!width) {
            if (!node)
                return;
            width = node.clientWidth;
        }

        let border = this.border,
            num_col = this.dims[1],
            size = Floor((width - border * 2) * 2 / num_col) / 2;
        if (this.frame && size == this.size)
            return;

        let frame_size = size * num_col + border * 2,
            frame_size2 = size * num_col,
            min_height = frame_size + 10 + Visible('.xbottom', node) * 23;

        Style(node, [['font-size', `${size}px`]]);
        Style(this.xframe, [['height', `${frame_size}px`], ['width', `${frame_size}px`]]);
        Style(this.xmoves, [['max-width', `${frame_size}px`]]);
        Style(this.xoverlay, [['height', `${frame_size2}px`], ['width', `${frame_size2}px`]]);
        Style('.xbottom, .xcontain, .xtop', [['width', `${frame_size}px`]], true, node);

        if (this.name == 'xfen') {
            border = 0;
            min_height = 'unset';
        }
        Style('.xcontain', [
            ['left', `${border}px`], ['min-height', `${min_height}px`], ['top', `${border}px`]
        ], true, node);

        this.size = size;
        if (instant)
            this.instant();
        if (render)
            this.render(2);
    }

    /**
     * Set the current player AI or HUMAN
     * @param {boolean} ai
     * @param {number=} offset player offset
     */
    set_ai(ai, offset=0) {
        this.players[(1 + this.ply + offset) & 1].name = ai? AI: HUMAN;
    }

    /**
     * Set a new FEN
     * @param {string} fen null for start_fen
     * @param {boolean=} render
     * @param {boolean=} force do it even if locked
     * @returns {boolean}
     */
    set_fen(fen, render, force) {
        if (DEV['board'])
            LS(`${this.id} set_fen: ${fen}`);
        if (!force && this.check_locked())
            return false;
        if (fen == null)
            fen = this.start_fen;

        if (this.fen == fen)
            return true;

        if (!this.analyse_fen(fen))
            return false;

        if (render)
            this.render(2);
        return true;
    }

    /**
     * Set the result (last item in the moves list)
     * @param {string} text
     */
    set_last(text) {
        for (let node of this.node_lasts)
            TEXT(node, text);
    }

    /**
     * Lock/unlock the PV
     * @param {boolean} locked &1:locked, &2:manual
     */
    set_locked(locked) {
        // don't automatically unlock if manually locked
        if (this.locked == 3 && !(locked & 2))
            return;

        if (locked == 2)
            locked = 0;
        this.locked = locked;

        let [lock, unlock] = this.node_locks;
        S(lock, !locked);
        S(unlock, locked);
        Style(unlock, [['color', '#f00']], false);

        if (!locked && this.locked_obj) {
            let [type, param1, param2] = this.locked_obj;
            this.locked_obj = null;
            this.reset(y_x);
            if (type == 'move')
                this.add_moves(param1, param2);
            else if (type == 'text')
                this.add_moves_string(param1, param2);
        }
    }

    /**
     * Set the @ marker + agree length
     * @param {number} ply -2 to hide the marker
     * @param {number=} agree
     * @param {number=} cur_ply
     */
    set_marker(ply, agree, cur_ply) {
        // 1) hide the marker?
        if (ply == -2) {
            for (let node of this.node_markers)
                Class(node, [['marker'], ['seen']], false);
            return;
        }

        // 2) update agree in chart
        let move = this.moves[cur_ply];
        if (move) {
            move.agree = agree;
            move['ply'] = cur_ply;
            this.hook(this, 'agree', move);
        }

        // 3) update the @ marker + agree length
        this.update_memory(this.node_markers, ply, 'marker');

        for (let parent of this.parents)
            TEXT(parent.firstChild, `[${agree}]`);
    }

    /**
     * Set the play/pause icon
     * @param {boolean} play
     */
    set_play(play) {
        if (DEV['hold'])
            LS('set_play', play);
        S('[data-x="pause"]', !play, this.node);
        S('[data-x="play"]', play, this.node);
    }

    /**
     * Set the ply + update the FEN
     * @param {number} ply
     * @param {Object} obj
     * @param {number=} obj.animate
     * @param {boolean=} obj.check only execute if ply != current ply
     * @param {boolean=} obj.instant call instant()
     * @param {boolean=} obj.manual ply was set manually => send the 'ply' in the hook
     * @param {boolean=} obj.no_compute does not computer chess positions (slow down)
     * @param {boolean=} obj.render
     * @returns {Move} move, false if no move + no compute, null if failed
     */
    set_ply(ply, {animate, check, instant, manual, no_compute, render=true}={}) {
        if (DEV['ply'])
            LS(`${this.id}: set_ply: ${ply} : ${animate} : ${manual}`);

        if (check && ply == this.ply)
            return {};

        clear_timeout(`dual_${this.id}`);
        this.clicked = manual;
        this.delayed_ply = -2;

        if (instant)
            this.instant();

        // special case: initial board
        if (ply == -1 && this.main_manual) {
            this.ply = -1;
            this.set_fen(null, true, true);
            this.hide_arrows();
            this.set_seen(ply);
            this.animate({}, animate);
            this.set_seen(-1);
            if (manual)
                this.changed_ply({'ply': -1});
            return {};
        }

        // update the FEN
        // TODO: if delta = 1 => should add_move instead => faster
        let move = this.moves[ply];
        if (!move)
            return null;

        this.ply = ply;
        if (ply > this.seen)
            this.seen = ply;
        this.update_counter();

        if (!move['fen']) {
            if (no_compute)
                return false;
            if (!this.chess_backtrack(ply))
                return null;
        }

        if (!render)
            return move;

        this.set_fen(move['fen'], true, true);

        // new move => remove arrows from the past
        this.hide_arrows();

        // play sound?
        // - multiple sounds can be played with different delays
        let audio = Y['audio_moves'],
            is_last = (ply == this.moves.length - 1),
            can_moves = (audio == 'all' || (is_last && audio == 'last') || (this.play_mode != 'play' && Y['audio_book'])),
            can_source = (this.name == y_x || (this.main && Y['audio_live_archive']) || (this.manual && Y['audio_pva']));

        if (can_source && can_moves) {
            let ratio = this.smooth / 500,
                audio_delay = Y['audio_delay'] * ratio,
                offset = 0,
                text = move['m'] || '???',
                last = text.slice(-1),
                sound = null;

            if (last == '#')
                sound = 'checkmate';
            else if (last == '+')
                sound = 'check';
            else if (text[0] == Upper(text[0]))
                sound = 'move';
            else
                sound = 'move_pawn';

            let sounds = [[sound, audio_delay]],
                speed = this.speed || 500,
                volume = 1 - 0.3 * Exp(-speed * 0.03);

            if (text.includes('x')) {
                let capture_delay = Y['capture_delay'] * ratio;
                if (capture_delay < 0)
                    offset = -capture_delay;
                sounds.push(['capture', audio_delay + capture_delay]);
            }

            sounds.sort((a, b) => (a[1] - b[1]));

            for (let [name, delay] of sounds) {
                if (name[0] == 'm' && speed < 21)
                    continue;
                add_timeout(`ply${ply}+${name}_${this.id}`, () => {
                    play_sound(audiobox, Y[`sound_${name}`], {interrupt: true, volume: volume});
                }, (speed < 21)? 0: delay + offset);
            }
        }

        if (manual)
            this.changed_ply(move);

        this.set_seen(ply);
        if (animate == undefined && (!this.smooth || is_last))
            animate = true;
        this.animate(move, animate);
        return move;
    }

    /**
     * Set the board rotation
     * @param {number} rotate
     * @returns {boolean}
     */
    set_rotate(rotate) {
        if (rotate == this.rotate)
            return false;

        let minis = this.node_minis,
            temp = minis[0];
        minis[0] = minis[1];
        minis[1] = temp;

        Class(minis[0]._, [['xcolor0'], ['xcolor1', 1]]);
        Class(minis[1]._, [['xcolor0', 1], ['xcolor1']]);

        this.rotate = rotate;
        this.instant();
        this.render(7);
        return true;
    }

    /**
     * Set the seen cursor
     * @param {number} ply
     */
    set_seen(ply) {
        this.update_memory(this.node_seens, ply, 'seen', node => {
            let parent = node.parentNode,
                top = node.offsetTop + (node.offsetHeight - parent.clientHeight) / 2;
            if (parent.scrollTop != top)
                parent.scrollTop = top;
        });
    }

    /**
     * Set the smooth value
     * @param {number} smooth
     */
    set_smooth(smooth) {
        if (smooth == this.smooth)
            return;

        this.smooth = smooth;
        if (SMOOTHS.has(smooth))
            return;

        // override the css
        let node = CacheId('extra-css'),
            lines = new Set(TEXT(node).split('\n')),
            smooth_max = Y['smooth_max'],
            smooth_min = Y['smooth_min'];

        SMOOTHS.add(smooth);
        for (let item = smooth_min - smooth_min % 10; item <= smooth_max; item += 10)
            SMOOTHS.add(item);

        for (let item of SMOOTHS) {
            let ms = item / 1000;
            lines.add(`.smooth-${Pad(item, 3)} > div {transition: opacity ${ms}s, transform ${ms}s;}`);
        }
        TEXT(node, [...lines].sort().join('\n'));
    }

    /**
     * Show which pieces can be picked
     * @param {boolean=} force
     */
    show_picks(force) {
        if (!this.manual || timers[this.play_id])
            return;
        if (!force && this.fen == this.fen2)
            return;
        if (this.is_ai())
            return;

        this.chess_load(this.fen);

        let moves = this.chess_moves(),
            froms = new Set(moves.map(move => MoveFrom(move)));

        this.clear_high();
        for (let from of froms)
            this.add_high(from, 'turn');

        this.fen2 = this.fen;
    }

    /**
     * Show PV in pva mode
     * @param {Move} move
     * @returns {string}
     */
    show_pv(move) {
        if (!move['pv'])
            return;

        if (!this.chess2)
            this.chess2 = new Chess();
        if (!move.fen0)
            move.fen0 = this.fen;
        this.chess2.load(move.fen0);

        let moves = ArrayJS(this.chess2.multiUci(move['pv'])),
            number = 0,
            san_list = moves.map(move => {
                let lines = [],
                    ply = move['ply'];
                if (!(ply & 1) || !number) {
                    lines.push(`<i class="turn">${Floor(ply / 2 + 1)}.</i>`);
                    // first move with black => ...
                    if (ply & 1)
                        lines.push('<i>...</i>');
                }
                lines.push(`<i class="real">${resize_text(move['m'], 4, 'mini-move')}</i>`);
                number ++;
                return lines.join('');
            }).join('');

        if (san_list)
            HTML(CacheId('pva-pv'), `<i class="agree">[${this.depth}/${moves.length}]</i>${san_list}`);
        return san_list;
    }

    /**
     * Think ...
     * @param {boolean} suggest
     * @param {number=} step used in iterative mode
     * @returns {boolean} true if the AI was able to play
     */
    think(suggest, step) {
        // disable this for tests
        if (this.finished || IS_NODE)
            return;

        let moves, num_move,
            chess = this.chess,
            color = (1 + this.ply) & 1,
            fen = this.fen,
            folds = [];

        // busy thinking => return
        // 8/6R1/5k2/8/8/8/7r/K7 w - - 52 129
        let reply = SetDefault(this.replies, fen, {});
        if (reply.lefts && reply.moves && !reply.lefts.every(item => !item))
            return true;

        // 1) first step => reinitialise things
        if (!step) {
            if (this.thinking) {
                LS('thinking');
                return;
            }
            if (!suggest)
                this.clear_high();

            this.pv_string = '';
            Clear(this.pv_strings);
            Clear(this.scores);
            this.set_play(false);
            this.create_workers();

            // check moves
            chess.load(fen, false);
            moves = this.chess_moves();
            num_move = moves.length;
            if (!num_move)
                return false;

            // shuffle a bit
            moves.sort((a, b) => MoveOrder(b) - MoveOrder(a) + GaussianRandom() * 16 - 8);

            // check for 3-fold moves
            let fen_set = new Set(Keys(this.fens).filter(key => this.fens[key] >= 2));
            for (let move of moves) {
                chess.makeMove(move);
                let splits = chess.fen().split(' '),
                    prune = `${splits[0]} ${splits[2]} ${splits[3]}`,
                    rule50 = splits[4] * 1,
                    draw = (rule50 >= 100 || fen_set.has(prune));

                if (!draw && fen_set.size && rule50) {
                    let moves2 = this.chess_moves();
                    for (let move2 of moves2) {
                        chess.makeMove(move2);
                        let splits2 = chess.fen().split(' '),
                            prune2 = `${splits2[0]} ${splits2[2]} ${splits2[3]}`;
                        if (fen_set.has(prune2)) {
                            if (DEV['engine'])
                                LS(`DRAW WITH ${chess.ucifyMove(move)} THEN ${chess.ucifyMove(move2)}`);
                            draw = true;
                        }
                        chess.undo();
                    }
                }
                if (draw) {
                    let uci = chess.ucifyMove(move);
                    move = chess.unpackMove(move);
                    Assign(move, {
                        'm': uci,
                        'score': -1,
                    });
                    folds.push(move);
                }
                chess.undo();
            }
        }
        // 2) in iteration
        else {
            folds = reply.folds;
            moves = reply.moves2;
            num_move = moves.length;

            // order moves based on the previous scores
            let scores = this.scores;
            moves.sort((a, b) => scores[chess.ucifyMove(a)] < scores[chess.ucifyMove(b)]? 1: -1);
            // LS(moves.map(move => `${chess.ucifyMove(move)}:${scores[chess.ucifyMove(move)]}`).join(' '));
        }

        // 3) setup combined reply
        let now = Now(true),
            scolor = WB_LOWER[color],
            num_worker = this.workers.length,
            options = Y[`game_options_${scolor}`];

        chess.configure(this.frc, options, -1);
        let params = chess.params(),
            min_depth = params[0],
            search_mode = params[3],
            max_time = params[4];

        Assign(reply, {
            avg_depth: 0,
            count: 0,
            lefts: I8(num_worker),
            moves: [],
            nodes: 0,
            sel_depth: 0,
            start: now,
        });

        if (!step) {
            this.depth = 4;
            this.min_depth = min_depth;
            this.max_time = max_time;
            Assign(reply, {
                all_elapsed: [],
                all_nodes: [],
                folds: folds,
                moves2: moves,
                nodes2: 0,
                start2: now,
            });
        }

        // show clock
        this.thinking = true;
        if (!step)
            this.clock(this.name, color);

        // 4) pure random + insta move?
        if (search_mode == 0 || (!min_depth && !max_time) || num_worker < 1 || num_move < 2) {
            let id = RandomInt(num_move),
                move = chess.unpackMove(moves[id]);
            Assign(move, {
                'depth': '-',
                'score': '-',
            });
            this.worker_message({
                'data': {
                    'avg_depth': 0,
                    'fen': fen,
                    'frc': this.frc,
                    'id': -2,
                    'moves': [move],
                    'nodes': 0,
                    'sel_depth': 0,
                    'suggest': suggest,
                },
            });
            return true;
        }

        // 5) split moves across workers
        let masks = [],
            specials = new Set(folds.map(fold => fold['m']));
        for (let i = 0; i < num_worker; i ++)
            masks.push([]);

        for (let i = 0; i < num_move; i ++) {
            let move = moves[i],
                uci = chess.ucifyMove(move);
            if (specials.has(uci))
                continue;
            let id = i % num_worker;
            masks[id].push(move);
        }
        for (let id = 0; id < num_worker; id ++)
            if (masks[id].length)
                reply.lefts[id] = id + 1;

        // 6) send messages
        if (folds.length) {
            this.worker_message({
                'data': {
                    'avg_depth': 0,
                    'fen': fen,
                    'frc': this.frc,
                    'id': -1,
                    'moves': folds,
                    'nodes': 0,
                    'sel_depth': 0,
                    'suggest': suggest,
                },
            });
        }
        for (let id = 0; id < num_worker; id ++) {
            if (!masks[id].length)
                continue;
            this.workers[id].postMessage({
                'depth': max_time? this.depth: min_depth,
                'engine': Y['game_wasm']? 'wasm': 'js',
                'func': 'think',
                'fen': fen,
                'frc': this.frc,
                'id': id,
                'moves': U32(masks[id]),
                'options': options,
                'pv_string': this.pv_string,
                // TODO: remove folds once chess.js can recognize 3-fold itself
                'scan_all': (max_time && !step) || options.includes('X=') || folds.length,
                'search': Y['search'],
                'suggest': suggest,
            });
        }

        return true;
    }

    /**
     * Update the counter
     */
    update_counter() {
        let node = this.node_count,
            unseen = this.moves.length - 1 - this.seen;
        S(node, unseen > 0);
        TEXT(node, this.moves.length - 1 - this.seen);
    }

    /**
     * Update current/marker/seen + memory
     * @param {Array<Node>} memory
     * @param {number} ply
     * @param {string} class_
     * @param {Function=} callback
     * @returns {boolean}
     */
    update_memory(memory, ply, class_, callback) {
        let list = this.move_list[(ply == -1)? 0: (ply << 1) + 1];
        if (!list)
            return false;

        list[3].forEach((child, id) => {
            let current2 = memory[id];
            if (child == current2)
                return;

            Class(current2, [[class_]], false);
            Class(child, [[class_]]);
            memory[id] = child;
            if (callback)
                callback(child);
        });
        return true;
    }

    /**
     * Update mini information in PVA
     * @param {number} id
     * @param {Object=} stats
     */
    update_mini(id, stats) {
        let mini = this.node_minis[id],
            player = this.players[id],
            dico = Assign({}, player);

        if (stats)
            Assign(dico, stats);

        TextHTML(mini.eval_, format_eval(dico.eval, true));

        if (this.name == 'pva') {
            TEXT(mini.left, Undefined(dico.stime, '-'));
            HTML(mini.short, `<div>${Undefined(dico.node, '-')}</div><div>${Undefined(dico.speed, '-')}</div>`);
            TEXT(mini.time, Undefined(dico.depth, '-'));

            let arrow = player.arrow;
            if (arrow)
                this.arrow(arrow[0], arrow[1]);
        }
        else {
            TEXT(mini.left, player.sleft);
            TextHTML(mini.short, resize_text(player.short, 15));
            TEXT(mini.time, player.stime);
        }
    }

    /**
     * Update mobility
     * @param {Array<Move>} moves
     */
    update_mobility(moves) {
        if (!this.main_manual)
            return;
        let fen = this.start_fen;
        for (let move of moves) {
            if (!move)
                continue;

            let no_load;
            if (!move['fen']) {
                this.chess_load(fen);
                let result = this.chess_move(move['m']);
                assign_move(move, result);
                move['fen'] = this.chess_fen();
                no_load = true;
            }
            this.chess_mobility(move, no_load);
            fen = move['fen'];
        }
    }

    /**
     * Update move list
     * @param {string} origin
     * @param {Set<number>} visibles
     * @param {!Object<number, string>} texts
     * @param {number} cur_ply
     * @param {number=} agree agree length
     * @param {boolean=} keep_prev keep previous moves
     */
    update_move_list(origin, visibles, texts, cur_ply, agree, keep_prev) {
        let cur_id = (cur_ply << 1) + 1,
            dones = new Set(),
            move_list = this.move_list,
            num_child = move_list.length;

        // 1) fill past data
        for (let id = num_child; id <= (cur_ply + 2) << 1; id ++) {
            let dico, tag,
                id4 = id % 4,
                ply = Floor(id / 2),
                [text, flag] = texts[id] || ['', 0],
                visible = visibles.has(id)? 1: 0;

            if (id4 == 0) {
                let turn = id / 4 + 1;
                dico = {'class': `turn${visible? '': ' dn'}`};
                if (turn == 1) {
                    dico['data-i'] = -1;
                    tag = 'a';
                }
                else
                    tag = 'i';
                text = resize_text(turn, 2, 'mini-turn');
            }
            else if (id4 == 2) {
                dico = {'class': 'dn'};
                tag = 'i';
                text = null;
            }
            // 1:white, 3:black
            else {
                dico = {
                    'class': `real${(flag & 1)? ' book': ''}${(flag & 2)? ' fail': ''}${visible? '': ' dn'}`,
                    'data-i': ply,
                };
                tag = 'a';
                if (text)
                    text = resize_text(text, 4, 'mini-move');
                else
                    text = '';
            }
            dones.add(id);

            let list = [visible? 1: 0, text, flag, []];
            for (let parent of this.parents) {
                let node = CreateNode(tag, text, dico);
                parent.appendChild(node);
                list[3].push(node);
            }
            move_list[id] = list;
        }
        this.dones = dones;

        // 2) change visibilities
        move_list.forEach((list, id) => {
            if (dones.has(id))
                return;

            let visible = visibles.has(id)? 1: 0;
            if (list[0] == visible || (!visible && keep_prev && id < cur_id))
                return;

            list[0] = visible;
            if (visible)
                for (let child of list[3])
                    child.classList.remove('dn');
            else
                for (let child of list[3])
                    child.classList.add('dn');
        });

        // 3) change texts + book class
        Keys(texts).forEach(id => {
            if (dones.has(id))
                return;

            let list = move_list[id],
                node = list[3][0],
                [text, flag] = texts[id] || ['', 0],
                new_flag = list[2] ^ flag;

            list[1] = text;
            list[2] = flag;
            text = resize_text(text, 4, 'mini-move');

            // text
            if (node)
                node = node.firstChild;
            if (text[0] == '<' || !node || node.nodeType != 3)
                for (let child of list[3])
                    child.innerHTML = text;
            else
                for (let child of list[3])
                    child.firstChild.nodeValue = text;

            // book + fail
            if (new_flag) {
                if (new_flag & 1)
                    for (let child of list[3])
                        Class(child, [['book']], flag & 1);
                if (new_flag & 2)
                    for (let child of list[3])
                        Class(child, [['fail']], flag & 2);
            }
        });

        // 4) agree
        for (let parent of this.parents) {
            let child = parent.firstChild;
            Class(child, [[origin]]);
            if (agree != undefined)
                child.firstChild.nodeValue = `[${agree}]`;
        }
    }

    /**
     * Receive a worker message
     * 8/7p/8/1P1P2kP/P1P1p3/3r1r2/4K1BR/R7 b - - 2 47
     * @param {Event} e
     */
    worker_message(e) {
        if (this.finished)
            return;

        let data = e['data'],
            avg_depth = data['avg_depth'],
            fen = data['fen'],
            hash_stats = data['hash_stats'] || [0, 0, 0, 0],
            id = data['id'],
            moves = data['moves'],
            nodes = data['nodes'],
            sel_depth = data['sel_depth'],
            suggest = data['suggest'];

        // 1) reject if FEN doesn't match
        let reply = this.replies[this.fen];
        if (!reply) {
            LS(`error, no reply for ${this.fen}`);
            return;
        }
        if (fen != this.fen)
            return;

        // 2) combine moves
        let combine = reply.moves;
        if (id >= 0)
            reply.lefts[id] = 0;

        for (let obj of moves) {
            if (obj['from'] != obj['to'])
                combine.push(obj);
            this.pv_strings[obj['m']] = obj['pv'];
            this.scores[obj['m']] = obj['score'];
        }

        reply.avg_depth += avg_depth * nodes;
        reply.nodes += nodes;
        reply.nodes2 += nodes;
        if (sel_depth > reply.sel_depth)
            reply.sel_depth = sel_depth;

        // still expecting more data?
        if (DEV['engine2']) {
            let lefts = From(reply.lefts).map(left => left? (left - 1).toString(16): '.').join(''),
                obj = moves[0],
                eval_ = format_eval(obj? obj['score']: '-').padStart(7);
            if (!reply.count)
                LS(this.fen);
            LS(`>> ${id}${fen == this.fen? '': 'X'} : ${obj? obj['m']: '----'} : ${eval_} : ${lefts} : ${combine.length}`);
        }
        reply.count ++;
        if (!reply.lefts.every(item => !item))
            return;

        // 3) got all the data
        let nodes2 = reply.nodes2,
            now = Now(true),
            elapsed = now - reply.start,
            elapsed2 = now - reply.start2,
            nps = (elapsed2 > 0.001)? nodes2 / elapsed2: 0;

        // get the best move
        combine.sort((a, b) => b['score'] - a['score']);
        let best = combine[0];
        if (!best) {
            LS('no legal move to play');
            return;
        }
        this.pv_string = this.pv_strings[best['m']];

        // 4) update
        let best_score = best['score'],
            is_iterative = (this.max_time != 0 && Abs(best_score) < 200),
            ply = get_fen_ply(fen),
            color = (1 + ply) & 1,
            player = this.players[color];

        if (color)
            best_score *= -1;

        if (id >= -1) {
            Assign(player, {
                'depth': `${(reply.avg_depth / (reply.nodes + 1)).toFixed(0)}/${Floor(reply.sel_depth + 0.5)}`,
                'eval': format_eval(best_score),
                'id': color,
                'node': format_unit(nodes2, '-'),
                'pv': best['pv'],
                'ply': ply + 1,
                'speed': `${format_unit(nps)}nps`,
                'wv': format_eval(best_score),
            });
            this.update_mini(color);
            this.eval(this.name, player);

            if (Y['game_PV'])
                this.show_pv(best);
        }

        // 6) iterative thinking?
        let predict = 0;
        if (is_iterative) {
            let all_elapsed = reply.all_elapsed,
                all_nodes = reply.all_nodes,
                length = all_nodes.length;
            all_elapsed.push(elapsed);
            all_nodes.push(reply.nodes);

            if (length > 0) {
                let ratio_nodes = all_nodes[length] / all_nodes[length - 1],
                    extra = elapsed * ratio_nodes;

                predict = elapsed2 + extra;
                is_iterative = best['score'] < 300 && (this.depth < this.min_depth || predict < this.max_time);
                if (DEV['engine'])
                    LS(`#${this.depth}: ${best['pv']}`);
            }
        }

        if (is_iterative) {
            moves = combine.filter(obj => !obj.special);
            if (moves.length > 1) {
                // arrow?
                if (this.depth >= 3 && predict > 1) {
                    let arrow = Y['game_arrow'];
                    if (arrow != 'none') {
                        if (arrow == 'color')
                            arrow = color;
                        else if (arrow == 'kibitz')
                            arrow = color + 2;
                        else
                            arrow = arrow.slice(-1) * 1;
                        add_timeout(`xarrow_${this.id}`, () => {
                            player.arrow = [arrow, best];
                            this.arrow(arrow, best);
                        }, TIMEOUT_arrow);
                    }
                }

                this.depth ++;
                this.think(suggest, 1);
                return;
            }
        }

        // TT hits
        let hits = hash_stats[1] || 0,
            tb = (hits && nodes2)? (hits * 100) / nodes2: 0;

        if (DEV['engine2']) {
            if (hits && nodes2)
                LS(`hits: ${tb.toFixed(2)}% = ${hits}/${nodes2}`);
            LS(combine);
        }

        // 7) stop things
        Hide(`.xcolor${color} .xcog`, this.node);
        this.thinking = false;

        // arrow suggest
        if (suggest) {
            player.arrow = [color + 2, best];
            this.arrow(color + 2, best);
            this.set_play(true);
            return;
        }

        // 8) move
        if (id > -1) {
            player.stime = FromSeconds(elapsed2).slice(1, -1).map(item => Pad(item)).join(':');
            this.update_mini(color);
        }

        let result = this.chess_move(best, {decorate: true});
        Assign(result, {
            '_fixed': 2,
            'd': (reply.avg_depth / (reply.nodes + 1)).toFixed(0),
            'fen0': best.fen0,
            'mt': Floor(elapsed2 * 1000 + 0.5),
            'n': nodes2,
            'pv': best['pv'],
            's': Floor(nps + 0.5),
            'sd': Floor(reply.sel_depth + 0.5),
            'tb': tb,
            'wv': format_eval(best_score),
        });
        this.new_move(result);
    }
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// <<
if (typeof exports != 'undefined')
    Assign(exports, {
        SPRITE_OFFSETS: SPRITE_OFFSETS,
        START_FEN: START_FEN,
        WB_TITLE: WB_TITLE,
        XBoard: XBoard,
    });
// >>
