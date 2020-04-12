const Chess = require("chess.js");
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
var pgnHeaderTagRegExp = /\[\s*(\w+)\s*"([^"]*)"\s*\]/;
var pgnHeaderTagRegExpGlobal = /\[\s*(\w+)\s*"([^"]*)"\s*\]/g;
var pgnHeaderBlockRegExp = /\s*(\[\s*\w+\s*"[^"]*"\s*\]\s*)+/;
var emptyPgnHeader = '[Event ""]\n[Site ""]\n[Date ""]\n[Round ""]\n[White ""]\n[Black ""]\n[Result ""]\n';
var pgnGame = [];
var pgnHeader = [];

function simpleHtmlentities(text) 
{
   return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

function multiPgnToJson(pgnGame, generateFens) 
{
   let result = [];

   for (let i = 0; i < pgnGame.length; i++)
   {
      var pgnResult = parsePgnToScheduleFormat(pgnHeader[i], pgnGame[i], generateFens, (i+1));
      result.push(pgnResult);
   }
   return JSON.stringify(result);
}

 function multiPgnToJsonOld(pgnString,generateFens) {
   //Split into [headers1,moves1,headers2,moves2, ... ] array
   separated = pgnString.split(/\r?\n\r?\n/);
   let result = [];
//var promises = [];
   for (let i = 1; i < separated.length; i += 2) {
      result.push(parsePgnToScheduleFormat(separated[i-1],separated[i],generateFens));
   }
   return JSON.stringify(result, null, "\t"); 
}

function parsePgnToScheduleFormat(headerString,moveString,generateFens, gameno) 
{
   let data = {};
   match = headerString.match(headerRegex);
   while (match != null) 
   {
      if (neededFields.indexOf(match[1]) > -1) 
      {
         data[match[1]] = match[2];
      }
      match = match[3].match(headerRegex);
   }

   let result = createKnownHeaders(data);

   try 
   {
      addFenAndEvaluation(result,moveString,generateFens, gameno);
   }
   catch (err)
   {
   }
   return result;
}

function createKnownHeaders(data) 
{
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

function addFenAndEvaluation(result,moveString,generateFens, gameno) 
{
   let movefail = moveString;
   let moves = moveString.split(/\}[ \r\n\t]+/);
   let chess = new Chess.Chess();
   result.worked = 0;
   try 
   {
      if (generateFens) 
      {
         chess.load_pgn(moveString);
         result.FinalFen = chess.fen();
      }

      //if starts with a number, for example 31. then it is a white move
      let score = moves.length-1
      if (moves[score].length > 9) 
      {
         result.Duration = moves[score].substr(moves[score].indexOf("Duration = ") +11, 8);
      }
      let hasWhiteLastMove = /^[0-9]{1,3}\./.test(moves[score-1]);
      let lastMoveEval =  evalRegex.test(moves[score-1]) ?  moves[score-1].match(evalRegex)[1] : moves[score-3].match(evalRegex)[1];
      let secondLastMoveEval =  evalRegex.test(moves[score-2]) ?  moves[score-2].match(evalRegex)[1] : moves[score-4].match(evalRegex)[1];

      result.WhiteEv = hasWhiteLastMove ? lastMoveEval : secondLastMoveEval;
      result.BlackEv = hasWhiteLastMove ? secondLastMoveEval : lastMoveEval;
      result.worked = 1;
   }
   catch(err) 
   {
      console.log ("Xrror in game:" + gameno + " ,error:" + err + " movestring:" + JSON.stringify(result) + " ," + movefail);
      result.WhiteEv = "?"
      result.BlackEv = "?"
   }

   return result;
}

function simpleHtmlentitiesDecode(text) 
{
   return text.replace(/&gt;/g, ">").replace(/&lt;/g, "<").replace(/&amp;/g, "&")
}

function fixCommonPgnMistakes(text) 
{
   text = text.replace(/[\u00A0\u180E\u2000-\u200A\u202F\u205F\u3000]/g, " ");
   text = text.replace(/\u00BD/g, "1/2");
   text = text.replace(/[\u2010-\u2015]/g, "-");
   text = text.replace(/\u2024/g, ".");
   text = text.replace(/[\u2025-\u2026]/g, "...");
   text = text.replace(/\\"/g, "'");
   return text
}

function pgnGameFromPgnText(pgnText)
{   
   var headMatch, prevHead, newHead, startNew, afterNew, lastOpen, checkedGame, validHead;
   pgnText = simpleHtmlentities(fixCommonPgnMistakes(pgnText));

   pgnText = pgnText.replace(/(^|\n)%.*(\n|$)/g, "\n");
   numberOfGames = 0;
   checkedGame = "";
   while (headMatch = pgnHeaderBlockRegExp.exec(pgnText)) 
   {
      newHead = headMatch[0];
      startNew = pgnText.indexOf(newHead);
      afterNew = startNew + newHead.length;
      if (prevHead) 
      { 
         checkedGame += pgnText.slice(0, startNew);
         validHead = ((lastOpen = checkedGame.lastIndexOf("{")) < 0) || (checkedGame.lastIndexOf("}")) > lastOpen;
         if (validHead) 
         {
            pgnHeader[numberOfGames] = prevHead;
            pgnGame[numberOfGames++] = checkedGame;
            checkedGame = ""
         } 
         else 
         {
            checkedGame += newHead
         }
      } 
      else 
      {
         validHead = !0
      }
      if (validHead) 
      {
         prevHead = newHead
      }
      pgnText = pgnText.slice(afterNew)
   }
   if (prevHead) 
   {
      pgnHeader[numberOfGames] = prevHead;
      checkedGame += pgnText;
      pgnGame[numberOfGames++] = checkedGame
   }
   return (numberOfGames > 0)
}

function returnPGN(pgnText, generateFens, reqdLength)
{
   var pgnFull = [];
   var j = 0;
   pgnGameFromPgnText(pgnText);

   if ((reqdLength == undefined) || (!reqdLength))
   {
      reqdLength = pgnGame.length;
   }
   var length = Math.min(reqdLength, pgnGame.length);

   console.log ("returnPGN: For length:" + length + " ,reqdLength:" + reqdLength);

   for (let i = 0; i < length; i++)
   {
      var pgnResult = parsePgnToScheduleFormat(pgnHeader[i], pgnGame[i], generateFens, (i+1));
      pgnFull [j] = pgnHeader[i] + pgnGame[i];
      j++;
   }
   return pgnFull;
}

exports.returnPGN = returnPGN;                                                                                                                                                                        
exports.multiPgnToJson = multiPgnToJson;
exports.pgn2schedule = multiPgnToJson;
exports.multiPgnToJsonOld = multiPgnToJsonOld;
