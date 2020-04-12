var InitLoad;
var ClockCount;
var PVCount;
var PVCount2;
var NewClockGame;
var SoundCount;
var NewSoundGame;
var GameMovesA;
var evalchart;
var timechart;
var depthchart;
var speedchart;
var tablebasechart;
var evalchartdataFound;
var evalchartdata;
var timechartdataFound;
var timechartdata;
var depthchartdataFound;
var depthchartdata;
var speedchartdataFound;
var speedchartdata;
var tablebasechartdataFound;
var tablebasechartdata;
var flipped;
var IsRotated;
var totalGames = 0;
var newPgnUrl;
var newGameNum;
var localGameNum;
var Sea;
var Mat;
var Tou;
var Sta;
var Div;
var Sup;
var Eli;
var currentPage = window.location.pathname.split('/').pop();
var hostName = window.location.hostname;
"use strict";
var pgn4web_version = '';
var pgn4web_project_url = "http://pgn4web.casaschi.net";
var pgn4web_project_author = "Paolo Casaschi";
var pgn4web_project_email;
if (typeof(pgn4web_project_email) == "undefined") {
    pgn4web_project_email = "pgn4web@casaschi.net"
}
var helpWin;
var CurrentVar = -1;
var lastVarWithNoMoves;
var numberOfVars;
var MovesVar;
var MoveCommentsVar;
var GameHasComments;
var GameHasVariations;
var StartPlyVar;
var PlyNumberVar;
var CurrentVarStack;
var PlyNumberStack;
var PredecessorsVars;

/* ylcet fix archives */
var webUrlArch = "./archive.html";
var webUrlCurr = "./";
var ctable;
var lastMovefile = "lastmove.txt";
var stable;
var engineArray = [];
var jsSeasonInt = 0;
var finalInt = 0;
var playOffInt = 0;
var kver = 0;
var moves = new Array();
var pvfile = "tlcv_file_new2.txt";
/* end of archives */

/* ylcet eval */
var minEval     = 6.5;
var minMoveswin = 8;
/* end eval */

/* chessgui */
var currGamechessgui = 0;
/* end chess */

var knownHeight = 0;

function displayHelp(section) {
    if (helpWin && !helpWin.closed) {
        helpWin.close()
    }
    helpWin = window.open(detectHelpLocation() + (section ? "?" + section : ""), "pgn4web_help", "resizable=yes,scrollbars=yes,toolbar=no,location=no,menubar=no,status=no");
    if (helpWin && window.focus) {
        helpWin.focus()
    }
}

function customFunctionOnPgnTextLoad() {}

function customFunctionOnPgnGameLoad() {}

function customFunctionOnMove() {}

function customFunctionOnAlert(msg) {}

function customFunctionOnCheckLiveBroadcastStatus() {}

function customPgnHeaderTag(customTag, htmlElementId, gameNum) {
    var matches, tag = "";
    customTag = customTag.replace(/\W+/g, "");
    if (gameNum === undefined) {
        gameNum = currentGame
    }
    if ((pgnHeader[gameNum]) && (matches = pgnHeader[gameNum].match('\\[\\s*' + customTag + '\\s*\"([^\"]+)\"\\s*\\]'))) {
        tag = matches[1]
    }
    if (htmlElementId) {
        var theObj = document.getElementById(htmlElementId);
        if ((theObj) && (typeof(theObj.innerHTML) == "string")) {
            theObj.innerHTML = tag
        }
    }
    return tag
}

function customPgnCommentTag(customTag, htmlElementId, plyNum, varId) {
    var matches, tag = "",
        theObj;
    customTag = customTag.replace(/\W+/g, "");
    if (typeof(varId) == "undefined") {
        varId = 0
    }
    if (typeof(plyNum) == "undefined") {
        plyNum = CurrentPly
    }
    if ((MoveCommentsVar[varId][plyNum]) && (matches = MoveCommentsVar[varId][plyNum].match('\\[%' + customTag + '\\s+((?:,?(?:"[^"]*"|[^,\\]]*))*)\\s*\\]'))) {
        tag = matches[1].replace(/\s+$/, "")
    }
    if ((htmlElementId) && (theObj = document.getElementById(htmlElementId)) && (typeof(theObj.innerHTML) == "string")) {
        theObj.innerHTML = tag
    }
    return tag
}

function simpleAddEvent(obj, evt, cbk) {
    if (obj.addEventListener) {
        obj.addEventListener(evt, cbk, !1)
    } else if (obj.attachEvent) {
        obj.attachEvent("on" + evt, cbk)
    }
}
simpleAddEvent(document, "keydown", pgn4web_handleKey_event);
simpleAddEvent(window, "load", pgn4web_onload_event);

function pgn4web_onload_event(e) {
    pgn4web_onload(e)
}

function pgn4web_onload(e) {
    start_pgn4web()
}

function start_pgn4web() {
    if (alertFirstResetLoadingPgn) {
        alertFirstResetLoadingPgn = !1
    } else {
        resetAlert()
    }
    InitImages();
    createBoard();
    if (LiveBroadcastDelay > 0) {
        restartLiveBroadcastTimeout()
    }
    pgn4web_initTouchEvents()
}
var alertLog;
var alertLast;
var alertNum;
var alertNumSinceReset;
var fatalErrorNumSinceReset;
var alertPromptInterval = null;
var alertPromptOn = !1;
var alertFirstResetLoadingPgn = !0;
resetAlert();

function resetAlert() {
    alertLog = new Array(5);
    alertLast = alertLog.length - 1;
    alertNum = alertNumSinceReset = fatalErrorNumSinceReset = 0;
    stopAlertPrompt();
    if (!alertFirstResetLoadingPgn) {
        if (boardIsDefault(debugShortcutSquare)) {
            boardShortcut(debugShortcutSquare, "pgn4web v" + pgn4web_version + " debug info", null, !0)
        }
    }
}

function setEnginePv() {
    //////console.log ("who's move is it " + whiteToMove);
    var divTemp = null;

    if (CurrentPly == 1) {
        divTemp = document.getElementById('white_pv');
        divTemp.innerHTML = "book";
        divTemp = document.getElementById('black_pv');
        divTemp.innerHTML = "book";
    } else if (CurrentPly == StartPlyVar[CurrentVar] + PlyNumberVar[CurrentVar] &&
        !isArchiveFile()) {
            //////console.log ("inside false:" + CurrentPly);
        if (!whiteToMove) {
            divTemp = document.getElementById('white_pv');
            if (moves[CurrentPly]) {
                //////console.log ("inside falsex1:" + CurrentPly);
                divTemp.innerHTML = moves[CurrentPly];
            }
            divTemp = document.getElementById('black_pv');
            if (moves[CurrentPly + 1]) {
                //////console.log ("inside falsex2:" + CurrentPly);
                divTemp.innerHTML = moves[CurrentPly + 1];
            }
        } else {
            divTemp = document.getElementById('black_pv');
            if (moves[CurrentPly]) {
                //////console.log ("inside falsex1:" + CurrentPly);
                divTemp.innerHTML = moves[CurrentPly];
            }
            divTemp = document.getElementById('white_pv');
            if (moves[CurrentPly + 1]) {
                //////console.log ("inside falsex2:" + CurrentPly);
                divTemp.innerHTML = moves[CurrentPly + 1];
            }
        }
    } else {
        if (!whiteToMove) {
            divTemp = document.getElementById('white_pv');
            //////console.log ("inside true:" + CurrentPly);
            if (moves[CurrentPly]) {
                divTemp.innerHTML = moves[CurrentPly];
            } else {
                divTemp.innerHTML = "no infos";
            }
            divTemp = document.getElementById('black_pv');
            if (moves[CurrentPly - 1]) {
                divTemp.innerHTML = moves[CurrentPly - 1];
            } else {
                divTemp.innerHTML = "no infos2";
            }
        } else {
            divTemp = document.getElementById('black_pv');
            if (moves[CurrentPly]) {
                divTemp.innerHTML = moves[CurrentPly];
            } else {
                divTemp.innerHTML = "no infos3";
            }
            divTemp = document.getElementById('white_pv');
            if (moves[CurrentPly - 1]) {
                divTemp.innerHTML = moves[CurrentPly - 1];
            } else {
                divTemp.innerHTML = "no infos4";
            }
        }
    }
}

function myAlert(msg, fatalError, doNotPrompt) {
    alertNum++;
    alertNumSinceReset++;
    if (fatalError) {
        fatalErrorNumSinceReset++
    }
    alertLast = (alertLast + 1) % alertLog.length;
    alertLog[alertLast] = msg + "\n" + (new Date()).toLocaleString();
    if (boardIsDefault(debugShortcutSquare)) {
        boardShortcut(debugShortcutSquare, "pgn4web v" + pgn4web_version + " debug info, " + alertNum + " alert" + (alertNum > 1 ? "s" : ""), null, !0)
    }
    if ((!doNotPrompt) && ((LiveBroadcastDelay === 0) || (LiveBroadcastAlert === !0)) && (boardIsDefault(debugShortcutSquare))) {
        startAlertPrompt()
    }
    customFunctionOnAlert(msg)
}

function startAlertPrompt() {
    if (alertPromptOn) {
        return
    }
    if (alertPromptInterval) {
        clearTimeout(alertPromptInterval)
    }
    alertPromptInterval = setTimeout("alertPromptTick(true);", 500)
}

function stopAlertPrompt() {
    if (alertPromptInterval) {
        clearTimeout(alertPromptInterval);
        alertPromptInterval = null
    }
    if (alertPromptOn) {
        alertPromptTick(!1)
    }
}

function alertPromptTick(restart) {
    if (alertPromptInterval) {
        clearTimeout(alertPromptInterval);
        alertPromptInterval = null
    }
    var colRow = colRowFromSquare(debugShortcutSquare);
    if (!colRow) {
        return
    }
    var alertPromptDelay = 1500;
    var theObj = document.getElementById('tcol' + colRow.col + 'trow' + colRow.row);
    if (theObj) {
        if (alertPromptOn) {
            if ((highlightOption) && ((colFromHighlighted === 0 && rowFromHighlighted === 7) || (colToHighlighted === 0 && rowToHighlighted === 7))) {
                theObj.className = 'highlightWhiteSquare'
            } else {
                theObj.className = 'whiteSquare'
            }
        } else {
            theObj.className = 'blackSquare'
        }
        alertPromptOn = !alertPromptOn;
        if (alertPromptOn) {
            alertPromptDelay = 500
        } else {
            alertPromptDelay = 3000
        }
    }
    if (restart) {
        alertPromptInterval = setTimeout("alertPromptTick(true);", alertPromptDelay)
    }
}

function stopEvProp(e) {
    e.cancelBubble = !0;
    if (e.stopPropagation) {
        e.stopPropagation()
    }
    if (e.preventDefault) {
        e.preventDefault()
    }
    return !1
}
var shortcutKeysWereEnabled = !1;

function disableShortcutKeysAndStoreStatus() {
    if ((shortcutKeysWereEnabled = shortcutKeysEnabled) === !0) {
        SetShortcutKeysEnabled(!1)
    }
}

function restoreShortcutKeysStatus() {
    if (shortcutKeysWereEnabled === !0) {
        SetShortcutKeysEnabled(!0)
    }
    shortcutKeysWereEnabled = !1
}

function customShortcutKey_Shift_0() {}

function customShortcutKey_Shift_1() {}

function customShortcutKey_Shift_2() {}

function customShortcutKey_Shift_3() {}

function customShortcutKey_Shift_4() {}

function customShortcutKey_Shift_5() {}

function customShortcutKey_Shift_6() {}

function customShortcutKey_Shift_7() {}

function customShortcutKey_Shift_8() {}

function customShortcutKey_Shift_9() {}

function pgn4web_handleKey_event(e) {
    pgn4web_handleKey(e)
}
var shortcutKeysEnabled = !1;

function pgn4web_handleKey(e) {
    var keycode, oldPly, oldVar, colRow, colRowList;
    if (!e) {
        e = window.event
    }
    keycode = e.keyCode;
    if (e.altKey || e.ctrlKey || e.metaKey) {
        return !0
    }
    if (!shortcutKeysEnabled && !(keycode == 27 && e.shiftKey)) {
        return !0
    }
    switch (keycode) {
        case 8:
        case 9:
        case 16:
        case 17:
        case 18:
        case 32:
        case 33:
        case 34:
        case 35:
        case 36:
        case 92:
        case 93:
        case 188:
            return !0;
        case 27:
            if (e.shiftKey) {
                interactivelyToggleShortcutKeys()
            } else {
                displayHelp()
            }
            break;
        case 189:
            if (colRowList = prompt("Enter shortcut square coordinates to click:", "")) {
                colRowList = colRowList.toUpperCase().replace(/[^A-Z0-9]/g, "");
                while (colRow = colRowFromSquare(colRowList)) {
                    boardOnClick[colRow.col][colRow.row]({
                        "id": "img_tcol" + colRow.col + "trow" + colRow.row
                    }, e);
                    colRowList = colRowList.substr(2)
                }
            }
            break;
        case 90:
            if (e.shiftKey) {
                window.open(pgn4web_project_url)
            } else {
                displayDebugInfo()
            }
            break;
        case 37:
        case 74:
            backButton(e);
            break;
        case 38:
        case 72:
            startButton(e);
            break;
        case 39:
        case 75:
            forwardButton(e);
            break;
        case 40:
        case 76:
            endButton(e);
            break;
        case 73:
            MoveToPrevComment(e.shiftKey);
            break;
        case 79:
            MoveToNextComment(e.shiftKey);
            break;
        case 190:
            if (e.shiftKey) {
                goToFirstChild()
            } else {
                goToNextVariationSibling()
            }
            break;
        case 85:
            if (e.shiftKey) {
                undoStackRedo()
            } else {
                undoStackUndo()
            }
            break;
        case 45:
            undoStackRedo();
            break;
        case 46:
            undoStackUndo();
            break;
        case 83:
            if (e.shiftKey) {
                searchPgnGame("")
            } else {
                searchPgnGamePrompt()
            }
            break;
        case 13:
            if (e.shiftKey) {
                searchPgnGame(lastSearchPgnExpression, !0)
            } else {
                searchPgnGame(lastSearchPgnExpression)
            }
            break;
        case 68:
            if (e.shiftKey) {
                displayFenData()
            } else {
                displayPgnData(!0)
            }
            break;
        case 187:
            SwitchAutoPlay();
            break;
        case 65:
            GoToMove(CurrentPly + 1);
            SetAutoPlay(!0);
            break;
        case 48:
            if (e.shiftKey) {
                customShortcutKey_Shift_0()
            } else {
                SetAutoPlay(!1)
            }
            break;
        case 49:
            if (e.shiftKey) {
                customShortcutKey_Shift_1()
            } else {
                SetAutoplayDelayAndStart(1 * 1000)
            }
            break;
        case 50:
            if (e.shiftKey) {
                customShortcutKey_Shift_2()
            } else {
                SetAutoplayDelayAndStart(2 * 1000)
            }
            break;
        case 51:
            if (e.shiftKey) {
                customShortcutKey_Shift_3()
            } else {
                SetAutoplayDelayAndStart(3 * 1000)
            }
            break;
        case 52:
            if (e.shiftKey) {
                customShortcutKey_Shift_4()
            } else {
                SetAutoplayDelayAndStart(4 * 1000)
            }
            break;
        case 53:
            if (e.shiftKey) {
                customShortcutKey_Shift_5()
            } else {
                SetAutoplayDelayAndStart(5 * 1000)
            }
            break;
        case 54:
            if (e.shiftKey) {
                customShortcutKey_Shift_6()
            } else {
                SetAutoplayDelayAndStart(6 * 1000)
            }
            break;
        case 55:
            if (e.shiftKey) {
                customShortcutKey_Shift_7()
            } else {
                SetAutoplayDelayAndStart(7 * 1000)
            }
            break;
        case 56:
            if (e.shiftKey) {
                customShortcutKey_Shift_8()
            } else {
                SetAutoplayDelayAndStart(8 * 1000)
            }
            break;
        case 57:
            if (e.shiftKey) {
                customShortcutKey_Shift_9()
            } else {
                setCustomAutoplayDelay()
            }
            break;
        case 81:
            SetAutoplayDelayAndStart(10 * 1000);
            break;
        case 87:
            SetAutoplayDelayAndStart(20 * 1000);
            break;
        case 69:
            SetAutoplayDelayAndStart(30 * 1000);
            break;
        case 82:
            pauseLiveBroadcast();
            break;
        case 84:
            if (e.shiftKey) {
                LiveBroadcastSteppingMode = !LiveBroadcastSteppingMode
            } else {
                refreshPgnSource()
            }
            break;
        case 89:
            restartLiveBroadcast();
            break;
        case 71:
            SetHighlight(!highlightOption);
            break;
        case 88:
            randomGameRandomPly();
            break;
        case 67:
            if (numberOfGames > 1) {
                Init(Math.floor(Math.random() * numberOfGames))
            }
            break;
        case 86:
            if (numberOfGames > 1) {
                Init(0)
            }
            break;
        case 66:
            Init(currentGame - 1);
            break;
        case 78:
            Init(currentGame + 1);
            break;
        case 77:
            if (numberOfGames > 1) {
                Init(numberOfGames - 1)
            }
            break;
        case 80:
            if (e.shiftKey) {
                SetCommentsOnSeparateLines(!commentsOnSeparateLines)
            } else {
                SetCommentsIntoMoveText(!commentsIntoMoveText)
            }
            oldPly = CurrentPly;
            oldVar = CurrentVar;
            Init();
            GoToMove(oldPly, oldVar);
            break;
        default:
            return !0
    }
    return stopEvProp(e)
}
var boardOnClick = new Array(8);
var boardTitle = new Array(8);
var boardDefault = new Array(8);
for (var col = 0; col < 8; col++) {
    boardOnClick[col] = new Array(8);
    boardTitle[col] = new Array(8);
    boardDefault[col] = new Array(8)
}
clearShortcutSquares("ABCDEFGH", "12345678");

function colRowFromSquare(square) {
    if ((typeof(square) != "string") || (!square)) {
        return null
    }
    var col = square.charCodeAt(0) - 65;
    if ((col < 0) || (col > 7)) {
        return null
    }
    var row = 56 - square.charCodeAt(1);
    if ((row < 0) || (row > 7)) {
        return null
    }
    return {
        "col": col,
        "row": row
    }
}

function clearShortcutSquares(cols, rows) {
    if ((typeof(cols) != "string") || (typeof(rows) != "string")) {
        return
    }
    for (var c = 0; c < cols.length; c++) {
        for (var r = 0; r < rows.length; r++) {
            boardShortcut(cols.charAt(c).toUpperCase() + rows.charAt(r), "", function(t, e) {})
        }
    }
}

function boardIsDefault(square) {
    var colRow = colRowFromSquare(square);
    if (!colRow) {
        return !1
    }
    return boardDefault[colRow.col][colRow.row]
}

function boardShortcut(square, title, functionPointer, defaultSetting) {
    var theObj, colRow = colRowFromSquare(square);
    if (!colRow) {
        return
    } else {
        var col = colRow.col;
        var row = colRow.row
    }
    boardTitle[col][row] = title;
    if (functionPointer) {
        boardOnClick[col][row] = functionPointer
    }
    boardDefault[col][row] = defaultSetting ? !0 : !1;
    if (theObj = document.getElementById('img_tcol' + col + 'trow' + row)) {
        if (IsRotated) {
            square = String.fromCharCode(72 - col, 49 + row)
        }
        theObj.title = square + (boardTitle[col][row] ? ': ' + boardTitle[col][row] : '')
    }
}
var debugShortcutSquare = "A8";
boardShortcut("A8", "pgn4web v" + pgn4web_version + " debug info", function(t, e) {
    displayDebugInfo()
}, !0);
boardShortcut("B8", "show this position FEN string", function(t, e) {
    displayFenData()
}, !0);
boardShortcut("C8", "show this game PGN source data", function(t, e) {
    if (e.shiftKey) {
        savePgnData(!0)
    } else {
        displayPgnData(!0)
    }
}, !0);
boardShortcut("D8", "show full PGN source data", function(t, e) {
    if (e.shiftKey) {
        savePgnData()
    } else {
        displayPgnData()
    }
}, !0);
boardShortcut("E8", "search help", function(t, e) {
    displayHelp("search_tool")
}, !0);
boardShortcut("F8", "shortcut keys help", function(t, e) {
    displayHelp("shortcut_keys")
}, !0);
boardShortcut("G8", "shortcut squares help", function(t, e) {
    displayHelp(e.shiftKey ? "informant_symbols" : "shortcut_squares")
}, !0);
boardShortcut("H8", "pgn4web help", function(t, e) {
    displayHelp(e.shiftKey ? "credits_and_license" : "")
}, !0);
boardShortcut("A7", "pgn4web website", function(t, e) {
    window.open(pgn4web_project_url)
}, !0);
boardShortcut("B7", "undo last chessboard position update", function(t, e) {
    undoStackUndo()
}, !0);
boardShortcut("C7", "redo last undo", function(t, e) {
    undoStackRedo()
}, !0);
boardShortcut("D7", "toggle highlight last move", function(t, e) {
    SetHighlight(!highlightOption)
}, !0);
boardShortcut("F7", "toggle show comments in game text", function(t, e) {
    if (e.shiftKey) {
        SetCommentsOnSeparateLines(!commentsOnSeparateLines)
    } else {
        SetCommentsIntoMoveText(!commentsIntoMoveText)
    }
    var oldPly = CurrentPly;
    var oldVar = CurrentVar;
    Init();
    GoToMove(oldPly, oldVar)
}, !0);
boardShortcut("G7", "", function(t, e) {}, !0);
boardShortcut("H7", "toggle enabling shortcut keys", function(t, e) {
    interactivelyToggleShortcutKeys()
}, !0);
boardShortcut("A6", "", function(t, e) {}, !0);
boardShortcut("B6", "", function(t, e) {}, !0);
boardShortcut("C6", "search previous finished game", function(t, e) {
    searchPgnGame('\\[\\s*Result\\s*"(?!\\*"\\s*\\])', !0)
});
boardShortcut("D6", "search previous unfinished game", function(t, e) {
    searchPgnGame('\\[\\s*Result\\s*"\\*"\\s*\\]', !0)
});
boardShortcut("E6", "search next unfinished game", function(t, e) {
    searchPgnGame('\\[\\s*Result\\s*"\\*"\\s*\\]', !1)
}, !0);
boardShortcut("F6", "search next finished game", function(t, e) {
    searchPgnGame('\\[\\s*Result\\s*"(?!\\*"\\s*\\])', !1)
}, !0);
boardShortcut("G6", "", function(t, e) {}, !0);
boardShortcut("H6", "", function(t, e) {}, !0);
boardShortcut("A5", "repeat last search backward", function(t, e) {
    searchPgnGame(lastSearchPgnExpression, !0)
}, !0);
boardShortcut("B5", "search prompt", function(t, e) {
    if (e.shiftKey) {
        searchPgnGame("")
    } else {
        searchPgnGamePrompt()
    }
}, !0);
boardShortcut("C5", "repeat last search", function(t, e) {
    searchPgnGame(lastSearchPgnExpression)
}, !0);
boardShortcut("D5", "search previous win result", function(t, e) {
    searchPgnGame('\\[\\s*Result\\s*"(1-0|0-1)"\\s*\\]', !0)
}, !0);
boardShortcut("E5", "search next win result", function(t, e) {
    searchPgnGame('\\[\\s*Result\\s*"(1-0|0-1)"\\s*\\]', !1)
}, !0);
boardShortcut("F5", "", function(t, e) {}, !0);
boardShortcut("G5", "", function(t, e) {}, !0);
boardShortcut("H5", "", function(t, e) {}, !0);
boardShortcut("A4", "search previous event", function(t, e) {
    searchPgnGame('\\[\\s*Event\\s*"(?!' + fixRegExp(gameEvent[currentGame]) + '"\\s*\\])', !0)
}, !0);
boardShortcut("B4", "search previous round of same event", function(t, e) {
    searchPgnGame('\\[\\s*Event\\s*"' + fixRegExp(gameEvent[currentGame]) + '"\\s*\\].*\\[\\s*Round\\s*"(?!' + fixRegExp(gameRound[currentGame]) + '"\\s*\\])|\\[\\s*Round\\s*"(?!' + fixRegExp(gameRound[currentGame]) + '"\\s*\\]).*\\[\\s*Event\\s*"' + fixRegExp(gameEvent[currentGame]) + '"\\s*\\]', !0)
}, !0);
boardShortcut("C4", "search previous game of same black player", function(t, e) {
    searchPgnGame('\\[\\s*' + (e.shiftKey ? 'White' : 'Black') + '\\s*"' + fixRegExp(gameBlack[currentGame]) + '"\\s*\\]', !0)
}, !0);
boardShortcut("D4", "search previous game of same white player", function(t, e) {
    searchPgnGame('\\[\\s*' + (e.shiftKey ? 'Black' : 'White') + '\\s*"' + fixRegExp(gameWhite[currentGame]) + '"\\s*\\]', !0)
}, !0);
boardShortcut("E4", "search next game of same white player", function(t, e) {
    searchPgnGame('\\[\\s*' + (e.shiftKey ? 'Black' : 'White') + '\\s*"' + fixRegExp(gameWhite[currentGame]) + '"\\s*\\]', !1)
}, !0);
boardShortcut("F4", "search next game of same black player", function(t, e) {
    searchPgnGame('\\[\\s*' + (e.shiftKey ? 'White' : 'Black') + '\\s*"' + fixRegExp(gameBlack[currentGame]) + '"\\s*\\]', !1)
}, !0);
boardShortcut("G4", "search next round of same event", function(t, e) {
    searchPgnGame('\\[\\s*Event\\s*"' + fixRegExp(gameEvent[currentGame]) + '"\\s*\\].*\\[\\s*Round\\s*"(?!' + fixRegExp(gameRound[currentGame]) + '"\\s*\\])|\\[\\s*Round\\s*"(?!' + fixRegExp(gameRound[currentGame]) + '"\\s*\\]).*\\[\\s*Event\\s*"' + fixRegExp(gameEvent[currentGame]) + '"\\s*\\]', !1)
}, !0);
boardShortcut("H4", "search next event", function(t, e) {
    searchPgnGame('\\[\\s*Event\\s*"(?!' + fixRegExp(gameEvent[currentGame]) + '"\\s*\\])', !1)
}, !0);
boardShortcut("A3", "load first game", function(t, e) {
    if (numberOfGames > 1) {
        Init(0)
    }
}, !0);
boardShortcut("B3", "jump to previous games decile", function(t, e) {
    if (currentGame > 0) {
        calculateDeciles();
        for (var ii = (deciles.length - 2); ii >= 0; ii--) {
            if (currentGame > deciles[ii]) {
                Init(deciles[ii]);
                break
            }
        }
    }
}, !0);
boardShortcut("C3", "load previous game", function(t, e) {
    Init(currentGame - 1)
}, !0);
boardShortcut("D3", "load random game", function(t, e) {
    if (numberOfGames > 1) {
        Init(Math.floor(Math.random() * numberOfGames))
    }
}, !0);
boardShortcut("E3", "load random game at random position", function(t, e) {
    randomGameRandomPly()
}, !0);
boardShortcut("F3", "load next game", function(t, e) {
    Init(currentGame + 1)
}, !0);
boardShortcut("G3", "jump to next games decile", function(t, e) {
    if (currentGame < numberOfGames - 1) {
        calculateDeciles();
        for (var ii = 1; ii < deciles.length; ii++) {
            if (currentGame < deciles[ii]) {
                Init(deciles[ii]);
                break
            }
        }
    }
}, !0);
boardShortcut("H3", "load last game", function(t, e) {
    if (numberOfGames > 1) {
        Init(numberOfGames - 1)
    }
}, !0);
boardShortcut("A2", "stop autoplay", function(t, e) {
    SetAutoPlay(e.shiftKey)
}, !0);
boardShortcut("B2", "toggle autoplay", function(t, e) {
    SwitchAutoPlay()
}, !0);
boardShortcut("C2", "autoplay 1 second", function(t, e) {
    SetAutoplayDelayAndStart((e.shiftKey ? 10 : 1) * 1000)
}, !0);
boardShortcut("D2", "autoplay 2 seconds", function(t, e) {
    SetAutoplayDelayAndStart((e.shiftKey ? 20 : 2) * 1000)
}, !0);
boardShortcut("E2", "autoplay 5 seconds", function(t, e) {
    SetAutoplayDelayAndStart((e.shiftKey ? 50 : 5) * 1000)
}, !0);
boardShortcut("F2", "autoplay custom delay", function(t, e) {
    setCustomAutoplayDelay()
}, !0);
boardShortcut("G2", "replay up to 6 previous half-moves, then autoplay forward", function(t, e) {
    replayPreviousMoves(e.shiftKey ? 10 : 6)
}, !0);
boardShortcut("H2", "replay the previous half-move, then autoplay forward", function(t, e) {
    replayPreviousMoves(e.shiftKey ? 3 : 1)
}, !0);
boardShortcut("A1", "go to game start", function(t, e) {
    startButton(e)
}, !0);
boardShortcut("B1", "", function(t, e) {}, !0);
boardShortcut("C1", "", function(t, e) {}, !0);
boardShortcut("D1", "move backward", function(t, e) {
    GoToMove(CurrentPly - 1)
}, !0);
boardShortcut("E1", "move forward", function(t, e) {
    GoToMove(CurrentPly + 1)
}, !0);
boardShortcut("F1", "", function(t, e) {}, !0);
boardShortcut("G1", "", function(t, e) {}, !0);
boardShortcut("H1", "go to game end", function(t, e) {
    endButton(e)
}, !0);
setG7A6B6H7boardShortcuts();

function setG7A6B6H7boardShortcuts() {
    if (LiveBroadcastDelay > 0) {
        if (boardIsDefault("G7")) {
            boardShortcut("G7", "", function(t, e) {}, !0)
        }
        if (boardIsDefault("A6")) {
            boardShortcut("A6", "pause live broadcast automatic games refresh", function(t, e) {
                pauseLiveBroadcast()
            }, !0)
        }
        if (boardIsDefault("B6")) {
            boardShortcut("B6", "restart live broadcast automatic games refresh", function(t, e) {
                restartLiveBroadcast()
            }, !0)
        }
        if (boardIsDefault("H6")) {
            boardShortcut("H6", "force live broadcast games refresh", function(t, e) {
                refreshPgnSource()
            }, !0)
        }
    } else {
        if (boardIsDefault("G7")) {
            boardShortcut("G7", "toggle autoplay next game", function(t, e) {
                SetAutoplayNextGame(!autoplayNextGame)
            }, !0)
        }
        if (boardIsDefault("A6")) {
            boardShortcut("A6", "", function(t, e) {}, !0)
        }
        if (boardIsDefault("B6")) {
            boardShortcut("B6", "", function(t, e) {}, !0)
        }
        if (boardIsDefault("H6")) {
            boardShortcut("H6", "", function(t, e) {}, !0)
        }
    }
}
setB1C1F1G1boardShortcuts();

function setB1C1F1G1boardShortcuts() {
    if (commentsIntoMoveText && GameHasComments) {
        if (boardIsDefault("B1")) {
            boardShortcut("B1", "go to previous comment or variation", function(t, e) {
                if (e.shiftKey) {
                    GoToMove(CurrentPly - 10)
                } else {
                    MoveToPrevComment()
                }
            }, !0)
        }
        if (boardIsDefault("G1")) {
            boardShortcut("G1", "go to next comment or variation", function(t, e) {
                if (e.shiftKey) {
                    GoToMove(CurrentPly + 10)
                } else {
                    MoveToNextComment()
                }
            }, !0)
        }
    } else {
        if (boardIsDefault("B1")) {
            boardShortcut("B1", "move 10 half-moves backward", function(t, e) {
                GoToMove(CurrentPly - 10)
            }, !0)
        }
        if (boardIsDefault("G1")) {
            boardShortcut("G1", "move 10 half-moves forward", function(t, e) {
                GoToMove(CurrentPly + 10)
            }, !0)
        }
    }
    if (commentsIntoMoveText && GameHasVariations) {
        if (boardIsDefault("C1")) {
            boardShortcut("C1", "go to parent variation", function(t, e) {
                if (e.shiftKey) {
                    GoToMove(CurrentPly - 6)
                } else {
                    GoToMove(StartPlyVar[CurrentVar])
                }
            }, !0)
        }
        if (boardIsDefault("F1")) {
            boardShortcut("F1", "cycle through alternative variations, if any, otherwise move forward", function(t, e) {
                if (e.shiftKey) {
                    GoToMove(CurrentPly + 6)
                } else {
                    if (!goToNextVariationSibling()) {
                        GoToMove(CurrentPly + 1)
                    }
                }
            }, !0)
        }
    } else {
        if (boardIsDefault("C1")) {
            boardShortcut("C1", "move 6 half-moves backward", function(t, e) {
                GoToMove(CurrentPly - 6)
            }, !0)
        }
        if (boardIsDefault("F1")) {
            boardShortcut("F1", "move 6 half-moves forward", function(t, e) {
                GoToMove(CurrentPly + 6)
            }, !0)
        }
    }
}
var deciles = new Array(11);

function calculateDeciles() {
    for (var ii = 0; ii < deciles.length; ii++) {
        deciles[ii] = Math.round((numberOfGames - 1) * ii / (deciles.length - 1))
    }
}

function replayPreviousMoves(numPlies) {
    var thisPly = numPlies ? CurrentPly - numPlies : StartPly;
    if (thisPly < StartPlyVar[CurrentVar]) {
        thisPly = StartPlyVar[CurrentVar] + (CurrentVar === 0 ? 0 : 1)
    }
    if (thisPly !== CurrentPly) {
        GoToMove(thisPly)
    }
    SetAutoPlay(!0)
}

function detectJavascriptLocation(jsre) {
    if (typeof(jsre) == "undefined") {
        jsre = new RegExp("(pgn4web|pgn4web-compacted)\.js$", "")
    }
    var e = document.getElementsByTagName("script");
    for (var i = 0; i < e.length; i++) {
        if ((e[i].src) && (e[i].src.match(jsre))) {
            return e[i].src
        }
    }
    return ""
}

function detectHelpLocation() {
    return detectJavascriptLocation().replace(/(pgn4web|pgn4web-compacted)\.js/, "pgn4web-help.html")
}

function detectBaseLocation() {
    var e = document.getElementsByTagName("base");
    for (var i = 0; i < e.length; i++) {
        if (e[i].href) {
            return e[i].href
        }
    }
    return ""
}
var debugWin;

function displayDebugInfo() {
    var theObj;
    var base = detectBaseLocation();
    var jsurl = detectJavascriptLocation();
    stopAlertPrompt();
    var dbg1 = 'pgn4web: version=' + pgn4web_version + ' homepage=' + pgn4web_project_url + '\n\n' + 'HTMLURL: length=' + location.href.length + ' url=';
    var dbg2 = location.href.length < 100 ? location.href : (location.href.substring(0, 99) + '...');
    var dbg3 = '\n' + (base ? 'BASEURL: url=' + base + '\n' : '') + (jsurl != 'pgn4web.js' ? 'JSURL: url=' + jsurl + '\n' : '');
    if (pgnUrl) {
        dbg3 += 'PGNURL: url=' + pgnUrl
    } else {
        if (theObj = document.getElementById("pgnText")) {
            dbg3 += 'PGNTEXT: length=' + (theObj.tagName.toLowerCase() == "textarea" ? theObj.value.length : "?")
        }
    }
    dbg3 += '\n\n' + 'GAME: current=' + (currentGame + 1) + ' number=' + numberOfGames + '\n' + 'VARIATION: current=' + CurrentVar + ' number=' + (numberOfVars - 1) + '\n' + 'PLY: start=' + StartPly + ' current=' + CurrentPly + ' number=' + PlyNumber + '\n' + 'AUTOPLAY: status=' + (isAutoPlayOn ? 'on' : 'off') + ' delay=' + Delay + 'ms' + ' next=' + autoplayNextGame + '\n\n';
    if (LiveBroadcastDelay > 0) {
        dbg3 += 'LIVEBROADCAST: status=' + liveStatusDebug() + ' ticker=' + LiveBroadcastTicker + ' delay=' + LiveBroadcastDelay + 'm' + '\n' + 'refreshed: ' + LiveBroadcastLastRefreshedLocal + '\n' + 'received: ' + LiveBroadcastLastReceivedLocal + '\n' + 'modified (server time): ' + LiveBroadcastLastModified_ServerTime() + '\n\n'
    }
    if (typeof(engineWinCheck) == "function") {
        dbg3 += "ANALYSIS: " + (engineWinCheck() ? "board=connected " + engineWin.customDebugInfo() : "board=disconnected") + "\n\n"
    }
    var thisInfo = customDebugInfo();
    if (thisInfo) {
        dbg3 += "CUSTOM: " + thisInfo + "\n\n"
    }
    dbg3 += 'ALERTLOG: fatalnew=' + fatalErrorNumSinceReset + ' new=' + alertNumSinceReset + ' shown=' + Math.min(alertNum, alertLog.length) + ' total=' + alertNum + '\n--';
    if (alertNum > 0) {
        for (var ii = 0; ii < alertLog.length; ii++) {
            if (alertLog[(alertNum - 1 - ii) % alertLog.length] === undefined) {
                break
            } else {
                dbg3 += "\n" + alertLog[(alertNum - 1 - ii) % alertLog.length] + "\n--"
            }
        }
    }
    if (confirm(dbg1 + dbg2 + dbg3 + '\n\nclick OK to show this debug info in a browser window for cut and paste')) {
        if (debugWin && !debugWin.closed) {
            debugWin.close()
        }
        debugWin = window.open("", "pgn4web_debug_data", "resizable=yes,scrollbars=yes,toolbar=no,location=no,menubar=no,status=no");
        if (debugWin) {
            debugWin.document.open("text/html", "replace");
            debugWin.document.write("<html><head><title>pgn4web debug info</title>" + "<link rel='shortcut icon' href='pawn.ico' /></head>" + "<body>\n<pre>\n" + dbg1 + location.href + " " + dbg3 + "\n</pre>\n</body></html>");
            debugWin.document.close();
            if (window.focus) {
                debugWin.focus()
            }
        }
    }
    alertNumSinceReset = fatalErrorNumSinceReset = 0
}

function liveStatusDebug() {
    if (LiveBroadcastEnded) {
        return "ended"
    }
    if (LiveBroadcastPaused) {
        return "paused"
    }
    if (LiveBroadcastStarted) {
        return "started"
    }
    return "waiting"
}

function customDebugInfo() {
    return ""
}
var pgnWin;

function displayPgnData(oneGameOnly) {
    if (pgnWin && !pgnWin.closed) {
        pgnWin.close()
    }
    pgnWin = window.open("", "pgn4web_pgn_data", "resizable=yes,scrollbars=yes,toolbar=no,location=no,menubar=no,status=no");
    if (pgnWin) {
        var text = "<html><head><title>pgn4web PGN source</title>" + "<link rel='shortcut icon' href='pawn.ico' /></head><body>\n<pre>\n";
        if (oneGameOnly) {
            text += fullPgnGame(currentGame) + "\n\n"
        } else {
            for (var ii = 0; ii < numberOfGames; ++ii) {
                text += fullPgnGame(ii) + "\n\n"
            }
        }
        text += "\n</pre>\n</body></html>";
        pgnWin.document.open("text/html", "replace");
        pgnWin.document.write(text);
        pgnWin.document.close();
        if (window.focus) {
            pgnWin.focus()
        }
    }
}

function savePgnData(oneGameOnly) {
    if (pgnUrl && !oneGameOnly) {
        location.href = pgnUrl
    } else {
        displayPgnData(oneGameOnly)
    }
}

function CurrentFEN() {
    var thisFEN = "";
    var emptySquares = 0;
    for (var row = 7; row >= 0; row--) {
        for (var col = 0; col <= 7; col++) {
            if (Board[col][row] === 0) {
                emptySquares++
            } else {
                if (emptySquares) {
                    thisFEN += emptySquares;
                    emptySquares = 0
                }
                if (Board[col][row] > 0) {
                    thisFEN += FenPieceName.charAt(Board[col][row] - 1).toUpperCase()
                } else if (Board[col][row] < 0) {
                    thisFEN += FenPieceName.charAt(-Board[col][row] - 1).toLowerCase()
                }
            }
        }
        if (emptySquares) {
            thisFEN += emptySquares;
            emptySquares = 0
        }
        if (row > 0) {
            thisFEN += "/"
        }
    }
    thisFEN += CurrentPly % 2 ? " b" : " w";
    var CastlingFEN = "";
    if (RookForOOCastling(0) !== null) {
        CastlingFEN += FenPieceName.charAt(0).toUpperCase()
    }
    if (RookForOOOCastling(0) !== null) {
        CastlingFEN += FenPieceName.charAt(1).toUpperCase()
    }
    if (RookForOOCastling(1) !== null) {
        CastlingFEN += FenPieceName.charAt(0).toLowerCase()
    }
    if (RookForOOOCastling(1) !== null) {
        CastlingFEN += FenPieceName.charAt(1).toLowerCase()
    }
    thisFEN += " " + (CastlingFEN || "-");
    if (HistEnPassant[CurrentPly]) {
        thisFEN += " " + String.fromCharCode(HistEnPassantCol[CurrentPly] + 97);
        thisFEN += CurrentPly % 2 ? "3" : "6"
    } else {
        thisFEN += " -"
    }
    var HalfMoveClock = InitialHalfMoveClock;
    for (var thisPly = StartPly; thisPly < CurrentPly; thisPly++) {
        if ((HistType[0][thisPly] == 6) || (HistPieceId[1][thisPly] >= 16)) {
            HalfMoveClock = 0
        } else {
            HalfMoveClock++
        }
    }
    thisFEN += " " + HalfMoveClock;
    thisFEN += " " + (Math.floor(CurrentPly / 2) + 1);
    return thisFEN
}
var fenWin;

function displayFenData(addGametext) {
    if (fenWin && !fenWin.closed) {
        fenWin.close()
    }
    var thisFEN = CurrentFEN();
    var movesStr = "";
    var lineStart = 0;
    if (addGametext) {
        for (var thisPly = CurrentPly; thisPly <= StartPly + PlyNumber; thisPly++) {
            var addStr = "";
            if (thisPly == StartPly + PlyNumber) {
                addStr = (CurrentVar ? "*" : gameResult[currentGame] || "*")
            } else {
                if (thisPly % 2 === 0) {
                    addStr = (Math.floor(thisPly / 2) + 1) + ". "
                } else if (thisPly == CurrentPly) {
                    addStr = (Math.floor(thisPly / 2) + 1) + "... "
                }
                addStr += Moves[thisPly]
            }
            if (movesStr.length + addStr.length + 1 > lineStart + 80) {
                lineStart = movesStr.length;
                movesStr += "\n" + addStr
            } else {
                if (movesStr.length > 0) {
                    movesStr += " "
                }
                movesStr += addStr
            }
        }
    }
    fenWin = window.open("", "pgn4web_fen_data", "resizable=yes,scrollbars=yes,toolbar=no,location=no,menubar=no,status=no");
    if (fenWin) {
        var text = "<html>" + "<head><title>pgn4web FEN string</title><link rel='shortcut icon' href='pawn.ico' /></head>" + "<body>\n<b><pre>\n\n" + thisFEN + "\n\n</pre></b>\n<hr>\n<pre>\n\n";
        if (addGametext) {
            text += "[Event \"" + ((CurrentVar ? "" : gameEvent[currentGame]) || "?") + "\"]\n" + "[Site \"" + ((CurrentVar ? "" : gameSite[currentGame]) || "?") + "\"]\n" + "[Date \"" + ((CurrentVar ? "" : gameDate[currentGame]) || "????.??.??") + "\"]\n" + "[Round \"" + ((CurrentVar ? "" : gameRound[currentGame]) || "?") + "\"]\n" + "[White \"" + ((CurrentVar ? "" : gameWhite[currentGame]) || "?") + "\"]\n" + "[Black \"" + ((CurrentVar ? "" : gameBlack[currentGame]) || "?") + "\"]\n" + "[Result \"" + ((CurrentVar ? "" : gameResult[currentGame]) || "*") + "\"]\n"
        }
        if ((thisFEN != FenStringStart) || (!addGametext)) {
            text += "[SetUp \"1\"]\n" + "[FEN \"" + thisFEN + "\"]\n"
        }
        if (gameVariant[currentGame] !== "") {
            text += "[Variant \"" + gameVariant[currentGame] + "\"]\n"
        }
        if (addGametext) {
            text += "\n" + movesStr + "\n"
        }
        text += "</pre>\n</body></html>";
        fenWin.document.open("text/html", "replace");
        fenWin.document.write(text);
        fenWin.document.close();
        if (window.focus) {
            fenWin.focus()
        }
    }
}
var pgnHeader = new Array();
var pgnGame = new Array();
var numberOfGames = -1;
var currentGame = -1;
var firstStart = !0;
var gameDate = new Array();
var gameWhite = new Array();
var gameBlack = new Array();
var gameEvent = new Array();
var gameOpening = new Array();
var gameSite = new Array();
var gameRound = new Array();
var gameResult = new Array();
var gameSetUp = new Array();
var gameFEN = new Array();
var gameInitialWhiteClock = new Array();
var gameInitialBlackClock = new Array();
var gameVariant = new Array();
var highlightedMoveId = "";
var isAutoPlayOn = !1;
var AutoPlayInterval = null;
var Delay = 1000;
var autostartAutoplay = !1;
var autoplayNextGame = !1;
var initialGame = 1;
var initialVariation = 0;
var initialHalfmove = 0;
var alwaysInitialHalfmove = !1;
var LiveBroadcastInterval = null;
var LiveBroadcastDelay = 0;
var LiveBroadcastAlert = !1;
var LiveBroadcastDemo = !1;
var LiveBroadcastStarted = !1;
var LiveBroadcastEnded = !1;
var LiveBroadcastPaused = !1;
var LiveBroadcastTicker = 0;
var LiveBroadcastGamesRunning = 0;
var LiveBroadcastStatusString = "";
var LiveBroadcastLastModified = new Date(0);
var LiveBroadcastLastModifiedHeader = LiveBroadcastLastModified.toUTCString();
var LiveBroadcastLastReceivedLocal = 'unavailable';
var LiveBroadcastLastRefreshedLocal = 'unavailable';
var LiveBroadcastPlaceholderEvent = 'TCEC';
var LiveBroadcastPlaceholderPgn = '[Event "' + LiveBroadcastPlaceholderEvent + '"]';
var gameDemoMaxPly = new Array();
var gameDemoLength = new Array();
var LiveBroadcastSteppingMode = !1;
var ParseLastMoveError = !1;
var castleRook = -1;
var mvCapture = 0;
var mvIsCastling = 0;
var mvIsPromotion = 0;
var mvFromCol = -1;
var mvFromRow = -1;
var mvToCol = -1;
var mvToRow = -1;
var mvPiece = -1;
var mvPieceId = -1;
var mvPieceOnTo = -1;
var mvCaptured = -1;
var mvCapturedId = -1;
var mvIsNull = 0;
var Board = new Array(8);
for (var i = 0; i < 8; ++i) {
    Board[i] = new Array(8)
}
var HistCol = new Array(3);
var HistRow = new Array(3);
var HistPieceId = new Array(2);
var HistType = new Array(2);
var HistVar = new Array();
var PieceCol = new Array(2);
var PieceRow = new Array(2);
var PieceType = new Array(2);
var PieceMoveCounter = new Array(2);
for (i = 0; i < 2; ++i) {
    PieceCol[i] = new Array(16);
    PieceRow[i] = new Array(16);
    PieceType[i] = new Array(16);
    PieceMoveCounter[i] = new Array(16);
    HistType[i] = new Array();
    HistPieceId[i] = new Array()
}
for (i = 0; i < 3; ++i) {
    HistCol[i] = new Array();
    HistRow[i] = new Array()
}
var HistEnPassant = new Array();
HistEnPassant[0] = !1;
var HistEnPassantCol = new Array();
HistEnPassantCol[0] = -1;
var HistNull = new Array();
HistNull[0] = 0;
var FenPieceName = "KQRBNP";
var PieceCode = FenPieceName.split("");
var FenStringStart = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
var columnsLetters = "ABCDEFGH";
var InitialHalfMoveClock = 0;
var PieceImg = new Array(new Array(6), new Array(6));
var ClearImg;
var ImagePath = 'images';
var ImagePathOld = null;
var imageType = 'png';
var defaultImagesSize = 40;
var highlightOption = !0;
var commentsIntoMoveText = !0;
var commentsOnSeparateLines = !1;
var pgnUrl = '';
var flipBoard = 0;
var CastlingLong = new Array(2);
var CastlingShort = new Array(2);
var Moves = new Array();
var MoveComments = new Array();
var MoveColor;
var MoveCount;
var PlyNumber;
var StartPly;
var CurrentPly;
var pgnHeaderTagRegExp = /\[\s*(\w+)\s*"([^"]*)"\s*\]/;
var pgnHeaderTagRegExpGlobal = /\[\s*(\w+)\s*"([^"]*)"\s*\]/g;
var pgnHeaderBlockRegExp = /\s*(\[\s*\w+\s*"[^"]*"\s*\]\s*)+/;
var emptyPgnHeader = '[Event ""]\n[Site ""]\n[Date ""]\n[Round ""]\n[White ""]\n[Black ""]\n[Result ""]\n';
var alertPgn = emptyPgnHeader + "\n{error: click on the top left chessboard square for debug info}";
var pgn4webVariationRegExp = /\[%pgn4web_variation (\d+)\]/;
var pgn4webVariationRegExpGlobal = /\[%pgn4web_variation (\d+)\]/g;
var gameSelectorHead = ' &middot;&middot;&middot;';
var gameSelectorMono = !0;
var gameSelectorNum = !1;
var gameSelectorNumLenght = 0;
var gameSelectorChEvent = 0;
var gameSelectorChSite = 0;
var gameSelectorChRound = 0;
var gameSelectorChWhite = 15;
var gameSelectorChBlack = 15;
var gameSelectorChResult = 0;
var gameSelectorChDate = 10;

function CheckLegality(what, plyCount) {
    var retVal, thisCol;
    if (what == '--') {
        StoreMove(plyCount);
        return !0
    }
    if (what == 'O-O') {
        if (!CheckLegalityOO()) {
            return !1
        }
        for (thisCol = PieceCol[MoveColor][0]; thisCol < 7; thisCol++) {
            if (IsCheck(thisCol, MoveColor * 7, MoveColor)) {
                return !1
            }
        }
        StoreMove(plyCount);
        return !0
    } else if (what == 'O-O-O') {
        if (!CheckLegalityOOO()) {
            return !1
        }
        for (thisCol = PieceCol[MoveColor][0]; thisCol > 1; thisCol--) {
            if (IsCheck(thisCol, MoveColor * 7, MoveColor)) {
                return !1
            }
        }
        StoreMove(plyCount);
        return !0
    }
    if (!mvCapture) {
        if (Board[mvToCol][mvToRow] !== 0) {
            return !1
        }
    }
    if ((mvCapture) && (Color(Board[mvToCol][mvToRow]) != 1 - MoveColor)) {
        if ((mvPiece != 6) || (!HistEnPassant[plyCount]) || (HistEnPassantCol[plyCount] != mvToCol) || (mvToRow != 5 - 3 * MoveColor)) {
            return !1
        }
    }
    if (mvIsPromotion) {
        if (mvPiece != 6) {
            return !1
        }
        if (mvPieceOnTo >= 6) {
            return !1
        }
        if (mvToRow != 7 * (1 - MoveColor)) {
            return !1
        }
    }
    for (var pieceId = 0; pieceId < 16; ++pieceId) {
        if (PieceType[MoveColor][pieceId] == mvPiece) {
            if (mvPiece == 1) {
                retVal = CheckLegalityKing(pieceId)
            } else if (mvPiece == 2) {
                retVal = CheckLegalityQueen(pieceId)
            } else if (mvPiece == 3) {
                retVal = CheckLegalityRook(pieceId)
            } else if (mvPiece == 4) {
                retVal = CheckLegalityBishop(pieceId)
            } else if (mvPiece == 5) {
                retVal = CheckLegalityKnight(pieceId)
            } else if (mvPiece == 6) {
                retVal = CheckLegalityPawn(pieceId)
            }
            if (retVal) {
                mvPieceId = pieceId;
                StoreMove(plyCount);
                if (!IsCheck(PieceCol[MoveColor][0], PieceRow[MoveColor][0], MoveColor)) {
                    return !0
                } else {
                    UndoMove(plyCount)
                }
            }
        }
    }
    return !1
}

function CheckLegalityKing(thisKing) {
    if ((mvFromCol >= 0) && (mvFromCol != PieceCol[MoveColor][thisKing])) {
        return !1
    }
    if ((mvFromRow >= 0) && (mvFromRow != PieceRow[MoveColor][thisKing])) {
        return !1
    }
    if (Math.abs(PieceCol[MoveColor][thisKing] - mvToCol) > 1) {
        return !1
    }
    if (Math.abs(PieceRow[MoveColor][thisKing] - mvToRow) > 1) {
        return !1
    }
    return !0
}

function CheckLegalityQueen(thisQueen) {
    if ((mvFromCol >= 0) && (mvFromCol != PieceCol[MoveColor][thisQueen])) {
        return !1
    }
    if ((mvFromRow >= 0) && (mvFromRow != PieceRow[MoveColor][thisQueen])) {
        return !1
    }
    if (((PieceCol[MoveColor][thisQueen] - mvToCol) * (PieceRow[MoveColor][thisQueen] - mvToRow) !== 0) && (Math.abs(PieceCol[MoveColor][thisQueen] - mvToCol) != Math.abs(PieceRow[MoveColor][thisQueen] - mvToRow))) {
        return !1
    }
    if (!CheckClearWay(thisQueen)) {
        return !1
    }
    return !0
}

function CheckLegalityRook(thisRook) {
    if ((mvFromCol >= 0) && (mvFromCol != PieceCol[MoveColor][thisRook])) {
        return !1
    }
    if ((mvFromRow >= 0) && (mvFromRow != PieceRow[MoveColor][thisRook])) {
        return !1
    }
    if ((PieceCol[MoveColor][thisRook] - mvToCol) * (PieceRow[MoveColor][thisRook] - mvToRow) !== 0) {
        return !1
    }
    if (!CheckClearWay(thisRook)) {
        return !1
    }
    return !0
}

function CheckLegalityBishop(thisBishop) {
    if ((mvFromCol >= 0) && (mvFromCol != PieceCol[MoveColor][thisBishop])) {
        return !1
    }
    if ((mvFromRow >= 0) && (mvFromRow != PieceRow[MoveColor][thisBishop])) {
        return !1
    }
    if (Math.abs(PieceCol[MoveColor][thisBishop] - mvToCol) != Math.abs(PieceRow[MoveColor][thisBishop] - mvToRow)) {
        return !1
    }
    if (!CheckClearWay(thisBishop)) {
        return !1
    }
    return !0
}

function CheckLegalityKnight(thisKnight) {
    if ((mvFromCol >= 0) && (mvFromCol != PieceCol[MoveColor][thisKnight])) {
        return !1
    }
    if ((mvFromRow >= 0) && (mvFromRow != PieceRow[MoveColor][thisKnight])) {
        return !1
    }
    if (Math.abs(PieceCol[MoveColor][thisKnight] - mvToCol) * Math.abs(PieceRow[MoveColor][thisKnight] - mvToRow) != 2) {
        return !1
    }
    return !0
}

function CheckLegalityPawn(thisPawn) {
    if ((mvFromCol >= 0) && (mvFromCol != PieceCol[MoveColor][thisPawn])) {
        return !1
    }
    if ((mvFromRow >= 0) && (mvFromRow != PieceRow[MoveColor][thisPawn])) {
        return !1
    }
    if (Math.abs(PieceCol[MoveColor][thisPawn] - mvToCol) != mvCapture) {
        return !1
    }
    if (mvCapture) {
        if (PieceRow[MoveColor][thisPawn] - mvToRow != 2 * MoveColor - 1) {
            return !1
        }
    } else {
        if (PieceRow[MoveColor][thisPawn] - mvToRow == 4 * MoveColor - 2) {
            if (PieceRow[MoveColor][thisPawn] != 1 + 5 * MoveColor) {
                return !1
            }
            if (Board[mvToCol][mvToRow + 2 * MoveColor - 1] !== 0) {
                return !1
            }
        } else {
            if (PieceRow[MoveColor][thisPawn] - mvToRow != 2 * MoveColor - 1) {
                return !1
            }
        }
    }
    return !0
}

function RookForOOCastling(color) {
    if (CastlingShort[color] < 0) {
        return null
    }
    if (PieceMoveCounter[color][0] > 0) {
        return null
    }
    var legal = !1;
    for (var thisRook = 0; thisRook < 16; thisRook++) {
        if ((PieceCol[color][thisRook] == CastlingShort[color]) && (PieceCol[color][thisRook] > PieceCol[color][0]) && (PieceRow[color][thisRook] == color * 7) && (PieceType[color][thisRook] == 3)) {
            legal = !0;
            break
        }
    }
    if (!legal) {
        return null
    }
    if (PieceMoveCounter[color][thisRook] > 0) {
        return null
    }
    return thisRook
}

function CheckLegalityOO() {
    var thisRook = RookForOOCastling(MoveColor);
    if (thisRook === null) {
        return !1
    }
    Board[PieceCol[MoveColor][0]][MoveColor * 7] = 0;
    Board[PieceCol[MoveColor][thisRook]][MoveColor * 7] = 0;
    var col = PieceCol[MoveColor][thisRook];
    if (col < 6) {
        col = 6
    }
    while ((col > PieceCol[MoveColor][0]) || (col >= 5)) {
        if (Board[col][MoveColor * 7] !== 0) {
            return !1
        }
        --col
    }
    castleRook = thisRook;
    return !0
}

function RookForOOOCastling(color) {
    if (CastlingLong[color] < 0) {
        return null
    }
    if (PieceMoveCounter[color][0] > 0) {
        return null
    }
    var legal = !1;
    for (var thisRook = 0; thisRook < 16; thisRook++) {
        if ((PieceCol[color][thisRook] == CastlingLong[color]) && (PieceCol[color][thisRook] < PieceCol[color][0]) && (PieceRow[color][thisRook] == color * 7) && (PieceType[color][thisRook] == 3)) {
            legal = !0;
            break
        }
    }
    if (!legal) {
        return null
    }
    if (PieceMoveCounter[color][thisRook] > 0) {
        return null
    }
    return thisRook
}

function CheckLegalityOOO() {
    var thisRook = RookForOOOCastling(MoveColor);
    if (thisRook === null) {
        return !1
    }
    Board[PieceCol[MoveColor][0]][MoveColor * 7] = 0;
    Board[PieceCol[MoveColor][thisRook]][MoveColor * 7] = 0;
    var col = PieceCol[MoveColor][thisRook];
    if (col > 2) {
        col = 2
    }
    while ((col < PieceCol[MoveColor][0]) || (col <= 3)) {
        if (Board[col][MoveColor * 7] !== 0) {
            return !1
        }
        ++col
    }
    castleRook = thisRook;
    return !0
}

function CheckClearWay(thisPiece) {
    var stepCol = sign(mvToCol - PieceCol[MoveColor][thisPiece]);
    var stepRow = sign(mvToRow - PieceRow[MoveColor][thisPiece]);
    var startCol = PieceCol[MoveColor][thisPiece] + stepCol;
    var startRow = PieceRow[MoveColor][thisPiece] + stepRow;
    while ((startCol != mvToCol) || (startRow != mvToRow)) {
        if (Board[startCol][startRow] !== 0) {
            return !1
        }
        startCol += stepCol;
        startRow += stepRow
    }
    return !0
}

function CleanMove(move) {
    move = move.replace(/[^a-wyzA-WYZ0-9+x=#-]*/g, '');
    if (move.match(/^[Oo0]/)) {
        move = move.replace(/[o0]/g, 'O').replace(/O(?=O)/g, 'O-')
    }
    move = move.replace(/ep/i, '');
    return move
}

function GoToMove(thisPly, thisVar) {
    SetAutoPlay(!1);
    if (typeof(thisVar) == "undefined") {
        thisVar = CurrentVar
    } else {
        if (thisVar < 0) {
            thisVar = 0
        } else if (thisVar >= numberOfVars) {
            thisVar = numberOfVars - 1
        }
    }
    if (thisPly < 0) {
        thisPly = 0
    } else if (thisPly >= StartPlyVar[thisVar] + PlyNumberVar[thisVar]) {
        thisPly = StartPlyVar[thisVar] + PlyNumberVar[thisVar]
    }
    if (thisVar === CurrentVar) {
        var diff = thisPly - CurrentPly;
        if (diff > 0) {
            MoveForward(diff)
        } else {
            MoveBackward(-diff)
        }
    } else {
        var backStart = StartPly;
        loopCommonPredecessor: for (var ii = PredecessorsVars[CurrentVar].length - 1; ii >= 0; ii--) {
            for (var jj = PredecessorsVars[thisVar].length - 1; jj >= 0; jj--) {
                if (PredecessorsVars[CurrentVar][ii] === PredecessorsVars[thisVar][jj]) {
                    backStart = Math.min(PredecessorsVars[CurrentVar][ii + 1] ? StartPlyVar[PredecessorsVars[CurrentVar][ii + 1]] : CurrentPly, PredecessorsVars[thisVar][jj + 1] ? StartPlyVar[PredecessorsVars[thisVar][jj + 1]] : thisPly);
                    break loopCommonPredecessor
                }
            }
        }
        MoveBackward(CurrentPly - backStart, !0);
        MoveForward(thisPly - backStart, thisVar)
    }
   ylcetSettime();
   setEnginePv();
}

function SetShortcutKeysEnabled(onOff) {
    shortcutKeysEnabled = onOff
}

function interactivelyToggleShortcutKeys() {
    if (confirm("Shortcut keys currently " + (shortcutKeysEnabled ? "enabled" : "disabled") + ".\nToggle shortcut keys to " + (shortcutKeysEnabled ? "DISABLED" : "ENABLED") + "?")) {
        SetShortcutKeysEnabled(!shortcutKeysEnabled)
    }
}

function SetCommentsIntoMoveText(onOff) {
    commentsIntoMoveText = onOff
}

function SetCommentsOnSeparateLines(onOff) {
    commentsOnSeparateLines = onOff
}

function SetAutostartAutoplay(onOff) {
    autostartAutoplay = onOff
}

function SetAutoplayNextGame(onOff) {
    autoplayNextGame = onOff
}

function SetInitialHalfmove(number_or_string, always) {
    alwaysInitialHalfmove = (always === !0);
    if (number_or_string === undefined) {
        initialHalfmove = 0;
        return
    }
    initialHalfmove = number_or_string;
    if ((typeof number_or_string == "string") && (number_or_string.match(/^(start|startplusone|startplusfive|end|random|comment|commentplusone|variation)$/))) {
        return
    }
    if (isNaN(initialHalfmove = parseInt(initialHalfmove, 10))) {
        initialHalfmove = 0
    }
}

function SetInitialVariation(number) {
    initialVariation = isNaN(number = parseInt(number, 10)) ? 0 : number
}

function SetInitialGame(number_or_string) {
    initialGame = typeof(number_or_string) == "undefined" ? 1 : number_or_string
}

function randomGameRandomPly() {
    if (numberOfGames > 1) {
        var oldInitialHalfmove = initialHalfmove;
        var oldAlwaysInitialHalfmove = alwaysInitialHalfmove;
        SetInitialHalfmove("random", !0);
        Init(Math.floor(Math.random() * numberOfGames));
        SetInitialHalfmove(oldInitialHalfmove, oldAlwaysInitialHalfmove)
    }
}

function clockFromComment(plyNum) {
    return customPgnCommentTag("clk", null, plyNum)
}

function clockFromHeader(whiteToMove) {
    var clockString = customPgnHeaderTag("Clock") + "";
    var matches = clockString.match("^" + (whiteToMove ? "W" : "B") + "/(.*)$");
    if (matches) {
        return matches[1]
    } else {
        return null
    }
}

var whiteToMove = 0;

function HighlightLastMove() {
    var theObj, moveId, text, ii, clockString, clockRegExp, clockMatch;
    undoStackStore();
    if (highlightedMoveId) {
        if (theObj = document.getElementById(highlightedMoveId)) {
            theObj.className = (highlightedMoveId.match(/Var0Mv/) ? 'move' : 'variation') + ' notranslate'
        }
    }
    var showThisMove = CurrentPly - 1;
    if (showThisMove > StartPlyVar[CurrentVar] + PlyNumberVar[CurrentVar]) {
        showThisMove = StartPlyVar[CurrentVar] + PlyNumberVar[CurrentVar]
    }
    if (theObj = document.getElementById("GameLastComment")) {
        if (commentsIntoMoveText) {
            variationTextDepth = CurrentVar === 0 ? 0 : 1;
            text = '<SPAN CLASS="comment">' + strippedMoveComment(showThisMove + 1, CurrentVar, !0).replace(/\sID="[^"]*"/g, '') + '</SPAN>'
        } else {
            text = ''
        }
        theObj.innerHTML = text
    }
    whiteToMove = ((showThisMove + 1) % 2 === 0);
    text = whiteToMove ? 'white' : 'black';
    if (theObj = document.getElementById("GameSideToMove")) {
        theObj.innerHTML = text
    }
    var lastMoverClockObj = document.getElementById(whiteToMove ? "GameBlackClock" : "GameWhiteClock");
    var initialLastMoverClock = whiteToMove ? gameInitialBlackClock[currentGame] : gameInitialWhiteClock[currentGame];
    var beforeLastMoverClockObj = document.getElementById(whiteToMove ? "GameWhiteClock" : "GameBlackClock");
    var initialBeforeLastMoverClock = whiteToMove ? gameInitialWhiteClock[currentGame] : gameInitialBlackClock[currentGame];
    if (lastMoverClockObj) {
        clockString = ((showThisMove + 1 === StartPly + PlyNumber) && ((!LiveBroadcastDemo) || (gameResult[currentGame] !== "*"))) ? clockFromHeader(!whiteToMove) : null;
        if (clockString === null) {
            clockString = showThisMove + 1 > StartPly ? clockFromComment(showThisMove + 1) : initialLastMoverClock;
            if (!clockString && (CurrentPly === StartPly + PlyNumber)) {
                clockRegExp = new RegExp((whiteToMove ? "Black" : "White") + "\\s+Time:\\s*(\\S+)", "i");
                if (clockMatch = strippedMoveComment(StartPly + PlyNumber).match(clockRegExp)) {
                    clockString = clockMatch[1]
                }
            }
        }
        lastMoverClockObj.innerHTML = clockString
    }
    if (beforeLastMoverClockObj) {
        clockString = ((showThisMove + 1 === StartPly + PlyNumber) && ((!LiveBroadcastDemo) || (gameResult[currentGame] !== "*"))) ? clockFromHeader(whiteToMove) : null;
        if (clockString === null) {
            clockString = showThisMove > StartPly ? clockFromComment(showThisMove) : initialBeforeLastMoverClock;
            if (!clockString && (CurrentPly === StartPly + PlyNumber)) {
                clockRegExp = new RegExp((whiteToMove ? "White" : "Black") + "\\s+Time:\\s*(\\S+)", "i");
                if (clockMatch = strippedMoveComment(StartPly + PlyNumber).match(clockRegExp)) {
                    clockString = clockMatch[1]
                }
            }
        }
        beforeLastMoverClockObj.innerHTML = clockString
    }
    if (lastMoverClockObj && beforeLastMoverClockObj) {
        if (lastMoverClockObj.innerHTML && !beforeLastMoverClockObj.innerHTML) {
            beforeLastMoverClockObj.innerHTML = "-"
        } else if (!lastMoverClockObj.innerHTML && beforeLastMoverClockObj.innerHTML) {
            lastMoverClockObj.innerHTML = "-"
        }
    }
    if (theObj = document.getElementById("GameNextMove")) {
        if (CurrentVar === 0 && showThisMove + 1 >= StartPly + PlyNumber) {
            text = '<SPAN CLASS="move notranslate">' + gameResult[currentGame] + '</SPAN>'
        } else if (typeof(Moves[showThisMove + 1]) == "undefined") {
            text = ""
        } else {
            text = printMoveText(showThisMove + 1, CurrentVar, (CurrentVar !== 0), !0, !1)
        }
        theObj.innerHTML = text
    }
    if (theObj = document.getElementById("GameNextVariations")) {
        text = '';
        if (commentsIntoMoveText) {
            var children = childrenVars(showThisMove + 1, CurrentVar);
            for (ii = 0; ii < children.length; ii++) {
                if (children[ii] !== CurrentVar) {
                    text += ' ' + printMoveText(showThisMove + 1, children[ii], (children[ii] !== 0), !0, !1)
                }
            }
        }
        theObj.innerHTML = text
    }
    if (theObj = document.getElementById("GameLastMove")) {
        if ((showThisMove >= StartPly) && Moves[showThisMove]) {
            text = printMoveText(showThisMove, CurrentVar, (CurrentVar !== 0), !0, !1)
        } else if (showThisMove === StartPly - 1) {
            text = '<SPAN CLASS="' + (CurrentVar > 0 ? 'variation' : 'move') + ' notranslate">' + (Math.floor((showThisMove + 1) / 2) + 1) + (((showThisMove + 1) % 2) ? "..." : ".") + '</SPAN>'
        } else {
            text = ''
        }
        theObj.innerHTML = text
    }
    if (theObj = document.getElementById("GameLastVariations")) {
        text = '';
        if (commentsIntoMoveText) {
            var siblings = childrenVars(showThisMove, HistVar[showThisMove]);
            for (ii = 0; ii < siblings.length; ii++) {
                if (siblings[ii] !== CurrentVar) {
                    text += ' ' + printMoveText(showThisMove, siblings[ii], (siblings[ii] !== 0), !0, !1)
                }
            }
        }
        theObj.innerHTML = text
    }
    if (showThisMove >= (StartPlyVar[CurrentVar] - 1)) {
        moveId = 'Var' + CurrentVar + 'Mv' + (showThisMove + 1);
        if (theObj = document.getElementById(moveId)) {
            theObj.className = (CurrentVar ? 'variation variationOn' : 'move moveOn') + ' notranslate'
        }
        highlightedMoveId = moveId;
        if (highlightOption) {
            var colFrom, rowFrom, colTo, rowTo;
            if ((showThisMove < StartPly) || HistNull[showThisMove]) {
                colFrom = rowFrom = -1;
                colTo = rowTo = -1
            } else {
                colFrom = HistCol[0][showThisMove] === undefined ? -1 : HistCol[0][showThisMove];
                rowFrom = HistRow[0][showThisMove] === undefined ? -1 : HistRow[0][showThisMove];
                colTo = HistCol[2][showThisMove] === undefined ? -1 : HistCol[2][showThisMove];
                rowTo = HistRow[2][showThisMove] === undefined ? -1 : HistRow[2][showThisMove]
            }
            highlightMove(colFrom, rowFrom, colTo, rowTo)
        }
    }
}

function ylcetSetKver()
{
    if (finalInt == 0 && jsSeasonInt == 5)
    {
        kver = "2037.00b 64-bit";
    }
    else if (finalInt == 0 && jsSeasonInt == 4)
    {
        kver = "2023.00 64-bit";
    }
    else
    {
        kver = 0;
    }
}

var lastmoveTime = 0;
var diffLastmoveTime = 0;

function ylcetSetLastmovetime(lastMoveMadeTime)
{
    var tmLoc = new Date();
    var offset = tmLoc.getTimezoneOffset() * 60;
    diffLastmoveTime = tmLoc.getTime() + offset - lastMoveMadeTime;
    diffLastmoveTime = parseInt(diffLastmoveTime/1000);
    //////console.log ("diffLastmoveTime is " + diffLastmoveTime + ", offset : " + offset);
}

var revLoaded = 0;

function getRevGame(strn)
{
   var strnx = strn;
   var myGame = strnx.match(/.*:(.*)/);
   console.log ("myGame:" + myGame[1]);
   return parseInt(myGame[1]);
}


function setRev()
{
    var revGame = document.getElementById('revgame');
    var gameN = getRevGame(revGame.innerHTML);

    if (totalGames && gameN > totalGames)
    {
        revGame.style.cursor = "auto";
        revGame.style.color = "white";
        revGame.style.textDecoration = "none";
    }
    else
    {
        revGame.style.cursor = "pointer";
        revGame.style.color = "red";
        revGame.style.textDecoration = "underline";
    }
}

function setLive()
{
    var revGame = document.getElementById('livegame');

    if (pgnUrl.match(/live.pgn/))
    {
        revGame.style.cursor = "auto";
        revGame.style.color = "#00bebe";
        revGame.style.textDecoration = "none";
        revGame.innerHTML = "Live";
    }
    else
    {
        revGame.style.cursor = "pointer";
        revGame.style.color = "#7fffa9";
        revGame.style.textDecoration = "underline";
        revGame.innerHTML = "Go Live"; 
    }
}

function setRevLive()
{
   setRev();
   setLive();    
}

function topFunction() 
{
    document.body.scrollTop = 0; // For Safari
    document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
} 

function myloadGame(gameN)
{
    topFunction();
    if (totalGames && gameN > totalGames)
    {
        return;
    }
    else
    {
        var theMatch = gameEvent[currentGame].match(/(.*?) Tournament/); 
        pgnName = theMatch[1] + ".pgn";
        gameN = parseInt(gameN);
        if (pgnUrl.match(/live.pgn/))
        {
            document.getElementById('load').style.visibility="visible";
            SetInitialGame(gameN-1);
            SetPgnUrl(pgnName);
            refreshPgnSource();
            RefreshBoard();
        }
        else
        {
            document.getElementById('load').style.visibility="visible";
            Init(gameN-1);
        }
    }
}

function myloadGameRev()
{
   var revGame = document.getElementById('revgame');
   var gameN = getRevGame(revGame.innerHTML);
   setRevLive();
   myloadGame(gameN);
   revLoaded = !revLoaded;
}

function myloadGameLive()
{
    if (pgnUrl.match(/live.pgn/))
    {
        return;
    }
    pgnName = "live.pgn";
    
    revLoaded = !revLoaded;
    document.getElementById('load').style.visibility="visible";
    SetInitialGame(0);
    SetPgnUrl(pgnName);
    refreshPgnSource();
    RefreshBoard();
}

function ylcetSettime() 
{
   if (gameResult[currentGame] == "*") 
   {
      return;
   }

   var theObx = null;
   var theOby = null;

   if (theObx = document.getElementById("blackClock")) {
      if (theOby = document.getElementById("blackClockl")) {
         //////console.log ("Came here");
         theOby.innerHTML = theObx.innerHTML; //asd
      }
   }

   if (theObx = document.getElementById("whiteClock")) {
      if (theOby = document.getElementById("whiteClockl")) {
         theOby.innerHTML = theObx.innerHTML;
      }
   }
}

function SetCrossTableFile(crosstable) {
    ctable = crosstable;
    csStr = "&c=" + ctable;
}

function SetScheduleFile(schedule) {
    stable = schedule;
    csStr += "&sc=" + stable;
}

function SetPVfile() {
    if (isArchiveFile()) {
        pvfile = 'archive/' + 'S' + jsSeasonInt;
        if (finalInt != 0) {
            pvfile += "/Finals";
        }
        else if (playOffInt != 0) {
            pvfile += "/Playoffs";
        }
        var gameStr = 0;
        if (!firstStart) {
            gameStr = currentGame + 1;
        } else {
            gameStr = initialGame;
        }
        pvfile += "/tlcv_file_arch" + "_" + gameStr + ".txt";
        //////console.log(pvfile + "," + currentGame + ",initialGame" + initialGame);
        var dirUrl = document.getElementById('directurl');
        if (dirUrl) {
            dirUrl.innerHTML = getLinkArchF(gameStr);
            dirUrl.href = getLinkArchF(gameStr);
        }
    }
}

function SetSeason(sname) 
{
    jsSeasonInt = parseInt(sname);
}

function SetFinals(fname)
{
    if (fname)
    {
        finalInt = parseInt(fname);
    }
}

function SetPlayOff(playoff)
{
    if (playoff)
    {
        playOffInt = parseInt(playoff);
    }
}

function gameDuration() {
    if (SchedtableLastModifiedHeader2 == nullDate) {
        myupdateSchedtable(0);
    } else {
        var timeDiff = getLastMod(SchedtableLastModifiedHeader2);
        timeDiff = parseInt(timeDiff);
        SchedendTime = parseInt(timeDiff);
    }
}

var currDepth = 1;
var depthArray = new Array();
var tempCurrDepth = 1;
var replace = 1;
var depthFound = new Array();

function replacer(match, p1, p2, p3, p4, p5, p6, offset, string) {
    if (p2.search(/.*:info.*/) == 0) {
        return 'asd';
    }
    p2 = p2.replace(/.*:(.*)/g, '$1');
    tempCurrDepth = parseInt(p2);
    p2 = "D" + p2;
    p3 = parseFloat(p3 / 100, 2);
    p3 = '[Ev: ' + p3 + ']';
    if (tempCurrDepth != currDepth) {
        replace = 1;
    } else {
        replace = 0;
    }
    p4 = parseFloat(p4 / 100).toFixed(1);
    p4 = new Date(p4 * 1000).toISOString().substr(11, 8);
    p4 = '(' + p4 + ')';
    ////////console.log("XX: currDepth::" + currDepth + ", tempCurrDepth" + tempCurrDepth);
    currDepth = tempCurrDepth;
    p1 = parseInt(p1);
    if (p1 > 1000) {
        p1 = parseFloat(p1 / 1000).toFixed(1) + "k";
    }
    p1 = 'TB:' + p1;
    p2 = '<font color="darkred">' + p2 + '</font>';
    p3 = '<font color="darkblue">' + p3 + '</font>';
    p4 = '<font color="darkgreen">' + p4 + '</font>';
    p1 = '<font color="darkbrown">' + p1 + '</font>';
    var strJ = [p2, p3, p4, p1].join(' ');
    strJ = strJ + '  ' + p6;
    return (strJ);
}

var strText = '';
var pvcurrentGame = 0;
var initialCheckPv = 0;
var resetMoves = 0;

function getBPv(decr) {
    var n = new Array();
    var prevM = 0;
    var res = strText.split("\n");
    var lastknownMove = 0;
    var didSomething = false;
    //////console.log ("Xame here");
    ////////console.log ("Entered into getBPv");
    if (resetMoves) {
        //////console.log("getBPv: We had to reset moves pvcurrentGame:" + pvcurrentGame + ",gameRound[currentGame]:" + gameRound[currentGame]);
        moves = [];
        resetMoves = 0;
    }
    if (pvcurrentGame == 0) {
        initialCheckPv = 30;
        pvcurrentGame = gameRound[currentGame];
    } else if (pvcurrentGame != gameRound[currentGame]) {
        //////console.log("New Round is " + gameRound[currentGame] + ", while check: " + pvcurrentGame);
        pvcurrentGame = gameRound[currentGame];
        if (!isArchiveFile()) {
            resetMoves = 1;
        } else {
            moves = [];
        }
        initialCheckPv = 30;
    } else if (pvcurrentGame == gameRound[currentGame]) {
        ////////console.log ("Curr Round isy " + gameRound[currentGame] + ", while check: " + pvcurrentGame);
        initialCheckPv = 0;
    }
    if (moves.length > 2) {
        lastknownMove = moves.length - 2;
    }

    for (var x = res.length - 1; x >= 0; x--) {
        var str = res[x].trim();
        var moveNo = str.match(/(.*?)#(.*?)::(.*)/)
        if (moveNo) {
            if (moveNo[2] < lastknownMove - 1 && !initialCheckPv) {
                ////////console.log ("not calculating lastmove:: " + moveNo[1]);
                break;
            }

            var moveX = parseInt(moveNo[2]);
            //////console.log ("arun: res inside:" + moveNo[2] + ", prev:" + prevM);
            if (prevM > 0 && (prevM != moveX)) {
                moves[prevM] = n.join('<br />');
                //////console.log (" last entry pushed:" + moveNo[2]);
                n = new Array();
                //////console.log ("arun: setting array for move#:" + prevM);
            }
            var tempX = moveX;
            if (moveX % 2 != 0) {
                tempX = moveX + 1;
            }
            var tempStr = moveNo[1] + '#' + (tempX / 2) + ' ' + moveNo[3];
            n.push(tempStr);
            prevM = moveX;
            didSomething = true;
        }
    }
    if (didSomething) {
        if (n.length > 0) {
            //////console.log ("arun: setting array for move#:" + gameRound[currentGame]);
            moves[prevM] = n.join('<br />');
        }
        //////console.log ("initialCheckPv is :" + initialCheckPv);
        if (moves[1] = null || moves[1] == undefined || initialCheckPv) {
            prevM = parseInt(prevM - 1);
            for (var x = prevM; x > 0; x--) {
                if (MoveComments[x] && MoveComments[x].trim() == 'book')
                    moves[x] = "book";
            }
        }
    }
    setEnginePv();
}

function myupdateCrosstableFromHttpRequest(this_http_request) {
    if (this_http_request.readyState != 4) {
        return
    }

    if (this_http_request.status == 404) {
        /* alert("no table found"); */
    }

    /*
    if (this_http_request.status == 304) {
    }
    */

   if (this_http_request.status == 200) 
   {
      CrosstableLastModifiedHeader1 = this_http_request.getResponseHeader("Last-Modified");
      drawStandingsNew(this_http_request.responseText, "#cross_divs"); /* pgnload */
      //drawCrosstableNew(this_http_request.responseText, "#info_divs1"); /* pgnload */
      crossLoaded = 1;
      return;
   }
}

function myupdateLiveSFPvFromHttpRequest(this_http_request) {
    if (this_http_request.readyState != 4) {
        return
    }

    if (this_http_request.status == 404) {
        /* alert("no table found"); */
    }

    /*
    if (this_http_request.status == 304) {
    }
    */

   if (this_http_request.status == 200) 
   {
      mysfliveevalLastModifiedHeader1 = this_http_request.getResponseHeader("Last-Modified");
      drawSfPV(this_http_request.responseText, "#sfeval"); /* pgnload */
      return;
   }
}

function myupdateLastMovetimeFromHttpRequest(this_http_request, realUpdate, isBlack) {
    if (this_http_request.readyState != 4) {
        return
    }

    if (this_http_request.status == 200) {
        ylcetSetLastmovetime(Date.parse(this_http_request.getResponseHeader("Last-Modified")));
    }
}

function myupdateLastMovetime() {
    var isArchiveTemp = isArchiveFile();

    if (crossLoaded && isArchiveTemp && LastMovetimeLastModifiedHeader1 != nullDate) {
        return;
    }

    var http_request = !1;
    if (window.XMLHttpRequest) {
        http_request = new XMLHttpRequest()
    } else if (window.ActiveXObject) {
        try {
            http_request = new ActiveXObject("Msxml2.XMLHTTP")
        } catch (e) {
            try {
                http_request = new ActiveXObject("Microsoft.XMLHTTP")
            } catch (e) {
                return !1
            }
        }
    }
    if (!http_request) {
        return !1
    }
    http_request.onreadystatechange = function() {
        myupdateLastMovetimeFromHttpRequest(http_request)
    };
    try {
        var randomizer2 = "";
        randomizer2 = "?noCache=" + (0x1000000000 + Math.floor((Math.random() * 0xF000000000))).toString(16).toUpperCase()
        http_request.open("GET", pgnUrl + randomizer2);
        http_request.setRequestHeader("If-Modified-Since", LastMovetimeLastModifiedHeader1);
        http_request.send(null)
    } catch (e) {
        return !1
    }
    return !0
}

function myupdatePvFromHttpRequestB(this_http_request, realUpdate, isBlack) {
    if (this_http_request.readyState != 4) {
        return
    }

    if (this_http_request.status == 404) {
        /* alert("no table found"); */
    }

    if (this_http_request.status == 304) {
        /* alert("no update found"); */
        ////////console.log ("hearder not updated:" + myupdatePvHeader1);
    }

    if (this_http_request.status == 200) {
        myupdatePvHeader1 = this_http_request.getResponseHeader("Last-Modified");
        strText = this_http_request.responseText;
        //////console.log ("getBPv is " + strText);
        getBPv(strText);
    }
}

function myupdateSchedtableFromHttpRequest(this_http_request, realUpdate) 
{
   if (this_http_request.readyState != 4) {
      return
   }

   if (this_http_request.status == 404) {
      /* alert("no table found"); */
   }

   if (this_http_request.status == 304) {
      /* alert("no update found"); */
   }

   if (this_http_request.status == 200) 
   {
      SchedtableLastModifiedHeader2 = this_http_request.getResponseHeader("Last-Modified");
      var timeDiff = getLastMod(SchedtableLastModifiedHeader2);
      timeDiff = parseInt(timeDiff);
      SchedendTime = parseInt(timeDiff);
      if (realUpdate) 
      {
         SchedtableLastModifiedHeader1 = this_http_request.getResponseHeader("Last-Modified");
         tempDom = $('<div></div>').append($.parseHTML(this_http_request.responseText));
         $(tempDom).attr('id', 'tempDom');
         buildHtmlTable(this_http_request.responseText, "#sched_divs");
      }
   }
}

function getLastMod(SchedtableLastModifiedHeader2) {
    var lastMod = Date.parse(SchedtableLastModifiedHeader2);
    var newDate = new Date(SchedtableLastModifiedHeader2);
    var now = new Date();
    return ((now.getTime() - newDate.getTime()));
}

function myupdateSchedtable(realUpdate) {
    var isArchiveTemp = isArchiveFile();

    if (schedLoaded && isArchiveTemp && SchedtableLastModifiedHeader1 != nullDate) {
        return;
    }

    var http_request = !1;
    if (window.XMLHttpRequest) {
        http_request = new XMLHttpRequest()
    } else if (window.ActiveXObject) {
        try {
            http_request = new ActiveXObject("Msxml2.XMLHTTP")
        } catch (e) {
            try {
                http_request = new ActiveXObject("Microsoft.XMLHTTP")
            } catch (e) {
                return !1
            }
        }
    }
    if (!http_request) {
        return !1
    }
    http_request.onreadystatechange = function() {
        myupdateSchedtableFromHttpRequest(http_request, realUpdate)
    };
    try {
        var randomizer2 = "";
        randomizer2 = "?noCache=" + (0x1000000000 + Math.floor((Math.random() * 0xF000000000))).toString(16).toUpperCase()
        stable = "schedule.json";
        http_request.open("GET", stable + randomizer2);
        http_request.setRequestHeader("If-Modified-Since", SchedtableLastModifiedHeader1);
        http_request.send(null)
    } catch (e) {
        return !1
    }
    return !0
}

function myupdateCrosstable() {
    var isArchiveTemp = isArchiveFile();

    if (crossLoaded && isArchiveTemp && CrosstableLastModifiedHeader1 != nullDate) {
        return;
    }

    var http_request = !1;
    if (window.XMLHttpRequest) {
        http_request = new XMLHttpRequest()
    } else if (window.ActiveXObject) {
        try {
            http_request = new ActiveXObject("Msxml2.XMLHTTP")
        } catch (e) {
            try {
                http_request = new ActiveXObject("Microsoft.XMLHTTP")
            } catch (e) {
                return !1
            }
        }
    }
    if (!http_request) {
        return !1
    }
    http_request.onreadystatechange = function() {
        myupdateCrosstableFromHttpRequest(http_request)
    };
    try {
        var randomizer2 = "";
        randomizer2 = "?noCache=" + (0x1000000000 + Math.floor((Math.random() * 0xF000000000))).toString(16).toUpperCase()
        http_request.open("GET", "crosstable.json" + randomizer2);
        http_request.setRequestHeader("If-Modified-Since", CrosstableLastModifiedHeader1);
        http_request.send(null)
    } catch (e) {
        return !1
    }
    return !0
}

function myupdateLiveSf() {
    var http_request = !1;
    if (window.XMLHttpRequest) {
        http_request = new XMLHttpRequest()
    } else if (window.ActiveXObject) {
        try {
            http_request = new ActiveXObject("Msxml2.XMLHTTP")
        } catch (e) {
            try {
                http_request = new ActiveXObject("Microsoft.XMLHTTP")
            } catch (e) {
                return !1
            }
        }
    }
    if (!http_request) {
        return !1
    }
    http_request.onreadystatechange = function() {
        myupdateLiveSFPvFromHttpRequest(http_request)
    };
    try {
        var randomizer2 = "";
        randomizer2 = "?noCache=" + (0x1000000000 + Math.floor((Math.random() * 0xF000000000))).toString(16).toUpperCase()
        http_request.open("GET", "data.json" + randomizer2);
        http_request.setRequestHeader("If-Modified-Since", mysfliveevalLastModifiedHeader1);
        http_request.send(null)
    } catch (e) {
        return !1
    }
    return !0
}

function myupdatePv(realUpdate, isBlack) {
    var nomoves = document.getElementById('white_pv');
    if (!nomoves) {
        return;
    }

    var http_request = !1;
    if (window.XMLHttpRequest) {
        http_request = new XMLHttpRequest()
    } else if (window.ActiveXObject) {
        try {
            http_request = new ActiveXObject("Msxml2.XMLHTTP")
        } catch (e) {
            try {
                http_request = new ActiveXObject("Microsoft.XMLHTTP")
            } catch (e) {
                return !1
            }
        }
    }
    if (!http_request) {
        return !1
    }
    http_request.onreadystatechange = function() {
        myupdatePvFromHttpRequestB(http_request, realUpdate, isBlack);
    };
    try {
        var randomizer2 = "";
        randomizer2 = "?noCache=" + (0x1000000000 + Math.floor((Math.random() * 0xF000000000))).toString(16).toUpperCase()
        http_request.open("GET", pvfile + randomizer2);
        http_request.setRequestHeader("If-Modified-Since", myupdatePvHeader1);
        http_request.send(null)
    } catch (e) {
        return !1
    }
    return !0
}

function ResetGlobVar() {
    SchedtableLastModifiedHeader1 = (new Date(0)).toUTCString();
    SchedtableLastModifiedHeader2 = (new Date(0)).toUTCString();
    CrosstableLastModifiedHeader1 = (new Date(0)).toUTCString();
    LiveBroadcastLastModifiedHeader = (new Date(0)).toUTCString();
    LastMovetimeLastModifiedHeader1  = (new Date(0)).toUTCString();
    firstStart = false;
}

function SetHighlightOption(on) {
    highlightOption = on
}

function ylcetHighLight() {
    for (iiv = 0; iiv <= 7; ++iiv) {
        for (jjv = 0; jjv <= 7; ++jjv) {
            highlightSquare(jjv, iiv, 0);
        }
    }
}

function SetHighlight(on) {
    SetHighlightOption(on);
    if (on) {
        ylcetHighLight();
        HighlightLastMove()
    } else {
        highlightMove(-1, -1, -1, -1)
    }
}
var colFromHighlighted = -1;
var rowFromHighlighted = -1;
var colToHighlighted = -1;
var rowToHighlighted = -1;

function highlightMove(colFrom, rowFrom, colTo, rowTo) {
    highlightSquare(colFromHighlighted, rowFromHighlighted, !1);
    highlightSquare(colToHighlighted, rowToHighlighted, !1);
    if (highlightSquare(colFrom, rowFrom, !0)) {
        colFromHighlighted = colFrom;
        rowFromHighlighted = rowFrom
    } else {
        colFromHighlighted = rowFromHighlighted = -1
    }
    if (highlightSquare(colTo, rowTo, !0)) {
        colToHighlighted = colTo;
        rowToHighlighted = rowTo
    } else {
        colToHighlighted = rowToHighlighted = -1
    }
}

function highlightSquare(col, row, on) {
    if ((col === undefined) || (row === undefined)) {
        return !1
    }
    if (!SquareOnBoard(col, row)) {
        return !1
    }
    var trow = IsRotated ? row : 7 - row;
    var tcol = IsRotated ? 7 - col : col;
    var theObj = document.getElementById('tcol' + tcol + 'trow' + trow);
    if (!theObj) {
        return !1
    }
    if (on) {
        theObj.className = (trow + tcol) % 2 === 0 ? "highlightWhiteSquare" : "highlightBlackSquare"
    } else {
        theObj.className = (trow + tcol) % 2 === 0 ? "whiteSquare" : "blackSquare"
    }
    return !0
}
var undoStackMax = 1000;
var undoStackGame = new Array(undoStackMax);
var undoStackVar = new Array(undoStackMax);
var undoStackPly = new Array(undoStackMax);
var undoStackStart = 0;
var undoStackCurrent = 0;
var undoStackEnd = 0;
var undoRedoInProgress = !1;

function undoStackReset() {
    undoStackGame = new Array(undoStackMax);
    undoStackVar = new Array(undoStackMax);
    undoStackPly = new Array(undoStackMax);
    undoStackStart = undoStackCurrent = undoStackEnd = 0
}

function undoStackStore() {
    if (undoRedoInProgress) {
        return !1
    }
    if ((undoStackStart === undoStackCurrent) || (currentGame !== undoStackGame[undoStackCurrent]) || (CurrentVar !== undoStackVar[undoStackCurrent]) || (CurrentPly !== undoStackPly[undoStackCurrent])) {
        undoStackCurrent = (undoStackCurrent + 1) % undoStackMax;
        undoStackGame[undoStackCurrent] = currentGame;
        undoStackVar[undoStackCurrent] = CurrentVar;
        undoStackPly[undoStackCurrent] = CurrentPly;
        undoStackEnd = undoStackCurrent;
        if (undoStackStart === undoStackCurrent) {
            undoStackStart = (undoStackStart + 1) % undoStackMax
        }
    }
    return !0
}

function undoStackUndo() {
    if ((undoStackCurrent - 1 + undoStackMax) % undoStackMax === undoStackStart) {
        return !1
    }
    undoRedoInProgress = !0;
    undoStackCurrent = (undoStackCurrent - 1 + undoStackMax) % undoStackMax;
    if (undoStackGame[undoStackCurrent] !== currentGame) {
        Init(undoStackGame[undoStackCurrent])
    }
    GoToMove(undoStackPly[undoStackCurrent], undoStackVar[undoStackCurrent]);
    undoRedoInProgress = !1;
    return !0
}

function undoStackRedo() {
    if (undoStackCurrent === undoStackEnd) {
        return !1
    }
    undoRedoInProgress = !0;
    undoStackCurrent = (undoStackCurrent + 1) % undoStackMax;
    if (undoStackGame[undoStackCurrent] !== currentGame) {
        Init(undoStackGame[undoStackCurrent])
    }
    GoToMove(undoStackPly[undoStackCurrent], undoStackVar[undoStackCurrent]);
    undoRedoInProgress = !1;
    return !0
}

function fixCommonPgnMistakes(text) {
    text = text.replace(/[\u00A0\u180E\u2000-\u200A\u202F\u205F\u3000]/g, " ");
    text = text.replace(/\u00BD/g, "1/2");
    text = text.replace(/[\u2010-\u2015]/g, "-");
    text = text.replace(/\u2024/g, ".");
    text = text.replace(/[\u2025-\u2026]/g, "...");
    text = text.replace(/\\"/g, "'");
    return text
}

function fullPgnGame(gameNum) {
    var res = pgnHeader[gameNum] ? pgnHeader[gameNum].replace(/^[^[]*/g, "") : "";
    res = res.replace(/\[\s*(\w+)\s*"([^"]*)"\s*\][^[]*/g, '[$1 "$2"]\n');
    res += "\n";
    res += pgnGame[gameNum] ? pgnGame[gameNum].replace(/(^[\s]*|[\s]*$)/g, "") : "";
    return res
}
var prevpgnText = '';

function pgnGameFromPgnText(pgnText) {
    var headMatch, prevHead, newHead, startNew, afterNew, lastOpen, checkedGame, validHead;
    pgnText = simpleHtmlentities(fixCommonPgnMistakes(pgnText));
    if (prevpgnText == pgnText) {
        return;
    } else {
        prevpgnText = pgnText;
    }

    pgnText = pgnText.replace(/(^|\n)%.*(\n|$)/g, "\n");
    numberOfGames = 0;
    checkedGame = "";
    while (headMatch = pgnHeaderBlockRegExp.exec(pgnText)) {
        newHead = headMatch[0];
        startNew = pgnText.indexOf(newHead);
        afterNew = startNew + newHead.length;
        if (prevHead) {
            checkedGame += pgnText.slice(0, startNew);
            validHead = ((lastOpen = checkedGame.lastIndexOf("{")) < 0) || (checkedGame.lastIndexOf("}")) > lastOpen;
            if (validHead) {
                pgnHeader[numberOfGames] = prevHead;
                pgnGame[numberOfGames++] = checkedGame;
                checkedGame = ""
            } else {
                checkedGame += newHead
            }
        } else {
            validHead = !0
        }
        if (validHead) {
            prevHead = newHead
        }
        pgnText = pgnText.slice(afterNew)
    }
    if (prevHead) {
        pgnHeader[numberOfGames] = prevHead;
        checkedGame += pgnText;
        pgnGame[numberOfGames++] = checkedGame
    }
    console.log ("numberOfGames:" + numberOfGames);
    return (numberOfGames > 0)
}

var pgnLoaded = 0;

function pgnGameFromHttpRequest(httpResponseData) {
    if (pgnLoaded)
    {
       diffLastmoveTime = 0;
    }
    else
       pgnLoaded = 1;
    return pgnGameFromPgnText(httpResponseData)
}
var http_request_last_processed_id = 0;

function updatePgnFromHttpRequest(this_http_request, this_http_request_id) {
    var res = LOAD_PGN_FAIL;
    if (this_http_request.readyState != 4) {
        return
    }
    if (this_http_request_id < http_request_last_processed_id) {
        return
    } else {
        http_request_last_processed_id = this_http_request_id
    }
    if ((this_http_request.status == 200) || (this_http_request.status === 0) || (this_http_request.status == 304)) {
        if (this_http_request.status == 304) {
            if (LiveBroadcastDelay > 0) {
                res = LOAD_PGN_UNMODIFIED
            } else {
                myAlert('error: unmodified PGN URL when not in live mode')
            }
        } else if (window.opera && (!this_http_request.responseText) && (this_http_request.status === 0)) {
            this_http_request.abort();
            res = LOAD_PGN_UNMODIFIED
        } else if (!this_http_request.responseText) {
            myAlert('error: no data received from PGN URL\n' + pgnUrl, !0)
        } else if (!pgnGameFromHttpRequest(this_http_request.responseText)) {
            myAlert('error: no games found at PGN URL\n' + pgnUrl, !0)
        } else {
            if (LiveBroadcastDelay > 0) {
                LiveBroadcastLastReceivedLocal = (new Date()).toLocaleString();
                if (LiveBroadcastLastModifiedHeader = this_http_request.getResponseHeader("Last-Modified")) {
                    LiveBroadcastLastModified = new Date(LiveBroadcastLastModifiedHeader)
                } else {
                    LiveBroadcastLastModified_Reset()
                }
            }
            res = LOAD_PGN_OK
        }
    } else {
        myAlert('error: failed reading PGN URL\n' + pgnUrl, !0)
    }
    if (LiveBroadcastDemo && (res == LOAD_PGN_UNMODIFIED)) {
        res = LOAD_PGN_OK
    }
    loadPgnCheckingLiveStatus(res);
    document.getElementById('load').style.visibility = "hidden";
    document.getElementById('universal').style.visibility = "visible";
}
var LOAD_PGN_FAIL = 0;
var LOAD_PGN_OK = 1;
var LOAD_PGN_UNMODIFIED = 2;

function loadPgnCheckingLiveStatus(res) {
    switch (res) {
        case LOAD_PGN_OK:
            ////console.log ("herexx");
            if (LiveBroadcastDelay > 0) {
                firstStart = !0;
                var oldParseLastMoveError = ParseLastMoveError;
                if (!LiveBroadcastStarted) {
                    ////console.log ("yyy1");
                    LiveBroadcastStarted = !0
                } else 
                    {
                    if (currentGame == 0)
                    {
                        currentGame = initialGame;
                    }
                    var oldWhite = gameWhite[currentGame];
                    var oldBlack = gameBlack[currentGame];
                    var oldEvent = gameEvent[currentGame];
                    var oldRound = gameRound[currentGame];
                    var oldSite = gameSite[currentGame];
                    var oldDate = gameDate[currentGame];
                    initialGame = currentGame + 1;
                    LiveBroadcastOldCurrentVar = CurrentVar;
                    LiveBroadcastOldCurrentPly = CurrentPly;
                    LiveBroadcastOldCurrentPlyLast = (CurrentVar === 0 && CurrentPly === StartPlyVar[0] + PlyNumberVar[0]);
                    var oldAutoplay = isAutoPlayOn;
                    if (isAutoPlayOn) {
                        SetAutoPlay(!1)
                    }
                    LoadGameHeaders();
                    LiveBroadcastFoundOldGame = !1;
                    for (var ii = 0; ii < numberOfGames; ii++) {
                        LiveBroadcastFoundOldGame = (gameWhite[ii] == oldWhite) && (gameBlack[ii] == oldBlack) && (gameEvent[ii] == oldEvent) && (gameRound[ii] == oldRound) && (gameSite[ii] == oldSite) && (gameDate[ii] == oldDate);
                        if (LiveBroadcastFoundOldGame) {
                            break
                        }
                    }
                    if (LiveBroadcastFoundOldGame) {
                        initialGame = ii + 1
                    }
                    if (LiveBroadcastFoundOldGame) {
                        var oldInitialVariation = initialVariation;
                        var oldInitialHalfmove = initialHalfmove;
                        initialVariation = CurrentVar;
                        if (LiveBroadcastSteppingMode) {
                            initialHalfmove = (LiveBroadcastOldCurrentPlyLast || oldParseLastMoveError) ? LiveBroadcastOldCurrentPly + 1 : LiveBroadcastOldCurrentPly
                        } else {
                            initialHalfmove = (LiveBroadcastOldCurrentPlyLast || oldParseLastMoveError) ? "end" : LiveBroadcastOldCurrentPly
                        }
                    }
                }
            }
            undoStackReset();
            Init();
            if (LiveBroadcastDelay > 0) {
                if (LiveBroadcastFoundOldGame) {
                    initialHalfmove = oldInitialHalfmove;
                    initialVariation = oldInitialVariation
                }
                checkLiveBroadcastStatus()
            }
            customFunctionOnPgnTextLoad();
            if (LiveBroadcastDelay > 0) {
                if (LiveBroadcastFoundOldGame) {
                    if (LiveBroadcastSteppingMode) {
                        if (oldAutoplay || LiveBroadcastOldCurrentPlyLast || oldParseLastMoveError) {
                            SetAutoPlay(!0)
                        }
                    } else {
                        if (oldAutoplay) {
                            SetAutoPlay(!0)
                        }
                    }
                }
            }
            break;
        case LOAD_PGN_UNMODIFIED:
            if (LiveBroadcastDelay > 0) {
                checkLiveBroadcastStatus()
            }
            break;
        case LOAD_PGN_FAIL:
        default:
            if (LiveBroadcastDelay === 0) {
                pgnGameFromPgnText(alertPgn);
                undoStackReset();
                Init();
                customFunctionOnPgnTextLoad()
            } else {
                if (!LiveBroadcastStarted) {
                    pgnGameFromPgnText(LiveBroadcastPlaceholderPgn);
                    firstStart = !0;
                    undoStackReset();
                    Init();
                    checkLiveBroadcastStatus();
                    customFunctionOnPgnTextLoad()
                } else {
                    checkLiveBroadcastStatus()
                }
            }
            break
    }
    if (LiveBroadcastDelay > 0) {
        restartLiveBroadcastTimeout()
    }
}
var http_request_last_id = 0;

function loadPgnFromPgnUrl(pgnUrl) {
    LiveBroadcastLastRefreshedLocal = (new Date()).toLocaleString();
    var http_request = !1;
    if (window.XMLHttpRequest) {
        http_request = new XMLHttpRequest();
        if (http_request.overrideMimeType) {
            http_request.overrideMimeType("text/plain")
        }
    } else if (window.ActiveXObject) {
        try {
            http_request = new ActiveXObject("Msxml2.XMLHTTP")
        } catch (e) {
            try {
                http_request = new ActiveXObject("Microsoft.XMLHTTP")
            } catch (e) {
                myAlert('error: XMLHttpRequest unavailable for PGN URL\n' + pgnUrl, !0);
                return !1
            }
        }
    }
    if (!http_request) {
        myAlert('error: failed creating XMLHttpRequest for PGN URL\n' + pgnUrl, !0);
        return !1
    }
    var http_request_id = http_request_last_id++;
    http_request.onreadystatechange = function() {
        updatePgnFromHttpRequest(http_request, http_request_id)
    };
    try {
        var randomizer = "";
        if ((LiveBroadcastDelay > 0) && (pgnUrl.indexOf("?") == -1) && (pgnUrl.indexOf("#") == -1)) {
            randomizer = "?noCache=" + (0x1000000000 + Math.floor((Math.random() * 0xF000000000))).toString(16).toUpperCase()
        }
        http_request.open("GET", pgnUrl + randomizer);
        if (LiveBroadcastDelay > 0) {
            http_request.setRequestHeader("If-Modified-Since", LiveBroadcastLastModifiedHeader)
        }
        http_request.send(null)
    } catch (e) {
        myAlert('error: failed sending XMLHttpRequest for PGN URL\n' + pgnUrl, !0);
        return !1
    }
    return !0
}

function SetPgnUrl(url) {
    LiveBroadcastLastModified_Reset();
    pgnUrl = url;
}

function SetBoardFlip(flip) {
    flipBoard = parseFloat(flip);
    IsRotated = flipBoard;
    FlipBoard();
}

function LiveBroadcastLastModified_Reset() {
    LiveBroadcastLastModified = new Date(0);
    LiveBroadcastLastModifiedHeader = LiveBroadcastLastModified.toUTCString()
}

function LiveBroadcastLastReceivedLocal_Reset() {
    LiveBroadcastLastReceivedLocal = 'unavailable'
}

function LiveBroadcastLastModified_ServerTime() {
    return LiveBroadcastLastModified.getTime() === 0 ? 'unavailable' : LiveBroadcastLastModifiedHeader
}

function pauseLiveBroadcast() {
    if (LiveBroadcastDelay === 0) {
        return
    }
    LiveBroadcastPaused = !0;
    clearTimeout(LiveBroadcastInterval);
    LiveBroadcastInterval = null
}

function restartLiveBroadcast() {
    if (LiveBroadcastDelay === 0) {
        return
    }
    LiveBroadcastPaused = !1;
    refreshPgnSource()
}

function checkLiveBroadcastStatus() {
    var theTitle, theObj, ii;
    var tick = "&nbsp;" + (LiveBroadcastTicker % 2 ? "<>" : "><") + "&nbsp;";
    if (LiveBroadcastDelay === 0) {
        return
    }
    if (LiveBroadcastStarted === !1 || typeof(pgnHeader) == "undefined" || (numberOfGames == 1 && gameEvent[0] == LiveBroadcastPlaceholderEvent)) {
        LiveBroadcastEnded = !1;
        LiveBroadcastGamesRunning = 0;
        LiveBroadcastStatusString = "0 " + tick + " 0";
        theTitle = "live broadcast yet to start"
    } else {
        var lbgr = 0;
        for (ii = 0; ii < numberOfGames; ii++) {
            if (gameResult[ii].indexOf('*') >= 0) {
                lbgr++
            }
        }
        LiveBroadcastEnded = (lbgr === 0);
        LiveBroadcastGamesRunning = lbgr;
        LiveBroadcastStatusString = lbgr + " " + tick + " " + numberOfGames;
        theTitle = LiveBroadcastEnded ? "live broadcast ended" : lbgr + " live game" + (lbgr > 1 ? "s" : "") + " out of " + numberOfGames
    }
    if (theObj = document.getElementById("GameLiveStatus")) {
        theObj.innerHTML = LiveBroadcastStatusString;
        theObj.title = theTitle
    }
    if (theObj = document.getElementById("GameLiveLastRefreshed")) {
        theObj.innerHTML = LiveBroadcastLastRefreshedLocal
    }
    if (theObj = document.getElementById("GameLiveLastReceived")) {
        theObj.innerHTML = LiveBroadcastLastReceivedLocal
    }
    if (theObj = document.getElementById("GameLiveLastModifiedServer")) {
        theObj.innerHTML = LiveBroadcastLastModified_ServerTime()
    }
    customFunctionOnCheckLiveBroadcastStatus()
}

function restartLiveBroadcastTimeout() {
    if (LiveBroadcastDelay === 0) {
        return
    }
    if (LiveBroadcastInterval) {
        clearTimeout(LiveBroadcastInterval);
        LiveBroadcastInterval = null
    }
    if ((!LiveBroadcastEnded) && (!LiveBroadcastPaused)) {
        LiveBroadcastInterval = setTimeout("refreshPgnSource()", LiveBroadcastDelay * 60000)
    }
    LiveBroadcastTicker++
}
var LiveBroadcastFoundOldGame = !1;
var LiveBroadcastOldCurrentVar;
var LiveBroadcastOldCurrentPly;
var LiveBroadcastOldCurrentPlyLast = !1;

function refreshPgnSource() {
    if (LiveBroadcastDelay === 0) {
        return
    }
    if (LiveBroadcastInterval) {
        clearTimeout(LiveBroadcastInterval);
        LiveBroadcastInterval = null
    }
    if (LiveBroadcastDemo) {
        var newPly, addedPly = 0;
        for (var ii = 0; ii < numberOfGames; ii++) {
            newPly = [3, 2, 2, 2, 1, 1, 1, 1, 1, 1, 1, 1][Math.floor(20 * Math.random())] || 0;
            if (gameDemoMaxPly[ii] <= gameDemoLength[ii]) {
                gameDemoMaxPly[ii] += newPly;
                addedPly += newPly
            }
        }
        if (addedPly > 0) {
            LiveBroadcastLastReceivedLocal = (new Date()).toLocaleString()
        }
    }
    if (pgnUrl) {
        loadPgnFromPgnUrl(pgnUrl)
    } else if (document.getElementById("pgnText")) {
        loadPgnFromTextarea("pgnText")
    } else {
        pgnGameFromPgnText(alertPgn);
        undoStackReset();
        Init();
        customFunctionOnPgnTextLoad();
        myAlert('error: missing PGN URL location and pgnText object in the HTML file', !0)
    }
}

function loadPgnFromTextarea(textareaId) {
    var res = LOAD_PGN_FAIL,
        text, theObj;
    LiveBroadcastLastRefreshedLocal = (new Date()).toLocaleString();
    if (!(theObj = document.getElementById(textareaId))) {
        myAlert('error: missing ' + textareaId + ' textarea object in the HTML file', !0)
    } else {
        if (document.getElementById(textareaId).tagName.toLowerCase() == "textarea") {
            text = document.getElementById(textareaId).value
        } else {
            text = document.getElementById(textareaId).innerHTML;
            if (text.indexOf('\n') < 0) {
                text = text.replace(/((\[[^\[\]]*\]\s*)+)/g, "\n$1\n")
            }
            if (text.indexOf('"') < 0) {
                text = text.replace(/(&quot;)/g, '"')
            }
        }
        if (pgnHeaderTagRegExp.test(text) === !1) {
            text = emptyPgnHeader + "\n" + text
        }
        if (pgnGameFromPgnText(text)) {
            res = LOAD_PGN_OK;
            LiveBroadcastLastReceivedLocal = (new Date()).toLocaleString()
        } else {
            myAlert('error: no games found in ' + textareaId + ' object in the HTML file')
        }
    }
    loadPgnCheckingLiveStatus(res)
}

function createBoard() {
    var theObu = document.getElementById("GameBoard");
    if ((theObu) && ((currentPage == "live.php") || (currentPage == "archive.php"))) {
        theObu.innerHTML = '<span>Please wait, the chess board is loading</span></br></br><img src="img/thinking5.gif" style="border:1px solid #808080"/>';
        theObu.style.padding = "60px 30px 0 30px";
        theObu.style.height = "324px";
        theObu.style.width = "324px";
        theObu.style.textAlign = "center"
    }
    if (pgnUrl) {
        loadPgnFromPgnUrl(pgnUrl)
    } else if (document.getElementById("pgnText")) {
        loadPgnFromTextarea("pgnText")
    } else {
        pgnGameFromPgnText(alertPgn);
        undoStackReset();
        Init();
        customFunctionOnPgnTextLoad();
        myAlert('error: missing PGN URL location or pgnText in the HTML file', !0)
    }
}

function setCurrentGameFromInitialGame() {
    switch (initialGame) {
        case "first":
            currentGame = 0;
            break;
        case "last":
            currentGame = numberOfGames - 1;
            break;
        case "random":
            currentGame = Math.floor(Math.random() * numberOfGames);
            break;
        default:
            if (isNaN(parseInt(initialGame, 10))) {
                currentGame = gameNumberSearchPgn(initialGame, !1, !0);

                if (!currentGame) {
                    currentGame = 0
                }
            } else {
                initialGame = parseInt(initialGame, 10);
                initialGame = initialGame < 0 ? -Math.floor(-initialGame) : Math.floor(initialGame);
                if (initialGame < -numberOfGames) {
                    currentGame = 0
                } else if (initialGame < 0) {
                    currentGame = numberOfGames + initialGame
                } else if (initialGame === 0) {
                    currentGame = Math.floor(Math.random() * numberOfGames)
                } else if (initialGame <= numberOfGames) {
                    currentGame = (initialGame - 1)
                } else {
                    currentGame = numberOfGames - 1
                }
            }
            break
    }
}

function GoToInitialHalfmove() {
    var iv, ih;
    if (initialVariation < 0) {
        iv = Math.max(numberOfVars + initialVariations, 0)
    } else {
        iv = Math.min(initialVariation, numberOfVars - 1)
    }
    switch (initialHalfmove) {
        case "start":
        case "startplusone":
            GoToMove(StartPly, iv);
            if (initialHalfmove == "startplusone") {
                MoveForward(1)
            }
            break;
        case "startplusfive":
            GoToMove(StartPly, iv);
            if (initialHalfmove == "startplusfive") {
                MoveForward(5)
            }
            break;
        case "end":
            GoToMove(StartPlyVar[iv] + PlyNumberVar[iv], iv);
            break;
        case "random":
            GoToMove(StartPlyVar[iv] + Math.floor(Math.random() * (StartPlyVar[iv] + PlyNumberVar[iv])), iv);
            break;
        case "comment":
        case "commentplusone":
        case "variation":
            GoToMove(StartPly, iv);
            MoveToNextComment(initialHalfmove == "variation");
            if (initialHalfmove == "commentplusone") {
                MoveForward(1)
            }
            break;
        default:
            if (isNaN(initialHalfmove = parseInt(initialHalfmove, 10))) {
                initialHalfmove = 0
            }
            if (initialHalfmove < 0) {
                ih = Math.max(StartPlyVar[iv] + PlyNumberVar[iv] + 1 + initialHalfmove, 0)
            } else {
                ih = Math.min(initialHalfmove, StartPlyVar[iv] + PlyNumberVar[iv])
            }
            GoToMove(ih, iv);
            break
    }
}

function Init(nextGame) {
    //console.log ("numberOfGames is " + numberOfGames + "nextGame:" + nextGame);
    if (nextGame !== undefined) {
        if ((!isNaN(nextGame)) && (nextGame >= 0) && (nextGame < numberOfGames)) {
            currentGame = parseInt(nextGame, 10)
        } else {
            return
        }
    }
    //console.log ("currentGame is: " + currentGame);
    if (isAutoPlayOn) {
        SetAutoPlay(!1)
    }
    InitImages();
    SetPVfile();
    if (isArchiveFile()) {
        myupdatePvHeader1 = (new Date(0)).toUTCString();
        myupdatePv();
    }
    if (firstStart) {
        LoadGameHeaders();
        setCurrentGameFromInitialGame()
    }
    if ((gameSetUp[currentGame] !== undefined) && (gameSetUp[currentGame] != "1")) {
        InitFEN()
    } else {
        InitFEN(gameFEN[currentGame])
    }
    OpenGame(currentGame);
    CurrentPly = StartPly;
    if (firstStart || alwaysInitialHalfmove) {
        GoToInitialHalfmove();
        setTimeout("autoScrollToCurrentMoveIfEnabled();", Math.min(666, 0.9 * Delay))
    } else {
        synchMoves();
        RefreshBoard();
        HighlightLastMove();
        autoScrollToCurrentMoveIfEnabled();
        customFunctionOnMove();
        if (typeof(engineWinOnMove) == "function") {
            engineWinOnMove()
        }
    }
    if ((firstStart) && (autostartAutoplay)) {
        SetAutoPlay(!0)
    }
    firstStart = !1;
    customFunctionOnPgnGameLoad();
    initialVariation = 0;
}

function myAlertFEN(FenString, text) {
    myAlert("error: invalid FEN in game " + (currentGame + 1) + ": " + text + "\n" + FenString, !0)
}

function InitFEN(startingFEN) {
    var ii, jj, cc, color, castlingRookCol, fullMoveNumber;
    var FenString = typeof(startingFEN) != "string" ? FenStringStart : startingFEN.replace(/\\/g, "/").replace(/[^a-zA-Z0-9\s\/-]/g, " ").replace(/(^\s*|\s*$)/g, "").replace(/\s+/g, " ");
    for (ii = 0; ii < 8; ++ii) {
        for (jj = 0; jj < 8; ++jj) {
            Board[ii][jj] = 0
        }
    }
    StartPly = 0;
    MoveCount = StartPly;
    MoveColor = StartPly % 2;
    var newEnPassant = !1;
    var newEnPassantCol;
    CastlingLong = [0, 0];
    CastlingShort = [7, 7];
    InitialHalfMoveClock = 0;
    HistVar[StartPly] = 0;
    HistNull[StartPly] = 0;
    if (FenString == FenStringStart) {
        for (color = 0; color < 2; color++) {
            PieceType[color] = [1, 2, 5, 5, 4, 4, 3, 3, 6, 6, 6, 6, 6, 6, 6, 6];
            PieceCol[color] = [4, 3, 1, 6, 2, 5, 0, 7, 0, 1, 2, 3, 4, 5, 6, 7];
            PieceMoveCounter[color] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
            PieceRow[color] = color ? [7, 7, 7, 7, 7, 7, 7, 7, 6, 6, 6, 6, 6, 6, 6, 6] : [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1];
            for (ii = 0; ii < 16; ii++) {
                var col = PieceCol[color][ii];
                var row = PieceRow[color][ii];
                Board[col][row] = (1 - 2 * color) * PieceType[color][ii]
            }
        }
    } else {
        var kk, ll, nn, mm;
        for (ii = 0; ii < 2; ii++) {
            for (jj = 0; jj < 16; jj++) {
                PieceType[ii][jj] = -1;
                PieceCol[ii][jj] = 0;
                PieceRow[ii][jj] = 0;
                PieceMoveCounter[ii][jj] = 0
            }
        }
        ii = 0;
        jj = 7;
        ll = 0;
        nn = 1;
        mm = 1;
        cc = FenString.charAt(ll++);
        while (cc != " ") {
            if (cc == "/") {
                if (ii != 8) {
                    myAlertFEN(FenString, "char " + ll);
                    InitFEN();
                    return
                }
                ii = 0;
                jj--
            }
            if (ii == 8) {
                myAlertFEN(FenString, "char " + ll);
                InitFEN();
                return
            }
            if (!isNaN(cc)) {
                ii += parseInt(cc, 10);
                if ((ii < 0) || (ii > 8)) {
                    myAlertFEN(FenString, "char " + ll);
                    InitFEN();
                    return
                }
            }
            if (cc.charCodeAt(0) == FenPieceName.toUpperCase().charCodeAt(0)) {
                if (PieceType[0][0] != -1) {
                    myAlertFEN(FenString, "char " + ll);
                    InitFEN();
                    return
                }
                PieceType[0][0] = 1;
                PieceCol[0][0] = ii;
                PieceRow[0][0] = jj;
                ii++
            }
            if (cc.charCodeAt(0) == FenPieceName.toLowerCase().charCodeAt(0)) {
                if (PieceType[1][0] != -1) {
                    myAlertFEN(FenString, "char " + ll);
                    InitFEN();
                    return
                }
                PieceType[1][0] = 1;
                PieceCol[1][0] = ii;
                PieceRow[1][0] = jj;
                ii++
            }
            for (kk = 1; kk < 6; kk++) {
                if (cc.charCodeAt(0) == FenPieceName.toUpperCase().charCodeAt(kk)) {
                    if (nn == 16) {
                        myAlertFEN(FenString, "char " + ll);
                        InitFEN();
                        return
                    }
                    PieceType[0][nn] = kk + 1;
                    PieceCol[0][nn] = ii;
                    PieceRow[0][nn] = jj;
                    nn++;
                    ii++
                }
                if (cc.charCodeAt(0) == FenPieceName.toLowerCase().charCodeAt(kk)) {
                    if (mm == 16) {
                        myAlertFEN(FenString, "char " + ll);
                        InitFEN();
                        return
                    }
                    PieceType[1][mm] = kk + 1;
                    PieceCol[1][mm] = ii;
                    PieceRow[1][mm] = jj;
                    mm++;
                    ii++
                }
            }
            cc = ll < FenString.length ? FenString.charAt(ll++) : " "
        }
        if ((ii != 8) || (jj !== 0)) {
            myAlertFEN(FenString, "char " + ll);
            InitFEN();
            return
        }
        if ((PieceType[0][0] == -1) || (PieceType[1][0] == -1)) {
            myAlertFEN(FenString, "missing King");
            InitFEN();
            return
        }
        if (ll == FenString.length) {
            FenString += "w " + assumedCastleRights() + " - 0 1"
        }
        cc = FenString.charAt(ll++);
        if ((cc == "w") || (cc == "b")) {
            if (cc == "b") {
                StartPly += 1;
                MoveColor = 1
            }
        } else {
            myAlertFEN(FenString, "invalid active color")
        }
        for (color = 0; color < 2; ++color) {
            for (ii = 0; ii < 16; ii++) {
                if (PieceType[color][ii] != -1) {
                    col = PieceCol[color][ii];
                    row = PieceRow[color][ii];
                    Board[col][row] = (1 - 2 * color) * (PieceType[color][ii])
                }
            }
        }
        ll++;
        if (ll >= FenString.length) {
            myAlertFEN(FenString, "missing castling availability");
            FenString += " " + assumedCastleRights() + " - 0 1";
            ll++
        }
        CastlingLong = [-1, -1];
        CastlingShort = [-1, -1];
        cc = FenString.charAt(ll++);
        while (cc != " ") {
            if (cc.charCodeAt(0) == FenPieceName.toUpperCase().charCodeAt(0)) {
                for (CastlingShort[0] = 7; CastlingShort[0] > PieceCol[0][0]; CastlingShort[0]--) {
                    if (Board[CastlingShort[0]][0] == 3) {
                        break
                    }
                }
                if (CastlingShort[0] <= PieceCol[0][0]) {
                    myAlertFEN(FenString, "missing castling Rook " + cc);
                    CastlingShort[0] = -1
                }
            }
            if (cc.charCodeAt(0) == FenPieceName.toUpperCase().charCodeAt(1)) {
                for (CastlingLong[0] = 0; CastlingLong[0] < PieceCol[0][0]; CastlingLong[0]++) {
                    if (Board[CastlingLong[0]][0] == 3) {
                        break
                    }
                }
                if (CastlingLong[0] >= PieceCol[0][0]) {
                    myAlertFEN(FenString, "missing castling Rook " + cc);
                    CastlingLong[0] = -1
                }
            }
            if (cc.charCodeAt(0) == FenPieceName.toLowerCase().charCodeAt(0)) {
                for (CastlingShort[1] = 7; CastlingShort[1] > PieceCol[1][0]; CastlingShort[1]--) {
                    if (Board[CastlingShort[1]][7] == -3) {
                        break
                    }
                }
                if (CastlingShort[1] <= PieceCol[1][0]) {
                    myAlertFEN(FenString, "missing castling Rook " + cc);
                    CastlingShort[1] = -1
                }
            }
            if (cc.charCodeAt(0) == FenPieceName.toLowerCase().charCodeAt(1)) {
                for (CastlingLong[1] = 0; CastlingLong[1] < PieceCol[1][0]; CastlingLong[1]++) {
                    if (Board[CastlingLong[1]][7] == -3) {
                        break
                    }
                }
                if (CastlingLong[1] >= PieceCol[1][0]) {
                    myAlertFEN(FenString, "missing castling Rook " + cc);
                    CastlingLong[1] = -1
                }
            }
            castlingRookCol = columnsLetters.toUpperCase().indexOf(cc);
            if (castlingRookCol >= 0) {
                color = 0
            } else {
                castlingRookCol = columnsLetters.toLowerCase().indexOf(cc);
                if (castlingRookCol >= 0) {
                    color = 1
                }
            }
            if (castlingRookCol >= 0) {
                if (Board[castlingRookCol][color * 7] == (1 - 2 * color) * 3) {
                    if (castlingRookCol > PieceCol[color][0]) {
                        CastlingShort[color] = castlingRookCol
                    }
                    if (castlingRookCol < PieceCol[color][0]) {
                        CastlingLong[color] = castlingRookCol
                    }
                } else {
                    myAlertFEN(FenString, "missing castling Rook " + cc)
                }
            }
            cc = ll < FenString.length ? FenString.charAt(ll++) : " "
        }
        if (ll >= FenString.length) {
            myAlertFEN(FenString, "missing en passant square");
            FenString += " - 0 1";
            ll++
        }
        cc = FenString.charAt(ll++);
        while (cc != " ") {
            if ((cc.charCodeAt(0) - 97 >= 0) && (cc.charCodeAt(0) - 97 <= 7)) {
                newEnPassant = !0;
                newEnPassantCol = cc.charCodeAt(0) - 97
            }
            cc = ll < FenString.length ? FenString.charAt(ll++) : " "
        }
        if (ll >= FenString.length) {
            myAlertFEN(FenString, "missing halfmove clock");
            FenString += " 0 1";
            ll++
        }
        InitialHalfMoveClock = 0;
        cc = FenString.charAt(ll++);
        while (cc != " ") {
            if (isNaN(cc)) {
                myAlertFEN(FenString, "invalid halfmove clock");
                break
            }
            InitialHalfMoveClock = InitialHalfMoveClock * 10 + parseInt(cc, 10);
            cc = ll < FenString.length ? FenString.charAt(ll++) : " "
        }
        if (ll >= FenString.length) {
            myAlertFEN(FenString, "missing fullmove number");
            FenString += " 1";
            ll++
        }
        fullMoveNumber = 0;
        cc = FenString.charAt(ll++);
        while (cc != " ") {
            if (isNaN(cc)) {
                myAlertFEN(FenString, "invalid fullmove number");
                fullMoveNumber = 1;
                break
            }
            fullMoveNumber = fullMoveNumber * 10 + parseInt(cc, 10);
            cc = ll < FenString.length ? FenString.charAt(ll++) : " "
        }
        if (fullMoveNumber === 0) {
            myAlertFEN(FenString, "invalid fullmove 0 set to 1");
            fullMoveNumber = 1
        }
        StartPly += 2 * (fullMoveNumber - 1);
        HistEnPassant[StartPly] = newEnPassant;
        HistEnPassantCol[StartPly] = newEnPassantCol;
        HistNull[StartPly] = 0;
        HistVar[StartPly] = 0
    }
}

function assumedCastleRights() {
    var ii, rights = "";
    if ((PieceRow[0][0] === 0) && (PieceCol[0][0] === 4)) {
        for (ii = 0; ii < PieceType[0].length; ii++) {
            if ((PieceType[0][ii] === 3) && (PieceRow[0][ii] === 0) && (PieceCol[0][ii] === 7)) {
                rights += FenPieceName.charAt(0).toUpperCase()
            }
            if ((PieceType[0][ii] === 3) && (PieceRow[0][ii] === 0) && (PieceCol[0][ii] === 0)) {
                rights += FenPieceName.charAt(1).toUpperCase()
            }
        }
    }
    if ((PieceRow[1][0] === 7) && (PieceCol[1][0] === 4)) {
        for (ii = 0; ii < PieceType[1].length; ii++) {
            if ((PieceType[1][ii] === 3) && (PieceRow[1][ii] === 7) && (PieceCol[1][ii] === 7)) {
                rights += FenPieceName.charAt(0).toLowerCase()
            }
            if ((PieceType[1][ii] === 3) && (PieceRow[1][ii] === 7) && (PieceCol[1][ii] === 0)) {
                rights += FenPieceName.charAt(1).toLowerCase()
            }
        }
    }
    return rights || "-"
}

function SetImageType(extension) {
    imageType = extension
}

function InitImages() {
    if (ImagePathOld === ImagePath) {
        return
    }
    if ((ImagePath.length > 0) && (ImagePath[ImagePath.length - 1] != '/')) {
        ImagePath += '/'
    }
    ClearImg = new Image();
    ClearImg.src = ImagePath + 'clear.' + imageType;
    if ((window.devicePixelRatio && window.devicePixelRatio > 1) && (currentPage == "live.php" || (currentPage == "archive.php"))) {
        var ColorName = new Array("rw", "rb")
    } else {
        var ColorName = new Array("w", "b")
    }
    var PiecePrefix = new Array("k", "q", "r", "b", "n", "p");
    for (var c = 0; c < 2; ++c) {
        for (var p = 1; p < 7; p++) {
            PieceImg[c][p] = new Image();
            PieceImg[c][p].src = ImagePath + ColorName[c] + PiecePrefix[p - 1] + '.' + imageType
        }
    }
    ImagePathOld = ImagePath
}

function IsCheck(col, row, color) {
    var ii, jj;
    var sign = 2 * color - 1;
    if ((Math.abs(PieceCol[1 - color][0] - col) <= 1) && (Math.abs(PieceRow[1 - color][0] - row) <= 1)) {
        return !0
    }
    for (ii = -2; ii <= 2; ii += 4) {
        for (jj = -1; jj <= 1; jj += 2) {
            if (SquareOnBoard(col + ii, row + jj)) {
                if (Board[col + ii][row + jj] == sign * 5) {
                    return !0
                }
            }
            if (SquareOnBoard(col + jj, row + ii)) {
                if (Board[col + jj][row + ii] == sign * 5) {
                    return !0
                }
            }
        }
    }
    for (ii = -1; ii <= 1; ii += 2) {
        if (SquareOnBoard(col + ii, row - sign)) {
            if (Board[col + ii][row - sign] == sign * 6) {
                return !0
            }
        }
    }
    for (ii = -1; ii <= 1; ++ii) {
        for (jj = -1; jj <= 1; ++jj) {
            if ((ii !== 0) || (jj !== 0)) {
                var checkCol = col + ii;
                var checkRow = row + jj;
                var thisPiece = 0;
                while (SquareOnBoard(checkCol, checkRow) && (thisPiece === 0)) {
                    thisPiece = Board[checkCol][checkRow];
                    if (thisPiece === 0) {
                        checkCol += ii;
                        checkRow += jj
                    } else {
                        if (thisPiece == sign * 2) {
                            return !0
                        }
                        if ((thisPiece == sign * 3) && ((ii === 0) || (jj === 0))) {
                            return !0
                        }
                        if ((thisPiece == sign * 4) && ((ii !== 0) && (jj !== 0))) {
                            return !0
                        }
                    }
                }
            }
        }
    }
    return !1
}

function fixRegExp(exp) {
    return exp.replace(/([\[\]\(\)\{\}\.\*\+\^\$\|\?\\])/g, "\\$1")
}

function LoadGameHeaders() {
    var ii;
    var parse;
    gameEvent.length = gameSite.length = gameRound.length = gameDate.length = 0;
    gameWhite.length = gameBlack.length = gameResult.length = 0;
    gameSetUp.length = gameFEN.length = 0;
    gameInitialWhiteClock.length = gameInitialBlackClock.length = 0;
    gameVariant.length = 0;
    pgnHeaderTagRegExpGlobal.lastIndex = 0;
    for (ii = 0; ii < numberOfGames; ++ii) {
        var ss = pgnHeader[ii];
        gameEvent[ii] = gameSite[ii] = gameRound[ii] = gameDate[ii] = "";
        gameWhite[ii] = gameBlack[ii] = gameResult[ii] = "";
        gameInitialWhiteClock[ii] = gameInitialBlackClock[ii] = "";
        gameVariant[ii] = "";
        while (parse = pgnHeaderTagRegExpGlobal.exec(ss)) {
            switch (parse[1]) {
                case 'Event':
                    gameEvent[ii] = parse[2] + " Tournament";
                    console.log ("gameEvent[ii]:" +  gameEvent[ii]);
                    break;
                case 'Site':
                    gameSite[ii] = parse[2];
                    break;
                case 'Round':
                    gameRound[ii] = parse[2];
                    break;
                case 'Date':
                    gameDate[ii] = parse[2];
                    break;
                case 'White':
                    gameWhite[ii] = parse[2];
                    break;
                case 'Black':
                    gameBlack[ii] = parse[2];
                    break;
                case 'Result':
                    gameResult[ii] = parse[2];
                    break;
                case 'SetUp':
                    gameSetUp[ii] = parse[2];
                    break;
                case 'FEN':
                    gameFEN[ii] = parse[2];
                    break;
                case 'WhiteClock':
                    gameInitialWhiteClock[ii] = parse[2];
                    break;
                case 'BlackClock':
                    gameInitialBlackClock[ii] = parse[2];
                    break;
                case 'Variant':
                    gameVariant[ii] = parse[2];
                    break;
                case 'Opening':
                    gameOpening[ii] = parse[2];
                    break;
                case 'Number':
                    currGamechessgui = parse[2];
                    break;
                default:
                    break
            }
        }
    }
    if ((LiveBroadcastDemo) && (numberOfGames > 0)) {
        for (ii = 0; ii < numberOfGames; ++ii) {
            if ((gameDemoLength[ii] === undefined) || (gameDemoLength[ii] === 0)) {
                InitFEN(gameFEN[ii]);
                ParsePGNGameString(pgnGame[ii]);
                gameDemoLength[ii] = PlyNumber
            }
            if (gameDemoMaxPly[ii] === undefined) {
                gameDemoMaxPly[ii] = 0
            }
            if (gameDemoMaxPly[ii] <= gameDemoLength[ii]) {
                gameResult[ii] = '*'
            }
        }
    }
    return
}

function MoveBackward(diff, scanOnly) {
    var goFromPly = CurrentPly - 1;
    var goToPly = goFromPly - diff;
    if (goToPly < StartPly) {
        goToPly = StartPly - 1
    }
    for (var thisPly = goFromPly; thisPly > goToPly; --thisPly) {
        CurrentPly--;
        MoveColor = 1 - MoveColor;
        CurrentVar = HistVar[thisPly];
        UndoMove(thisPly)
    }
    if (scanOnly) {
        return
    }
    synchMoves();
    RefreshBoard();
    HighlightLastMove();
    autoScrollToCurrentMoveIfEnabled();
    if (AutoPlayInterval) {
        clearTimeout(AutoPlayInterval);
        AutoPlayInterval = null
    }
    if (isAutoPlayOn) {
        if (goToPly >= StartPlyVar[CurrentVar]) {
            AutoPlayInterval = setTimeout("MoveBackward(1)", Delay)
        } else {
            SetAutoPlay(!1)
        }
    }
    customFunctionOnMove();
    setEnginePv();
    if (typeof(engineWinOnMove) == "function") {
        engineWinOnMove()
    }
}

function testtime() {
    var i = setTimeout(function() {
        newfunc()
    }, 4000);
}

function newfunc() {
    alert("inside new");
}


function MoveForward(diff, targetVar, scanOnly) {
    var nextVar, nextVarStartPly, move, text;
    var oldVar = -1;
    if (typeof(targetVar) == "undefined") {
        targetVar = CurrentVar
    }
    var goToPly = CurrentPly + parseInt(diff, 10);
    if (goToPly > StartPlyVar[targetVar] + PlyNumberVar[targetVar]) {
        goToPly = StartPlyVar[targetVar] + PlyNumberVar[targetVar]
    }
    for (var thisPly = CurrentPly; thisPly < goToPly; ++thisPly) {
        if (targetVar !== CurrentVar) {
            for (var ii = 0; ii < PredecessorsVars[targetVar].length; ii++) {
                if (PredecessorsVars[targetVar][ii] === CurrentVar) {
                    break
                }
            }
            if (ii === PredecessorsVars[targetVar].length) {
                myAlert("error: unknown path to variation " + targetVar + " from " + CurrentVar + " in game " + (currentGame + 1), !0);
                return
            } else {
                nextVarStartPly = StartPlyVar[PredecessorsVars[targetVar][ii + 1]];
                for (ii = ii + 1; ii < PredecessorsVars[targetVar].length - 1; ii++) {
                    if (StartPlyVar[PredecessorsVars[targetVar][ii + 1]] !== StartPlyVar[PredecessorsVars[targetVar][ii]]) {
                        break
                    }
                }
                nextVar = PredecessorsVars[targetVar][ii]
            }
        } else {
            nextVar = nextVarStartPly = -1
        }
        if (thisPly === nextVarStartPly) {
            oldVar = CurrentVar;
            CurrentVar = nextVar
        }
        if (typeof(move = MovesVar[CurrentVar][thisPly]) == "undefined") {
            break
        }
        if (ParseLastMoveError = !ParseMove(move, thisPly)) {
            text = (Math.floor(thisPly / 2) + 1) + ((thisPly % 2) === 0 ? '. ' : '... ');
            myAlert('error: invalid ply ' + text + move + ' in game ' + (currentGame + 1) + ' variation ' + CurrentVar, !0);
            if (thisPly === nextVarStartPly) {
                CurrentVar = oldVar
            }
            break
        }
        MoveColor = 1 - MoveColor
    }
    CurrentPly = thisPly;
    if (scanOnly) {
        return
    }
    synchMoves();
    RefreshBoard();
    HighlightLastMove();
    setEnginePv();
    autoScrollToCurrentMoveIfEnabled();
    if (AutoPlayInterval) {
        clearTimeout(AutoPlayInterval);
        AutoPlayInterval = null
    }
    if (ParseLastMoveError) {
        SetAutoPlay(!1)
    } else if (thisPly == goToPly) {
        if (isAutoPlayOn) {
            if (goToPly < StartPlyVar[CurrentVar] + PlyNumberVar[CurrentVar]) {
                AutoPlayInterval = setTimeout(function() {
                    MoveForward(1);
                }, Delay);
            } else {
                if (autoplayNextGame && (CurrentVar === 0)) {
                    AutoPlayInterval = setTimeout("AutoplayNextGame()", Delay);
                } else {
                    SetAutoPlay(!1)
                }
            }
        }
    }
    customFunctionOnMove();
    if (typeof(engineWinOnMove) == "function") {
        engineWinOnMove()
    }
}
var lastSynchCurrentVar = -1;

function synchMoves() {
    var start, end;
    if (CurrentVar === lastSynchCurrentVar) {
        return
    }
    Moves = new Array();
    MoveComments = new Array();
    for (var ii = 0; ii < PredecessorsVars[CurrentVar].length; ii++) {
        start = StartPlyVar[PredecessorsVars[CurrentVar][ii]];
        if (ii < PredecessorsVars[CurrentVar].length - 1) {
            end = StartPlyVar[PredecessorsVars[CurrentVar][ii + 1]]
        } else {
            end = StartPlyVar[PredecessorsVars[CurrentVar][ii]] + PlyNumberVar[PredecessorsVars[CurrentVar][ii]]
        }
        for (var jj = start; jj < end; jj++) {
            Moves[jj] = MovesVar[PredecessorsVars[CurrentVar][ii]][jj];
            MoveComments[jj] = MoveCommentsVar[PredecessorsVars[CurrentVar][ii]][jj] || ""
        }
    }
    MoveComments[jj] = MoveCommentsVar[PredecessorsVars[CurrentVar][ii - 1]][jj] || "";
    PlyNumber = StartPlyVar[CurrentVar] + PlyNumberVar[CurrentVar] - StartPly;
    lastSynchCurrentVar = CurrentVar
}

function AutoplayNextGame() {
    if (fatalErrorNumSinceReset === 0) {
        if (numberOfGames > 0) {
            Init((currentGame + 1) % numberOfGames);
            if ((numberOfGames > 1) || (PlyNumber > 0)) {
                SetAutoPlay(!0);
                return
            }
        }
    }
    SetAutoPlay(!1)
}

function MoveToNextComment(varOnly) {
    for (var ii = CurrentPly + 1; ii <= StartPlyVar[CurrentVar] + PlyNumberVar[CurrentVar]; ii++) {
        if (MoveComments[ii].match(pgn4webVariationRegExp) || (!varOnly && strippedMoveComment(ii))) {
            GoToMove(ii);
            break
        }
    }
}

function MoveToPrevComment(varOnly) {
    for (var ii = (CurrentPly - 1); ii >= StartPly; ii--) {
        if ((ii > 0 || CurrentVar > 0) && ii === StartPlyVar[HistVar[ii + 1]]) {
            GoToMove(ii + 1, HistVar[ii]);
            break
        }
        if (MoveComments[ii].match(pgn4webVariationRegExp) || (!varOnly && strippedMoveComment(ii))) {
            GoToMove(ii);
            break
        }
    }
}

function OpenGame(gameId) {
    ParsePGNGameString(pgnGame[gameId]);
    currentGame = gameId;
    ParseLastMoveError = !1;
    if (LiveBroadcastDemo) {
        if (gameDemoMaxPly[gameId] <= PlyNumber) {
            PlyNumber = PlyNumberVar[0] = gameDemoMaxPly[gameId]
        }
    }
    PrintHTML()
}

function initVar() {
    MovesVar = new Array();
    MoveCommentsVar = new Array();
    GameHasComments = !1;
    GameHasVariations = !1;
    StartPlyVar = new Array();
    PlyNumberVar = new Array();
    CurrentVar = -1;
    lastVarWithNoMoves = [!1];
    numberOfVars = 0;
    CurrentVarStack = new Array();
    PlyNumber = 1;
    PlyNumberStack = new Array();
    PredecessorsVars = new Array();
    startVar(!1)
}

function startVar(isContinuation) {
    if (CurrentVar >= 0) {
        CurrentVarStack.push(CurrentVar);
        PlyNumberStack.push(PlyNumber)
    }
    CurrentVar = numberOfVars++;
    PredecessorsVars[CurrentVar] = CurrentVarStack.slice(0);
    PredecessorsVars[CurrentVar].push(CurrentVar);
    MovesVar[CurrentVar] = new Array();
    MoveCommentsVar[CurrentVar] = new Array();
    if (!isContinuation) {
        if (lastVarWithNoMoves[lastVarWithNoMoves.length - 1]) {
            myAlert("warning: malformed PGN data in game " + (currentGame + 1) + ": variant " + CurrentVar + " starting before parent", !0)
        } else {
            PlyNumber -= 1
        }
    }
    lastVarWithNoMoves.push(!0);
    MoveCommentsVar[CurrentVar][StartPly + PlyNumber] = "";
    StartPlyVar[CurrentVar] = StartPly + PlyNumber
}

function closeVar() {
    if (StartPly + PlyNumber === StartPlyVar[CurrentVar]) {
        myAlert("warning: empty variation " + CurrentVar + " in game " + (currentGame + 1), !1)
    } else {
        GameHasVariations = !0
    }
    lastVarWithNoMoves.pop();
    PlyNumberVar[CurrentVar] = StartPly + PlyNumber - StartPlyVar[CurrentVar];
    for (var ii = StartPlyVar[CurrentVar]; ii <= StartPlyVar[CurrentVar] + PlyNumberVar[CurrentVar]; ii++) {
        if (MoveCommentsVar[CurrentVar][ii]) {
            MoveCommentsVar[CurrentVar][ii] = MoveCommentsVar[CurrentVar][ii].replace(/\s+/g, ' ');
            MoveCommentsVar[CurrentVar][ii] = translateNAGs(MoveCommentsVar[CurrentVar][ii]);
            MoveCommentsVar[CurrentVar][ii] = MoveCommentsVar[CurrentVar][ii].replace(/\s+$/g, '')
        } else {
            MoveCommentsVar[CurrentVar][ii] = ''
        }
    }
    if (CurrentVarStack.length) {
        CurrentVar = CurrentVarStack.pop();
        PlyNumber = PlyNumberStack.pop()
    } else {
        myAlert("error: closeVar error" + " in game " + (currentGame + 1), !0)
    }
}

function childrenVars(thisPly, thisVar) {
    if (typeof(thisVar) == "undefined") {
        thisVar = CurrentVar
    }
    if (typeof(thisPly) == "undefined") {
        thisPly = CurrentPly
    }
    var children = new Array();
    for (var ii = thisVar; ii < numberOfVars; ii++) {
        if ((ii === thisVar && StartPlyVar[ii] + PlyNumberVar[ii] > thisPly) || (realParentVar(ii) === thisVar && StartPlyVar[ii] === thisPly && PlyNumberVar[ii] > 0)) {
            children.push(ii)
        }
    }
    return children
}

function realParentVar(childVar) {
    for (var ii = PredecessorsVars[childVar].length - 1; ii > 0; ii--) {
        if (StartPlyVar[PredecessorsVars[childVar][ii]] !== StartPlyVar[PredecessorsVars[childVar][ii - 1]]) {
            return PredecessorsVars[childVar][ii - 1]
        }
    }
    return PredecessorsVars[childVar][ii]
}

function goToNextVariationSibling() {
    if (CurrentPly === StartPly) {
        return !1
    }
    var siblings = childrenVars(CurrentPly - 1, HistVar[CurrentPly - 1]);
    if (siblings.length < 2) {
        return !1
    }
    for (var ii = 0; ii < siblings.length; ii++) {
        if (siblings[ii] === CurrentVar) {
            break
        }
    }
    if (siblings[ii] !== CurrentVar) {
        return !1
    }
    GoToMove(CurrentPly, siblings[(ii + 1) % siblings.length]);
    return !0
}

function goToFirstChild() {
    var children = childrenVars(CurrentPly, CurrentVar);
    if (children.length < 1) {
        return !1
    }
    if (children[0] === CurrentVar) {
        if (children.length < 2) {
            return !1
        }
        GoToMove(CurrentPly + 1, children[1])
    } else {
        GoToMove(CurrentPly + 1, children[0])
    }
    return !0
}

function ParsePGNGameString(gameString) {
    var ii, start, end, move, moveCount, needle, commentStart, commentEnd, isContinuation;
    var ssRep, ss = gameString,
        ssComm;
    ss = ss.replace(pgn4webVariationRegExpGlobal, "[%_pgn4web_variation_ $1]");
    while ((ssRep = ss.replace(/\((([\?!+#\s]|\$\d+|{[^}]*})*)\)/g, ' $1 ')) !== ss) {
        ss = ssRep
    }
    ss = ss.replace(/^\s/, '');
    ss = ss.replace(/\s$/, '');
    while ((ssRep = ss.replace(/ev=0.00, d=1, mt=00:00:0.*/g, "book}")) !== ss) {
        ss = ssRep
    }
    initVar();
    PlyNumber = 0;
    for (start = 0; start < ss.length; start++) {
        switch (ss.charAt(start)) {
            case ' ':
            case '\b':
            case '\f':
            case '\n':
            case '\r':
            case '\t':
                break;
            case '$':
                commentStart = start;
                commentEnd = commentStart + 1;
                while ('0123456789'.indexOf(ss.charAt(commentEnd)) >= 0) {
                    commentEnd++;
                    if (commentEnd >= ss.length) {
                        break
                    }
                }
                if (MoveCommentsVar[CurrentVar][StartPly + PlyNumber]) {
                    MoveCommentsVar[CurrentVar][StartPly + PlyNumber] += ' '
                }
                MoveCommentsVar[CurrentVar][StartPly + PlyNumber] += translateNAGs(ss.substring(commentStart, commentEnd).replace(/(^\s*|\s*$)/, ''));
                start = commentEnd - 1;
                break;
            case '!':
            case '?':
                commentStart = start;
                commentEnd = commentStart + 1;
                while ('!?'.indexOf(ss.charAt(commentEnd)) >= 0) {
                    commentEnd++;
                    if (commentEnd >= ss.length) {
                        break
                    }
                }
                if (MoveCommentsVar[CurrentVar][StartPly + PlyNumber]) {
                    MoveCommentsVar[CurrentVar][StartPly + PlyNumber] += ' '
                }
                MoveCommentsVar[CurrentVar][StartPly + PlyNumber] += ss.substring(commentStart, commentEnd);
                start = commentEnd - 1;
                break;
            case '{':
                commentStart = start + 1;
                commentEnd = ss.indexOf('}', start + 1);
                if (commentEnd < 0) {
                    myAlert('error: missing end comment } in game ' + (currentGame + 1), !0);
                    commentEnd = ss.length
                }
                if (MoveCommentsVar[CurrentVar][StartPly + PlyNumber]) {
                    MoveCommentsVar[CurrentVar][StartPly + PlyNumber] += ' '
                }
                ssComm = translateNAGs(ss.substring(commentStart, commentEnd).replace(/(^\s*|\s*$)/, ''));
                MoveCommentsVar[CurrentVar][StartPly + PlyNumber] += ssComm;
                GameHasComments = GameHasComments || ssComm.replace(/\[%[^\]]*\]\s*/g, '').replace(basicNAGs, '').replace(/^\s+$/, '') !== '';
                start = commentEnd;
                break;
            case '%':
                if ((start > 0) && (ss.charAt(start - 1) != '\n')) {
                    break
                }
                commentStart = start + 1;
                commentEnd = ss.indexOf('\n', start + 1);
                if (commentEnd < 0) {
                    commentEnd = ss.length
                }
                start = commentEnd;
                break;
            case ';':
                commentStart = start + 1;
                commentEnd = ss.indexOf('\n', start + 1);
                if (commentEnd < 0) {
                    commentEnd = ss.length
                }
                if (MoveCommentsVar[CurrentVar][StartPly + PlyNumber]) {
                    MoveCommentsVar[CurrentVar][StartPly + PlyNumber] += ' '
                }
                ssComm = translateNAGs(ss.substring(commentStart, commentEnd).replace(/(^\s*|\s*$)/, ''));
                MoveCommentsVar[CurrentVar][StartPly + PlyNumber] += ssComm;
                GameHasComments = GameHasComments || ssComm.replace(/\[%[^\]]*\]\s*/g, '').replace(basicNAGs, '').replace(/^\s+$/, '') !== '';
                start = commentEnd;
                break;
            case '(':
                if (isContinuation = (ss.charAt(start + 1) == '*')) {
                    start += 1
                }
                MoveCommentsVar[CurrentVar][StartPly + PlyNumber] += ' [%pgn4web_variation ' + numberOfVars + '] ';
                startVar(isContinuation);
                break;
            case ')':
                closeVar();
                break;
            case '&':
                if (ss.substr(start, 8) == "&lt;&gt;") {
                    ss = ss.slice(0, start) + "     -- " + ss.slice(start + 8);
                    start += 4;
                    break
                }
            default:
                needle = new Array('1-0', '0-1', '1/2-1/2', '*');
                for (ii = 0; ii < needle.length; ii++) {
                    if (ss.indexOf(needle[ii], start) == start) {
                        if (CurrentVar === 0) {
                            end = ss.length
                        } else {
                            end = start + needle[ii].length;
                            if (MoveCommentsVar[CurrentVar][StartPly + PlyNumber]) {
                                MoveCommentsVar[CurrentVar][StartPly + PlyNumber] += ' '
                            }
                            MoveCommentsVar[CurrentVar][StartPly + PlyNumber] += needle[ii]
                        }
                        start = end;
                        break
                    }
                }
                if (start == ss.length) {
                    break
                }
                moveCount = Math.floor((StartPly + PlyNumber) / 2) + 1;
                needle = moveCount.toString();
                if (ss.indexOf(needle, start) == start) {
                    start += needle.length;
                    while (' .\n\r'.indexOf(ss.charAt(start)) != -1) {
                        start++
                    }
                }
                if ((end = start + ss.substr(start).search(/[\s${;!?()]/)) < start) {
                    end = ss.length
                }
                move = ss.substring(start, end);
                MovesVar[CurrentVar][StartPly + PlyNumber] = CleanMove(move);
                lastVarWithNoMoves[lastVarWithNoMoves.length - 1] = !1;
                if (ss.charAt(end) == ' ') {
                    start = end
                } else {
                    start = end - 1
                }
                if (!MovesVar[CurrentVar][StartPly + PlyNumber].match(/^[\s+#]*$/)) {
                    PlyNumber++;
                    MoveCommentsVar[CurrentVar][StartPly + PlyNumber] = ''
                }
                break
        }
    }
    if (CurrentVar !== 0) {
        myAlert("error: ParsePGNGameString ends with CurrentVar " + CurrentVar + " in game " + (currentGame + 1), !0);
        while (CurrentVar > 0) {
            closeVar()
        }
    }
    StartPlyVar[0] = StartPly;
    PlyNumberVar[0] = PlyNumber;
    GameHasComments = GameHasComments || GameHasVariations;
    lastSynchCurrentVar = -1
}
var NAG = new Array();
NAG[0] = '';
NAG[1] = '!';
NAG[2] = '?';
NAG[3] = '!!';
NAG[4] = '??';
NAG[5] = '!?';
NAG[6] = '?!';
NAG[7] = 'forced move';
NAG[8] = 'singular move';
NAG[9] = 'worst move';
NAG[10] = 'drawish position';
NAG[11] = 'equal chances, quiet position';
NAG[12] = 'equal chances, active position';
NAG[13] = 'unclear position';
NAG[14] = 'White has a slight advantage';
NAG[16] = 'White has a moderate advantage';
NAG[18] = 'White has a decisive advantage';
NAG[20] = 'White has a crushing advantage';
NAG[22] = 'White is in zugzwang';
NAG[24] = 'White has a slight space advantage';
NAG[26] = 'White has a moderate space advantage';
NAG[28] = 'White has a decisive space advantage';
NAG[30] = 'White has a slight time (development) advantage';
NAG[32] = 'White has a moderate time (development) advantage';
NAG[34] = 'White has a decisive time (development) advantage';
NAG[36] = 'White has the initiative';
NAG[38] = 'White has a lasting initiative';
NAG[40] = 'White has the attack';
NAG[42] = 'White has insufficient compensation for material deficit';
NAG[44] = 'White has sufficient compensation for material deficit';
NAG[46] = 'White has more than adequate compensation for material deficit';
NAG[48] = 'White has a slight center control advantage';
NAG[50] = 'White has a moderate center control advantage';
NAG[52] = 'White has a decisive center control advantage';
NAG[54] = 'White has a slight kingside control advantage';
NAG[56] = 'White has a moderate kingside control advantage';
NAG[58] = 'White has a decisive kingside control advantage';
NAG[60] = 'White has a slight queenside control advantage';
NAG[62] = 'White has a moderate queenside control advantage';
NAG[64] = 'White has a decisive queenside control advantage';
NAG[66] = 'White has a vulnerable first rank';
NAG[68] = 'White has a well protected first rank';
NAG[70] = 'White has a poorly protected king';
NAG[72] = 'White has a well protected king';
NAG[74] = 'White has a poorly placed king';
NAG[76] = 'White has a well placed king';
NAG[78] = 'White has a very weak pawn structure';
NAG[80] = 'White has a moderately weak pawn structure';
NAG[82] = 'White has a moderately strong pawn structure';
NAG[84] = 'White has a very strong pawn structure';
NAG[86] = 'White has poor knight placement';
NAG[88] = 'White has good knight placement';
NAG[90] = 'White has poor bishop placement';
NAG[92] = 'White has good bishop placement';
NAG[94] = 'White has poor rook placement';
NAG[96] = 'White has good rook placement';
NAG[98] = 'White has poor queen placement';
NAG[100] = 'White has good queen placement';
NAG[102] = 'White has poor piece coordination';
NAG[104] = 'White has good piece coordination';
NAG[106] = 'White has played the opening very poorly';
NAG[108] = 'White has played the opening poorly';
NAG[110] = 'White has played the opening well';
NAG[112] = 'White has played the opening very well';
NAG[114] = 'White has played the middlegame very poorly';
NAG[116] = 'White has played the middlegame poorly';
NAG[118] = 'White has played the middlegame well';
NAG[120] = 'White has played the middlegame very well';
NAG[122] = 'White has played the ending very poorly';
NAG[124] = 'White has played the ending poorly';
NAG[126] = 'White has played the ending well';
NAG[128] = 'White has played the ending very well';
NAG[130] = 'White has slight counterplay';
NAG[132] = 'White has moderate counterplay';
NAG[134] = 'White has decisive counterplay';
NAG[136] = 'White has moderate time control pressure';
NAG[138] = 'White has severe time control pressure';
for (i = 14; i < 139; i += 2) {
    NAG[i + 1] = NAG[i].replace("White", "Black")
}

function translateNAGs(comment) {
    var matches = comment.match(/\$+[0-9]+/g);
    if (matches) {
        for (var ii = 0; ii < matches.length; ii++) {
            var nag = matches[ii].substr(1);
            if (NAG[nag] !== undefined) {
                comment = comment.replace(new RegExp("\\$+" + nag + "(?!\\d)"), NAG[nag])
            }
        }
    }
    return comment
}

function ParseMove(move, plyCount) {
    var ii, ll;
    var rem;
    var toRowMarker = -1;
    castleRook = -1;
    mvIsCastling = 0;
    mvIsPromotion = 0;
    mvCapture = 0;
    mvFromCol = -1;
    mvFromRow = -1;
    mvToCol = -1;
    mvToRow = -1;
    mvPiece = -1;
    mvPieceId = -1;
    mvPieceOnTo = -1;
    mvCaptured = -1;
    mvCapturedId = -1;
    mvIsNull = 0;
    if (typeof(move) == "undefined") {
        return !1
    }
    HistEnPassant[plyCount + 1] = !1;
    HistEnPassantCol[plyCount + 1] = -1;
    if (move.indexOf('--') === 0) {
        mvIsNull = 1;
        CheckLegality('--', plyCount);
        return !0
    }
    for (ii = move.length - 1; ii > 0; ii--) {
        if (!isNaN(move.charAt(ii))) {
            mvToCol = move.charCodeAt(ii - 1) - 97;
            mvToRow = move.charAt(ii) - 1;
            rem = move.substring(0, ii - 1);
            toRowMarker = ii;
            break
        }
    }
    if ((mvToCol < 0) || (mvToCol > 7) || (mvToRow < 0) || (mvToRow > 7)) {
        if (move.indexOf('O-O-O') === 0) {
            mvIsCastling = 1;
            mvPiece = 1;
            mvPieceId = 0;
            mvPieceOnTo = 1;
            mvFromCol = 4;
            mvToCol = 2;
            mvFromRow = 7 * MoveColor;
            mvToRow = 7 * MoveColor;
            return CheckLegality('O-O-O', plyCount)
        } else if (move.indexOf('O-O') === 0) {
            mvIsCastling = 1;
            mvPiece = 1;
            mvPieceId = 0;
            mvPieceOnTo = 1;
            mvFromCol = 4;
            mvToCol = 6;
            mvFromRow = 7 * MoveColor;
            mvToRow = 7 * MoveColor;
            return CheckLegality('O-O', plyCount)
        } else {
            return !1
        }
    }
    rem = rem.replace(/-/g, '');
    ll = rem.length;
    if (ll > 4) {
        return !1
    }
    mvPiece = -1;
    if (ll === 0) {
        mvPiece = 6
    } else {
        for (ii = 5; ii > 0; ii--) {
            if (rem.charAt(0) == PieceCode[ii - 1]) {
                mvPiece = ii;
                break
            }
        }
        if (mvPiece == -1) {
            if (columnsLetters.toLowerCase().indexOf(rem.charAt(0)) >= 0) {
                mvPiece = 6
            }
        }
        if (mvPiece == -1) {
            return !1
        }
        if (rem.charAt(ll - 1) == 'x') {
            mvCapture = 1
        }
        if (isNaN(move.charAt(ll - 1 - mvCapture))) {
            mvFromCol = move.charCodeAt(ll - 1 - mvCapture) - 97;
            if ((mvFromCol < 0) || (mvFromCol > 7)) {
                mvFromCol = -1
            }
        } else {
            mvFromRow = move.charAt(ll - 1 - mvCapture) - 1;
            if ((mvFromRow < 0) || (mvFromRow > 7)) {
                mvFromRow = -1
            } else {
                mvFromCol = move.charCodeAt(ll - 2 - mvCapture) - 97;
                if ((mvFromCol < 0) || (mvFromCol > 7)) {
                    mvFromCol = -1
                }
            }
        }
        if ((ll > 1) && (!mvCapture) && (mvFromCol == -1) && (mvFromRow == -1)) {
            return !1
        }
        if ((mvPiece == 6) && (!mvCapture) && (mvFromCol == -1) && (mvFromRow == -1)) {
            return !1
        }
    }
    mvPieceOnTo = mvPiece;
    if ((Board[mvToCol][mvToRow] !== 0) || ((mvPiece == 6) && (HistEnPassant[plyCount]) && (mvToCol == HistEnPassantCol[plyCount]) && (mvToRow == 5 - 3 * MoveColor))) {
        mvCapture = 1
    }
    if (mvPiece == 6) {
        ii = move.indexOf('=');
        if (ii < 0) {
            ii = toRowMarker
        }
        if ((ii > 0) && (ii < move.length - 1)) {
            var newPiece = move.charAt(ii + 1);
            if (newPiece == PieceCode[1]) {
                mvPieceOnTo = 2
            } else if (newPiece == PieceCode[2]) {
                mvPieceOnTo = 3
            } else if (newPiece == PieceCode[3]) {
                mvPieceOnTo = 4
            } else if (newPiece == PieceCode[4]) {
                mvPieceOnTo = 5
            }
            if (mvPieceOnTo != mvPiece) {
                mvIsPromotion = 1
            }
        }
        if ((mvToRow == 7 * (1 - MoveColor)) ? !mvIsPromotion : mvIsPromotion) {
            return !1
        }
    }
    if (mvCapture) {
        for (mvCapturedId = 15; mvCapturedId >= 0; mvCapturedId--) {
            if ((PieceType[1 - MoveColor][mvCapturedId] > 0) && (PieceCol[1 - MoveColor][mvCapturedId] == mvToCol) && (PieceRow[1 - MoveColor][mvCapturedId] == mvToRow)) {
                mvCaptured = PieceType[1 - MoveColor][mvCapturedId];
                if (mvCaptured == 1) {
                    return !1
                }
                break
            }
        }
        if ((mvPiece == 6) && (mvCapturedId < 1) && (HistEnPassant[plyCount])) {
            for (mvCapturedId = 15; mvCapturedId >= 0; mvCapturedId--) {
                if ((PieceType[1 - MoveColor][mvCapturedId] == 6) && (PieceCol[1 - MoveColor][mvCapturedId] == mvToCol) && (PieceRow[1 - MoveColor][mvCapturedId] == 4 - MoveColor)) {
                    mvCaptured = PieceType[1 - MoveColor][mvCapturedId];
                    break
                }
            }
        }
    }
    if (!CheckLegality(PieceCode[mvPiece - 1], plyCount)) {
        return !1
    }
    if (mvPiece == 6) {
        if (Math.abs(HistRow[0][plyCount] - mvToRow) == 2) {
            HistEnPassant[plyCount + 1] = !0;
            HistEnPassantCol[plyCount + 1] = mvToCol
        }
    }
    return !0
}

function SetGameSelectorOptions(head, num, chEvent, chSite, chRound, chWhite, chBlack, chResult, chDate) {
    if (typeof(head) == "string") {
        gameSelectorHead = head
    }
    gameSelectorNum = (num === !0);
    gameSelectorChEvent = Math.max(Math.min(chEvent, 32) || 0, 0) || 0;
    gameSelectorChSite = Math.max(Math.min(chSite, 32) || 0, 0) || 0;
    gameSelectorChRound = Math.max(Math.min(chRound, 32) || 0, 0) || 0;
    gameSelectorChWhite = Math.max(Math.min(chWhite, 32) || 0, 0) || 0;
    gameSelectorChBlack = Math.max(Math.min(chBlack, 32) || 0, 0) || 0;
    gameSelectorChResult = Math.max(Math.min(chResult, 32) || 0, 0) || 0;
    gameSelectorChDate = Math.max(Math.min(chDate, 32) || 0, 0) || 0
}
var clickedSquareInterval = null;

function clickedSquare(ii, jj) {
    if (clickedSquareInterval) {
        return
    }
    var squareId = 'tcol' + jj + 'trow' + ii;
    var theObj = document.getElementById(squareId);
    if (theObj) {
        var oldClass = theObj.className;
        theObj.className = (ii + jj) % 2 === 0 ? "blackSquare" : "whiteSquare";
        clickedSquareInterval = setTimeout("reset_after_click(" + ii + "," + jj + ",'" + oldClass + "','" + theObj.className + "')", 66);
        clearSelectedText()
    }
}

function reset_after_click(ii, jj, oldClass, newClass) {
    var theObj = document.getElementById('tcol' + jj + 'trow' + ii);
    if (theObj) {
        if (theObj.className == newClass) {
            theObj.className = oldClass
        }
        clickedSquareInterval = null
    }
}
var lastSearchPgnExpression = "";

function gameNumberSearchPgn(searchExpression, backward, includeCurrent) {
    lastSearchPgnExpression = searchExpression;
    if (searchExpression === "") {
        return !1
    }
    var newlinesRegExp = new RegExp("[\n\r]", "gm");
    var searchExpressionRegExp = new RegExp(searchExpression, "im");
    var thisCurrentGame = (currentGame < 0) || (currentGame >= numberOfGames) ? 0 : currentGame;
    var needle = fullPgnGame(thisCurrentGame);
    if (includeCurrent && needle.replace(newlinesRegExp, " ").match(searchExpressionRegExp)) {
        return thisCurrentGame
    }
    var delta = backward ? -1 : +1;
    for (var thisGame = (thisCurrentGame + delta + numberOfGames) % numberOfGames; thisGame != thisCurrentGame; thisGame = (thisGame + delta + numberOfGames) % numberOfGames) {
        needle = fullPgnGame(thisGame);
        if (needle.replace(newlinesRegExp, " ").match(searchExpressionRegExp)) {
            return thisGame
        }
    }
    return !1
}

function searchPgnGame(searchExpression, backward) {
    if (typeof(searchExpression) == "undefined") {
        searchExpression = ""
    }
    lastSearchPgnExpression = searchExpression;
    var theObj = document.getElementById('searchPgnExpression');
    if (theObj) {
        theObj.value = searchExpression
    }
    if ((searchExpression === "") || (numberOfGames < 2)) {
        return
    }
    var thisGame = gameNumberSearchPgn(searchExpression, backward, !1);
    if ((thisGame !== !1) && (thisGame != currentGame)) {
        Init(thisGame)
    }
}

function searchPgnGamePrompt() {
    if (numberOfGames < 2) {
        alert("info: search prompt disabled with less than 2 games");
        return
    }
    var searchExpression = prompt("Please enter search pattern for PGN games:", lastSearchPgnExpression);
    if (searchExpression) {
        searchPgnGame(searchExpression)
    }
}

function searchPgnGameForm() {
    var theObj = document.getElementById('searchPgnExpression');
    if (theObj) {
        searchPgnGame(document.getElementById('searchPgnExpression').value)
    }
}
var chessMovesRegExp = new RegExp("\\b((\\d+(\\.{1,3}|\\s)\\s*)?((([KQRBN][a-h1-8]?)|[a-h])?x?[a-h][1-8](=[QRNB])?|O-O-O|O-O)\\b[!?+#]*)", "g");

function fixCommentForDisplay(comment) {
    return comment.replace(chessMovesRegExp, '<SPAN CLASS="commentMove">$1</SPAN>')
}
var tableSize = 0;
var textSelectOptions = '';
var blackImgloaded = 0;
var whiteImgloaded = 0;

function fixsingleEval(evalgiven) {
    if (evalgiven >= minEval) {
        evalgiven = minEval;
    } else if (evalgiven <= -minEval) {
        evalgiven = -minEval;
    }
    return evalgiven;
}

function setEvalColors(theObj) {
    var whiteEval = 0;
    var blackEval = 0;
    var whiteMove = 0;
    var whitePly = 0;
    var blackPly = 0;
    var boxheight = 115;

    if (CurrentPly % 2 == 0) {
        whiteMove = 1;
        blackPly = CurrentPly;
        whitePly = CurrentPly - 1;
    } else {
        whiteMove = 0;
        blackPly = CurrentPly - 1;
        whitePly = CurrentPly;
    }

    if (MoveComments[blackPly]) {
        theMatch1 = MoveComments[blackPly].match(/ev=(.*?),/);
        theMatch2 = MoveComments[blackPly].match(/wv=(.*?)([, }])/);
        theMatch3 = MoveComments[blackPly];
        if (((theMatch1) && (theMatch2)) || ((!theMatch1) && (theMatch2))) {
            blackEval = theMatch2[1]
        } else if ((theMatch1) && (!theMatch2)) {
            blackEval = theMatch1[1]
        } else if (theMatch3 == "book") {
            blackEval = -1;
        }
    }
    if (MoveComments[whitePly]) {
        theMatch1 = MoveComments[whitePly].match(/ev=(.*?),/);
        theMatch2 = MoveComments[whitePly].match(/wv=(.*?)([, }])/);
        theMatch3 = MoveComments[whitePly];
        if (((theMatch1) && (theMatch2)) || ((!theMatch1) && (theMatch2))) {
            whiteEval = theMatch2[1]
        } else if ((theMatch1) && (!theMatch2)) {
            whiteEval = theMatch1[1]
        } else if (theMatch3 == "book") {
            whiteEval = -1;
        }
    }

    whiteEval = fixsingleEval(whiteEval);
    blackEval = fixsingleEval(blackEval);

    if (whiteMove && (blackEval == -1)) {
        blackEval = 0;
    }

    if (!whiteMove && (whiteEval == -1)) {
        whiteEval = 0;
    }

    if (!whiteMove) {
        if (whiteEval > 0) {
            var diffheight = 0;
            var totheight = 0;
            diffheight = whiteEval / minEval * boxheight;
            var newHeight;
            theObj = document.getElementById("whoswinningw");
            theObj.style.backgroundColor = 'white';
            theObj.style.height = boxheight + 'px';
            theObj = document.getElementById("whoswinningw1");
            theObj.style.backgroundColor = 'white';
            theObj.style.height = boxheight + 'px';
            theObj = document.getElementById("whoswinningb");
            newHeight = parseFloat(diffheight * 2).toFixed(0);
            theObj.style.backgroundColor = 'white';
            totheight = newHeight;
            theObj.style.height = newHeight + 'px';
            theObj = document.getElementById("whoswinningb1");
            remainHeight = boxheight * 2 - newHeight;
            remainHeight = parseFloat(remainHeight).toFixed(0);
            totheight = parseFloat(newHeight) + parseFloat(remainHeight);
            if (remainHeight <= 0) {
                remainHeight = 0;
            }
            theObj.style.height = remainHeight + 'px';
            theObj.style.backgroundColor = '#303030';
        } else if (whiteEval < 0) {
            var diffheight = 0;
            diffheight = whiteEval / minEval * boxheight;
            var newHeight;
            theObj = document.getElementById("whoswinningw1");
            newHeight = parseFloat(-diffheight * 2).toFixed(0);
            theObj.style.backgroundColor = '#303030';
            theObj.style.height = newHeight + 'px';
            theObj = document.getElementById("whoswinningw");
            remainHeight = boxheight * 2 - newHeight;
            remainHeight = parseFloat(remainHeight).toFixed(0);
            if (remainHeight <= 0) {
                remainHeight = 0;
            }
            theObj.style.height = remainHeight + 'px';
            theObj.style.backgroundColor = 'white';
            theObj = document.getElementById("whoswinningb");
            theObj.style.backgroundColor = '#303030';
            theObj.style.height = boxheight + 'px';
            theObj = document.getElementById("whoswinningb1");
            theObj.style.backgroundColor = '#303030';
            theObj.style.height = boxheight + 'px';
        } else {
            theObj = document.getElementById("whoswinningw");
            theObj.style.backgroundColor = 'white';
            theObj.style.height = boxheight + 'px';
            theObj = document.getElementById("whoswinningw1");
            theObj.style.backgroundColor = 'white';
            theObj.style.height = boxheight + 'px';
            theObj = document.getElementById("whoswinningb");
            theObj.style.backgroundColor = '#303030';
            theObj.style.height = boxheight + 'px';
            theObj = document.getElementById("whoswinningb1");
            theObj.style.backgroundColor = '#303030';
            theObj.style.height = boxheight + 'px';
        }
    } else if (whiteMove) {
        if (blackEval > 0) {
            var diffheight = 0;
            diffheight = blackEval / minEval * boxheight;
            var newHeight;
            theObj = document.getElementById("whoswinningw");
            theObj.style.backgroundColor = 'white';
            theObj.style.height = boxheight + 'px';
            theObj = document.getElementById("whoswinningw1");
            theObj.style.backgroundColor = 'white';
            theObj.style.height = boxheight + 'px';
            theObj = document.getElementById("whoswinningb");
            newHeight = parseFloat(diffheight * 2).toFixed(0);
            theObj.style.backgroundColor = 'white';
            theObj.style.height = newHeight + 'px';
            theObj = document.getElementById("whoswinningb1");
            remainHeight = boxheight * 2 - newHeight;
            remainHeight = parseFloat(remainHeight).toFixed(0);
            if (remainHeight <= 0) {
                remainHeight = 0;
            }
            theObj.style.height = remainHeight + 'px';
            theObj.style.backgroundColor = '#303030';
        } else if (blackEval < 0) {
            var diffheight = 0;
            diffheight = blackEval / minEval * boxheight;
            var newHeight;
            theObj = document.getElementById("whoswinningw1");
            newHeight = parseFloat(-diffheight * 2).toFixed(0);
            theObj.style.backgroundColor = '#303030';
            theObj.style.height = newHeight + 'px';
            theObj = document.getElementById("whoswinningw");
            remainHeight = boxheight * 2 - newHeight;
            remainHeight = parseFloat(remainHeight).toFixed(0);
            if (remainHeight <= 0) {
                remainHeight = 0;
            }
            theObj.style.height = remainHeight + 'px';
            theObj.style.backgroundColor = 'white';
            theObj = document.getElementById("whoswinningb");
            theObj.style.backgroundColor = '#303030';
            theObj.style.height = boxheight + 'px';
            theObj = document.getElementById("whoswinningb1");
            theObj.style.backgroundColor = '#303030';
            theObj.style.height = boxheight + 'px';
        } else {
            theObj = document.getElementById("whoswinningw");
            theObj.style.backgroundColor = 'white';
            theObj.style.height = boxheight + 'px';
            theObj = document.getElementById("whoswinningw1");
            theObj.style.backgroundColor = 'white';
            theObj.style.height = boxheight + 'px';
            theObj = document.getElementById("whoswinningb");
            theObj.style.backgroundColor = '#303030';
            theObj.style.height = boxheight + 'px';
            theObj = document.getElementById("whoswinningb1");
            theObj.style.backgroundColor = '#303030';
            theObj.style.height = boxheight + 'px';
        }
    }
}

/* evaljs */

var tempDom;

function Create2DArray(rows, cols, prop) {
    var darray = [];

    for (var i = 0; i < rows; i++) {
        darray.push([]);
        darray[i].push(new Array(cols));
        for (var j = 0; j < cols; j++) {
            darray[i].push([]);
            darray[i][j].push(new Array(prop));
            for (var k = 0; k < prop; k++) {
                darray[i][j][k] = 0;
            }
        }
    }

    return darray;
}

var currDiv = null;

function getLinkArch(gameNumber) 
{
   var retLink;
   if (currDiv == null)
   {
      var div = gameEvent[currentGame];
      currDiv = div.match(/- Division ([0-9]*)/);
   }

   if (currDiv == null)
   {
      return;
   }

   retLink = "http://www.tcec-chess.com/archive.html";
   retLink = retLink + "?se=" + jsSeasonInt ;
   retLink = retLink + "&di=" + currDiv[1];
   retLink = retLink + "&ga=" + gameNumber;

   if (finalInt != 0)
      retLink += "&f=" + finalInt;
   else if (playOffInt != 0)
      retLink += "&y=" + playOffInt;
   return (retLink);
}

function getLinkArchF(gameNumber) {
    var retLink;
    retLink = window.location.href.split('?')[0] + "?s=" + jsSeasonInt + "&gn=" + gameNumber;
    if (finalInt != 0)
        retLink += "&f=" + finalInt;
    else if (playOffInt != 0)
        retLink += "&y=" + playOffInt;
    return (retLink);
}

function assignScores(engArray, arr, firstEngine, secondEngine, firstScore, secondScore, gameNumber) {
    var first = 4;
    var second = 4;
    var firstVal = '';
    var secondVal = '';

    for (var i = 0; i < engArray.length; i++) {
        if (engArray[i].localeCompare(firstEngine.trim()) == 0) {
            first = i;
        }
        if (engArray[i].localeCompare(secondEngine.trim()) == 0) {
            second = i;
        }
    }

    if (first > second) {
        if (firstScore.localeCompare("1/2") == 0) {
            firstVal = "=";
        } else if (firstScore.localeCompare("0") == 0) {
            firstVal = "1";
            arr[second][first][5] = parseFloat(arr[second][first][5]) + parseFloat(1);
        } else if (firstScore.localeCompare("1") == 0) {
            firstVal = "0";
            arr[first][second][4] = parseFloat(arr[first][second][4]) + parseFloat(1);
        }
        arr[second][first][0] = getAbbName(firstEngine.trim());
        arr[second][first][1] = parseFloat(arr[second][first][1]) + parseFloat(1);
        if (!arr[second][first][2]) {
            arr[second][first][2] = new Array();
        }
        arr[second][first][2].push(firstVal);
        arr[second][first][2].push(gameNumber);
        arr[second][first][3] = arr[second][first][4] + arr[second][first][5];
        arr[first][second][3] = arr[first][second][4] + arr[first][second][5];
    } else {
        if (secondScore.localeCompare("1/2") == 0) {
            firstVal = "=";
        } else if (secondScore.localeCompare("0") == 0) {
            firstVal = "1";
            arr[first][second][4] = parseFloat(arr[first][second][4]) + parseFloat(1);
        } else if (secondScore.localeCompare("1") == 0) {
            firstVal = "0";
            arr[second][first][5] = parseFloat(arr[second][first][5]) + parseFloat(1);
        }
        arr[first][second][0] = getAbbName(secondEngine.trim());
        arr[first][second][1] = parseFloat(arr[first][second][1]) + parseFloat(1);
        if (!arr[first][second][2]) {
            arr[first][second][2] = new Array();
        }
        arr[first][second][2].push(firstVal);
        arr[first][second][2].push(gameNumber);
        arr[first][second][3] = arr[first][second][4] + arr[first][second][5];
        arr[second][first][3] = arr[second][first][4] + arr[second][first][5];
    }
}

function findFirstColumn(name) {
    var tables = tempDom.find("table");
    var tbl = tables[0];
    var tr = tbl.getElementsByTagName("tr");
    var firstColumn = 0;

    var cells = tr[0].cells;
    for (var i = 0, len = cells.length; i < len; ++i) {
        var thisTdElem = cells[i];
        var thisTextNode = thisTdElem.childNodes.item(0);
        var thisData = thisTextNode.data;
        if (thisData == null || thisData == undefined)
            return (i + 1);
        var thisDataTrim = thisData.trim();
        firstColumn += cells[i].colSpan;
        if (thisDataTrim.localeCompare(name) == 0) {
            return (i + 1);
        }
    }
}

function getTableColumnCount() {
    var tables = tempDom.find("table");
    var tbl = tables[0];
    var tr = tbl.getElementsByTagName("tr");
    var columnCount = 0;
    var cells = tr[0].cells;

    for (var i = 0, len = cells.length; i < len; ++i) 
    {
        var thisTdElem = cells[i];
        if (thisTdElem == null || thisTdElem == undefined)
            return (i + 1);
        var thisTextNode = thisTdElem.childNodes.item(0);
        if (thisTextNode == null || thisTextNode == undefined)
            return (i + 1);
        var thisData = thisTextNode.data;
        if (thisData == null || thisData == undefined)
            return (i + 1);
        var thisDataTrim = thisData.trim();
        if (thisDataTrim.localeCompare(name) == 0) {
            return (i + 1);
        }
    }

    return cells.length;
}

function getAbbName(enginename) 
{
    if (enginename.search(/.*Houdini.*/i) == 0) 
    {
        return ("Ho");
    } 
    else if (enginename.search(/.*Stockfish.*/i) == 0) 
    {
        return ("SF");
    } 
    else if (enginename.search(/.*Komodo.*/i) == 0) 
    {
        return ("Ko");
    } 
    else if (enginename.search(/.*asmFish.*/i) == 0) 
    {
        return ("As");
    }
    else if (enginename.search(/.*MysteryX.*/i) == 0) 
    {
        return ("MX3");
    }
    return null;
}

function getKomodoName(str) 
{
    if (kver)
    {
        if (str.search(/.*Komodo.*/i) == 0) 
        {
            return ("Komodo " + kver);
        }
    }
    return str;
}

function ylcetAddGamesPlayedFirstTable() 
{
   if ((jsSeasonInt <= 5) ||
      ((jsSeasonInt == 6) && (finalInt == 0)))
   {
      ylcetAddGamesPlayedFirstTableOld();
   } 
   else 
   {
      ylcetAddGamesPlayedFirstTableNew();
   }
}

function ylcetAddGamesPlayedFirstTableNew() 
{
    var tables = tempDom.find("table");
    var tr = tables[0].getElementsByTagName("tr");

    var columnCount = findFirstColumn("SB");
    var tolColno = getTableColumnCount();
    var games = 0;

    tables[0].id = "tblBordered";

    var tdiv = document.getElementById('cross_divs');
    $("#cross_divs").html("");
    tdiv.appendChild(tables[0]);

    for (i = tr.length - 1; i >= 0; i--) {
        if (isRowEmpty(tr, i, 0)) {
            tables[0].deleteRow(i);
        }
    }

    var values = []; // to hold our values for data table
    // get our values
    $('#tblBordered tr').each(function(i, v) {
        values[i] = [];
        // select either th or td, doesn't matter
        var lastIndex = 0;
        $(this).children('th,td').each(function(ii, vv) {
            values[i][ii] = $(this).html();
            lastIndex = ii;
        });
    });

    var dataTable = google.visualization.arrayToDataTable(values);
    var dataView = new google.visualization.DataView(dataTable);
    var table = new google.visualization.Table(document.getElementById('cross_divs'));
    var cssClassNames = {headerRow: 'headercol', tableRow: 'rownormal', oddTableRow:'rowodd'};    
    var options = {
        'showRowNumber': false,
        'allowHtml': true,
        'cssClassNames': cssClassNames,
        'sortColumn': 0,
        'sortAscending': true,
        'width': '100%',
        'legend': {
            position: 'top',
            maxLines: 3
        },
        'title': 'Population Density (people/km^2)',
        'backgroundColor': 'red'
    }

    table.draw(dataView, options);

    //////console.log("Arun: Crosstable created");

    return 1;
}

function drawCrosstable() 
{
    var tables = tempDom.find("table");
    var tr = tables[0].getElementsByTagName("tr");

    var columnCount = findFirstColumn("SB");
    var tolColno = getTableColumnCount();
    var games = 0;

    tables[0].id = "tblBordered";

    var tdiv = document.getElementById('cross_divs');
    $("#cross_divs").html("");
    tdiv.appendChild(tables[0]);

    for (i = tr.length - 1; i >= 0; i--) {
        if (isRowEmpty(tr, i, 0)) {
            tables[0].deleteRow(i);
        }
    }

    var values = []; // to hold our values for data table
    // get our values
    $('#tblBordered tr').each(function(i, v) {
        values[i] = [];
        // select either th or td, doesn't matter
        var lastIndex = 0;
        $(this).children('th,td').each(function(ii, vv) {
            values[i][ii] = $(this).html();
            lastIndex = ii;
        });
    });

    var dataTable = google.visualization.arrayToDataTable(values);
    var dataView = new google.visualization.DataView(dataTable);
    var table = new google.visualization.Table(document.getElementById('cross_divs'));
    var cssClassNames = {headerRow: 'headercol', tableRow: 'rownormal', oddTableRow:'rowodd'};    
    var options = {
        'showRowNumber': false,
        'allowHtml': true,
        'cssClassNames': cssClassNames,
        'sortColumn': 0,
        'sortAscending': true,
        'width': '100%',
        'legend': {
            position: 'top',
            maxLines: 3
        },
        'title': 'Population Density (people/km^2)',
        'backgroundColor': 'red'
    }

    table.draw(dataView, options);

    //////console.log("Arun: Crosstable created");

    return 1;
}

function ylcetAddGamesPlayedFirstTableOld() {
    var tables = tempDom.find("table");
    var tr = tables[0].getElementsByTagName("tr");

    var columnCount = findFirstColumn("SB");
    var tolColno = getTableColumnCount();
    var games = 0;

    tables[0].id = "tblBordered";

    for (i = 0; i < tr.length; i++) {
        var td = document.createElement('td');
        var input = document.createTextNode('INPUT');
        games = 0;

        var cells = tr[i].cells;
        var thisTdElem = cells[0];
        var thisTextNode = thisTdElem.childNodes.item(0);
        var thisData = thisTextNode.data;
        if (thisData == null || thisData == undefined) {
            tables[0].deleteRow(i);
            continue;
        }
        var thisDataTrim = thisData.trim();

        if (thisDataTrim.localeCompare("") == 0) {
            tables[0].deleteRow(i);
            continue;
        }

        if (i == 0) {
            var newCell = tr[i].insertCell(4);
            var newText = document.createTextNode("Games");
            newCell.appendChild(newText);
            var thisTdElem = tr[i].cells[4];
            for (var j = 0; j <= tolColno; j++) {
                var thisTdElem = tr[i].cells[j];
                thisTdElem.className = "headercol";
            }
            for (var j = columnCount; j <= tolColno; j++) {
                var thisTdElem = cells[j];
                var thisTextNode = thisTdElem.childNodes.item(0);
                if (thisTextNode == undefined || thisTextNode == null) {
                    break;
                }
                var thisData = thisTextNode.data;
                if (thisData == null || thisData == undefined) {
                    break;
                }
                var thisDataTrim = thisData.trim();
                var thisNumber = thisTextNode.data;
                var str = thisTextNode.data;
                var retname = getAbbName(thisDataTrim);
                if (retname != null) {
                    thisTdElem.innerHTML = retname;
                }
            }
            continue;
        } else {
            if (1) /* komodo */ {
                var thisTdElem = cells[1];
                var thisTextNode = thisTdElem.childNodes.item(0);
                var thisData = thisTextNode.data;
                var thisDataTrim = thisData.trim();
                var thisNumber = thisTextNode.data;
                var str = thisTextNode.data;
                str = getKomodoName(str);
                thisTextNode.data = str;
            }

            for (var j = columnCount; j < tolColno; j++) {
                var thisTdElem = cells[j];
                var thisTextNode = thisTdElem.childNodes.item(0);
                var thisData = thisTextNode.data;
                var thisDataTrim = thisData.trim();
                var thisNumber = thisTextNode.data;
                var str = thisTextNode.data;
                if (isNaN(thisNumber)) {
                    var res = str.split(" ");

                    for (a in res) {
                        var strx = res[a];
                        if (strx.localeCompare("+") == 0) {
                            var b = parseFloat(a) + 1;
                            games = games + parseFloat(res[b]);
                        } else if (strx.localeCompare("=") == 0) {
                            var b = parseFloat(a) + 1;
                            games = games + parseFloat(res[b]);
                        } else if (strx.localeCompare("-") == 0) {
                            var b = parseFloat(a) + 1;
                            games = games + parseFloat(res[b]);
                        }
                    }
                    /* remove or comment out lines if viewers don't like crosstablex */
                    str = str.replace(/ /g,'');
                    thisTdElem.innerHTML = str;
                }
            }

            var newCell = tr[i].insertCell(4);
            var newText = document.createTextNode(games);
            newCell.appendChild(newText);
            for (var j = 0; j <= tolColno; j++) {
                var thisTdElemx = tr[i].cells[j];
                var thisTextNode = thisTdElemx.childNodes.item(0);
                var thisData = thisTextNode.data;
                if (j == 0) {
                    thisTdElemx.setAttribute('style', 'width:20px');
                    thisTdElemx.className = "regularcol";
                } else if (j == 1) {
                    thisTdElemx.setAttribute('style', 'width:220px');
                    thisTdElemx.className = "regularcol";
                } else if (j == 2) {
                    thisTdElemx.setAttribute('style', 'width:60px');
                    thisTdElemx.className = "regularcol";
                } else if (j == 3) {
                    thisTdElemx.setAttribute('style', 'width:80px');
                    thisTdElemx.className = "regularcol";
                } else if (j == 4) {
                    thisTdElemx.setAttribute('style', 'width:50px');
                    thisTdElemx.className = "regularcol";
                } else if (j >= 5) {
                    thisTdElemx.setAttribute('style', 'width:120px');
                    thisTdElemx.className = "regularcol";
                }
            }
        }
    }

    /* //////console.log ("Added played column1"); */
    for (i = tr.length - 1; i >= 0; i--) {
        var cells = tr[i].cells;
        var thisTdElem = cells[0];
        var thisTextNode = thisTdElem.childNodes.item(0);
        var thisData = thisTextNode.data;
        if (thisData == null || thisData == undefined) {
            tables[0].deleteRow(i);
            continue;
        }
        var thisDataTrim = thisData.trim();
        if (thisDataTrim.localeCompare("") == 0) {
            tables[0].deleteRow(i);
            continue;
        }
    }

    var tdiv = document.getElementById('cross_divs');
    $("#cross_divs").html("");
    tables[0].id = "tblBordered1";
    tdiv.appendChild(tables[0]);

    var values = []; // to hold our values for data table
    // get our values
    $('#tblBordered1 tr').each(function(i, v) {
        values[i] = [];
        // select either th or td, doesn't matter
        var lastIndex = 0;
        $(this).children('th,td').each(function(ii, vv) {
            values[i][ii] = $(this).html();
            lastIndex = ii;
        });
    });

    var dataTable = google.visualization.arrayToDataTable(values);
    var dataView = new google.visualization.DataView(dataTable);
    var table = new google.visualization.Table(document.getElementById('cross_divs'));
    var cssClassNames = {headerRow: 'headercol', tableRow: 'rownormal', oddTableRow:'rowodd'};    
    var options = {
        'showRowNumber': false,
        'allowHtml': true,
        'cssClassNames': cssClassNames,
        'sortColumn': 0,
        'sortAscending': true,
        'width': '100%',
        'legend': {
            position: 'top',
            maxLines: 3
        },
        'title': 'Population Density (people/km^2)',
        'backgroundColor': 'red'
    }

    table.draw(dataView, options);

    //////console.log("Arun: Crosstable created");

    return 1;
}

function findEngineArraySched() {
    var tbls = tempDom.find("table");
    var tbl = tbls[0];
    var tr = tbl.getElementsByTagName("tr");
    var cells = tr[0].cells;

    /* ylcet: Even if worst case there are more than 3 engines, we need not
     * proceed more than 8 rows
     */
    for (i = 1; i < 6; i++) {
        var firsrCell = tr[i].cells;
        var thisTdElem = firsrCell[1];
        var thisTextNode = thisTdElem.childNodes.item(0);
        var thisData = thisTextNode.data;
        var thisDataTrim = thisData.trim();
        if (thisDataTrim.localeCompare("") == 0) {
            break;
        }
        engineArray[i - 1] = thisDataTrim;
    }
    var unique = engineArray.filter(function(elem, index, self) {
        return index === self.indexOf(elem);
    });
    engineArray = unique;
}

function getTablefirstColumn() {
    var tbls = tempDom.find("table");
    var tbl = tbls[0];
    var tr = tbl.getElementsByTagName("tr");
    var firstColumn = 0;
    var cells = tr[0].cells;

    return cells.length;
}

function copyCell(readCell, writeCell, count) {
    var thisTdElem = readCell[count];
    var thisTextNode = thisTdElem.childNodes.item(0);
    var thisData = thisTextNode.data;
    var thisDataTrim = thisData.trim();

    var cellCnt = 0;
    var tr = document.createElement('tr');
    var newCell = tr.insertCell(count);
    var newText = document.createTextNode('');
    newCell.appendChild(newText);
    newCell.className = "regularcol";
    return newCell;
}

function openArchGame(gameNum) {
    var dirUrl = document.getElementById('directurl');
    if (dirUrl) {
        dirUrl.innerHTML = getLinkArchF(gameNum);
        dirUrl.href = getLinkArchF(gameNum);
    }
    $(window).scrollTop(0);
    Init(gameNum - 1);
    return false;
}

function isRowEmpty(tr, i, col) {
    var cells = tr[i].cells;
    var thisTdElem = cells[col];
    if (thisTdElem == null)
        return 1;
    var thisTextNode = thisTdElem.childNodes.item(0);
    if (thisTextNode == null)
      return 1;
    var thisData = thisTextNode.data;
    if (thisData == null || thisData == undefined) {
        return 1;
    }
    var thisDataTrim = thisData.trim();

    if (thisDataTrim.localeCompare("") == 0) {
        return 1;
    }
    return 0;
}

function hmsToSecondsOnly(str) {
    var p = str.split(':'),
        s = 0,
        m = 1;

    while (p.length > 0) {
        s += m * parseInt(p.pop(), 10);
        m *= 60;
    }

    return s;
}

function getAbbNameList(myList)
{
   var arrayList = [];
   var keysArray = Object.keys(myList.Table);
   for (var i = 0; i < keysArray.length; i++) 
   {
      var key = keysArray[i]; // here is "name" of object property
      var value = myList.Table[myList.Order[i]].Abbreviation; // here get value "by name" as it expected with objects
      arrayList.push(value);
   }
   return arrayList;
}

function drawStandingsNew(myList1, selector) 
{
   var tempDom = document.getElementById('cross_divs');
   var myList = null;

   if (tempDom) 
   {
      $("#cross_divs").html("");
   }
   tempDom = document.getElementById('info_divs1');
   if (tempDom) 
   {
      $("#info_divs1").html("");
   }

   try 
   {
      myList = JSON.parse(myList1);
   } 
   catch(e) 
   {
      CrosstableLastModifiedHeader1 = (new Date(0)).toUTCString();
      myupdateCrosstable();
   }

   ////console.log ("myList standing length:" + myList.length);

   var abbrList = [];
   abbrList = getAbbNameList(myList);
   var table = document.createElement('table');
   var row = table.insertRow(0);
   var columns = addAllColumnHeadersStand(row);
   var keysArray = Object.keys(myList.Table);
   var columns = addAllColumnHeadersCross(row, abbrList);

   for (var i = 0; i < abbrList.length ; i++)
   {
      var row = table.insertRow(i+1);

      var totWin = myList.Table[myList.Order[i]].WinsAsBlack +
                     myList.Table[myList.Order[i]].WinsAsWhite;
      var totWWin = myList.Table[myList.Order[i]].WinsAsWhite;
      var totBWin = myList.Table[myList.Order[i]].WinsAsBlack;
      var totWinStr = totWin + " [" + totWWin + "/" + totBWin + "]";

      var count = 0;
      var cell = row.insertCell(count);
      count = count + 1;
      cell.innerHTML = myList.Table[myList.Order[i]].Rank;
      var cell = row.insertCell(count);
      count = count + 1;
      cell.innerHTML = myList.Order[i];
      var cell = row.insertCell(count);
      count = count + 1;
      cell.innerHTML = myList.Table[myList.Order[i]].Games;
      var cell = row.insertCell(count);
      count = count + 1;
      var score = myList.Table[myList.Order[i]].Score;
      score = score.toFixed(1);
      cell.innerHTML = score;
      var cell = row.insertCell(count);
      count = count + 1;
      cell.innerHTML = totWinStr;
      var cell = row.insertCell(count);
      count = count + 1;
      cell.innerHTML = myList.Table[myList.Order[i]].Strikes;
      var cell = row.insertCell(count);
      count = count + 1;
      var sb = myList.Table[myList.Order[i]].Neustadtl;
      sb = sb.toFixed(2);
      cell.innerHTML = sb;
      var cell = row.insertCell(count);
      count = count + 1;
      cell.innerHTML = myList.Table[myList.Order[i]].Rating;
      var cell = row.insertCell(count);
      count = count + 1;
      var elo1 = parseInt(myList.Table[myList.Order[i]].Elo);
      var elo = elo1 + myList.Table[myList.Order[i]].Rating;
      cell.innerHTML = elo1 + "  [" + elo + "]";

      var mainEngine = myList.Order[i];
      var regex = new RegExp("(([^&#]*) )");
      var results = regex.exec(mainEngine)
      mainEngine = results[0];
      var colors = ["hyperClassG", "hyperClassR", "hyperClassW"];
      if (1)
      {
         for (var j = 0; j < abbrList.length ; j++)
         {
            cell = row.insertCell(j+count);
            cell.innerHTML = '';
            if (i != j)
            {
               var gameLength = myList.Table[myList.Order[i]].Results[myList.Order[j]].Scores.length;
               compEngine = myList.Order[j];
               results = regex.exec(compEngine);
               compEngine = results[0];
               var gameX = 0;
               for (var x = 0 ; x < gameLength ; x++)
               {
                  gameX = parseInt(x/2);
                  var link = document.createElement("a");
                  var htmlData = myList.Table[myList.Order[i]].Results[myList.Order[j]].Scores[x].Game;
                  var linkData = getLinkArch(htmlData);
                  link.className = "hyperClass";
                  link.setAttribute("onClick", "return myloadGame(" + htmlData + ")");

                  var winner = myList.Table[myList.Order[i]].Results[myList.Order[j]].Scores[x].Winner;
                  var resultN = myList.Table[myList.Order[i]].Results[myList.Order[j]].Scores[x].Result
                  var result = '';
                  resultN = parseFloat(resultN);
                  var gameXColor = parseInt(gameX%3);  
                  link.className = colors[gameXColor];
                  if (resultN === 1)
                  {
                     if (winner.match(/white/i))
                     {
                        result = " 1 - 0";
                        result = mainEngine + " vs " + compEngine + "   " + result;
                     }
                     else if (winner.match(/black/i))
                     {
                        result = " 0 - 1";
                        result = compEngine + " vs " + mainEngine + "   " + result;
                     }
                  }
                  else if (resultN === 0)
                  {
                     if (winner.match(/white/i))
                     {
                        result = " 1 - 0";
                        result = compEngine + " vs " + mainEngine + "   " + result;
                     }
                     else if (winner.match(/black/i))
                     {
                        result = " 0 - 1";
                        result = mainEngine + " vs " + compEngine + "   " + result;
                     }
                  }
                  else
                  {
                     result = "1/2 - 1/2";
                     result = mainEngine + " vs " + compEngine + "   " + result;
                  }
                  link.title = "Game#:  " + htmlData + ", Result:  " + result;
                  link.target = "_blank";
                  result = getModifiedResult(resultN);
                  var linkText = document.createTextNode(result);
                  link.appendChild(linkText);
                  link.style.cursor = "pointer"; 
                  cell.innerHTML += ' ';
                  cell.appendChild(link);
               }
            }
            else
            {
               cell.innerHTML= '...';
            }
         }
      }
   }

   $(selector).append(table);
   var values = []; // to hold our values for data table
   // get our values
   var emptyRowfound = 0;
   tempDom = document.getElementById('cross_divs');
   var tablex = document.getElementById('cross_divs');
   var tr = tempDom.getElementsByTagName("tr");
   var rowCount = tr.length;
   var currentGameNum = 0;

   $('#cross_divs tr').each(function(i, v) {
      values[i] = [];
      // select either th or td, doesn't matter
      var lastIndex = 0;
      $(this).children('th,td').each(function(ii, vv) {
         values[i][ii] = $(this).html();
         lastIndex = ii;
      });
   });

   var dataTable1 = google.visualization.arrayToDataTable(values);
   if (1)
   {
   dataTable1.setProperty(0, 0, 'style', 'width:7px');
   dataTable1.setProperty(0, 1, 'style', 'width:290px');
   dataTable1.setProperty(0, 2, 'style', 'width:23px');
   dataTable1.setProperty(0, 3, 'style', 'width:24px');
   dataTable1.setProperty(0, 4, 'style', 'width:24px');
   dataTable1.setProperty(0, 5, 'style', 'width:20px');
   dataTable1.setProperty(0, 6, 'style', 'width:20px');
   dataTable1.setProperty(0, 7, 'style', 'width:55px');
   dataTable1.setProperty(0, 8, 'style', 'width:55px');
   dataTable1.setProperty(0, 9, 'style', 'width:55px');
   dataTable1.setProperty(0, 10, 'style', 'width:55px');
   dataTable1.setProperty(0, 11, 'style', 'width:55px');
   dataTable1.setProperty(0, 12, 'style', 'width:55px');
   dataTable1.setProperty(0, 13, 'style', 'width:55px');
   dataTable1.setProperty(0, 14, 'style', 'width:55px');
   dataTable1.setProperty(0, 15, 'style', 'width:55px');
   dataTable1.setProperty(0, 16, 'style', 'width:55px');
   }
   var dataView1 = new google.visualization.DataView(dataTable1);
   var table1 = new google.visualization.Table(document.getElementById('cross_divs'));
    var cssClassNames = {headerRow: 'headercol', tableRow: 'rownormal', oddTableRow:'rowodd'};    
   knownHeight = 38 * abbrList.length; 
    var options1 = {
      'showRowNumber': false,
      'allowHtml': true,
      'cssClassNames': cssClassNames,
      'sort': 'event',
      'sortAscending': true,
      'height': knownHeight,
      'legend': {
         position: 'top',
         maxLines: 3
      },
      'title': 'Population Density (people/km^2)',
      'backgroundColor': 'red'
   }

   google.visualization.events.addListener(table1, 'sort', function(sender) {
      var sortColumn;
      dataTable = google.visualization.arrayToDataTable(values);
      //////console.log ("sender.column:" + sender.column);

      switch (sender.column) {
         case 0:
         case 1:
         case 2:
         case 3:
         case 6:
         case 5:
         case 7:
         case 8:
         case 9:
         case 10:
         sortColumn = sender.column;
         if (emptyRowfound >= 1)
            dataTable.removeRows(emptyRowfound - 1, rowCount - (emptyRowfound - 1));
         break;
         default:
         sortColumn = sender.column;
         break;
      }

      options1.sortAscending = sender.ascending;
      options1.sortColumn = sender.column;
      dataTable.sort([{column: sortColumn, desc: !sender.ascending}]);
      dataView = new google.visualization.DataView(dataTable);
      table1.draw(dataView, options1);
   });
   dataTable1.sort([{
      column: 0
   }]);
   dataView1 = new google.visualization.DataView(dataTable1);
   table1.draw(dataView1, options1);
   document.getElementById('cross_divs').style.height = 42 * abbrList.length + "px";
}

var evalchartoptions = {
                //curveType: 'function',
                fontName: 'Tahoma',
                fontSize: '9',
                backgroundColor: '#9c9c9c',
                height: '291',
                width: '100%',
                pointSize: '3',
                lineWidth: '1',
                legend: {
                    position: 'none'
                },
                chartArea: {
                    top: 10,
                    width: '99%',
                    height: '80%',
                },
                colors: ['#ffffff', '#333333', 'brown'],
                hAxis: {
                    textPosition: 'out',
                    slantedText: 0,
                    textStyle: {
                        color: '#000000'
                    },
                    maxAlternation: 1,
                    viewWindowMode: 'maximized'
                },
                vAxis: {
                    format: '0.00',
                    textPosition: 'in',
                    gridlines: {
                        color: '#e5e3de',
                        count: 7
                    },
                    textStyle: {
                        color: '#000000'
                    },
                    baselineColor: '#000000',
                    viewWindowMode: 'maximized'
                },
                tooltip: {
                    textStyle: {
                        color: '#000000'
                    }
                },
                interpolateNulls: true
            };
            
function drawSfPV(myList1, selector) 
{
   var myList;
   try 
   {
      myList = JSON.parse(myList1);
   } 
   catch(e) 
   {
      //////console.log ("caught" + e);
      myupdateLiveSf();
   }

   var keysArray = Object.keys(myList);

   var tempDom = document.getElementById('sfeval');
   if (tempDom) 
   {
      $("#sfeval").html("");
   }
   var row = $('<tr/>');
   row.append($('<th/>').html("Eng"))
   row.append($('<th/>').html("Eval"))
   row.append($('<th/>').html("PV"))
   row.append($('<th/>').html("Depth"))
   row.append($('<th/>').html("Speed"))
   row.append($('<th/>').html("Nodes"))
   row.append($('<th/>').html("TBhits"))
   $(selector).append(row);
   for (var i = 0 ; i < keysArray.length ; i ++) 
   {
      row = $('<tr/>');
      var eng = keysArray[i];
      var score = 0;
      if (!isNaN(myList[keysArray[i]].eval))
      {
         score = parseFloat(myList[keysArray[i]].eval);
      }
      else
      {
         score = myList[keysArray[i]].eval;
      }
      var pv = myList[keysArray[i]].pv;
      var depth = myList[keysArray[i]].depth;
      var speed = myList[keysArray[i]].speed;
      var nodes = myList[keysArray[i]].nodes;
      var tbhits= parseFloat(myList[keysArray[i]].tbhits/1000, 0);
      pv = pv.split(/\s+/).slice(0,4).join(" ");
      if (pv.search(/.*\.\.\..*/i) == 0)
      {
         if (!isNaN(score))
         {
            score = parseFloat(score) * -1;
            if (score === 0)
            {
               score = 0;
            }
         } 
      }
      if (!isNaN(score))
      {
         score = score.toFixed(2);
      }
      var evalPv = pv.match(/(.*?)\..*/i);
      if (evalPv && evalPv[1])
      {
         var moveIndex = parseInt(evalPv[1]);
         console.log ("movenum is :" + moveIndex);
        if (evalchartdataFound && !evalchartdata[moveIndex]) {
            evalchartdata[moveIndex] = new Array(4);
            evalchartdata[moveIndex][0] = moveIndex + "";
            evalchartdata[moveIndex][1] = NaN;
            evalchartdata[moveIndex][2] = NaN;
            evalchartdata[moveIndex][3] = NaN;
        }
        if (evalchartdataFound)
            evalchartdata[moveIndex][3] = score;   
      }  
      tbhits= tbhits.toFixed(0);
      tbhits = tbhits + "k";
      
      row.append($('<td/>').html(eng));
      row.append($('<td/>').html(score));
      row.append($('<td/>').html(pv));
      row.append($('<td/>').html(depth));
      row.append($('<td/>').html(speed));
      row.append($('<td/>').html(nodes));
      row.append($('<td/>').html(tbhits));
      $(selector).append(row);
   } 

   if (evalchartdataFound)
   {
       //evalchart.draw(google.visualization.arrayToDataTable(evalchartdata), evalchartoptions); 
   }

   var values = []; // to hold our values for data table


   // get our values
   tempDom = document.getElementById('sfeval');
   var tr = tempDom.getElementsByTagName("tr");
   var rowCount = tr.length;
   var currentGameNum = 0;

   $('#sfeval tr').each(function(i, v) {
      values[i] = [];
      // select either th or td, doesn't matter
      var lastIndex = 0;
      $(this).children('th,td').each(function(ii, vv) {
         values[i][ii] = $(this).html();
         lastIndex = ii;
      });
   });

   var dataTable1 = google.visualization.arrayToDataTable(values);
   dataTable1.setProperty(0, 0, 'style', 'width:90px');
   dataTable1.setProperty(0, 1, 'style', 'width:40px');
   dataTable1.setProperty(0, 2, 'style', 'width:300px');
   dataTable1.setProperty(0, 3, 'style', 'width:35px');
   dataTable1.setProperty(0, 4, 'style', 'width:35px');
   dataTable1.setProperty(0, 4, 'style', 'width:40px');
   var dataView1 = new google.visualization.DataView(dataTable1);
   var table1 = new google.visualization.Table(document.getElementById('sfeval'));
   var cssClassNames = {headerRow: 'headercol', tableRow: 'rownormalPv', oddTableRow:'rowoddPv'};
   var options1 = {
      'showRowNumber': false,
      'allowHtml': true,
      'cssClassNames': cssClassNames,
      'sortAscending': true,
      'legend': {
         position: 'top',
         maxLines: 3
      },
      'title': 'Population Density (people/km^2)',
      'backgroundColor': 'red',
      'height': '100%'
   }

   dataTable1.sort([{
      column: 0
   }]);
   dataView1 = new google.visualization.DataView(dataTable1);
   table1.draw(dataView1, options1);
}

function getModifiedResult(result)
{
   var lresult = parseFloat(result);
   if (lresult === 0.5)
   {
      return "=";
   }
   return result;
}

function drawCrosstableNew(myList1, selector) 
{
   var myList = null;

   try 
   {
      myList = JSON.parse(myList1);
   } 
   catch(e) 
   {
      CrosstableLastModifiedHeader1 = (new Date(0)).toUTCString();
      myupdateCrosstable();
   }

   ////console.log ("myList cross length:" + myList.length);

   var abbrList = [];
   abbrList = getAbbNameList(myList);

   var table = document.createElement('table');

   var columns = addAllColumnHeadersCross(table, abbrList);

   var keysArray = Object.keys(myList.Table);
   for (var i = 0; i < keysArray.length; i++) 
   {
      var key = keysArray[i]; // here is "name" of object property
      var value = myList.Table[key].Elo; // here get value "by name" as it expected with objects
      ////le.log("keyo:" + key + "," , value);
   }

   for (var i = 0; i < abbrList.length ; i++)
   {
      var row = table.insertRow(i+1);
      var cell = row.insertCell(0);
      var mainEngine = keysArray[i];
      var regex = new RegExp("(([^&#]*) )");
      var results = regex.exec(mainEngine);
      cell.innerHTML = results[0];
      mainEngine = results[0];
      for (var j = 0; j < abbrList.length ; j++)
      {
         cell = row.insertCell(j+1);
         cell.innerHTML = '';
         if (i != j)
         {
            var gameLength = myList.Table[myList.Order[i]].Results[myList.Order[j]].Scores.length;
            compEngine = keysArray[j];
            results = regex.exec(compEngine);
            compEngine = results[0];
            for (var x = 0 ; x < gameLength ; x++)
            {
               var link = document.createElement("a");
               var htmlData = myList.Table[myList.Order[i]].Results[myList.Order[j]].Scores[x].Game;
               var linkData = getLinkArch(htmlData);
               link.setAttribute("href", linkData);
               var winner = myList.Table[myList.Order[i]].Results[myList.Order[j]].Scores[x].Winner;
               var resultN = myList.Table[myList.Order[i]].Results[myList.Order[j]].Scores[x].Result
               var result = '';
               resultN = parseFloat(resultN);
               if (resultN === 1)
               {
                  link.className = "hyperClassW";
               }   
               else if (resultN === 0)
               {
                  link.className = "hyperClassR";
               }   
               else
               {
                  link.className = "hyperClassB";
               }   
               if (resultN === 1)
               {
                  if (winner.match(/white/i))
                  {
                     result = " 1 - 0";
                     result = mainEngine + " vs " + compEngine + "   " + result;
                  }
                  else if (winner.match(/black/i))
                  {
                     result = " 0 - 1";
                     result = compEngine + " vs " + mainEngine + "   " + result;
                  }
               }
               else if (resultN === 0)
               {
                  if (winner.match(/white/i))
                  {
                     result = " 1 - 0";
                     result = compEngine + " vs " + mainEngine + "   " + result;
                  }
                  else if (winner.match(/black/i))
                  {
                     result = " 0 - 1";
                     result = mainEngine + " vs " + compEngine + "   " + result;
                  }
               }
               else
               {
                  result = "1/2 - 1/2";
                  result = mainEngine + " vs " + compEngine + "   " + result;
               }
               link.title = "Game#:  " + htmlData + ", Result:  " + result;
               link.target = "_blank";
               result = getModifiedResult(resultN);
               var linkText = document.createTextNode(result);
               link.appendChild(linkText);
               cell.innerHTML += ' ';
               cell.appendChild(link);
            }
         }
         else
         {
            cell.innerHTML= '--';
         }
      }
   }

   $(selector).append(table);
   table.id = "tblBordered1";

   var values = []; // to hold our values for data table
   // get our values
   var emptyRowfound = 0;
   var tempDom = document.getElementById('info_divs1');
   var tr = tempDom.getElementsByTagName("tr");
   var rowCount = tr.length;
   var currentGameNum = 0;

   $('#info_divs1 tr').each(function(i, v) {
      values[i] = [];
      // select either th or td, doesn't matter
      var lastIndex = 0;
      $(this).children('th,td').each(function(ii, vv) {
         values[i][ii] = $(this).html();
         lastIndex = ii;
      });
   });

   var dataTable1 = google.visualization.arrayToDataTable(values);
   var dataView1 = new google.visualization.DataView(dataTable1);
   var table1 = new google.visualization.Table(document.getElementById('info_divs1'));
    var cssClassNames = {headerRow: 'headercol', tableRow: 'rownormal', oddTableRow:'rowodd'};    
    var options1 = {
      'showRowNumber': false,
      'allowHtml': true,
      'cssClassNames': cssClassNames,
      'sort': 'event',
      'sortAscending': true,
      'width': '100%',
      'height': knownHeight,  
      'legend': {
         position: 'top',
         maxLines: 3
      },
      'title': 'Population Density (people/km^2)',
      'backgroundColor': 'red'
   }

   google.visualization.events.addListener(table1, 'sort', function(sender) {
      var sortColumn;
      dataTable = google.visualization.arrayToDataTable(values);
      //////console.log ("sender.column:" + sender.column);

      switch (sender.column) {
         case 0:
         case 1:
         case 2:
         case 3:
         case 6:
         case 5:
         case 7:
         case 8:
         case 9:
         case 10:
         sortColumn = sender.column;
         if (emptyRowfound >= 1)
            dataTable.removeRows(emptyRowfound - 1, rowCount - (emptyRowfound - 1));
         break;
         default:
         sortColumn = sender.column;
         break;
      }

      options1.sortAscending = sender.ascending;
      options1.sortColumn = sender.column;
      dataTable.sort([{column: sortColumn, desc: !sender.ascending}]);
      dataView = new google.visualization.DataView(dataTable);
      table1.draw(dataView, options1);
   });
   dataView1 = new google.visualization.DataView(dataTable1);
   table1.draw(dataView1, options1);
   document.getElementById('info_divs1').style.height = knownHeight + "px";
}

function appendTable(row, selector, listnum, colnum, myList, columns)
{
   if (myList)
   {
      var cellValue = myList[listnum][columns[colnum]];
      if (cellValue == null)
      {
         cellValue = "";
      }
      row.append($('<td/>').html(cellValue));
      $(selector).append(row);
   }
   else
   {
      colnum = colnum + 100;
      row.append($('<td/>').html(colnum));
      $(selector).append(row);
   }
}

function buildHtmlTable(myList1, selector) 
{
   var tempDom = document.getElementById('sched_divs');
   var myList = null;

   if (tempDom) 
   {
      $("#sched_divs").html("");
   }
   try 
   {
      myList = JSON.parse(myList1);
   } 
   catch(e) 
   {
      SchedtableLastModifiedHeader1 = (new Date(0)).toUTCString();
      myupdateSchedtable();
   }

   ////console.log ("myList sched length:" + myList.length);

   var columns = addAllColumnHeaders(myList, selector);


   if (columns.length < 9)
   {
      for (var i = 0; i < myList.length; i++) 
      {
         var row = $('<tr/>');
         appendTable(row, selector, i, 1, myList, columns);
         appendTable(row, selector, i, 5, myList, columns);
         appendTable(row, selector, i, 11, myList, columns);
         appendTable(row, selector, i, 12, myList, columns);
         appendTable(row, selector, i, 0, myList, columns);
         appendTable(row, selector, i, 2, myList, columns);
         appendTable(row, selector, i, 8, myList, columns);
         appendTable(row, selector, i, 6, myList, columns);
         appendTable(row, selector, i, 7, myList, columns);
         appendTable(row, selector, i, 10, myList, columns);
         appendTable(row, selector, i, 11, myList, columns);
         appendTable(row, selector, i, 11, myList, columns);
         appendTable(row, selector, i, 11, myList, columns);
      }
   }
   else
   {
      for (var i = 0; i < myList.length; i++)
      {
         var row = $('<tr/>');
         appendTable(row, selector, i, 5, myList, columns);
         appendTable(row, selector, i, 11, myList, columns);
         appendTable(row, selector, i, 12, myList, columns);
         appendTable(row, selector, i, 1, myList, columns);
         appendTable(row, selector, i, 0, myList, columns);
         appendTable(row, selector, i, 8, myList, columns);
         appendTable(row, selector, i, 6, myList, columns);
         appendTable(row, selector, i, 2, myList, columns);
         appendTable(row, selector, i, 7, myList, columns);
         appendTable(row, selector, i, 10, myList, columns);
         appendTable(row, selector, i, 3, myList, columns);
         appendTable(row, selector, i, 4, myList, columns);
         appendTable(row, selector, i, 9, myList, columns);
      }
   }
   var values = []; // to hold our values for data table
   // get our values
   var emptyRowfound = 0;
   var tr = tempDom.getElementsByTagName("tr");
   var rowCount = tr.length;
   var currentGameNum = 0;
   for (i = 1; i < tr.length ; i++)
   {
      var cells = tr[i].cells;
      for (j = 0 ; j < 10 ; j++)
      {
         var thisTdElem = cells[j];
         thisTdElem.className = "regularcol1";
         if (j == 0)
         {
            if (!emptyRowfound && !isRowEmpty(tr, i, 2))
            {
               var link = document.createElement("a");
               var htmlData = thisTdElem.innerHTML.trim();
               var linkData = getLinkArch(htmlData);
               if (isArchiveFile())
               {
                  link.setAttribute("href", linkData);
                  link.setAttribute("onClick",  "return myloadGame(" + htmlData + ")");
                  link.className = "hyperClassArch";
               }
               else
               {
                  link.className = "hyperClass";
                  link.setAttribute("onClick", "return myloadGame(" + htmlData + ")");
                  link.setAttribute("cursor", "pointer");
               }
               link.title = "Click here to open the game#" + htmlData + " from the archives";
               //link.target = "_blank";
               var linkText = document.createTextNode(htmlData);
               linkText.className = "hyperClass";
               link.appendChild(linkText);
               link.style.cursor = "pointer"; 
               thisTdElem.innerHTML = '';
               thisTdElem.className = "regularcol1";
               thisTdElem.appendChild(link);
            }
            else
            {
               if (emptyRowfound == 0)
                  emptyRowfound = i;
            }
         }
         if (j == 1 || j == 4)
         {
            thisTdElem.innerText = getAbbEngName(thisTdElem.innerText);
         }
      }
   }
   totalGames =  emptyRowfound - 1;
   setRevLive();
   $('#sched_divs tr').each(function(i, v) {
      values[i] = [];
      // select either th or td, doesn't matter
      var lastIndex = 0;
      $(this).children('th,td').each(function(ii, vv) {
         values[i][ii] = $(this).html();
         lastIndex = ii;
      });
      if (i == 0)
         values[i][lastIndex + 1] = '2';
      else
         values[i][lastIndex + 1] = i;
   });

   var dataTable1 = google.visualization.arrayToDataTable(values);
   dataTable1.setProperty(0, 0, 'style', 'width:10px');
   dataTable1.setProperty(0, 1, 'style', 'width:160px');
   dataTable1.setProperty(0, 2, 'style', 'width:30px');
   dataTable1.setProperty(0, 3, 'style', 'width:30px');
   dataTable1.setProperty(0, 4, 'style', 'width:160px');
   dataTable1.setProperty(0, 5, 'style', 'width:20px');
   dataTable1.setProperty(0, 6, 'style', 'width:15px');
   dataTable1.setProperty(0, 7, 'style', 'width:90px');
   dataTable1.setProperty(0, 8, 'style', 'width:300px');
   dataTable1.setProperty(0, 9, 'style', 'width:200px');
   dataTable1.setProperty(0, 10, 'style', 'width:60px');
   dataTable1.setProperty(0, 11, 'style', 'width:200px');
   dataTable1.setProperty(0, 12, 'style', 'width:180px');
   var dataView1 = new google.visualization.DataView(dataTable1);
   var table1 = new google.visualization.Table(document.getElementById('sched_divs'));
    var cssClassNames = {headerRow: 'headercol', tableRow: 'rownormal', oddTableRow:'rowodd'};
   var startPage = parseInt((emptyRowfound-1)/12);
   var options1 = {
      'showRowNumber': false,
      'allowHtml': true,
      'cssClassNames': cssClassNames,
      'sort': 'disable',
      'sortAscending': true,
      'height': '100%',
      'legend': {
         position: 'top',
         maxLines: 3
      },
      'title': 'Population Density (people/km^2)',
      'backgroundColor': 'red',
      'page' : 'enabled',
      'pageSize' : 12,
      'startPage' : startPage
   }

   google.visualization.events.addListener(table1, 'sort', function(sender) {
      var sortColumn;
      dataTable = google.visualization.arrayToDataTable(values);
      //////console.log ("sender.column:" + sender.column);

      switch (sender.column) {
         case 0:
            sortColumn = 11;
            break;
         case 2:
         case 3:
         case 6:
         case 5:
         case 7:
         case 8:
         case 9:
         case 10:
         sortColumn = sender.column;
         break;
         default:
         sortColumn = sender.column;
         break;
      }

      options1.sortAscending = sender.ascending;
      options1.sortColumn = sender.column;
      dataTable.sort([{column: sortColumn, desc: !sender.ascending}]);
      dataView = new google.visualization.DataView(dataTable);
      dataView.setColumns([0,1,2,3,4,5,6,7,8,9,10,11,12]);
      table1.draw(dataView, options1);
   });
   dataTable1.sort([{
      column: 13
   }]);
   dataView1 = new google.visualization.DataView(dataTable1);
   dataView1.setColumns([0, 1, 2, 3, 4, 5, 6, 7, 8, 9,10,11,12]);
   table1.draw(dataView1, options1);
}

// Adds a header row to the table and returns the set of columns.
// Need to do union of keys from all records as some records may not contain
// all records.
function addAllColumnHeaders(myList, selector) 
{
   var columnSet = [];
   var headerTr$ = $('<tr/>');

   var rowHash = myList[0];
   var j = 0;

   for (var key in rowHash)
   {
      columnSet.push(key);
   }
   columnSet.push(1);

   var row = $('<tr/>');
   row.append($('<th/>').html('Game'));
   row.append($('<th/>').html('White'));
   row.append($('<th/>').html('WhiteEv'));
   row.append($('<th/>').html('BlackEv'));
   row.append($('<th/>').html('Black'));
   row.append($('<th/>').html('Result'));
   row.append($('<th/>').html('Moves'));
   row.append($('<th/>').html('Duration'));
   row.append($('<th/>').html('Opening'));
   row.append($('<th/>').html('Termination'));
   row.append($('<th/>').html('ECO'));
   row.append($('<th/>').html('FinalFen'));
   row.append($('<th/>').html('Start'));

   $(selector).append(row);

   return columnSet;
}

function addAllColumnHeadersStand(row) 
{
   var columnSet = [];
 
   columnSet.push("Rank");
   columnSet.push("Engine");
   columnSet.push("#Games");
   columnSet.push("Points");
   columnSet.push("Wins [W/B]");
   columnSet.push("Crashes");
   columnSet.push("SB");
   columnSet.push("Current Elo");
   columnSet.push("Elo Diff [LiveR]");

   for (var i = 0; i < columnSet.length ; i++)
   {
      var cell1 = row.insertCell(i);
      cell1.innerHTML =  columnSet[i];
   }

   return columnSet;
}

function addAllColumnHeadersCross(row, myList) 
{
   var columnSet = [];

   for (var i = 0; i < myList.length ; i++)
   {
      columnSet.push(myList[i]);
   }

   for (var i = 0; i < columnSet.length ; i++)
   {
      var cell1 = row.insertCell(i+9);
      cell1.innerHTML = columnSet[i];
   }

   return columnSet;
}

function drawSchedTable(text)
{
    buildHtmlTable(text, "#Schedule");
}


function ylcetFinishTable() 
{
    var tables = tempDom.find("table");
    var tr = tables[0].getElementsByTagName("tr");
    var games = 0;
    /* //////console.log("Arun: Schedule entered"); */
    findEngineArraySched();
    var engArray = engineArray;
    var darray = Create2DArray(11, 11, 11);
    var compGames = 0;

    for (i = tr.length - 1; i > 0; i--) {
        var cells = tr[i].cells;
        var thisTdElem = cells[0];
        var thisTextNode = thisTdElem.childNodes.item(0);
        var thisData = thisTextNode.data;
        var thisDataTrim = thisData.trim();

        if (thisDataTrim.localeCompare("") != 0) {
            totalGames = i;
            if (theObj = document.getElementById("totGames")) {
                if (totalGames != 0) {
                    theObj.innerHTML = (totalGames);
                } else {
                    theObj.innerHTML = "#";
                }
            }
            break;
        }
    }

    var totTime = 0;
    var totMoves = 0;

    for (i = 1; i < tr.length; i++) {
        var cells = tr[i].cells;
        var thisTdElem = cells[2];
        var thisTextNode = thisTdElem.childNodes.item(0);
        var thisData = thisTextNode.data;
        if (thisData == null | thisData == undefined) {
            compGames = 0;
            break;
        }
        var thisDataTrim = thisData.trim();
        compGames = i - 1;

        if (thisDataTrim.localeCompare("") == 0) {
            break;
        }

        if (thisDataTrim.localeCompare("*") == 0) {
            break;
        }
        compGames = i;
        var thisTdElem = cells[1];
        var thisTextNode = thisTdElem.childNodes.item(0);
        var firstEngine = thisTextNode.data;
        thisTdElem = cells[4];
        thisTextNode = thisTdElem.childNodes.item(0);
        var secondEngine = thisTextNode.data;
        thisTdElem = cells[2];
        thisTextNode = thisTdElem.childNodes.item(0);
        var firstScore = thisTextNode.data;
        thisTdElem = cells[3];
        thisTextNode = thisTdElem.childNodes.item(0);
        var secondScore = thisTextNode.data;
        ////////console.log ("CAlling assignScores");
        thisTdElem = cells[10];
        var thisTextNode = thisTdElem.childNodes.item(0);
        var thisData = thisTextNode.data;
        if (thisData == null | thisData == undefined) {
            break;
        }
        totTime += hmsToSecondsOnly(thisData.trim());
        thisTdElem = cells[6];
        var thisTextNode = thisTdElem.childNodes.item(0);
        var thisData = thisTextNode.data;
        if (thisData == null | thisData == undefined) {
            break;
        }
        totMoves += parseInt(thisData.trim());
        assignScores(engArray, darray, firstEngine, secondEngine, firstScore.trim(), secondScore.trim(), i);
    }

    $("#info_divs2").html("");
    $("#info_divs1").html("");
    var avgTime = "unknown";
    if (totTime != 0) {
        totTime = parseInt(totTime / compGames);
        avgTime = new Date(totTime * 1000).toISOString().substr(11, 8);
    }
    if (totMoves != 0) {
        totMoves = parseInt(totMoves / compGames);
    }

    var tdiv = document.getElementById('info_divs1');

    var tblx = document.createElement('table');
    var tbdy = document.createElement('tbody');
    for (var i = 0; i <= engArray.length * 2; i++) {
        var tr = document.createElement('tr');
        for (var j = 0; j <= 5; j++) {
            var newCell = tr.insertCell(j);
            var newText = document.createTextNode('');
            newCell.appendChild(newText);
            newCell.className = "regularcol";
        }
        tbdy.appendChild(tr);
    }
    tblx.appendChild(tbdy);
    var tables = tdiv.getElementsByTagName("table");
    tblx.id = "tblBordered1";
    tdiv.appendChild(tblx);

    tr = tables[0].getElementsByTagName("tr");
    var trCount = 1;
    var cells = tr[0].cells;
    var cellCnt = 0;
    var thisTdElem = cells[cellCnt];
    thisTdElem.className = "headercol";
    thisTdElem.setAttribute('style', 'width:120px');
    thisTdElem.innerText = "Head to Head";
    cellCnt++;
    thisTdElem = cells[cellCnt];
    thisTdElem.innerText = "Total games";
    thisTdElem.setAttribute('style', 'width:100px');
    thisTdElem.className = "headercol";
    cellCnt++;
    thisTdElem = cells[cellCnt];
    thisTdElem.innerText = "Match Score";
    thisTdElem.setAttribute('style', 'width:280px');
    thisTdElem.className = "headercol";
    cellCnt++;
    thisTdElem = cells[cellCnt];
    thisTdElem.innerText = "Total wins";
    thisTdElem.setAttribute('style', 'width:100px');
    thisTdElem.className = "headercol";
    cellCnt++;
    thisTdElem = cells[cellCnt];
    thisTdElem.innerText = "White wins";
    thisTdElem.setAttribute('style', 'width:100px');
    thisTdElem.className = "headercol";
    cellCnt++;
    thisTdElem = cells[cellCnt];
    thisTdElem.innerText = "Black wins";
    thisTdElem.setAttribute('style', 'width:100px');
    thisTdElem.className = "headercol";
    cellCnt++;

    tables[0].id = "tblBordered1";
    thisTdElem.className = "headercol";

    var totaWins = 0;
    var totalWhitewins = 0;
    var totalBlackwins = 0;

    for (i = 0; i < engArray.length; i++) {
        for (var x = i + 1; x < engArray.length; x++) {
            ////////console.log ("trcount is ::" + engArray.length);
            if (tr[trCount] == null)
            {
                break;
            }
            var cells = tr[trCount].cells;
            trCount++;

            var cellCnt = 0;
            var thisTdElem = cells[cellCnt];
            var opp = darray[i][x][0];
            if (opp == 0) {
                opp = '';
            }
            thisTdElem.innerText = getAbbName(engArray[i]) + " vs " + opp;
            cellCnt++;
            thisTdElem = cells[cellCnt];
            thisTdElem.innerHTML = darray[i][x][1]; /* total games */
            cellCnt++;
            thisTdElem = cells[cellCnt];
            ////////console.log("darray[i][x][2].length:: " + darray[i][x][2].length);
            for (y = 0; y < darray[i][x][2].length; y = y + 2) {
                var htmlData = darray[i][x][2][y + 1];
                var link = document.createElement("a");
                var linkData = getLinkArch(htmlData);

                if (isArchiveFile()) {
                    link.setAttribute("href", linkData);
                    link.setAttribute("onClick", "return myloadGame(" + htmlData + ")");
                    link.className = "hyperClassArchnoun";
                } else {
                    link.setAttribute("href", linkData);
                    link.className = "hyperClassnoun";
                    link.setAttribute("onClick", "return myloadGame(" + htmlData + ")");
                }
                link.title = "Click here to open the game#" + htmlData + " from the archives";
                link.target = "_blank";
                var linkText = document.createTextNode(darray[i][x][2][y]);
                linkText.className = "hyperClassnoun";
                link.appendChild(linkText);
                thisTdElem.innerHTML += ' ';
                thisTdElem.className = "regularcol1";
                thisTdElem.appendChild(link);
            }
            cellCnt++;
            thisTdElem = cells[cellCnt];
            thisTdElem.innerHTML = darray[i][x][3] + "/" + darray[x][i][3];

            cellCnt++;
            thisTdElem = cells[cellCnt];
            thisTdElem.innerHTML = darray[i][x][4] + "/" + darray[x][i][4];
            totalWhitewins = totalWhitewins + darray[i][x][4] + darray[x][i][4];
            cellCnt++;
            thisTdElem = cells[cellCnt];
            thisTdElem.innerHTML = darray[i][x][5] + "/" + darray[x][i][5];
            totalBlackwins = totalBlackwins + darray[i][x][5] + darray[x][i][5];
        }
    }

    totaWins = totalBlackwins + totalWhitewins;

    for (i = tr.length - 1; i > 0; i--) {
        if (isRowEmpty(tr, i, 0)) {
            tables[0].deleteRow(i);
        } else {
            break;
        }
    }

    var values = []; // to hold our values for data table
    // get our values
    $('#tblBordered1 tr').each(function(i, v) {
        values[i] = [];
        // select either th or td, doesn't matter
        var lastIndex = 0;
        $(this).children('th,td').each(function(ii, vv) {
            values[i][ii] = $(this).html();
            lastIndex = ii;
        });
    });

    var dataTable1 = google.visualization.arrayToDataTable(values);
    var dataView1 = new google.visualization.DataView(dataTable1);
    var table1 = new google.visualization.Table(document.getElementById('info_divs1'));
    var cssClassNames = {headerRow: 'headercol', tableRow: 'rownormal', oddTableRow:'rowodd'};    
    var options1 = {
        'showRowNumber': false,
        'allowHtml': true,
        'cssClassNames': cssClassNames,
        'sortColumn': 0,
        'sortAscending': true,
        'width': '100%',
        'legend': {
            position: 'top',
            maxLines: 3
        },
        'title': 'Population Density (people/km^2)',
        'backgroundColor': 'red'
    }

    table1.draw(dataView1, options1);

    var tdiv = document.getElementById('info_divs2');
    var tblx = document.createElement('table');
    var tbdy = document.createElement('tbody');
    for (var i = 0; i < 2; i++) {
        var tr = document.createElement('tr');
        for (var j = 0; j <= 7; j++) {
            var newCell = tr.insertCell(j);
            var newText = document.createTextNode('');
            newCell.appendChild(newText);
            newCell.className = "regularcol1";
        }
        tbdy.appendChild(tr);
    }
    tblx.appendChild(tbdy);
    tdiv.appendChild(tblx);

    tr = tblx.getElementsByTagName("tr");
    var trCount = 1;
    var cells = tr[0].cells;
    var cellCnt = 0;
    var thisTdElem = cells[cellCnt];
    thisTdElem.className = "headercol";
    thisTdElem.setAttribute('style', 'width:220px');
    thisTdElem.innerText = "#Completed";
    cellCnt++;
    thisTdElem = cells[cellCnt];
    thisTdElem.innerText = "wins";
    thisTdElem.setAttribute('style', 'width:134px');
    thisTdElem.className = "headercol";
    cellCnt++;
    thisTdElem = cells[cellCnt];
    thisTdElem.innerText = "White wins";
    thisTdElem.setAttribute('style', 'width:135px');
    thisTdElem.className = "headercol";
    cellCnt++;
    thisTdElem = cells[cellCnt];
    thisTdElem.innerText = "Black wins";
    thisTdElem.setAttribute('style', 'width:130px');
    thisTdElem.className = "headercol";
    cellCnt++;
    thisTdElem = cells[cellCnt];
    thisTdElem.innerText = "Draw rate";
    thisTdElem.setAttribute('style', 'width:166px');
    thisTdElem.className = "headercol";
    cellCnt++;
    thisTdElem = cells[cellCnt];
    thisTdElem.innerText = "Avg. Game time";
    thisTdElem.setAttribute('style', 'width:166px');
    thisTdElem.className = "headercol";
    cellCnt++;
    thisTdElem = cells[cellCnt];
    thisTdElem.innerText = "Avg. Game moves";
    thisTdElem.setAttribute('style', 'width:166px');
    thisTdElem.className = "headercol";
    cellCnt++;
    thisTdElem = cells[cellCnt];
    thisTdElem.innerText = "Approx end date";
    thisTdElem.setAttribute('style', 'width:166px');
    thisTdElem.className = "headercol";

    var cells = tr[trCount].cells;
    trCount++;

    var cellCnt = 0;
    var thisTdElem = cells[cellCnt];
    thisTdElem.innerText = compGames + "/" + totalGames;
    thisTdElem.className = "regularcol";
    cellCnt++;
    thisTdElem = cells[cellCnt];
    thisTdElem.innerText = totaWins;
    thisTdElem.className = "regularcol";
    cellCnt++;
    var thisTdElem = cells[cellCnt];
    thisTdElem.innerText = totalWhitewins;
    thisTdElem.className = "regularcol";
    cellCnt++;
    thisTdElem = cells[cellCnt];
    thisTdElem.innerText = totalBlackwins;
    thisTdElem.className = "regularcol";
    cellCnt++;

    var drarate = (compGames - totaWins) / compGames * 100;
    thisTdElem = cells[cellCnt];
    thisTdElem.innerText = drarate.toFixed(0) + "%";

    cellCnt++;
    thisTdElem = cells[cellCnt];
    thisTdElem.innerText = avgTime;
    thisTdElem.className = "regularcol";
    cellCnt++;
    thisTdElem = cells[cellCnt];
    thisTdElem.innerText = totMoves;
    thisTdElem.className = "regularcol";
    cellCnt++;
    thisTdElem = cells[cellCnt];
    var d = new Date();
    var n = d.getTime();
    var gamesCnt = totalGames - compGames;
    var endTime = new Date(n + 1000 * totTime * gamesCnt);
    if (isArchiveFile()) {
        thisTdElem.innerText = "NA";
    } else {
        thisTdElem.innerText = endTime.toString();
    }
    thisTdElem.className = "regularcol";


    tblx.id = "tblBordered3";

    var values = []; // to hold our values for data table
    // get our values
    $('#tblBordered3 tr').each(function(i, v) {
        values[i] = [];
        // select either th or td, doesn't matter
        var lastIndex = 0;
        $(this).children('th,td').each(function(ii, vv) {
            values[i][ii] = $(this).html();
            lastIndex = ii;
        });
    });

    var dataTable1 = google.visualization.arrayToDataTable(values);
    var dataView1 = new google.visualization.DataView(dataTable1);
    var table1 = new google.visualization.Table(document.getElementById('info_divs2'));
    var cssClassNames = {headerRow: 'headercol', tableRow: 'rownormal', oddTableRow:'rowodd'};    
    var options1 = {
        'showRowNumber': false,
        'allowHtml': true,
        'cssClassNames': cssClassNames,
        'sortColumn': 0,
        'sortAscending': true,
        'width': '100%',
        'legend': {
            position: 'top',
            maxLines: 3
        },
        'title': 'Population Density (people/km^2)',
        'backgroundColor': 'red'
    }

    table1.draw(dataView1, options1);

    var sdiv = document.getElementById('sched_divs');
    if (sdiv) {
        $("#sched_divs").html("");
        var tables = tempDom.find("table");
        var tbl = tables[0];
        tbl.id = "schedtable";
        var tr = tbl.getElementsByTagName("tr");
        tr[0].deleteCell(12);
        tr[0].deleteCell(9);
        var cells = tr[0].cells;

        var emptyRowfound = 0;
        var rowCount = tr.length;
        for (i = 1; i < tr.length; i++) {
            tr[i].deleteCell(12);
            tr[i].deleteCell(9);
            var cells = tr[i].cells;
            for (j = 0; j < 12; j++) {
                var thisTdElem = cells[j];
                if (thisTdElem == null) {
                    continue;
                }

                if (j == 1 || j == 4) 
                {
                    thisTdElem.innerText = getAbbEngNameSched(thisTdElem.innerText, i);
                }

                if (isRowEmpty(tr, i, 7)) {
                    if (emptyRowfound == 0)
                        emptyRowfound = i;
                    continue;
                }

                thisTdElem.className = "regularcol1";
                if (j == 0) {
                    if (!emptyRowfound && !isRowEmpty(tr, i, 7)) {
                        var link = document.createElement("a");
                        var htmlData = thisTdElem.innerHTML.trim();
                        var linkData = getLinkArch(htmlData);
                        if (isArchiveFile()) {
                            link.setAttribute("href", linkData);
                            link.setAttribute("onClick", "return openArchGame(" + htmlData + ")");
                            link.className = "hyperClassArch";
                        } else {
                            link.setAttribute("href", linkData);
                            link.className = "hyperClass";
                        }
                        link.title = "Click here to open the game#" + htmlData + " from the archives";
                        link.target = "_blank";
                        var linkText = document.createTextNode(htmlData);
                        linkText.className = "hyperClass";
                        link.appendChild(linkText);
                        thisTdElem.innerHTML = '';
                        thisTdElem.className = "regularcol1";
                        thisTdElem.appendChild(link);
                    } else {
                        if (emptyRowfound == 0)
                            emptyRowfound = i;
                    }
                }
            }
        }
        tbl.id = "tblBordered4";
        sdiv.appendChild(tbl);
        var values = []; // to hold our values for data table
        // get our values
        $('#tblBordered4 tr').each(function(i, v) {
            values[i] = [];
            // select either th or td, doesn't matter
            var lastIndex = 0;
            $(this).children('th,td').each(function(ii, vv) {
                values[i][ii] = $(this).html();
                lastIndex = ii;
            });
            if (i == 0)
                values[i][lastIndex + 1] = '2';
            else
                values[i][lastIndex + 1] = i;
        });
        // convert 2d array to dataTable and draw
        var dataTable = google.visualization.arrayToDataTable(values);
        var dataView = new google.visualization.DataView(dataTable);
        var table = new google.visualization.Table(document.getElementById('sched_divs'));
        var cssClassNames = {headerRow: 'headercol', tableRow: 'rownormal', oddTableRow:'rowodd'};    
        var options = {
            'showRowNumber': false,
            'allowHtml': true,
            'cssClassNames': cssClassNames,
            'sort': 'event',
            'sortColumn': 0,
            'sortAscending': true,
            'width': '100%',
            'legend': {
                position: 'top',
                maxLines: 3
            },
            'title': 'Population Density (people/km^2)',
            'backgroundColor': 'red'
        }

        google.visualization.events.addListener(table, 'sort', function(sender) {
            var sortColumn;
            dataTable = google.visualization.arrayToDataTable(values);

            switch (sender.column) {
                case 0:
                    sortColumn = 12;
                    break;
                case 2:
                case 3:
                case 6:
                case 5:
                case 7:
                case 8:
                case 9:
                case 10:
                case 11:
                    sortColumn = sender.column;
                    if (emptyRowfound >= 1)
                        dataTable.removeRows(emptyRowfound - 1, rowCount - (emptyRowfound - 1));
                    break;
                default:
                    sortColumn = sender.column;
                    break;
            }

            options.sortAscending = sender.ascending;
            options.sortColumn = sender.column;
            dataTable.sort([{
                column: sortColumn,
                desc: !sender.ascending
            }]);
            dataView = new google.visualization.DataView(dataTable);
            dataView.setColumns([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
            table.draw(dataView, options);
        });
        dataView.setColumns([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
        table.draw(dataView, options);
    }
    //////console.log("Arun: Schedule created");
    return;
}

var isArchive = -1;
var crossLoaded = 0;
var schedLoaded = 0;

function isArchiveFile() {
    var re = new RegExp("live([a-z]*).html$");
    if (re.test(currentPage)) {
        isArchive = 0;
    } else {
        isArchive = 1;
    }
    return (isArchive);
}

function ylcetDrawCrosstable() 
{
    ylcetAddGamesPlayedFirstTable();
    crossLoaded = 1;
    return;
}

function ylcetDrawSchedtable() 
{
    ylcetFinishTable();
    schedLoaded = 1;
}

function getAbbEngNameSched(enginename, rowno)
{
    if (enginename == undefined || enginename == null) 
    {
        return "unknown";
    }
    if (enginename.search(/.*Houdini.*/i) == 0) 
    {
        return ("Houdini");
    } 
    else if (enginename.search(/.*MysteryX.*/i) == 0) 
    {
        if (jsSeasonInt == 6 && finalInt == 0)
        {
            if (rowno <= 78)
            {
                return ("MysterX")
            }
            else if (rowno <= 83)
            {
                return ("MysterX1")
            }
            else
            {
                return ("MysteryX2");
            }
        }
        else
        {
            return ("MysteryX3");
        }
    } 
    else if (enginename.search(/.*Stockfish.*/i) == 0) 
    {
        return ("Stockfish");
    } 
    else if (enginename.search(/.*Komodo.*/i) == 0) 
    {
        if (jsSeasonInt == 5 && finalInt == 0)
        {
            if (rowno <= 128)
            {
                return ("Kom 2028")
            }
            else
            {
                return ("Kom 2037")
            }
        }
        else
        {
            return ("Komodo");
        }
    } 
    else if (enginename.search(/.*asmFish.*/i) == 0) 
    {
        return ("Asmfish");
    }
    return enginename;
}

function getAbbEngName(enginename) 
{
    if (enginename == undefined || enginename == null) 
    {
        return "unknown";
    }
    if (enginename.search(/.*Houdini.*/i) == 0) 
    {
        return ("Houdini");
    } 
    else if (enginename.search(/.*MysteryX.*/i) == 0) 
    {
        return ("MysteryX3");
    } 
    else if (enginename.search(/.*Stockfish.*/i) == 0) 
    {
        return ("Stockfish");
    } 
    else if (enginename.search(/.*Komodo.*/i) == 0) 
    {
        return ("Komodo");
    } 
    else if (enginename.search(/.*asmFish.*/i) == 0) 
    {
        return ("Asmfish");
    }
    return enginename;
}

function getEngVersion(enginename) 
{
    if (enginename == undefined || enginename == null) {
        return "unknown";
    }
    var regex = new RegExp("( ([^&#]*))");
    var results = regex.exec(enginename);
    if (results != null) 
    {
        if (kver)
        {
            if (enginename.search(/.*Komodo.*/i) == 0) 
            {
                return (kver);
            }
        } 
        return (results[0].substr(0,8));
    }
    return '';
}

function returnIndex(passNum) {
    return passNum;
}

function PrintHTML() {
    var ii, jj, text, theObj, squareId, imageId, squareCoord, squareTitle, numText, textSO;
    if (theObj = document.getElementById("GameBoard")) {
        text = '<TABLE CLASS="boardTable" ID="boardTable" CELLSPACING=0 CELLPADDING=0';
        text += (tableSize > 0) ? ' STYLE="width: ' + tableSize + 'px; height: ' + tableSize + 'px;">' : '>';
        for (iiv = 0; iiv <= 7; ++iiv) {
            var ii = iiv;
            text += '<TR>';
            for (jjv = 0; jjv <= 7; ++jjv) {
                var jj = jjv;
                squareId = 'tcol' + jj + 'trow' + ii;
                imageId = 'img_' + squareId;
                text += (ii + jj) % 2 === 0 ? '<TD CLASS="whiteSquare" ID="' + squareId + '" background="images/whiteboard.jpg"' : '<TD CLASS="blackSquare" ID="' + squareId + '" background="images/blackboard.jpg"';
                text += ' ALIGN="center" VALIGN="middle" ONCLICK="clickedSquare(' + ii + ',' + jj + ')">';
                squareCoord = IsRotated ? String.fromCharCode(72 - jj, 49 + ii) : String.fromCharCode(jj + 65, 56 - ii);
                squareTitle = squareCoord;
                if (boardTitle[jj][ii] !== '') {
                    squareTitle += ': ' + boardTitle[jj][ii]
                }
                text += '<IMG SRC="' + ClearImg.src + '" ' + 'CLASS="pieceImage" STYLE="border: none; display: block; vertical-align: middle;" ' + 'WIDTH="44" HEIGHT="44" ' + 'ONCLICK="boardOnClick[' + jj + '][' + ii + '](this, event);" ' + 'ID="' + imageId + '" TITLE="' + squareTitle + '" ' + 'ONFOCUS="this.blur()" />' + '</TD>'
            }
            text += '</TR>'
        }
        text += '</TABLE>';
        theObj.innerHTML = text
    }
    if (theObj = document.getElementById("boardTable")) {
        tableSize = theObj.offsetWidth;
        if (tableSize > 0) {
            theObj.style.height = tableSize + "px"
        }
    }
    if (theObj = document.getElementById("GameButtons")) {
        var numButtons = 5;
        var spaceSize = 15;
        var buttonSize = (tableSize - spaceSize * (numButtons - 3)) / numButtons;
        /* buttonSize = 30; arunfix */
        text = '<FORM NAME="GameButtonsForm" STYLE="display:inline;">' + '<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="0">' + '<TR><TD>' + '<INPUT ID="startButton" TYPE="BUTTON" VALUE="&lt;&lt;" STYLE="';
        if (buttonSize > 0) {
            text += 'width: ' + buttonSize + 'px;'
        }
        text += '"; CLASS="buttonControl" TITLE="go to game start" ' + ' ID="btnGoToStart" onClick="clickedBbtn(this,event);this.blur();">' + '</TD>' + '<TD CLASS="buttonControlSpace" WIDTH="' + spaceSize + '">' + '</TD><TD>' + '<INPUT ID="backButton" TYPE="BUTTON" VALUE="&lt;" STYLE="';
        if (buttonSize > 0) {
            text += 'width: ' + buttonSize + 'px;'
        }
        text += '"; CLASS="buttonControl" TITLE="move backward" ' + ' ID="btnMoveBackward1" onClick="clickedBbtn(this,event);this.blur();">' + '</TD>' + '<TD CLASS="buttonControlSpace" WIDTH="' + spaceSize + '">' + '</TD><TD>';
        text += '<INPUT ID="autoplayButton" TYPE="BUTTON" VALUE=' + (isAutoPlayOn ? "=" : "+") + ' STYLE="';
        if (buttonSize > 0) {
            text += 'width: ' + buttonSize + 'px;'
        }
        text += isAutoPlayOn ? '"; CLASS="buttonControlStop" TITLE="toggle autoplay (stop)" ' : '"; CLASS="buttonControlPlay" TITLE="toggle autoplay (start)" ';
        text += ' ID="btnPlay" NAME="AutoPlay" onClick="clickedBbtn(this,event);this.blur();">' + '</TD>' + '<TD CLASS="buttonControlSpace" WIDTH="' + spaceSize + '">' + '</TD><TD>' + '<INPUT ID="forwardButton" TYPE="BUTTON" VALUE="&gt;" STYLE="';
        if (buttonSize > 0) {
            text += 'width: ' + buttonSize + 'px;'
        }
        text += '"; CLASS="buttonControl" TITLE="move forward" ' + ' ID="btnMoveForward1" onClick="clickedBbtn(this,event);this.blur();">' + '</TD>' + '<TD CLASS="buttonControlSpace" WIDTH="' + spaceSize + '">' + '</TD><TD>' + '<INPUT ID="endButton" TYPE="BUTTON" VALUE="&gt;&gt;" STYLE="';
        if (buttonSize > 0) {
            text += 'width: ' + buttonSize + 'px;'
        }
        text += '"; CLASS="buttonControl" TITLE="go to game end" ' + ' ID="btnGoToEnd" onClick="clickedBbtn(this,event);this.blur();">' + '</TD></TR></TABLE></FORM>';
        theObj.innerHTML = text
    }
    if (theObj = document.getElementById("GameSelector")) {
        if (firstStart) {
            textSelectOptions = ''
        }
        if (numberOfGames < 2) {
            while (theObj.firstChild) {
                theObj.removeChild(theObj.firstChild)
            }
            textSelectOptions = ''
        } else {
            if (textSelectOptions === '') {
                if (gameSelectorNum) {
                    gameSelectorNumLenght = Math.floor(Math.log(numberOfGames) / Math.log(10)) + 1
                }
                text = '<FORM NAME="GameSel" STYLE="display:inline;"> ' + '<SELECT ID="GameSelSelect" NAME="GameSelSelect" STYLE="';
                if (tableSize > 0) {
                    text += 'width: ' + tableSize + 'px; '
                }
                text += 'font-family: monospace;" CLASS="selectControl" TITLE="select a game" ' + 'ONCHANGE="this.blur(); if (this.value >= 0) { Init(this.value); this.value = -1; }" ' + 'ONFOCUS="disableShortcutKeysAndStoreStatus();" ONBLUR="restoreShortcutKeysStatus();" ' + '> ' + '<OPTION CLASS="optionSelectControl" value=-1>';
                var blanks = '';
                for (ii = 0; ii < 32; ii++) {
                    blanks += ' '
                }
                var headDisplay = (gameSelectorNum ? blanks.substring(0, gameSelectorNumLenght) + '  ' : '') + gameSelectorHead;
                text += headDisplay.replace(/ /g, '&nbsp;');
                for (ii = 0; ii < numberOfGames; ii++) {
                    textSelectOptions += '<OPTION CLASS="optionSelectControl" value=' + ii + '>';
                    textSO = '';
                    if (gameSelectorNum) {
                        numText = (ii + 1) + ' ';
                        textSO += '#' + blanks.substr(0, gameSelectorNumLenght - (numText.length - 1)) + numText + ' ';
                    }
                    if (gameSelectorChRound > 0) {
                        textSO += ' ' + blanks.substr(0, gameSelectorChRound - gameRound[ii].length) + gameRound[ii].substring(0, gameSelectorChRound) + ' '
                    }
                    textSO += ' ' + gameOpening[ii];
                    if (gameSelectorChWhite > 0) {
                        textSO += ' ' + gameWhite[ii].substring(0, gameSelectorChWhite) + blanks.substr(0, gameSelectorChWhite - gameWhite[ii].length) + ' '
                    }
                    if (gameSelectorChBlack > 0) {
                        textSO += ' ' + gameBlack[ii].substring(0, gameSelectorChBlack) + blanks.substr(0, gameSelectorChBlack - gameBlack[ii].length) + ' '
                    }
                    if (gameSelectorChResult > 0) {
                        textSO += ' ' + gameResult[ii].substring(0, gameSelectorChResult) + blanks.substr(0, gameSelectorChResult - gameResult[ii].length) + ' '
                    }
                    textSelectOptions += textSO.replace(/ /g, '&nbsp;')
                }
                text += textSelectOptions.replace(/&(amp|lt|gt);/g, '&amp;$1;') + '</SELECT></FORM>';
                theObj.innerHTML = text;
            }
        }
    }
    if (theObj = document.getElementById("GameEvent")) {
        //theObj.innerHTML = gameEvent[currentGame]
        var theMatch = gameEvent[currentGame].match(/(.*?) Tournament/); 
        theObj.innerHTML = theMatch[1];
    }
    if (theObj = document.getElementById("GameRound")) {
        theObj.innerHTML = gameRound[currentGame]
    }
    if (theObj = document.getElementById("TotalRounds")) {
        if (totalGames != 0) {
            theObj.innerHTML = (totalGames);
        } else {
            theObj.innerHTML = "#";
        }
    }
    if (theObj = document.getElementById("GameSite")) {
        theObj.innerHTML = gameSite[currentGame]
    }
    if (theObj = document.getElementById("GameDate")) {
        theObj.innerHTML = gameDate[currentGame];
        theObj.style.whiteSpace = "nowrap"
    }
    if (theObj = document.getElementById("GameWhite")) {
        theObj.innerHTML = getAbbEngName(gameWhite[currentGame]);
    }
    if (theObj = document.getElementById("GameWhiteS")) {
        theObj.innerHTML = getAbbEngName(gameWhite[currentGame]);
    }
    if (theObj = document.getElementById("whiteVer")) {
        theObj.innerHTML = getEngVersion(gameWhite[currentGame]);
    }
    if (theObj = document.getElementById("blackVer")) {
        theObj.innerHTML = getEngVersion(gameBlack[currentGame]);
    }
    if (theObj = document.getElementById("GameBlack")) {
        theObj.innerHTML = getAbbEngName(gameBlack[currentGame]);
    }
    if (theObj = document.getElementById("GameBlackS")) {
        theObj.innerHTML = getAbbEngName(gameBlack[currentGame]);
    }

    if (0 && (theObj = document.getElementById("whiteengineB"))) {
        var img = document.createElement("img");
        img.src = 'img/sf.jpg';
        img.style.height = '50px';
        img.style.weight = '50px';
        if (whiteImgloaded == 0) {
            whiteImgloaded++;
        }
    }
    if (0 && (theObj = document.getElementById("blackengineB"))) {
        var img = document.createElement("img");
        img.src = 'img/sf.jpg';
        img.style.height = '50px';
        img.style.weight = '50px';
        if (blackImgloaded == 0) {
            blackImgloaded++;
        }
    }
    if (theObj = document.getElementById("GameResult")) {
        theObj.innerHTML = gameResult[currentGame];
        theObj.style.whiteSpace = "nowrap";
        if (theObj.innerHTML === "") {
            theObj.innerHTML = "*"
        }
        if (PlyNumber == 0) {
            theObj.innerHTML = ""
        }
    }
    setB1C1F1G1boardShortcuts();
    if ((theObj = document.getElementById("GameSearch")) && firstStart) {
        if (numberOfGames < 2) {
            while (theObj.firstChild) {
                theObj.removeChild(theObj.firstChild)
            }
        } else {
            text = '<FORM ID="searchPgnForm" STYLE="display: inline;" ' + 'ACTION="javascript:searchPgnGameForm();">';
            text += '<INPUT ID="searchPgnButton" CLASS="searchPgnButton" STYLE="display: inline; ';
            if (tableSize > 0) {
                text += 'width: ' + (tableSize / 4) + 'px; '
            }
            text += '" TITLE="find games matching the search string (regular expression)" ' + 'TYPE="submit" VALUE="?">' + '<INPUT ID="searchPgnExpression" CLASS="searchPgnExpression" ' + 'TITLE="find games matching the search string (regular expression)" ' + 'TYPE="input" VALUE="" STYLE="display: inline; box-sizing: border-box; ' + '-moz-box-sizing: border-box; -webkit-box-sizing: border-box;';
            if (tableSize > 0) {
                text += 'width: ' + (3 * tableSize / 4) + 'px; '
            }
            text += '" ONFOCUS="disableShortcutKeysAndStoreStatus();" ONBLUR="restoreShortcutKeysStatus();">';
            text += '</FORM>';
            theObj.innerHTML = text;
            theObj = document.getElementById('searchPgnExpression');
            if (theObj) {
                theObj.value = lastSearchPgnExpression
            }
        }
    }
    if (currentPage == "archive.php") {
        theO1 = document.getElementById("GameMoves")
        theO2 = document.getElementById("GameMovesA")
        if (GameMovesA == "1") {
            var theObh = theO2;
            theO1.style.display = "none";
            theO1.innerHTTML = "";
            document.getElementById("info_row_data_2_mo").style.background = "none";
            if (localStorage.getItem('TCEC_Nigh') == 'Off') {
                document.getElementById("tall_a_26").style.background = "white"
            } else {
                document.getElementById("tall_a_26").style.background = "#cccccc"
            }
            theO2.style.display = "block"
        } else {
            var theObh = theO1;
            theO1.style.display = "block";
            if (localStorage.getItem('TCEC_Nigh') == 'Off') {
                document.getElementById("info_row_data_2_mo").style.background = "white"
            } else {
                document.getElementById("info_row_data_2_mo").style.background = "#cccccc"
            }
            theO2.style.display = "none";
            theO2.innerHTTML = ""
        }
    } else {
        var theObh = document.getElementById("GameMoves")
    }
    if (theObh) {
        variationTextDepth = -1;
        text = '<SPAN ID="ShowPgnText">' + variationTextFromId(0); + '</SPAN>';
        if ((gameResult[currentGame] == "1-0") || (gameResult[currentGame] == "0-1") || (gameResult[currentGame] == "1/2-1/2") || (gameResult[currentGame] == "*")) {
            theObh.innerHTML = text + '&nbsp;' + gameResult[currentGame]
        } else {
            theObh.innerHTML = text
        }
    }
}

function startButton(e) {
    if (e.shiftKey) {
        GoToMove(StartPlyVar[CurrentVar] + (CurrentPly <= StartPlyVar[CurrentVar] + 1 ? 0 : 1))
    } else {
        GoToMove(StartPlyVar[0], 0)
    }
}

function backButton(e) {
    if (e.shiftKey) {
        GoToMove(StartPlyVar[CurrentVar])
    } else {
        GoToMove(CurrentPly - 1)
    }
}

function forwardButton(e) {
    if (e.shiftKey) {
        if (!goToNextVariationSibling()) {
            GoToMove(CurrentPly + 1)
        }
    } else {
        GoToMove(CurrentPly + 1)
    }
}

function endButton(e) {
    if (e.shiftKey) {
        if (CurrentPly === StartPlyVar[CurrentVar] + PlyNumberVar[CurrentVar]) {
            goToFirstChild()
        } else {
            GoToMove(StartPlyVar[CurrentVar] + PlyNumberVar[CurrentVar])
        }
    } else {
        GoToMove(StartPlyVar[0] + PlyNumberVar[0], 0)
    }
}

function clickedBbtn(t, e) {
    switch (t.id) {
        case "startButton":
            startButton(e);
            break;
        case "backButton":
            backButton(e);
            break;
        case "autoplayButton":
            if (e.shiftKey) {
                goToNextVariationSibling()
            } else {
                SwitchAutoPlay()
            }
            break;
        case "forwardButton":
            forwardButton(e);
            break;
        case "endButton":
            endButton(e);
            break;
        default:
            break
    }
}
var basicNAGs = /^[\?!+#\s]+(\s|$)/;

function strippedMoveComment(plyNum, varId, addHtmlTags) {
    if (typeof(addHtmlTags) == "undefined") {
        addHtmlTags = !1
    }
    if (typeof(varId) == "undefined") {
        varId = CurrentVar
    }
    if (!MoveCommentsVar[varId][plyNum]) {
        return ""
    }
    return fixCommentForDisplay(MoveCommentsVar[varId][plyNum]).replace(pgn4webVariationRegExpGlobal, function(m) {
        return variationTextFromTag(m, addHtmlTags)
    }).replace(/\[%[^\]]*\]\s*/g, '').replace(basicNAGs, '').replace(/^\s+$/, '')
}

function basicNAGsMoveComment(plyNum, varId) {
    if (typeof(varId) == "undefined") {
        varId = CurrentVar
    }
    if (!MoveCommentsVar[varId][plyNum]) {
        return ""
    }
    var thisBasicNAGs = MoveCommentsVar[varId][plyNum].replace(/\[%[^\]]*\]\s*/g, '').match(basicNAGs, '');
    return thisBasicNAGs ? thisBasicNAGs[0].replace(/\s+(?!class=)/gi, '') : ''
}

function variationTextFromTag(variationTag, addHtmlTags) {
    if (typeof(addHtmlTags) == "undefined") {
        addHtmlTags = !1
    }
    var varId = variationTag.replace(pgn4webVariationRegExp, "$1");
    if (isNaN(varId)) {
        myAlert("error: issue parsing variation tag " + variationTag + " in game " + (currentGame + 1), !0);
        return ""
    }
    var text = variationTextFromId(varId);
    if (text) {
        if (addHtmlTags) {
            text = '</SPAN>' + text + '<SPAN CLASS="comment">'
        }
    } else {
        text = ''
    }
    return text
}
var variationTextDepth, printedComment, printedVariation;

function variationTextFromId(varId) {
    var punctChars = ",.;:!?",
        thisComment;
    if (isNaN(varId) || varId < 0 || varId >= numberOfVars || typeof(StartPlyVar[varId]) == "undefined" || typeof(PlyNumberVar[varId]) == "undefined") {
        myAlert("error: issue parsing variation id " + varId + " in game " + (currentGame + 1), !0);
        return ""
    }
    var text = ++variationTextDepth ? ('<SPAN CLASS="variation">' + (printedVariation ? ' ' : '') + (variationTextDepth > 1 ? '(' : '[')) + '</SPAN>' : '';
    printedVariation = !1;
    for (var ii = StartPlyVar[varId]; ii < StartPlyVar[varId] + PlyNumberVar[varId]; ii++) {
        printedComment = !1;
        if (commentsIntoMoveText && (thisComment = strippedMoveComment(ii, varId, !0))) {
            if (commentsOnSeparateLines && variationTextDepth === 0 && ii > StartPlyVar[varId]) {
                text += '<DIV CLASS="comment" STYLE="line-height: 33%;">&nbsp;</DIV>'
            }
            if (printedVariation) {
                if (punctChars.indexOf(thisComment.charAt(0)) == -1) {
                    text += '<SPAN CLASS="variation"> </SPAN>'
                }
            } else {
                printedVariation = variationTextDepth > 0
            }
            text += '<SPAN CLASS="comment">' + thisComment + '</SPAN>';
            if (commentsOnSeparateLines && variationTextDepth === 0) {
                text += '<DIV CLASS="comment" STYLE="line-height: 33%;">&nbsp;</DIV>'
            }
            printedComment = !0
        }
        if (printedComment || printedVariation) {
            text += '<SPAN CLASS="variation"> </SPAN>'
        }
        printedVariation = !0;
        text += printMoveText(ii, varId, (variationTextDepth > 0), ((printedComment) || (ii == StartPlyVar[varId])), !0)
    }
    if (commentsIntoMoveText && (thisComment = strippedMoveComment(StartPlyVar[varId] + PlyNumberVar[varId], varId, !0))) {
        if (commentsOnSeparateLines && variationTextDepth === 0) {
            text += '<DIV CLASS="comment" STYLE="line-height: 33%;">&nbsp;</DIV>'
        }
        if (printedVariation && (punctChars.indexOf(thisComment.charAt(0)) == -1)) {
            text += '<SPAN CLASS="comment notranslate"> </SPAN>'
        }
        text += '<SPAN CLASS="comment">' + thisComment + '</SPAN>';
        printedComment = !0
    }
    text += variationTextDepth-- ? ('<SPAN CLASS="variation">' + (variationTextDepth ? ')' : ']') + '</SPAN>') : '';
    printedVariation = !0;
    return text
}

function printMoveText(thisPly, thisVar, isVar, hasLeadingNum, hasId) {
    if (typeof(thisVar) == "undefined") {
        thisVar = CurrentVar
    }
    if (typeof(thisPly) == "undefined") {
        thisPly = CurrentPly
    }
    var text = '';
    if (thisVar >= numberOfVars || thisPly < StartPlyVar[thisVar] || thisPly > StartPlyVar[thisVar] + PlyNumberVar[thisVar]) {
        return text
    }
    var moveCount = Math.floor(thisPly / 2) + 1;
    if (thisPly % 2 === 0) {
        if (moveCount == 1) {
            text += '<SPAN CLASS="' + (isVar ? 'variation' : 'move') + ' notranslate">' + moveCount + '.&nbsp;</SPAN>'
        } else {
            text += '<SPAN CLASS="' + (isVar ? 'variation' : 'move') + ' notranslate">' + moveCount + '.&nbsp;</SPAN>'
        }
    } else {
        if (hasLeadingNum) {
            text += '<SPAN CLASS="' + (isVar ? 'variation' : 'move') + ' notranslate">' + moveCount + '...&nbsp;</SPAN>'
        }
    }
    var jj = thisPly + 1;
    text += '<A HREF="javascript:void(0);" ONCLICK="GoToMove(' + jj + ', ' + thisVar + ');" ' + 'CLASS="' + (isVar ? 'variation' : 'move') + ' notranslate" ' + (hasId ? ('ID="Var' + thisVar + 'Mv' + jj + '" ') : '') + 'ONFOCUS="this.blur();">' + MovesVar[thisVar][thisPly];
    if (commentsIntoMoveText) {
        text += basicNAGsMoveComment(jj, thisVar)
    }
    text += '</A>';
    return text
}

function enableAutoScrollToCurrentMove(objId) {
    autoScrollToCurrentMove_objId = objId
}

function disableAutoScrollToCurrentMove() {
    autoScrollToCurrentMove_objId = ""
}

function toggleAutoScrollToCurrentMove(objId) {
    autoScrollToCurrentMove_objId = autoScrollToCurrentMove_objId ? "" : objId
}
var autoScrollToCurrentMove_objId = "";

function autoScrollToCurrentMoveIfEnabled() {
    autoScrollToCurrentMove(autoScrollToCurrentMove_objId)
}

function objOffsetVeryTop(obj) {
    for (var offset = obj.offsetTop; obj = obj.offsetParent;) {
        offset += obj.offsetTop + obj.clientTop
    }
    return offset
}

function autoScrollToCurrentMove(objId) {
    if (!objId) {
        return
    }
    var theContainerObj = document.getElementById(objId);
    if (theContainerObj) {
        if (CurrentPly == StartPly) {
            theContainerObj.scrollTop = 0
        } else {
            var theMoveObj = document.getElementById('Var' + CurrentVar + 'Mv' + CurrentPly);
            if (theMoveObj) {
                var theContainerObjOffsetVeryTop = objOffsetVeryTop(theContainerObj);
                var theMoveObjOffsetVeryTop = objOffsetVeryTop(theMoveObj);
                if ((theMoveObjOffsetVeryTop + theMoveObj.offsetHeight > theContainerObjOffsetVeryTop + theContainerObj.scrollTop + theContainerObj.clientHeight) || (theMoveObjOffsetVeryTop < theContainerObjOffsetVeryTop + theContainerObj.scrollTop)) {
                    theContainerObj.scrollTop = theMoveObjOffsetVeryTop - theContainerObjOffsetVeryTop
                }
            }
        }
    }
}
var blackBottom = !1;

function ylcetFlipBoard1() {
    if (theObj = document.getElementById("blEngineContainer")) {
        theObj.style.position = "relative";
        theObj.style.top = IsRotated ? "250px" : "0"
    }
    if (theObj = document.getElementById("whEngineContainer")) {
        theObj.style.position = "relative";
        theObj.style.top = IsRotated ? "-250px" : "0"
    }
    if (theObj = document.getElementById("whitespv1")) {
        theObj.style.position = "relative";
        theObj.style.top = IsRotated ? "250px" : "0"
        if (window.whitePv) {
            window.whitePv.IsRotated = IsRotated;
            if (window.whitePv.FlipBoard)
                window.whitePv.FlipBoard();
        }
    }
    if (theObj = document.getElementById("whitespv2")) {
        theObj.style.position = "relative";
        theObj.style.top = IsRotated ? "-250px" : "0"
        if (window.blackPv) {
            window.blackPv.IsRotated = IsRotated;
            if (window.blackPv.FlipBoard)
                window.blackPv.FlipBoard();
        }
    }
    if (theObj = document.getElementById("black_pv")) {
        theObj.style.position = "relative";
        theObj.style.top = IsRotated ? "162px" : "0"
    }
    if (theObj = document.getElementById("white_pv")) {
        theObj.style.position = "relative";
        theObj.style.top = IsRotated ? "-162px" : "0"
    }
    if (theObj = document.getElementById("GameBlackS")) {
        theObj.style.position = "relative";
        theObj.style.top = IsRotated ? "162px" : "0"
    }
    if (theObj = document.getElementById("GameWhiteS")) {
        theObj.style.position = "relative";
        theObj.style.top = IsRotated ? "-162px" : "0";
    }
}

function ylcetFlipBoard() {
    //////console.log ("entered ylcetFlipBoard");
    if (theObj = document.getElementById("blEngineContainer")) {
        theObj.style.position = "relative";
        theObj.style.top = IsRotated ? "250px" : "0"
    }
    //////console.log ("entered ylcetFlipBoard1");
    if (theObj = document.getElementById("whEngineContainer")) {
        theObj.style.position = "relative";
        theObj.style.top = IsRotated ? "-250px" : "0"
    }
    if (theObj = document.getElementById("whitespv1")) {
        theObj.style.position = "relative";
        theObj.style.top = IsRotated ? "250px" : "0"
        if (window.whitePv) {
            window.whitePv.IsRotated = IsRotated;
            if (window.whitePv.FlipBoard)
                window.whitePv.FlipBoard();
        }
    }
    if (theObj = document.getElementById("whitespv2")) {
        theObj.style.position = "relative";
        theObj.style.top = IsRotated ? "-250px" : "0"
        if (window.blackPv) {
            window.blackPv.IsRotated = IsRotated;
            if (window.blackPv.FlipBoard)
                window.blackPv.FlipBoard();
        }
    }
    //////console.log ("entered ylcetFlipBoard2");
    if (theObj = document.getElementById("black_pv")) {
        theObj.style.position = "relative";
        theObj.style.top = IsRotated ? "162px" : "0"
    }
    //////console.log ("entered ylcetFlipBoard2");
    if (theObj = document.getElementById("white_pv")) {
        theObj.style.position = "relative";
        theObj.style.top = IsRotated ? "-162px" : "0"
    }
    if (theObj = document.getElementById("GameBlackS")) {
        theObj.style.position = "relative";
        theObj.style.top = IsRotated ? "162px" : "0"
    }
    if (theObj = document.getElementById("GameWhiteS")) {
        theObj.style.position = "relative";
        theObj.style.top = IsRotated ? "-162px" : "0";
    }
    //////console.log ("entered ylcetFlipBoard3");
    SetHighlight(true);
}

function FlipBoard() {
    if (currentPage == "live_big.php") {
        blackBottom = !blackBottom;
        if (theObj = document.getElementById("board_md_w_row")) {
            theObj.style.position = "relative";
            theObj.style.top = blackBottom ? "-432px" : "0"
        }
        if (theObj = document.getElementById("board_md_b_row")) {
            theObj.style.position = "relative";
            theObj.style.top = blackBottom ? "432px" : "0"
        }
        if (theObj = document.getElementById("board_letters_row_w")) {
            theObj.style.display = blackBottom ? "none" : "block"
        }
        if (theObj = document.getElementById("board_letters_row_b")) {
            theObj.style.display = blackBottom ? "block" : "none"
        }
        if (theObj = document.getElementById("board_numbers_row_w")) {
            theObj.style.display = blackBottom ? "none" : "block"
        }
        if (theObj = document.getElementById("board_numbers_row_b")) {
            theObj.style.display = blackBottom ? "block" : "none"
        }
        tmpHighlightOption = highlightOption;
        if (tmpHighlightOption) {
            SetHighlight(!1)
        }
        IsRotated = !IsRotated;
        RefreshBoard();
        if (tmpHighlightOption) {
            SetHighlight(!0)
        }
    } else {
        if (theObj = document.getElementById("black-engine-box")) {
            theObj.style.position = "relative";
            theObj.style.top = flipped ? "184px" : "0"
        }
        if (theObj = document.getElementById("white-engine-box")) {
            theObj.style.position = "relative";
            theObj.style.top = flipped ? "-184px" : "0"
        }
        if (theObj = document.getElementById("tcec_gui_matclo_b")) {
            theObj.style.position = "relative";
            if (localStorage.getItem("TCEC_Coor") == 'Off') {
                theObj.style.top = flipped ? "411px" : "0"
            } else if (localStorage.getItem("TCEC_Coor") == 'On') {
                theObj.style.top = flipped ? "423px" : "0"
            }
        }
        if (theObj = document.getElementById("tcec_gui_matclo_w")) {
            theObj.style.position = "relative";
            if (localStorage.getItem("TCEC_Coor") == 'Off') {
                theObj.style.top = flipped ? "-411px" : "0"
            } else if (localStorage.getItem("TCEC_Coor") == 'On') {
                theObj.style.top = flipped ? "-423px" : "0"
            }
        }
        if (theObj = document.getElementById("GameCoorRnor")) {
            theObj.style.display = flipped ? "none" : "block"
        }
        if (theObj = document.getElementById("GameCoorRfli")) {
            theObj.style.display = flipped ? "block" : "none"
        }
        if (theObj = document.getElementById("GameCoorBnor")) {
            theObj.style.display = flipped ? "none" : "block"
        }
        if (theObj = document.getElementById("GameCoorBfli")) {
            theObj.style.display = flipped ? "block" : "none"
        }
        RefreshBoard()
    }
}

function RefreshBoard() {
    for (var jj = 0; jj < 8; ++jj) {
        for (var ii = 0; ii < 8; ++ii) {
            if (Board[jj][ii] === 0) {
                SetImage(jj, ii, ClearImg.src)
            }
        }
    }
    for (jj = 0; jj < 2; ++jj) {
        for (ii = 0; ii < 16; ++ii) {
            if (PieceType[jj][ii] > 0) {
                SetImage(PieceCol[jj][ii], PieceRow[jj][ii], PieceImg[jj][PieceType[jj][ii]].src)
            }
        }
    }
}

function SetAutoPlay(vv) {
    isAutoPlayOn = vv;
    if (AutoPlayInterval) {
        clearTimeout(AutoPlayInterval);
        AutoPlayInterval = null
    }
    if (isAutoPlayOn) {
        if (document.GameButtonsForm) {
            if (document.GameButtonsForm.AutoPlay) {
                document.GameButtonsForm.AutoPlay.value = "=";
                document.GameButtonsForm.AutoPlay.title = "toggle autoplay (stop)";
                document.GameButtonsForm.AutoPlay.className = "buttonControlStop"
            }
        }
        if (CurrentPly < StartPlyVar[CurrentVar] + PlyNumberVar[CurrentVar]) {
            AutoPlayInterval = setTimeout("MoveForward(1)", Delay);
        } else {
            if (autoplayNextGame && (CurrentVar === 0)) {
                AutoPlayInterval = setTimeout("AutoplayNextGame()")
            } else {
                SetAutoPlay(!1)
            }
        }
    } else {
        if (document.GameButtonsForm) {
            if (document.GameButtonsForm.AutoPlay) {
                document.GameButtonsForm.AutoPlay.value = "+";
                document.GameButtonsForm.AutoPlay.title = "toggle autoplay (start)";
                document.GameButtonsForm.AutoPlay.className = "buttonControlPlay"
            }
        }
    }
}
var minAutoplayDelay = 500; /* ylcet */
var maxAutoplayDelay = 300000;

function setCustomAutoplayDelay() {
    var newDelaySec = prompt("Enter custom autoplay delay, in seconds, between " + (minAutoplayDelay / 1000) + " and " + (maxAutoplayDelay / 1000) + ":", Math.floor(Delay / 100) / 10);
    if (!isNaN(newDelaySec = parseInt(newDelaySec, 10))) {
        SetAutoplayDelayAndStart(newDelaySec * 1000)
    }
}

function SetAutoplayDelay(vv) {
    if (isNaN(vv = parseInt(vv, 10))) {
        return
    }
    Delay = Math.min(Math.max(vv, minAutoplayDelay), maxAutoplayDelay)
}

function SetAutoplayDelayAndStart(vv) {
    MoveForward(1);
    SetAutoplayDelay(vv);
    SetAutoPlay(!0)
}

function SetLiveBroadcast(delay, alertFlag, demoFlag, stepFlag) {
    LiveBroadcastDelay = delay;
    LiveBroadcastAlert = (alertFlag === !0);
    LiveBroadcastDemo = (demoFlag === !0);
    LiveBroadcastSteppingMode = (stepFlag === !0);
    setG7A6B6H7boardShortcuts()
}

function SetImage(col, row, image) {
    var trow = IsRotated ? row : 7 - row;
    var tcol = IsRotated ? 7 - col : col;
    var theObj = document.getElementById('img_' + 'tcol' + tcol + 'trow' + trow);
    if ((theObj) && (theObj.src != image)) {
        theObj.src = image
    }
}

function SetImagePath(path) {
    ImagePath = path
}

function SwitchAutoPlay() {
    if (!isAutoPlayOn) {
        MoveForward(1)
    }
    SetAutoPlay(!isAutoPlayOn)
}

function StoreMove(thisPly) {
    HistVar[thisPly + 1] = CurrentVar;
    if (HistNull[thisPly] = mvIsNull) {
        return
    }
    HistPieceId[0][thisPly] = mvPieceId;
    HistCol[0][thisPly] = PieceCol[MoveColor][mvPieceId];
    HistRow[0][thisPly] = PieceRow[MoveColor][mvPieceId];
    HistType[0][thisPly] = PieceType[MoveColor][mvPieceId];
    HistCol[2][thisPly] = mvToCol;
    HistRow[2][thisPly] = mvToRow;
    if (mvIsCastling) {
        HistPieceId[1][thisPly] = castleRook;
        HistCol[1][thisPly] = PieceCol[MoveColor][castleRook];
        HistRow[1][thisPly] = PieceRow[MoveColor][castleRook];
        HistType[1][thisPly] = PieceType[MoveColor][castleRook]
    } else if (mvCapturedId >= 0) {
        HistPieceId[1][thisPly] = mvCapturedId + 16;
        HistCol[1][thisPly] = PieceCol[1 - MoveColor][mvCapturedId];
        HistRow[1][thisPly] = PieceRow[1 - MoveColor][mvCapturedId];
        HistType[1][thisPly] = PieceType[1 - MoveColor][mvCapturedId]
    } else {
        HistPieceId[1][thisPly] = -1
    }
    Board[PieceCol[MoveColor][mvPieceId]][PieceRow[MoveColor][mvPieceId]] = 0;
    if (mvCapturedId >= 0) {
        PieceType[1 - MoveColor][mvCapturedId] = -1;
        PieceMoveCounter[1 - MoveColor][mvCapturedId]++;
        Board[PieceCol[1 - MoveColor][mvCapturedId]][PieceRow[1 - MoveColor][mvCapturedId]] = 0
    }
    PieceType[MoveColor][mvPieceId] = mvPieceOnTo;
    PieceMoveCounter[MoveColor][mvPieceId]++;
    PieceCol[MoveColor][mvPieceId] = mvToCol;
    PieceRow[MoveColor][mvPieceId] = mvToRow;
    if (mvIsCastling) {
        PieceMoveCounter[MoveColor][castleRook]++;
        PieceCol[MoveColor][castleRook] = mvToCol == 2 ? 3 : 5;
        PieceRow[MoveColor][castleRook] = mvToRow
    }
    Board[mvToCol][mvToRow] = PieceType[MoveColor][mvPieceId] * (1 - 2 * MoveColor);
    if (mvIsCastling) {
        Board[PieceCol[MoveColor][castleRook]][PieceRow[MoveColor][castleRook]] = PieceType[MoveColor][castleRook] * (1 - 2 * MoveColor)
    }
    return
}

function UndoMove(thisPly) {
    if (HistNull[thisPly]) {
        return
    }
    var chgPiece = HistPieceId[0][thisPly];
    Board[PieceCol[MoveColor][chgPiece]][PieceRow[MoveColor][chgPiece]] = 0;
    Board[HistCol[0][thisPly]][HistRow[0][thisPly]] = HistType[0][thisPly] * (1 - 2 * MoveColor);
    PieceType[MoveColor][chgPiece] = HistType[0][thisPly];
    PieceCol[MoveColor][chgPiece] = HistCol[0][thisPly];
    PieceRow[MoveColor][chgPiece] = HistRow[0][thisPly];
    PieceMoveCounter[MoveColor][chgPiece]--;
    chgPiece = HistPieceId[1][thisPly];
    if ((chgPiece >= 0) && (chgPiece < 16)) {
        Board[PieceCol[MoveColor][chgPiece]][PieceRow[MoveColor][chgPiece]] = 0;
        Board[HistCol[1][thisPly]][HistRow[1][thisPly]] = HistType[1][thisPly] * (1 - 2 * MoveColor);
        PieceType[MoveColor][chgPiece] = HistType[1][thisPly];
        PieceCol[MoveColor][chgPiece] = HistCol[1][thisPly];
        PieceRow[MoveColor][chgPiece] = HistRow[1][thisPly];
        PieceMoveCounter[MoveColor][chgPiece]--
    }
    chgPiece -= 16;
    if ((chgPiece >= 0) && (chgPiece < 16)) {
        Board[PieceCol[1 - MoveColor][chgPiece]][PieceRow[1 - MoveColor][chgPiece]] = 0;
        Board[HistCol[1][thisPly]][HistRow[1][thisPly]] = HistType[1][thisPly] * (2 * MoveColor - 1);
        PieceType[1 - MoveColor][chgPiece] = HistType[1][thisPly];
        PieceCol[1 - MoveColor][chgPiece] = HistCol[1][thisPly];
        PieceRow[1 - MoveColor][chgPiece] = HistRow[1][thisPly];
        PieceMoveCounter[1 - MoveColor][chgPiece]--
    }
}

function Color(nn) {
    if (nn < 0) {
        return 1
    }
    if (nn > 0) {
        return 0
    }
    return 2
}

function sign(nn) {
    if (nn > 0) {
        return 1
    }
    if (nn < 0) {
        return -1
    }
    return 0
}

function SquareOnBoard(col, row) {
    return col >= 0 && col <= 7 && row >= 0 && row <= 7
}
var pgn4webMaxTouches = 0;
var pgn4webOngoingTouches = new Array();

function pgn4webOngoingTouchIndexById(needle) {
    var id;
    for (var ii = 0; ii < pgn4webOngoingTouches.length; ii++) {
        id = pgn4webOngoingTouches[ii].identifier;
        if (pgn4webOngoingTouches[ii].identifier === needle) {
            return ii
        }
    }
    return -1
}

function pgn4web_handleTouchStart(e) {
    e.stopPropagation();
    for (var ii = 0; ii < e.changedTouches.length; ii++) {
        pgn4webMaxTouches++;
        pgn4webOngoingTouches.push({
            identifier: e.changedTouches[ii].identifier,
            clientX: e.changedTouches[ii].clientX,
            clientY: e.changedTouches[ii].clientY
        })
    }
}

function pgn4web_handleTouchMove(e) {
    e.stopPropagation();
    e.preventDefault()
}

function pgn4web_handleTouchEnd(e) {
    e.stopPropagation();
    var jj;
    for (var ii = 0; ii < e.changedTouches.length; ii++) {
        if ((jj = pgn4webOngoingTouchIndexById(e.changedTouches[ii].identifier)) != -1) {
            if (pgn4webOngoingTouches.length == 1) {
                customFunctionOnTouch(e.changedTouches[ii].clientX - pgn4webOngoingTouches[jj].clientX, e.changedTouches[ii].clientY - pgn4webOngoingTouches[jj].clientY);
                pgn4webMaxTouches = 0
            }
            pgn4webOngoingTouches.splice(jj, 1)
        }
    }
    clearSelectedText()
}

function pgn4web_handleTouchCancel(e) {
    e.stopPropagation();
    var jj;
    for (var ii = 0; ii < e.changedTouches.length; ii++) {
        if ((jj = pgn4webOngoingTouchIndexById(e.changedTouches[ii].identifier)) != -1) {
            pgn4webOngoingTouches.splice(jj, 1);
            if (pgn4webOngoingTouches.length === 0) {
                pgn4webMaxTouches = 0
            }
        }
    }
    clearSelectedText()
}

function pgn4web_initTouchEvents() {
    var theObj = document.getElementById("GameBoard");
    if (theObj && touchEventEnabled) {
        simpleAddEvent(theObj, "touchstart", pgn4web_handleTouchStart);
        simpleAddEvent(theObj, "touchmove", pgn4web_handleTouchMove);
        simpleAddEvent(theObj, "touchend", pgn4web_handleTouchEnd);
        simpleAddEvent(theObj, "touchleave", pgn4web_handleTouchEnd);
        simpleAddEvent(theObj, "touchcancel", pgn4web_handleTouchCancel)
    }
}
var waitForDoubleLeftTouchTimer = null;

function customFunctionOnTouch(deltaX, deltaY) {
    if (Math.max(Math.abs(deltaX), Math.abs(deltaY)) < 13) {
        return
    }
    if (Math.abs(deltaY) > 1.5 * Math.abs(deltaX)) {
        if (numberOfGames > 1) {
            if ((currentGame === 0) && (deltaY < 0)) {
                Init(numberOfGames - 1)
            } else if ((currentGame === numberOfGames - 1) && (deltaY > 0)) {
                Init(0)
            } else {
                Init(currentGame + sign(deltaY))
            }
        }
    } else if (Math.abs(deltaX) > 1.5 * Math.abs(deltaY)) {
        if (deltaX > 0) {
            if (isAutoPlayOn) {
                GoToMove(StartPlyVar[CurrentVar] + PlyNumberVar[CurrentVar])
            } else {
                SwitchAutoPlay()
            }
        } else {
            if (isAutoPlayOn && !waitForDoubleLeftTouchTimer) {
                SwitchAutoPlay()
            } else {
                if (waitForDoubleLeftTouchTimer) {
                    clearTimeout(waitForDoubleLeftTouchTimer);
                    waitForDoubleLeftTouchTimer = null
                }
                if ((LiveBroadcastDelay > 0) && (CurrentVar === 0) && (CurrentPly === StartPly + PlyNumber)) {
                    waitForDoubleLeftTouchTimer = setTimeout("waitForDoubleLeftTouchTimer = null;", 900);
                    replayPreviousMoves(6)
                } else {
                    GoToMove(StartPlyVar[CurrentVar] + (((CurrentPly <= StartPlyVar[CurrentVar] + 1) || (CurrentVar === 0)) ? 0 : 1))
                }
            }
        }
    }
}
var touchEventEnabled = !0;

function SetTouchEventEnabled(onOff) {
    touchEventEnabled = onOff
}

function clearSelectedText() {
    if (window.getSelection) {
        if (window.getSelection().empty) {
            window.getSelection().empty()
        } else if (window.getSelection().removeAllRanges) {
            window.getSelection().removeAllRanges()
        }
    } else if (document.selection && document.selection.empty) {
        document.selection.empty()
    }
}

function simpleHtmlentities(text) {
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

function simpleHtmlentitiesDecode(text) {
    return text.replace(/&gt;/g, ">").replace(/&lt;/g, "<").replace(/&amp;/g, "&")
}
SetHighlightOption(!0);
SetCommentsOnSeparateLines(!1);
SetAutoplayDelay(1);
SetAutostartAutoplay(!1);
SetAutoplayNextGame(!1);
SetShortcutKeysEnabled(!0);
if (localStorage.getItem('TCEC_Them') === null) {
    localStorage.setItem('TCEC_Them', 'nT');
}

if (localStorage.getItem('TCEC_Coor') === null) {
    localStorage.setItem('TCEC_Coor', 'Off')
}
if (localStorage.getItem('TCEC_FEN') === null) {
    localStorage.setItem('TCEC_FEN', 'Off')
}
if (localStorage.getItem('TCEC_Conf') === null) {
    localStorage.setItem('TCEC_Conf', 'Off')
}
if (localStorage.getItem('TCEC_Rota') === null) {
    localStorage.setItem('TCEC_Rota', 'Off')
}
if (localStorage.getItem("TCEC_Soun") === null) {
    localStorage.setItem('TCEC_Soun', 'On')
}
if (localStorage.getItem('TCEC_Chat') === null) {
    localStorage.setItem('TCEC_Chat', 'On')
}
if (localStorage.getItem('YLCET_font') === null) {
    localStorage.setItem('YLCET_font', 'ME')
}
if (localStorage.getItem('TCEC_Nigh') === null) {
    localStorage.setItem('TCEC_Nigh', 'Off')
}
if (localStorage.getItem('TCEC_GraE') === null) {
    localStorage.setItem('TCEC_GraE', 'On')
}
if (localStorage.getItem('TCEC_GraT') === null) {
    localStorage.setItem('TCEC_GraT', 'On')
}
if (localStorage.getItem('TCEC_GraD') === null) {
    localStorage.setItem('TCEC_GraD', 'On')
}
if (localStorage.getItem('TCEC_GraS') === null) {
    localStorage.setItem('TCEC_GraS', 'On')
}
if (localStorage.getItem('TCEC_GraTB') === null) {
    localStorage.setItem('TCEC_GraTB', 'On')
}

function secFormat(timeip) 
{
    var sec_num = parseInt(timeip, 10); // don't forget the second param
    var hours   = Math.floor(sec_num / 3600);
    var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
    var seconds = sec_num - (hours * 3600) - (minutes * 60);

    if (hours   < 10) {hours   = "0"+hours;}
    if (minutes < 10) {minutes = "0"+minutes;}
    if (seconds < 10) {seconds = "0"+seconds;}
    return hours+':'+minutes+':'+seconds;
}

function secFormatNoH(timeip) 
{
    var sec_num = parseInt(timeip, 10); // don't forget the second param
    var hours   = Math.floor(sec_num / 3600);
    var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
    var seconds = sec_num - (hours * 3600) - (minutes * 60);

    if (hours   < 10) {hours   = "0"+hours;}
    if (minutes < 10) {minutes = "0"+minutes;}
    if (seconds < 10) {seconds = "0"+seconds;}
    return minutes+':'+seconds;
}

function SetGrap(arr, what) {
    var how_many = 0;
    for (var i = 0; i < arr.length; i++) {
        if (arr[i] == what) how_many++
    }
    localStorage.setItem('TCEC_Grap', how_many)
}
SetGrap([localStorage.getItem('TCEC_GraE'), localStorage.getItem('TCEC_GraT'), localStorage.getItem('TCEC_GraD'), localStorage.getItem('TCEC_GraS'), localStorage.getItem('TCEC_GraTB')], 'On');

var LastMovetimeLastModifiedHeader1 = (new Date(0)).toUTCString();
var CrosstableLastModifiedHeader1 = (new Date(0)).toUTCString();
var SchedtableLastModifiedHeader1 = (new Date(0)).toUTCString();
var SchedtableLastModifiedHeader2 = (new Date(0)).toUTCString();
var myupdatePvHeader1 = (new Date(0)).toUTCString();
var mysfliveevalLastModifiedHeader1 = (new Date(0)).toUTCString();

var nullDate = (new Date(0)).toUTCString();
var SchedendTime = 0;

function customFunctionOnPgnGameLoad() {
    var theObj = document.getElementById("GameBoard");
    theObj.style.padding = "0px";
    theObj.style.width = theObj.style.width;
    theObj.style.height = theObj.style.height;
    theObj.style.textAlign = "left";
    PVCount = -1;
    if (isArchiveFile()) {
        var currGmObj = document.getElementById('currGame');
        if (currGmObj) {
            document.getElementById('currGame').innerHTML = currentGame + 1;
            var urlNew = window.location.href;
            urlNew = urlNew.replace(/&gn=[^&#]*/g, '');
            urlNew += "&gn=" + parseInt(currentGame + 1);
            /* var regex = new RegExp("(gn=([^&#]*))"); */
        }
    } 
    else 
    {
        var currGmObj = document.getElementById('currGame');
        if (currGmObj) 
        {
            var gameRoundVal10 = parseInt(gameRound[currentGame] * 10);
            var gameRoundValR10 = parseInt(gameRoundVal10/10);
            var gameDiff = gameRoundVal10 - gameRoundValR10 * 10;
            var localGameNum = (gameRoundValR10 - 1) * 4 + gameDiff;

            document.getElementById('currGame').innerHTML = localGameNum;
            var revGame = document.getElementById('revgame');
            var gameN = parseInt(localGameNum);
            var extraAdd = 0;
            var magicN = 28;
            if (gameN > 112)
            {
                extraAdd = 112;
            }
            else if (gameN > 56)
            {
                extraAdd = 56;
            }

            gameN = gameN - extraAdd;

            if (gameN%magicN == gameN)
            {
                gameN = gameN + magicN + extraAdd;
            }
            else
            {
                gameN = gameN - magicN + extraAdd;
                if (gameN == 0)
                {
                    gameN = extraAdd + 56;
                }
            }
            revGame.innerHTML = "R#:"+gameN;
            setRevLive();
        }
    }
    var currGmObj = document.getElementById('currGm');
    if (currGmObj) {
        document.getElementById('currGm').innerHTML = currentGame + 1;
        var urlNew = window.location.href;
        urlNew = urlNew.replace(/&gn=[^&#]*/g, '');
        urlNew += "&gn=" + parseInt(currentGame + 1);
        /* var regex = new RegExp("(gn=([^&#]*))"); */
        var dirUrl = document.getElementById('directurl');
        if (dirUrl) {
            dirUrl.href = urlNew;
        }
    }
    if (InitLoad === undefined) {
        Fen();
        Coor();
        Chat();
        HideE();
        StatusCheck();
        Graphs();
        customFunctionOnPgnTextLoad();
        Twota();
        PvSel();
        InitLoad = 1
    }
    Soun();
    if (gameLink = document.getElementById("GameLink")) {
        gameLink2 = document.getElementById("GameLink2");
        if (pgnUrl != "archive/empty.pgn") {
            if (newPgnUrl === null) {
                PgnAddress = pgnUrl
            } else {
                PgnAddress = newPgnUrl
            }
            Season = PgnAddress.match(/Season_([0-9]*)_/);
            Tournament = PgnAddress.match(/Tournament_([0-9]*)./);
            Match = PgnAddress.match(/Match_([0-9]*)./);
            Annotated = PgnAddress.match(/Annotated_/);
            PreTCEC = PgnAddress.match(/_Pre_/);
            if (Annotated !== null) {
                document.getElementById("menu30").checked = !0;
                An_check(menu30)
            }
            if (!newGameNum) {
                GameNumb = ""
            } else {
                GameNumb = "&ga=" + newGameNum
            }
            if (Season !== null) {
                if (Annotated === null) {
                    checkSeason = document.getElementById("menu" + Season[1])
                } else {
                    checkSeason = document.getElementById("ag" + (parseFloat(Season[1]) + 5))
                }
                Stage = PgnAddress.match(/Stage_([0-9,a-z]*)./);
                Superfinal = PgnAddress.match(/Superfinal/);
                FRC = PgnAddress.match(/FRC/);
                Rapid = PgnAddress.match(/Rapid/);
                Blitz = PgnAddress.match(/Blitz/);
                Division = PgnAddress.match(/Division_([0-9,A-Z]*)./);
                EliteMatch = PgnAddress.match(/Elite-Match/);
                if (Stage !== null) {
                    if (Annotated === null) {
                        FullLink = "http://" + hostName + "/archive.php?se=" + Season[1] + "&st=" + Stage[1] + GameNumb;
                        checkStage = document.getElementById("s" + Season[1] + "s" + Stage[1]);
                        if (checkStage.checked == !1) {
                            checkStage.checked = !0
                        }
                    } else {
                        if (document.getElementById("s" + Season[1] + "s" + Stage[1]).id == "s4s2a") {
                            checkSeason = document.getElementById("ag8")
                        }
                        FullLink = "http://" + hostName + "/archive.php?se=" + Season[1] + "&st=" + Stage[1] + GameNumb + "&ag"
                    }
                    if (checkSeason.checked == !1) {
                        checkSeason.checked = !0
                    }
                } else if (Division !== null) {
                    if (Annotated === null) {
                        FullLink = "http://" + hostName + "/archive.php?se=" + Season[1] + "&di=" + Division[1] + GameNumb;
                        checkDivision = document.getElementById("s" + Season[1] + "d" + Division[1]);
                        if (checkDivision.checked == !1) {
                            checkDivision.checked = !0
                        }
                    } else {
                        FullLink = "http://" + hostName + "/archive.php?se=" + Season[1] + "&di=" + Division[1] + GameNumb + "&ag"
                    }
                    if (checkSeason.checked == !1) {
                        checkSeason.checked = !0
                    }
                } else if (FRC !== null) {
                    if (Annotated === null) {
                        FullLink = "http://" + hostName + "/archive.php?se=" + Season[1] + "&frc" + GameNumb;
                        checkFRC = document.getElementById("s" + Season[1] + "frc");
                        if (checkFRC.checked == !1) {
                            checkFRC.checked = !0
                        }
                    } else {
                        FullLink = "http://" + hostName + "/archive.php?se=" + Season[1] + "&frc" + GameNumb + "&ag"
                    }
                    if (checkSeason.checked == !1) {
                        checkSeason.checked = !0
                    }
                } else if (Rapid !== null) {
                    if (Annotated === null) {
                        FullLink = "http://" + hostName + "/archive.php?se=" + Season[1] + "&rapid" + GameNumb;
                        checkRapid = document.getElementById("s" + Season[1] + "rapid");
                        if (checkRapid.checked == !1) {
                            checkRapid.checked = !0
                        }
                    } else {
                        FullLink = "http://" + hostName + "/archive.php?se=" + Season[1] + "&rapid" + GameNumb + "&ag"
                    }
                    if (checkSeason.checked == !1) {
                        checkSeason.checked = !0
                    }
                } else if (Blitz !== null) {
                    if (Annotated === null) {
                        FullLink = "http://" + hostName + "/archive.php?se=" + Season[1] + "&blitz" + GameNumb;
                        checkBlitz = document.getElementById("s" + Season[1] + "blitz");
                        if (checkBlitz.checked == !1) {
                            checkBlitz.checked = !0
                        }
                    } else {
                        FullLink = "http://" + hostName + "/archive.php?se=" + Season[1] + "&blitz" + GameNumb + "&ag"
                    }
                    if (checkSeason.checked == !1) {
                        checkSeason.checked = !0
                    }
                } else if (Superfinal !== null) {
                    if (Annotated === null) {
                        FullLink = "http://" + hostName + "/archive.php?se=" + Season[1] + "&sf" + GameNumb;
                        checkSuperfinal = document.getElementById("s" + Season[1] + "sf");
                        if (checkSuperfinal.checked == !1) {
                            checkSuperfinal.checked = !0
                        }
                    } else {
                        FullLink = "http://" + hostName + "/archive.php?se=" + Season[1] + "&sf" + GameNumb + "&ag"
                    }
                    if (checkSeason.checked == !1) {
                        checkSeason.checked = !0
                    }
                } else if (EliteMatch !== null) {
                    if (Annotated === null) {
                        FullLink = "http://" + hostName + "/archive.php?se=" + Season[1] + "&em" + GameNumb;
                        checkEliteMatch = document.getElementById("s" + Season[1] + "em");
                        if (checkEliteMatch.checked == !1) {
                            checkEliteMatch.checked = !0
                        }
                    } else {
                        FullLink = "http://" + hostName + "/archive.php?se=" + Season[1] + "&em" + GameNumb + "&ag"
                    }
                    if (checkSeason.checked == !1) {
                        checkSeason.checked = !0
                    }
                }
            } else if (Tournament !== null) {
                if (Annotated === null) {
                    FullLink = "http://" + hostName + "/archive.php?to=" + Tournament[1] + GameNumb;
                    checkTournament = document.getElementById("tournament" + Tournament[1]);
                    if (checkTournament.checked == !1) {
                        checkTournament.checked = !0
                    }
                } else {
                    FullLink = "http://" + hostName + "/archive.php?to=" + Tournament[1] + GameNumb + "&ag";
                    if ("Tournament" + Tournament[1] == "Tournament5") {
                        checkTournament = document.getElementById("ag5")
                    } else if ("Tournament" + Tournament[1] == "Tournament1") {
                        checkTournament = document.getElementById("ag4")
                    }
                    if (checkTournament.checked == !1) {
                        checkTournament.checked = !0
                    }
                }
            } else if (Match !== null) {
                if (Annotated === null) {
                    FullLink = "http://" + hostName + "/archive.php?ma=" + Match[1] + GameNumb;
                    checkMatch = document.getElementById("match" + Match[1]);
                    if (checkMatch.checked == !1) {
                        checkMatch.checked = !0
                    }
                } else {
                    FullLink = "http://" + hostName + "/archive.php?ma=" + Match[1] + GameNumb + "&ag";
                    if ("Match" + Match[1] == "Match3") {
                        checkTournament = document.getElementById("ag3")
                    }
                    if (checkTournament.checked == !1) {
                        checkTournament.checked = !0
                    }
                }
            } else if (PreTCEC !== null) {
                FullLink = "http://" + hostName + "/archive.php?pt=1&ag";
                checkTournament = document.getElementById("ag2");
                if (checkTournament.checked == !1) {
                    checkTournament.checked = !0
                }
            }
            gameLink.innerHTML = '<a href="' + FullLink + '">' + FullLink + '</a>';
            gameLink2.innerHTML = 'Direct link to game:'
        }
    }
    LiveM = document.getElementById("live-page");
    ArchM = document.getElementById("archive-page");
    if (currentPage == "live.html") {
        if (LiveM) {
            LiveM.src = "./img/check.png"
        }
        if (ArchM) {
            ArchM.src = "./img/check_empty.png"
        }
    } else if (currentPage == "archive.php") {
        if (LiveM) {
            LiveM.src = "./img/check_empty.png"
        }
        if (ArchM) {
            ArchM.src = "./img/check.png"
        }
    }
    var ScheduleLastModifiedHeader = (new Date(0)).toUTCString();

    function scheduleUrl() {
        return ('archive/' + gameEvent[currentGame] + ' Schedule.txt')
    }

    function updateScheduleFromHttpRequest(this_http_request) {
        if (this_http_request.readyState != 4) {
            return
        }
        if (this_http_request.status == 404) {
            theObj1 = document.getElementById("scheduleText");
            theObj1.innerHTML = "No schedule for this event was found";
            theObj2 = document.getElementById("Schedule");
            theObj2.innerHTML = ""
        }
        if (this_http_request.status == 200) {
            ScheduleLastModifiedHeader = this_http_request.getResponseHeader("Last-Modified");
            document.getElementById("Schedule").innerHTML = this_http_request.responseText.replace(/<html>|<head>|<title>.*<\/title>|<body>|<br.*>|GUI:|<a.*<\/a>|<\/body>|<\/html>/g, "")
        }
    }

    function updateSchedule() {
        var http_request = !1;
        if (window.XMLHttpRequest) {
            http_request = new XMLHttpRequest()
        } else if (window.ActiveXObject) {
            try {
                http_request = new ActiveXObject("Msxml2.XMLHTTP")
            } catch (e) {
                try {
                    http_request = new ActiveXObject("Microsoft.XMLHTTP")
                } catch (e) {
                    return !1
                }
            }
        }
        if (!http_request) {
            return !1
        }
        http_request.onreadystatechange = function() {
            updateScheduleFromHttpRequest(http_request)
        };
        try {
            var randomizer1 = "";
            if ((LiveBroadcastDelay > 0) && (pgnUrl.indexOf("?") == -1) && (pgnUrl.indexOf("#") == -1)) {
                randomizer1 = "?noCache=" + (0x1000000000 + Math.floor((Math.random() * 0xF000000000))).toString(16).toUpperCase()
            }
            http_request.open("GET", scheduleUrl() + randomizer1);
            http_request.setRequestHeader("If-Modified-Since", ScheduleLastModifiedHeader);
            http_request.send(null)
        } catch (e) {
            return !1
        }
        return !0
    }
    if ((theObject = document.getElementById("Schedule")) && ((pgnUrl != "live/empty.pgn") && (pgnUrl != "archive/empty.pgn"))) {
        updateSchedule();
        if (theObject = document.getElementById("scheduleText")) {
            theObject.innerHTML = "Schedule for " + gameEvent[currentGame]
        }
    }
    var CrosstableLastModifiedHeader = (new Date(0)).toUTCString();

    function crosstableUrl() {
        return ('archive/' + gameEvent[currentGame] + ' Crosstable.txt')
    }

    function updateCrosstableFromHttpRequest(this_http_request) {
        if (this_http_request.readyState != 4) {
            return
        }
        if (this_http_request.status == 404) {
            theObj1 = document.getElementById("crosstableText");
            theObj1.innerHTML = "No crosstable for this event was found";
            theObj2 = document.getElementById("Crosstable");
            theObj2.innerHTML = ""
        }
        if (this_http_request.status == 200) {
            CrosstableLastModifiedHeader = this_http_request.getResponseHeader("Last-Modified");
            document.getElementById("Crosstable").innerHTML = this_http_request.responseText.replace(/<html>|<head>|<title>.*<\/title>|<body>|<br.*>|GUI:|<a.*<\/a>|<\/body>|<\/html>/g, "").replace(/(\d+:[wb]\*)/g, "<span style='color:gray;'>$1</span>")
        }
    }

    function updateCrosstable() {
        var http_request = !1;
        if (window.XMLHttpRequest) {
            http_request = new XMLHttpRequest()
        } else if (window.ActiveXObject) {
            try {
                http_request = new ActiveXObject("Msxml2.XMLHTTP")
            } catch (e) {
                try {
                    http_request = new ActiveXObject("Microsoft.XMLHTTP")
                } catch (e) {
                    return !1
                }
            }
        }
        if (!http_request) {
            return !1
        }
        http_request.onreadystatechange = function() {
            updateCrosstableFromHttpRequest(http_request)
        };
        try {
            var randomizer2 = "";
            if ((LiveBroadcastDelay > 0) && (pgnUrl.indexOf("?") == -1) && (pgnUrl.indexOf("#") == -1)) {
                randomizer2 = "?noCache=" + (0x1000000000 + Math.floor((Math.random() * 0xF000000000))).toString(16).toUpperCase()
            }
            http_request.open("GET", crosstableUrl() + randomizer2);
            http_request.setRequestHeader("If-Modified-Since", CrosstableLastModifiedHeader);
            http_request.send(null)
        } catch (e) {
            return !1
        }
        return !0
    }

    if (theObject = document.getElementById("crosstablex")) {
        ylcetRefreshCrosstable();
    }


    if (theObject = document.getElementById("cross_divs")) {
        myupdateCrosstable();
        myupdateLiveSf();
    }

    if (theObject = document.getElementById("sched_divs")) {
        myupdateSchedtable(1);
    }

    if (theObject = document.getElementById("GameDuration")) {
        if (isArchiveFile()) {
            theObject.innerHTML = "NA";
        } else {
            gameDuration();
            var SchedendTime1 = SchedendTime;
            theObject.innerHTML = new Date(SchedendTime1).toISOString().substr(11, 8);
        }
    }

    if ((theObject = document.getElementById("Crosstable")) && ((pgnUrl != "live/empty.pgn") && (pgnUrl != "archive/empty.pgn"))) {
        updateCrosstable();
        if (theObject = document.getElementById("crosstableText")) {
            theObject.innerHTML = "Crosstable for " + gameEvent[currentGame]
        }
    }
    var plyOffset = getPlyOffset();
    var plyOffset1 = plyOffset;
    if (MoveComments[1] === '' || MoveComments[1] === 'book') {
        for (var mc in MoveComments) {
            if (mc > 1)
                if (MoveComments[mc] !== '' && MoveComments[mc] !== 'book') {
                    plyOffset = mc - 5;
                    break
                }
        }
    }
    if (plyOffset < 0) {
        plyOffset = plyOffset1;
    }
    var numGraphs = +localStorage.getItem('TCEC_Grap');
    numGraphs = 1;
    evalchartdata = new Array(["move", "white", "black", "liveeval"]);
    evalchartdataFound = !1;
    cutoff = minEval;
    for (thisPly = StartPly + plyOffset; thisPly <= StartPly + PlyNumber; thisPly++) {
        moveNum = Math.floor((thisPly - StartPly + 1) / 2);
        moveIndex = moveNum - Math.floor((plyOffset + 1) / 2);
        moveIndex = thisPly;
        if (!evalchartdata[moveIndex]) {
            evalchartdata[moveIndex] = new Array(4);
            evalchartdata[moveIndex][0] = moveNum + "";
            evalchartdata[moveIndex][1] = NaN;
            evalchartdata[moveIndex][2] = NaN;
            evalchartdata[moveIndex][3] = NaN;
            evalchartdataFound = !0
        }
        match1 = MoveComments[thisPly].match(/wv=([#M]\d+)([, }])/);
        match2 = MoveComments[thisPly].match(/wv=(-[#M]\d+)([, }])/);
        match3 = MoveComments[thisPly].match(/ev=([#M]\d+),/);
        match4 = MoveComments[thisPly].match(/ev=(-[#M]\d+),/);
        match5 = MoveComments[thisPly].match(/wv=([+-.\d]*)([, }])/);
        match6 = MoveComments[thisPly].match(/ev=([+-.\d]*),/)
        if (match4 && match1) {
            evalchartdataFound = !0;
            evalchartdata[moveIndex][thisPly % 2 ? 1 : 2] = cutoff;
            console.log ("1");
        } else if (match3 && match2) {
            evalchartdataFound = !0;
            evalchartdata[moveIndex][thisPly % 2 ? 1 : 2] = -cutoff;
            console.log ("2");
        } else if ((match2) || (match4)) {
            evalchartdataFound = !0;
            evalchartdata[moveIndex][thisPly % 2 ? 1 : 2] = -cutoff
            console.log ("3");
        } else if ((match1) || (match3)) {
            evalchartdataFound = !0;
            evalchartdata[moveIndex][thisPly % 2 ? 1 : 2] = cutoff
            console.log ("4");
        } else if (((match5) && (match6)) || ((match5) && (!match6))) {
            if ((ev = Math.min(cutoff, Math.max(-cutoff, parseFloat(match5[1])))) !== null) {
                evalchartdataFound = !0;
                evalchartdata[moveIndex][thisPly % 2 ? 1 : 2] = ev
                evalchartdata[moveIndex][thisPly % 2 ? 2 : 1] = null;
                console.log ("moveIndex:" + moveIndex + "," + (thisPly % 2 ? 1 : 2) + "," + ev);
                console.log ("moveIndex:" + moveIndex + "," + (thisPly % 2 ? 2 : 1) + "," + ev);
            }
        } else if ((!match5) && (match6)) {
            if ((ev = Math.min(cutoff, Math.max(-cutoff, parseFloat(match6[1])))) !== null) {
                evalchartdataFound = !0;
                evalchartdata[moveIndex][thisPly % 2 ? 1 : 2] = ev
        }
        }
    }

    if (nomoves = document.getElementById('eval_chart')) {
        if (evalchart === undefined) {
            evalchart = new google.visualization.LineChart(document.getElementById('eval_chart'))
        }
        if ((evalchartdataFound) && (localStorage.getItem('TCEC_GraE') == 'On')) {
            var evalchartoptions = {
                //curveType: 'function',
                fontName: 'Tahoma',
                fontSize: '9',
                backgroundColor: '#9c9c9c',
                height: '291',
                width: '100%',
                pointSize: '3',
                lineWidth: '1',
                legend: {
                    position: 'none'
                },
                chartArea: {
                    top: 10,
                    width: '99%',
                    height: '80%',
                },
                colors: ['#ffffff', '#333333', 'brown'],
                hAxis: {
                    textPosition: 'out',
                    slantedText: 0,
                    textStyle: {
                        color: '#000000'
                    },
                    maxAlternation: 1,
                    viewWindowMode: 'maximized'
                },
                vAxis: {
                    format: '0.00',
                    textPosition: 'in',
                    gridlines: {
                        color: '#e5e3de',
                        count: 7
                    },
                    textStyle: {
                        color: '#000000'
                    },
                    baselineColor: '#000000',
                    viewWindowMode: 'maximized'
                },
                tooltip: {
                    textStyle: {
                        color: '#000000'
                    }
                },
                interpolateNulls: true
            };
            evalchart.draw(google.visualization.arrayToDataTable(evalchartdata), evalchartoptions);
            google.visualization.events.addListener(evalchart, "select", evalChartClickHandler)
        } else {
            evalchart.clearChart()
        }
        if (PlyNumber == 0) {
            nomoves.innerHTML = "no game loaded";
            nomoves.style.width = "100%";
            nomoves.style.textAlign = "center"
        }
    }

    function evalChartClickHandler() {
        var selection = evalchart.getSelection();
        if (typeof(selection[0]) != "undefined") {
            if (selection[0].row !== null && selection[0].column !== null) {
                if (!isNaN(thisPly = parseInt(selection[0].row * 2 + (selection[0].column == 1 ? 1 : 2), 10))) {
                    GoToMove(thisPly + plyOffset)
                }
            }
        }
    }
    timechartdata = new Array(["move", "white", "black"]);
    timechartdataFound = !1;
    cutoff = 10800;
    for (thisPly = StartPly + plyOffset; thisPly <= StartPly + PlyNumber; thisPly++) {
        moveNum = Math.floor((thisPly - StartPly + 1) / 2);
        moveIndex = moveNum - Math.floor((plyOffset + 1) / 2);
        if (!timechartdata[moveIndex]) {
            timechartdata[moveIndex] = new Array(3);
            timechartdata[moveIndex][0] = moveNum + "";
            timechartdata[moveIndex][1] = NaN;
            timechartdata[moveIndex][2] = NaN;
            timechartdataFound = !0
        }
        match51 = MoveComments[thisPly].match(/ev=0.00, d=1, mt=00:00:00.*/);
        if (match51) {
            continue;
        }
        if (match = MoveComments[thisPly].match(/mt=([+-:.\d]*),/)) {
            if ((mt = Math.min(cutoff, Math.max(-cutoff, parseFloat(clock2sec(match[1])/1000)))) !== null) {
                timechartdataFound = !0;
                timechartdata[moveIndex][thisPly % 2 ? 1 : 2] = Math.floor(mt * 100) / 100
            }
        }
    }
    if (nomoves = document.getElementById('time_chart')) {
        if (timechart === undefined) {
            timechart = new google.visualization.LineChart(document.getElementById('time_chart'))
        }
        if ((timechartdataFound) && (localStorage.getItem('TCEC_GraT') == 'On')) {
            var timechartoptions = {
                //curveType: 'function',
                fontName: 'Tahoma',
                fontSize: '9',
                backgroundColor: '#9c9c9c',
                height: '291',
                width: '100%',
                pointSize: '3',
                lineWidth: '1',
                legend: {
                    position: 'none'
                },
                chartArea: {
                    top: 10,
                    width: '99%',
                    height: '80%',
                },
                colors: ['#ffffff', '#333333'],
                hAxis: {
                    textPosition: 'out',
                    slantedText: 0,
                    textStyle: {
                        color: '#000000'
                    },
                    maxAlternation: 1,
                    viewWindowMode: 'maximized'
                },
                vAxis: {
                    format: '0 secs',
                    textPosition: 'in',
                    gridlines: {
                        color: '#e5e3de',
                        count: 7
                    },
                    textStyle: {
                        color: '#000000'
                    },
                    baselineColor: '#000000',
                    viewWindowMode: 'maximized'
                },
                tooltip: {
                    textStyle: {
                        color: '#000000'
                    }
                }
            };
            timechart.draw(google.visualization.arrayToDataTable(timechartdata), timechartoptions);
            google.visualization.events.addListener(timechart, "select", timeChartClickHandler)
        } else {
            timechart.clearChart()
        }
        if (PlyNumber == 0) {
            nomoves.innerHTML = "no game loaded";
            nomoves.style.width = "100%";
            nomoves.style.textAlign = "center"
        }
    }

    function timeChartClickHandler() {
        var selection = timechart.getSelection();
        if (typeof(selection[0]) != "undefined") {
            if (selection[0].row !== null && selection[0].column !== null) {
                if (!isNaN(thisPly = parseInt(selection[0].row * 2 + (selection[0].column == 1 ? 1 : 2), 10))) {
                    GoToMove(thisPly + plyOffset)
                }
            }
        }
    }
    depthchartdata = new Array(["move", "white", "black"]);
    depthchartdataFound = !1;
    cutoff = 200;
    for (thisPly = StartPly + plyOffset; thisPly <= StartPly + PlyNumber; thisPly++) {
        moveNum = Math.floor((thisPly - StartPly + 1) / 2);
        moveIndex = moveNum - Math.floor((plyOffset + 1) / 2);
        if (!depthchartdata[moveIndex]) {
            depthchartdata[moveIndex] = new Array(3);
            depthchartdata[moveIndex][0] = moveNum + "";
            depthchartdata[moveIndex][1] = NaN;
            depthchartdata[moveIndex][2] = NaN;
            depthchartdataFound = !0
        }
        if (match = MoveComments[thisPly].match(/d=([+-.\d]*),/)) {
            if ((de = Math.min(cutoff, Math.max(-cutoff, parseFloat(match[1])))) !== null) {
                depthchartdataFound = !0;
                depthchartdata[moveIndex][thisPly % 2 ? 1 : 2] = de
            }
        }
    }
    if (nomoves = document.getElementById('depth_chart')) {
        if (depthchart === undefined) {
            depthchart = new google.visualization.LineChart(document.getElementById('depth_chart'))
        }
        if ((depthchartdataFound) && (localStorage.getItem('TCEC_GraD') == 'On')) {
            var depthchartoptions = {
                //curveType: 'function',
                fontName: 'Tahoma',
                fontSize: '9',
                backgroundColor: '#9c9c9c',
                height: '291',
                width: '100%',
                pointSize: '3',
                lineWidth: '1',
                legend: {
                    position: 'none'
                },
                chartArea: {
                    top: 10,
                    width: '99%',
                    height: '80%',
                },
                colors: ['#ffffff', '#333333'],
                hAxis: {
                    textPosition: 'out',
                    slantedText: 0,
                    textStyle: {
                        color: '#000000'
                    },
                    maxAlternation: 1,
                    viewWindowMode: 'maximized'
                },
                vAxis: {
                    format: '0',
                    textPosition: 'in',
                    gridlines: {
                        color: '#e5e3de',
                        count: 7
                    },
                    textStyle: {
                        color: '#000000'
                    },
                    baselineColor: '#000000',
                    viewWindowMode: 'maximized'
                },
                tooltip: {
                    textStyle: {
                        color: '#000000'
                    }
                }
            };

            depthchart.draw(google.visualization.arrayToDataTable(depthchartdata), depthchartoptions);
            google.visualization.events.addListener(depthchart, "select", depthChartClickHandler)
        } else {
            depthchart.clearChart()
        }
        if (PlyNumber == 0) {
            nomoves.innerHTML = "no game loaded";
            nomoves.style.width = "100%";
            nomoves.style.textAlign = "center"
        }
    }

    function depthChartClickHandler() {
        var selection = depthchart.getSelection();
        if (typeof(selection[0]) != "undefined") {
            if (selection[0].row !== null && selection[0].column !== null) {
                if (!isNaN(thisPly = parseInt(selection[0].row * 2 + (selection[0].column == 1 ? 1 : 2), 10))) {
                    GoToMove(thisPly + plyOffset)
                }
            }
        }
    }
    speedchartdata = new Array(["move", "white", "black"]);
    speedchartdataFound = !1;
    cutoff = 200000;
    for (thisPly = StartPly + plyOffset; thisPly <= StartPly + PlyNumber; thisPly++) {
        moveNum = Math.floor((thisPly - StartPly + 1) / 2);
        moveIndex = moveNum - Math.floor((plyOffset + 1) / 2);
        if (!speedchartdata[moveIndex]) {
            speedchartdata[moveIndex] = new Array(3);
            speedchartdata[moveIndex][0] = moveNum + "";
            speedchartdata[moveIndex][1] = NaN;
            speedchartdata[moveIndex][2] = NaN;
            speedchartdataFound = !0
        }
        if (match = MoveComments[thisPly].match(/ s=(.*?),/)) {
            if ((sp = Math.min(cutoff, Math.max(-cutoff, parseFloat(match[1]/1024)))) !== null) {
                speedchartdataFound = !0;
                speedchartdata[moveIndex][thisPly % 2 ? 1 : 2] = parseInt(sp/1024);
            }
        }
    }
    if (nomoves = document.getElementById('speed_chart')) {
        if (speedchart === undefined) {
            speedchart = new google.visualization.LineChart(document.getElementById('speed_chart'))
        }
        if ((speedchartdataFound) && (localStorage.getItem('TCEC_GraS') == 'On')) {
            var speedchartoptions = {
                //curveType: 'function',
                fontName: 'Tahoma',
                fontSize: '9',
                backgroundColor: '#9c9c9c',
                height: '291',
                width: '100%',
                pointSize: '3',
                lineWidth: '1',
                legend: {
                    position: 'none'
                },
                chartArea: {
                    top: 10,
                    width: '99%',
                    height: '80%',
                },
                colors: ['#ffffff', '#333333'],
                hAxis: {
                    textPosition: 'out',
                    slantedText: 0,
                    textStyle: {
                        color: '#000000'
                    },
                    maxAlternation: 1,
                    viewWindowMode: 'maximized'
                },
                vAxis: {
                    format: '0.00 Mn/s',
                    textPosition: 'in',
                    gridlines: {
                        color: '#e5e3de',
                        count: 7
                    },
                    textStyle: {
                        color: '#000000'
                    },
                    baselineColor: '#000000',
                    viewWindowMode: 'maximized'
                },
                tooltip: {
                    textStyle: {
                        color: '#000000'
                    }
                }
            };

            speedchart.draw(google.visualization.arrayToDataTable(speedchartdata), speedchartoptions);
            google.visualization.events.addListener(speedchart, "select", speedChartClickHandler)
        } else {
            speedchart.clearChart()
        }
        if (PlyNumber == 0) {
            nomoves.innerHTML = "no game loaded";
            nomoves.style.width = "100%";
            nomoves.style.textAlign = "center"
        }
    }

    function speedChartClickHandler() {
        var selection = speedchart.getSelection();
        if (typeof(selection[0]) != "undefined") {
            if (selection[0].row !== null && selection[0].column !== null) {
                if (!isNaN(thisPly = parseInt(selection[0].row * 2 + (selection[0].column == 1 ? 1 : 2), 10))) {
                    GoToMove(thisPly + plyOffset)
                }
            }
        }
    }
    tablebasechartdata = new Array(["move", "white", "black"]);
    tablebasechartdataFound = !1;
    cutoff = 10000000000;
    for (thisPly = StartPly + plyOffset; thisPly <= StartPly + PlyNumber; thisPly++) {
        moveNum = Math.floor((thisPly - StartPly + 1) / 2);
        moveIndex = moveNum - Math.floor((plyOffset + 1) / 2);
        if (!tablebasechartdata[moveIndex]) {
            tablebasechartdata[moveIndex] = new Array(3);
            tablebasechartdata[moveIndex][0] = moveNum + "";
            tablebasechartdata[moveIndex][1] = NaN;
            tablebasechartdata[moveIndex][2] = NaN;
            tablebasechartdataFound = !0
        }
        if (match = MoveComments[thisPly].match(/tb=([+-.\d]*),/)) {
            if ((tb = Math.min(cutoff, Math.max(-cutoff, parseFloat(match[1])))) !== null) {
                tablebasechartdataFound = !0;
                tablebasechartdata[moveIndex][thisPly % 2 ? 1 : 2] = parseInt(tb/1024);
            }
        }
    }
    if (nomoves = document.getElementById('tb_chart')) {
        if (tablebasechart === undefined) {
            tablebasechart = new google.visualization.LineChart(document.getElementById('tb_chart'))
        }
        if ((tablebasechartdataFound) && (localStorage.getItem('TCEC_GraTB') == 'On')) {
            var tablebasechartoptions = {
                //curveType: 'function',
                fontName: 'Tahoma',
                fontSize: '9',
                backgroundColor: '#9c9c9c',
                height: '291',
                width: '100%',
                pointSize: '3',
                lineWidth: '1',
                legend: {
                    position: 'none'
                },
                chartArea: {
                    top: 10,
                    width: '99%',
                    height: '80%',
                },
                colors: ['#ffffff', '#333333'],
                hAxis: {
                    textPosition: 'out',
                    slantedText: 0,
                    textStyle: {
                        color: '#000000'
                    },
                    maxAlternation: 1,
                    viewWindowMode: 'maximized'
                },
                vAxis: {
                    format: '0 k',
                    textPosition: 'in',
                    gridlines: {
                        color: '#e5e3de',
                        count: 7
                    },
                    textStyle: {
                        color: '#000000'
                    },
                    logScale: !0,
                    baselineColor: '#000000',
                    viewWindowMode: 'maximized'
                },
                tooltip: {
                    textStyle: {
                        color: '#000000'
                    }
                }
            };
            tablebasechart.draw(google.visualization.arrayToDataTable(tablebasechartdata), tablebasechartoptions);
            google.visualization.events.addListener(tablebasechart, "select", tablebaseChartClickHandler)
        } else {
            tablebasechart.clearChart()
        }
        if (PlyNumber == 0) {
            nomoves.innerHTML = "no game loaded";
            nomoves.style.width = "100%";
            nomoves.style.textAlign = "center"
        }
    }

    function tablebaseChartClickHandler() {
        var selection = tablebasechart.getSelection();
        if (typeof(selection[0]) != "undefined") {
            if (selection[0].row !== null && selection[0].column !== null) {
                if (!isNaN(thisPly = parseInt(selection[0].row * 2 + (selection[0].column == 1 ? 1 : 2), 10))) {
                    GoToMove(thisPly + plyOffset)
                }
            }
        }
    }
    if (annota = document.getElementById("GameAnnotator")) {
        if (gameResult[currentGame] == "") {
            annota.innerHTML = "Please select an annotated game"
        } else {
            annota.innerHTML = "Current game annotated by " + customPgnHeaderTag("Annotator", "GameAnnotator")
        }
    }
    if ((gameResult[currentGame] !== undefined) && (gameResult[currentGame] == "*") && (gameDate[currentGame] !== undefined) && (gameDate[currentGame] !== "")) {
        whitesrc = (StartPly + PlyNumber) % 2 === 0 ? 'img/thinking5.gif' : 'img/thinking5w.gif';
        whitealt = (StartPly + PlyNumber) % 2 === 0 ? "Thinking" : "Waiting";
        blacksrc = (StartPly + PlyNumber) % 2 === 1 ? 'img/thinking6.gif' : 'img/thinking6w.gif';
        blackalt = (StartPly + PlyNumber) % 2 === 1 ? "Thinking" : "Waiting";
        (StartPly + PlyNumber) % 2 === 1 ? changeFavicon('faviconb.ico') : changeFavicon('favicon.ico')
    } else {
        whitesrc = "img/thinking5w.gif";
        whitealt = "Stopped Thinking";
        blacksrc = "img/thinking6w.gif";
        blackalt = "Stopped Thinking"
    }
    if (theObject = document.getElementById("WhiteToMove")) {
        theObject.src = whitesrc;
        theObject.alt = whitealt
    }
    if (theObject = document.getElementById("BlackToMove")) {
        theObject.src = blacksrc;
        theObject.alt = blackalt
    }
    if (theObjecty = document.getElementById("WhiteToMove2")) {
        theObjecty.src = whitesrc;
        theObjecty.alt = whitealt
    }
    if (theObjecty = document.getElementById("BlackToMove2")) {
        theObjecty.src = blacksrc;
        theObjecty.alt = blackalt
    }
    var engineSite = {
        Alfil: "https://chessprogramming.wikispaces.com/Alfil",
        Andscacs: "https://chessprogramming.wikispaces.com/Andscacs",
        Arasan: "https://chessprogramming.wikispaces.com/Arasan",
        Arminius: "https://chessprogramming.wikispaces.com/Arminius",
        Bobcat: "https://chessprogramming.wikispaces.com/Bobcat",
        Booot: "https://chessprogramming.wikispaces.com/Booot",
        Bouquet: "https://chessprogramming.wikispaces.com/Bouquet",
        Bugchess2: "https://chessprogramming.wikispaces.com/BugChess+FR",
        Cheng4: "https://chessprogramming.wikispaces.com/Cheng",
        ChessBrainVB: "https://chessprogramming.wikispaces.com/ChessBrainVB",
        Chiron: "https://chessprogramming.wikispaces.com/Chiron",
        Chronos: "https://chessprogramming.wikispaces.com",
        Crafty: "https://chessprogramming.wikispaces.com/Crafty",
        Critter: "https://chessprogramming.wikispaces.com/Critter",
        Cuckoo: "https://chessprogramming.wikispaces.com/Cuckoochess",
        Danasah: "https://chessprogramming.wikispaces.com/Danasah",
        Daydreamer: "https://chessprogramming.wikispaces.com/Daydreamer",
        Defenchess: "https://bitbucket.org/nitro_can/defenchess/overview",
        Delphil: "https://chessprogramming.wikispaces.com/Delphil",
        Deuterium: "https://chessprogramming.wikispaces.com/Deuterium",
        Dirty: "https://chessprogramming.wikispaces.com/Dirty",
        DisasterArea: "https://chessprogramming.wikispaces.com/DisasterArea",
        Ethereal: "https://chessprogramming.wikispaces.com/ethereal",
        Equinox: "https://chessprogramming.wikispaces.com/Equinox",
        Exchess: "https://chessprogramming.wikispaces.com/Exchess",
        Fire: "https://chessprogramming.wikispaces.com/Fire",
        Firefly: "https://chessprogramming.wikispaces.com/Firefly",
        Fizbo: "https://chessprogramming.wikispaces.com/Fizbo",
        Francesca: "https://chessprogramming.wikispaces.com/Francesca",
        Fridolin: "https://chessprogramming.wikispaces.com/Fridolin",
        Fritz: "https://chessprogramming.wikispaces.com/Fritz",
        Fruit: "https://chessprogramming.wikispaces.com/Fruit+Reloaded",
        Gaviota: "https://chessprogramming.wikispaces.com/Gaviota",
        Ginkgo: "https://chessprogramming.wikispaces.com/Ginkgo",
        Glass: "https://chessprogramming.wikispaces.com/Glass",
        Gnu: "https://chessprogramming.wikispaces.com/GNU+Chess",
        Greko: "https://chessprogramming.wikispaces.com/Greko",
        Gull: "https://chessprogramming.wikispaces.com/Gullchess",
        Hakkapeliitta: "https://chessprogramming.wikispaces.com/Hakkapeliitta",
        Hamsters: "https://chessprogramming.wikispaces.com/Hamsters",
        Hannibal: "https://chessprogramming.wikispaces.com/Hannibal",
        Hiarcs: "https://chessprogramming.wikispaces.com/Hiarcs",
        Houdini: "https://chessprogramming.wikispaces.com/Houdini",
        Ivanhoe: "https://chessprogramming.wikispaces.com/Ivanhoe",
        Jazz: "https://chessprogramming.wikispaces.com/Jazz",
        Jellyfish: "https://chessprogramming.wikispaces.com/Jellyfish",
        Jonny: "https://chessprogramming.wikispaces.com/Jonny",
        Junior: "https://chessprogramming.wikispaces.com/Junior",
        Komodo: "https://chessprogramming.wikispaces.com/Komodo",
        Laser: "https://chessprogramming.wikispaces.com/Laser",
        Minkochess: "https://chessprogramming.wikispaces.com/MinkoChess",
        Myrddin: "https://chessprogramming.wikispaces.com/Myrddin",
        Naraku: "https://chessprogramming.wikispaces.com",
        Naum: "https://chessprogramming.wikispaces.com/Naum",
        Nebula: "https://chessprogramming.wikispaces.com/Nebula",
        Nemo: "https://chessprogramming.wikispaces.com/Nemo",
        Nemorino: "https://chessprogramming.wikispaces.com/Nemorino",
        Nightmare: "https://chessprogramming.wikispaces.com/Nightmare+NL",
        Nirvana: "https://chessprogramming.wikispaces.com/Nirvanachess",
        Octochess: "https://chessprogramming.wikispaces.com/Octochess",
        Onno: "https://chessprogramming.wikispaces.com/Onno",
        Pawny: "https://chessprogramming.wikispaces.com/Pawny",
        Pedone: "https://chessprogramming.wikispaces.com/Pedone",
        Philou: "https://chessprogramming.wikispaces.com",
        Prodeo: "https://chessprogramming.wikispaces.com/Pro+deo",
        Protector: "https://chessprogramming.wikispaces.com/Protector",
        Quazar: "https://chessprogramming.wikispaces.com/Quazar",
        Raptor: "https://chessprogramming.wikispaces.com/Raptor+LU",
        Redqueen: "https://chessprogramming.wikispaces.com/Redqueen",
        Rodent: "https://chessprogramming.wikispaces.com/Rodent",
        Rotor: "https://chessprogramming.wikispaces.com",
        Rybka: "https://chessprogramming.wikispaces.com/Rybka",
        Scorpio: "https://chessprogramming.wikispaces.com/Scorpio",
        Senpai: "https://chessprogramming.wikispaces.com/Senpai",
        Shredder: "https://chessprogramming.wikispaces.com/Shredder",
        Sjeng: "https://chessprogramming.wikispaces.com/Deep+Sjeng",
        Spark: "https://chessprogramming.wikispaces.com/Spark",
        Spike: "https://chessprogramming.wikispaces.com/Spike",
        Stockfish: "https://chessprogramming.wikispaces.com/Stockfish",
        Texel: "https://chessprogramming.wikispaces.com/Texel",
        The: "https://chessprogramming.wikispaces.com/The+Baron",
        Toga: "https://chessprogramming.wikispaces.com/Toga",
        Tornado: "https://chessprogramming.wikispaces.com/Tornado",
        Umko: "https://chessprogramming.wikispaces.com/MinkoChess",
        Vajolet2: "https://chessprogramming.wikispaces.com/Vajolet",
        Vitruvius: "https://chessprogramming.wikispaces.com/Vitruvius",
        Wasp: "https://chessprogramming.wikispaces.com/Wasp",
        Zappa: "https://chessprogramming.wikispaces.com/Zappa",
    }

    if (blkImg = document.getElementById("blEngineImg")) {
        var r = gameBlack[currentGame];
        r = r.substring(0, r.indexOf(' '));
        blkImg.innerHTML = '<img height="35" width="70" src="' + 'images/engines/' + r + '.jpg' + '" />';
    }

    if (whImg = document.getElementById("whEngineImg")) {
        var r = gameWhite[currentGame];
        r = r.substring(0, r.indexOf(' '));
        whImg.innerHTML = '<img height="35" width="70" src="' + 'images/engines/' + r + '.jpg' + '" />';
    }

    if ((whiteImg = document.getElementById("whiteImage")) && (gameWhite[currentGame] != "")) {
        whiteTbBox = document.getElementById("whiteTBhits");
        whiteSpeed = document.getElementById("whiteSpeed");
        wSite = document.getElementById("whiteSite");
        var r = gameWhite[currentGame];
        r = r.substring(0, r.indexOf(' '));
        Site = engineSite[r];
        whiteImg.src = 'img/engines/' + r + '.jpg';
        whiteImg.alt = r;
        wSite.href = Site;
        wSite.target = "_blank";
        Bases = whitePar.getAttribute("data-tooltip").match(/Path/);
        Xboard = whitePar.getAttribute("data-tooltip").match(/xboard/);
        if (currentPage == "live.html") {
            if (Xboard === null) {
                whiteTbBox.style.display = 'block';
                whiteSpeed.style.display = 'block'
            } else if (Xboard !== null) {
                whiteTbBox.style.display = 'block';
                whiteSpeed.style.display = 'block'
            }
            if (Bases === null) {
                whiteTbBox.style.display = 'block'
            } else if (Bases !== null) {
                whiteTbBox.style.display = 'block'
            }
        } else {
            if (pgnUrl.match(/TCEC_Season_6/) !== null || pgnUrl.match(/TCEC_Season_7/) !== null || pgnUrl.match(/TCEC_Season_8/) !== null || pgnUrl.match(/TCEC_Season_9/) || pgnUrl.match(/TCEC_Season_10/) || pgnUrl.match(/TCEC_Season_11/) !== null) {
                if (Xboard === null) {
                    whiteTbBox.style.display = 'block';
                    whiteSpeed.style.display = 'block'
                } else if (Xboard !== null) {
                    whiteTbBox.style.display = 'block';
                    whiteSpeed.style.display = 'block'
                }
                if (Bases === null) {
                    whiteTbBox.style.display = 'block'
                } else if (Bases !== null) {
                    whiteTbBox.style.display = 'block'
                }
            } else {
                whiteTbBox.style.display = 'block';
                whiteSpeed.style.display = 'block'
            }
        }
    }

    if ((blackImg = document.getElementById("blackImage")) && (gameBlack[currentGame] != "")) {
        blackTbBox = document.getElementById("blackTBhits");
        blackSpeed = document.getElementById("blackSpeed");
        bSite = document.getElementById("blackSite");
        var t = gameBlack[currentGame];
        t = t.substring(0, t.indexOf(' '));
        Site = engineSite[t];
        blackImg.src = 'img/engines/' + t + '.jpg';
        blackImg.alt = t;
        bSite.href = Site;
        bSite.target = "_blank";
        Bases = blackPar.getAttribute("data-tooltip").match(/Path/);
        Xboard = blackPar.getAttribute("data-tooltip").match(/xboard/);
        if (currentPage == "live.html") {
            if (Xboard === null) {
                blackTbBox.style.display = 'block';
                blackSpeed.style.display = 'block'
            } else if (Xboard !== null) {
                blackTbBox.style.display = 'block';
                blackSpeed.style.display = 'block'
            }
            if (Bases === null) {
                blackTbBox.style.display = 'block'
            } else if (Bases !== null) {
                blackTbBox.style.display = 'block'
            }
        } else {
            if (pgnUrl.match(/TCEC_Season_6/) !== null || pgnUrl.match(/TCEC_Season_7/) !== null || pgnUrl.match(/TCEC_Season_8/) !== null || pgnUrl.match(/TCEC_Season_9/) || pgnUrl.match(/TCEC_Season_10/) || pgnUrl.match(/TCEC_Season_11/) !== null) {
                if (Xboard === null) {
                    blackTbBox.style.display = 'block';
                    blackSpeed.style.display = 'block'
                } else if (Xboard !== null) {
                    blackTbBox.style.display = 'block';
                    blackSpeed.style.display = 'block'
                }
                if (Bases === null) {
                    blackTbBox.style.display = 'block'
                } else if (Bases !== null) {
                    blackTbBox.style.display = 'block'
                }
            } else {
                blackTbBox.style.display = 'block';
                blackSpeed.style.display = 'block'
            }
        }
    }

    if ((currentPage != "archive.php") && (gameWhite[currentGame] != "")) {
        var whiteEngineName = gameWhite[currentGame];
        var blackEngineName = gameBlack[currentGame];
        whiteEngineName = getKomodoName(whiteEngineName);
        blackEngineName = getKomodoName(blackEngineName);
        document.title = whiteEngineName + ' vs ' + blackEngineName + ' * TCEC * Live Computer Chess Broadcast';
        livegame = document.getElementById("ylcet_gui_live_game");

    }

    /* ylcet hack */
    ylcetSettime();
    customPgnHeaderTag("ECO", "GameECO");
    if (theObj = document.getElementById("GameECO")) {
        if (theObj.innerHTML == "") {
            theObj.innerHTML = "*"
        }
        if (PlyNumber == 0) {
            theObj.innerHTML = ""
        }
    }
    theObj = document.getElementById("GameOpening");
    if (theObj) {
        variation = customPgnHeaderTag("Variation", "GameVariation");
        opening = customPgnHeaderTag("Opening", "GameOpening");
        if (theObj.innerHTML == "") {
            theObj.innerHTML = "?"
        } else if (variation == "") {
            theObj.innerHTML = opening
        } else {
            theObj.innerHTML = opening + ", " + variation
        }
        if (PlyNumber == 0) {
            theObj.innerHTML = ""
        }
    }
    WhiteEloFull = customPgnHeaderTag("WhiteElo", "GameWhiteElo");
    if (theObj = document.getElementById("GameWhiteElo")) {
        if (theObj.innerHTML == "") {
            theObj.innerHTML = ""
        } else {
            theObj.innerHTML = '&nbsp;' + WhiteEloFull;
        }
        if (PlyNumber == 0) {
            theObj.innerHTML = ""
        }
    }
    BlackEloFull = customPgnHeaderTag("BlackElo", "GameBlackElo");
    if (theObj = document.getElementById("GameBlackElo")) {
        if (theObj.innerHTML == "") {
            theObj.innerHTML = ""
        } else {
            theObj.innerHTML = '&nbsp;' + BlackEloFull;
        }
        if (PlyNumber == 0) {
            theObj.innerHTML = ""
        }
    }
    theObx = customPgnHeaderTag("Termination", "GameTermination");
    theOby = customPgnHeaderTag("TerminationDetails", "GameTermination");
    theObz = document.getElementById("GameTermination");
    if (0 && (theObx != "") && (theOby == "")) {
        if (theObx == "unterminated") {
            theObz.innerHTML = "*"
        } else if (PlyNumber == 0) {
            theObz.innerHTML = ""
        } else {
            theObz.innerHTML = theObx
        }
    } else if (theOby != "") {
        if (theObz)
            theObz.innerHTML = theOby
    }

    /* ylcet */
    a = customPgnHeaderTag("TimeControl", "GameTimeControl");
    re = /\d+(?=(:|\+))/g;
    ts = a.match(re);
    tm = [];
    i = 0;
    if (ts) {
        for (i = 0; i < ts.length; i = i + 1) {
            tm[i] = Math.round(ts[i] / 60) + "' "
        }
        for (i = 0; i < tm.length; i = i + 1) {
            a = a.replace(ts[i], tm[i])
        }
        a = a.replace(/(:|\+)/g, " $1 ");
        a = a.replace(/(\+\s*\d+)/g, "$1\"");
        if ((theObject = document.getElementById("GameTimeControl")) && (theObject.innerHTML !== null)) {
            theObject.innerHTML = a
        }
    }
    var server_status = LiveBroadcastLastModified.getTime();
    whenStarted = new Date().getTime();
    if (currentPage == "live.html") {
        theObject = document.getElementById("gameFeed");
        if (theObject) {
            if (gameResult[currentGame] == "*") {
                if (whenStarted > (server_status + 300000)) {
                    theObject.innerHTML = "Offline";
                    theObject.style.color = "#9d0d00"
                } else {
                    theObject.innerHTML = "Online";
                    theObject.style.color = "#007d0a"
                }
            } else {
                theObject.innerHTML = "No live game in progress"
            }
        }
    }
    if (localStorage.getItem('TCEC_GraE') == 'On') {
        //setSelectionEvalChart();
    }
    if (localStorage.getItem('TCEC_GraT') == 'On') {
        //setSelectionTimeChart()
    }
    if (localStorage.getItem('TCEC_GraD') == 'On') {
        //setSelectionDepthChart()
    }
    if (localStorage.getItem('TCEC_GraS') == 'On') {
        //setSelectionSpeedChart()
    }
    if (localStorage.getItem('TCEC_GraTB') == 'On') {
        //setSelectionTablebaseChart()
    }
    ////console.log ("Setting here1");
    var theObject = document.getElementById('adj_rule');
    if (theObject) 
    {
      theObject.innerHTML = "*";
      theMatch = TCECWinRule();
      if (!isNaN(theMatch))
      {
         var retStr = assignWin(theMatch);
         ////console.log ("win worked" + theMatch);
         theObject.innerHTML = retStr;
      }
      else
      {
         ////console.log ("win not worked" + retStr);
         theMatch = TCECDrawRule();
         retStr = assignDraw(theMatch, MoveComments[CurrentPly]);
         theObject.innerHTML = retStr;
      }
   }
    if (currentPage == "archive.php") {
        MarkCurrentGame()
    }
}

function getSpeed(inSpeed)
{
    var thisSpeedK = parseInt(inSpeed/1000/1000);
    var thisSpeed;

    if (thisSpeedK > 1) 
    { 
        thisSpeedK = parseInt(thisSpeedK/1000/1000);
        if (thisSpeedK > 1) 
        { 
            thisSpeed = thisSpeedK + ' Gn/s';
        }
        else
        {
            thisSpeed = parseInt(inSpeed/1000/1000) + ' Mn/s';
        }
    }
    else
    {
        thisSpeed = parseInt(inSpeed/1000) + ' Kn/s'
    }
    return thisSpeed;
}

function getNodes(innode)
{
    var thisSpeedK = parseInt(innode/1000/1000);
    var thisSpeed;

    if (thisSpeedK > 1) 
    { 
        thisSpeedK = parseInt(thisSpeedK/1000/1000);
        if (thisSpeedK > 1) 
        { 
            thisSpeed = thisSpeedK + ' g';
        }
        else
        {
            thisSpeed = parseInt(innode/1000/1000) + ' M';
        }
    }
    else
    {
        thisSpeed = parseInt(innode/1000) + ' k'
    }
    return thisSpeed;
}

function assignWin(theMatch)
{
   var winStr = " for White]";
   var retStr = null;

   if (theMatch == 0)
   {
      if ((gameResult[currentGame] == "1-0"))
      { 
         winStr = "  Plies [White Won]";
      }
      else
      { 
         winStr = "  Plies [Black Won]";
      }
      retStr = theMatch + winStr;
   }
   else if (theMatch < 0)
   {
      winStr = " for black]"
      retStr = -1 * theMatch + " Plies [Win " + winStr;
   } 
   else if (theMatch > 0)
   {
      retStr = theMatch + " Plies [Win " + winStr;
   } 
   return retStr;
}

function assignDraw(theMatch, r50)
{
   var finalScore = 0;
   var retStr = "*";
   var theMatch1 = r50.match(/R50=(.*?),/);
   
   if (theMatch1 && (theMatch1[1] < 50))
   {
      finalScore = parseInt(theMatch1[1]) * 2;
      retStr = parseInt(theMatch1[1]) + "  Moves [50 move rule]";
   }
   if (!isNaN(theMatch))
   {
      if (theMatch < finalScore)
      {
         retStr = theMatch + "  Plies [Draw]";
      }
   }
   return retStr;
}

function customFunctionOnMove() {
    function num2mega(num) {
        if (num >= Math.pow(10, 6)) {
            num = Math.round(num / Math.pow(10, 5)) / 10;
            num = parseInt(num, 0);                    
            unit = " M"
        } else {
            unit = ""
        }
        if ((unit !== "") && (num === Math.floor(num))) {
            //num += ".0"
        }
        return num + unit
    }

    function num2kilo(num) {
        if (num >= Math.pow(10, 3)) {
            num = Math.round(num / Math.pow(10, 2)) / 10;
            num = parseInt(num, 0);                    
            unit = " k"
        } else {
            unit = ""
        }
        if ((unit !== "") && (num === Math.floor(num))) {
            //num += ".0"
        }
        return num + unit
    }
    ////console.log ("Setting here2");
    var theObject = document.getElementById('adj_rule');
    if (theObject) 
    {
      theObject.innerHTML = "*";
      theMatch = TCECWinRule();
      var retStr = "";
      if (!isNaN(theMatch))
      {
         var retStr = assignWin(theMatch);
         ////console.log ("win worked" + theMatch);
         theObject.innerHTML = retStr;
      }
      else
      {
         ////console.log ("win not worked" + theMatch);
         theMatch = TCECDrawRule();
         retStr = assignDraw(theMatch, MoveComments[CurrentPly]);
         theObject.innerHTML = retStr;
      }
   }
   var theObj = document.getElementById("whoswinningw");
    if (theObj) {
        setEvalColors(theObj);
    }
    var theObject = document.getElementById('CurrentFEN');
    var theMatch = CurrentFEN();
    if (theObject) {
        if (theMatch) {
            theObject.innerHTML = theMatch;
            if (theMatch.length <= 60) {
                theObject.style.fontSize = "12px"
            } else {
                theObject.style.fontSize = "12px"
            }
        } else {
            theObject.innerHTML = "no info"
        }
    }
    if ((CurrentPly % 2) == 0) {
        currentTimeObject = document.getElementById('blackMoveTime');
        previousTimeObject = document.getElementById('whiteMoveTime')
    } else {
        currentTimeObject = document.getElementById('whiteMoveTime');
        previousTimeObject = document.getElementById('blackMoveTime')
    }
    if (currentTimeObject) {
        thisTime = "no info";
        if (MoveComments[CurrentPly]) {
            theMatch = MoveComments[CurrentPly].match(/mt=(.*?),/);
            theMatch2 = MoveComments[CurrentPly];
            if (theMatch) {
                thisTime = theMatch[1]
            } else if (theMatch2 == "book") {
                thisTime = "book"
            }
        }
        currentTimeObject.innerHTML = secFormatNoH(thisTime/1000);
        if (PlyNumber == 0) {
            currentTimeObject.innerHTML = ""
        }
    }
    if (previousTimeObject) {
        thisTime = "no info";
        if (MoveComments[CurrentPly - 1]) {
            theMatch = MoveComments[CurrentPly - 1].match(/mt=(.*?),/);
            theMatch2 = MoveComments[CurrentPly - 1];
            if (theMatch) {
                thisTime = theMatch[1]
            } else if (theMatch2 == "book") {
                thisTime = "book"
            }
        }
        previousTimeObject.innerHTML = secFormatNoH(thisTime/1000);
        if (PlyNumber == 0) {
            previousTimeObject.innerHTML = ""
        }
    }
    if ((CurrentPly % 2) == 0) {
        currentEvalObject = document.getElementById('blackEval');
        previousEvalObject = document.getElementById('whiteEval')
    } else {
        currentEvalObject = document.getElementById('whiteEval');
        previousEvalObject = document.getElementById('blackEval')
    }
    if (currentEvalObject) {
        thisEval = "no info";
        if (MoveComments[CurrentPly]) {
            theMatch1 = MoveComments[CurrentPly].match(/ev=(.*?),/);
            theMatch2 = MoveComments[CurrentPly].match(/wv=(.*?)([, }])/);
            theMatch3 = MoveComments[CurrentPly];
            if (((theMatch1) && (theMatch2)) || ((!theMatch1) && (theMatch2))) {
                thisEval = theMatch2[1]
            } else if ((theMatch1) && (!theMatch2)) {
                thisEval = theMatch1[1]
            } else if (theMatch3 == "book") {
                thisEval = "book"
            }
        }
        currentEvalObject.innerHTML = thisEval;
        if (PlyNumber == 0) {
            currentEvalObject.innerHTML = ""
        }
    }
    if (previousEvalObject) {
        thisEval = "no info";
        if (MoveComments[CurrentPly - 1]) {
            theMatch1 = MoveComments[CurrentPly - 1].match(/ev=(.*?),/);
            theMatch2 = MoveComments[CurrentPly - 1].match(/wv=(.*?)([, }])/);
            theMatch3 = MoveComments[CurrentPly - 1];
            if (((theMatch1) && (theMatch2)) || ((!theMatch1) && (theMatch2))) {
                thisEval = theMatch2[1]
            } else if ((theMatch1) && (!theMatch2)) {
                thisEval = theMatch1[1]
            } else if (theMatch3 == "book") {
                thisEval = "book"
            }
        }
        previousEvalObject.innerHTML = thisEval;
        if (PlyNumber == 0) {
            previousEvalObject.innerHTML = ""
        }
    }
    if ((CurrentPly % 2) == 0) {
        currentClock = document.getElementById('blackClock');
        previousClock = document.getElementById('whiteClock');
        if (CurrentPly != PlyNumber) {
            if ((currentClock) && (previousClock)) {
                if (currentPage != "archive.php") {
                }
            }
        } else {
            if ((currentClock) && (previousClock)) {
                if (currentPage != "archive.php") {
                } else {
                }
            }
        }
    } else {
        currentClock = document.getElementById('whiteClock');
        previousClock = document.getElementById('blackClock');
        if (CurrentPly != PlyNumber) {
            if ((currentClock) && (previousClock)) {
                if (currentPage != "archive.php") {
                }
            }
        } else {
            if ((currentClock) && (previousClock)) {
                if (currentPage != "archive.php") {
                } else {
                }
            }
        }
    }
    if (currentClock) {
        thisClock = "no info";
        if (MoveComments[CurrentPly]) {
            theMatch = MoveComments[CurrentPly].match(/tl=(.*?),/);
            if (theMatch) 
            {
                thisClock = theMatch[1];
            }
            if (PlyNumber == 0) {
                thisClock = ""
            }
        }
        if (PlyNumber == 0) {
            thisClock = ""
        }
        currentClock.innerHTML = secFormat(thisClock/1000);
    }
    if (previousClock) {
        thisClock = "no info";
        if (MoveComments[CurrentPly - 1]) {
            theMatch = MoveComments[CurrentPly - 1].match(/tl=(.*?),/);
            if (theMatch) {
                thisClock = theMatch[1];
            }
        }
        if (PlyNumber == 0) {
            thisClock = ""
        }
        previousClock.innerHTML = secFormat(thisClock/1000);
    }
    if ((CurrentPly % 2) == 0) {
        currentSpeedObject = document.getElementById('blackSpeed');
        previousSpeedObject = document.getElementById('whiteSpeed')
    } else {
        currentSpeedObject = document.getElementById('whiteSpeed');
        previousSpeedObject = document.getElementById('blackSpeed')
    }
    if (currentSpeedObject) {
        thisSpeed = "no info";
        if (MoveComments[CurrentPly]) {
            if (!(MoveComments[CurrentPly].match(/UCI/) || MoveComments[CurrentPly].match(/xboard/))) {
                theMatch = MoveComments[CurrentPly].match(/ s=(.*?),/);
                theMatch2 = MoveComments[CurrentPly];
                if (theMatch) {
                    thisSpeed = getSpeed(theMatch[1]);
                    //alert(thisSpeed);
                } else if (theMatch2 == "book") {
                    thisSpeed = "book"
                }
            }
        }
        currentSpeedObject.innerHTML = thisSpeed;
        if (PlyNumber == 0) {
            currentSpeedObject.innerHTML = ""
        }
    }
    if (previousSpeedObject) {
        thisSpeed = "no info";
        if (MoveComments[CurrentPly - 1]) {
            if (!(MoveComments[CurrentPly - 1].match(/UCI/) || MoveComments[CurrentPly - 1].match(/xboard/))) {
                theMatch = MoveComments[CurrentPly - 1].match(/ s=(.*?),/);
                theMatch2 = MoveComments[CurrentPly - 1];
                if (theMatch) {
                    thisSpeed = getSpeed(theMatch[1]);
                } else if (theMatch2 == "book") {
                    thisSpeed = "book"
                }
            }
        }
        previousSpeedObject.innerHTML = thisSpeed;
        if (PlyNumber == 0) {
            previousSpeedObject.innerHTML = ""
        }
    }
    if ((CurrentPly % 2) == 0) {
        currentDepthObject = document.getElementById('blackDepth');
        previousDepthObject = document.getElementById('whiteDepth');
    } else {
        currentDepthObject = document.getElementById('whiteDepth');
        previousDepthObject = document.getElementById('blackDepth')
    }
    if (currentDepthObject) {
        thisDepth = "no info";
        if (MoveComments[CurrentPly]) {
            theMatch = MoveComments[CurrentPly].match(/d=(.*?),/);
            var theMatch3 = MoveComments[CurrentPly].match(/sd=(.*?),/);
            theMatch2 = MoveComments[CurrentPly];
            if (theMatch) 
            {
               thisDepth = theMatch[1];
               if (theMatch3 && theMatch3[1])
               {
                  thisDepth = thisDepth + "/" + theMatch3[1];
               }
            } 
            else if (theMatch2 == "book") 
            {
                thisDepth = "book"
            }
        }
        currentDepthObject.innerHTML = thisDepth;
        if (PlyNumber == 0) {
            currentDepthObject.innerHTML = ""
        }
    }
    if (previousDepthObject) {
        thisDepth = "no info";
        if (MoveComments[CurrentPly - 1]) {
            theMatch = MoveComments[CurrentPly - 1].match(/d=(.*?),/);
            var theMatch3 = MoveComments[CurrentPly - 1].match(/sd=(.*?),/);
            theMatch2 = MoveComments[CurrentPly - 1];
            if (theMatch) 
            {
               thisDepth = theMatch[1];
               if (theMatch3 && theMatch3[1])
               {
                  thisDepth = thisDepth + "/" + theMatch3[1];
               }
            } 
            else if (theMatch2 == "book") 
            {
                thisDepth = "book"
            }
        }
        previousDepthObject.innerHTML = thisDepth;
        if (PlyNumber == 0) {
            previousDepthObject.innerHTML = ""
        }
    }
    if ((CurrentPly % 2) == 0) {
        currentNodesObject = document.getElementById('blackNodes');
        previousNodesObject = document.getElementById('whiteNodes')
    } else {
        currentNodesObject = document.getElementById('whiteNodes');
        previousNodesObject = document.getElementById('blackNodes')
    }
    if (currentNodesObject) {
        thisNodes = "no info";
        if (MoveComments[CurrentPly]) {
            if (!(MoveComments[CurrentPly].match(/UCI/) || MoveComments[CurrentPly].match(/xboard/))) {
                theMatch = MoveComments[CurrentPly].match(/n=(.*?),/);
                theMatch2 = MoveComments[CurrentPly];
                if (theMatch) {
                    thisNodes = getNodes(theMatch[1]);
                } else if (theMatch2 == "book") {
                    thisNodes = "book"
                }
            }
        }
        currentNodesObject.innerHTML = num2mega(thisNodes);
        if (PlyNumber == 0) {
            currentNodesObject.innerHTML = ""
        }
    }
    if (previousNodesObject) {
        thisNodes = "no info";
        if (MoveComments[CurrentPly - 1]) {
            if (!(MoveComments[CurrentPly - 1].match(/UCI/) || MoveComments[CurrentPly - 1].match(/xboard/))) {
                theMatch = MoveComments[CurrentPly - 1].match(/n=(.*?),/);
                theMatch2 = MoveComments[CurrentPly - 1];
                if (theMatch) {
                    thisNodes = getNodes(theMatch[1]);
                } else if (theMatch2 == "book") {
                    thisNodes = "book"
                }
            }
        }
        previousNodesObject.innerHTML = num2mega(thisNodes);
        if (PlyNumber == 0) {
            previousNodesObject.innerHTML = ""
        }
    }
    if ((CurrentPly % 2) == 0) {
        currenttbHitsObject = document.getElementById('blackTBhits');
        previoustbHitsObject = document.getElementById('whiteTBhits')
    } else {
        currenttbHitsObject = document.getElementById('whiteTBhits');
        previoustbHitsObject = document.getElementById('blackTBhits')
    }
    if (currenttbHitsObject) {
        thistbHits = "no info";
        if (MoveComments[CurrentPly]) {
            theMatch = MoveComments[CurrentPly].match(/tb=(.*?),/);
            theMatch2 = MoveComments[CurrentPly];
            if (theMatch) {
                thistbHits = theMatch[1]
            } else if (theMatch2 == "book") {
                thistbHits = "book"
            }
        }
        if (isNaN(thistbHits))
        { 
            currenttbHitsObject.innerHTML = "NA";
        } 
        else 
        { 
            currenttbHitsObject.innerHTML = num2kilo(thistbHits);
        } 
        if (PlyNumber == 0) {
            currenttbHitsObject.innerHTML = ""
        }
    }
    if (previoustbHitsObject) {
        thistbHits = "no info";
        if (MoveComments[CurrentPly - 1]) {
            theMatch = MoveComments[CurrentPly - 1].match(/tb=(.*?),/);
            theMatch2 = MoveComments[CurrentPly - 1];
            if (theMatch) {
                thistbHits = theMatch[1]
            } else if (theMatch2 == "book") {
                thistbHits = "book"
            }
        }
        if (isNaN(thistbHits))
        { 
            previoustbHitsObject.innerHTML = "NA";
        } 
        else 
        { 
            previoustbHitsObject.innerHTML = num2kilo(thistbHits);
        } 
        if (PlyNumber == 0) {
            previoustbHitsObject.innerHTML = ""
        }
    }
    if (PVCount === undefined) {
        PVCount = PlyNumber
    }
    if (PlyNumber >= PVCount) {
        if (window.whitePv) {
            if ((!fenPositions[CurrentPly]) || (fenPositions[CurrentPly] !== CurrentFEN())) {
                scanGameForFen();
                PVCount = PlyNumber + 1
            }
        }
    }
    lastWhitePly = CurrentPly % 2 ? CurrentPly : CurrentPly - 1;
    if (lastWhitePly < StartPly) {
        lastWhitePly = StartPly
    }
    lastBlackPly = CurrentPly % 2 ? CurrentPly - 1 : CurrentPly;
    if (lastBlackPly < StartPly) {
        lastBlackPly = StartPly
    }
    lastPlyForPv = Math.min(lastWhitePly, lastBlackPly);
    whitePvMoves = '';
    blackPvMoves = '';
    var movesRegExp = new RegExp("^(\\s*([KQRBNP]?[a-h1-8]?x?[a-h][1-8](=[QRNB])?|O-O-O|O-O)\\b[#+]?)*\\s*$", "g");
    if (lastPlyForPv > StartPly) {
        pvMatch = MoveComments[lastWhitePly] ? MoveComments[lastWhitePly].match(/pv=([^,]+)/) : "";
        if (pvMatch && pvMatch[1].match(movesRegExp)) {
            whitePvMoves = pvMatch[1]
        }
        pvMatch = MoveComments[lastBlackPly] ? MoveComments[lastBlackPly].match(/pv=([^,]+)/) : "";
        if (pvMatch && pvMatch[1].match(movesRegExp)) {
            blackPvMoves = pvMatch[1]
        }
    }
    if (whitePvMoves && blackPvMoves) {
        whitePvMovesArray = whitePvMoves.replace(/^\s+|\s+$/, '').replace(/\s+/, ' ').split(' ');
        blackPvMovesArray = blackPvMoves.replace(/^\s+|\s+$/, '').replace(/\s+/, ' ').split(' ');
        if (lastPlyForPv < lastWhitePly) {
            whitePvMovesArray.unshift(blackPvMovesArray[0])
        } else if (lastPlyForPv < lastBlackPly) {
            blackPvMovesArray.unshift(whitePvMovesArray[0])
        }
        idxMax = Math.min(whitePvMovesArray.length, blackPvMovesArray.length);
        idxEqual = -1;
        for (idxCurr = 0; idxCurr < idxMax; idxCurr++) {
            if (whitePvMovesArray[idxCurr] !== blackPvMovesArray[idxCurr]) {
                break
            }
            idxEqual = idxCurr
        }
        whitePvMoves = '';
        blackPvMoves = '';
        for (idxCurr = lastPlyForPv === lastWhitePly ? 0 : 1; idxCurr <= idxEqual; idxCurr++) {
            whitePvMoves += whitePvMovesArray[idxCurr] + ' '
        }
        for (idxCurr = lastPlyForPv === lastBlackPly ? 0 : 1; idxCurr <= idxEqual; idxCurr++) {
            blackPvMoves += blackPvMovesArray[idxCurr] + ' '
        }
        whitePvMoves += '{@} ';
        blackPvMoves += '{@} ';
        for (idxCurr = idxEqual + 1; idxCurr < whitePvMovesArray.length; idxCurr++) {
            whitePvMoves += whitePvMovesArray[idxCurr] + ' '
        }
        for (idxCurr = idxEqual + 1; idxCurr < blackPvMovesArray.length; idxCurr++) {
            blackPvMoves += blackPvMovesArray[idxCurr] + ' '
        }
    }

    if (window && window.whitePv && window.whitePv.updatePgn) {
        pvPgn = '[FEN "' + fenPositions[lastWhitePly - 1] + '"] ' + (whitePvMoves || ' { no info} ');
        window.whitePv.updatePgn(pvPgn)
        PvSel();
    }
    if (window && window.blackPv && window.blackPv.updatePgn) {
        pvPgn = '[FEN "' + fenPositions[lastBlackPly - 1] + '"] ' + (blackPvMoves || ' { no info} ');
        window.blackPv.updatePgn(pvPgn)
        PvSel();
    }
    if ((CurrentPly % 2) == 0) {
        currentMDObject = document.getElementById('materialBlack');
        previousMDObject = document.getElementById('materialWhite')
    } else {
        currentMDObject = document.getElementById('materialBlack');
        previousMDObject = document.getElementById('materialWhite')
    }
    if (previousMDObject) {
        fullImageString = ('');

        function repeat(str, num) {
            return (new Array(num + 1)).join(str)
        }
        if (MoveComments[CurrentPly]) {
            theMatch = CurrentFEN().match(/(.*?) /);
            if (theMatch) {
                whiteArray = theMatch[1];
                var whitePawnCount = 0;
                var whiteBishopCount = 0;
                var whiteKnightCount = 0;
                var whiteRookCount = 0;
                var whiteQueenCount = 0;
                var blackPawnCount = 0;
                var blackBishopCount = 0;
                var blackKnightCount = 0;
                var blackRookCount = 0;
                var blackQueenCount = 0;
                var whitePawnString = "";
                var whiteBishopString = "";
                var whiteKnightString = "";
                var whiteRookString = "";
                var whiteQueenString = "";
                var myArray = whiteArray.split('');
                for (i = 0; i < myArray.length; i++) {
                    if (myArray[i] == 'P') {
                        whitePawnCount++
                    }
                }
                for (i = 0; i < myArray.length; i++) {
                    if (myArray[i] == 'B') {
                        whiteBishopCount++
                    }
                }
                for (i = 0; i < myArray.length; i++) {
                    if (myArray[i] == 'N') {
                        whiteKnightCount++
                    }
                }
                for (i = 0; i < myArray.length; i++) {
                    if (myArray[i] == 'R') {
                        whiteRookCount++
                    }
                }
                for (i = 0; i < myArray.length; i++) {
                    if (myArray[i] == 'Q') {
                        whiteQueenCount++
                    }
                }
                for (i = 0; i < myArray.length; i++) {
                    if (myArray[i] == '-') {
                        whiteEqualCount++
                    }
                }
                for (i = 0; i < myArray.length; i++) {
                    if (myArray[i] == 'p') {
                        blackPawnCount++
                    }
                }
                for (i = 0; i < myArray.length; i++) {
                    if (myArray[i] == 'b') {
                        blackBishopCount++
                    }
                }
                for (i = 0; i < myArray.length; i++) {
                    if (myArray[i] == 'n') {
                        blackKnightCount++
                    }
                }
                for (i = 0; i < myArray.length; i++) {
                    if (myArray[i] == 'r') {
                        blackRookCount++
                    }
                }
                for (i = 0; i < myArray.length; i++) {
                    if (myArray[i] == 'q') {
                        blackQueenCount++
                    }
                }
                whitePawnCount = whitePawnCount - blackPawnCount;
                whiteBishopCount = whiteBishopCount - blackBishopCount;
                whiteKnightCount = whiteKnightCount - blackKnightCount;
                whiteRookCount = whiteRookCount - blackRookCount;
                whiteQueenCount = whiteQueenCount - blackQueenCount;
                fontType = localStorage.getItem("YLCET_font");
                folder = '/16';
                if (imageType == "svg") {
                    folder = ''
                }
                if (fontType == "ME") {
                    fontType = "merida"
                } else if (fontType == "AL") {
                    fontType = "alpha"
                } else if (fontType == "US") {
                    fontType = "uscf"
                } else if (fontType == "IS") {
                    fontType = "igorsvg"
                } else if (fontType == "CS") {
                    fontType = "colinsvg"
                } else if (fontType == "TS") {
                    fontType = "tilesvg"
                }
                if (whitePawnCount > 0) {
                    if (window.devicePixelRatio && window.devicePixelRatio > 1) {
                        whitePawnString = repeat('<img src=\"img/' + fontType + folder + '/rbp.' + imageType + '\" alt=\"White pawn\" width=\"16px\" height=\"16px\">', whitePawnCount)
                    } else {
                        whitePawnString = repeat('<img src=\"img/' + fontType + folder + '/bp.' + imageType + '\" alt=\"White pawn\" width=\"16px\" height=\"16px\">', whitePawnCount)
                    }
                }
                if (whiteBishopCount > 0) {
                    if (window.devicePixelRatio && window.devicePixelRatio > 1) {
                        whiteBishopString = repeat('<img src=\"img/' + fontType + folder + '/rbb.' + imageType + '\" alt=\"White bishop\" width=\"16px\" height=\"16px\">', whiteBishopCount)
                    } else {
                        whiteBishopString = repeat('<img src=\"img/' + fontType + folder + '/bb.' + imageType + '\" alt=\"White bishop\" width=\"16px\" height=\"16px\">', whiteBishopCount)
                    }
                }
                if (whiteKnightCount > 0) {
                    if (window.devicePixelRatio && window.devicePixelRatio > 1) {
                        whiteKnightString = repeat('<img src=\"img/' + fontType + folder + '/rbn.' + imageType + '\" alt=\"White knight\" width=\"16px\" height=\"16px\">', whiteKnightCount)
                    } else {
                        whiteKnightString = repeat('<img src=\"img/' + fontType + folder + '/bn.' + imageType + '\" alt=\"White knight\" width=\"16px\" height=\"16px\">', whiteKnightCount)
                    }
                }
                if (whiteRookCount > 0) {
                    if (window.devicePixelRatio && window.devicePixelRatio > 1) {
                        whiteRookString = repeat('<img src=\"img/' + fontType + folder + '/rbr.' + imageType + '\" alt=\"White rook\" width=\"16px\" height=\"16px\">', whiteRookCount)
                    } else {
                        whiteRookString = repeat('<img src=\"img/' + fontType + folder + '/br.' + imageType + '\" alt=\"White rook\" width=\"16px\" height=\"16px\">', whiteRookCount)
                    }
                }
                if (whiteQueenCount > 0) {
                    if (window.devicePixelRatio && window.devicePixelRatio > 1) {
                        whiteQueenString = repeat('<img src=\"img/' + fontType + folder + '/rbq.' + imageType + '\" alt=\"White queen\" width=\"16px\" height=\"16px\">', whiteQueenCount)
                    } else {
                        whiteQueenString = repeat('<img src=\"img/' + fontType + folder + '/bq.' + imageType + '\" alt=\"White queen\" width=\"16px\" height=\"16px\">', whiteQueenCount)
                    }
                }
                fullImageString = (whitePawnString + whiteBishopString + whiteKnightString + whiteRookString + whiteQueenString)
            }
        }
        previousMDObject.innerHTML = fullImageString
    }
    if (currentMDObject) {
        fullImageString = ('');

        function repeat(str, num) {
            return (new Array(num + 1)).join(str)
        }
        if (MoveComments[CurrentPly]) {
            theMatch = CurrentFEN().match(/(.*?) /);
            if (theMatch) {
                blackArray = theMatch[1];
                var blackPawnCount = 0;
                var blackBishopCount = 0;
                var blackKnightCount = 0;
                var blackRookCount = 0;
                var blackQueenCount = 0;
                var whitePawnCount = 0;
                var whiteBishopCount = 0;
                var whiteKnightCount = 0;
                var whiteRookCount = 0;
                var whiteQueenCount = 0;
                var blackPawnString = "";
                var blackBishopString = "";
                var blackKnightString = "";
                var blackRookString = "";
                var blackQueenString = "";
                var myArray = blackArray.split('');
                for (i = 0; i < myArray.length; i++) {
                    if (myArray[i] == 'p') {
                        blackPawnCount++
                    }
                }
                for (i = 0; i < myArray.length; i++) {
                    if (myArray[i] == 'b') {
                        blackBishopCount++
                    }
                }
                for (i = 0; i < myArray.length; i++) {
                    if (myArray[i] == 'n') {
                        blackKnightCount++
                    }
                }
                for (i = 0; i < myArray.length; i++) {
                    if (myArray[i] == 'r') {
                        blackRookCount++
                    }
                }
                for (i = 0; i < myArray.length; i++) {
                    if (myArray[i] == 'q') {
                        blackQueenCount++
                    }
                }
                for (i = 0; i < myArray.length; i++) {
                    if (myArray[i] == '-') {
                        blackEqualCount++
                    }
                }
                for (i = 0; i < myArray.length; i++) {
                    if (myArray[i] == 'P') {
                        whitePawnCount++
                    }
                }
                for (i = 0; i < myArray.length; i++) {
                    if (myArray[i] == 'B') {
                        whiteBishopCount++
                    }
                }
                for (i = 0; i < myArray.length; i++) {
                    if (myArray[i] == 'N') {
                        whiteKnightCount++
                    }
                }
                for (i = 0; i < myArray.length; i++) {
                    if (myArray[i] == 'R') {
                        whiteRookCount++
                    }
                }
                for (i = 0; i < myArray.length; i++) {
                    if (myArray[i] == 'Q') {
                        whiteQueenCount++
                    }
                }
                blackPawnCount = blackPawnCount - whitePawnCount;
                blackBishopCount = blackBishopCount - whiteBishopCount;
                blackKnightCount = blackKnightCount - whiteKnightCount;
                blackRookCount = blackRookCount - whiteRookCount;
                blackQueenCount = blackQueenCount - whiteQueenCount;
                fontType = localStorage.getItem("YLCET_font");
                folder = '/16';
                if (imageType == "svg") {
                    folder = ''
                }
                if (fontType == "ME") {
                    fontType = "merida"
                } else if (fontType == "AL") {
                    fontType = "alpha"
                } else if (fontType == "US") {
                    fontType = "uscf"
                } else if (fontType == "IS") {
                    fontType = "igorsvg"
                } else if (fontType == "CS") {
                    fontType = "colinsvg"
                } else if (fontType == "TS") {
                    fontType = "tilesvg"
                }

                if (blackPawnCount > 0) {
                    if (window.devicePixelRatio && window.devicePixelRatio > 1) {
                        blackPawnString = repeat('<img src=\"img/' + fontType + folder + '/rwp.' + imageType + '\" alt=\"Black pawn\" width=\"16px\" height=\"16px\">', blackPawnCount)
                    } else {
                        blackPawnString = repeat('<img src=\"img/' + fontType + folder + '/wp.' + imageType + '\" alt=\"Black pawn\" width=\"16px\" height=\"16px\">', blackPawnCount)
                    }
                }
                if (blackBishopCount > 0) {
                    if (window.devicePixelRatio && window.devicePixelRatio > 1) {
                        blackBishopString = repeat('<img src=\"img/' + fontType + folder + '/rwb.' + imageType + '\" alt=\"Black bishop\" width=\"16px\" height=\"16px\">', blackBishopCount)
                    } else {
                        blackBishopString = repeat('<img src=\"img/' + fontType + folder + '/wb.' + imageType + '\" alt=\"Black bishop\" width=\"16px\" height=\"16px\">', blackBishopCount)
                    }
                }
                if (blackKnightCount > 0) {
                    if (window.devicePixelRatio && window.devicePixelRatio > 1) {
                        blackKnightString = repeat('<img src=\"img/' + fontType + folder + '/rwn.' + imageType + '\" alt=\"Black knight\" width=\"16px\" height=\"16px\">', blackKnightCount)
                    } else {
                        blackKnightString = repeat('<img src=\"img/' + fontType + folder + '/wn.' + imageType + '\" alt=\"Black knight\" width=\"16px\" height=\"16px\">', blackKnightCount)
                    }
                }
                if (blackRookCount > 0) {
                    if (window.devicePixelRatio && window.devicePixelRatio > 1) {
                        blackRookString = repeat('<img src=\"img/' + fontType + folder + '/rwr.' + imageType + '\" alt=\"Black rook\" width=\"16px\" height=\"16px\">', blackRookCount)
                    } else {
                        blackRookString = repeat('<img src=\"img/' + fontType + folder + '/wr.' + imageType + '\" alt=\"Black rook\" width=\"16px\" height=\"16px\">', blackRookCount)
                    }
                }
                if (blackQueenCount > 0) {
                    if (window.devicePixelRatio && window.devicePixelRatio > 1) {
                        blackQueenString = repeat('<img src=\"img/' + fontType + folder + '/rwq.' + imageType + '\" alt=\"Black queen\" width=\"16px\" height=\"16px\">', blackQueenCount)
                    } else {
                        blackQueenString = repeat('<img src=\"img/' + fontType + folder + '/wq.' + imageType + '\" alt=\"Black queen\" width=\"16px\" height=\"16px\">', blackQueenCount)
                    }
                }
                fullImageString = (blackPawnString + blackBishopString + blackKnightString + blackRookString + blackQueenString)
            }
        }
        currentMDObject.innerHTML = fullImageString
    }
    if (localStorage.getItem('TCEC_GraE') == 'On') {
        setSelectionEvalChart()
    }
    if (localStorage.getItem('TCEC_GraT') == 'On') {
        setSelectionTimeChart()
    }
    if (localStorage.getItem('TCEC_GraD') == 'On') {
        setSelectionDepthChart()
    }
    if (localStorage.getItem('TCEC_GraS') == 'On') {
        setSelectionSpeedChart()
    }
    if (localStorage.getItem('TCEC_GraTB') == 'On') {
        setSelectionTablebaseChart()
    }
    if ((CurrentPly % 2) == 0) {
        currPV = window.whitePv.document.getElementById('PV_for');
        prevPV = window.blackPv.document.getElementById('PV_for')
    } else {
        currPV = window.blackPv.document.getElementById('PV_for');
        prevPV = window.whitePv.document.getElementById('PV_for')
    }
    if (currPV) {
        var showThisMove = CurrentPly - 2;
        if (showThisMove > StartPlyVar[CurrentVar - 2] + PlyNumberVar[CurrentVar - 2]) {
            showThisMove = StartPlyVar[CurrentVar - 2] + PlyNumberVar[CurrentVar - 2]
        }
        if ((showThisMove >= StartPly) && Moves[showThisMove]) {
            text = (Math.floor(showThisMove / 2) + 1) + (showThisMove % 2 === 0 ? '. ' : '... ') + Moves[showThisMove]
        } else {
            text = ''
        }
        if (showThisMove > -1) {
            currPV.innerHTML = 'PV for ' + text
        } else {
            currPV.innerHTML = 'Principal variation'
        }
    }
    if (prevPV) {
        var showThisMove = CurrentPly - 1;
        if (showThisMove > StartPlyVar[CurrentVar - 1] + PlyNumberVar[CurrentVar - 1]) {
            showThisMove = StartPlyVar[CurrentVar - 1] + PlyNumberVar[CurrentVar - 1]
        }
        if ((showThisMove >= StartPly) && Moves[showThisMove]) {
            text = (Math.floor(showThisMove / 2) + 1) + (showThisMove % 2 === 0 ? '. ' : '... ') + Moves[showThisMove]
        } else {
            text = ''
        }
        if (showThisMove > -1) {
            prevPV.innerHTML = 'PV for ' + text
        } else {
            prevPV.innerHTML = 'Principal variation'
        }
    }
}

function customFunctionOnCheckLiveBroadcastStatus() {
    StatusCheck()
}

function downloadGame(path) {
    ifrm = document.getElementById("download");
    ifrm.src = path
}

function selectText(element) {
    var doc = document,
        text = doc.getElementById(element),
        range, selection;
    if (doc.body.createTextRange) {
        range = doc.body.createTextRange();
        range.moveToElementText(text);
        range.select()
    } else if (window.getSelection) {
        selection = window.getSelection();
        range = doc.createRange();
        range.selectNodeContents(text);
        selection.removeAllRanges();
        selection.addRange(range)
    }
}



function MarkCurrentGame() {
    $(document).ready(function() {
        $('.selGame').click(function() {
            $('.file').removeClass('activeGame');
            $(this).parent("li").addClass('activeGame')
        })
    })
}
document.head = document.head || document.getElementsByTagName('head')[0];

function changeFavicon(src) {
    var link = document.createElement('link'),
        oldLink = document.getElementById('dynamic-favicon');
    link.id = 'dynamic-favicon';
    link.rel = 'shortcut icon';
    link.href = src;
    if (oldLink) {
        document.head.removeChild(oldLink)
    }
    document.head.appendChild(link)
}

function refreshGameList() {
    $("#tall_a_24").load("archive_menu.php")
}

function An_check(annot) {
    a_main_box = document.getElementById("tall_a_24");
    annot1_box = document.getElementById("tall_a_25");
    annot2_box = document.getElementById("tcec_gui_game_info_9");
    if (annot.checked) {
        a_main_box.style.height = "200px";
        annot1_box.style.display = "block";
        annot2_box.style.display = "block"
    } else {
        a_main_box.style.height = "612px";
        annot1_box.style.display = "none";
        annot2_box.style.display = "none"
    }
}

function CheckOpen(folder) {
    for (i = 0; i <= 30; i++) {
        menu = document.getElementById('menu' + i);
        if (folder.id != menu.id) {
            menu.checked = !1
        }
    }
    An_check(menu30)
}
var fenPositions = new Array();

function resetFenPositions() {
    fenPositions = new Array()
}

function scanGameForFen() {
    savedCurrentPly = CurrentPly;
    savedCurrentVar = CurrentVar;
    if (wasAutoPlayOn = isAutoPlayOn) {
        SetAutoPlay(!1)
    }
    MoveForward(StartPly + PlyNumber - savedCurrentPly, CurrentVar, !0);
    resetFenPositions();
    while (!0) {
        fenPositions[CurrentPly] = CurrentFEN();
        if (CurrentPly === StartPly) {
            break
        }
        MoveBackward(1, !0)
    }
    MoveForward(savedCurrentPly - StartPly, savedCurrentVar, !0);
    if (wasAutoPlayOn) {
        SetAutoPlay(!0)
    }
    needScanGameForFen = !1
}

function getPlyOffset() {
    if (MoveComments[1] === 'book') {
        for (var mc in MoveComments) {
            if (!mc || mc === '0') continue;
            if (MoveComments[mc] !== 'book') {
                if (mc % 2 !== 0) {
                    return mc - 5;
                } else {
                    return mc - 4;
                }
            }
        }
    }
    return 0
}

function drawCharts()
{
   setSelectionEvalChart();
   setSelectionTimeChart();
   setSelectionDepthChart()
   setSelectionSpeedChart();
   setSelectionTablebaseChart();
}

function setSelectionEvalChart() {
    var plyOffset = getPlyOffset();
    if (evalchartdataFound) {
        if (typeof(evalchart) != "undefined") {
            if (CurrentPly > StartPly) {
                evalchart.setSelection([{
                    row: (Math.ceil((CurrentPly - StartPly - plyOffset) / 2) - 1),
                    column: ((CurrentPly + plyOffset) % 2 ? 1 : 2)
                }])
            } else {
                evalchart.setSelection()
            }
        }
    }
}

function setSelectionTimeChart() {
    var plyOffset = getPlyOffset();
    if (timechartdataFound) {
        if (typeof(timechart) != "undefined") {
            if (CurrentPly > StartPly) {
                timechart.setSelection([{
                    row: (Math.ceil((CurrentPly - StartPly - plyOffset) / 2) - 1),
                    column: ((CurrentPly + plyOffset) % 2 ? 1 : 2)
                }])
            } else {
                timechart.setSelection()
            }
        }
    }
}

function setSelectionDepthChart() {
    var plyOffset = getPlyOffset();
    if (depthchartdataFound) {
        if (typeof(depthchart) != "undefined") {
            if (CurrentPly > StartPly) {
                depthchart.setSelection([{
                    row: (Math.ceil((CurrentPly - StartPly - plyOffset) / 2) - 1),
                    column: (CurrentPly % 2 ? 1 : 2)
                }])
            } else {
                depthchart.setSelection()
            }
        }
    }
}

function setSelectionSpeedChart() {
    var plyOffset = getPlyOffset();
    if (speedchartdataFound) {
        if (typeof(speedchart) != "undefined") {
            if (CurrentPly > StartPly) {
                speedchart.setSelection([{
                    row: (Math.ceil((CurrentPly - StartPly - plyOffset) / 2) - 1),
                    column: (CurrentPly % 2 ? 1 : 2)
                }])
            } else {
                speedchart.setSelection()
            }
        }
    }
}

function setSelectionTablebaseChart() {
    var plyOffset = getPlyOffset();
    if (tablebasechartdataFound) {
        if (typeof(tablebasechart) != "undefined") {
            if (CurrentPly > StartPly) {
                tablebasechart.setSelection([{
                    row: (Math.ceil((CurrentPly - StartPly - plyOffset) / 2) - 1),
                    column: (CurrentPly % 2 ? 1 : 2)
                }])
            } else {
                tablebasechart.setSelection()
            }
        }
    }
}

function TCECDrawRule() 
{
    var minPlyForDraw = 80;
    if (pgnUrl == "archive/TCEC_Season_1_-_Division_2.pgn") {
        var numPliesForDraw = 8;
    } else {
        var numPliesForDraw = 10;
    }
    var minDrawThreshold = -0.05;
    var maxDrawThreshold = +0.05;
    if (CurrentPly <= minPlyForDraw - numPliesForDraw) {
        return "*"
    }
    var thisMove;
    var plyOffset = getPlyOffset()
    var moveOffset = Math.ceil(plyOffset / 2);
    for (var thisPly = CurrentPly; thisPly > Math.max(CurrentPly, minPlyForDraw) - numPliesForDraw; thisPly--) {
        if (!evalchartdata) {
            break
        }
        thisMove = Math.ceil(thisPly / 2);
        thisColor = 2 + 2 * (thisPly / 2 - thisMove);
        if (typeof evalchartdata[thisMove - moveOffset] !== "object") {
            break
        }
        if (typeof evalchartdata[thisMove - moveOffset][thisColor] !== "number") {
            break
        }
        if ((evalchartdata[thisMove - moveOffset][thisColor] < minDrawThreshold) || (evalchartdata[thisMove - moveOffset][thisColor] > maxDrawThreshold)) {
            break
        }
        if (HistType[0][thisPly - 1] == 6) {
            break
        }
        if (HistPieceId[1][thisPly - 1] > 16) {
            break
        }
        if (MoveComments[thisPly] === "") {
            break
        }
    }
    var formula = numPliesForDraw + thisPly - CurrentPly;
        ////console.log ("return here:" + formula + ",numPliesForDraw" + numPliesForDraw + "," + thisPly + "," + CurrentPly); 
    if (((formula) <= 9) && ((formula) >= 0)) 
    {
        if ((formula) == 0) {
            return 0
        } else if ((formula) == 1) {
            return formula;
        } else if ((formula) != 1) {
            return formula;
        }
    } else {
        return "*"
    }
}

function TCECWinRule() {
    var minPlyForWin = minMoveswin;
    var numPliesForWin = minMoveswin;
    var minWinThreshold = -minEval;
    var maxWinThreshold = +minEval;
    if (CurrentPly <= minPlyForWin - numPliesForWin) {
        return "*"
    }
    var thisMove;
    var plyOffset = getPlyOffset()
    var moveOffset = Math.ceil(plyOffset / 2);
    var winning = 1;
    for (var thisPly = CurrentPly; thisPly > Math.max(CurrentPly, minPlyForWin) - numPliesForWin; thisPly--) {
        if (!evalchartdata) {
            break
        }
        thisMove = Math.ceil(thisPly / 2);
        thisColor = 2 + 2 * (thisPly / 2 - thisMove);
        if (typeof evalchartdata[thisMove - moveOffset] !== "object") {
            break
        }
        if (typeof evalchartdata[thisMove - moveOffset][thisColor] !== "number") {
            break
        }

        if ((evalchartdata[thisMove - moveOffset][thisColor] > minWinThreshold) && (evalchartdata[thisMove - moveOffset][thisColor] < maxWinThreshold)) {
           if (evalchartdata[thisMove - moveOffset][thisColor] < 0)
           {
              winning = -1;
           } 
            break
        }
        if (MoveComments[thisPly] == "book") {
            break
        }
        if (MoveComments[thisPly] === "") {
            break
        }
    }
    var formula = numPliesForWin + thisPly - CurrentPly;
    if (CurrentPly > 20 && ((formula) < minMoveswin) && ((formula) >= 0)) {
        if ((formula) == 0) {
            return 0
        } else if ((formula) == 1) {
            return winning * formula;
        } else if ((formula) != 1) {
            return winning * formula;
        }
    } else {
        return "*"
    }
}

function clock2sec(string) {
    items = string.split(':');
    val = 0;
    for (i in items) {
        val = 60 * val + parseFloat(items[i])
    }
    return val
}

function tc2sec(string) {
    x = string.match(/([\d]*)\+/);
    base = Number(x[1]);
    y = string.match(/\+([\d]*)/);
    add = Number(y[1]);
    tc = parseFloat(base + add);
    return tc
}

function crc32(str) {
    var table = "00000000 77073096 EE0E612C 990951BA 076DC419 706AF48F E963A535 9E6495A3 0EDB8832 79DCB8A4 E0D5E91E 97D2D988 09B64C2B 7EB17CBD E7B82D07 90BF1D91 1DB71064 6AB020F2 F3B97148 84BE41DE 1ADAD47D 6DDDE4EB F4D4B551 83D385C7 136C9856 646BA8C0 FD62F97A 8A65C9EC 14015C4F 63066CD9 FA0F3D63 8D080DF5 3B6E20C8 4C69105E D56041E4 A2677172 3C03E4D1 4B04D447 D20D85FD A50AB56B 35B5A8FA 42B2986C DBBBC9D6 ACBCF940 32D86CE3 45DF5C75 DCD60DCF ABD13D59 26D930AC 51DE003A C8D75180 BFD06116 21B4F4B5 56B3C423 CFBA9599 B8BDA50F 2802B89E 5F058808 C60CD9B2 B10BE924 2F6F7C87 58684C11 C1611DAB B6662D3D 76DC4190 01DB7106 98D220BC EFD5102A 71B18589 06B6B51F 9FBFE4A5 E8B8D433 7807C9A2 0F00F934 9609A88E E10E9818 7F6A0DBB 086D3D2D 91646C97 E6635C01 6B6B51F4 1C6C6162 856530D8 F262004E 6C0695ED 1B01A57B 8208F4C1 F50FC457 65B0D9C6 12B7E950 8BBEB8EA FCB9887C 62DD1DDF 15DA2D49 8CD37CF3 FBD44C65 4DB26158 3AB551CE A3BC0074 D4BB30E2 4ADFA541 3DD895D7 A4D1C46D D3D6F4FB 4369E96A 346ED9FC AD678846 DA60B8D0 44042D73 33031DE5 AA0A4C5F DD0D7CC9 5005713C 270241AA BE0B1010 C90C2086 5768B525 206F85B3 B966D409 CE61E49F 5EDEF90E 29D9C998 B0D09822 C7D7A8B4 59B33D17 2EB40D81 B7BD5C3B C0BA6CAD EDB88320 9ABFB3B6 03B6E20C 74B1D29A EAD54739 9DD277AF 04DB2615 73DC1683 E3630B12 94643B84 0D6D6A3E 7A6A5AA8 E40ECF0B 9309FF9D 0A00AE27 7D079EB1 F00F9344 8708A3D2 1E01F268 6906C2FE F762575D 806567CB 196C3671 6E6B06E7 FED41B76 89D32BE0 10DA7A5A 67DD4ACC F9B9DF6F 8EBEEFF9 17B7BE43 60B08ED5 D6D6A3E8 A1D1937E 38D8C2C4 4FDFF252 D1BB67F1 A6BC5767 3FB506DD 48B2364B D80D2BDA AF0A1B4C 36034AF6 41047A60 DF60EFC3 A867DF55 316E8EEF 4669BE79 CB61B38C BC66831A 256FD2A0 5268E236 CC0C7795 BB0B4703 220216B9 5505262F C5BA3BBE B2BD0B28 2BB45A92 5CB36A04 C2D7FFA7 B5D0CF31 2CD99E8B 5BDEAE1D 9B64C2B0 EC63F226 756AA39C 026D930A 9C0906A9 EB0E363F 72076785 05005713 95BF4A82 E2B87A14 7BB12BAE 0CB61B38 92D28E9B E5D5BE0D 7CDCEFB7 0BDBDF21 86D3D2D4 F1D4E242 68DDB3F8 1FDA836E 81BE16CD F6B9265B 6FB077E1 18B74777 88085AE6 FF0F6A70 66063BCA 11010B5C 8F659EFF F862AE69 616BFFD3 166CCF45 A00AE278 D70DD2EE 4E048354 3903B3C2 A7672661 D06016F7 4969474D 3E6E77DB AED16A4A D9D65ADC 40DF0B66 37D83BF0 A9BCAE53 DEBB9EC5 47B2CF7F 30B5FFE9 BDBDF21C CABAC28A 53B39330 24B4A3A6 BAD03605 CDD70693 54DE5729 23D967BF B3667A2E C4614AB8 5D681B02 2A6F2B94 B40BBE37 C30C8EA1 5A05DF1B 2D02EF8D";
    var crc = 0;
    var x = 0;
    var y = 0;
    crc = crc ^ (-1);
    for (var i = 0, iTop = str.length; i < iTop; i++) {
        y = (crc ^ (str.charCodeAt(i) % 0x100)) & 0xFF;
        x = "0x" + table.substr(y * 9, 8);
        crc = (crc >>> 8) ^ x
    }
    return crc ^ (-1)
}

function printHex(n) {
    var hex = "0123456789ABCDEF";
    var s = "";
    var r = 0;
    for (var i = 0; i < 8; i++) {
        r = n % 16;
        if (r < 0) {
            r += 16
        }
        s = hex.charAt(r) + s;
        n >>= 4
    }
    return s
};
(function($) {
    var methods = (function() {
        var c = {
                bcClass: 'sf-breadcrumb',
                menuClass: 'sf-js-enabled',
                anchorClass: 'sf-with-ul',
                menuArrowClass: 'sf-arrows'
            },
            outerClick = (function() {
                $(window).load(function() {
                    $('body').children().on('click.superclick', function() {
                        var $allMenus = $('.sf-js-enabled');
                        $allMenus.superclick('reset')
                    })
                })
            })(),
            toggleMenuClasses = function($menu, o) {
                var classes = c.menuClass;
                if (o.cssArrows) {
                    classes += ' ' + c.menuArrowClass
                }
                $menu.toggleClass(classes)
            },
            setPathToCurrent = function($menu, o) {
                return $menu.find('li.' + o.pathClass).slice(0, o.pathLevels).addClass(o.activeClass + ' ' + c.bcClass).filter(function() {
                    return ($(this).children('ul').hide().show().length)
                }).removeClass(o.pathClass)
            },
            toggleAnchorClass = function($li) {
                $li.children('a').toggleClass(c.anchorClass)
            },
            toggleTouchAction = function($menu) {
                var touchAction = $menu.css('ms-touch-action');
                touchAction = (touchAction === 'pan-y') ? 'auto' : 'pan-y';
                $menu.css('ms-touch-action', touchAction)
            },
            clickHandler = function(e) {
                var $this = $(this),
                    $ul = $this.siblings('ul'),
                    func;
                if ($ul.length) {
                    func = ($ul.is(':hidden')) ? over : out;
                    $.proxy(func, $this.parent('li'))();
                    return !1
                }
            },
            over = function() {
                var $this = $(this),
                    o = getOptions($this);
                $this.siblings().superclick('hide').end().superclick('show')
            },
            out = function() {
                var $this = $(this),
                    o = getOptions($this);
                $.proxy(close, $this, o)()
            },
            close = function(o) {
                o.retainPath = ($.inArray(this[0], o.$path) > -1);
                this.superclick('hide');
                if (!this.parents('.' + o.activeClass).length) {
                    o.onIdle.call(getMenu(this));
                    if (o.$path.length) {
                        $.proxy(over, o.$path)()
                    }
                }
            },
            getMenu = function($el) {
                return $el.closest('.' + c.menuClass)
            },
            getOptions = function($el) {
                return getMenu($el).data('sf-options')
            };
        return {
            hide: function(instant) {
                if (this.length) {
                    var $this = this,
                        o = getOptions($this);
                    if (!o) {
                        return this
                    }
                    var not = (o.retainPath === !0) ? o.$path : '',
                        $ul = $this.find('li.' + o.activeClass).add(this).not(not).removeClass(o.activeClass).children('ul'),
                        speed = o.speedOut;
                    if (instant) {
                        $ul.show();
                        speed = 0
                    }
                    o.retainPath = !1;
                    o.onBeforeHide.call($ul);
                    $ul.stop(!0, !0).animate(o.animationOut, speed, function() {
                        var $this = $(this);
                        o.onHide.call($this)
                    })
                }
                return this
            },
            show: function() {
                var o = getOptions(this);
                if (!o) {
                    return this
                }
                var $this = this.addClass(o.activeClass),
                    $ul = $this.children('ul');
                o.onBeforeShow.call($ul);
                $ul.stop(!0, !0).animate(o.animation, o.speed, function() {
                    o.onShow.call($ul)
                });
                return this
            },
            destroy: function() {
                return this.each(function() {
                    var $this = $(this),
                        o = $this.data('sf-options'),
                        $liHasUl = $this.find('li:has(ul)');
                    if (!o) {
                        return !1
                    }
                    toggleMenuClasses($this, o);
                    toggleAnchorClass($liHasUl);
                    toggleTouchAction($this);
                    $this.off('.superclick');
                    $liHasUl.children('ul').attr('style', function(i, style) {
                        return style.replace(/display[^;]+;?/g, '')
                    });
                    o.$path.removeClass(o.activeClass + ' ' + c.bcClass).addClass(o.pathClass);
                    $this.find('.' + o.activeClass).removeClass(o.activeClass);
                    o.onDestroy.call($this);
                    $this.removeData('sf-options')
                })
            },
            reset: function() {
                return this.each(function() {
                    var $menu = $(this),
                        o = getOptions($menu),
                        $openLis = $($menu.find('.' + o.activeClass).toArray().reverse());
                    $openLis.children('a').trigger('click')
                })
            },
            init: function(op) {
                return this.each(function() {
                    var $this = $(this);
                    if ($this.data('sf-options')) {
                        return !1
                    }
                    var o = $.extend({}, $.fn.superclick.defaults, op),
                        $liHasUl = $this.find('li:has(ul)');
                    o.$path = setPathToCurrent($this, o);
                    $this.data('sf-options', o);
                    toggleMenuClasses($this, o);
                    toggleAnchorClass($liHasUl);
                    toggleTouchAction($this);
                    $this.on('click.superclick', 'a', clickHandler);
                    $liHasUl.not('.' + c.bcClass).superclick('hide', !0);
                    o.onInit.call(this)
                })
            }
        }
    })();
    $.fn.superclick = function(method, args) {
        if (methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1))
        } else if (typeof method === 'object' || !method) {
            return methods.init.apply(this, arguments)
        } else {
            return $.error('Method ' + method + ' does not exist on jQuery.fn.superclick')
        }
    };
    $.fn.superclick.defaults = {
        activeClass: 'sfHover',
        pathClass: 'overrideThisToUse',
        pathLevels: 1,
        animation: {
            opacity: 'show'
        },
        animationOut: {
            opacity: 'hide'
        },
        speed: 'fast',
        speedOut: 'fast',
        cssArrows: !1,
        onInit: $.noop,
        onBeforeShow: $.noop,
        onShow: $.noop,
        onBeforeHide: $.noop,
        onHide: $.noop,
        onIdle: $.noop,
        onDestroy: $.noop
    }
})
/* (jQuery); uncomment this to display live clocks */

function StatusCheck() {
    var server_status = LiveBroadcastLastModified.getTime();
    whenStarted = new Date().getTime();
    if (currentPage == "live.html") {
        theObject = document.getElementById("gameFeed");
        if (theObject) {
            if (whenStarted > (server_status + 300000)) {
                theObject.innerHTML = "Offline " + Math.round(((whenStarted - server_status) / 1000) / 60) + "m";
                theObject.style.color = "#9d0d00"
            } else {
                theObject.innerHTML = "Online";
                theObject.style.color = "#007d0a"
            }
        }
    }
}

function Coor() {
    if (localStorage.getItem('TCEC_Coor') == 'Off') {
        theObj1 = document.getElementById("GameCoorRight");
        theObj2 = document.getElementById("GameCoorBottom");
        if ((theObj1) && (theObj2)) {
            theObj1.style.display = 'block';
            theObj2.style.display = 'block'
        }
        if (theObj = document.getElementById("tcec_gui_matclo_b")) {
            theObj.style.position = "relative";
            theObj.style.top = flipped ? "423px" : "0"
        }
        if (theObj = document.getElementById("tcec_gui_matclo_w")) {
            theObj.style.position = "relative";
            theObj.style.top = flipped ? "-423px" : "0"
        }
        Obj = document.getElementById("coor-check");
        if (Obj) {
            Obj.src = "./img/check.png"
        }
        theObjx = document.getElementById("info_row_data_2_mo");
        theObjy = document.getElementById("GameMoves");
        if ((theObjx) && (theObjy)) {
            if (localStorage.getItem('TCEC_FEN') == 'Off') {
                theObjx.style.height = "132px";
                theObjy.style.height = "126px"
            } else {
                theObjx.style.height = "109px";
                theObjy.style.height = "103px"
            }
        }
    } else if (localStorage.getItem('TCEC_Coor') == 'Off') {
        theObj1 = document.getElementById("GameCoorRight");
        theObj2 = document.getElementById("GameCoorBottom");
        if ((theObj1) && (theObj2)) {
            theObj1.style.display = 'none';
            theObj2.style.display = 'none'
        }
        if (theObj = document.getElementById("tcec_gui_matclo_b")) {
            theObj.style.position = "relative";
            theObj.style.top = flipped ? "411px" : "0"
        }
        if (theObj = document.getElementById("tcec_gui_matclo_w")) {
            theObj.style.position = "relative";
            theObj.style.top = flipped ? "-411px" : "0"
        }
        Obj = document.getElementById("coor-check");
        if (Obj) {
            Obj.src = "./img/check_empty.png"
        }
        theObjx = document.getElementById("info_row_data_2_mo");
        theObjy = document.getElementById("GameMoves");
        if ((theObjx) && (theObjy)) {
            if (localStorage.getItem('TCEC_FEN') == 'Off') {
                theObjx.style.height = "144px";
                theObjy.style.height = "138px"
            } else {
                theObjx.style.height = "121px";
                theObjy.style.height = "115px"
            }
        }
    }
}

function Fen() {
    if (localStorage.getItem('TCEC_FEN') == 'Off') {
        theObj = document.getElementById("FenPosition");
        if (theObj) {
            theObj.style.display = 'block'
        }
        Obj = document.getElementById("fen-check");
        if (Obj) {
            Obj.src = "./img/check.png"
        }
        theObjx = document.getElementById("info_row_data_2_mo");
        theObjy = document.getElementById("GameMoves");
        if ((theObjx) && (theObjy)) {
            if (localStorage.getItem('TCEC_Coor') == 'Off') {
                theObjx.style.height = "121px";
                theObjy.style.height = "115px"
            } else {
                theObjx.style.height = "109px";
                theObjy.style.height = "103px"
            }
        }
    } else if (localStorage.getItem('TCEC_FEN') == 'Off') {
        theObj = document.getElementById("FenPosition");
        if (theObj) {
            theObj.style.display = 'none'
        }
        Obj = document.getElementById("fen-check");
        if (Obj) {
            Obj.src = "./img/check_empty.png"
        }
        theObjx = document.getElementById("info_row_data_2_mo");
        theObjy = document.getElementById("GameMoves");
        if ((theObjx) && (theObjy)) {
            if (localStorage.getItem('TCEC_Coor') == 'Off') {
                theObjx.style.height = "144px";
                theObjy.style.height = "138px"
            } else {
                theObjx.style.height = "132px";
                theObjy.style.height = "126px"
            }
        }
    }
}

function Chat() {
    theObj = document.getElementById("chat-box");
    theObj2 = document.getElementById("chat-box-hidden");
    theObj3 = document.getElementById("chat-check");
    if (localStorage.getItem('TCEC_Chat') == 'On') {
        if (theObj) {
            theObj.style.display = 'block'
        }
        if (theObj2) {
            theObj2.style.display = 'none'
        }
        if (theObj3) {
            theObj3.src = "./img/check.png"
        }
    } else if (localStorage.getItem('TCEC_Chat') == 'Off') {
        if (theObj) {
            theObj.style.display = 'none'
        }
        if (theObj2) {
            theObj2.style.display = 'block'
        }
        if (theObj3) {
            theObj3.src = "./img/check_empty.png"
        }
    }
}


function Twota() 
{
    var theObj = document.getElementById("chatright");
    if (theObj) {
        if ("On" == localStorage.getItem("TCEC_Twiota")) {
            theObj.src = "http://www.twitch.tv/embed/TCEC_Chess_TV/chat";
        } else {
            theObj.src = "http://www.twitch.tv/embed/TCEC_Chess_TV/chat?darkpopout";
        }
    }
}

function HideE() {
    blackObj = document.getElementById("black-eval-box");
    whiteObj = document.getElementById("white-eval-box");
    chartObj = document.getElementById("info_row_ch_ev");
    Obj = document.getElementById("eval-check");
    numGraphs = +localStorage.getItem('TCEC_Grap');
    if (localStorage.getItem('YLCET_HEva') == 'On') {
        if (blackObj) {
            blackObj.style.display = 'none'
        }
        if (whiteObj) {
            whiteObj.style.display = 'none'
        }
        if (chartObj) {
            chartObj.style.display = 'none'
        }
        if (localStorage.getItem('TCEC_GraE') == 'On') {
            localStorage.setItem('TCEC_GraE', 'Off');
            localStorage.setItem('TCEC_Grap', numGraphs - 1)
        }
        if (Obj) {
            Obj.src = "./img/check.png"
        }
    } else if (localStorage.getItem('YLCET_HEva') == 'Off') {
        if (blackObj) {
            blackObj.style.display = 'block'
        }
        if (whiteObj) {
            whiteObj.style.display = 'block'
        }
        if (localStorage.getItem('TCEC_GraE') == 'On') {
            if (chartObj) {
                chartObj.style.display = 'block'
            }
        }
        if (Obj) {
            Obj.src = "./img/check_empty.png"
        }
    }
}


function Soun() {
    if (currentPage == "live.html") {
        OnOff = localStorage.getItem("YL_SOUND");
        if (pvcurrentGame != gameRound[currentGame])
        {
            SoundCount = 1;
        }
        if (PlyNumber >= SoundCount) {
            if (OnOff == 1) {
                document.getElementById('move_sound').play()
            }
            SoundCount = PlyNumber + 1
        }
    }
}

function Fonts() {
    FontChoice = localStorage.getItem("YLCET_font");
    Obj1 = document.getElementById("fontme-check");
    Obj1.src = "./img/check_empty.png";
    Obj2 = document.getElementById("fontal-check");
    Obj2.src = "./img/check_empty.png";
    Obj3 = document.getElementById("fontus-check");
    Obj3.src = "./img/check_empty.png";
    Obj4 = document.getElementById("fontis-check");
    Obj4.src = "./img/check_empty.png";
    Obj5 = document.getElementById("fontcs-check");
    Obj5.src = "./img/check_empty.png";
    Obj6 = document.getElementById("fontts-check");
    Obj6.src = "./img/check_empty.png";
    if (FontChoice == 'ME') {
        if (Obj1) {
            Obj1.src = "./img/check.png";
            SetImageType("png");
            SetImagePath("img/merida/44")
        }
    } else if (FontChoice == 'AL') {
        if (Obj2) {
            Obj2.src = "./img/check.png";
            SetImageType("png");
            SetImagePath("img/alpha/44")
        }
    } else if (FontChoice == 'US') {
        if (Obj3) {
            Obj3.src = "./img/check.png";
            SetImageType("png");
            SetImagePath("img/uscf/44")
        }
    } else if (FontChoice == 'IS') {
        if (Obj4) {
            Obj4.src = "./img/check.png";
            SetImageType("svg");
            SetImagePath("img/igorsvg")
        }
    } else if (FontChoice == 'CS') {
        if (Obj5) {
            Obj5.src = "./img/check.png";
            SetImageType("svg");
            SetImagePath("img/colinsvg")
        }
    } else if (FontChoice == 'TS') {
        if (Obj6) {
            Obj6.src = "./img/check.png";
            SetImageType("svg");
            SetImagePath("img/tilesvg")
        }
    }
}

function NightM() {
    OnOff = localStorage.getItem('TCEC_Nigh');
    Obj = document.getElementById("nigh-check");
    setNight = document.getElementById("nightm");
    setNight2 = document.getElementById('whitePv').contentWindow.document.getElementById('nightmpv');
    setNight3 = document.getElementById('blackPv').contentWindow.document.getElementById('nightmpv');
    if (OnOff == 'On') {
        if (Obj) {
            Obj.src = "./img/check.png"
        }
        option1 = '#tcec_gui_1 {background:#a9a9a9;}';
        option2 = 'body {background:url(img/wood3.jpg)}';
        option3 = '.info_row_data_2_ev, .info_row_data_2_ro, .info_row_data_2_re, .info_row_data_2_da, .info_row_data_2_wh, .info_row_data_2_bl, .info_row_data_2_tc, .info_row_data_2_tcl, .info_row_data_2_te,.info_row_data_2_fe, #info_row_data_2_mo, .info_row_data_2_ex, .info_row_data_2_ma, .info_row_data_2_cl, .info_row_data_2_ec, .info_row_data_2_cl_tt, .info_row_data_2_op, .info_row_data_2_opa, .info_row_data_2_50, .info_row_data_2_dr, .info_row_data_2_wi, .info_row_data_2_gl, .info_row_data_2_ra {background:#cccccc}';
        option4 = '.engine_box_data_2_mt, .engine_box_data_2_ev, .engine_box_data_2_de, .engine_box_data_2_sp, .engine_box_data_2_no, .engine_box_data_2_tb {background:#cccccc}';
        option5 = '.info_row_data_2_pv {background:#cccccc}';
        option6 = '.sf-menu ul {background:#cccccc}';
        moves3 = document.getElementById("info_row_data_2_mo");
        moves3.style.backgroundColor = "#cccccc";
        if (currentPage == "archive.php") {
            moves2 = document.getElementById("tall_a_24");
            moves2.style.backgroundColor = "#cccccc"
        }
    } else if (OnOff == 'Off') {
        if (Obj) {
            Obj.src = "./img/check_empty.png"
        }
        option1 = '#tcec_gui_1 {background:#d4d0c8;}';
        option2 = 'body {background:url(img/wood2.jpg)}';
        option3 = '.info_row_data_2_ev, .info_row_data_2_ro, .info_row_data_2_re, .info_row_data_2_da, .info_row_data_2_wh, .info_row_data_2_bl, .info_row_data_2_tc, .info_row_data_2_tcl, .info_row_data_2_te,.info_row_data_2_fe, #info_row_data_2_mo, .info_row_data_2_ex, .info_row_data_2_ma, .info_row_data_2_cl, .info_row_data_2_ec, .info_row_data_2_cl_tt, .info_row_data_2_op, .info_row_data_2_opa, .info_row_data_2_50, .info_row_data_2_dr, .info_row_data_2_wi, .info_row_data_2_gl, .info_row_data_2_ra {background:white}';
        option4 = '.engine_box_data_2_mt, .engine_box_data_2_ev, .engine_box_data_2_de, .engine_box_data_2_sp, .engine_box_data_2_no, .engine_box_data_2_tb {background:white}';
        option5 = '.info_row_data_2_pv {background:white}';
        option6 = '.sf-menu ul {background:#d4d0c8}';
        moves3 = document.getElementById("info_row_data_2_mo");
        moves3.style.backgroundColor = "white";
        if (currentPage == "archive.php") {
            moves2 = document.getElementById("tall_a_24");
            moves2.style.backgroundColor = "white"
        }
    }
    setNight.innerHTML = option1 + option2 + option3 + option4 + option6;
    setNight2.innerHTML = option5;
    setNight3.innerHTML = option5
}


function Graphs() {
    numGraphs = +localStorage.getItem('TCEC_Grap');
    egra = document.getElementById("egra-check");
    tgra = document.getElementById("tgra-check");
    dgra = document.getElementById("dgra-check");
    sgra = document.getElementById("sgra-check");
    tbgra = document.getElementById("tbgra-check");
    egra2 = document.getElementById("info_row_ch_ev");
    tgra2 = document.getElementById("info_row_ch_ti");
    dgra2 = document.getElementById("info_row_ch_de");
    sgra2 = document.getElementById("info_row_ch_sp");
    tbgra2 = document.getElementById("info_row_ch_tb");
    if (localStorage.getItem('TCEC_GraE') == 'Off') {
        if (egra) {
            egra.src = "./img/check_empty.png";
            egra2.style.display = "none"
        }
    } else {
        if (egra) {
            egra.src = "./img/check.png";
            egra2.style.display = "block"
        }
    }
    if (localStorage.getItem('TCEC_GraT') == 'Off') {
        if (tgra) {
            tgra.src = "./img/check_empty.png";
            tgra2.style.display = "none"
        }
    } else {
        if (tgra) {
            tgra.src = "./img/check.png";
            tgra2.style.display = "block"
        }
    }
    if (localStorage.getItem('TCEC_GraD') == 'Off') {
        if (dgra) {
            dgra.src = "./img/check_empty.png";
            dgra2.style.display = "none"
        }
    } else {
        if (dgra) {
            dgra.src = "./img/check.png";
            dgra2.style.display = "block"
        }
    }
    if (localStorage.getItem('TCEC_GraS') == 'Off') {
        if (sgra) {
            sgra.src = "./img/check_empty.png";
            sgra2.style.display = "none"
        }
    } else {
        if (sgra) {
            sgra.src = "./img/check.png";
            sgra2.style.display = "block"
        }
    }
    if (localStorage.getItem('TCEC_GraTB') == 'Off') {
        if (tbgra) {
            tbgra.src = "./img/check_empty.png";
            tbgra2.style.display = "none"
        }
    } else {
        if (tbgra) {
            tbgra.src = "./img/check.png";
            tbgra2.style.display = "block"
        }
    }

}



function GraphTog(id) {
    numGraphs = +localStorage.getItem('TCEC_Grap');
    if (id == "EGra") {
        if (localStorage.getItem('TCEC_GraE') == 'Off') {
            if (localStorage.getItem('YLCET_HEva') == 'On') {
                alert('To show the eval graph you need to uncheck the "Hide evaluation" option in the Tools menu first.')
            } else {
                localStorage.setItem('TCEC_GraE', 'On');
                localStorage.setItem('TCEC_Grap', numGraphs + 1)
            }
        } else {
            localStorage.setItem('TCEC_GraE', 'Off');
            localStorage.setItem('TCEC_Grap', numGraphs - 1)
        }
    } else if (id == "TGra") {
        if (localStorage.getItem('TCEC_GraT') == 'Off') {
            localStorage.setItem('TCEC_GraT', 'On');
            localStorage.setItem('TCEC_Grap', numGraphs + 1)
        } else {
            localStorage.setItem('TCEC_GraT', 'Off');
            localStorage.setItem('TCEC_Grap', numGraphs - 1)
        }
    } else if (id == "DGra") {
        if (localStorage.getItem('TCEC_GraD') == 'Off') {
            localStorage.setItem('TCEC_GraD', 'On');
            localStorage.setItem('TCEC_Grap', numGraphs + 1)
        } else {
            localStorage.setItem('TCEC_GraD', 'Off');
            localStorage.setItem('TCEC_Grap', numGraphs - 1)
        }
    } else if (id == "SGra") {
        if (localStorage.getItem('TCEC_GraS') == 'Off') {
            localStorage.setItem('TCEC_GraS', 'On');
            localStorage.setItem('TCEC_Grap', numGraphs + 1)
        } else {
            localStorage.setItem('TCEC_GraS', 'Off');
            localStorage.setItem('TCEC_Grap', numGraphs - 1)
        }
    } else if (id == "TBGra") {
        if (localStorage.getItem('TCEC_GraTB') == 'Off') {
            localStorage.setItem('TCEC_GraTB', 'On');
            localStorage.setItem('TCEC_Grap', numGraphs + 1)
        } else {
            localStorage.setItem('TCEC_GraTB', 'Off');
            localStorage.setItem('TCEC_Grap', numGraphs - 1)
        }
    }
    Graphs();
    evalchart.clearChart();
    timechart.clearChart();
    depthchart.clearChart();
    speedchart.clearChart();
    tablebasechart.clearChart();
    customFunctionOnPgnGameLoad()
}

function NighTog() {
    if (localStorage.getItem('TCEC_Nigh') == 'On') {
        localStorage.setItem('TCEC_Nigh', 'Off');
        NightM();
        evalchart.clearChart();
        timechart.clearChart();
        depthchart.clearChart();
        speedchart.clearChart();
        tablebasechart.clearChart();
        customFunctionOnPgnGameLoad()
    } else {
        localStorage.setItem('TCEC_Nigh', 'On');
        NightM();
        evalchart.clearChart();
        timechart.clearChart();
        depthchart.clearChart();
        speedchart.clearChart();
        tablebasechart.clearChart();
        customFunctionOnPgnGameLoad()
    }
}

function FontTog(id) {
    hvitPV = window.whitePv;
    sortPV = window.blackPv;
    boardAna = window.analysisBoard;
    switch (id) {
        case "ME":
            localStorage.setItem('YLCET_font', 'ME');
            break;
        case "AL":
            localStorage.setItem('YLCET_font', 'AL');
            break;
        case "US":
            localStorage.setItem('YLCET_font', 'US');
            break;
        case "IS":
            localStorage.setItem('YLCET_font', 'IS');
            break;
        case "CS":
            localStorage.setItem('YLCET_font', 'CS');
            break;
        case "TS":
            localStorage.setItem('YLCET_font', 'TS');
            break
    }
    Themes();
    Fonts();
    InitImages();
    RefreshBoard();
    customFunctionOnMove();
    if (hvitPV) {
        hvitPV.FontsPv();
        hvitPV.InitImages();
        hvitPV.RefreshBoard()
    }
    if (sortPV) {
        sortPV.FontsPv();
        sortPV.InitImages();
        sortPV.RefreshBoard()
    }
    if (boardAna) {
        boardAna.FontsAna();
        boardAna.InitImages();
        boardAna.RefreshBoard()
    }
    PvSel();
}

function CoorTog() {
    if (localStorage.getItem('TCEC_Coor') == 'On') {
        localStorage.setItem('TCEC_Coor', 'Off');
        Coor()
    } else {
        localStorage.setItem('TCEC_Coor', 'On');
        Coor()
    }
}

function FenTog() {
    if (localStorage.getItem('TCEC_FEN') == 'On') {
        localStorage.setItem('TCEC_FEN', 'Off');
        Fen()
    } else {
        localStorage.setItem('TCEC_FEN', 'On');
        Fen()
    }
}

function ChatTog() {
    if (localStorage.getItem('TCEC_Chat') == 'On') {
        localStorage.setItem('TCEC_Chat', 'Off');
        Chat()
    } else {
        localStorage.setItem('TCEC_Chat', 'On');
        Chat()
    }
}

function RotaTog() {
    if (localStorage.getItem('TCEC_Rota') == 'On') {
        localStorage.setItem('TCEC_Rota', 'Off');
        Rota()
    } else {
        localStorage.setItem('TCEC_Rota', 'On');
        Rota()
    }
}

function TwiTog() {
    "On" == localStorage.getItem("TCEC_Twiota") ?
        (localStorage.setItem("TCEC_Twiota", "Off"), Twota()) :
        (localStorage.setItem("TCEC_Twiota", "On"), Twota());
}

function HideETog() {
    if (localStorage.getItem('YLCET_HEva') == 'On') {
        localStorage.setItem('YLCET_HEva', 'Off');
        HideE();
        Graphs();
        customFunctionOnPgnGameLoad()
    } else {
        localStorage.setItem('YLCET_HEva', 'On');
        HideE();
        Graphs();
        customFunctionOnPgnGameLoad()
    }
}

function PvsTog(id) {
    if (id == "pvF") {
        localStorage.setItem('TCEC_PvS', 'First')
    } else if (id == "pvD") {
        localStorage.setItem('TCEC_PvS', 'Dive')
    } else if (id == "pv5") {
        localStorage.setItem('TCEC_PvS', 'Five')
    } else if (id == "pvL") {
        localStorage.setItem('TCEC_PvS', 'Last')
    }
    PvSel()
}

function PvSel() 
{
   wPv = window.whitePv;
   bPv = window.blackPv;
   if (wPv && wPv.SetInitialHalfmove) 
   {
      wPv.SetInitialHalfmove("commentplusone");
      wPv.GoToInitialHalfmove();
   }
   if (bPv && bPv.SetInitialHalfmove) 
   {
      bPv.SetInitialHalfmove("commentplusone");
      bPv.GoToInitialHalfmove();
   }
}

function SounTog() {
    if (localStorage.getItem('TCEC_Soun') == 'On') {
        localStorage.setItem('TCEC_Soun', 'Off');
        Soun()
    } else {
        localStorage.setItem('TCEC_Soun', 'On');
        Soun()
    }
}

function About() {
    theObj = document.getElementById("about_1")
    theObz = document.getElementById("credits_1")
    if (theObj) {
        if (theObj.style.display == "none") {
            theObj.style.display = "block"
        } else {
            theObj.style.display = "none"
        }
        if (theObz.style.display == "block") {
            theObz.style.display = "none"
        }
    }
}

function OBook() {
    theObj = document.getElementById("opening_1")
    if (theObj) {
        if (theObj.style.display == "none") {
            theObj.style.display = "block"
        } else {
            theObj.style.display = "none"
        }
    }
}

function Rules() {
    theObj = document.getElementById("rules_1")
    if (theObj) {
        if (theObj.style.display == "none") {
            theObj.style.display = "block"
        } else {
            theObj.style.display = "none"
        }
    }
}

function Credits() {
    theObj = document.getElementById("credits_1")
    if (theObj) {
        if (theObj.style.display == "none") {
            theObj.style.display = "block"
        } else {
            theObj.style.display = "none"
        }
    }
}

function ViewPGN(oneGameOnly) {
    var text = '';
    theObj = document.getElementById("view_PGN")
    theObj2 = document.getElementById("view_PGN_5")
    theObj3 = document.getElementById("ViewPGNPart")
    if (theObj) {
        if (theObj.style.display == "none") {
            theObj.style.display = "block";
            if (oneGameOnly) {
                text += fullPgnGame(currentGame) + "\n\n";
                theObj3.innerHTML = gameEvent[currentGame] + ',&nbsp;Round&nbsp;' + gameRound[currentGame] + '&nbsp;-&nbsp;' + gameWhite[currentGame] + '&nbsp;vs&nbsp;' + gameBlack[currentGame]
            } else {
                for (var ii = 0; ii < numberOfGames; ++ii) {
                    text += fullPgnGame(ii) + "\n\n"
                }
                theObj3.innerHTML = gameEvent[currentGame] + '&nbsp;-&nbsp;All&nbsp;Games'
            }
            theObj2.innerHTML = text
        } else {
            theObj.style.display = "none";
            theObj2.innerHTML = "";
            theObj3.innerHTML = ""
        }
    }
}

function keyUp(e) {
    if (e.shiftKey && e.keyCode == 67) {
        CoorTog()
    } else if (e.shiftKey && e.keyCode == 70) {
        FenTog()
    } else if (e.shiftKey && e.keyCode == 66) {
        ChatTog()
    } else if ((e.altKey && e.keyCode == 83) && currentPage == "live.html") {
        SounTog()
    } else if (e.altKey && e.keyCode == 76) {
        HideETog()
    } else if (e.altKey && e.keyCode == 78) {
        NighTog()
    } else if (e.altKey && e.keyCode == 82) {
        RotaTog()
    } else if ((e.shiftKey && e.keyCode == 83) && currentPage == "live.html") {
        window.open("dl.php?live=1", "_self")
    } else if ((e.shiftKey && e.keyCode == 69) && currentPage == "live.html") {
        window.open("dl.php?live=2", "_self")
    } else if (e.shiftKey && e.keyCode == 86) {
        savePgnData(!0);
    } else if ((e.shiftKey && e.keyCode == 87) && currentPage == "archive.php") {
        ViewPGN(!1)
    } else if ((e.shiftKey && e.keyCode == 82) && currentPage == "archive.php") {
        refreshGameList()
    } else if (e.shiftKey && e.keyCode == 65) {
        window.open("archive.php", "_self")
    } else if (e.shiftKey && e.keyCode == 76) {
        window.open("live.html", "_self")
    } else if (e.shiftKey && e.keyCode == 84) {
           TwiTog();
    } else if (e.shiftKey && e.keyCode == 79) {
           document.getElementById('order2').classList.add('orderno4');
    } else if (e.shiftKey && e.keyCode == 82) {
           document.getElementById('order2').classList.remove('orderno4');
    }
}
simpleAddEvent(document, "keyup", keyUp, !1);
(function($) {
    function Countdown() {
        this.regional = [];
        this.regional[''] = {
            labels: ['Years', 'Months', 'Weeks', 'Days', 'Hours', 'Minutes', 'Seconds'],
            labels1: ['Year', 'Month', 'Week', 'Day', 'Hour', 'Minute', 'Second'],
            compactLabels: ['y', 'm', 'w', 'd'],
            whichLabels: null,
            digits: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
            timeSeparator: ':',
            isRTL: !1
        };
        this._defaults = {
            until: null,
            since: null,
            timezone: null,
            serverSync: null,
            format: 'dHMS',
            layout: '',
            compact: !1,
            significant: 0,
            description: '',
            expiryUrl: '',
            expiryText: '',
            alwaysExpire: !1,
            onExpiry: null,
            onTick: null,
            tickInterval: 1
        };
        $.extend(this._defaults, this.regional['']);
        this._serverSyncs = [];
        var now = (typeof Date.now == 'function' ? Date.now : function() {
            return new Date().getTime()
        });
        var perfAvail = (window.performance && typeof window.performance.now == 'function');

        function timerCallBack(timestamp) {
            var drawStart = (timestamp < 1e12 ? (perfAvail ? (performance.now() + performance.timing.navigationStart) : now()) : timestamp || now());
            if (drawStart - animationStartTime >= 1000) {
                plugin._updateTargets();
                animationStartTime = drawStart
            }
            requestAnimationFrame(timerCallBack)
        }
        var requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || null;
        var animationStartTime = 0;
        if (!requestAnimationFrame || $.noRequestAnimationFrame) {
            $.noRequestAnimationFrame = null;
            setInterval(function() {
                plugin._updateTargets()
            }, 980)
        } else {
            animationStartTime = window.animationStartTime || window.webkitAnimationStartTime || window.mozAnimationStartTime || window.oAnimationStartTime || window.msAnimationStartTime || now();
            requestAnimationFrame(timerCallBack)
        }
    }
    var Y = 0;
    var O = 1;
    var W = 2;
    var D = 3;
    var H = 4;
    var M = 5;
    var S = 6;
    $.extend(Countdown.prototype, {
        markerClassName: 'hasCountdown',
        propertyName: 'countdown',
        _rtlClass: 'countdown_rtl',
        _sectionClass: 'countdown_section',
        _amountClass: 'countdown_amount',
        _rowClass: 'countdown_row',
        _holdingClass: 'countdown_holding',
        _showClass: 'countdown_show',
        _descrClass: 'countdown_descr',
        _timerTargets: [],
        setDefaults: function(options) {
            this._resetExtraLabels(this._defaults, options);
            $.extend(this._defaults, options || {})
        },
        UTCDate: function(tz, year, month, day, hours, mins, secs, ms) {
            if (typeof year == 'object' && year.constructor == Date) {
                ms = year.getMilliseconds();
                secs = year.getSeconds();
                mins = year.getMinutes();
                hours = year.getHours();
                day = year.getDate();
                month = year.getMonth();
                year = year.getFullYear()
            }
            var d = new Date();
            d.setUTCFullYear(year);
            d.setUTCDate(1);
            d.setUTCMonth(month || 0);
            d.setUTCDate(day || 1);
            d.setUTCHours(hours || 0);
            d.setUTCMinutes((mins || 0) - (Math.abs(tz) < 30 ? tz * 60 : tz));
            d.setUTCSeconds(secs || 0);
            d.setUTCMilliseconds(ms || 0);
            return d
        },
        periodsToSeconds: function(periods) {
            return periods[0] * 31557600 + periods[1] * 2629800 + periods[2] * 604800 + periods[3] * 86400 + periods[4] * 3600 + periods[5] * 60 + periods[6]
        },
        _attachPlugin: function(target, options) {
            target = $(target);
            if (target.hasClass(this.markerClassName)) {
                return
            }
            var inst = {
                options: $.extend({}, this._defaults),
                _periods: [0, 0, 0, 0, 0, 0, 0]
            };
            target.addClass(this.markerClassName).data(this.propertyName, inst);
            this._optionPlugin(target, options)
        },
        _addTarget: function(target) {
            if (!this._hasTarget(target)) {
                this._timerTargets.push(target)
            }
        },
        _hasTarget: function(target) {
            return ($.inArray(target, this._timerTargets) > -1)
        },
        _removeTarget: function(target) {
            this._timerTargets = $.map(this._timerTargets, function(value) {
                return (value == target ? null : value)
            })
        },
        _updateTargets: function() {
            for (var i = this._timerTargets.length - 1; i >= 0; i--) {
                this._updateCountdown(this._timerTargets[i])
            }
        },
        _optionPlugin: function(target, options, value) {
            target = $(target);
            var inst = target.data(this.propertyName);
            if (!options || (typeof options == 'string' && value == null)) {
                var name = options;
                options = (inst || {}).options;
                return (options && name ? options[name] : options)
            }
            if (!target.hasClass(this.markerClassName)) {
                return
            }
            options = options || {};
            if (typeof options == 'string') {
                var name = options;
                options = {};
                options[name] = value
            }
            if (options.layout) {
                options.layout = options.layout.replace(/&lt;/g, '<').replace(/&gt;/g, '>')
            }
            this._resetExtraLabels(inst.options, options);
            var timezoneChanged = (inst.options.timezone != options.timezone);
            $.extend(inst.options, options);
            this._adjustSettings(target, inst, options.until != null || options.since != null || timezoneChanged);
            var now = new Date();
            if ((inst._since && inst._since < now) || (inst._until && inst._until > now)) {
                this._addTarget(target[0])
            }
            this._updateCountdown(target, inst)
        },
        _updateCountdown: function(target, inst) {
            var $target = $(target);
            inst = inst || $target.data(this.propertyName);
            if (!inst) {
                return
            }
            $target.html(this._generateHTML(inst)).toggleClass(this._rtlClass, inst.options.isRTL);
            if ($.isFunction(inst.options.onTick)) {
                var periods = inst._hold != 'lap' ? inst._periods : this._calculatePeriods(inst, inst._show, inst.options.significant, new Date());
                if (inst.options.tickInterval == 1 || this.periodsToSeconds(periods) % inst.options.tickInterval == 0) {
                    inst.options.onTick.apply(target, [periods])
                }
            }
            var expired = inst._hold != 'pause' && (inst._since ? inst._now.getTime() < inst._since.getTime() : inst._now.getTime() >= inst._until.getTime());
            if (expired && !inst._expiring) {
                inst._expiring = !0;
                if (this._hasTarget(target) || inst.options.alwaysExpire) {
                    this._removeTarget(target);
                    if ($.isFunction(inst.options.onExpiry)) {
                        inst.options.onExpiry.apply(target, [])
                    }
                    if (inst.options.expiryText) {
                        var layout = inst.options.layout;
                        inst.options.layout = inst.options.expiryText;
                        this._updateCountdown(target, inst);
                        inst.options.layout = layout
                    }
                    if (inst.options.expiryUrl) {
                        window.location = inst.options.expiryUrl
                    }
                }
                inst._expiring = !1
            } else if (inst._hold == 'pause') {
                this._removeTarget(target)
            }
            $target.data(this.propertyName, inst)
        },
        _resetExtraLabels: function(base, options) {
            var changingLabels = !1;
            for (var n in options) {
                if (n != 'whichLabels' && n.match(/[Ll]abels/)) {
                    changingLabels = !0;
                    break
                }
            }
            if (changingLabels) {
                for (var n in base) {
                    if (n.match(/[Ll]abels[02-9]|compactLabels1/)) {
                        base[n] = null
                    }
                }
            }
        },
        _adjustSettings: function(target, inst, recalc) {
            var now;
            var serverOffset = 0;
            var serverEntry = null;
            for (var i = 0; i < this._serverSyncs.length; i++) {
                if (this._serverSyncs[i][0] == inst.options.serverSync) {
                    serverEntry = this._serverSyncs[i][1];
                    break
                }
            }
            if (serverEntry != null) {
                serverOffset = (inst.options.serverSync ? serverEntry : 0);
                now = new Date()
            } else {
                var serverResult = ($.isFunction(inst.options.serverSync) ? inst.options.serverSync.apply(target, []) : null);
                now = new Date();
                serverOffset = (serverResult ? now.getTime() - serverResult.getTime() : 0);
                this._serverSyncs.push([inst.options.serverSync, serverOffset])
            }
            var timezone = inst.options.timezone;
            timezone = (timezone == null ? -now.getTimezoneOffset() : timezone);
            if (recalc || (!recalc && inst._until == null && inst._since == null)) {
                inst._since = inst.options.since;
                if (inst._since != null) {
                    inst._since = this.UTCDate(timezone, this._determineTime(inst._since, null));
                    if (inst._since && serverOffset) {
                        inst._since.setMilliseconds(inst._since.getMilliseconds() + serverOffset)
                    }
                }
                inst._until = this.UTCDate(timezone, this._determineTime(inst.options.until, now));
                if (serverOffset) {
                    inst._until.setMilliseconds(inst._until.getMilliseconds() + serverOffset)
                }
            }
            inst._show = this._determineShow(inst)
        },
        _destroyPlugin: function(target) {
            target = $(target);
            if (!target.hasClass(this.markerClassName)) {
                return
            }
            this._removeTarget(target[0]);
            target.removeClass(this.markerClassName).empty().removeData(this.propertyName)
        },
        _pausePlugin: function(target) {
            this._hold(target, 'pause')
        },
        _lapPlugin: function(target) {
            this._hold(target, 'lap')
        },
        _resumePlugin: function(target) {
            this._hold(target, null)
        },
        _hold: function(target, hold) {
            var inst = $.data(target, this.propertyName);
            if (inst) {
                if (inst._hold == 'pause' && !hold) {
                    inst._periods = inst._savePeriods;
                    var sign = (inst._since ? '-' : '+');
                    inst[inst._since ? '_since' : '_until'] = this._determineTime(sign + inst._periods[0] + 'y' + sign + inst._periods[1] + 'o' + sign + inst._periods[2] + 'w' + sign + inst._periods[3] + 'd' + sign + inst._periods[4] + 'h' + sign + inst._periods[5] + 'm' + sign + inst._periods[6] + 's');
                    this._addTarget(target)
                }
                inst._hold = hold;
                inst._savePeriods = (hold == 'pause' ? inst._periods : null);
                $.data(target, this.propertyName, inst);
                this._updateCountdown(target, inst)
            }
        },
        _getTimesPlugin: function(target) {
            var inst = $.data(target, this.propertyName);
            return (!inst ? null : (inst._hold == 'pause' ? inst._savePeriods : (!inst._hold ? inst._periods : this._calculatePeriods(inst, inst._show, inst.options.significant, new Date()))))
        },
        _determineTime: function(setting, defaultTime) {
            var offsetNumeric = function(offset) {
                var time = new Date();
                time.setTime(time.getTime() + offset * 1000);
                return time
            };
            var offsetString = function(offset) {
                offset = offset.toLowerCase();
                var time = new Date();
                var year = time.getFullYear();
                var month = time.getMonth();
                var day = time.getDate();
                var hour = time.getHours();
                var minute = time.getMinutes();
                var second = time.getSeconds();
                var pattern = /([+-]?[0-9]+)\s*(s|m|h|d|w|o|y)?/g;
                var matches = pattern.exec(offset);
                while (matches) {
                    switch (matches[2] || 's') {
                        case 's':
                            second += parseInt(matches[1], 10);
                            break;
                        case 'm':
                            minute += parseInt(matches[1], 10);
                            break;
                        case 'h':
                            hour += parseInt(matches[1], 10);
                            break;
                        case 'd':
                            day += parseInt(matches[1], 10);
                            break;
                        case 'w':
                            day += parseInt(matches[1], 10) * 7;
                            break;
                        case 'o':
                            month += parseInt(matches[1], 10);
                            day = Math.min(day, plugin._getDaysInMonth(year, month));
                            break;
                        case 'y':
                            year += parseInt(matches[1], 10);
                            day = Math.min(day, plugin._getDaysInMonth(year, month));
                            break
                    }
                    matches = pattern.exec(offset)
                }
                return new Date(year, month, day, hour, minute, second, 0)
            };
            var time = (setting == null ? defaultTime : (typeof setting == 'string' ? offsetString(setting) : (typeof setting == 'number' ? offsetNumeric(setting) : setting)));
            if (time) time.setMilliseconds(0);
            return time
        },
        _getDaysInMonth: function(year, month) {
            return 32 - new Date(year, month, 32).getDate()
        },
        _normalLabels: function(num) {
            return num
        },
        _generateHTML: function(inst) {
            var self = this;
            inst._periods = (inst._hold ? inst._periods : this._calculatePeriods(inst, inst._show, inst.options.significant, new Date()));
            var shownNonZero = !1;
            var showCount = 0;
            var sigCount = inst.options.significant;
            var show = $.extend({}, inst._show);
            for (var period = Y; period <= S; period++) {
                shownNonZero |= (inst._show[period] == '?' && inst._periods[period] > 0);
                show[period] = (inst._show[period] == '?' && !shownNonZero ? null : inst._show[period]);
                showCount += (show[period] ? 1 : 0);
                sigCount -= (inst._periods[period] > 0 ? 1 : 0)
            }
            var showSignificant = [!1, !1, !1, !1, !1, !1, !1];
            for (var period = S; period >= Y; period--) {
                if (inst._show[period]) {
                    if (inst._periods[period]) {
                        showSignificant[period] = !0
                    } else {
                        showSignificant[period] = sigCount > 0;
                        sigCount--
                    }
                }
            }
            var labels = (inst.options.compact ? inst.options.compactLabels : inst.options.labels);
            var whichLabels = inst.options.whichLabels || this._normalLabels;
            var showCompact = function(period) {
                var labelsNum = inst.options['compactLabels' + whichLabels(inst._periods[period])];
                return (show[period] ? self._translateDigits(inst, inst._periods[period]) + (labelsNum ? labelsNum[period] : labels[period]) + ' ' : '')
            };
            var showFull = function(period) {
                var labelsNum = inst.options['labels' + whichLabels(inst._periods[period])];
                return ((!inst.options.significant && show[period]) || (inst.options.significant && showSignificant[period]) ? '<span class="' + plugin._sectionClass + '">' + '<span class="' + plugin._amountClass + '">' + self._translateDigits(inst, inst._periods[period]) + '</span><br/>' + (labelsNum ? labelsNum[period] : labels[period]) + '</span>' : '')
            };
            return (inst.options.layout ? this._buildLayout(inst, show, inst.options.layout, inst.options.compact, inst.options.significant, showSignificant) : ((inst.options.compact ? '<span class="' + this._rowClass + ' ' + this._amountClass + (inst._hold ? ' ' + this._holdingClass : '') + '">' + showCompact(Y) + showCompact(O) + showCompact(W) + showCompact(D) + (show[H] ? this._minDigits(inst, inst._periods[H], 2) : '') + (show[M] ? (show[H] ? inst.options.timeSeparator : '') + this._minDigits(inst, inst._periods[M], 2) : '') + (show[S] ? (show[H] || show[M] ? inst.options.timeSeparator : '') + this._minDigits(inst, inst._periods[S], 2) : '') : '<span class="' + this._rowClass + ' ' + this._showClass + (inst.options.significant || showCount) + (inst._hold ? ' ' + this._holdingClass : '') + '">' + showFull(Y) + showFull(O) + showFull(W) + showFull(D) + showFull(H) + showFull(M) + showFull(S)) + '</span>' + (inst.options.description ? '<span class="' + this._rowClass + ' ' + this._descrClass + '">' + inst.options.description + '</span>' : '')))
        },
        _buildLayout: function(inst, show, layout, compact, significant, showSignificant) {
            var labels = inst.options[compact ? 'compactLabels' : 'labels'];
            var whichLabels = inst.options.whichLabels || this._normalLabels;
            var labelFor = function(index) {
                return (inst.options[(compact ? 'compactLabels' : 'labels') + whichLabels(inst._periods[index])] || labels)[index]
            };
            var digit = function(value, position) {
                return inst.options.digits[Math.floor(value / position) % 10]
            };
            var subs = {
                desc: inst.options.description,
                sep: inst.options.timeSeparator,
                yl: labelFor(Y),
                yn: this._minDigits(inst, inst._periods[Y], 1),
                ynn: this._minDigits(inst, inst._periods[Y], 2),
                ynnn: this._minDigits(inst, inst._periods[Y], 3),
                y1: digit(inst._periods[Y], 1),
                y10: digit(inst._periods[Y], 10),
                y100: digit(inst._periods[Y], 100),
                y1000: digit(inst._periods[Y], 1000),
                ol: labelFor(O),
                on: this._minDigits(inst, inst._periods[O], 1),
                onn: this._minDigits(inst, inst._periods[O], 2),
                onnn: this._minDigits(inst, inst._periods[O], 3),
                o1: digit(inst._periods[O], 1),
                o10: digit(inst._periods[O], 10),
                o100: digit(inst._periods[O], 100),
                o1000: digit(inst._periods[O], 1000),
                wl: labelFor(W),
                wn: this._minDigits(inst, inst._periods[W], 1),
                wnn: this._minDigits(inst, inst._periods[W], 2),
                wnnn: this._minDigits(inst, inst._periods[W], 3),
                w1: digit(inst._periods[W], 1),
                w10: digit(inst._periods[W], 10),
                w100: digit(inst._periods[W], 100),
                w1000: digit(inst._periods[W], 1000),
                dl: labelFor(D),
                dn: this._minDigits(inst, inst._periods[D], 1),
                dnn: this._minDigits(inst, inst._periods[D], 2),
                dnnn: this._minDigits(inst, inst._periods[D], 3),
                d1: digit(inst._periods[D], 1),
                d10: digit(inst._periods[D], 10),
                d100: digit(inst._periods[D], 100),
                d1000: digit(inst._periods[D], 1000),
                hl: labelFor(H),
                hn: this._minDigits(inst, inst._periods[H], 1),
                hnn: this._minDigits(inst, inst._periods[H], 2),
                hnnn: this._minDigits(inst, inst._periods[H], 3),
                h1: digit(inst._periods[H], 1),
                h10: digit(inst._periods[H], 10),
                h100: digit(inst._periods[H], 100),
                h1000: digit(inst._periods[H], 1000),
                ml: labelFor(M),
                mn: this._minDigits(inst, inst._periods[M], 1),
                mnn: this._minDigits(inst, inst._periods[M], 2),
                mnnn: this._minDigits(inst, inst._periods[M], 3),
                m1: digit(inst._periods[M], 1),
                m10: digit(inst._periods[M], 10),
                m100: digit(inst._periods[M], 100),
                m1000: digit(inst._periods[M], 1000),
                sl: labelFor(S),
                sn: this._minDigits(inst, inst._periods[S], 1),
                snn: this._minDigits(inst, inst._periods[S], 2),
                snnn: this._minDigits(inst, inst._periods[S], 3),
                s1: digit(inst._periods[S], 1),
                s10: digit(inst._periods[S], 10),
                s100: digit(inst._periods[S], 100),
                s1000: digit(inst._periods[S], 1000)
            };
            var html = layout;
            for (var i = Y; i <= S; i++) {
                var period = 'yowdhms'.charAt(i);
                var re = new RegExp('\\{' + period + '<\\}([\\s\\S]*)\\{' + period + '>\\}', 'g');
                html = html.replace(re, ((!significant && show[i]) || (significant && showSignificant[i]) ? '$1' : ''))
            }
            $.each(subs, function(n, v) {
                var re = new RegExp('\\{' + n + '\\}', 'g');
                html = html.replace(re, v)
            });
            return html
        },
        _minDigits: function(inst, value, len) {
            value = '' + value;
            if (value.length >= len) {
                return this._translateDigits(inst, value)
            }
            value = '0000000000' + value;
            return this._translateDigits(inst, value.substr(value.length - len))
        },
        _translateDigits: function(inst, value) {
            return ('' + value).replace(/[0-9]/g, function(digit) {
                return inst.options.digits[digit]
            })
        },
        _determineShow: function(inst) {
            var format = inst.options.format;
            var show = [];
            show[Y] = (format.match('y') ? '?' : (format.match('Y') ? '!' : null));
            show[O] = (format.match('o') ? '?' : (format.match('O') ? '!' : null));
            show[W] = (format.match('w') ? '?' : (format.match('W') ? '!' : null));
            show[D] = (format.match('d') ? '?' : (format.match('D') ? '!' : null));
            show[H] = (format.match('h') ? '?' : (format.match('H') ? '!' : null));
            show[M] = (format.match('m') ? '?' : (format.match('M') ? '!' : null));
            show[S] = (format.match('s') ? '?' : (format.match('S') ? '!' : null));
            return show
        },
        _calculatePeriods: function(inst, show, significant, now) {
            inst._now = now;
            inst._now.setMilliseconds(0);
            var until = new Date(inst._now.getTime());
            if (inst._since) {
                if (now.getTime() < inst._since.getTime()) {
                    inst._now = now = until
                } else {
                    now = inst._since
                }
            } else {
                until.setTime(inst._until.getTime());
                if (now.getTime() > inst._until.getTime()) {
                    inst._now = now = until
                }
            }
            var periods = [0, 0, 0, 0, 0, 0, 0];
            if (show[Y] || show[O]) {
                var lastNow = plugin._getDaysInMonth(now.getFullYear(), now.getMonth());
                var lastUntil = plugin._getDaysInMonth(until.getFullYear(), until.getMonth());
                var sameDay = (until.getDate() == now.getDate() || (until.getDate() >= Math.min(lastNow, lastUntil) && now.getDate() >= Math.min(lastNow, lastUntil)));
                var getSecs = function(date) {
                    return (date.getHours() * 60 + date.getMinutes()) * 60 + date.getSeconds()
                };
                var months = Math.max(0, (until.getFullYear() - now.getFullYear()) * 12 + until.getMonth() - now.getMonth() + ((until.getDate() < now.getDate() && !sameDay) || (sameDay && getSecs(until) < getSecs(now)) ? -1 : 0));
                periods[Y] = (show[Y] ? Math.floor(months / 12) : 0);
                periods[O] = (show[O] ? months - periods[Y] * 12 : 0);
                now = new Date(now.getTime());
                var wasLastDay = (now.getDate() == lastNow);
                var lastDay = plugin._getDaysInMonth(now.getFullYear() + periods[Y], now.getMonth() + periods[O]);
                if (now.getDate() > lastDay) {
                    now.setDate(lastDay)
                }
                now.setFullYear(now.getFullYear() + periods[Y]);
                now.setMonth(now.getMonth() + periods[O]);
                if (wasLastDay) {
                    now.setDate(lastDay)
                }
            }
            var diff = Math.floor((until.getTime() - now.getTime()) / 1000);
            var extractPeriod = function(period, numSecs) {
                periods[period] = (show[period] ? Math.floor(diff / numSecs) : 0);
                diff -= periods[period] * numSecs
            };
            extractPeriod(W, 604800);
            extractPeriod(D, 86400);
            extractPeriod(H, 3600);
            extractPeriod(M, 60);
            extractPeriod(S, 1);
            if (diff > 0 && !inst._since) {
                var multiplier = [1, 12, 4.3482, 7, 24, 60, 60];
                var lastShown = S;
                var max = 1;
                for (var period = S; period >= Y; period--) {
                    if (show[period]) {
                        if (periods[lastShown] >= max) {
                            periods[lastShown] = 0;
                            diff = 1
                        }
                        if (diff > 0) {
                            periods[period]++;
                            diff = 0;
                            lastShown = period;
                            max = 1
                        }
                    }
                    max *= multiplier[period]
                }
            }
            if (significant) {
                for (var period = Y; period <= S; period++) {
                    if (significant && periods[period]) {
                        significant--
                    } else if (!significant) {
                        periods[period] = 0
                    }
                }
            }
            return periods
        }
    });
    var getters = ['getTimes'];

    function isNotChained(command, otherArgs) {
        if (command == 'option' && (otherArgs.length == 0 || (otherArgs.length == 1 && typeof otherArgs[0] == 'string'))) {
            return !0
        }
        return $.inArray(command, getters) > -1
    }
    $.fn.countdown = function(options) {
        var otherArgs = Array.prototype.slice.call(arguments, 1);
        if (isNotChained(options, otherArgs)) {
            return plugin['_' + options + 'Plugin'].apply(plugin, [this[0]].concat(otherArgs))
        }
        return this.each(function() {
            if (typeof options == 'string') {
                if (!plugin['_' + options + 'Plugin']) {
                    throw 'Unknown command: ' + options
                }
                plugin['_' + options + 'Plugin'].apply(plugin, [this].concat(otherArgs))
            } else {
                plugin._attachPlugin(this, options || {})
            }
        })
    };
    var plugin = $.countdown = new Countdown()
})(jQuery);
(function($) {
    $.fn.aToolTip = function(options) {
        var defaults = {
                closeTipBtn: 'aToolTipCloseBtn',
                toolTipId: 'aToolTip',
                fixed: !1,
                clickIt: !0,
                inSpeed: 200,
                outSpeed: 100,
                tipContent: '',
                toolTipClass: 'defaultTheme',
                xOffset: 0,
                yOffset: 0,
                onShow: null,
                onHide: null
            },
            settings = $.extend({}, defaults, options);
        return this.each(function() {
            var obj = $(this);
            if (obj.attr('data-tooltip')) {
                var tipContent = obj.attr('data-tooltip')
            }
            var buildaToolTip = function() {
                    $('body').append("<div id='" + settings.toolTipId + "' class='" + settings.toolTipClass + "'><div class='aToolTip_2'><div class='aToolTip_3'><div class='top_item_image'><img src='./img/thinking5w.gif' height='16px' width='16px' /></div><div class='top_item'>" + obj.text() + "</div><div class='tall_a_17'><a id='" + settings.closeTipBtn + "' alt='Close'><div class='tall_a_18'></div></a></div></div><div class='aToolTipContent'>" + tipContent + "</div></div></div>")
                },
                positionaToolTip = function() {
                    var rightEdge = (obj.offset().left + obj.outerWidth() + settings.xOffset) + 252;
                    var overshoot = rightEdge - $(window).width();
                    var leftOffset = 0;
                    if (overshoot > 0) {
                        leftOffset = overshoot
                    }
                    $('#' + settings.toolTipId).css({
                        top: (obj.offset().top - $('#' + settings.toolTipId).outerHeight() - settings.yOffset) + 'px',
                        left: (obj.offset().left + obj.outerWidth() + settings.xOffset - leftOffset) + 'px'
                    }).stop().fadeIn(settings.inSpeed, function() {
                        if ($.isFunction(settings.onShow)) {
                            settings.onShow(obj)
                        }
                    })
                },
                removeaToolTip = function() {
                    $('#' + settings.toolTipId).stop().fadeOut(settings.outSpeed, function() {
                        $(this).remove();
                        if ($.isFunction(settings.onHide)) {
                            settings.onHide(obj)
                        }
                    })
                };
            if (tipContent && settings.clickIt) {
                obj.click(function(el) {
                    $('#' + settings.toolTipId).remove();
                    obj.attr({
                        title: ''
                    });
                    buildaToolTip();
                    positionaToolTip();
                    $('#' + settings.closeTipBtn).click(function() {
                        removeaToolTip();
                        return !1
                    });
                    return !1
                })
            }
            if (!settings.fixed && !settings.clickIt) {
                obj.mousemove(function(el) {
                    $('#' + settings.toolTipId).css({
                        top: (el.pageY - $('#' + settings.toolTipId).outerHeight() - settings.yOffset),
                        left: (el.pageX + settings.xOffset)
                    })
                })
            }
        })
    }
})(jQuery);
var elapsedMoveTimeoutW = null;
var elapsedMoveTimeoutB = null;

function updateElapsedTimeCounterB(whenStartedB) {
    if (!whenStartedB) {
        whenStartedB = (new Date()).getTime()
    }
    elapsedSeconds = Math.floor(((new Date()).getTime() - whenStartedB) / 1000);
    elapsedSeconds = Math.floor(elapsedSeconds + diffLastmoveTime);
    if (elapsedSeconds < 0)
    {
       elapsedSeconds = 0;
    }  
    if ((theObject = document.getElementById("elapsedTimeB")) && gameResult[currentGame] == "*") {
        seconds = elapsedSeconds % 60;
        minutes = (elapsedSeconds - seconds) / 60;
        theObject.innerHTML = "[" + minutes + ":" + (seconds < 10 ? "0" : "") + seconds + "]"
        clknew = document.getElementById("whiteClock");
        clknew1 = document.getElementById("whiteClockl");
        clknew1.innerHTML = clknew.innerHTML;
        if (lastWhitePly == PlyNumber) {
            clknew = document.getElementById("blackClock");
            if (clknew && clknew.innerHTML != "no info") {
                clksec = parseFloat(clock2sec(clknew.innerHTML));
                elapsedSeconds = clksec - elapsedSeconds;
                clknew = document.getElementById("blackClockl");
                clknew.innerHTML = new Date(elapsedSeconds * 1000).toISOString().substr(11, 8);
            }
            var gduration = document.getElementById("GameDuration");
            if (gduration) {
                gameDuration();
                var SchedendTime1 = SchedendTime;
                gduration.innerHTML = new Date(SchedendTime1).toISOString().substr(11, 8);
            }
        } else {
            clknew = document.getElementById("blackClockl");
            clknew1 = document.getElementById("blackClock");
            clknew.innerHTML = clknew1.innerHTML;
        }
    }
    if (elapsedMoveTimeoutB) {
        clearTimeout(elapsedMoveTimeoutB)
    }
    elapsedMoveTimeoutB = setTimeout("updateElapsedTimeCounterB(" + whenStartedB + ");", 500)
}

function updateElapsedTimeCounterW(whenStartedW) {
    if (!whenStartedW) {
        whenStartedW = (new Date()).getTime()
    }
    if (whenStartedW)
    {
        elapsedSeconds = Math.floor(((new Date()).getTime() - whenStartedW) / 1000);
    }
    elapsedSeconds = Math.floor(elapsedSeconds + diffLastmoveTime);
    if (elapsedSeconds < 0)
    {
       elapsedSeconds = 0;
    }  
    if ((theObject = document.getElementById("elapsedTimeW")) && gameResult[currentGame] == "*") {
        seconds = elapsedSeconds % 60;
        minutes = (elapsedSeconds - seconds) / 60;
        theObject.innerHTML = "[" + minutes + ":" + (seconds < 10 ? "0" : "") + seconds + "]"
        clknew = document.getElementById("blackClock");
        clknew1 = document.getElementById("blackClockl");
        clknew1.innerHTML = clknew.innerHTML;
        if ((lastBlackPly) == PlyNumber) {
            clknew = document.getElementById("whiteClock");
            if (clknew && clknew.innerHTML != "no info") {
                clksec = parseFloat(clock2sec(clknew.innerHTML));
                if (clksec)
                {
                    elapsedSeconds = clksec - elapsedSeconds;
                }
                clknew = document.getElementById("whiteClockl");
                clknew.innerHTML = new Date(elapsedSeconds * 1000).toISOString().substr(11, 8);
            }
            var gduration = document.getElementById("GameDuration");
            if (gduration) {
                gameDuration();
                var SchedendTime1 = SchedendTime;
                gduration.innerHTML = new Date(SchedendTime1).toISOString().substr(11, 8);
            }
        } else {
            clknew = document.getElementById("whiteClockl");
            clknew1 = document.getElementById("whiteClock");
            clknew.innerHTML = clknew1.innerHTML;
        }
    }
    if (elapsedMoveTimeoutW) {
        clearTimeout(elapsedMoveTimeoutW)
    }
    elapsedMoveTimeoutW = setTimeout("updateElapsedTimeCounterW(" + whenStartedW + ");", 500)
}

function startElapsedTimeCounterW() {
    updateElapsedTimeCounterW()
}

function startElapsedTimeCounterB() {
    updateElapsedTimeCounterB()
}

function resetElapsedTimeCounterW() {
    if (elapsedMoveTimeoutW) {
        clearTimeout(elapsedMoveTimeoutW)
    }
    if (theObject = document.getElementById("elapsedTimeW")) {
        theObject.innerHTML = ""
    }
}

function resetElapsedTimeCounterB() {
    if (elapsedMoveTimeoutB) {
        clearTimeout(elapsedMoveTimeoutB)
    }
    if (theObject = document.getElementById("elapsedTimeB")) {
        theObject.innerHTML = ""
    }
}
var oldLastPgnGameLength = -1;
var oldNumberOfGames = -1;

function customFunctionOnPgnTextLoad() {
    var numGmObj = document.getElementById('numGm');
    if (numGmObj) {
        document.getElementById('numGm').innerHTML = numberOfGames;
    }
    if (LiveBroadcastStarted && !LiveBroadcastEnded) {
        sideToMove = ((StartPly + PlyNumber) % 2 === 0);
        text = sideToMove ? 'white' : 'black';
        if ((oldNumberOfGames != numberOfGames) || (oldLastPgnGameLength != pgnGame[numberOfGames - 1].length)) {
            if (text == "white") {
                startElapsedTimeCounterW();
                resetElapsedTimeCounterB()
            } else {
                startElapsedTimeCounterB();
                resetElapsedTimeCounterW()
            }
        }
    } else {
        resetElapsedTimeCounterW();
        resetElapsedTimeCounterB()
    }
    oldNumberOfGames = numberOfGames;
    oldLastPgnGameLength = pgnGame[numberOfGames - 1].length
}

function ylcetGetPGnWhite() {
    var pvPgn = '[FEN "' + fenPositions[lastWhitePly - 1] + '"] ' + (whitePvMoves || ' { no info} ');
    //////console.log ("ylcetGetPGnWhite:" + pvPgn);
    return pvPgn;
}

function ylcetGetPGnBlack() {
    pvPgn = '[FEN "' + fenPositions[lastBlackPly - 1] + '"] ' + (blackPvMoves || ' { no info} ');
    return pvPgn;
}

window.Clipboard = (function(window, document, navigator) {
    var textArea,
        input,
        copy;

    function isOS() {
        return navigator.userAgent.match(/ipad|iphone/i);
    }

    function createTextArea(text) {
        textArea = document.createElement('textArea');
        textArea.id = "aruntext";
        input = $('#aruntext');
        input.val(text);
        textArea.value = text;
        document.body.appendChild(textArea);
    }

    function selectText() {
        var range,
            selection;

        if (isOS()) {
            var el = input.get(0);
            var editable = el.contentEditable;
            var readOnly = el.readOnly;
            el.contentEditable = true;
            el.readOnly = true;
            var range = document.createRange();
            range.selectNodeContents(el);
            var sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
            el.setSelectionRange(0, 999999);
            el.contentEditable = editable;
            el.readOnly = readOnly;
        } else {
            textArea.select();
        }
    }

    function copyToClipboard() {
        document.execCommand('copy');
        document.body.removeChild(textArea);
    }

    copy = function(text) {
        createTextArea(text);
        selectText();
        copyToClipboard();
        //$input.blur();
    };

    return {
        copy: copy
    };
})(window, document, navigator);

$(function() {
 
    $(".drag").draggable({

      // ドラッグ開始時
      start : function (event , ui){
        var target = document.getElementById(this.id);
        target.style.zIndex=100;
      },

      // ドラッグ終了時
      stop : function (event , ui){
          // ////console.log(event , ui);

          var nowPosition = new Object();
          var newPosition = new Array();

          // 現在のポジションを取得する
          for (var i = 1; i <= 3; i++) {
              var positionData = getPosition(i);
              nowPosition = {'name':'order'+i,'position':positionData};

               newPosition.push(nowPosition);
          }

          // ソート
          newPosition.sort(function(a,b){
                  if( a['position'] > b['position'] ) return -1;
                  if( a['position'] < b['position'] ) return 1;
                  return 0;
          });

          // Orderを入れる
          var number = 0;
          for (var i = newPosition.length; i--; ) {

              var tmpItem = document.getElementById(newPosition[i].name);
              tmpItem.style.order = number;
              tmpItem.style.left = 0;
              tmpItem.style.top = 0;

              number ++;
          }

        // 最後にz-indexを元に戻す
        var target = document.getElementById(this.id);
        target.style.zIndex=0;
      }

    });

    // position取得の関数
    function getPosition(item){
      var tmpItem = document.getElementById('order'+item);
      // console.dir(tmpItem);
      return tmpItem.offsetLeft;
    }
});
