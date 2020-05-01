// game.js
// @author octopoulo <polluxyz@gmail.com>
// @version 2020-04-23
//
// Game specific code:
// - control the board, moves
// - create the tables
// - update stats
//
// included after: common, engine, global, 3d, xboard
/*
globals
_, A, Abs, add_timeout, Assign, Attrs, C, change_setting, Class, clear_timeout, CreateNode, DEFAULTS, DEV, Events, Exp,
Floor, FormatUnit, FromSeconds, get_object, HasClass, Hide, HOST_ARCHIVE, HTML, Id, InsertNodes, Keys,
Lower, LS, Max, merge_settings, Min, Now, ON_OFF, Pad, Parent, Pow, Resource, resume_game, Round,
S, save_option, save_storage, set_3d_events, SetDefault, Show, show_menu, show_modal, Sign, Split, Style, TIMEOUTS,
Title, Toggle, touch_handle, translate_node, update_svg, Upper, Visible, window, XBoard, Y
*/
'use strict';

let BOARD_THEMES = {
        blue: ['#e0e0e0', '#87a6bc'],
        brown: ['#eaded0', '#927b6d'],
        chess24: ['#9E7863', '#633526'],
        dark: ['#797877', '#585655'],
        dilena: ['#FFE5B6', '#B16228'],
        green: ['#f0e9db', '#7b9d86'],
        leipzig: ['#FFFFFF', '#E1E1E1'],
        metro: ['#FFFFFF', '#EFEFEF'],
        red: ['#eaded0', '#b17278'],
        symbol: ['#FFFFFF', '#58AC8A'],
        uscf: ['#C3C6BE', '#727FA2'],
        wikipedia: ['#FFCE9E', '#D18B47'],
    },
    board_target = 'board',
    BOARDS = {
        board: {
            size: 48,
            smooth: true,
        },
        // pv0: {
        //     target: 'text',
        // },
        // pv1: {},
        // pva: {},
    },
    CACHE_TIMEOUTS = {
        brak: 1,
        crash: 600,
        cross: 1,
        sched: 240,
        season: 3600 * 24,
        tour: 1,
        winner: 3600 * 24,
    },
    ENGINE_FEATURES = {
        AllieStein: 1,                  // & 1 => NN engine
        LCZero: 3,                      // & 2 => Leela variations
    },
    LIVE_ENGINES = [],
    LIVE_TABLES = Split('#table-live0 #table-live1 #player0 #player1'),
    NAMESPACE_SVG = 'http://www.w3.org/2000/svg',
    num_ply,
    PIECE_KEYS  = Split('alpha chess24 dilena leipzig metro symbol uscf wikipedia'),
    PIECE_SIZES = {
        _: 80,
        metro: 160,
    },
    PIECE_TYPES = {
        _: 'png',
        // wikipedia: 'svg',            // will enable in the future
    },
    pgn_moves = [],
    players = [{}, {}],                 // current 2 players
    prev_pgn,
    ROUND_NAMES = {
        1: 'Final',
        2: 'SemiFinal',
        4: 'QuarterFinal',
    },
    SCORE_NAMES = {
        0: 'loss',
        0.5: 'draw',
        1: 'win',
        '=': 'draw',
    },
    table_data = {},
    TABLES = {
        crash: 'gameno=G#|White|Black|Reason|decision=Final decision|action=Action taken|Result|Log',
        cross: 'Rank|Engine|Points',
        event: 'Round|Winner|Points|runner=Runner-up|# Games|Score',
        game: 'Game#|PGN|White|white_ev=W.ev|black_ev=B.ev|Black|Result|Moves|Duration|Opening|Termination|ECO|Start',
        h2h: 'Game#|White|white_ev=W.ev|black_ev=B.Ev|Black|Result|Moves|Duration|Opening|Termination|ECO|Final Fen',
        sched: 'Game#|White|white_ev=W.ev|black_ev=B.ev|Black|Result|Moves|Duration|Opening|Termination|ECO|Final Fen|Start',
        season: 'Season|Download',
        stand: 'Rank|Engine|Games|Points|Crashes|Wins [W/B]|Loss [W/B]|SB|Elo|Diff [Live]',
        stats: 'Start time|End time|Duration|Avg Moves|Avg Time|White wins|Black wins|Draw Rate|Crashes|Min Moves|Max Moves|Min Time|Max Time',
        view: 'TC|Adj Rule|50|Draw|Win|TB|Result|Round|Opening|ECO|Event|Viewers',
        winner: 'name=S#|winner=Champion|runner=Runner-up|Score|Date',
    },
    time_delta = 0,
    tour_info = {},
    turn = 0,                           // 0:white to play, 1:black to play
    virtual_opened_table_special,
    xboards = {},
    WHITE_BLACK = ['white', 'black', 'live'],
    WB_TITLES = ['White', 'Black'];

// HELPERS
//////////

/**
 * The function was posted by "ya" in the Leela Chess Zero Discord channel
 * https://discordapp.com/channels/425419482568196106/430695662108278784/618146099269730342
 * - made it more readable
 * @param {number} cp
 * @returns {number}
 */
function _leelaCpToQ(cp) {
    if (cp < 234.18)
        return 0.0033898305085 * cp
            - (8.76079436769e-38 * Pow(cp, 15)) / (3.618208073857e-34 * Pow(cp, 14) + 1.0)
            + (cp * (-3.4456396e-5 * cp + 0.007076010851)) / (cp * cp - 487.329812319 * cp + 59486.9337812);

    if (cp < 381.73)
        return (-17.03267913 * cp + 3342.55947265) / (cp * cp - 360.8419732 * cp + 32568.5395889)
            + 0.995103;

    return (35073.0 * cp) / (755200.0 + 35014.0 * cp)
        + ((0.4182050082072 * cp - 2942.6269998574) / (cp * cp - 128.710949474 * cp - 6632.9691544526)) * Exp(-Pow((cp - 400.0) / 7000.0, 3))
        - 5.727639074137869e-8;
}

/**
 * Convert eval to win %
 * @param {number} eval_
 * @returns {number}
 */
function _leelaEvalToWinPct(eval_) {
    let q = Sign(eval_) * _leelaCpToQ(Abs(eval_) * 100);
    return Round(100 * 100 * q) / 200;
}

/**
 * Calculate the probability to draw or win
 * - works for AA and NN engines
 * @param {string} short_engine short engine name
 * @param {number} eval_
 * @returns {string}
 */
function calculate_probability(short_engine, eval_)
{
    if (isNaN(eval_))
        return eval_;

    let white_win,
        feature = ENGINE_FEATURES[short_engine];

    // adjust the score
    if (feature & 1) {
        if (feature & 2)
            white_win = _leelaEvalToWinPct(eval_);
        else
            white_win = (Math.atan((eval_ * 100) / 290.680623072) / 3.096181612 + 0.5) * 100 - 50;
    }
    else
        white_win = (50 - (100 / (1 + Pow(10, eval_/ 4))));

    // final output
    let reverse = 0;
    if (eval_ < 0)
    {
        reverse = 1;
        white_win = -white_win;
    }
    let win = parseFloat(Max(0, white_win * 2)).toFixed(1),
        draw = parseFloat(100 - Max(win, 0)).toFixed(1);

    return !win? `${draw}% D`: `${win}% ${reverse? 'B': 'W'} | ${draw}% D`;
}

/**
 * Calculate White and Black points
 * @param {string} text
 * @returns {Object}
 */
function calculate_score(text) {
    let black = 0,
        white = 0;

    for (let i=0, length=text.length; i<length; i++) {
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

// BOARD
////////

/**
 * Create 4 boards
 * - should be done at startup since we want to see the boards ASAP
 */
function create_boards() {
    Keys(BOARDS).forEach(key => {
        let options = Assign({
            hook: handle_board_events,
            history: true,
            id: `#${key}`,
            notation: 6,
            size: 16,
            target: 'html',
        }, BOARDS[key]);

        let xboard = new XBoard(options);
        xboard.initialise();
        xboards[key] = xboard;
    });

    update_board_theme();
}

/**
 * Update the boards' theme
 */
function update_board_theme() {
    let board_theme = BOARD_THEMES[Y.board_theme],
        theme = Y.piece_theme,
        theme_ext = PIECE_TYPES[theme] || PIECE_TYPES._,
        theme_size = PIECE_SIZES[theme] || PIECE_SIZES._;

    Keys(xboards).forEach(key => {
        xboards[key].set_theme(board_theme, theme, theme_ext, theme_size, Y.highlight_color, Y.highlight_size);
    });
}

// TABLES
/////////

/**
 * Analyse the crosstable data
 * - create table-stand + table-cross
 * @param {Object} data
 */
function analyse_crosstable(data) {
    if (!data)
        return;

    let cross_rows = [],
        dicos = data.Table,
        orders = data.Order,
        abbrevs = orders.map(name => dicos[name].Abbreviation),
        stand_rows = [];

    // 1) analyse all data => create rows for both tables
    for (let name of orders) {
        let dico = dicos[name],
            elo = dico.Rating,
            new_elo = Round(elo + dico.Elo),
            results = dico.Results;

        // cross
        let cross_row = {
            engine: name,
            points: dico.Score,
            rank: dico.Rank,
        };
        abbrevs.forEach((abbrev, id) => {
            let games = results[orders[id]];
            if (games) {
                cross_row[abbrev] = games.Scores.map(game => {
                    let score = game.Result;
                    return ` <a class="${SCORE_NAMES[score]}">${(score > 0 && score < 1)? '½': score}</a>`;
                }).join('').slice(1);
            }
        });
        cross_rows.push(cross_row);

        // stand
        stand_rows.push({
            crashes: dico.Strikes,
            diff: `${new_elo - elo} [${new_elo}]`,
            elo: elo,
            engine: name,
            games: dico.Games,
            loss: `${dico.LossAsWhite + dico.LossAsBlack} [${dico.LossAsWhite}/${dico.LossAsBlack}]`,
            points: dico.Score,
            rank: dico.Rank,
            sb: dico.Neustadtl,
            wins: `${dico.WinsAsWhite + dico.WinsAsBlack} [${dico.WinsAsWhite}/${dico.WinsAsBlack}]`,
        });
    }

    update_table('stand', stand_rows);

    // 2) table-cross: might need to update the columns too
    let node = Id('table-cross'),
        new_columns = [...Split(TABLES.cross), ...abbrevs],
        scolumns = Array.from(A('th', node)).map(node => node.textContent).join('|'),
        snew_columns = new_columns.join('|');

    if (scolumns != snew_columns) {
        // make the extra columns the same size
        let extras = new_columns.slice(3),
            width = `${Floor(71 / (extras.length + 0.001))}%`,
            widths = [...['4%', '18%', '7%'], ...extras.map(() => width)],
            head = create_table_columns(new_columns, widths);
        HTML('thead', head, node);
        translate_node(node);
    }

    update_table('cross', cross_rows);
}

/**
 * Handle the seasons file
 */
function analyse_seasons(data) {
    let seasons = (data || {}).Seasons;
    if (!seasons)
        return;

    let rows = Keys(seasons).reverse().map(key => Assign({season: isNaN(key)? key: `Season ${key}`}, seasons[key]));
    update_table('season', rows);
}

/**
 * Handle tournament data
 * @param {Object} data
 */
function analyse_tournament(data) {
    LS(data);
}

/**
 * Create a field for a table value
 * @param {string} text
 * @returns {string[]} field, value
 */
function create_field_value(text) {
    let items = text.split('=');
    if (items.length > 1)
        return [items[0], items.slice(1).join('=')];

    // startTime => start_time
    let lower = Lower(text.replace(/([a-z])([A-Z])/g, (_match, p1, p2) => `${p1}_${p2}`)),
        pos = lower.indexOf(' [');
    if (pos > 0)
        lower = lower.slice(0, pos);

    return [lower.replace(/[_() ./#-]+/g, '_').replace(/^_+|_+$/, ''), text];
}

/**
 * Create a Live table
 * - we don't want to recreate the table each time, that's why this creation will give a boost
 * @param {Node|string} node node or selector
 * @param {boolean} is_live live => has more info
 */
function create_live_table(node, is_live) {
    let html =
        '<vert class="live fastart">'
            + '<div class="live-basic">'
                + '<i data-x="name"></i> <i data-x="eval"></i> [<i data-x="score"></i>]'
            + '</div>';

    if (is_live)
        html +=
            '<div class="live-more">'
                + '[D: <i data-x="depth"></i> | TB: <i data-x="tb"></i> | Sp: <i data-x="speed"></i> | N: <i data-x="node"></i>]'
            + '</div>';

    html +=
            '<div class="live-pv"></div>'
        + '</vert>';
    HTML(node, html);
}

/**
 * Create a table
 * @param {string[]} columns
 * @param {boolean=} add_empty add an empty row (good for table-view)
 * @returns {string}
 */
function create_table(columns, add_empty) {
    let html =
        '<table><thead>'
        + create_table_columns(columns)
        + '</thead><tbody>'
        + (add_empty? columns.map(column => `<td data-x="${create_field_value(column)[0]}">&nbsp;</td>`).join(''): '')
        + '</tbody></table>';

    return html;
}

/**
 * Create <th> columns to be used in a table
 * - used by create_table
 * - used when generating the dynamic Crosstable
 * @param {string[]} columns
 * @param {number[]=} widths optional width for each column
 * @returns {string}
 */
function create_table_columns(columns, widths) {
    return columns.map((column, id) => {
        let [field, value] = create_field_value(column),
            style = widths? ` style="width:${widths[id]}"`: '';
        return `<th${style} ${id? '': 'class="rounded" '}data-x="${field}" data-t="${value}"></th>`;
    }).join('');
}

/**
 * Create all the tables
 */
function create_tables() {
    // 1) normal tables
    Keys(TABLES).forEach(name => {
        let table = TABLES[name],
            html = create_table(Split(table), name == 'view');
        HTML(`#table-${name}`, html);
    });
    translate_node('body');

    // 2) live tables
    for (let node of LIVE_TABLES)
        create_live_table(node, node.includes('live'));

    // 3) mouse/touch scroll
    Events('.scroller', '!touchstart touchmove touchend', () => {});
    Events('.scroller', 'mousedown mouseenter mouseleave mousemove mouseup touchstart touchmove touchend', e => {
        touch_handle(e);
    }, {passive: false});
}

/**
 * Download static JSON for a table
 * + cache support = can load the data from localStorage if it was recent
 * @param {string} url url
 * @param {string=} name table name
 * @param {function=} callback
 * @param {boolean=} no_cache force to skip the cache
 * @param {boolean=} only_cache only load data if it's cached
 * @param {boolean=} show open the table after wards
 */
function download_table(url, name, callback, {no_cache, only_cache, show}={}) {
    function _done(data, cached) {
        if (DEV.json & 1) {
            LS(`${url}:`);
            LS(data);
        }

        // if cached and table was already filled => skip
        if (cached) {
            let nodes = A(`#table-${name} tr`);
            if (nodes.length > 1)
                return;
        }

        // fill the table
        if (callback)
            callback(data);
        else if (name) {
            update_table(name, data);
            if (show) {
                LS(data);
                open_table(name);
            }
        }
    }

    let key,
        timeout = CACHE_TIMEOUTS[name];

    if (!no_cache && timeout) {
        key = `table_${name}`;
        let cache = get_object(key);
        if (cache && (only_cache || cache.time < Now() + timeout)) {
            if (DEV.json & 1)
                LS(`cache found: ${key} : ${Now() - cache.time} < ${timeout}`);
            _done(cache.data, true);
            return;
        }
        else if (DEV.json & 1)
            LS(`no cache: ${key}`);
    }

    if (only_cache)
        return;

    Resource(url, (code, data) => {
        if (code != 200)
            return;
        if (key) {
            save_storage(key, {data: data, time: Now()});
            if (DEV.json & 1)
                LS(`cache saved: ${key}`);
        }
        _done(data, false);
    });
}

/**
 * Download static JSON files at startup
 * @param {boolean=} only_cache
 */
function download_tables(only_cache) {
    if (!only_cache) {
        download_pgn();

        // evals
        download_table(`data.json?no-cache${Now()}`, null, data => {
            update_live_eval(data, 0);
        });
        download_table(`data1.json?no-cache${Now()}`, null, data => {
            update_live_eval(data, 1);
        });
        download_table('liveeval.json');
        download_table('liveeval1.json');
    }

    // tables
    download_table('crosstable.json', 'cross', analyse_crosstable, {only_cache: true});
    download_table('tournament.json', 'tour', analyse_tournament, {only_cache: true});
    download_table('schedule.json', 'sched', null, {only_cache: true});
}

/**
 * Set table-season events
 */
function set_season_events() {
    let table = Id('table-season');

    // expand/collapse
    C('.season', function() {
        let next = this.nextElementSibling;
        Toggle(next);
        Style('svg.down', `transform:${Visible(next)? 'rotate(-90deg)': 'none'}`, true, this);
    }, table);

    // open games
    C('a[data-u]', function() {
        let dico = {no_cache: true},
            name = this.dataset.u,
            prefix = `${HOST_ARCHIVE}/${name}`,
            prefix_lower = `${HOST_ARCHIVE}/${Lower(name)}`;

        download_table(`${prefix}_crash.xjson`, 'crash', null, dico);
        download_table(`${prefix}_Crosstable.cjson`, 'cross', analyse_crosstable, dico);
        download_table(`${prefix}_Enginerating.egjson`, null, null, dico);
        download_table(`${prefix}_Schedule.sjson`, 'game', null, Assign({show: true}, dico));
        // download_pgn();
    }, table);
}

/**
 * Show tables depending on the event type
 * @param {string} type
 */
function show_tables(type) {
    let is_cup = (type == 'cup'),
        parent = Id('tables'),
        target = is_cup? 'brak': 'stand';
    Class('[data-x="brak"], [data-x="event"]', 'dn', !is_cup, parent);
    Class('[data-x="cross"], [data-x="h2h"], [data-x="stand"]', 'dn', is_cup, parent);

    Class('div.tab', '-active', true, parent);
    Class(`[data-x="${target}"]`, 'active', true, parent);
    Class('div.scroller', 'dn', true, parent);
    Class(`#table-${target}`, '-dn');
}

/**
 * Update a table by adding rows
 * @param {string} name
 * @param {Object[]} data
 * @param {boolean=} reset clear the table before adding data to it (seems like we always need true?)
 */
function update_table(name, rows, reset=true) {
    let last,
        data = SetDefault(table_data, name, []),
        is_cross = (name == 'cross'),
        // is_event = (name == 'event'),
        is_game = (name == 'game'),
        is_sched = (name == 'sched'),
        is_winner = (name == 'winner'),
        new_rows = [],
        nodes = [],
        table = Id(`table-${name}`),
        body = _('tbody', table),
        columns = Array.from(A('th', table)).map(node => node.dataset.x);

    // reset or append?
    if (reset) {
        HTML(body, '');
        data.length = 0;
    }

    if (!Array.isArray(rows))
        return;

    // process all rows
    rows.forEach((row, row_id) => {
        if (is_cross) {
            LS('cross');
            LS(row);
        }
        row = Assign({}, ...Keys(row).map(key => ({[create_field_value(key)[0]]: row[key]})));
        data.push(row);

        let vector = columns.map(key => {
            let class_ = '',
                td_class = '',
                value = row[key];

            if (value == undefined) {
                if (is_cross) {
                    td_class = 'void';
                    value = '';
                }
                else
                    value = '-';
            }

            // special cases
            switch (key) {
            case 'black':
                if (row.result == '0-1')
                    class_ = 'win';
                else if (row.result == '1-0')
                    class_ = 'loss';
                break;
            case 'download':
                value = `<a href="${HOST_ARCHIVE}/${value}"><i data-svg="download"></i></a>`;
                break;
            case 'engine':
            case 'runner':
            case 'winner':
                if (!is_winner) {
                    td_class = 'tal';
                    value = `<hori><img class="left-image" src="image/engine/${get_short_name(value)}.jpg"><div>${value}</div></hori>`;
                }
                break;
            case 'game':
                value = row_id + 1;
                // if (row.moves)
                //     value = `<a class="game">${value}</a>`;
                break;
            case 'name':
                class_ = 'loss';
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
                let lines = [`<a class="season">${value} <i data-svg="down"></i></a>`];
                if (row.sub) {
                    if (value == 'Season 18')
                        LS(row);
                    lines.push('<grid class="dn">');
                    for (let sub of row.sub.reverse())
                        lines.push(
                            `<a class="sub" data-u="${sub.abb}">${sub.menu}</a>`
                            + `<a href="${HOST_ARCHIVE}/${sub.abb}.pgn.zip"><i data-svg="download"></i></a>`
                        );
                    lines.push('</grid>');
                }
                value = lines.join('');
                break;
            case 'white':
                if (row.result == '1-0')
                    class_ = 'win';
                else if (row.result == '0-1')
                    class_ = 'loss';
                break;
            default:
                if (typeof(value) == 'string') {
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

        // special case
        if (is_sched) {
            if (!last && nodes.length && !row.moves) {
                nodes[nodes.length - 1].classList.add('active');
                last = true;
            }
            if (row.white == players[0].name && row.black == players[1].name)
                new_rows.push(row);
        }

        let node = CreateNode('tr', vector.join(''), (is_game || is_sched)? {class: 'pointer', 'data-g': row_id + 1}: null);
        nodes.push(node);
    });

    InsertNodes(body, nodes);

    // add events
    if (is_sched)
        update_table('h2h', new_rows, reset);
    else if (name == 'season')
        set_season_events();

    C('tr[data-g]', function() {
        Class('tr.active', '-active', true, table);
        Class(this, 'active', true, table);
    }, table);

    update_svg(table);
    translate_node(table);
}

// BRACKETS
///////////

/**
 * Calculate the seeds
 * - assume the final will be 1-2 then work backwards
 * - support non power of 2 => 0 will be the 'skip' seed
 * @param {number} num_team
 */
function calculate_seeds(num_team) {
    let number = 2,
        nexts = [1, 2];

    while (number < num_team) {
        number *= 2;
        let seeds = [];
        for (let i=0; i<number; i++) {
            let value = (i % 2)? (number + 1 - seeds[i - 1]): nexts[Floor(i / 2)];
            seeds[i] = (value <= num_team)? value: 0;
        }
        nexts = seeds;
    }

    return nexts;
}

/**
 * Create the brackets
 * @param {Object} data
 */
function create_bracket(data) {
    // 1)
    window.event = data;
    let game = 1,
        lines = ['<hori class="fastart noselect">'],
        teams = data.teams,
        num_team = teams.length,
        number = num_team,
        round_results = data.results[0] || [],
        round = 0,
        seeds = calculate_seeds(num_team * 2);

    // assign seeds
    teams.forEach((team, id) => {
        team[0].seed = seeds[id * 2];
        team[1].seed = seeds[id * 2 + 1];
    });

    // 2) create each round
    while (number >= 1) {
        let name = ROUND_NAMES[number] || `Round of ${number * 2}`,
            nexts = [],
            number2 = (number == 1)? 2: number,
            results = round_results[round] || [];

        lines.push(
            '<vert class="rounds fstart h100">'
            + `<div class="round" data-t="${name}"></div>`
            + `<vert class="${number == 1? 'fcenter final': 'faround'} h100">`
        );
        for (let i=0; i<number2; i++) {
            let names = [0, 0],
                result = results[i] || [],
                scores = [0, 0],
                team = teams[i];

            if (team)
                team.forEach((item, id) => {
                    let class_ = '',
                        short = get_short_name(item.name);

                    if (result[0] != result[1])
                        class_ = (item.winner && result[id] > result[1 - id])? ' win': ' loss';

                    names[id] = [
                        class_,
                        `<hori title="${item.name}"><img class="match-logo" src="image/engine/${short}.jpg"><div>#${item.seed} ${short}</div></hori>`,
                    ];
                    scores[id] = [
                        class_,
                        result[id],
                    ];

                    // propagate the winner to the next round
                    if (class_ == ' win')
                        SetDefault(nexts, Floor(i / 2), [{}, {}])[i % 2] = item;
                    // match for 3rd place
                    else if (class_ == ' loss' && number == 2)
                        SetDefault(nexts, 1, [{}, {}])[i % 2] = item;
                });

            lines.push(
                '<vert class="match fastart">'
                    // final has 3rd place game too
                    + `<div class="match-title">#${game + (number == 1? 1 - i * 2: 0)}</div>`
                    + '<grid class="match-grid">'
            );

            for (let id=0; id<2; id++) {
                let [name_class, name] = names[id] || [],
                    [score_class, score] = scores[id] || [];

                if (!name) {
                    name = 'TBD';
                    score = '--';
                    name_class = ' none';
                    score_class = ' none';
                }
                else
                    name_class += ' fastart';

                lines.push(
                    `<vert class="name${name_class} fcenter">${name}</vert>`
                    + `<vert class="score${score_class} fcenter">${score}</vert>`
                );
            }

            lines.push(
                    '</grid>'
                + '</vert>'
            );
            game ++;
        }
        lines.push(
                '</vert>'
            + '</vert>'
        );

        number /= 2;
        round ++;
        teams = nexts;
    }

    // 3) result
    lines.push('</hori>');
    let node = Id('table-brak');
    HTML(node, lines.join(''));
    translate_node(node);

    // necessary to correctly size each round
    Style(node.firstChild, `height:${node.clientHeight}px`);
}

/**
 * Create a cup
 * @param {Object} data
 */
function create_cup(data) {
    show_tables('cup');

    let event = data.EventTable;
    if (event) {
        let rows = Keys(event).map(key => {
            return Assign({round: key.split(' ').slice(-1)}, event[key]);
        });
        update_table('event', rows);
    }

    create_bracket(data);
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
    if (!dico)
        return {};
    let _50 = dico.FiftyMoves,
        abs_draw = Abs(dico.Draw),
        abs_win = Abs(dico.ResignOrWin);

    return {
        50: (_50 < 51)? _50: '-',
        draw: (abs_draw <= 10 && total_moves > 58)? `${Max(abs_draw, 69 - total_moves)}p`: '-',
        win: (abs_win < 11)? abs_win: '-',
    };
}

/**
 * Create a PV list
 * @param {Object[]} moves
 * @returns {string} html
 */
function create_pv_list(moves) {
    let lines = [],
        num_move = moves.length;

    moves.forEach((move, id) => {
        if (id % 2 == 0)
            lines.push(` <i class="turn">${1 + id / 2}.</i>`);

        if (!move || !move.m) {
            lines.push(` <a style="color:red">???</a>`);
            return;
        }

        let class_ = move.book? 'book': 'real';
        if (id == num_move - 1)
            class_ += ' last';

        lines.push(` <a class="${class_}" data-i="${id}">${move.m}</a>`);
    });

    return lines.join('');
}

/**
 * Download the PGN
 * @param {boolean=} reset_time
 */
function download_pgn(reset_time) {
    Resource(`live.json?no-cache${Now()}`, (code, data, xhr) => {
        if (code != 200)
            return;
        if (!reset_time) {
            let curr_time = new Date(xhr.getResponseHeader('date')),
                last_mod = new Date(xhr.getResponseHeader('last-modified'));
            time_delta = curr_time.getTime() - last_mod.getTime();
        }
        prev_pgn = null;
        data.gameChanged = 1;
        update_pgn(data);
    });
}

/**
 * Update the PGN
 * - white played => lastMoveLoaded=109
 * @param {Object} pgn
 */
function update_pgn(pgn) {
    if (!xboards.board)
        return;
    window.pgn = pgn;

    let headers = pgn.Headers,
        moves = pgn.Moves,
        num_move = moves.length,
        overview = Id('table-view'),
        start = pgn.lastMoveLoaded || 0;

    // 1) update overview
    if (pgn.Users)
        HTML('td[data-x="viewers"]', pgn.Users, overview);
    if (headers) {
        Split('ECO|Event|Opening|Result|Round|TimeControl').forEach(key => {
            let value = headers[key];
            if (value == undefined)
                value = '';

            // TCEC Season 17 => S17
            if (key == 'Event')
                value = value.replace('TCEC Season ', 'S');
            else if (key == 'TimeControl') {
                let items = value.split('+');
                key = 'tc';
                value = `${items[0]/60}'+${items[1]}"`;
            }
            HTML(`td[data-x="${Lower(key)}"]`, value, overview);
        });
    }

    if (!num_move)
        return;

    // 2) update the moves
    let move = moves[num_move - 1],
        last_ply = pgn.numMovesToSend + start;

    xboards.board.new_move(move);
    xboards.board.set_fen(move.fen, true);

    // xboards.pv1.set_fen(fen, true);
    if (DEV.ply & 1) {
        LS(`${start} + ${num_move} = ${start + num_move}. ${(start + num_move) % 2} ${move.m}`);
        LS(`${(last_ply) / 2}`);
    }

    if (!last_ply || last_ply < num_ply)
        pgn_moves.length = 0;
    for (let i=0; i<num_move; i++)
        pgn_moves[start + i] = moves[i];

    // if only 1 move was played => white just played (who=0), and black plays next (turn=1)
    num_ply = pgn_moves.length;
    turn = num_ply % 2;
    let short_nodes = [],
        who = 1 - turn;

    if (DEV.ply & 1)
        LS(`num_move=${num_move} : num_ply=${num_ply} : last_ply=${last_ply} => turn=${turn}`);
    prev_pgn = pgn;

    // 3) check adjudication + update overview
    let tb = Lower(move.fen.split(' ')[0]).split('').filter(item => 'bnprqk'.includes(item)).length - 6;
    HTML('td[data-x="tb"]', tb, overview);

    let finished = headers.TerminationDetails,
        result = check_adjudication(move.adjudication, num_ply);
    result.adj_rule = finished;
    Keys(result).forEach(key => {
        HTML(`td[data-x="${key}"]`, result[key], overview);
    });

    S('[data-x="adj_rule"]', finished, overview);
    S('[data-x="50"], [data-x="draw"], [data-x="win"]', !finished, overview);

    // 4) engines
    WB_TITLES.forEach((title, id) => {
        let name = headers[title],
            node = Id(`player${id}`),
            short = get_short_name(name),
            src = `image/engine/${short}.jpg`;

        short_nodes.push([short, node]);
        Assign(players[id], {
            name: name,
            short: short,
        });

        HTML(`#engine${id}`, name);
        HTML(`[data-x="name"]`, short, node);
        HTML(`#score${id}`, headers[`${title}Elo`]);

        let image = Id(`logo${id}`);
        if (image.src != src) {
            image.setAttribute('alt', name);
            image.src = src;
        }
    });

    for (let i=num_move - 1; i>=0 && i>=num_move - 2; i--) {
        let move = moves[i],
            is_book = move.book,
            eval_ = is_book? 'book': move.wv,
            stats = {
                depth: is_book? '-': `${move.d}/${move.sd}`,
                eval: eval_,
                left: FromSeconds(move.tl / 1000).slice(0, -1).map(item => Pad(item)).join(':'),
                node: is_book? '-': FormatUnit(move.n),
                speed: is_book? '-': `${FormatUnit(move.s)}bps`,
                tb: is_book? '-': FormatUnit(move.tb),
                time: FromSeconds(move.mt / 1000).slice(1, -1).map(item => Pad(item)).join(':'),
            };

        Keys(stats).forEach(key => {
            HTML(`#${key}${who}`, stats[key]);
        });

        let [short, node] = short_nodes[who];
        HTML(`[data-x="eval"]`, is_book? '': move.wv, node);
        HTML(`[data-x="score"]`, is_book? 'book': calculate_probability(short, eval_), node);
        HTML('.live-pv', move.pv? move.pv.San: '', node);

        Assign(players[who], {
            eval: eval_,
            left: move.tl,
            time: move.mt,
        });
        who = 1 - who;
    }

    // material
    let material = move.material,
        materials = [[], []];
    'qrbnp'.split('').forEach(key => {
        let value = material[key];
        if (value) {
            let id = (value > 0)? 0: 1,
                color = id? 'b': 'w';
            for (let i=0; i<Abs(value); i++)
                materials[id].push(`<div><img src="theme/wikipedia/${color}${Upper(key)}.svg"></div>`);
        }
    });

    for (let id=0; id<2; id++) {
        let node = Id(`material${id}`),
            html = HTML(node),
            material = materials[id].join('');
        if (html != material)
            HTML(node, material);
    }

    // 3) pv
    let html = create_pv_list(pgn_moves);
    HTML('.xmoves', html, xboards.board.node);

    // chart
    // prevPgnData = prev_pgn;
    // updateChartData();
}

/**
 * Resize game elements
 */
function resize_game() {
    // resize the boards
    let width = Id('board').clientWidth;
    if (xboards.board)
        xboards.board.resize(width);
}

// LIVE DATA
////////////

/**
 * Set the number of viewers
 * @param {number} count
 */
function set_viewers(count) {
    HTML('#table-view td[data-x="viewers"]', count);
}

/**
 * Update data from one of the Live engines
 * @param {Object} data
 * @param {number} id 0, 1
 */
function update_live_eval(data, id) {
    if (!data)
        return;

    let eval_ = data.eval,
        short = get_short_name(data.engine),
        node = Id(`table-live${id}`);

    if (DEV.socket & 1) {
        LS(`update_live_eval: ${id} / ${short}`);
        LS(data);
    }

    let dico = {
        depth: data.depth,
        eval: eval_,
        name: short,
        node: FormatUnit(data.nodes),
        score: calculate_probability(short, eval_),
        speed: data.speed,
        tb: FormatUnit(data.tbhits),
    };
    Keys(dico).forEach(key => {
        HTML(`[data-x="${key}"]`, dico[key], node);
    });
    HTML('.live-pv', data.pv, node);
    // HTML(`div[data-x="live${id}"]`, short);

    // chart
    // updateChartDataLive(id);
}

/**
 * Update data from a Player
 * @param {Object} data
 */
function update_player_eval(data) {
    let eval_ = data.eval,
        id = data.color,
        node = Id(`player${id}`),
        short = get_short_name(data.engine);

    if (DEV.socket & 1) {
        LS(`update_player_eval: ${id} / ${short}:`);
        LS(data);
    }

    // 1) update the live part on the left
    let dico = {
        eval: eval_,
        name: short,
        score: calculate_probability(short, eval_),
    };
    Keys(dico).forEach(key => {
        HTML(`[data-x="${key}"]`, dico[key], node);
    });
    HTML('.live-pv', data.pv, node);

    // 2) update the engine info in the center
    let stats = {
        depth: data.depth,
        engine: data.engine,
        eval: eval_,
        logo: short,
        node: FormatUnit(data.nodes),
        speed: data.speed,
        tb: FormatUnit(data.tbhits),
    };
    Keys(stats).forEach(key => {
        HTML(`#${key}${id}`, stats[key]);
    });

    // chart
    // updateChartDataLive(id);
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
    if (Visible('#overlay')) {
        let changes = 0,
            parent = Visible('#modal')? Id('modal'): Id('modal2'),
            items = Array.from(A('.item', parent)).filter(item => Visible(item)),
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
            if (Visible('#modal2'))
                show_modal(true);
            else
                resume_game();
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
    else {
        switch (code) {
        // enter, space
        case 13:
        case 32:
            break;
        // escape
        case 27:
            // LS(`game_action_key2: ${code}`);
            // show_menu();
            break;
        }

        LS(`keydown: ${code}`);
    }
}

/**
 * Handle a keyup
 * @param {number} code
 */
function game_action_keyup(code) {
    LS(`keyup: ${code}`);
}

// EVENTS
/////////

/**
 * Handle xboard events
 * + control click
 * - history/moves click
 * - drag and drop
 * @param {XBoard} board
 * @param {string} type
 * @param {Event|string} value
 */
function handle_board_events(board, type, value) {
    if (type == 'control') {
        LS(`hook: ${board.name} : ${type} : ${value}`);
        switch (value) {
        case 'cube':
            board.target = (board.target == 'html')? 'text': 'html';
            board.dirty = 3;
            board.resize();
            break;
        }
    }
    else if (type == 'move') {
        let target = value.target,
            id = target.dataset.i,
            move = pgn_moves[id];
        if (id) {
            Class('.seen', '-seen', true, target.parentNode);
            Class(target, 'seen');
            // note: potentially SLOW, better to use `new_move` if going to the next move
            xboards.board.set_fen(move.fen, true);
        }
    }
    else {
        LS(type);
        LS(value);
    }
}

/**
 * Select a tab and open the corresponding table
 * @param {string|Node} sel tab name or node
 */
function open_table(sel) {
    if (typeof(sel) == 'string')
        sel = _(`div.tab[data-x="${sel}"]`);

    let parent = Parent(sel, 'horis', 'tabs'),
        active = _('div.active', parent),
        key = sel.dataset.x,
        node = Id(`table-${key}`);

    Class(active, '-active');
    Class(sel, 'active');
    Class(`#table-${active.dataset.x}`, 'dn');
    Class(node, '-dn');

    opened_table(node, key);
}

/**
 * Special handling after user clicked on a tab
 * @param {Node} node table node
 * @param {string} name
 */
function opened_table(node, name) {
    switch (name) {
    case 'crash':
        download_table('crash.json', name);
        break;
    case 'info':
        HTML(node, HTML('#desc'));
        break;
    case 'season':
        download_table('gamelist.json', name, analyse_seasons);
        break;
    case 'winner':
        download_table('winners.json', name);
        break;
    }

    if (virtual_opened_table_special)
        virtual_opened_table_special(node, name);
}

/**
 * Show a popup with the engine info
 * @param {string} scolor white, black
 * @param {Event} e
 */
function popup_engine_info(scolor, e) {
    if (!prev_pgn)
        return;

    let show,
        popup = Id('popup'),
        type = e.type;

    if (type == 'mouseleave')
        show = false;
    else if (scolor == 'popup')
        show = true;
    else {
        let title = Title(scolor),
            engine = Split(prev_pgn.Headers[title]),
            options = prev_pgn[`${title}EngineOptions`],
            lines = options.map(option => [option.Name, option.Value]);

        // add engine + version
        lines.splice(0, 0, ['Engine', engine[0]], ['Version', engine.slice(1).join(' ')]);
        lines = lines.flat().map(item => `<div>${item}</div>`);

        HTML(popup, `<grid class="grid2">${lines.join('')}</grid>`);

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
    // trick to be able to put the mouse on the popup and copy text
    if (show) {
        clear_timeout('popup-engine');
        Class(popup, 'popup-enable');
    }
    else
        add_timeout('popup-engine', () => {Class(popup, '-popup-enable');}, 500);
}

/**
 * Game events
 */
function set_game_events() {
    set_3d_events();

    // engine popup
    Events('#info0, #info1', 'click mouseenter mousemove mouseleave', function(e) {
        popup_engine_info(WHITE_BLACK[this.id.slice(-1)], e);
    });

    // tabs
    C('div.tab', function() {
        open_table(this);
    });
}

// STARTUP
//////////

/**
 * Call this after the structures have been initialised
 */
function start_game() {
    create_boards();
    create_tables();

    LIVE_ENGINES.forEach((live, id) => {
        HTML(`[data-x="live${id}"]`, live);
    });

    show_tables('league');
    // download_table('bracket.json', 'brak', create_cup);
}

/**
 * Initialise structures with game specific data
 */
function startup_game() {
    //
    Assign(DEFAULTS, {
        live_engine1: 1,
        live_engine2: 1,
        order: 'left|center|right',
        twitch_chat: 1,
        twitch_dark: 1,
        twitch_video: 1,
    });
    merge_settings({
        // separator
        _1: {},
        board: {
            arrow_opacity: [{max: 1, min: 0, step: 0.01, type: 'number'}, 0.5],
            board_theme: [Keys(BOARD_THEMES), 'chess24'],
            highlight_color: [{type: 'color'}, '#ffff00'],
            highlight_size: [{max: 0.5, min: 0, step: 0.01, type: 'number'}, 0.06],
            notation: [ON_OFF, 1],
            piece_theme: [PIECE_KEYS, 'chess24'],
        },
        board_pv: {
            live_pv: [ON_OFF, 1],
            notation_pv: [ON_OFF, 1],
            ply_diff: [['first', 'diverging', 'last'], 'first'],
        },
        extra: {
            cross_crash: [ON_OFF, 0],
            live_log: [[0, 5, 10, 'all'], 0],
        },
    });
}