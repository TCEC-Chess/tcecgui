// Created by Steven Xia  --  Contributed to TCEC

// for testing for the old format because move numbers are not separated from the moves with a space
const NUMBERS = new Array(10);

let n = 10;
while (n--) {
    NUMBERS[n] = String(n);
}


// count the number of occurrences of `count_string` in `string
function count_occurrences(string, count_string) {
    return (string.match(new RegExp(count_string, "g")) || []).length;
}


// get the material balance for a given FEN.
function get_material_from_fen(fen) {
    const material_balance = {};
    const board = fen.split(" ")[0];

    material_balance.p = count_occurrences(board, "P") - count_occurrences(board, "p");
    material_balance.n = count_occurrences(board, "N") - count_occurrences(board, "n");
    material_balance.b = count_occurrences(board, "B") - count_occurrences(board, "b");
    material_balance.r = count_occurrences(board, "R") - count_occurrences(board, "r");
    material_balance.q = count_occurrences(board, "Q") - count_occurrences(board, "q");

    return material_balance;
}


// convert a pv output into a JSON.
var maxpvLength = 3;
function pv_to_json(chess, pv) {
    const moves = [];
    pv = pv.split(" ");

    let move;
    let move_notation;
    let pvLength = 0;

    if (maxpvLength > pv.length)
    {
       pvLength = pv.length;
    }
    else
    {
       pvLength = maxpvLength;
    }
    
    for (let index = 0; index < pvLength; index++) {
        move_notation = pv[index];

        // sloppy because the old format uses the `LAN` move format
        move = chess.move(move_notation, {sloppy: true});

        moves.push({
            "fen": chess.fen(),
            "m": move_notation,
            "from": move.from,
            "to": move.to
        })
    }

    return moves;
}


// get the JSON for a particular move, complete with engine output details parsing
function get_json_for_move(chess, move, details) {
    // create the JSON object
    const json_object = {};

    // remove the braces from the details and split
    details = details.substring(1, details.length - 1).split(",");

    // deal with the `book` option
    json_object.book = details.includes("book");

    // remove `book` if it exists (because we're done with it)
    if (json_object.book) {
        details = details.splice(details.indexOf("book", 1));
    }

    // deal with engine stuff (output details)
    const adjudication_object = {};
    let key_value;
    for (let index = 0; index < details.length; index++) {
        key_value = details[index].trim().split("=");
        switch (key_value[0]) {
            case "mb":  // don't care about this material balance, calculate directly from the FEN
                break;
            case "R50":  // for adjudication
                adjudication_object.FiftyMoves = parseInt(key_value[1]);
                break;
            case "Rd":  // for adjudication
                adjudication_object.Draw = parseInt(key_value[1]);
                break;
            case "Rr":  // for adjudication
                adjudication_object.ResignOrWin = parseInt(key_value[1]);
                break;
            case "pv":
                json_object.pv = {
                    "Moves": pv_to_json(new Chess(chess.fen()), key_value.slice(1).join("")),
                    "San": key_value.slice(1).join("")
                };
                break;
            default:
                json_object[key_value[0]] = key_value[1];
        }
    }

    // only add the adjudication attribute if it is not a book move
    if (!json_object.book) {
        json_object.adjudication = adjudication_object;
    }

    // deal with the actual move
    const move_details = chess.move(move);
    json_object.m = move;
    json_object.from = move_details.from;
    json_object.to = move_details.to;

    // deal with the `fen`
    json_object.fen = chess.fen();

    // deal with material balance
    json_object.material = get_material_from_fen(chess.fen());

    // return the `json_object`
    return json_object;
}


function pgn2json(pgn) {
    // clean up the pgn to remove Windows line endings and excess whitespace
    pgn = pgn.replace(new RegExp("\r", "g"), "");
    pgn = pgn.trim();

    // create the json object to store the data
    const json = {};

    // extract the headers
    const headers = {};

    let inside_header = false;
    let header = null;
    let start_index = 0;
    let char;

    for (let index = 0; index < pgn.length; index++) {
        char = pgn.charAt(index);
        if (!inside_header && char === "[") {
            inside_header = true;
            start_index = index + 1; // skip the current whitespace
        } else if (inside_header && header == null && char === " ") {
            header = pgn.substring(start_index, index);
            start_index = index + 2;  // skip the quote at the start of value.
        } else if (inside_header && header != null && char === "]") {
            headers[header] = pgn.substring(start_index, index - 1);
            inside_header = false;
            header = null;

            if (pgn.charAt(index + 2) !== "[") {  // check if there are more headers
                pgn = pgn.substring(index + 2);
                break;
            }
        }
    }

    json.Headers = headers;

    // handle the engine options
    let engine_details = pgn.substring(pgn.indexOf("{") + 1, pgn.indexOf("}") - 1);  // get rid of the semicolon
    engine_details = engine_details.split(";, ");

    let options_array;
    let key_options;
    let options;
    let name_value;
    for (let options_index = 0; options_index < engine_details.length; options_index++) {
        key_options = engine_details[options_index].split(": ");

        if (key_options.length !== 2) {  // if this is the old format and there are no engine options.
            break;
        }

        options = key_options[1].split("; ");
        options_array = [];
        for (let index = 0; index < options.length; index++) {
            name_value = options[index].split("=");
            options_array.push({
                "Name": name_value[0],
                "Value": name_value[1]
            });
        }
        json[key_options[0]] = options_array;
    }

    pgn = pgn.substring(pgn.indexOf("}") + 2);

    // handle the moves
    const moves = [];

    const chess = new Chess();
    let move;
    let details;
    let first_item;
    let temporary_array;
    while (pgn.indexOf("{") !== -1) {
        // substring is taken for performance, `13` should be the maximum possible length (move number + notation)
        temporary_array = pgn.substring(0, 13).trim().split(" ");
        first_item = temporary_array[0];
        if (first_item.charAt(first_item.length - 1) === ".") {  // checking if there is a move number
            move = temporary_array[1]
        } else {
            move = first_item;
        }

        details = pgn.substring(pgn.indexOf("{"), pgn.indexOf("}") + 1);

        // if this is the old format and there are extra stuff after the moves
        if (move === "1-0" || move === "0-1" || move === "1/2-1/2" || move === "*") {
            break;
        // if this is the old format and move numbers have no succeeding spaces
        } else if (NUMBERS.includes(move.charAt(0))) {
            move = move.split(".")[1];
        }

        moves.push(get_json_for_move(chess, move, details));

        pgn = pgn.substring(pgn.indexOf("}") + 2);  // remove close brace and succeeding whitespace
    }

    json.Moves = moves;

    // return the values
    return JSON.stringify(sort_object(json), null, "\t");
};


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


// // just for debugging and testing ...
// const fs = require("fs");
// const pgn = fs.readFileSync("input.pgn", "utf-8");
//
// const output_json = exports.pgn2json(pgn);
// console.log(output_json);
// fs.writeFileSync("output.json", output_json);
