const fs = require("fs");
const shlib = require("./lib.js");                                                                                                                                                                                                                     

// todo: try to remove duplicate code for different colors (in `parse_pgn_for_crosstable()`)
// todo: deal with `Strikes` in crosstable.Table["engine"]

// define the result, winner and text lookup tables ------------------------------------------------
const RESULT_LOOKUP = {
    "1-0": 1,
    "0-1": 0,
    "1/2-1/2": 0.5
};

const WINNER_LOOKUP = {
    "1-0": "White",
    "0-1": "Black",
    "1/2-1/2": "None"
};

const TEXT_LOOKUP = {
    1: "1",
    0: "0",
    0.5: "="
};


// parses event.pgn and converts into crosstable.json ----------------------------------------------
function pgn2crosstable(pgn) {
    // remove annoying Windows line engines... ---------------------------------
    pgn = pgn.replace(new RegExp("\r", "g"), "").trim();
    pgn = shlib.returnPGN(pgn);

    // create the crosstable ---------------------------------------------------
    const crosstable = {
        "Event": null,
        "Order": [],
        "Table": {},
        "Game": 1
    };

    // process the PGNs --------------------------------------------------------
    for (let index = 0; index < pgn.length; index++) {
        parse_pgn_for_crosstable(crosstable, pgn[index]);
        crosstable.Game += 1;
    }

    delete crosstable.Game;

    // calculate the extra info ------------------------------------------------
    for (let index = 0; index < crosstable.Order.length; index++) {
        get_extra_info(crosstable, crosstable.Order[index]);
    }

    // rank the engines --------------------------------------------------------
    rank_crosstable(crosstable);

    // get the abbreviations for the engines -----------------------------------
    get_abbreviations(crosstable);

    // return the crosstable ---------------------------------------------------
    return JSON.stringify(sort_object(crosstable), null, "\t");
}


// parses a single PGN for crosstable.json ---------------------------------------------------------
function parse_pgn_for_crosstable(crosstable, pgn) {
    // game object to store the data -------------------------------------------
    const game = {};

    // parse the headers for info ----------------------------------------------
    let inside_header = false;
    let header = null;
    let start_index = 0;
    let char;

    for (let index = 0; index < pgn.length; index++) {
        char = pgn.charAt(index);
        if (!inside_header && char === "[") {
            inside_header = true;
            start_index = index + 1;  // skip the current whitespace
        } else if (inside_header && header == null && char === " ") {
            header = pgn.substring(start_index, index);
            start_index = index + 2;  // skip the quote at the start of value.
        } else if (inside_header && header != null && char === "]") {
            game[header] = pgn.substring(start_index, index - 1);
            inside_header = false;
            header = null;

            if (pgn.charAt(index + 2) !== "[") {  // check if there are more headers
                pgn = pgn.substring(index + 2);
                break;
            }
        }
    }

    // fill in values that haven't been filled in yet --------------------------
    if (crosstable.Event == null) {
        crosstable.Event = game.Event;
    }

    if (!crosstable.Order.includes(game["White"])) {
        crosstable.Order.push(game["White"]);
        crosstable.Table[game["White"]] = {
            // "Abbreviation": null,
            // "Elo": null,
            "Games": 0,
            "GamesAsBlack": 0,
            "GamesAsWhite": 0,
            // "Neustadtl": null,
            // "Performance": null,
            // "Rank": null,
            "Rating": parseInt(game["WhiteElo"]),
            "Results": {},
            "Score": 0,
            // "Strikes": null,
            "WinsAsBlack": 0,
            "WinsAsWhite": 0
        };
    }

    if (!crosstable.Order.includes(game["Black"])) {
        crosstable.Order.push(game["Black"]);
        crosstable.Table[game["Black"]] = {
            // "Abbreviation": null,
            // "Elo": null,
            "Games": 0,
            "GamesAsBlack": 0,
            "GamesAsWhite": 0,
            // "Neustadtl": null,
            // "Performance": null,
            // "Rank": null,
            "Rating": parseInt(game["BlackElo"]),
            "Results": {},
            "Score": 0,
            // "Strikes": null,
            "WinsAsBlack": 0,
            "WinsAsWhite": 0
        };
    }

    // edit the `white` player's crosstable ------------------------------------
    const white_table = crosstable.Table[game["White"]];
    white_table.Games ++;
    white_table.GamesAsWhite ++;

    if (typeof(white_table.Results[game["Black"]]) === "undefined") {
        white_table.Results[game["Black"]] = {
            "Scores": [],
            "Text": ""
        }
    }

    white_table.Results[game["Black"]].Scores.push({
        "Game": crosstable.Game,
        "Result": RESULT_LOOKUP[game["Result"]],
        "Winner": WINNER_LOOKUP[game["Result"]]
    });

    white_table.Results[game["Black"]].Text += TEXT_LOOKUP[RESULT_LOOKUP[game["Result"]]];
    white_table.Score += RESULT_LOOKUP[game["Result"]];

    if (RESULT_LOOKUP[game["Result"]] === 1) {
        white_table.WinsAsWhite ++ ;
    }

    // edit the `black` player's crosstable ------------------------------------
    const black_table = crosstable.Table[game["Black"]];
    black_table.Games ++;
    black_table.GamesAsBlack ++;

    if (typeof(black_table.Results[game["White"]]) === "undefined") {
        black_table.Results[game["White"]] = {
            "Scores": [],
            "Text": ""
        }
    }

    black_table.Results[game["White"]].Scores.push({
        "Game": crosstable.Game,
        "Result": 1 - RESULT_LOOKUP[game["Result"]],
        "Winner": WINNER_LOOKUP[game["Result"]]
    });

    black_table.Results[game["White"]].Text += TEXT_LOOKUP[1 - RESULT_LOOKUP[game["Result"]]];
    black_table.Score += 1 - RESULT_LOOKUP[game["Result"]];

    if (1 - RESULT_LOOKUP[game["Result"]] === 1) {
        black_table.WinsAsBlack ++ ;
    }

    // todo: add `Strikes` counter here ...
}


// process the extra info for a particular engine, ex: elo -----------------------------------------
function get_extra_info(crosstable, engine) {
    // find performance --------------------------------------------------------
    const engine_table = crosstable.Table[engine];
    engine_table.Performance = 100 * engine_table.Score / engine_table.Games;

    // find Neustadtl (Sonneborn–Berger) score ---------------------------------
    let neustadtl_score = 0;
    let keys = Object.keys(engine_table.Results);
    let opponent;
    let opponent_score;
    for (let opponent_index = 0; opponent_index < keys.length; opponent_index++) {
        opponent = keys[opponent_index];
        opponent_score = crosstable.Table[opponent].Score;
        for (let index = 0; index < engine_table.Results[opponent].Scores.length; index++) {
            neustadtl_score += engine_table.Results[opponent].Scores[index].Result * opponent_score;
        }
    }
    engine_table.Neustadtl = neustadtl_score;

    // todo: finish this ... (calculate "Elo")
}


// get the rankings of all the engines and sort `crosstable.Order` ---------------------------------
function rank_crosstable(crosstable) {
    const compare_function = function (engine1, engine2) {
        if (crosstable.Table[engine1].Score === crosstable.Table[engine2].Score) {
            return crosstable.Table[engine2].Neustadtl - crosstable.Table[engine1].Neustadtl;
        } else {
            return crosstable.Table[engine2].Score - crosstable.Table[engine1].Score;
        }
    };

    crosstable.Order = crosstable.Order.sort(compare_function);

    for (let index = 0; index < crosstable.Order.length; index++) {
        crosstable.Table[crosstable.Order[index]].Rank = index + 1;
    }
}


// get the abbreviations of the engines ------------------------------------------------------------
function get_abbreviations_old(crosstable) {
   //console.log ("Cross is :" + JSON.stringify(crosstable));
    for (let index = 0; index < crosstable.Order.length; index++) {
        crosstable.Table[crosstable.Order[index]].Abbreviation = crosstable.Order[index].substring(0, 2);
    }

    // todo: make a better abbreviations generator ...
}

function get_abbreviations(crosstable) {
        let abb =[];
        for (let i = 0; i < crosstable.Order.length; i++) {
            let cur = crosstable.Order[i];
            let abrev = cur.substring(0, 2);
            for (let j = 2; abb.indexOf(abrev) != -1 && j < cur.length; j++) {
                abrev = cur.charAt(0) + cur.charAt(j);
            }
            crosstable.Table[cur].Abbreviation = abrev;
            abb.push(abrev);
        }
    }

var abb = [];
function get_abbreviations_worked(crosstable)
{
   for (let i = 0; i < crosstable.Order.length; i++)
   {
      let n = 1;
      var abbrev = '';
      var abrev1 = crosstable.Order[i].substring(0, 1);
      var abrev2 = crosstable.Order[i].substring(1, 2);
      abbrev = abrev1 + abrev2;
      for (let j = 0 ; j < abb.length ; j++)
      {
         if (abb.indexOf(abbrev) != -1)
         {
            abrev2 = crosstable.Order[i].substring((n+1), (n+2));
            abbrev = abrev1 + abrev2;
            n = n + 1;
         }
         else
         {
            break;
         }
      }
      crosstable.Table[crosstable.Order[i]].Abbreviation = abbrev;
      abb[i] = abbrev;
   }
}
// copied from https://alpha.tcecbeta.club/dist/js/pgnutil.js ----------------------------------------------------------
function splitPgnsString(text) {
    let arr = text.split(/((?:1-0|1\/2-1\/2|0-1)\n\n)/);
    let res = [];
    let j = 0;
    for (let i= 0; i < arr.length; i = i+2) {
        res[j++] = arr[i] + arr[i+1];
    }
    return res;
}


// copied from `pgn2json.js` -------------------------------------------------------------------------------------------
// sort an object (only to better compare it in testing, it's fast enough to keep in the final code though)
function sort_object(object) {
    if (Array.isArray(object)) {
        for (let index = 0; index < object.length; index++) {
            if (typeof object[index] === "object") {
                object[index] = sort_object(object[index]);
            } else {
                object[index] = object[index];
            }
        }

        return object;
    } else {
        const sorted_object = {};

        const keys = Object.keys(object).sort();
        let key;
        for (let index = 0; index < keys.length; index++) {
            key = keys[index];
            if (typeof object[key] === "object") {
                sorted_object[key] = sort_object(object[key]);
            } else {
                sorted_object[key] = object[key];
            }
        }

        return sorted_object;
    }
}

var argvv = [];

process.argv.forEach(function (val, index, array) 
{
   console.log(index + ': ' + val);
   argvv [index] = val;
});

var filenameI = argvv [2];
var filename = argvv[3];
var force = argvv[4];

if (force == undefined || force == 'undefined')
{
   force = 0;
}

var pgnPath = '/var/www/json/archive/';
var filenameII = pgnPath + filenameI;
const pgn = fs.readFileSync(filenameII, "utf-8");
filename = filename + '_' + 'Crosstable.cjson';

if (force || !fs.existsSync(filename))
{
   console.log ("Converting file:" + filename);
   const output_json = pgn2crosstable(pgn);
   fs.writeFileSync(filename,  output_json);
}
console.log ("done Converting file:" + filename);
const output_json = pgn2crosstable(pgn);
