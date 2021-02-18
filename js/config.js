// config.js
// @author octopoulo <polluxyz@gmail.com>
// @version 2021-02-09
//
// Ideally, only this file needs modification from an administrator.
// If other files need to be modified, then contact me, and I will reengineer the system a bit.
//
// included after: common, engine, global, 3d, xboard, game, network, startup
// (after everything except script.js)
// jshint -W069
/*
globals
AD_STYLES, Assign, CHAMPIONS:true, DEFAULTS, ENGINE_FEATURES, ENGINE_NAMES:true, HOST:true,
HOST_ARCHIVE:true, LINKS:true, THEMES:true, TWITCH_CHANNEL:true, TWITCH_CHAT:true
*/
'use strict';

/**
 * Override settings here
 * - first features are the ones that are changed the most frequently
 */
function startup_config() {
    HOST = 'https://tcec-chess.com';
    HOST_ARCHIVE = 'archive/json';

    // 2 & 3 = live engines
    ENGINE_NAMES = ['White', 'Black', '7{Blue}', '7{Red}'];

    // use Assign to append new NN engines here, by default: AllieStein & LCZero
    // - & 1 => NN engine
    // - & 2 => Leela variations
    Assign(ENGINE_FEATURES, {
        'LCZeroCPU': 3,
        'LCZeroCPU3pct': 3,
    });

    // first theme is always the default theme => don't change it
    THEMES = ['light', 'dark', 'sea'];

    // modify default values
    Assign(DEFAULTS, {
    });

    // navigation links
    // the URL will be: HOST/path, except if it starts with 'http', '.' or '/'
    LINKS = {
        'articles': {
            '_ext': '.pdf',
            'Super Final 19 by GM Sadler.pdf': 'articles/Sufi_19_-_Sadler.pdf',
            'Super Final 18 by GM Sadler.pdf': 'articles/Sufi_18_-_Sadler.pdf',
            'Super Final 17 by GM Sadler.pdf': 'articles/Sufi_17_-_Sadler.pdf',
            'Super Final 16 by GM Sadler.pdf': 'articles/Sufi_16_-_Sadler.pdf',
            'Super Final 15 by GM Sadler.pdf': 'articles/Sufi_15_-_Sadler.pdf',
            'Super Final 14 by GM Sadler.pdf': 'articles/Sufi_14_-_Sadler.pdf',
            // separator
            'a': 0,
            // grid of 2 columns
            '_a1': 2,
            'TCEC_20.pdf': 'articles/TCEC_20.pdf',
            'TCEC_19.pdf': 'articles/TCEC_19.pdf',
            'TCEC_18.pdf': 'articles/TCEC_18.pdf',
            'TCEC_17.pdf': 'articles/TCEC_17.pdf',
            'TCEC_16.pdf': 'articles/TCEC_16.pdf',
            'TCEC_15.pdf': 'articles/TCEC_15.pdf',
            'TCEC_14.pdf': 'articles/TCEC_14.pdf',
            'TCEC_13.pdf': 'articles/TCEC_13.pdf',
            'TCEC_12.pdf': 'articles/TCEC_12.pdf',
            'TCEC_11.pdf': 'articles/TCEC_11.pdf',
            'TCEC_10.pdf': 'articles/TCEC_10.pdf',
            // end the grid
            '_a2': 0,
            // again
            'b': 0,
            '_b1': 2,
            'TCEC_Cup_7.pdf': 'http://tcec-chess.com/articles/TCEC_Cup_7.pdf',
            'TCEC_Cup_6.pdf': 'http://tcec-chess.com/articles/TCEC_Cup_6.pdf',
            'TCEC_Cup_5.pdf': 'http://tcec-chess.com/articles/TCEC_Cup_5.pdf',
            'TCEC_Cup_4.pdf': 'http://tcec-chess.com/articles/TCEC_Cup_4.pdf',
            'TCEC_Cup_3.pdf': 'http://tcec-chess.com/articles/TCEC_Cup_3.pdf',
            'TCEC_Cup_2.pdf': 'http://tcec-chess.com/articles/TCEC_Cup_2.pdf',
            'TCEC_Cup_1.pdf': 'http://tcec-chess.com/articles/TCEC_Cup_1.pdf',
            '_b2': 0,
        },
        'download': {
            'Crosstable': 'crosstable.json',
            'Schedule': 'schedule.json',
            'Event PGN': 'evalbotelo/archive.pgn',
            'Current PGN': 'evalbotelo/live.pgn',
            '{Load PGN} ...': '',
        },
        'info': {
            'About': '',
            'Rules': 'https://wiki.chessdom.org/Rules',
            'Book FAQ': 'articles/TCEC_Openings_FAQ.html',
            'a': 0,
            'Coverage': 'https://wiki.chessdom.org/Category:Coverage',
            'Notable games': 'https://wiki.chessdom.org/Category:Notable_game',
        },
    };

    // season champions
    CHAMPIONS = [
        '20|Stockfish',
        '19|Stockfish',
        '18|Stockfish',
        '17|LCZero',
        '16|Stockfish',
        '15|LCZero',
        '14|Stockfish',
        '13|Stockfish',
        '12|Stockfish',
        '11|Stockfish',
        '10|Komodo',
        '9|Stockfish',
        '8|Komodo',
        '7|Komodo',
        '6|Stockfish',
        '5|Komodo',
        '4|Houdini',
        '3|-',
        '2|Houdini',
        '1|Houdini',
    ];

    // override style for the ads
    // - the top ad=0, middle ad=1
    // - the container has a 550px max width, so if you want more px, the width should be specified in px
    Assign(AD_STYLES, {
        0: 'width:100%;height:250px',
        1: 'width:100%;height:320px',
    });

    TWITCH_CHANNEL = 'https://player.twitch.tv/?channel=TCEC_Chess_TV&parent=tcec-chess.com';
    TWITCH_CHAT = 'https://www.twitch.tv/embed/TCEC_Chess_TV/chat?parent=tcec-chess.com';

    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // POST PROCESS - don't modify
    //////////////////////////////

    // clean up some mistakes
    DEFAULTS['theme'] = THEMES[0];
    HOST = HOST.replace(/\/$/, '');
    HOST_ARCHIVE = HOST_ARCHIVE.replace(/\/$/, '');
}
