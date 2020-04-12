// created by Steven Xia -- contributed to TCEC ------------------------------------------------------------------------
// todo: try to remove duplicate code for different colors (in `parse_pgn_for_crosstable()`)
// todo: clean up `if` ladder when not sleepy (in `rank_crosstable()`)

// NOTE for integration:
//  - find "COMMENTED!!" and uncomment the commented lines immediately following.
//  - if there are uncommented lines directly after the comment block, comment that out.


// COMMENTED!!
const shlib = require("./lib.js");
const fs = require("fs");
const argv = require('yargs').argv;

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


// define regex for detecting whether an engine crashed or not based on the termination ------------
const NOT_CRASH_REGEX = new RegExp(
    "^(?:TCEC|Syzygy|No result|TB pos|adjudication|in progress|(?:White|Black) mates|Stale|Insuff|Fifty|3-[fF]old)",
    "i"
);


// define other random configuration variables -----------------------------------------------------
const EVENTTABLE_SPLIT_CHARS = " v ";

let engineSeedArray = [];

// parses a pgn string and converts into JSON object------------------------------------------------
function pgn2crosstable(pgn, eventtable=false) {
    // remove annoying Windows line endings... ---------------------------------
    pgn = pgn.replace(new RegExp("\r", "g"), "").trim();

    // for debugging pgn splitter ...
    // console.log((pgn.match(/Event "/g) || []).length);

    if (eventtable) {
        return get_eventtable(pgn);
    }

    // COMMENTED!!
    // pgn = shlib.returnPGN(pgn);
    pgn = splitPgnsString(pgn);

    // create the crosstable ---------------------------------------------------
    const crosstable = init_crosstable();

    // process the PGNs --------------------------------------------------------
    for (let index = 0; index < pgn.length; index++) {
        crosstable.Game += 1;
        parse_pgn_for_crosstable(crosstable, pgn[index]);
    }
    delete crosstable.Game;

    // get the extra information for the crosstable ----------------------------
    get_info(crosstable);

    return crosstable;
}


// called by `pgn2crosstable` if it receives the `eventtable` flag ---------------------------------
function get_eventtable(pgn) {
    pgn = splitPgnsString(pgn);

    // init the event table object ---------------------------------------------
    const eventtable = {
        "EventTable": {},
        "CrossTable": {}
    };

    // parse the pgns for the crosstable and fill in the eventtable accordingly
    const seen_matchups = [];
    let game_info = {};
    let engines_array = [];
    let engines_string = "";
    let pairing_number = 0;
    let pairing_string = "";
    let game_number = 0;
    for (let index = 0; index < pgn.length; index++) {
        game_info = parse_pgn_headers(pgn[index]);
        engines_array = [game_info["White"], game_info["Black"]].sort();
        engines_string = engines_array.join(EVENTTABLE_SPLIT_CHARS);
        if (!seen_matchups.includes(engines_string)) {
            pairing_number += 1;
            pairing_string = String(`Match ${pairing_number}`);
            eventtable.EventTable[pairing_string] = {
                "Engines": engines_string
            };
            eventtable.CrossTable[pairing_string] = init_crosstable();
            seen_matchups.push(engines_string)
        } else {
            pairing_string = String(`Match ${seen_matchups.indexOf(engines_string) + 1}`);
        }
        game_number += 1;
        eventtable.CrossTable[pairing_string].Game = game_number;
        parse_pgn_for_crosstable(eventtable.CrossTable[pairing_string], pgn[index]);
        delete eventtable.CrossTable[pairing_string].Game;
    }

    // get the extra info for all the crosstables ------------------------------
    const pairing_arrays = Object.keys(eventtable.EventTable);
    for (let index = 0; index < pairing_arrays.length; index++) {
        get_info(eventtable.CrossTable[pairing_arrays[index]]);
    }

    // get the extra info for the eventtable from the crosstables --------------
    let engine_eventtable = {};
    let engine_crosstable = {};
    for (let index = 0; index < pairing_arrays.length; index++) {
        pairing_string = pairing_arrays[index];
        engine_eventtable = eventtable.EventTable[pairing_string];
        engine_crosstable = eventtable.CrossTable[pairing_string];
        engines_array = engine_crosstable["Order"];

        engine_eventtable.Winner = engines_array[0];
        engine_eventtable.Runner = engines_array[1];
        engine_eventtable.Games = engine_crosstable.Table[engines_array[0]].Games;
        engine_eventtable.Points = [engine_crosstable.Table[engines_array[0]]["OrigScore"],
            engine_crosstable.Table[engines_array[1]]["OrigScore"]].join("-");
        engine_eventtable.Crashes = [engine_crosstable.Table[engines_array[0]]["Strikes"],
            engine_crosstable.Table[engines_array[1]]["Strikes"]].join("-");
        engine_eventtable.Score = engine_crosstable.Table[engines_array[0]]
            ["Results"][engines_array[1]].Text;

        const games = engine_crosstable.Table[engines_array[0]]["Results"][engines_array[1]]["Scores"];
        const games_number_array = [];
        for (let game_index = 0; game_index < games.length; game_index++) {
            games_number_array.push(games[game_index]["Game"]);
        }
        engine_eventtable.Gamesno = games_number_array.join()
    }

    return eventtable;
}


// creates an empty crosstable object --------------------------------------------------------------
function init_crosstable() {
    return {
        "Event": null,
        "Order": [],
        "Table": {},
        "Game": 0
    };
}


// parses a single PGN for a JSON object -----------------------------------------------------------
function parse_pgn_for_crosstable(crosstable, pgn) {
    // game object to store the data -------------------------------------------
    const game = parse_pgn_headers(pgn);

    if (!game["Time"] && !game["GameDuration"]) {
        console.log("Failed for game:" + JSON.stringify(game));
        return;
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
            "LossesAsBlack": 0,
            "LossesAsWhite": 0,
            // "Neustadtl": null,
            // "Performance": null,
            // "Rank": null,
            "Rating": parseInt(game["WhiteElo"]),
            "Results": {},
            "Score": 0,
            "Strikes": 0,
            "WinsAsBlack": 0,
            "WinsAsWhite": 0
        };
    }

    if (isNaN(crosstable.Table[game["White"]].Rating)) {
        crosstable.Table[game["White"]].Rating = Math.floor(3080 + 41 * Math.random());
    }

    if (!crosstable.Order.includes(game["Black"])) {
        crosstable.Order.push(game["Black"]);
        crosstable.Table[game["Black"]] = {
            // "Abbreviation": null,
            // "Elo": null,
            "Games": 0,
            "GamesAsBlack": 0,
            "GamesAsWhite": 0,
            "LossesAsBlack": 0,
            "LossesAsWhite": 0,
            // "Neustadtl": null,
            // "Performance": null,
            // "Rank": null,
            "Rating": parseInt(game["BlackElo"]),
            "Results": {},
            "Score": 0,
            "Strikes": 0,
            "WinsAsBlack": 0,
            "WinsAsWhite": 0
        };
    }

    if (isNaN(crosstable.Table[game["Black"]].Rating)) {
        crosstable.Table[game["Black"]].Rating = Math.floor(3080 + 41 * Math.random());
    }

    // edit the `white` player's crosstable ------------------------------------
    const white_table = crosstable.Table[game["White"]];

    if (typeof (white_table.Results[game["Black"]]) === "undefined") {
        white_table.Results[game["Black"]] = {
            "H2h": 0,
            "Scores": [],
            "Text": ""
        }
    }

    white_table.Results[game["Black"]].Scores.push({
        "Game": crosstable.Game,
        "Result": RESULT_LOOKUP[game["Result"]],
        "Winner": WINNER_LOOKUP[game["Result"]],
        "Side": "White"
    });

    white_table.Results[game["Black"]].H2h += RESULT_LOOKUP[game["Result"]];
    white_table.Results[game["Black"]].Text += TEXT_LOOKUP[RESULT_LOOKUP[game["Result"]]];

    // edit the `black` player's crosstable ------------------------------------
    const black_table = crosstable.Table[game["Black"]];

    if (typeof (black_table.Results[game["White"]]) === "undefined") {
        black_table.Results[game["White"]] = {
            "H2h": 0,
            "Scores": [],
            "Text": ""
        }
    }

    black_table.Results[game["White"]].Scores.push({
        "Game": crosstable.Game,
        "Result": 1 - RESULT_LOOKUP[game["Result"]],
        "Winner": WINNER_LOOKUP[game["Result"]],
        "Side": "Black"
    });

    black_table.Results[game["White"]].H2h += 1 - RESULT_LOOKUP[game["Result"]];
    black_table.Results[game["White"]].Text += TEXT_LOOKUP[1 - RESULT_LOOKUP[game["Result"]]];

    // add to `Strikes` if needed ----------------------------------------------
    if (!game["TerminationDetails"]) {
        if (game["Termination"]) {
            game["TerminationDetails"] = game["Termination"];
        }
    }

    try {
        if (!game["TerminationDetails"].match(NOT_CRASH_REGEX)) {
            if (RESULT_LOOKUP[game["Result"]] === 1) {
                crosstable.Table[game["Black"]].Strikes += 1;
            } else if (RESULT_LOOKUP[game["Result"]] === 0) {
                crosstable.Table[game["White"]].Strikes += 1;
            } else {
                crosstable.Table[game["White"]].Strikes += 1;
                crosstable.Table[game["Black"]].Strikes += 1;
            }
        }
    } catch (err) {
        console.log("Failed for game:" + JSON.stringify(game) + " ,Errro is :" + err);
    }
}


// parse the headers for info ----------------------------------------------
function parse_pgn_headers(pgn) {
    const game = {};

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

    return game;
}

function getWinner(engine_table)
{
   let mWinner = -1;
   let otherScore = engine_table.Games - engine_table.Score;
   let maxScore = 0;
   let minDiff = 0;

   if (engine_table.Score > otherScore)
   {
      maxScore = engine_table.Score;
   }
   else
   {
      maxScore = otherScore;
   }

   if (maxScore <= 4)
   {
       return mWinner;
   }

   if (engine_table.Games % 2 == 0)
   {
      minDiff = 1;
   }
   else
   {
      minDiff = 1.5;
   }

   let maxDiff = Math.abs(engine_table.Score - otherScore);
   if (maxDiff >= minDiff)
   {
      mWinner = 1;
      console.log ("getWinner is :" + mWinner + " ,maxDiff:" + maxDiff + " , minDiff:" + minDiff + " ,engine_table.Score:" + engine_table.Score + " ,otherScore:" + otherScore);
   }

   return mWinner;
}

function getLead(engine_table)
{
    let mLead = -1;
    if (engine_table.MWinner >= 0)
    {
       return mLead;
    }
    
    if (engine_table.OrigScore > (engine_table.Games/2))
    {
        mLead = 1;
    }
    else if (engine_table.OrigScore < (engine_table.Games/2))
    {
        mLead = 0;
    }

    return mLead;
}

// process the score and games info ----------------------------------------------------------------
function get_score_and_games(crosstable, engine, ignore_engines=[]) {
    const engine_table = crosstable.Table[engine];

    let opponent;
    let opponent_table;
    let score = 0;
    let keys = Object.keys(engine_table.Results);
    for (let opponent_index = 0; opponent_index < keys.length; opponent_index++) {
        opponent = keys[opponent_index];

        if (ignore_engines.includes(opponent)) {
            continue;
        }

        opponent_table = engine_table.Results[opponent].Scores;
        for (let index = 0; index < opponent_table.length; index++) {
            if (opponent_table[index].Side === "White") {
                engine_table.GamesAsWhite += 1;
            } else {
                engine_table.GamesAsBlack += 1;
            }

            engine_table.Games += 1;
            score += opponent_table[index].Result;

            if (opponent_table[index].Result === 1) {
                if (opponent_table[index].Winner === "White") {
                    engine_table.WinsAsWhite += 1;
                } else {
                    engine_table.WinsAsBlack += 1;
                }
            } else if (opponent_table[index].Result === 0) {
                if (opponent_table[index].Winner === "White") {
                    engine_table.LossesAsBlack += 1;
                } else {
                    engine_table.LossesAsWhite += 1;
                }
            }
        }
    }

    engine_table.Score = score;
    engine_table.OrigScore = score;
    engine_table.MWinner = getWinner(engine_table);
    if (engine_table.MWinner < 0)
    {
       engine_table.Score = 0;
    }
    engine_table.Mlead = getLead(engine_table);
}


// process the extra info for a particular engine --------------------------------------------------
function get_extra_info(crosstable, engine, ignore_engines=[]) {
    const engine_table = crosstable.Table[engine];

    // find performance --------------------------------------------------------
    engine_table.Performance = 100 * engine_table.Score / engine_table.Games;

    // find Neustadtl (Sonneborn–Berger) score ---------------------------------
    let neustadtl_score = 0;
    let opponent;
    let opponent_score;
    let keys = Object.keys(engine_table.Results);
    for (let opponent_index = 0; opponent_index < keys.length; opponent_index++) {
        opponent = keys[opponent_index];

        if (ignore_engines.includes(opponent)) {
            continue;
        }

        opponent_score = crosstable.Table[opponent].Score;
        for (let index = 0; index < engine_table.Results[opponent].Scores.length; index++) {
            neustadtl_score += engine_table.Results[opponent].Scores[index].Result * opponent_score;
        }
    }
    engine_table.Neustadtl = neustadtl_score;

    // todo: finish this ... (calculate "Elo")  <-- possibly not needed?
}


// get the rankings of all the engines and sort `crosstable.Order` ---------------------------------
// the logic in this function is absolutely horrendous
function rank_crosstable(crosstable, dq_strikes=99999) {
    const compare_function = function (engine1_name, engine2_name) {
        const engine1_data = crosstable.Table[engine1_name];
        const engine2_data = crosstable.Table[engine2_name];

        const engine1_wins = engine1_data.WinsAsWhite + engine1_data.WinsAsBlack;
        const engine2_wins = engine2_data.WinsAsWhite + engine2_data.WinsAsBlack;

        if (engine1_data.Strikes >= dq_strikes && engine2_data.Strikes < dq_strikes) {
            return 1;
        } else if (engine1_data.Strikes < dq_strikes && engine2_data.Strikes >= dq_strikes) {
            return -1;
        } else if (engine1_data.Score === engine2_data.Score) {
            if (engine1_data.Strikes !== engine2_data.Strikes) {
                return engine1_data.Strikes - engine2_data.Strikes;
            } else if (engine1_data["Results"][engine2_name]["H2h"] !== engine2_data["Results"][engine1_name]["H2h"]) {
                return engine2_data["Results"][engine1_name]["H2h"] - engine1_data["Results"][engine2_name]["H2h"];
            } else if (engine1_wins !== engine2_wins) {
                return engine2_wins - engine1_wins;
            } else if (engine1_data.WinsAsBlack !== engine2_data.WinsAsBlack) {
                return engine2_data.WinsAsBlack - engine1_data.WinsAsBlack
            } else {
                return engine2_data.Neustadtl - engine1_data.Neustadtl;
            }
        } else {
            return engine2_data.Score - engine1_data.Score;
        }
    };

    crosstable.Order = crosstable.Order.sort(compare_function);

    for (let index = 0; index < crosstable.Order.length; index++) {
        crosstable.Table[crosstable.Order[index]].Rank = index + 1;
    }
}


// remove the engines that have been disqualified due to crashes
function eliminateEngines(original_crosstable, max_strikes=3) {
    // copy the crosstable to leave original "as is" ---------------------------
    const crosstable = JSON.parse(JSON.stringify(original_crosstable));
    // const crosstable = original_crosstable;

    // reset data --------------------------------------------------------------
    let engine_table;
    for (let index = 0; index < crosstable.Order.length; index++) {
        engine_table = crosstable.Table[crosstable.Order[index]];
        engine_table.Games = 0;
        engine_table.GamesAsWhite = 0;
        engine_table.GamesAsBlack = 0;
        engine_table.WinsAsWhite = 0;
        engine_table.WinsAsBlack = 0;
        engine_table.LossesAsWhite = 0;
        engine_table.LossesAsBlack = 0;
        engine_table.Score = 0;
    }

    // get eliminated engines --------------------------------------------------
    const eliminated_engines = [];
    let engine_name;
    for (let index = 0; index < crosstable.Order.length; index++) {
        engine_name = crosstable.Order[index];
        if (crosstable.Table[engine_name].Strikes >= max_strikes) {
            eliminated_engines.push(engine_name);
        }
    }

    // calculate the scores (before other extra info) --------------------------
    for (let index = 0; index < crosstable.Order.length; index++) {
        get_score_and_games(crosstable, crosstable.Order[index], eliminated_engines);
    }

    // calculate the extra info ------------------------------------------------
    for (let index = 0; index < crosstable.Order.length; index++) {
        get_extra_info(crosstable, crosstable.Order[index], eliminated_engines);
    }

    // rank the engines --------------------------------------------------------
    rank_crosstable(crosstable, max_strikes);
}

// get the abbreviations of the engines ------------------------------------------------------------
function get_abbreviations(crosstable) {
    let abb = [];
    for (let i = 0; i < crosstable.Order.length; i++) {
        let cur = crosstable.Order[i];
        let abbrev = cur.substring(0, 2);
        for (let j = 2; abb.indexOf(abbrev) !== -1 && j < cur.length; j++) {
            abbrev = cur.charAt(0) + cur.charAt(j);
        }
        crosstable.Table[cur].Abbreviation = abbrev;
        abb.push(abbrev);
    }
}


// get all the extra data for a `crosstable` object ------------------------------------------------
function get_info(crosstable) {
    // calculate the scores (before other extra info) --------------------------
    for (let index = 0; index < crosstable.Order.length; index++) {
        get_score_and_games(crosstable, crosstable.Order[index]);
    }

    // calculate the extra info ------------------------------------------------
    for (let index = 0; index < crosstable.Order.length; index++) {
        get_extra_info(crosstable, crosstable.Order[index]);
    }

    // rank the engines --------------------------------------------------------
    rank_crosstable(crosstable);

    // get the abbreviations for the engines -----------------------------------
    get_abbreviations(crosstable);

    // return the crosstable ---------------------------------------------------
    return crosstable;
}


// copied from https://alpha.tcecbeta.club/dist/js/pgnutil.js ----------------------------------------------------------
// edited the regex slightly to account for unfinished game (whenever game ended with "*")
function splitPgnsString(text) {
    let arr = text.split(/((?:1-0|1\/2-1\/2|0-1|\*)\n\n)/);
    let res = [];
    let j = 0;
    for (let i = 0; i < arr.length; i = i + 2) {
        res[j++] = arr[i] + arr[i + 1];
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

            // Uncomment for removing the extra `Side` attribute that I created
            // to count the games per side that I didn't actually need because
            // it was already done in the gui... :/ that's dabad.
            // if (key === "Side") {
            //     continue
            // }

            if (typeof object[key] === "object") {
                sorted_object[key] = sort_object(object[key]);
            } else {
                sorted_object[key] = object[key];
            }
        }

        return sorted_object;
    }
}

function getMatchPair(object)
{
    let array = [];
    for (let index = 0; index < object.Order.length; index++) {
        let key = object.Order[index];
        if (object.Table.hasOwnProperty(key)) {
            let entry = 
            {
                "name" : key,
                "winner": object.Table[key].MWinner,
                "score": object.Table[key].Score,
                "flag": getShortEngineName(key)
            }
            array.push(entry);
            engineSeedArray.push(key);
        }
    }
    return array;
}

function getLeadScore(object)
{
    if (object.MWinner > -1)
    {
        return -1;
    }
    return object.OrigScore;
}

function getMatchResPair(object)
{
    let array = [];
    for (let index = 0; index < object.Order.length; index++) {
        let key = object.Order[index];
        if (object.Table.hasOwnProperty(key)) {
            let entry = 
            {
                "name" : key,
                "lead": object.Table[key].Mlead,
                "score": getLeadScore(object.Table[key]),
                "manual": 0,
                "origscore": object.Table[key].OrigScore
            }
            array.push(entry);
        }
    }
    return array;
}

function getResultPair(object)
{
    let array = [];
    let order = -1;
    for (let index = 0; index < object.Order.length; index++) {
        let key = object.Order[index];
        if (object.Table.hasOwnProperty(key)) {
            if (engineSeedArray.indexOf(key) > order)
            {
                array.push(object.Table[key].Score);
            }
            else
            {
                array.splice(0, 0, object.Table[key].Score);
            }
            order = engineSeedArray.indexOf(key);
        }
    }
    return array;
}

 let results = [
 [[0,0, "empty-bye"], [0,0], [0,0], [0,0], [0,0], [0,0], [0,0], [0,0], [0,0, "arun"], [0,0], [0,0], [0,0], [0,0], [0,0], [0,0], [0,0, "last"]],
 [[0,0, "arun"], [0,0], [0,0], [0,0], [0,0], [0,0], [0,0], [0,0]],                                                                                                                                    
 [[0,0], [0,0], [0,0], [0,0]],                                                                                                                                                                        
 [[0,0], [0,0]],                                                                                                                                                                                      
 [[0,0],                                                                                                                                                                                              
  [0,0]]                                                                                                                                                                                              
 ]  
function generateResult(output_json)
{
    let object = output_json.CrossTable;
    let teamArray = [];
    let resultArray = [];
    let index = 0;
    let totalMatches = 0;
    let matchResArray = [];

    for (let key in object) {
        if (object.hasOwnProperty(key)) {
            console.log(key + " -> " + object[key]);
            if (totalMatches < 16)
            {
               teamArray.push(getMatchPair(object[key]));
               results[0][totalMatches] = getResultPair(object[key]);
               matchResArray.push(getMatchResPair(object[key])); 
            }
            else if (totalMatches < 24)
            {
               results[1][totalMatches-16] = getResultPair(object[key]);
               matchResArray.push(getMatchResPair(object[key])); 
            }
            else if (totalMatches < 28)
            {
               results[2][totalMatches-24] = getResultPair(object[key]);
               matchResArray.push(getMatchResPair(object[key])); 
            }
            else if (totalMatches < 30)
            {
               results[3][totalMatches-28] = getResultPair(object[key]);
               matchResArray.push(getMatchResPair(object[key])); 
            }
            else if (totalMatches == 30)
            {
               results[4][1] = getResultPair(object[key]);
               matchResArray.push([0,0]);
               matchResArray.push(getMatchResPair(object[key])); 
            }
            else if (totalMatches == 31)
            {
               results[4][0] = getResultPair(object[key]);
               matchResArray.splice(matchResArray.length-2, 1, getMatchResPair(object[key]));
            }
            totalMatches = totalMatches + 1;
            if ((totalMatches == 16) ||
                (totalMatches == 24) ||
                (totalMatches == 28) ||
                (totalMatches == 30) ||
                (totalMatches == 32))
            {
                resultArray = [];
            }
        }
    }
    output_json.teams = teamArray;
    output_json.matchresults = matchResArray;
    output_json.results = [];
    output_json.results.push(results);
    //console.log ("Results is :" + JSON.stringify(results, null, '\t'));
}

function getShortEngineName(engine)                                                                                                                                                                   
{                                                                                                                                                                                                     
   let name = engine;                                                                                                                                                                                 
   if (engine.match(/Baron/))                                                                                                                                                                         
   {                                                                                                                                                                                                  
      return 'Baron';                                                                                                                                                                                 
   }                                                                                                                                                                                                  
   else if (engine.indexOf(' ') > 0)                                                                                                                                                                  
   {                                                                                                                                                                                                  
      name = engine.substring(0, engine.indexOf(' '));                                                                                                                                                
   }                                                                                                                                                                                                  
   return name;                                                                                                                                                                                       
}                                                                                                                                                                                                     

// COMMENTED!!
let filename = argv.tag;
let seasonFileName = argv.filename;
let pgnPath = '/var/www/json/archive/';
let seasonFileNameFull = pgnPath + seasonFileName;
const pgn = fs.readFileSync(seasonFileNameFull, "utf-8");
let crossName = filename + '_' + 'Eventcrosstable.cjson';

if (argv.outfile != undefined)
{
   crossName = argv.outfile + '_' + 'Eventcrosstable.cjson';
}

let output_json = pgn2crosstable(pgn, eventtable=true);
generateResult(output_json);
// let output_json = sort_object(pgn2crosstable(pgn, eventtable=true));
fs.writeFileSync(crossName, JSON.stringify(output_json, null, "\t"));
