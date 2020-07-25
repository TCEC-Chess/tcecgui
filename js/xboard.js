// xboard.js
// @author octopoulo <polluxyz@gmail.com>
// @version 2020-07-21
//
// game board:
// - 4 rendering modes:
//      ~ 3d
//      - canvas
//      + html
//      + text
// - games:
//      + chess
//      ~ chess960
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
_, A, Abs, add_timeout, Assign, AttrsNS, audiobox,
C, Chess, Class, clear_timeout, CopyClipboard, CreateNode, CreateSVG, DEV, Events, Floor, FormatUnit, From,
get_fen_ply, get_move_ply, Hide, HTML, Id, InsertNodes, IsDigit, IsString, Keys,
Lower, LS, Min, mix_hex_colors, Now, Parent, play_sound, Random, RandomInt, requestAnimationFrame, Round,
S, SetDefault, Show, Sign, split_move_string, Style, T, timers, Undefined, update_svg, Upper, Visible, window, Worker, Y
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
    I8 = array => new Int8Array(array),
    LETTER_COLUMNS = Assign({}, ...COLUMN_LETTERS.map((letter, id) => ({[letter]: id}))),
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
    TIMEOUT_click = 200,
    TIMEOUT_pick = 600,
    TIMEOUT_think = 500,
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
     * - count          // add a counter in a red circle
     * - dims           // [num_col, num_row]
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
        this.clicked = false;
        this.colors = ['#eee', '#111'];
        this.coords = {};
        this.delayed_ply = -2;
        this.dirty = 3;                                 // &1:board/notation, &2:pieces, &4:theme change
        this.dual = null;
        this.evals = [];                                // eval history
        this.fen = '';                                  // current fen
        this.fen2 = '';
        this.frc = (this.manual && Y.game_960);         // fischer random
        this.goal = [-20.5, -1];
        this.grid = new Array(128);
        this.grid2 = new Array(128);
        this.high_color = '';                           // highlight color
        this.high_size = 0.06;                          // highlight size
        this.hold = null;                               // mouse/touch hold target
        this.hold_step = 0;
        this.hold_time = 0;                             // last time the event was repeated
        this.locked = false;
        this.locked_obj = null;
        this.markers = [];                              // @
        this.main_manual = this.main || this.manual;
        this.move2 = null;                              // previous move
        this.moves = [];                                // move list
        this.next = null;
        this.node = _(this.id);

        this.overlay = null;                            // svg objects will be added there
        this.pgn = {};
        this.picked = null;                             // picked piece
        this.pieces = {};                               // b: [[found, row, col], ...]
        this.play_mode = 'play';
        this.players = [{}, {}, {}, {}];                // current 2 players + 2 live engines
        this.ply = 0;                                   // current ply
        this.ply_moves = [];                            // PV moves by real ply
        this.pv_node = _(this.pv_id);
        this.real = null;                               // pointer to a board with the real moves
        this.replies = {};                              // worker replies
        this.seen = 0;                                  // last seen move -> used to show the counter
        this.smooth0 = this.smooth;                     // used to temporarily prevent transitions
        this.squares = {};                              // square nodes
        this.start_fen = START_FEN;
        this.svgs = [
            {id: 0},
            {id: 1},
            {id: 2},
            {id: 3},
        ];                                              // svg objects for the arrows
        this.text = '';                                 // current text from add_moves_string
        this.valid = true;
        this.workers = [];                              // web workers
        this.xmoves = null;
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

        Style(node, `background:${color};opacity:${opacity}`);
        Class(node, (type == 'target')? 'target -source': 'source -target');

        if (type == 'turn')
            Class(`[data-c="${coord}"]`, 'source', true, this.xpieces);
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

        let is_empty = !HTML(this.xmoves),
            is_ply = (cur_ply != undefined),
            lines = [],
            manual = this.manual,
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
        if (!num_move && this.main_manual)
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

            // adding an old move?
            if (!is_empty && i >= 0 && ply < num_move)
                continue;

            // indicate current ply
            if (is_ply && ply == cur_ply) {
                // lines.push('<i>#</i>');
                extra = ' current';
            }

            let move_num = 1 + ply / 2;
            if (ply % 2 == 0) {
                if (is_ply)
                    lines.push(`<i class="turn">${move_num}.</i>`);
                else if (i < 0) {
                    if (!manual || !_('[data-i="-1"]', this.xmoves))
                        for (let [parent, last] of parent_lasts) {
                            let node = CreateNode('a', '0.', {class: 'turn', 'data-i': -1});
                            parent.insertBefore(node, last);
                            for (let j = 0; j < 2; j ++)
                                parent.insertBefore(CreateNode('b'), last);
                        }
                }
                else if (!manual || !_(`[data-j="${move_num}"]`, this.xmoves))
                    for (let [parent, last] of parent_lasts) {
                        let node = CreateNode('i', `${move_num}.`, {class: 'turn', 'data-j': move_num});
                        parent.insertBefore(node, last);
                    }
            }
            else if (!i && is_ply)
                lines.push(`<i class="turn">${Floor(move_num)}</i> ..`);

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
                    this.set_fen(null, true);
                    this.ply = -1;
                    this.play_mode = 'book';
                    this.play();
                }
            }
            else
                this.set_ply(last_move, {animate: true});
        }

        // next move
        if (this.hook) {
            let next = this.moves[this.real.ply + 1];
            if (next) {
                this.next = next;
                this.hook(this, 'next', next);
            }
        }

        this.update_counter();

        // update mobility
        if (this.main) {
            let fen = this.start_fen;
            for (let move of moves) {
                let no_load;
                if (!move.fen) {
                    this.chess_load(fen);
                    let result = this.chess_move(move.m);
                    Assign(move, result);
                    move.fen = this.chess_fen();
                    no_load = true;
                }
                this.chess_mobility(move, no_load);
                fen = move.fen;
            }
        }
    }

    /**
     * Same as add_moves but with a string, only contains notations, no fen
     * - used in live pv, not for real moves
     * - completely replaces the moves list with this one
     * @param {string} text
     * @param {number=} cur_ply if defined, then we want to go to this ply
     * @param {boolean=} force force update
     */
    add_moves_string(text, cur_ply, force) {
        if (!text)
            return;

        // 1) no change or older => skip
        if (this.text == text || (!this.manual && this.text.includes(text)))
            return;
        if (this.check_locked(['text', text, cur_ply]))
            return;

        let [new_ply, new_items] = split_move_string(text),
            [old_ply] = split_move_string(this.text),
            want_ply = cur_ply? cur_ply: new_ply;
        if (!force && new_ply < old_ply) {
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

        if (this.manual)
            lines.push('<i class="turn" data-i="-1">0.</i><b></b><b></b>');

        new_items.forEach(item => {
            if (first_ply < 0 && ply >= 0)
                first_ply = ply;

            if (item == '...') {
                lines.push('<i>...</i>');
                ply ++;
                return;
            }
            // turn? => use it
            if (IsDigit(item[0])) {
                let turn = parseInt(item);
                ply = (turn - 1) * 2;
                lines.push(`<i class="turn" data-j="${turn}">${turn}.</i>`);
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

        this.ply_moves[new_ply] = moves;
        this.valid = true;

        // only update if this is the current ply + 1, or if we want a specific ply
        let is_current = (new_ply == cur_ply || force || this.manual);
        if (!is_current && this.real) {
            Assign(SetDefault(moves, this.real.ply, {}), {fen: this.real.fen});
            is_current = (new_ply == this.real.ply + 1);
        }

        if (is_current) {
            this.moves = moves;

            let html = lines.join('');
            for (let parent of [this.xmoves, this.pv_node])
                HTML(parent, html);

            // 3) update the cursor
            // live engine => show an arrow for the next move
            if (this.live_id != undefined || Visible(this.vis)) {
                let move = this.set_ply(new_ply, {hold: true, render: false});
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
            pieces = this.pieces;

        if (items.length != 6)
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

                    if (!items)
                        return false;

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

        // 3) move non found pieces off the board
        let [num_row] = this.dims;
        Keys(pieces).forEach(key => {
            for (let piece of pieces[key])
                if (!piece[0])
                    piece[1] = -num_row;
        });

        // 4) update variables
        let temp = this.grid;
        this.grid = grid;
        this.grid2 = temp;

        this.fen = fen;
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
        this.delayed_picks(!!move);
        if (!move)
            return;

        let func = `animate_${this.mode}`;
        if (!this[func])
            return;

        let delay = Y.highlight_delay;
        this[func](move, animate || !delay);

        if (!animate && delay > 0)
            add_timeout(`animate_${this.id}`, () => {this[func](move, true);}, delay);
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
        this.clear_high('source target');

        let prev = this.move2;
        if (prev) {
            Style(prev.node_from, 'box-shadow: none');
            Style(prev.node_to, 'box-shadow: none');
        }
        if (!animate)
            return;

        let color = this.high_color,
            node_from = this.squares[SQUARES_INV[move.from] || move.from],
            node_to = this.squares[SQUARES_INV[move.to] || move.to],
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
     */
    arrow(id, dico) {
        let func = `arrow_${this.mode}`;
        if (this[func])
            this[func](id, dico);
    }

    /**
     * Display a 3d arrow
     * @param {number} id
     * @param {Object} dico
     */
    arrow_3d(id, dico) {

    }

    /**
     * Draw an arrow on the canvas
     * @param {number} id
     * @param {Object} dico
     */
    arrow_canvas(id, dico) {

    }

    /**
     * Create an SVG arrow
     * @param {number} id svg id, there can be multiple arrows
     * @param {Object} dico contains move info, if null then hide the arrow
     */
    arrow_html(id, dico) {
        // 1) no move => hide the arrow
        // TODO: maybe some restoration is needed here
        if (!dico || !dico.from || !Y.arrow_opacity) {
            Hide(this.svgs[id].svg);
            return;
        }

        // 2) got a move => get coordinates
        if (IsString(dico.from)) {
            dico.from = SQUARES[dico.from];
            dico.to = SQUARES[dico.to];
        }

        let path,
            name = this.name,
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
            dual_id = id + 1 - (id % 2) * 2,
            dual = this.svgs[dual_id],
            scolor = Y[`arrow_color_${id}`];

        for (let other of this.svgs.filter(svg => svg.id != id && svg.path == path)) {
            let other_id = other.id;
            if (id < 2) {
                // black and white = only 1 arrow can exist
                if (other_id < 2)
                    Hide(other.svg);
                else {
                    AttrsNS(Id(`mk${name}_${other_id}_1`), {fill: mix_hex_colors(Y.arrow_head_color, Y[`graph_color_${id}`], 0.6)});
                    Hide(this.svgs[id].svg);
                    return;
                }
            }
            else {
                if (other_id >= 2)
                    scolor = Y.arrow_combine_23;
                else
                    shead = mix_hex_colors(Y.arrow_head_color, Y[`graph_color_${other_id}`], 0.6);
                Hide(other.svg);
            }
        }

        // other color might be green => should recolor it
        if (id >= 2 && dual.svg)
            AttrsNS('svg > path', {stroke: Y[`arrow_color_${dual_id}`]}, dual.svg);

        // 4) show the arrow
        let body = this.create_arrow(id),
            color_base = mix_hex_colors(Y.arrow_base_color, scolor, Y.arrow_base_mix),
            color_head = shead || mix_hex_colors(Y.arrow_head_color, scolor, Y.arrow_head_mix),
            marker0 = Id(`mk${name}_${id}_0`),
            marker1 = Id(`mk${name}_${id}_1`),
            paths = A('svg > path', body),
            svg = this.svgs[id];

        AttrsNS(marker0, {fill: color_base, stroke: scolor, 'stroke-width': Y.arrow_base_border});
        AttrsNS(marker1, {fill: color_head, stroke: scolor, 'stroke-width': Y.arrow_head_border});

        AttrsNS(paths[0], {d: path, stroke: scolor, 'stroke-width': Y.arrow_width});
        svg.dist = delta_x + delta_y;
        svg.path = path;
        Style(body, `opacity:${Y.arrow_opacity}`);
        Show(body);

        // 5) shorter distances above
        [...this.svgs]
            .sort((a, b) => ((b.dist || 0) - (a.dist || 0)))
            .forEach((svg, id) => {
                Style(svg.svg, `z-index:${id}`);
            });
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
     * @returns {boolean}
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
            LS(`${this.id}: no fen available for ply ${ply}`);

        let moves = this.moves,
            real_moves = this.real.moves;

        for (let curr = ply - 1; curr >= -1; curr --) {
            let move = moves[curr],
                fen = move? move.fen: null;
            if (!move) {
                if (DEV.ply)
                    LS(`${this.id}: no move at ply ${curr}`);

                if (curr == -1)
                    fen = this.start_fen;
                else {
                    let real_move = real_moves[curr];
                    if (!real_move)
                        return false;
                    fen = real_move.fen;

                    moves[curr] = {
                        fen: fen,
                        ply: curr,
                    };
                    move = moves[curr];
                }
            }

            if (fen) {
                this.chess_load(fen);
                for (let next = curr + 1; next <= ply; next ++) {
                    let move_next = moves[next],
                        result = this.chess_move(move_next.m);
                    if (!result.piece) {
                        if (DEV.ply)
                            LS(`${this.id}: invalid move at ply ${next}: ${move_next.m}`);
                        return false;
                    }
                    Assign(move_next, result);
                    move_next.fen = this.chess_fen();
                    move_next.ply = next;
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
        return this.chess.load(fen);
    }

    /**
     * Calculate the mobility
     * @param {Move} move
     * @param {boolean=} no_load don't load the FEN
     * @returns {string}
     */
    chess_mobility(move, no_load) {
        if (move.mobil != undefined)
            return move.mobil;

        let chess = this.chess,
            fen = move.fen,
            ply = get_move_ply(move);

        if (ply == -2) {
            move.goal = [-20.5, -1];
            move.mobil = 20.5;
            return -20.5;
        }
        // CHECK THIS
        if (!fen)
            return -20.5;
        if (!no_load)
            chess.load(fen);

        // calculate
        let checked = chess.checked(chess.turn()),
            moves = this.chess_moves(Undefined(move.frc, this.frc), true, -1),
            rule50 = fen.split(' ')[4] * 1,
            sign = ((ply + 2) % 2)? -1: 1,
            score = sign * (moves.length + (checked? 0: 0.5));

        if (!rule50 || Abs(score) < Abs(this.goal[0]))
            this.goal = [score, ply];

        move.goal = [...this.goal];
        move.mobil = score;

        if (DEV.mobil) {
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
        let result,
            chess = this.chess,
            decorate = Undefined(options.decorate, false),
            frc = Undefined(options.frc, this.frc);

        // handle UCI: e1g1 = O-O, e7e8q = promotion
        if (text.length >= 4 && text.length <=5 && IsDigit(text[1]) && IsDigit(text[3]) && text[0] == Lower(text[0]) && text[2] == Lower(text[2]))
            result = chess.moveUci(text, frc, true);
        else
            result = IsString(text)? chess.moveSan(text, frc, decorate, false): chess.moveObject(text, frc, true);

        if (result.piece) {
            result.san = result.m;
            if (!decorate)
                result.m = text;
        }
        return result;
    }

    /**
     * Calculate all legal moves
     * @param {Object=} options
     * @returns {Object[]}
     */
    chess_moves(frc, legal, single_square) {
        let moves = this.chess.moves(frc, legal, single_square);
        if (moves.size)
            moves = new Array(moves.size()).fill(0).map((_, id) => moves.get(id));
        return moves;
    }

    /**
     * Clear highlight squares
     * @param {string} type source, target, turn, restore
     * @param {boolean=} restore
     */
    clear_high(type, restore) {
        Style('.xhigh', 'background:transparent', true, this.xsquares);
        Class('.xhigh', type, false, this.xsquares);
        if (type == 'source target')
            Class('.source', '-source', true, this.xpieces);
        if (restore)
            Style('.source', `background:${Y.turn_color};opacity:${Y.turn_opacity}`, true, this.xsquares);
        this.fen2 = '';
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
        this.clicked = false;

        let dual = this.dual,
            real = this.real;
        if (!real)
            return;
        let show_delay = (!real.hold || !real.hold_step || real.ply == real.moves.length - 1)? 0: Y.show_delay,
            show_ply = Y.show_ply;

        // first, or if no dual
        if (show_ply == 'first' || !dual || !dual.valid || dual.locked) {
            this.set_ply(num_ply, {hold: true});
            return;
        }

        // diverging + last  => compare the moves
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
            if (board.clicked)
                continue;
            if (show_ply == 'last')
                ply = board.moves.length - 1;

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
     * @see https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/marker-end
     * @param {string} id
     * @returns {Node}
     */
    create_arrow(id) {
        let arrow = this.svgs[id].svg;
        if (arrow)
            return arrow;

        let color = Y[`arrow_color_${id}`],
            marker_circle = CreateSVG('circle', {cx: 5, cy: 5, r: 3}),
            marker_path = CreateSVG('path', {d: `M0 0l5 5l-5 5z`}),
            name = this.name,
            options = {
                markerUnits: 'strokeWidth',
                orient: 'auto',
                refX: 5,
                refY: 5,
                viewBox: '0 0 10 10',
            },
            markers = [
                CreateSVG('marker', Assign(options, {
                    fill: color,
                    id: `mk${name}_${id}_0`,
                    markerHeight: Y.arrow_base_size,
                }), [marker_circle]),
                CreateSVG('marker', Assign(options, {
                    fill: color,
                    id: `mk${name}_${id}_1`,
                    markerHeight: Y.arrow_head_size,
                    refX: 1,
                }), [marker_path]),
            ],
            defs = CreateSVG('defs', null, markers),
            path = CreateSVG('path'),
            svg = CreateSVG('svg', {viewBox: '0 0 80 80'}, [defs, path]);

        AttrsNS(path, {'marker-end': `url(#mk${name}_${id}_1)`, 'marker-start': `url(#mk${name}_${id}_0)`});

        arrow = CreateNode('div', null, {class: 'arrow', id: `ar${id}`}, [svg]);

        this.overlay.appendChild(arrow);
        this.svgs[id].svg = arrow;
        return arrow;
    }

    /**
     * Create web workers
     */
    create_workers() {
        if (!this.manual)
            return;

        let number = Y.game_threads;
        if (number == this.workers.length)
            return;
        if (DEV.engine)
            LS(`threads: ${this.workers.length} => ${number}`);

        for (let worker of this.workers)
            worker.terminate();

        this.workers = [];

        if (window.Worker)
            for (let id = 0; id < number; id ++) {
                let worker = new Worker(`js/worker.js?ts=${Now()}`);
                this.worker = worker;

                worker.onerror = error => {
                    LS(`worker error:`);
                    LS(error);
                };
                worker.onmessage = e => {
                    this.worker_message(e);
                };

                worker.id = id;
                this.workers.push(worker);
            }
    }

    /**
     * Show picks after a delay, to make sure the animation is done
     * @param {boolean} is_delay
     */
    delayed_picks(is_delay) {
        if (timers.click_play)
            if (!this.manual || !this.human_turn())
                return;

        requestAnimationFrame(() => {
            add_timeout(`pick${this.id}`, () => {this.show_picks();}, is_delay? TIMEOUT_pick: 0);
        });
    }

    /**
     * Listen to clicking events
     * @param {function} callback
     */
    event_hook(callback) {
        let that = this;

        C(this.node, e => {
            callback(that, 'activate', e.target);
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
                CopyClipboard(that.fen).then(() => {
                    Class(this, 'copied');
                    add_timeout('fen', () => {Class(this, '-copied');}, 1000);
                });
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
                that.rotate = (that.rotate + 1) % 2;
                that.instant();
                that.render(7);
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
            }

            if (e.cancelable != false)
                e.preventDefault();
        }, {}, this.node);

        // pv list
        for (let parent of [this.xmoves, this.pv_node])
            C(parent, e => {
                this.clicked_move_list(e, callback);
            });

        // PVA => extra events
        // place a picked piece
        C(this.xsquares, e => {
            if (that.manual)
                this.place(e);
        });

        // pick a piece
        C('.xpieces', e => {
            if (!that.manual || this.place(e) || !this.pick(e))
                return;

            this.clear_high('target', this.picked == null);
            if (this.picked == null)
                return;

            this.chess_load(this.fen);
            let moves = this.chess_moves(this.frc, true, this.picked);
            for (let move of moves)
                this.add_high(move.to, 'target');
            if (moves[0])
                this.add_high(moves[0].from, 'source');
        }, this.node);
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
            transform = `scale(${size / piece_size}) translate(${theme.off[0] - diff}px, ${theme.off[1] - diff}px)`;

        return [piece_size, style, transform];
    }

    /**
     * Hide arrows
     * - for now, only HTML code
     */
    hide_arrows() {
        for (let svg of this.svgs)
            Hide(svg.svg);
    }

    /**
     * Hold mouse button or touch => repeat the action
     * @param {string} name
     * @param {number} step -1 for no repeat
     */
    hold_button(name, step) {
        let is_play = (name == 'play');

        if (step == 0)
            this.hold = name;
        else if (!is_play && step > 0 && !this.hold)
            return;

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
            if (is_play)
                this.play(true);
            return;
        }

        this.hold_time = now;

        let timeout = is_play? Y[`${this.play_mode}_every`]: (step? Y.key_repeat: Y.key_repeat_initial);
        add_timeout(`click_${name}`, () => {this.hold_button(name, step + 1);}, timeout);
    }

    /**
     * Initialise the board
     * - must be run before doing anything with it
     */
    initialise() {
        let controls2 = {...CONTROLS};
	this.timestamp = Now(true);
        if (this.main_manual) {
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

        HTML(this.node, [
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
            `<horis class="xmoves${this.list? '': ' dn'}"></horis>`,
        ].join(''));

        this.overlay = _('.xoverlay', this.node);
        this.xmoves = _('.xmoves', this.node);
        this.xpieces = _('.xpieces', this.node);
        this.xsquares = _('.xsquares', this.node);

        // initialise the pieces to zero
        this.pieces = Assign({}, ...FIGURES.map(key => ({[key]: []})));

        this.set_fen(null);
        update_svg();

        this.markers = [CreateNode('i', '@', {class: 'marker'}), CreateNode('i', '@', {class: 'marker'})];

        if (this.hook)
            this.event_hook(this.hook);

        this.create_workers();
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
        let success = this.set_ply(ply, {animate: true, manual: true});

        // next to think
        if (!success && this.manual && ply >= num_move) {
            success = this.think();
            if (success)
                this.play_mode = 'game';
        }
        return success;
    }

    /**
     * Navigation: prev
     * @returns {boolean}
     */
    go_prev() {
        let ply = this.ply - 1,
            start = this.main_manual? -1: 0;
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
        if (!ply && this.main_manual)
            ply = -1;

        return this.set_ply(ply, {manual: true});
    }

    /**
     * Check if it's a human turn
     * @returns {boolean}
     */
    human_turn() {
        let play_as = Y.game_play_as,
            ply = get_fen_ply(this.fen);
        if (play_as == 'AI')
            return false;
        else if (play_as == 'Human')
            return true;
        else
            return (play_as == WB_TITLE[(1 + ply) % 2]);
    }

    /**
     * Hold the smooth value for 1 render frame
     */
    instant() {
        this.smooth = false;
    }

    /**
     * Maybe play the move as AI
     */
    maybe_play() {
        if (!this.human_turn())
            add_timeout('think', () => {this.think();}, TIMEOUT_think);
    }

    /**
     * Start a new game
     */
    new_game() {
        let fen,
            play_as = Y.game_play_as;

        if (this.frc) {
            let index = RandomInt(960);
            fen = this.chess.fen960(index);
        }
        else
            fen = START_FEN;

        this.reset(true, fen);
        this.replies = {};

        if (play_as != 'AI')
            this.rotate = (play_as == WB_TITLE[1]);

        this.instant();
        this.render(7);
        this.chess_fen(fen);

        this.play(play_as != 'AI');
        this.maybe_play();
        this.delayed_picks(true);
    }

    /**
     * Add a new move
     * @param {Move} move
     */
    new_move(move) {
        // fen/ply
        let fen = this.chess_fen();
        move.fen = fen;
        let ply = get_move_ply(move);
	if (this.main) { // CHECK THIS: no doubt a lot improvement needed
            let previousFen = this.moves.length ? this.moves[this.moves.length-1].fen : this.start_fen;
            let uci = this.chess.ucify(move);
	    let timestamp = Now(true);
	    if (timestamp - this.timestamp > 1.2) {
		socket.emit('vote', {fen: previousFen, move: uci, time: timestamp});
	    }
	    this.timestamp = timestamp;
	    this.arrow(3, move);
	} else {
            this.set_fen(fen, true);
            this.clear_high('source target');
            this.picked = null;

            // delete some moves?
            if (ply < this.moves.length) {
		this.moves = this.moves.slice(0, ply);
		let node = _(`[data-i="${ply}"]`, this.xmoves);
		while (node) {
                    let next = node.nextElementSibling;
                    node.remove();
                    node = next;
		}
            }
	
            this.add_moves([move]);

            // maybe finished the game? 50MR / stalemate / win
            if (this.manual) {
		let finished,
                    rule50 = this.fen.split(' ')[4] * 1;
		if (rule50 >= 50) {
                    LS('Fifty move rule.');
                    finished = true;
		}
		else {
                    let moves = this.chess_moves(this.frc, true, -1);
                    if (!moves.length) {
			let is_mate = move.m.slice(-1) == '#';
			LS(`${'BW'[ply % 2]}: ${is_mate? 'I resign': 'Stalemate'}.`);
			finished = true;
                    }
		}
		if (finished) {
                    play_sound(audiobox, Y.sound_draw);
                    this.play(true);
		}
            }
	}
        this.delayed_picks(true);
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
            HTML(this.xsquares, text);
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
        let coord = node.dataset.c * 1;
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

        found = found.dataset.c;
        let square = _(`[data-c="${found}"] > .xhigh`, this.xsquares);
        if (square.style.background == 'transparent')
            return false;

        // 2) try to move, it might be invalid
        // TODO: handle promotions
        let promote = 'q';
        let move = this.chess_move(`${SQUARES_INV[this.picked]}${SQUARES_INV[found]}${promote}`, {decorate: true});
        if (!move.piece)
            return false;

        // 3) update
        this.new_move(move);
        this.maybe_play();
    }

    /**
     * Play button was pushed
     * @param {boolean=} stop
     */
    play(stop) {
        if (stop || timers.click_play) {
            clear_timeout(`click_play`);
            stop = true;
            this.play_mode = 'play';
        }

        S('[data-x="pause"]', !stop, this.node);
        S('[data-x="play"]', stop, this.node);

        if (stop)
            this.delayed_picks(true);
        else
            this.hold_button('play', 0);
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

        // restore smooth
        if (this.smooth0)
            this.smooth = this.smooth0;
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
                    let col_name = COLUMN_LETTERS[rotate? 7 - j: j],
                        even = (i + j) % 2,
                        note_x = '',
                        note_y = '',
                        square = i * 16 + j,
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
            this.squares = Assign({}, ...From(A('.xsquare', this.node)).map(node => ({[node.dataset.q]: node})));
            this.move2 = null;
        }

        // 3) draw pieces
        if (dirty & 2) {
            if (DEV.board)
                LS(`render_html: num_piece=${this.pieces.length}`);

            let nodes = [],
                [piece_size, style, transform] = this.get_piece_background(this.size);

            Class(this.xpieces, 'smooth', this.smooth);

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

                    if (found) {
                        node.dataset.c = row * 16 + col;
                        if (rotate) {
                            col = 7 - col;
                            row = 7 - row;
                        }

                        let style_transform = `${transform} translate(${col * piece_size}px, ${row * piece_size}px)`,
                            z_index = (node.style.transform == style_transform)? 2: 3;

                        Style(node, `transform:${style_transform};opacity:1;pointer-events:all;z-index:${z_index}`);
                    }
                    else
                        Style(node, 'opacity:0;pointer-events:none');
                }
            });

            if (DEV.board)
                LS(this.xpieces);

            // insert pieces
            InsertNodes(this.xpieces, nodes);
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
     * @param {string=} start_fen
     */
    reset(reset_evals, start_fen) {
        if (this.check_locked())
            return;

        this.start_fen = start_fen || START_FEN;
        this.frc = this.start_fen != START_FEN;

        this.fen = '';
        this.fen2 = '';
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

        this.set_fen(null, true);
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
            frame_size2 = size * num_col,
            min_height = frame_size + 10 + Visible('.xbottom', node) * 23;

        Style(node, `font-size:${size}px`);
        Style('.xframe', `height:${frame_size}px;width:${frame_size}px`, true, node);
        Style('.xoverlay', `height:${frame_size2}px;width:${frame_size2}px`, true, node);
        Style('.xmoves', `max-width:${frame_size}px`, true, node);
        Style('.xbottom, .xcontain, .xtop', `width:${frame_size}px`, true, node);
        Style('.xcontain', `left:${border}px;min-height:${min_height}px;top:${border}px`, true, node);

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
     * @param {string} fen null for start_fen
     * @param {boolean=} render
     * @returns {boolean}
     */
    set_fen(fen, render) {
        if (DEV.board)
            LS(`${this.id} set_fen: ${fen}`);
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
     * @param {boolean=} hold call instant()
     * @param {boolean=} manual ply was set manually => send the 'ply' in the hook
     * @param {boolean=} no_compute does not computer chess positions (slow down)
     * @returns {Move} move, false if no move + no compute, null if failed
     */
    set_ply(ply, {animate, hold, manual, no_compute, render=true}={}) {
        if (DEV.ply)
            LS(`${this.id}: set_ply: ${ply} : ${animate} : ${manual}`);

        clear_timeout(`dual${this.id}`);
        this.clicked = manual;
        this.delayed_ply = -2;

        if (hold)
            this.instant();

        // special case: initial board
        if (ply == -1 && this.main_manual) {
            this.ply = -1;
            this.set_fen(null, true);
            this.hide_arrows();
            this.update_cursor(ply);
            this.animate({}, animate);
            if (manual && this.hook)
                this.hook(this, 'ply', {ply: -1});
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

        if (!render)
            return move;

        this.set_fen(move.fen, true);

        // play sound?
        // - multiple sounds can be played with different delays
        let audio_moves = Y.audio_moves,
            is_last = (ply == this.moves.length - 1),
            can_moves = (audio_moves == 'all' || (is_last && audio_moves == 'last') || (this.play_mode == 'book' && Y.audio_book)),
            can_source = (this.name == Y.x || (this.main && Y.audio_live_archive) || (this.manual && Y.audio_pva));

        if (can_source && can_moves) {
            let audio_delay = Y.audio_delay,
                offset = 0,
                text = Undefined(move.m, '???'),
                last = text.slice(-1),
                sounds = [[(last == '#')? 'checkmate': (last == '+')? 'check': (text[0] == Upper(text[0])? 'move': 'move_pawn'), audio_delay]];

            if (text.includes('x')) {
                let capture_delay = Y.capture_delay;
                if (capture_delay < 0)
                    offset = -capture_delay;
                sounds.push(['capture', audio_delay + capture_delay]);
            }

            sounds.sort((a, b) => (a[1] - b[1]));

            for (let [name, delay] of sounds)
                add_timeout(`ply${ply}+${name}`, () => {
                    play_sound(audiobox, Y[`sound_${name}`], {interrupt: true});
                }, delay + offset);
        }

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
     * Show which pieces can be picked
     */
    show_picks() {
        if (!this.manual || timers.click_play)
            return;
        if (this.fen == this.fen2)
            return;

        this.chess_load(this.fen);

        let moves = this.chess_moves(this.frc, true, -1),
            froms = new Set(moves.map(move => move.from));

        this.clear_high('source target');
        for (let from of froms)
            this.add_high(from, 'turn');

        this.fen2 = this.fen;
    }

    /**
     * Think ...
     * @param {boolean} suggest
     * @returns {boolean} true if the AI was able to play
     */
    think(suggest) {
        let chess = this.chess,
            fen = this.fen,
            ply = get_fen_ply(this.fen),
            color = (1 + ply) % 2;

        // busy thinking => return
        let reply = SetDefault(this.replies, fen, {});
        if (reply.lefts && reply.moves && !reply.lefts.every(item => !item))
            return true;

        Show(`.xcolor${color} .xcog`, this.node);

        this.create_workers();

        chess.load(fen);
        let moves = this.chess_moves(this.frc, true, -1),
            num_move = moves.length;
        if (!num_move)
            return false;

        let max_depth = (Y.game_engine == 'RandomMove')? 0: Y[`game_depth_${WB_LOWER[color]}`],
            max_extend = max_depth? Y[`game_extend_${WB_LOWER[color]}`]: 0,
            num_worker = this.workers.length;

        Assign(reply, {
            count: 0,
            lefts: I8(num_worker),
            moves: [],
            moves2: moves,
            nodes: 0,
            sel_depth: 0,
            start: Now(true),
        });

        // pure random?
        if (max_depth < 1 || num_worker < 1 || num_move < 2) {
            let id = RandomInt(num_move),
                move = moves[id];
            move.depth = 0;
            move.score = 0;
            this.worker_message({
                data: {
                    fen: fen,
                    frc: this.frc,
                    id: -1,
                    moves: [move],
                    nodes: 0,
                    sel_depth: 0,
                    suggest: suggest,
                },
            });
            return true;
        }

        // split moves across workers
        let has_moves = {},
            masks = [];
        for (let i = 0; i < num_worker; i ++)
            masks.push(I8(num_move));

        for (let i = 0; i < num_move; i ++) {
            let id = i % num_worker;
            masks[id][i] = 1;
            has_moves[id] = 1;
        }

        // send messages
        for (let id = 0; id < num_worker; id ++) {
            if (!has_moves[id])
                continue;
            reply.lefts[id] = id + 1;

            this.workers[id].postMessage({
                engine: Y.game_wasm? 'wasm': 'js',
                func: 'think',
                fen: fen,
                frc: this.frc,
                id: id,
                mask: masks[id].join(''),
                max_depth: max_depth,
                max_extend: max_extend,
                max_nodes: Y.game_nodes,
                suggest: suggest,
            });
        }

        return true;
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

    /**
     * Receive a worker message
     * @param {Event} e
     */
    worker_message(e) {
        let data = e.data,
            fen = data.fen,
            id = data.id,
            moves = data.moves,
            nodes = data.nodes,
            sel_depth = data.sel_depth,
            suggest = data.suggest;

        // 1) reject if FEN doesn't match
        let reply = this.replies[this.fen];
        if (!reply) {
            LS(`error, no reply for ${this.fen}`);
            return;
        }
        if (fen != this.fen)
            return;

        // 2) combine moves
        let combine = reply.moves,
            move = moves[0];
        reply.lefts[id] = 0;

        for (let move of moves) {
            if (move.piece && move.score > -900)
                combine.push(move);
        }

        reply.nodes += nodes;
        if (sel_depth > reply.sel_depth)
            reply.sel_depth = sel_depth;

        // still expecting more data?
        if (DEV.engine) {
            if (!reply.count)
                LS(this.fen);
            LS(`>> ${id}${fen == this.fen? '': 'X'} : ${move? move.m: '----'} : ${(move? move.score.toFixed(1): '-').padStart(6)} : ${reply.lefts} : ${combine.length}`);
        }
        reply.count ++;
        if (!reply.lefts.every(item => !item))
            return;

        // 3) got all the data
        let elapsed = Now(true) - reply.start,
            nps = (elapsed> 0.001)? `${FormatUnit(reply.nodes / elapsed)}nps`: '-';

        // get the best move
        combine.sort((a, b) => b.score - a.score);
        let best = combine[0];
        if (DEV.engine)
            LS(combine);
        if (!best) {
            LS('no legal move to play');
            return;
        }

        // 4) update
        let ply = get_fen_ply(fen),
            color = (1 + ply) % 2,
            mini = _(`.xcolor${color}`, this.node);

        if (color)
            best.score *= -1;

        Hide(`.xcog`, mini);
        HTML('.xeval', best.score.toFixed(2), mini);
        HTML(`.xleft`, elapsed.toFixed(1), mini);
        HTML('.xshort', `<div>${FormatUnit(reply.nodes)}</div><div>${nps}</div>`, mini);
        HTML(`.xtime`, `${best.depth}/${reply.sel_depth}`, mini);

        if (suggest)
            this.arrow(3, best);
        else {
            let result = this.chess_move(best, {decorate: true});
            this.new_move(result);
        }
    }
}
