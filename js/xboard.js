// xboard.js
// @author octopoulo <polluxyz@gmail.com>
// @version 2020-05-10
//
// game board:
// - 4 rendering modes:
//      ~ 3d
//      - canvas
//      + html
//      + text
// - games:
//      + chess
//      - chess960
//      - go (future)
//
// included after: common, engine, global, 3d
//
// 128 SQUARES idea taken from chess.js:
// @license
// Copyright (c) 2016, Jeff Hlywa (jhlywa@gmail.com)
// Released under the BSD license
// https://github.com/jhlywa/chess.js/blob/master/LICENSE
//
/*
globals
_, A, Abs, add_timeout, Assign, audiobox, C, Chess, Clamp, Class, clear_timeout, CopyClipboard, CreateNode,
CreateSVG, DEV, Events, extract_fen_ply, Floor, get_move_ply, HasClass, Hide, HTML, Id, InsertNodes, Keys, Lower, LS,
merge_settings, Min, Now, ON_OFF, play_sound, S, SetDefault, Show, Sign, Split, split_move_string, Style, T, timers,
update_svg, Upper, Visible, window, Y
*/
'use strict';

let COLUMN_LETTERS = 'abcdefghijklmnopqrst'.split(''),
    CONSOLE_NULL = {
        console: 1,
        null: 1,
    },
    CONTROLS = {
        start: {
            class: 'mirror',
            icon: 'end',
        },
        prev: {
            class: 'mirror',
            icon: 'next',
        },
        play: {
            dual: 'pause',
        },
        next: '',
        end: '',
        rotate: 'Rotate board',
        copy: 'Copy FEN',
        lock: {
            dual: 'unlock',
        },
    },
    FIGURES = 'bknpqrBKNPQR'.split(''),
    LETTER_COLUMNS = Assign({}, ...COLUMN_LETTERS.map((letter, id) => ({[letter]: id}))),
    // piece moves based on the SQUARES
    // - p2 = there must be an piece of the opposite color
    PIECE_MOVES = {
        b: [-17, -15, 15, 17],
        k: [-17, -16, -15, -1, 1, 15, 16, 17],
        n: [-33, -31, -18, -14, 14, 18, 31, 33],
        P: [-16],
        P2: [-17, 17],
        p: [16],
        p2: [-15, 15],
        q: [-17, -16, -15, -1, 1, 15, 16, 17],
        r: [-16, -1, 1, 16],
    },
    SPRITE_OFFSETS = Assign({}, ...FIGURES.map((key, id) => ({[key]: id}))),
    SQUARES = {
        a8:   0, b8:   1, c8:   2, d8:   3, e8:   4, f8:   5, g8:   6, h8:   7,
        a7:  16, b7:  17, c7:  18, d7:  19, e7:  20, f7:  21, g7:  22, h7:  23,
        a6:  32, b6:  33, c6:  34, d6:  35, e6:  36, f6:  37, g6:  38, h6:  39,
        a5:  48, b5:  49, c5:  50, d5:  51, e5:  52, f5:  53, g5:  54, h5:  55,
        a4:  64, b4:  65, c4:  66, d4:  67, e4:  68, f4:  69, g4:  70, h4:  71,
        a3:  80, b3:  81, c3:  82, d3:  83, e3:  84, f3:  85, g3:  86, h3:  87,
        a2:  96, b2:  97, c2:  98, d2:  99, e2: 100, f2: 101, g2: 102, h2: 103,
        a1: 112, b1: 113, c1: 114, d1: 115, e1: 116, f1: 117, g1: 118, h1: 119,
    },
    SQUARES_INV = Assign({}, ...Keys(SQUARES).map(key => ({[SQUARES[key]]: key}))),
    // https://en.wikipedia.org/wiki/Forsyth%E2%80%93Edwards_Notation
    // KQkq is also supported instead of AHah
    START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    TIMEOUT_click = 200;

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
     * - count          // add a counter in a red circle
     * - dims           // [num_col, num_row]
     * - hook           // events callback
     * - id             // output selector for HTML & text, can be 'console' and 'null' too
     * - last           // default result text, ex: *
     * - list           // show move list history
     * - live_id        // live engine id => will show arrows on the main board
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
        this.count = options.count;
        this.dims = options.dims || [8, 8];
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
        this.colors = ['#eee', '#111'];
        this.coords = {};
        this.delayed_ply = -2;
        this.dirty = 3;                                 // &1:board/notation, &2:pieces, &4:theme change
        this.dual = null;
        this.evals = [];                                // eval history
        this.fen = START_FEN;                           // current fen
        this.goal = [-20.5, -1];
        this.grid = new Array(128);
        this.high_color = '';                           // highlight color
        this.high_size = 0.06;                          // highlight size
        this.hold = null;                               // mouse/touch hold target
        this.hold_step = 0;
        this.hold_time = 0;                             // last time the event was repeated
        this.locked = false;
        this.locked_obj = null;
        this.markers = [];                              // @
        this.move2 = null;                              // previous move
        this.moves = [];                                // move list
        this.next = null;
        this.next_smooth = false;                       // used to temporarily prevent transitions
        this.node = _(this.id);
        this.nodes = {};
        this.overlay = null;                            // svg objects will be added there
        this.picked = null;                             // picked piece
        this.pieces = {};                               // b: [[found, row, col], ...]
        this.play_mode = 'play';
        this.ply = 0;                                   // current ply
        this.pv_node = _(this.pv_id);
        this.real = null;                               // pointer to a board with the real moves
        this.seen = 0;                                  // last seen move -> used to show the counter
        this.svgs = [];                                 // svg objects for the arrows
        this.text = '';                                 // current text from add_moves_string
        this.valid = true;
        this.xmoves = null;
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
     * @param {Move[]} moves
     * @param {number=} cur_ply if defined, then we want to go to this ply
     */
    add_moves(moves, cur_ply) {
        if (this.check_locked(['move', moves, cur_ply]))
            return;

        let is_ply = (cur_ply != undefined),
            lines = [],
            num_book = 0,
            num_new = moves.length,
            num_move = this.moves.length,
            parent_lasts = [this.xmoves, this.pv_node]
                .filter(parent => parent)
                .map(parent => {
                    let last = _('.last', parent);
                    if (!last && this.last) {
                        last = CreateNode('i', this.last, {class: 'last'});
                        parent.appendChild(last);
                    }
                    return [parent, last];
                }),
            start = 0;

        // add the initial position
        if (!num_move && this.main)
            start = -1;

        // proper moves
        for (let i = start; i < num_new; i ++) {
            let extra = '',
                move = moves[i],
                ply = get_move_ply(move);

            if (move) {
                move.ply = ply;
                this.moves[ply] = move;
                num_book += move.book;
            }

            // TODO: remove this ... sometimes we need to add missing nodes
            if (i >= 0 && ply < num_move)
                continue;

            // indicate current ply
            if (is_ply && ply == cur_ply) {
                // lines.push('<i>#</i>');
                extra = ' current';
            }

            if (ply % 2 == 0) {
                if (is_ply)
                    lines.push(`<i class="turn">${1 + ply / 2}.</i>`);
                else
                    for (let [parent, last] of parent_lasts) {
                        let node = CreateNode(i < 0? 'a': 'i', `${1 + ply / 2}.`, (i < 0)? {class: 'turn', 'data-i': -1}: {class: 'turn'});
                        parent.insertBefore(node, last);
                    }
            }
            else if (!i && is_ply)
                lines.push(`<i class="turn">${Floor(1 + ply / 2)}</i> ..`);

            if (move && move.m) {
                let class_ = `${move.book? 'book': 'real'}${extra}`;
                if (is_ply)
                    lines.push(`<a class="${class_}" data-i="${ply}">${move.m}</a>`);
                else
                    for (let [parent, last] of parent_lasts) {
                        let node = CreateNode('a', `${move.m}`, {class: class_, 'data-i': ply});
                        parent.insertBefore(node, last);
                    }
            }
        }

        if (is_ply)
            for (let [parent] of parent_lasts)
                HTML(parent, lines.join(''));

        let last_move = this.moves.length - 1;
        this.valid = true;

        // update the cursor
        // - if live eval (is_ply) => check the dual board to know which ply to display
        if (is_ply)
            this.compare_duals(cur_ply);
        else if (this.ply >= num_move - 1) {
            // play book moves 1 by 1
            if (num_book && num_book >= num_new) {
                if (!timers.click_play) {
                    this.set_fen(START_FEN, true);
                    this.ply = -1;
                    this.play_mode = 'book';
                    this.play();
                }
            }
            else
                this.set_ply(last_move, {animate: true});
        }

        this.update_counter();

        // update mobility
        if (this.main) {
            for (let move of moves) {
                if (!move.fen)
                    continue;
                this.chess_mobility(move);
            }
        }
    }

    /**
     * Same as add_moves but with a string, only contains notations, no fen
     * - used in live pv, not for real moves
     * - completely replaces the moves list with this one
     * @param {string} text
     * @param {number=} cur_ply if defined, then we want to go to this ply
     */
    add_moves_string(text, cur_ply) {
        if (!text)
            return;

        // 1) no change or older => skip
        if (this.text == text || this.text.includes(text))
            return;
        if (this.check_locked(['text', text, cur_ply]))
            return;

        let [new_ply, new_items] = split_move_string(text),
            [old_ply] = split_move_string(this.text),
            want_ply = cur_ply? cur_ply: new_ply;
        if (new_ply < old_ply) {
            if (DEV.ply)
                LS(`${this.id}: add_moves_string: ${new_ply} < ${old_ply}`);
            // return;
        }

        this.text = text;

        // 2) update the moves
        let first_ply = -1,
            lines = [],
            moves = [],
            ply = new_ply;

        new_items.forEach(item => {
            if (first_ply < 0 && ply >= 0)
                first_ply = ply;

            if (item == '...') {
                lines.push('<i>...</i>');
                ply ++;
                return;
            }
            // turn? => use it
            else if ('0123456789'.includes(item[0])) {
                let turn = parseInt(item);
                ply = (turn - 1) * 2;
                lines.push(`<i class="turn">${turn}.</i>`);
                return;
            }
            // normal move
            else {
                moves[ply] = {
                    m: item,
                };
                lines.push(`<a class="real${(ply == want_ply)? ' current': ''}" data-i="${ply}">${item}</a>`);
                ply ++;
            }
        });

        this.moves = moves;
        this.valid = true;

        // only update if this is the current ply + 1, or if we want a specific ply
        let is_current = (new_ply == cur_ply);
        if (!is_current && this.real) {
            Assign(SetDefault(moves, this.real.ply, {}), {fen: this.real.fen});
            is_current = (new_ply == this.real.ply + 1);
        }

        if (is_current) {
            let html = lines.join('');
            for (let parent of [this.xmoves, this.pv_node])
                HTML(parent, html);

            // 3) update the cursor
            // live engine => show an arrow for the next move
            if (this.live_id != undefined || Visible(this.vis)) {
                let move = this.set_ply(new_ply, {hold: true});
                if (this.hook) {
                    this.next = move;
                    this.hook(this, 'next', move);
                }
            }

            // show diverging move in PV
            this.compare_duals(want_ply);
        }
    }

    /**
     * Analyse the FEN and extract piece coordinates from it
     * - ideally do this only when starting a new game
     * @returns {boolean}
     */
    analyse_fen() {
        // 1) create the grid + count the pieces
        let chars = [],
            counts = {},
            grid = this.grid,
            items = this.fen.split(' '),
            off = 0,
            lines = items[0].split('/'),
            pieces = this.pieces;

        if (items.length < 6)
            return false;

        grid.fill('');

        for (let line of lines) {
            let col = 0;
            for (let char of line.split('')) {
                // piece
                if (isNaN(char)) {
                    grid[off + col] = char;
                    chars.push([char, off + col]);
                    let count = (counts[char] || 0) + 1,
                        items = pieces[char];

                    counts[char] = count;
                    if (count > items.length)
                        items.push([0, -1]);
                    col ++;
                }
                // void
                else
                    col += parseInt(char);
            }

            off += 16;
        }

        // 2) match chars and pieces
        Keys(pieces).forEach(key => {
            for (let piece of pieces[key])
                piece[0] = 0;
        });

        // perfect matches
        for (let char of chars) {
            for (let item of pieces[char[0]]) {
                if (!item[0] && char[1] == item[1]) {
                    item[0] = 1;
                    char[0] = '';
                    break;
                }
            }
        }

        // imperfect matches
        for (let [char, index] of chars) {
            if (!char)
                continue;

            let win,
                best = Infinity,
                items = pieces[char];
            for (let item of items) {
                if (item[0])
                    continue;
                let diff = Abs((index >> 4) - (item[1] >> 4)) + Abs((index % 16) - (item[1] % 16));
                if (diff < best) {
                    best = diff;
                    win = item;
                }
            }
            win[0] = 1;
            win[1] = index;
        }

        // move non found pieces off the board
        let [num_row] = this.dims;
        Keys(pieces).forEach(key => {
            for (let piece of pieces[key])
                if (!piece[0])
                    piece[1] = -num_row;
        });

        this.grid = grid;
        this.valid = true;
        return true;
    }

    /**
     * Animate / render a move
     * - highlight_delay = 0 => always show the highlight in smooth/history
     * -                 < 0    never  ------------------------------------
     * -                 > 0    will   ------------------------------------
     * @param {Move=} move
     * @param {boolean} animate
     */
    animate(move, animate) {
        if (!move)
            return;
        let func = `animate_${this.mode}`;
        if (this[func]) {
            let delay = Y.highlight_delay;
            this[func](move, animate || !delay);
            if (!animate && delay > 0)
                add_timeout(`animate_${this.id}`, () => {this[func](move, true);}, delay);
        }
    }

    /**
     * Animate a move in 3D
     * @param {Move} move
     * @param {boolean} animate
     */
    animate_3d(move, animate) {
        if (!T)
            return;
        LS(`${move.from}${move.to}`);
    }

    /**
     * Animate a move on the canvas
     * @param {Move} move
     * @param {boolean} animate
     */
    animate_canvas(move, animate) {
        LS(`${move.from}${move.to}`);
    }

    /**
     * Animate a move in the DOM
     * @param {Move} move
     * @param {boolean} animate false => remove highlights
     */
    animate_html(move, animate) {
        let prev = this.move2;
        if (prev) {
            Style(prev.node_from, 'box-shadow: none');
            Style(prev.node_to, 'box-shadow: none');
        }
        if (!animate)
            return;

        let color = this.high_color,
            node_from = this.nodes[SQUARES_INV[move.from] || move.from],
            node_to = this.nodes[SQUARES_INV[move.to] || move.to],
            size = this.high_size,
            high_style = `box-shadow: inset 0 0 ${size}em ${size}em ${color}`;

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
     * @param {string} color
     */
    arrow(id, dico, color) {
        let func = `arrow_${this.mode}`;
        if (this[func])
            this[func](id, dico, color);
    }

    /**
     * Display a 3d arrow
     * @param {number} id
     * @param {Object} dico
     * @param {string} color
     */
    arrow_3d(id, dico, color) {

    }

    /**
     * Draw an arrow on the canvas
     * @param {number} id
     * @param {Object} dico
     * @param {string} color
     */
    arrow_canvas(id, dico, color) {

    }

    /**
     * Create an SVG arrow
     * @param {number} id svg id, there can be multiple arrows
     * @param {Object} dico contains move info, if null then hide the arrow
     * @param {string} color
     */
    arrow_html(id, dico, color) {
        // 1) no move => hide the arrow
        if (!dico || !dico.piece || !Y.arrow_opacity) {
            Hide(this.svgs[id]);
            return;
        }

        // 2) got a move => calculate the arrow
        let path,
            x1 = dico.from % 16,
            x2 = dico.to % 16,
            y1 = dico.from >> 4,
            y2 = dico.to >> 4;

        if (this.rotate) {
            x1 = 7 - x1;
            x2 = 7 - x2;
            y1 = 7 - y1;
            y2 = 7 - y2;
        }

        x1 = 5 + 10 * x1;
        x2 = 5 + 10 * x2;
        y1 = 5 + 10 * y1;
        y2 = 5 + 10 * y2;

        // knight = L shape path
        if (dico.piece == 'n') {
            let x3, y3;
            if (Abs(x1 - x2) > Abs(y1 - y2)) {
                x3 = x2;
                y3 = y1;
                y2 += Sign(y1 - y2) * 2.5;
            }
            else {
                x3 = x1;
                y3 = y2;
                x2 += Sign(x1 - x2) * 2.5;
            }
            path = `M${x1} ${y1} L${x3} ${y3} L${x2} ${y2}`;
        }
        // diagonal => divide factor by sqrt(2)
        else {
            let factor = (x1 == x2 || y1 == y2)? 2.5: 1.77;
            x2 += Sign(x1 - x2) * factor;
            y2 += Sign(y1 - y2) * factor;
            path = `M${x1} ${y1} L${x2} ${y2}`;
        }

        // 2 arrows have the same path => hide the other + modify the color
        let other = this.svgs[1 - id];
        if (other) {
            let path2 = _('path', other).getAttribute('d');
            if (path == path2) {
                color = Y.graph_combine_23;
                Hide(other);
            }
            // other color might be green => should recolor it
            else if (Visible(other)) {
            }
        }

        // 3) show the arrow
        let body = this.create_svg(id);
        HTML(_('svg', body), `<path stroke="${color}" stroke-width="${Y.arrow_width}" d="${path}"/>`);
        Style(body, `opacity:${Y.arrow_opacity}`);
        Show(body);
    }

    /**
     * Check if there's a delayed ply
     */
    check_delayed_ply() {
        let ply = this.delayed_ply;
        if (ply > -2)
            this.set_ply(ply);
    }

    /**
     * Call this when new moves arrive
     */
    check_locked(object) {
        if (this.locked) {
            this.locked_obj = object;
            Style('[data-x="unlock"]', 'color:#f00', true, this.node);
        }
        return this.locked;
    }

    /**
     * Calculate the FEN for the ply, by looking at the previously saved FEN's
     * @param {number} ply
     * @returns {boolean}
     */
    chess_backtrack(ply) {
        if (DEV.ply)
            LS(`no fen available for ply ${ply}`);

        let moves = this.moves;
        if (this.real)
            Assign(SetDefault(moves, this.real.ply, {}), {fen: this.real.fen});

        for (let curr = ply - 1; curr >= 0; curr --) {
            let move = moves[curr];
            if (!move) {
                if (DEV.ply)
                    LS(`no move at ply ${curr}`);
                return false;
            }

            if (move.fen) {
                this.chess_load(move.fen);
                for (let next = curr + 1; next <= ply; next ++) {
                    let move_next = moves[next],
                        result = this.chess_move(move_next.m);
                    if (!result) {
                        if (DEV.ply)
                            LS(`invalid move at ply ${next}: ${move_next.m}`);
                        return false;
                    }
                    Assign(move_next, result);
                    move_next.fen = this.chess_fen();
                }

                if (DEV.fen) {
                    let ply = get_move_ply(move);
                    if (ply != curr) {
                        LS(`chess_backtrack: ${ply} != ${curr}`);
                        LS(moves);
                    }
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
     */
    chess_load(fen) {
        this.chess.load(fen);
    }

    /**
     * Calculate the mobility
     * @param {Move=} move if defined, then will get the fen from that move, and update the move
     * @param {string=} fen
     * @returns {string}
     */
    chess_mobility(move, fen) {
        if (move) {
            if (move.mobile != undefined)
                return move.mobile;
            fen = move.fen;
        }
        this.chess.load(fen);

        // calculate
        let checked = this.chess.checked(),
            moves = this.chess.moves({legal: true}),
            ply = extract_fen_ply(fen),
            rule50 = extract_fen_rule50(fen),
            sign = this.chess.turn() == 'w'? -1: 1,
            score = sign * (moves.length + (checked? 0: 0.5));

        if (rule50 == 0 || Abs(score) < Abs(this.goal[0]))
            this.goal = [score, ply];

        if (move) {
            move.goal = [...this.goal];
            move.mobile = score;
        }

        if (DEV.mobile) {
            LS(`mobility: ${fen}`);
            LS(`=> ${score}: ${ply} :: ${this.goal}`);
        }
        return score;
    }

    /**
     * Temporary chess.js
     * @param {string|Object} text
     * @returns {Object}
     */
    chess_move(text) {
        return this.chess.move(text);
    }

    /**
     * Calculate all legal moves
     * @returns {Object[]}
     */
    chess_moves() {
        return this.chess.moves({legal: true});
    }

    /**
     * Clicked on a move list => maybe selected a new ply
     * @param {Event} e
     * @param {function} callback
     */
    clicked_move_list(e, callback) {
        let target = e.target,
            ply = target.dataset.i;

        if (ply != undefined)
            this.set_ply(ply * 1, {animate: true, manual: true});

        callback(this, 'move', ply);
    }

    /**
     * Compare plies from the duals
     * - set the ply for both the board and the dual board
     * - called from add_moves and add_moves_string
     * @param {number} num_ply current ply in the real game (not played yet)
     */
    compare_duals(num_ply) {
        if (this.locked)
            return;

        let dual = this.dual,
            real = this.real,
            show_delay = (!real.hold || !real.hold_step || real.ply == real.moves.length - 1)? 0: Y.show_delay,
            show_ply = Y.show_ply;

        // last
        if (show_ply == 'last') {
            let ply = this.moves.length - 1;
            this.set_ply(show_delay? num_ply: ply, {hold: true});

            if (show_delay && ply > num_ply)
                this.set_delayed_ply(ply);
            return;
        }

        // first, or if no dual
        if (show_ply == 'first' || !dual || !dual.valid || dual.locked) {
            this.set_ply(num_ply, {hold: true});
            return;
        }

        // diverging => compare the moves
        let duals = dual.moves,
            moves = this.moves,
            num_move = Min(duals.length, moves.length),
            ply = num_ply;

        for (let i = num_ply; i < num_move; i ++) {
            let dual_m = (duals[i] || {}).m,
                move_m = (moves[i] || {}).m;
            if (DEV.div)
                LS(`${this.id} : i=${i} < ${num_move} : ${dual_m == move_m} : ${dual_m} = ${move_m}`);
            if (!dual_m || !move_m)
                break;
            ply = i;
            if (dual_m != move_m)
                break;
        }

        if (DEV.div)
            LS(`${this.id} => ply=${ply}`);

        this.set_marker(ply);
        dual.set_marker(ply);

        // render: jump directly to the position
        for (let board of [this, dual]) {
            if (ply == num_ply)
                board.set_ply(ply, {hold: true});
            // try to get to the ply without compute, if fails, then render the next ply + compute later
            else if (board.set_ply(ply, {hold: true}) == false) {
                if (DEV.div)
                    LS(`${this.id}/${board.id} : delayed ${num_ply} => ${ply}`);

                board.set_ply(show_delay? num_ply: ply, {hold: true});
                if (show_delay)
                    this.set_delayed_ply(ply);
            }
        }
    }

    /**
     * Create an svg arrow part
     * @param {string} id
     * @param {function} callback can return nodes to be added to the svg
     * @returns {Node}
     */
    create_svg(id, callback) {
        let arrow = this.svgs[id];
        if (arrow)
            return arrow;

        arrow = CreateNode('div', null, {class: 'arrow'});
        let svg = CreateSVG('svg', {viewBox: '0 0 80 80'});
        if (callback) {
            let nodes = callback(svg);
            if (nodes)
                for (let node of nodes)
                    svg.appendChild(node);
        }
        arrow.appendChild(svg);
        this.overlay.appendChild(arrow);
        this.svgs[id] = arrow;
        return arrow;
    }

    /**
     * Listen to clicking events
     * @param {function} callback
     */
    event_hook(callback) {
        let that = this;

        C(this.node, () => {
            callback(that, 'activate');
        });

        // disable right click
        Events('[data-x]', 'contextmenu', e => {
            e.preventDefault();
        }, {}, this.node);

        // controls
        C('[data-x]', function() {
            let name = this.dataset.x;
            switch (name) {
            case 'copy':
                CopyClipboard(that.fen);
                Class(this, 'copied');
                add_timeout('fen', () => {Class(this, '-copied');}, 1000);
                break;
            case 'end':
                that.go_end();
                break;
            case 'lock':
                that.set_locked(true);
                break;
            case 'play':
                that.play();
                break;
            case 'rotate':
                that.hold_smooth();
                that.rotate = (that.rotate + 1) % 2;
                that.render(3);
                callback(that, 'control', name);
                break;
            case 'start':
                that.go_start();
                break;
            case 'unlock':
                that.set_locked(false);
                break;
            default:
                callback(that, 'control', name);
            }

            if (name != 'play')
                that.play(true);
        }, this.node);

        // holding mouse/touch on prev/next => keep moving
        Events('[data-x]', 'mousedown mouseleave mousemove mouseup touchend touchmove touchstart', function(e) {
            let name = this.dataset.x,
                type = e.type;

            if (['mousedown', 'touchstart'].includes(type)) {
                if (!['next', 'prev'].includes(name))
                    return;
                that.hold = name;
                that.hold_button(name, 0);
            }
            else {
                if (!that.hold)
                    return;

                if (['mousemove', 'touchmove'].includes(type)) {
                    if (name != that.hold)
                        that.hold = null;
                }
                else
                    that.hold = null;

                if (!that.hold) {
                    clear_timeout(`click_next`);
                    clear_timeout(`click_prev`);
                }
                that.hold = null;
            }
        }, {}, this.node);

        // pv list
        for (let parent of [this.xmoves, this.pv_node])
            C(parent, e => {
                this.clicked_move_list(e, callback);
            });

        // place a picked piece
        C('.xsquares', e => {
            this.place(e);
        }, this.node);

        // pick a piece
        C('.xpieces', e => {
            this.pick(e);
        }, this.node);

        // PVA => extra events
        if (this.manual) {
            Events('.xsquares', 'mousemove', function(e) {
                let found,
                    target = e.target;
                while (target) {
                    if (HasClass(target, 'xsquare')) {
                        found = target;
                        break;
                    }
                    target = target.parentNode;
                }
                if (!found)
                    return;

                Style('.xhigh', 'background:transparent', true, this);
                Style('.xhigh', 'background:rgba(255, 180, 0, 0.7)', true, found);
            }, {}, this.node);
        }
    }

    /**
     * Get piece background
     * @param {number} size
     * @returns {[number, string, string]} piece_size, style, transform
     */
    get_piece_background(size) {
        let theme = this.theme,
            image = `url(theme/${theme.name}.${theme.ext})`,
            piece_size = theme.size,
            diff = (piece_size - size) / 2,
            style = `background-image:${image};height:${piece_size}px;width:${piece_size}px`,
            transform = `transform:scale(${size / piece_size}) translate(${theme.off[0] - diff}px,${theme.off[1] - diff}px)`;

        return [piece_size, style, transform];
    }

    /**
     * Hide arrows
     * - for now, only HTML code
     */
    hide_arrows() {
        for (let svg of this.svgs)
            Hide(svg);
    }

    /**
     * Hold mouse button or touch => repeat the action
     * @param {string} name
     * @param {number} step -1 for no repeat
     */
    hold_button(name, step) {
        this.hold_step = step;
        let now = Now(true);

        // need this to prevent mouse up from doing another click
        if (step >= 0 || now > this.hold_time + TIMEOUT_click) {
            switch (name) {
            case 'next':
            case 'play':
                if (!this.go_next())
                    step = -1;
                break;
            case 'prev':
                if (!this.go_prev())
                    step = -1;
                break;
            }
        }

        if (step < 0) {
            if (name == 'play')
                this.play(true);
            return;
        }

        this.hold_time = now;

        let timeout = (name == 'play')? Y[`${this.play_mode}_every`]: (step? Y.key_repeat: Y.key_repeat_initial);
        add_timeout(`click_${name}`, () => {this.hold_button(name, step + 1);}, timeout);
    }

    /**
     * Initialise the board
     * - must be run before doing anything with it
     */
    initialise() {
        let controls2 = Assign({}, CONTROLS);
        if (this.main) {
            delete controls2.lock;
            controls2.cube = 'Change view';
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
            if (typeof(value) == 'string')
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

        HTML(this.node, [
            '<hori class="xtop xcolor1 dn">',
                '<div class="xshort"></div>',
                '<div class="xleft"></div>',
                '<div class="xtime"></div>',
                '<div class="xeval"></div>',
                '<div class="xcog dn"><i data-svg="cog"></i></div>',
            '</hori>',
            '<div class="xcontain">',
                '<div class="xframe"></div>',
                '<grid class="xsquares"></grid>',
                '<div class="xoverlay"></div>',
                '<div class="xpieces"></div>',
                '<hori class="xbottom xcolor0 dn">',
                    '<div class="xshort"></div>',
                    '<div class="xleft"></div>',
                    '<div class="xtime"></div>',
                    '<div class="xeval"></div>',
                    '<div class="xcog dn"><i data-svg="cog"></i></div>',
                '</hori>',
                `<hori class="xcontrol">${controls}</hori>`,
            '</div>',
            `<horis class="xmoves${this.list? '': ' dn'}"></horis>`,
        ].join(''));

        this.overlay = _('.xoverlay', this.node);
        this.xmoves = _('.xmoves', this.node);

        // initialise the pieces to zero
        this.pieces = Assign({}, ...FIGURES.map(key => ({[key]: []})));

        this.analyse_fen();
        update_svg();

        this.markers = [CreateNode('i', '@'), CreateNode('i', '@')];

        if (this.hook)
            this.event_hook(this.hook);
    }

    /**
     * Navigation: end
     * @returns {boolean}
     */
    go_end() {
        return this.set_ply(this.moves.length - 1, {manual: true});
    }

    /**
     * Navigation: next
     * @returns {boolean}
     */
    go_next() {
        let num_move = this.moves.length,
            ply = this.ply + 1;
        while (ply < num_move - 1 && !this.moves[ply])
            ply ++;
        return this.set_ply(ply, {animate: true, manual: true});
    }

    /**
     * Navigation: prev
     * @returns {boolean}
     */
    go_prev() {
        let ply = this.ply - 1,
            start = this.main? -1: 0;
        while (ply > start && !this.moves[ply])
            ply --;
        return this.set_ply(ply, {animate: true, manual: true});
    }

    /**
     * Navigation: start
     * @returns {boolean}
     */
    go_start() {
        let num_move = this.moves.length,
            ply = 0;
        while (ply < num_move - 1 && !this.moves[ply])
            ply ++;

        // initial board
        if (!ply && this.main)
            ply = -1;

        return this.set_ply(ply, {manual: true});
    }

    /**
     * Hold the smooth value for 1 render frame
     */
    hold_smooth() {
        this.next_smooth = this.smooth;
        this.smooth = false;
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
            HTML('.xsquares', text, this.node);
        }
    }

    /**
     * Pick / release a piece
     * - only HTML for now
     * @param {Event} e
     */
    pick(e) {
        if (!this.manual)
            return;

        let node = e.target;
        while (node) {
            if (HasClass(node, 'xpiece')) {
                LS(node);
                let coord = node.dataset.c;
                this.picked = (this.picked == coord)? null: coord;
                return;
            }
            node = node.parentNode;
        }
    }

    /**
     * Place a picked piece
     * - only HTML for now
     * @param {Event} e
     */
    place(e) {
        if (!this.manual || !this.picked)
            return;

        let found,
            node = e.target;
        while (node) {
            if (HasClass(node, 'xsquare')) {
                found = node.dataset.q;
                break;
            }
            node = node.parentNode;
        }

        if (found) {
            this.chess_load(this.fen);
            this.chess_move({from: SQUARES_INV[this.picked], to: found});
            this.set_fen(this.chess_fen(), true);
        }
        this.picked = null;
    }

    /**
     * Play button was pushed
     * @param {boolean=} stop
     */
    play(stop) {
        if (stop || timers.click_play) {
            clear_timeout('click_play');
            stop = true;
            this.play_mode = 'play';
        }
        else
            this.hold_button('play', 0);

        S('[data-x="pause"]', !stop, this.node);
        S('[data-x="play"]', stop, this.node);
    }

    /**
     * Render to the current target
     * @param {number=} dirty
     */
    render(dirty) {
        if (dirty != undefined)
            this.dirty |= dirty;

        if (DEV.board)
            LS(`render: ${this.dirty}`);
        let func = `render_${this.mode}`;
        if (this[func]) {
            this[func]();
            this.animate(this.moves[this.ply], this.smooth);
        }

        // restore smooth after `hold_smooth`
        if (this.next_smooth)
            this.smooth = this.next_smooth;
    }

    /**
     * 3d rendering
     */
    render_3d() {
        LS(`render_3d: ${T}`);
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
                    let col_name = COLUMN_LETTERS[rotate? 7 - j: j],
                        even = (i + j) % 2,
                        note_x = '',
                        note_y = '',
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
                        `<div class="xsquare" data-c="${i * 16 + j}" data-q="${col_name}${row_name}" style="background:${colors[even]}${style}">${note_x}${note_y}`
                            + `<div class="xhigh"></div>`
                        + `</div>`
                    );
                }
            }

            this.output(lines.join(''));

            // remember all the nodes for quick access
            this.nodes = Assign({}, ...Array.from(A('.xsquare', this.node)).map(node => ({[node.dataset.q]: node})));
            this.move2 = null;
        }

        // 3) draw pieces
        if (dirty & 2) {
            if (DEV.board)
                LS(`render_html: num_piece=${this.pieces.length}`);

            let nodes = [],
                [piece_size, style, transform] = this.get_piece_background(this.size),
                xpieces = _('.xpieces', this.node);

            Class(xpieces, 'smooth', this.smooth);

            // create pieces / adjust their position
            Keys(this.pieces).forEach(char => {
                let items = this.pieces[char],
                    offset = -SPRITE_OFFSETS[char] * piece_size;

                for (let item of items) {
                    let [found, index, node] = item,
                        col = index % 16,
                        row = index >> 4;

                    if (!node) {
                        let html = `<div style="${style};background-position-x:${offset}px"></div>`;
                        node = CreateNode('div', html, {class: 'xpiece'});
                        nodes.push(node);
                        item[2] = node;
                    }
                    // theme change
                    else if (dirty & 4)
                        Style('div', `${style};background-position-x:${offset}px`, true, node);

                    if (rotate) {
                        col = 7 - col;
                        row = 7 - row;
                    }

                    if (found) {
                        Style(node, `${transform} translate(${col * piece_size}px,${row * piece_size}px);opacity:1;pointer-events:all`);
                        node.dataset.c = row * 16 + col;
                    }
                    else
                        Style(node, 'opacity:0;pointer-events:none');
                }
            });

            if (DEV.board)
                LS(xpieces);

            // insert pieces
            InsertNodes(xpieces, nodes);
        }

        this.dirty = 0;
        Show('.xframe, .xpieces', this.node);
    }

    /**
     * 2d text rendering
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
            lines.push(`  ${scolumn}`);

        // parse all cells
        for (let i = 0; i < num_row; i ++) {
            let vector = [];

            if (notation & 4)
                vector.push(`${8 - i}`);

            for (let j = 0; j < num_col; j ++) {
                let char = grid[off + j];
                if (!char)
                    char = ((i + j) % 2)? '·': ' ';
                vector.push(char);
            }

            if (notation & 8)
                vector.push(`${i + 1}`);

            lines.push(vector.join(' '));
            off += 16;
        }

        if (notation & 2)
            lines.push(`  ${scolumn}`);

        // output result
        let font_size = (notation & 12)? 0.91 * num_col / (num_col + 1): 0.91,
            text = lines.join('\n');
        this.output(`<pre style="font-size:${font_size}em">${text}</pre>`);

        Hide('.xframe, .xpieces', this.node);
        return text;
    }

    /**
     * Reset the moves
     * @param {boolean=} reset_evals
     */
    reset(reset_evals) {
        if (this.check_locked())
            return;

        this.goal = [-20.5, -1];
        this.grid.fill('');
        this.moves.length = 0;
        this.next = null;
        this.ply = 0;
        this.seen = 0;
        this.text = '';

        HTML(this.xmoves, '');
        HTML(this.pv_node, '');

        if (reset_evals)
            this.evals.length = 0;

        this.set_last(this.last);
    }

    /**
     * Resize the board to a desired width
     * @param {number=} width
     * @param {boolean=} render
     */
    resize(width, render=true) {
        let node = this.node;
        if (!width) {
            if (!node)
                return;
            width = node.clientWidth;
        }

        let border = this.border,
            num_col = this.dims[1],
            size = Floor((width - border * 2) * 2 / num_col) / 2,
            frame_size = size * num_col + border * 2,
            frame_size2 = size * num_col;

        Style(node, `font-size:${size}px`);
        Style('.xframe', `height:${frame_size}px;left:-${border}px;top:-${border}px;width:${frame_size}px`, true, node);
        Style('.xoverlay', `height:${frame_size2}px;left:0;top:0;width:${frame_size2}px`, true, node);
        Style('.xmoves', `max-width:${frame_size2}px`, true, node);

        this.size = size;
        if (render)
            this.render(2);
    }

    /**
     * Set a delayed ply
     * @param {number} ply
     */
    set_delayed_ply(ply) {
        this.delayed_ply = ply;

        add_timeout(`dual${this.id}`, () => {
            let ply = this.delayed_ply;
            if (DEV.div)
                LS(`${this.id}: delayed_ply=${ply}`);
            if (ply > -2)
                this.set_ply(this.delayed_ply, {hold: true});
        }, Y.show_delay);
    }

    /**
     * Set a new FEN
     * @param {string} fen
     * @param {boolean=} render
     * @returns {boolean}
     */
    set_fen(fen, render) {
        if (DEV.board)
            LS(`set_fen: ${fen}`);
        if (fen == null)
            fen = START_FEN;

        this.fen = fen;
        if (!this.analyse_fen())
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
        for (let parent of [this.xmoves, this.pv_node])
            HTML('.last', text, parent);
    }

    /**
     * Lock/unlock the PV
     */
    set_locked(locked) {
        this.locked = locked;
        S('[data-x="lock"]', !locked, this.node);
        S('[data-x="unlock"]', locked, this.node);
        Style('[data-x="unlock"]', 'color:#f00', false, this.node);

        if (!locked && this.locked_obj) {
            let [type, param1, param2] = this.locked_obj;
            this.locked_obj = null;
            this.reset();
            if (type == 'move')
                this.add_moves(param1, param2);
            else if (type == 'text')
                this.add_moves_string(param1, param2);
        }
    }

    /**
     * Set the @ marker
     * @param {number} ply
     */
    set_marker(ply) {
        [this.xmoves, this.pv_node].forEach((parent, id) => {
            let child = _(`[data-i="${ply}"]`, parent);
            if (child && (ply % 2 == 0))
                child = child.previousElementSibling;
            if (child)
                parent.insertBefore(this.markers[id], child);
        });
    }

    /**
     * Set the ply + update the FEN
     * @param {number} ply
     * @param {boolean=} animate
     * @param {boolean=} hold call hold_smooth
     * @param {boolean=} manual ply was set manually => send the 'ply' in the hook
     * @param {boolean=} no_compute does not computer chess positions (slow down)
     * @returns {Move} move, false if no move + no compute, null if failed
     */
    set_ply(ply, {animate, hold, manual, no_compute}={}) {
        if (DEV.ply)
            LS(`${this.id}: set_ply: ${ply} : ${animate}`);

        clear_timeout(`dual${this.id}`);
        this.delayed_ply = -2;

        if (hold)
            this.hold_smooth();

        // special case: initial board
        if (ply == -1 && this.main) {
            this.ply = -1;
            this.set_fen(START_FEN, true);
            this.hide_arrows();
            this.update_cursor(ply);
            this.animate({}, animate);
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

        if (!move.fen) {
            if (no_compute)
                return false;
            if (!this.chess_backtrack(ply))
                return null;
        }
        this.set_fen(move.fen, true);

        let is_last = (ply == this.moves.length - 1);

        // play sound?
        if (this.name == 'live' && (is_last || (this.play_mode == 'book' && Y.book_sound)))
            add_timeout(`ply${ply}`, () => {
                let name = 'move',
                    text = move.m,
                    last = text.slice(-1);

                if (last == '#')
                    name = 'checkmate';
                if (last == '+')
                    name = 'check';
                else if (text.includes('x'))
                    name = 'capture';

                play_sound(audiobox, Y[`sound_${name}`], {interrupt: true});
            }, Y.audio_delay);

        if (manual && this.hook)
            this.hook(this, 'ply', move);

        // new move => remove arrows from the past
        this.hide_arrows();

        this.update_cursor(ply);
        if (animate == undefined && (!this.smooth || is_last))
            animate = true;
        this.animate(move, animate);
        return move;
    }

    /**
     * Update the counter
     */
    update_counter() {
        let node = _('.count', this.node),
            unseen = this.moves.length - 1 - this.seen;
        S(node, unseen > 0);
        HTML(node, this.moves.length - 1 - this.seen);
    }

    /**
     * Update the cursor
     * @param {number} ply
     */
    update_cursor(ply) {
        for (let parent of [this.xmoves, this.pv_node]) {
            if (!parent)
                continue;

            // node might disappear when the PV is updated
            let node = _(`[data-i="${ply}"]`, parent);
            if (!node)
                continue;

            Class('.seen', '-seen', true, parent);
            Class(node, 'seen');

            // keep the cursor in the center
            parent.scrollTop = node.offsetTop + (node.offsetHeight - parent.clientHeight) / 2;
        }
    }
}
