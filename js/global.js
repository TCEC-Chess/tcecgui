// global.js
// @author octopoulo <polluxyz@gmail.com>
// @version 2020-04-13
//
// global variables/functions shared across multiple js files
//
// included after: common, engine
/*
globals
DEV:true, LS, Y
*/
'use strict';

// modify those values in config.js
let HOST = 'https://tcec-chess.com',
    HOST_ARCHIVE = `${HOST}/archive/json`,
    LINKS = {},
    TIMEOUTS = {
        adblock: 15 * 1000,
        banner: 30 * 1000,
        google_ad: -1,                  // disabled
        graph: 1 * 1000,
        tables: 3 * 1000,
        three: 1 * 1000,                // 3d scene
        twitch: 5 * 1000,
        users: 5 * 1000,
    };

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Extract the 50-move rule counter from a FEN
 * @param {string} fen
 * @returns {number} -2 on error, otherwise >= 0
 */
function extract_fen_rule50(fen) {
    if (!fen)
        return -2;
    let items = fen.split(' '),
        rule50 = items[4] * 1;

    return rule50;
}

/**
 * Extract the ply from a FEN
 * - first move: ply=0 (white has just moved, it's black's turn now)
 * @param {string} fen
 * @returns {number} -2 on error, -1 on the initial position, otherwise >= 0
 */
function extract_fen_ply(fen) {
    if (!fen)
        return -2;
    let items = fen.split(' '),
        ply = (items[5] - 1) * 2 - (items[1] == 'w') * 1;

    return (ply >= -1)? ply: -2;
}

/**
 * Get the move ply, either directly or by looking at the FEN
 * - also update move.ply
 * @param {Move} move
 * @returns {number} ply -2 on error, -1 on the initial position, otherwise >= 0
 */
function get_move_ply(move) {
    if (!move)
        return -2;
    if (move.ply != undefined)
        return move.ply;

    let ply = extract_fen_ply(move.fen);
    if (ply >= -1) {
        move.ply = ply;
        return ply;
    }
    return -2;
}

/**
 * Parse DEV
 */
function parse_dev() {
    let names = {
            a: 'ad',                    // disable ads (for development)
            b: 'board',
            c: 'chart',
            d: 'debug',
            D: 'div',
            e: 'eval',                  // live eval
            f: 'fen',                   // sanity check: FEN vs ply
            g: 'graph',
            i: 'input',                 // gamepad input
            j: 'json',                  // static json files
            l: 'load',
            m: 'mobile',
            n: 'new',                   // new game debugging
            p: 'pv',
            s: 'socket',                // socket messages
            S: 'no_socket',
            T: 'translate',             // gather translations
            u: 'ui',                    // UI events
            y: 'ply',
        },
        text = Y.dev || '';

    DEV = {};
    for (let i = 0, length = text.length; i < length; i ++) {
        let letter = text[i];
        if (letter == 'Z')
            DEV = {};
        else {
            let name = names[letter];
            if (name)
                DEV[name] = 1;
        }
    }

    if (DEV.debug)
        LS(DEV);
}

/**
 * Split a PV string into ply + array of strings
 * @param {string} text
 * @returns {[number, string[]]}
 */
function split_move_string(text) {
    if (!text)
        return [-2, []];

    let items = text.replace(/[.]{2,}/, ' ... ').split(' '),
        ply = (parseInt(items[0]) - 1) * 2 + (items[1] == '...'? 1: 0);
    return [ply, items];
}
