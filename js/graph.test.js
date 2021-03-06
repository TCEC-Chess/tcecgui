// graph.test.js
// @author octopoulo <polluxyz@gmail.com>
// @version 2021-01-10
//
/*
globals
expect, global, require, test,
*/
'use strict';

let {Assign, Keys} = require('./common.js'),
    {Y} = require('./engine.js'),
    {
        calculate_win, chart_data, check_first_num, clamp_eval, fix_labels, invert_eval, scale_boom,
    } = require('./graph.js');

global.xboards = {
    live: {
        players: [{}, {}, {}, {}],
    },
};

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// calculate_win
[
    [0, '', -1, 0],
    [0, NaN, -1, 100],
    [0, Infinity, -1, 100],
    [0, -5.2, -1, -90.5],
    [0, -19, -1, -100],
    [0, 3.14, -1, 71.8],
    [0, 0.27, -1, 7.8],
    [1, 0.27, -1, 6],
    [3, 0.27, -1, 18.6],
    [5, 0.27, -1, 13.7],
    [9, 0.27, -1, 8.9],
    [0, 10.05, -1, 99.4],
    [0, '3.14', -1, 71.8],
    [0, '-3.14', -1, -71.8],
    [0, '-something', -1, -100],
    [0, 'something', -1, 100],
    [0, 'M#33', -1, 100],
    [0, '-M#33', -1, -100],
    [0, '#18', -1, 100],
    [0, '#-18', -1, -100],
].forEach(([feature, eval_, ply, answer], id) => {
    test(`calculate_win:${id}`, () => {
        Y.s = 'live';
        global.xboards.live.players[0].feature = feature;
        expect(calculate_win(0, eval_, ply)).toEqual(answer);
    });
});

// check_first_num
[
    [
        12,
        8,
        [
            [5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10, 10.5, 11, 11.5, 12, 12.5, 13, 13.5, 14, 14.5],
            [
                undefined,
                undefined,
                undefined,
                undefined,
                {x: 7, ply: 12, eval: '0.31', y: 0.31},
                undefined,
                {x: 8, ply: 14, eval: '0.35', y: 0.35},
                undefined,
                {x: 9, ply: 16, eval: '0.59', y: 0.59},
                undefined,
                {x: 10, ply: 18, eval: '0.42', y: 0.42},
                undefined,
                {x: 11, ply: 20, eval: '0.63', y: 0.63},
                undefined,
                {x: 12, ply: 22, eval: '0.46', y: 0.46},
                undefined,
                {x: 13, ply: 24, eval: '0.48', y: 0.48},
                undefined,
                {x: 14, ply: 26, eval: '0.70', y: 0.7},
            ],
        ],
    ],
].forEach(([first_num, num, answer], id) => {
    test(`check_first_num:${id}`, () => {
        check_first_num(first_num);

        Assign(chart_data, {
            eval: {
                datasets: [{data: []}, {data: []}, {data: []}, {data: []}],
                labels: [7, 7.5, 8, 8.5, 9, 9.5, 10, 10.5, 11, 11.5, 12, 12.5, 13, 13.5, 14, 14.5],
            },
        });

        let data = chart_data.eval.datasets[0].data,
            dico = {
                0: {x: 7, ply: 12, eval: '0.31', y: 0.31},
                2: {x: 8, ply: 14, eval: '0.35', y: 0.35},
                4: {x: 9, ply: 16, eval: '0.59', y: 0.59},
                6: {x: 10, ply: 18, eval: '0.42', y: 0.42},
                8: {x: 11, ply: 20, eval: '0.63', y: 0.63},
                10: {x: 12, ply: 22, eval: '0.46', y: 0.46},
                12: {x: 13, ply: 24, eval: '0.48', y: 0.48},
                14: {x: 14, ply: 26, eval: '0.70', y: 0.7},
            };

        Keys(dico).forEach(key => {
            data[key] = dico[key];
        });

        check_first_num(num);
        expect(chart_data.eval.labels).toEqual(answer[0]);
        expect(chart_data.eval.datasets[0].data).toEqual(answer[1]);
    });
});

// clamp_eval
[
    [undefined, undefined],
    [null, undefined],
    ['', undefined],
    ['-', undefined],
    ['book', undefined],
    [NaN, 128],
    [Infinity, 128],
    [-Infinity, -128],
    [-5.2, -5.2],
    [-19, -19],
    [3.14, 3.14],
    [10.05, 10.05],
    [128, 128],
    [256, 256],
    ['3.14', 3.14],
    ['-3.14', -3.14],
    ['-something', -128],
    ['something', 128],
    ['M#33', 128],
    ['-M#33', -128],
    ['#18', 128],
    ['#-18', -128],
    ['M19', 128],
    ['-M19', -128],
].forEach(([eval_, answer], id) => {
    test(`clamp_eval:${id}`, () => {
        expect(clamp_eval(eval_)).toEqual(answer);
    });
});

// fix_labels
[
    [[7, 8, 9, undefined, undefined, 12], [7, 8, 9, 10, 11, 12]],
    [[undefined, 10, 11], [9, 10, 11]],
    [[undefined, undefined, 11], [9, 10, 11]],
    [[undefined, 10, undefined], [undefined, 10, undefined]],
].forEach(([labels, answer], id) => {
    test(`fix_labels:${id}`, () => {
        fix_labels(labels);
        expect(labels).toEqual(answer);
    });
});

// invert_eval
[
    ['', -0],
    [NaN, NaN],
    [Infinity, -Infinity],
    [-5.2, 5.2],
    [-19, 19],
    ['3.14', -3.14],
    ['-3.14', 3.14],
    ['-something', 'something'],
    ['something', '-something'],
    ['M#33', '-M#33'],
    ['-M#33', 'M#33'],
].forEach(([eval_, answer], id) => {
    test(`invert_eval:${id}`, () => {
        expect(invert_eval(eval_)).toEqual(answer);
    });
});

// scale_boom
[
    [undefined, undefined],
    [null, undefined],
    ['', undefined],
    ['-', undefined],
    ['book', undefined],
    [0, 0],
    [1, 2.211992169285951],
    [2, 3.9346934028736658],
    [3, 5.276334472589853],
    [4, 6.321205588285577],
    [5, 7.1349520313980985],
    [6, 7.768698398515702],
    [7, 8.262260565495549],
    [8, 8.646647167633873],
    [9, 8.946007754381357],
    [10, 9.179150013761012],
    [15, 9.764822541439909],
    [50, 9.99996273346828],
    ['M19', 9.999999999999874],
    ['-M19', -9.999999999999874],
    [Infinity, 9.999999999999874],
    [-Infinity, -9.999999999999874],
    ['hello', 9.999999999999874],
    ['-hello', -9.999999999999874],
    [255, 10],
    [-255, -10],
    [-15, -9.764822541439909],
    [-1, -2.211992169285951],
].forEach(([x, answer], id) => {
    test(`scale_boom:${id}`, () => {
        let clamp = clamp_eval(x),
            result = scale_boom(clamp);
        if (isNaN(result))
            expect(result).toEqual(answer);
        else
            expect(result).toBeCloseTo(answer, 5);
    });
});
