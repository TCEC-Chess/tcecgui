// graph.js
// @author octopoulo <polluxyz@gmail.com>
// @version 2021-02-27
//
// jshint -W069
/*
globals
_, A, Abs, add_timeout, Assign, C, CacheId, calculate_feature_q, Clamp, CreateNode,
DEFAULTS, DEV, Exp, exports, fix_move_format, Floor, format_unit, FromSeconds, get_move_ply, global, Keys,
Log, Log10, LS, Max, Merge, Min, mix_hex_colors, Pad, Pow, require, Round,
S, save_option, SetDefault, Sign, Style, translate_expression, Visible, window, xboards, Y, y_x
*/
'use strict';

// <<
if (typeof global != 'undefined') {
    ['common', 'engine', 'global'].forEach(key => {
        Object.assign(global, require(`./${key}.js`));
    });
}
// >>

// modify those values in config.js
let ENGINE_NAMES = ['White', 'Black', '7{Blue}', '7{Red}'],
    NON_EVALS = new Set([undefined, null, '', '-', 'book']);

let BEGIN_ZEROES = {
        'eval': 1,
        'time': 1,
    },
    cached_percents = {},
    chart_data = {},
    CHART_LEGEND = {
        display: true,
        fontSize: 5,
        position: 'bottom',
        labels: {
            boxWidth: 1
        },
    },
    CHART_OPTIONS = {
        hoverMode: 'index',
        legend: {
            display: false
        },
        maintainAspectRatio: false,
        responsive: true,
        spanGaps: true,
        title: {
            display: false,
        },
        tooltips: {
            mode: 'index',
        },
    },
    CHART_X_AXES = {
        ticks: {
            callback: (value, _index, values) => (values.length <= 20)? value: Floor(value),
            maxTicksLimit: 19,
        },
    },
    charts = {},
    DEFAULT_SCALES = {},
    EVAL_CLAMP = 512,
    first_num = -1,
    FormatAxis = value => format_unit(value),
    FormatEval = value => value? value.toFixed(2): 0,
    // &1: no_kibitzer
    LIVE_GRAPHS = {
        'eval': 0,
        'speed': 1,
    },
    queued_charts = [],
    SUB_BOARDS = ['live0', 'live1', 'pv0', 'pv1'],
    TIMEOUT_graph = 500;

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Calculate white win %
 * @param {number} id 0, 1, 2, 3
 * @param {number|string} eval_
 * @param {number} ply
 * @returns {number}
 */
function calculate_win(id, eval_, ply) {
    if (eval_ == undefined)
        return eval_;

    let main = xboards[Y.s],
        feature = main.players[id].feature,
        cache_features = SetDefault(cached_percents, feature, {}),
        key = `${eval_}:${ply}`,
        cache = cache_features[key];

    if (cache != undefined)
        return cache;

    let score;
    if (!isNaN(eval_)) {
        score = calculate_feature_q(feature, /** @type {number} */(eval_), ply) * 2;
        score = Sign(score) * Round(Abs(score) * 10) / 10;
    }
    else if (eval_ && eval_.includes('-'))
        score = -100;
    else if (eval_ != undefined)
        score = 100;
    else
        score = 0;

    cache_features[key] = score;
    return score;
}

/**
 * Check if the first_num should be modified
 * - unshift the dataset & labels if needed
 * @param {number} num
 */
function check_first_num(num) {
    if (first_num >= 0 && first_num <= num)
        return;
    if (DEV['chart'])
        LS(`first_num: ${first_num} => ${num}`);

    if (first_num >= 0) {
        Keys(chart_data).forEach(key => {
            let data = chart_data[key];

            // labels
            for (let ply = first_num - 1; ply >= num; ply --)
                data.labels.unshift(ply / 2 + 1);

            // datasets
            for (let dataset of data.datasets) {
                for (let ply = first_num - 1; ply >= num; ply --)
                    dataset.data.unshift(undefined);
            }
        });
    }

    first_num = num;
}

/**
 * Clamp an eval
 * @param {number} eval_
 * @returns {number|undefined}
 */
function clamp_eval(eval_) {
    if (NON_EVALS.has(eval_))
        return undefined;

    if (!isNaN(eval_)) {
        eval_ *= 1;
        if (!Number.isFinite(eval_))
            return Clamp(eval_, -EVAL_CLAMP, EVAL_CLAMP);
        return eval_;
    }

    if (eval_ && eval_.includes('-'))
        eval_ = -EVAL_CLAMP;
    else if (eval_ != undefined)
        eval_ = EVAL_CLAMP;
    else
        eval_ = 0;

    return eval_;
}

/**
 * Create all chart data
 */
function create_chart_data() {
    let color0 = Y['graph_color_0'],
        color1 = Y['graph_color_1'],
        color2 = Y['graph_color_2'],
        color3 = Y['graph_color_3'],
        extra0 = mix_hex_colors(color0, '#007fff', 0.2),
        extra1 = mix_hex_colors(color1, '#007fff', 0.75);

    let datasets = {
        'agree': [
            new_dataset('{white} + {black}', color0),
            new_dataset('{blue} + {red}', mix_hex_colors(color2, color3, 0.5)),
        ],
        'depth': [
            new_dataset('depth', color0),
            new_dataset('depth', color1),
            new_dataset('selective', extra0),
            new_dataset('selective', extra1),
        ],
        'eval': ENGINE_NAMES.map((name, id) => new_dataset(name, Y[`graph_color_${id}`])),
        'mobil': [
            new_dataset('mobility', color0),
            new_dataset('mobility', color1),
            new_dataset('r-Mobility', '#236ad6', '', {borderDash: [10, 5]}),
        ],
        'node': [
            new_dataset('w', color0),
            new_dataset('b', color1),
        ],
        'speed': [
            new_dataset('w', color0),
            new_dataset('b', color1),
        ],
        'tb': [
            new_dataset('w', color0),
            new_dataset('b', color1),
        ],
        'time': [
            new_dataset('time', color0),
            new_dataset('time', color1),
            new_dataset('left~2', extra0, 'y_axis_1'),
            new_dataset('left~2', extra1, 'y_axis_1'),
        ],
    };

    // assign all
    Keys(datasets).forEach(key => {
        chart_data[key] = {
            datasets: datasets[key],
            labels: [],
        };
    });

}

/**
 * Create all charts
 * - only linear but allow scale type registration.
 * - This allows extensions to exist solely for log scale for instance
 */
function create_charts() {
    // 1) create all charts
    new_chart('agree', true, FormatAxis, 0);
    new_chart('depth', true, FormatAxis, 10);
    new_chart('eval', true, FormatEval, 4, (item, data) => {
        let dico = get_tooltip_data(item, data),
            eval_ = dico.eval;
        return (Y['graph_eval_mode'] == 'percent')? calculate_win(item.datasetIndex, eval_, dico['ply']): eval_;
    });
    new_chart('mobil', true, FormatAxis, 0);
    new_chart('node', false, FormatAxis, 10, (item, data) => {
        let nodes = format_unit(get_tooltip_data(item, data).nodes);
        return nodes;
    });
    new_chart('speed', false, FormatAxis, 10, (item, data) => {
        let point = get_tooltip_data(item, data),
            nodes = format_unit(point.nodes),
            speed = format_unit(point.y);
        return `${speed}nps (${nodes} nodes)`;
    });
    new_chart('tb', false, FormatAxis, 1, (item, data) => {
        let hits = format_unit(get_tooltip_data(item, data).y);
        return hits;
    });
    new_chart('time', true, format_time, 0, (item, data) => {
        return format_time(get_tooltip_data(item, data).y);
    }, {backgroundColor: 'rgb(10, 10, 10)'}, 2);

    // 2) click events
    Keys(charts).forEach(name => {
        C(CacheId(`chart-${name}`), e => {
            let chart = charts[name],
                point = chart.getElementAtEvent(e)[0];
            if (!point)
                return;

            let ds_index = point._datasetIndex,
                index = point._index,
                dico = chart.data.datasets[ds_index].data[index];

            if (dico)
                xboards[Y.s].set_ply(dico['ply'], {manual: true});
        });

        // add markers
        let node = _(`#table-${name} > .chart`),
            markers = A('cmarker', node);
        if (!markers.length)
            for (let i of [0, 1])
                node.appendChild(CreateNode('div', null, {'class': 'cmarker'}));
    });

    update_chart_options(null, 3);

    // settings
    save_option('scales');
    DEFAULTS['scales'] = DEFAULT_SCALES;
}

/**
 * Fix labels that are undefined
 * - the last label needs to be set, otherwise there won't be any change
 * @param {Array<string|number>} labels
 */
function fix_labels(labels) {
    let num_label = labels.length;
    if (!num_label)
        return;

    let offset = labels[num_label - 1] - num_label + 1;
    if (isNaN(offset))
        return;

    for (let i = 0; i < num_label; i ++)
        if (labels[i] == undefined)
            labels[i] = i + offset;
}

/**
 * Format hh:mm:ss or mm:ss from seconds
 * @param {number} seconds
 * @returns {string}
 */
function format_time(seconds) {
    let [hour, min, sec] = FromSeconds(seconds);
    return (hour > 0)? `${hour}h${Pad(min)}`: (min > 0)? `${min}:${Pad(sec)}`: sec;
}

/**
 * Get tooltip data
 * @param {Object} item tooltip item
 * @param {Object} data
 * @returns {Object}
 */
function get_tooltip_data(item, data) {
    return data.datasets[item.datasetIndex].data[item.index];
}

/**
 * Invert an eval:
 * - 9 => -9
 * - #M33 => -M#33, and -#M40 => #M40
 * @param {string|number} eval_
 * @returns {string|number}
 */
function invert_eval(eval_) {
    if (!isNaN(eval_))
        return -eval_;

    if (!eval_)
        return eval_;

    // here, we have a string
    return (eval_[0] == '-')? eval_.slice(1): `-${eval_}`;
}

/**
 * Mark a ply on a chart
 * @param {string} name
 * @param {number} ply
 * @param {number} max_ply
 */
function mark_ply_chart(name, ply, max_ply) {
    if (!Visible(CacheId(`table-${name}`)))
        return;

    let data, offset,
        chart = charts[name],
        markers = A(`#table-${name} .cmarker`);

    if (ply < max_ply) {
        let invert_wb = (name == 'mobil') * 1,
            id = (name == 'agree')? 0: (ply + invert_wb) & 1,
            dataset = chart.data.datasets[id].data;
        for (let i of [0, 1]) {
            let first = dataset[i];
            if (first) {
                offset = first.ply - i;
                data = dataset[ply - offset];
                break;
            }
        }
    }

    if (data) {
        // speed boost
        let rect = chart.rect;
        if (!rect) {
            rect = chart.canvas.getBoundingClientRect();
            chart.rect = rect;
        }

        let scales = chart.scales,
            x = scales.x_axis_0.getPixelForValue(data.x),
            y = scales.y_axis_0.getPixelForValue(data.y);
        Style(markers[0], [['height', `${rect.height}px`], ['left', `${x - 0.5}px`], ['top', 0], ['width', '1px']]);
        Style(markers[1], [['height', '1px'], ['left', 0], ['top', `${y - 0.5}px`], ['width', `${rect.width}px`]]);
    }
    for (let marker of markers)
        S(marker, data);
}

/**
 * Mark a ply on all charts
 * @param {number} ply
 * @param {number} max_ply
 */
function mark_ply_charts(ply, max_ply) {
    Keys(charts).forEach(key => {
        mark_ply_chart(key, ply, max_ply);
    });
}

/**
 * Create a new chart
 * - an element with id="chart-{name}" must exist
 * @param {string} name
 * @param {boolean} has_legend
 * @param {Function|Object=} y_ticks format_unit, {...}
 * @param {number=} scale 1:log, 2:custom, 4:eval
 * @param {Function=} tooltip_callback
 * @param {Object=} dico
 * @param {number=} number number of axes
 */
function new_chart(name, has_legend, y_ticks, scale, tooltip_callback, dico, number=1) {
    let scales = Y['scales'],
        ticks_dico = {};
    if (y_ticks)
        ticks_dico.callback = y_ticks;

    // eval
    if (BEGIN_ZEROES[name])
        ticks_dico.beginAtZero = true;

    if (scales[name] == undefined)
        scales[name] = scale;
    DEFAULT_SCALES[name] = scale;

    let axis_dico = {
        funcs: set_scale_func(name),
    };

    let defaults = window.ChartDefaults,
        default_scale = defaults.scale,
        options = Assign({}, CHART_OPTIONS, {
        scales: {
            xAxes: [Merge(CHART_X_AXES, default_scale, 0)],
            yAxes: Array(number).fill(0).map((_, id) => Merge(new_y_axis(id, ticks_dico, axis_dico), default_scale, 0)),
        },
    });

    if (has_legend)
        options.legend = Assign({}, CHART_LEGEND);

    if (tooltip_callback)
        options.tooltips = {
            callbacks: {
                label: tooltip_callback,
            },
            mode: 'index',
        };

    if (dico)
        Assign(options, dico);

    window['Chart'] = window.Chart;
    window['ChartDefaults'] = defaults;
    charts[name] = charts[name] || new window.Chart(`chart-${name}`, {
        data: chart_data[name],
        options: options,
        type: 'line',
    });
}

/**
 * Create a dataset
 * - prevents excessive copy/pasting => makes the code a lot shorter!
 * @param {string} label
 * @param {string} color
 * @param {string=} yaxis
 * @param {Object=} dico
 * @returns {Object}
 */
function new_dataset(label, color, yaxis, dico) {
    let dataset = {
        backgroundColor: color,
        borderColor: color,
        data: [],
        fill: false,
        label: translate_expression(label),
        lineTension: Y['graph_tension'],
        pointHitRadius: 4,
        yAxisID: yaxis,
    };

    if (dico)
        Assign(dataset, dico);
    return dataset;
}

/**
 * Create a Y axis
 * @param {number} id 0 for left, 1 for right
 * @param {Object=} y_ticks
 * @param {Object=} dico
 * @returns {Object}
 */
function new_y_axis(id, y_ticks, dico) {
    let y_axis = {
        display: true,
        id: `y_axis_${id}`,
        position: (id == 0)? 'left': 'right',
    };

    if (id == 1)
        y_axis.gridLines = {drawOnChartArea: false};

    if (y_ticks)
        y_axis.ticks = y_ticks;

    if (dico)
        Assign(y_axis, dico);
    return y_axis;
}

/**
 * Redraw eval charts when eval mode has changed
 * @param {string} section
 */
function redraw_eval_charts(section) {
    if (DEV['chart'])
        LS(`REC: ${section}`);
    let board = xboards[section];
    if (!board)
        return;

    let moves = board.moves,
        name = 'eval',
        num_move = moves.length;

    // update existing moves + kibitzer evals (including next move)
    update_player_chart(name, moves);
    update_live_chart(name, xboards['live0'].evals[section], 2);
    update_live_chart(name, xboards['live1'].evals[section], 3);

    // update last received player eval, for the next move
    for (let id of [0, 1]) {
        let move = xboards[`pv${id}`].evals[section][num_move];
        if (move)
            update_live_chart(name, [move], id);
    }
}

/**
 * Reset a chart
 * @param {Object} chart
 * @param {string} name
 */
function reset_chart(chart, name) {
    if (!chart)
        return;

    let data_c = chart.data;
    data_c.labels.length = 0;
    for (let dataset of data_c.datasets)
        dataset.data.length = 0;

    update_chart(name);
}

/**
 * Reset all charts
 * @param {string} section
 * @param {boolean=} reset_evals reset (live + pv) evals as well
 */
function reset_charts(section, reset_evals) {
    first_num = -1;
    Keys(charts).forEach(key => {
        reset_chart(charts[key], key);
    });

    if (reset_evals)
        for (let key of SUB_BOARDS)
            xboards[key].evals[section] = [];
}

/**
 * Scale boom
 * @param {number|undefined} x
 * @returns {number|undefined}
 */
function scale_boom(x) {
    if (x == undefined)
        return undefined;
    return (x >= 0)? 10 * (1 - Exp(-x * 0.25)): -10 * (1 - Exp(x * 0.25));
}

/**
 * Set the y_axis scaling function (not custom)
 * @param {string} name
 * @returns {Array<Function>}
 */
function set_scale_func(name) {
    let funcs = (Y['scales'][name] & 1)? [
        x => x > 0? Log10(x + 1): 0,
        y => y > 0? Pow(10, y) - 1: 0,
    ]: [x => x, y => y];

    let chart = charts[name];
    if (chart) {
        let scale = chart.scales.y_axis_0;
        scale.options.funcs = funcs;
    }
    return funcs;
}

/**
 * Slice charts from a specific index (ply - first_num)
 * @param {number} last_ply
 */
function slice_charts(last_ply) {
    if (isNaN(last_ply))
        return;

    let from = 0,
        to = last_ply - first_num + 2;
    if (DEV['chart'])
        LS(`SC: ${last_ply} - ${first_num} + 2 = ${to}`);

    Keys(charts).forEach(key => {
        let chart = charts[key],
            data_c = chart_data[key];

        if (DEV['chart'] && data_c.labels.length > to)
            LS(`SC:${chart.name} : ${data_c.labels.length} > ${to}`);

        data_c.labels = data_c.labels.slice(from, to);
        for (let dataset of data_c.datasets)
            dataset.data = dataset.data.slice(from, to);

        update_chart(key);
    });
}

/**
 * Update the chart when it has received new data
 * @param {string} name
 */
function update_chart(name) {
    let chart = charts[name];
    if (!chart)
        return;

    let scale = Y['scales'][name];
    if (scale == 0 && name == 'eval')
        update_scale_linear(chart);
    if (scale & 2)
        update_scale_custom(chart);
    else if (scale & 4)
        update_scale_eval(chart);
    else if (scale & 16)
        update_scale_boom(chart);

    if (DEV['chart'])
        LS(`UC: ${name}`);
    chart.update();
}

/**
 * Update chart options
 * @param {string?} name null for all charts
 * @param {number} mode &1:colors, &2:line + font size
 */
function update_chart_options(name, mode) {
    // eval colors
    if (mode & 1) {
        if (!name || name == 'eval') {
            let data = chart_data['eval'];
            if (!data)
                return;
            let datasets = data.datasets;

            for (let id = 0; id < 4; id ++) {
                let color = Y[`graph_color_${id}`];
                Assign(datasets[id], {
                    backgroundColor: color,
                    borderColor: color,
                });
            }

            // + update agree
            let agree = (chart_data['agree'] || {}).datasets;
            if (agree && agree[1]) {
                let mix = mix_hex_colors(Y['graph_color_2'], Y['graph_color_3'], 0.5);
                Assign(agree[1], {
                    backgroundColor: mix,
                    borderColor: mix,
                });
            }
        }
    }

    // line width + update
    Keys(charts).forEach(key => {
        if (name && name != key)
            return;

        let chart = charts[key];
        if (!chart)
            return;

        if (mode & 2) {
            let datasets = chart.data.datasets,
                options = chart.options,
                ratio = chart.canvas.parentNode.clientWidth / 300,
                line_width = Y['graph_line'] * ratio,
                point_radius = Y['graph_radius'] * ratio,
                text_size = Min(Y['graph_text'] * ratio, 16);

            for (let dataset of datasets)
                Assign(dataset, {
                    borderWidth: line_width,
                    lineTension: Y['graph_tension'],
                    pointRadius: dataset.borderDash? 0: point_radius,
                    showLine: line_width > 0,
                });

            // axes
            let scales = options.scales;
            scales.xAxes[0].ticks.fontSize = text_size;
            for (let yaxis of scales.yAxes)
                yaxis.ticks.fontSize = text_size;

            options.legend.labels.fontSize = text_size;
            options.legend.labels.padding = text_size * 0.8;
        }

        chart.update();
    });
}

/**
 * Update a chart from a Live source
 * @param {string} name agree, eval, speed
 * @param {Array<Move>} moves
 * @param {number} id can be: 0=white, 1=black, 2=live0, 3=live1, ...
 */
function update_live_chart(name, moves, id) {
    if (DEV['chart'])
        LS(`ULC: ${name} : ${id}`);
    if (!moves)
        return;
    // live engine is not desired?
    if (id >= 2 && !Y[`live_engine_${id - 1}`])
        return;

    // library hasn't loaded yet => queue
    let data_c = chart_data[name];
    if (!data_c) {
        queued_charts.push([name, moves, id]);
        return;
    }

    let dataset = data_c.datasets[id],
        data = dataset.data,
        is_percent = (Y['graph_eval_mode'] == 'percent'),
        labels = data_c.labels;

    for (let move of moves) {
        if (!move)
            continue;

        let eval_ = move['eval'],
            ply = get_move_ply(move),
            num = ply;
        if (ply < -1)
            continue;

        check_first_num(num);
        let num2 = num - first_num;
        labels[num2] = num / 2 + 1;

        // check update_player_chart to understand
        let dico = {
            'ply': ply,
            x: num / 2 + 1,
        };
        switch (name) {
        case 'agree':
            dico.y = move.agree;
            break;
        case 'eval':
            dico.eval = eval_;
            dico.y = is_percent? calculate_win(id, eval_, ply): clamp_eval(eval_);
            break;
        case 'speed':
            dico.nodes = move['nodes'];
            dico.y = move['nps'];
            break;
        }

        data[num2] = dico;
    }

    fix_labels(labels);
    update_chart(name);
}

/**
 * Update charts from a Live source
 * @param {Array<Move>} moves
 * @param {number} id can be: 0=white, 1=black, 2=live0, 3=live1, ...
 */
function update_live_charts(moves, id) {
    if (DEV['chart'])
        LS(`ULC+: ${id}`);
    Keys(LIVE_GRAPHS).forEach(name => {
        let flag = LIVE_GRAPHS[name];
        if (flag && id >= 2)
            return;
        update_live_chart(name, moves, id);
    });
}

/**
 * Update the marker color+opacity
 */
function update_markers() {
    Style('.cmarker', [['background', Y['marker_color']], ['opacity', Y['marker_opacity']]]);
}

/**
 * Update a player chart using new moves
 * - designed for white & black, not live
 * @param {string} name
 * @param {Array<Move>} moves
 */
function update_player_chart(name, moves) {
    if (DEV['chart'])
        LS(`UPC: ${name}`);
    if (!Visible(CacheId(`table-${name}`)))
        return;

    let data = chart_data[name];
    if (!data)
        return;

    let datasets = data.datasets,
        invert_wb = (name == 'mobil') * 1,
        is_percent = (Y['graph_eval_mode'] == 'percent'),
        labels = data.labels,
        num_move = moves.length,
        offset = 0;

    // 1) skip all book moves
    while (offset < num_move && (!moves[offset] || moves[offset].book))
        offset ++;

    // 2) add data
    for (let i = offset; i < num_move; i ++) {
        let move = moves[i],
            ply = get_move_ply(move),
            num = ply;
        if (ply < -1)
            continue;

        fix_move_format(move);

        check_first_num(num);
        let num2 = num - first_num;
        labels[num2] = num / 2 + 1;

        let dico = {
            'ply': ply,           // used for jumping to the position
            x: num / 2 + 1,     // move number
            },
            id = (ply + invert_wb) & 1;
        if (id < 0)
            continue;

        switch (name) {
        case 'agree':
            id = 0;
            dico.y = move.agree;
            break;
        case 'depth':
            if (!isNaN(move['sd']))
               datasets[2 + (ply & 1)].data[num2] = Assign({y: move['sd']}, dico);
            dico.y = move['d'];
            break;
        case 'eval':
            if (move['wv'] == '-')
                continue;
            dico.eval = move['wv'];
            dico.y = is_percent? calculate_win(id, move['wv'], ply): clamp_eval(move['wv']);
            break;
        case 'mobil':
            if (isNaN(move.mobil))
                continue;
            datasets[2].data[num2] = Assign({y: move.goal? Abs(move.goal[0]): -1}, dico);
            dico.mobil = move.mobil;
            dico.y = Abs(move.mobil);
            break;
        case 'node':
            dico.nodes = move['n'];
            dico.y = move['n'];
            break;
        case 'speed':
            dico.nodes = move['n'];
            dico.y = move['s'];
            break;
        case 'tb':
            dico.y = move['tb'];
            break;
        case 'time':
            datasets[2 + (ply & 1)].data[num2] = Assign({y: move['tl'] / 1000}, dico);
            dico.y = move['mt'] / 1000;
            break;
        }

        if (isNaN(dico.y))
            continue;
        datasets[id].data[num2] = dico;
    }

    fix_labels(labels);
    update_chart(name);
}

/**
 * Update a player charts using new moves
 * - designed for white & black, not live
 * @param {Array<Move>} moves
 */
function update_player_charts(moves) {
    if (DEV['chart'])
        LS('UPC+');
    Keys(charts).forEach(key => {
        update_player_chart(key, moves);
    });
}

/**
 * Update the boom scale
 * f(x) = 10 * (1 - exp(-x * 0.16))
 * g(x) = -ln((10 - x)/10) / 0.16
 * https://www.symbolab.com/solver/function-inverse-calculator
 * @param {Object} chart
 */
function update_scale_boom(chart) {
    let scale = chart.scales.y_axis_0;
    scale.options.funcs = (Y['graph_eval_mode'] == 'percent') ? [
        x => x,
        y => y,
    ]:[
        scale_boom,
        y => (y >= 0)? -Log(1 - y / 10) / 0.25: Log(1 + y / 10) / 0.25,
    ];
}

/**
 * Update the custom scale
 * @param {Object} chart
 */
function update_scale_custom(chart) {
    let scale = chart.scales.y_axis_0;

    // 1) calculate the 2 regions + center
    let datasets = scale.chart.data.datasets,
        data0 = datasets[0].data.filter(item => item != null).map(item => item.y),
        data1 = datasets[1].data.filter(item => item != null).map(item => item.y);
    if (!data0.length || !data1.length)
        return;

    let max0 = Max(...data0),
        max1 = Max(...data1),
        min0 = Min(...data0),
        min1 = Min(...data1),
        name = scale.chart.canvas.id.split('-')[1],
        range = [0, 0, 0, 0];

    if (max0 < min1)
        range = [min0, max0 * 1.1, min1 * 0.9, max1];
    else if (max1 < min0)
        range = [min1, max1 * 1.1, min0 * 0.9, max0];

    // no center?
    if (range[1] >= range[2]) {
        let scales = Y['scales'];
        // auto => choose log if averages are very different
        if (scales[name] & 8) {
            let sum0 = data0.reduce((a, b) => a + b),
                sum1 = data1.reduce((a, b) => a + b),
                delta = Abs((sum0 / (sum0 + sum1) - 0.5));

            if (DEV['chart'])
                LS(`USC: ${sum0} : ${sum1} : ${sum0/sum1} => ${delta}`);
            if (delta > 0.25)
                scales[name] |= 1;
            else
                scales[name] &= ~1;
        }
        set_scale_func(name);
        return;
    }

    // 2) adjust the regions
    // AA ===== BBBBBBBBBBBBBBBBBB
    // => AAAAAAAA ==== BBBBBBBBBB
    let center = (range[0] + range[3]) / 2,
        dest_size = center / 2,
        mult0 = dest_size / (range[1] - range[0]),
        mult1 = dest_size / (range[3] - range[2]),
        offset0 = 0,
        offset1 = range[1] * mult0 - range[2] * mult1,
        range2 = [
            range[0] * mult0 + offset0,
            range[1] * mult0 + offset0,
            range[2] * mult1 + offset1,
            range[3] * mult1 + offset1,
        ],
        middle = (range[1] + range[2]) / 2,
        middle2 = (range2[1] + range2[2]) / 2;

    if (!isNaN(middle)) {
        let div0 = 1 / mult0,
            div1 = 1 / mult1;

        scale.options.funcs = [
            x => !x? 0: (x <= middle)? x * mult0 + offset0: x * mult1 + offset1,
            y => !y? 0: (y <= middle2)? (y - offset0) * div0: (y - offset1) * div1,
        ];
    }
}

/**
 * Update the eval scale
 * f(x) = 12 - 84 / (x + 7)
 * g(x) = -7 * x / (x - 12)
 * https://www.symbolab.com/solver/function-inverse-calculator
 * @param {Object} chart
 */
function update_scale_eval(chart) {
    let scale = chart.scales.y_axis_0;
    scale.options.funcs = (Y['graph_eval_mode'] == 'percent') ? [
        x => x,
        y => y,
    ]:[
        x => (x >= 0)? 12 - 84/(x + 7): -12 - 84/(x - 7),
        y => (y >= 0)? (7 * y)/(-y + 12): (7 * y)/(y + 12),
    ];
}

/**
 * Update the linear scale for the EVAL graph
 * @param {Object} chart
 */
function update_scale_linear(chart) {
    let eval_clamp = Y['graph_eval_clamp'],
        scale = chart.scales.y_axis_0;
    scale.options.funcs = (eval_clamp > 0)? [
        x => Clamp(x, -eval_clamp, eval_clamp),
        y => y,
    ]: [
        x => x,
        y => y,
    ];
}

// STARTUP
//////////

/**
 * Load the chart.js library
 * - it might be bundled already => skip loading in that case
 */
function init_graph() {
    if (DEV['chart'])
        LS('IG');
    create_chart_data();

    add_timeout('graph', () => {
        create_charts();
        update_player_charts(xboards[y_x].moves);
        for (let [name, moves, id] of queued_charts)
            update_live_chart(name, moves, id);

        queued_charts.length = 0;
        update_markers();
        Style('canvas', [['visibility', 'visible']]);
    }, TIMEOUT_graph);
}

/**
 * Startup graphs
 * - initialise global variables
 */
function startup_graph() {
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// <<
if (typeof exports != 'undefined') {
    Assign(exports, {
        calculate_win: calculate_win,
        chart_data: chart_data,
        check_first_num: check_first_num,
        clamp_eval: clamp_eval,
        create_chart_data: create_chart_data,
        fix_labels: fix_labels,
        invert_eval: invert_eval,
        mark_ply_charts: mark_ply_charts,
        reset_charts: reset_charts,
        scale_boom: scale_boom,
        slice_charts: slice_charts,
        SUB_BOARDS: SUB_BOARDS,
        update_live_chart: update_live_chart,
        update_live_charts: update_live_charts,
        update_player_chart: update_player_chart,
        update_player_charts: update_player_charts,
    });
}
// >>
