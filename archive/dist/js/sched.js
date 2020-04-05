const Chess = require("./chess.js");
const fs = require("fs");                                                                                                                                                                                                                     

let neededFields = [
   "Black",
   "White",
   "GameDuration",
   "ECO",
   "Round",
   "Result",
   "Termination",
   "TerminationDetails",
   "PlyCount",
   "GameStartTime",
   "Date",
   "Opening",
   "Variation"
]

let headerRegex = /(?:\[(\w+) "(.*?)"\]([\s\S]*))/;
let moveRegex = /^(?:(?:[0-9]{1,4}\. )?([^ ]{2,6}))/;
let evalRegex = /(?:(?:wv|ev)=(-?M?[0-9\.]+),)/;
let match ="";

 function multiPgnToJson(pgnString,generateFens) {
   //Split into [headers1,moves1,headers2,moves2, ... ] array
   separated = pgnString.split(/\r\n\r\n/);
   let result = [];
//var promises = [];
   for (let i = 1; i < separated.length; i += 2) {
      console.log ("doing for :" + separated[i-1]);
      result.push(parsePgnToScheduleFormat(separated[i-1],separated[i],generateFens));
   }
   console.log (result);
   return result;
}
 function parsePgnToScheduleFormat(headerString,moveString,generateFens) {
   let data = {};
   match = headerString.match(headerRegex);
   while (match != null) { // For each header in the PGN
      if (neededFields.indexOf(match[1]) > -1) {
         data[match[1]] = match[2];
      }
      match = match[3].match(headerRegex);
   }
   
   let result = createKnownHeaders(data);
   
   addFenAndEvaluation(result,moveString,generateFens);
   return result;
}

 function createKnownHeaders(data) {
   let result = {};
   result.Black = data.Black;
   result.White = data.White;
   result.Duration = data.GameDuration;
   result.ECO = data.ECO;
   result.Game = ~~data.Round; // ~~"2.1" = 2, means Turn String to number and Floor 
   // parseInt("142") +1 = 143, 143/2 = 76.5, ~~76.5 = 76
   // parseInt("143") +1 = 144, 144/2 = 77, ~~77 = 77
   result.Moves = ~~((parseInt(data.PlyCount)+1) /2);// ~~ 3 times as quick as "Math.floor", same function
   result.Opening = data.Opening + (data.Variation ?  ", " + data.Variation : ""); // add variation if exists
   result.Result = data.Result;
   // PGN FORMAT 2019-02-23T23:54:32.001
   // JSON FORM  23:54:32 on 2019-02-23 
   result.Start = data.GameStartTime != null && data.GameStartTime.length > 19 ?
      data.GameStartTime.substr(11,8) + " on " + data.GameStartTime.substr(0,10) :
      data.Date;
   result.Termination = data.TerminationDetails || data.Termination;
   return result;
}  

function addFenAndEvaluation(result,moveString,generateFens) {
   let moves = moveString.split(/\}[ \r\n\t]+/);
   let chess = new Chess.Chess();
   try {
      if (generateFens) {
         chess.load_pgn(moveString);
         result.FinalFen = chess.fen();
      }
      
      //if starts with a number, for example 31. then it is a white move
      let score = moves.length-1
      if (moves[score].length > 9) {
         result.Duration = moves[score].substr(moves[score].indexOf("Duration = ") +11, 8);
      }
      let hasWhiteLastMove = /^[0-9]{1,3}\./.test(moves[score-1]);
      let lastMoveEval =  evalRegex.test(moves[score-1]) ?  moves[score-1].match(evalRegex)[1] : moves[score-3].match(evalRegex)[1];
      let secondLastMoveEval =  evalRegex.test(moves[score-2]) ?  moves[score-2].match(evalRegex)[1] : moves[score-4].match(evalRegex)[1];
      
      result.WhiteEv = hasWhiteLastMove ? lastMoveEval : secondLastMoveEval;
      result.BlackEv = hasWhiteLastMove ? secondLastMoveEval : lastMoveEval;
   }
   catch(err) {
      result.WhiteEv = "?"
      result.BlackEv = "?"
   }
   
   return result;
}

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

const pgn = fs.readFileSync("input.pgn", "utf-8"); 
var result = multiPgnToJson(pgn, 0);
console.log (result);
