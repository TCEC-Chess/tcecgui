boardEl = $('#board');
pvBoardElb = $('#pv-boardb');
pvBoardElbc = $('#pv-boardbc');
pvBoardElw = $('#pv-boardw');
pvBoardElwc = $('#pv-boardwc');
pvBoardEla = $('#pv-boarda');
pvBoardElac = $('#pv-boardac');

var squareToHighlight = '';
var pvSquareToHighlight = '';
var crossTableInitialized = false;
var standTableInitialized = false;
var gameActive = false;

var squareClass = 'square-55d63';

var whiteToPlay = true;
var whiteTimeRemaining = 0;
var blackTimeRemaining = 0;
var whiteTimeUsed = 0;
var blackTimeUsed = 0;
var whiteMoveStarted = 0;
var blackMoveStarted = 0;
var blackClockInterval = '';
var whiteClockInterval = '';

var defaultStartTime = 0;

var viewingActiveMove = true;
var loadedPlies = 0;
var activePly = 0;

var loadedPgn = '';

var activeFen = '';
var lastMove = '';
var currentPosition = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
var currentPositionWhite = currentPosition;
var currentPositionBlack = currentPosition;
var analysFen = currentPosition;
var bookmove = 0;

var darkMode = 0;
var pageNum = 1;
var gamesDone = 0;
var timeDiff = 0;
var timeDiffRead = 0;
var prevPgnData = 0;
var playSound = 1;

var liveEngineEval1 = [];
var liveEngineEval2 = [];
var debug = 0;
var whiteEngineFull = null;
var blackEngineFull = null;
var prevwhiteEngineFull = null;
var prevblackEngineFull = null   
var prevwhiteEngineFullSc = null;
var prevblackEngineFullSc = null   
var h2hRetryCount = 0;
var scrRetryCount = 0;

var livePVHist = [];
var whitePv = [];
var blackPv = [];
var livePvs = [];
var activePv = [];
var highlightpv = 0;
var showLivEng1 = 1;
var showLivEng2 = 1;
var activePvKey = [];
var activePvColor = '';
var plyDiff = 0;
var selectedId = 0;
var highlightClass = 'highlight-white highlight-none';
var highlightClassPv = 'highlight-white highlight-none';
var boardNotation = true;
var boardNotationPv = true;
var boardArrows = true;
var tcecElo = 1;
var engGlobData = 0;
var tourInfo = {};
var btheme = "chess24";
var ptheme = "chess24";
var oldSchedData = null;

var moveFrom = null;
var moveFromPvW = null
var moveFromPvB = null
var moveFromPvL = null
var moveTo = null;
var moveToPvW = null;
var moveToPvB = null;
var moveToPvL = null;
var hideDownPv = 0;

var crosstableData = null;
var crossCrash = 0;

var twitchAccount = 'TCEC_Chess_TV';
var twitchChatUrl = 'https://www.twitch.tv/embed/' + twitchAccount + '/chat';
var twitchSRCIframe = 'https://player.twitch.tv/?channel=' + twitchAccount;

var eventNameHeader = 0;
var lastRefreshTime = 0;
var userCount = 0;

var onMoveEnd = function() {
  boardEl.find('.square-' + squareToHighlight)
    .addClass(highlightClass);
};

var onMoveEndPv = function() {
  pvBoardElb.find('.square-' + pvSquareToHighlight)
    .addClass(highlightClassPv);
}

function getUserS()
{
   socket.emit('getusers', 'd');
}

function updateRefresh()
{
   var reSyncInterval = 30;
   if (!lastRefreshTime)
   {
      socket.emit('refreshdata', 'data is emitted');
      lastRefreshTime = moment();
      $('#board-to-sync').find('i').removeClass('fa-retweet');
      $('#board-to-sync').find('i').addClass('fa-ban');
      $('#board-to-sync').addClass('disabled');
      setTimeout(function() {
         $('#board-to-sync').find('i').removeClass('fa-ban');
         $('#board-to-sync').removeClass('disabled');
         $('#board-to-sync').find('i').addClass('fa-retweet');
         lastRefreshTime = 0;
         }, reSyncInterval * 1000);
   }
}

function updateAll()
{
   updatePgn(1);
   setTimeout(function() { updateTables(); }, 5000);
}

function plog(message, debugl)
{
   if (debugl == undefined)
   {
      debugl = 1;
   }

   if (debugl <= debug)
   {
      console.log (message);
   }
}

function updatePgnDataMain(data)
{
   loadedPgn = data;

   if (!prevPgnData)
   {
      updateEngineInfo('#whiteenginetable', '#white-engine-info', data.WhiteEngineOptions);
      updateEngineInfo('#blackenginetable', '#black-engine-info', data.BlackEngineOptions);
   }
   else
   {
      if (data.WhiteEngineOptions != prevPgnData.WhiteEngineOptions)
      {
         updateEngineInfo('#whiteenginetable', '#white-engine-info', data.WhiteEngineOptions);
      }
   }
   setPgn(data);
}

function updatePgnData(data, read)
{
   timeDiff = 0;
   updatePgnDataMain(data);
}

function updatePgn(resettime)
{
   axios.get('live.json?no-cache' + (new Date()).getTime())
   .then(function (response) 
   {
      if (!resettime)
      {
         var milliseconds = (new Date).getTime();
         var lastMod = new Date(response.headers["last-modified"]);
         var currTime = new Date(response.headers["date"]);
         timeDiff = currTime.getTime() - lastMod.getTime();
      }
      prevPgnData = 0;
      updatePgnDataMain(response.data);
   })
   .catch(function (error) {
     // handle error
   });
}

function startClock(color, currentMove, previousMove) {
  stopClock('black');
  stopClock('white');

  previousTime = previousMove.tl;
  currentTime = currentMove.tl;

  if (color == 'white') {
    whiteTimeRemaining = Math.ceil(previousTime / 1000) * 1000 + 1000;
    blackTimeRemaining = Math.ceil(currentTime / 1000) * 1000;

    if (isNaN(blackTimeRemaining))
    {
       blackTimeRemaining = defaultStartTime;
    }

    if (isNaN(whiteTimeRemaining))
    {
       whiteTimeRemaining = defaultStartTime;
    }

    setTimeRemaining('black', blackTimeRemaining);

    whiteMoveStarted = moment();
    updateClock('white');

    whiteClockInterval = setInterval(function() { updateClock('white') }, 1000);
    if (currentMove.mt != undefined)
    {
       setTimeUsed('black', currentMove.mt);
    }

    $('.white-to-move').show();
  } else {
    whiteTimeRemaining = Math.ceil(currentTime / 1000) * 1000;
    blackTimeRemaining = Math.ceil(previousTime / 1000) * 1000 + 1000;

    if (isNaN(blackTimeRemaining))
    {
       blackTimeRemaining = defaultStartTime;
    }

    if (isNaN(whiteTimeRemaining))
    {
       whiteTimeRemaining = defaultStartTime;
    }

    setTimeRemaining('white', whiteTimeRemaining);

    blackMoveStarted = moment();

    updateClock('black');

    blackClockInterval = setInterval(function() { updateClock('black') }, 1000);
    if (currentMove.mt != undefined)
    {
       setTimeUsed('white', currentMove.mt);
    }

    $('.black-to-move').show();
  }
}

function stopClock(color) {
  if (color == 'white') {
    clearInterval(whiteClockInterval);
    $('.white-to-move').hide();    
  } else {
    clearInterval(blackClockInterval);
    $('.black-to-move').hide();
  }
}

function updateClock(color) {
  currentTime = moment();

  if (color == 'white') {
    var diff = currentTime.diff(whiteMoveStarted-timeDiff);
    var ms = moment.duration(diff);

    whiteTimeUsed = ms;
    tempTimeRemaning = whiteTimeRemaining - whiteTimeUsed + 3000;

    setTimeUsed(color, whiteTimeUsed);
    setTimeRemaining(color, tempTimeRemaning);
  } else {
    var diff = currentTime.diff(blackMoveStarted-timeDiff);
    var ms = moment.duration(diff);

    blackTimeUsed = ms;
    tempTimeRemaning = blackTimeRemaining - blackTimeUsed + 3000;

    setTimeUsed(color, blackTimeUsed);
    setTimeRemaining(color, tempTimeRemaning);
  }
}

function secFormatNoH(timeip)
{
    var sec_num = parseInt(timeip/1000, 10); // don't forget the second param
    var hours   = Math.floor(sec_num / 3600);
    var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
    var seconds = sec_num - (hours * 3600) - (minutes * 60);

    if (hours   < 10) {hours   = "0"+hours;}
    if (minutes < 10) {minutes = "0"+minutes;}
    if (seconds < 10) {seconds = "0"+seconds;}
    return minutes+':'+seconds;
}

function secFormat(timeip)
{
    var sec_num = parseInt(timeip/1000, 10); // don't forget the second param
    var hours   = Math.floor(sec_num / 3600);
    var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
    var seconds = sec_num - (hours * 3600) - (minutes * 60);

    if (hours   < 10) {hours   = "0"+hours;}
    if (minutes < 10) {minutes = "0"+minutes;}
    if (seconds < 10) {seconds = "0"+seconds;}
    return hours+':'+minutes+':'+seconds;
}

function setTimeRemaining(color, time)
{
  if (time < 0) {
    time = 0;
  }

  if (viewingActiveMove) {
    $('.' + color + '-time-remaining').html(secFormat(time));
  }
}

function setTimeUsed(color, time) {
  if (viewingActiveMove) {
    $('.' + color + '-time-used').html(secFormatNoH(time));
  }
}

function setUsers(data) 
{
   userCount = data.count;
   if (data.count != undefined)
   {
      userCount = data.count;
   }
   setUsersMain(userCount);
}

function setUsersMain(count)
{
   if (count != undefined)
   {
      userCount = count;
   }

   try 
   {
      $('#event-overview').bootstrapTable('updateCell', {index: 0, field: 'Viewers', value: userCount});
   }
   catch(err)
   {
      plog ("Unable to update usercount", 0);
   }
}


var newMovesCount = 0;

function listPosition()
{
   if (board)
   {
      var getPos = board.position();
      if (getPos != null)
      {
         plog ("Number of pieces for leela:" + Object.keys(getPos).length, 1);
         return (Object.keys(getPos).length - 6);
      }
   }
   return '-'
}

function setPgn(pgn)
{
   var currentPlyCount = 0;

   if (!viewingActiveMove)
   {
      $('#newmove').removeClass('d-none');
      newMovesCount = newMovesCount + 1;
      $('#newmove').attr('data-count', newMovesCount);
   }
   else
   {
      $('#newmove').addClass('d-none');
      newMovesCount = 0;
      $('#newmove').attr('data-count', 0);
   }

   if (typeof pgn.Moves != 'undefined')
   {
      plog ("XXX: Entered for pgn.Moves.length:" + pgn.Moves.length + " , round is :" + pgn.Headers.Round, 0);
   }

   if (crosstableData)
   {
      updateScoreHeadersData();
   }

   if (pgn.gameChanged)
   {
      prevPgnData = pgn;
   }

   if (prevPgnData)
   {
      plog ("prevPgnData.Moves.length:" + prevPgnData.Moves.length + " ,pgn.lastMoveLoaded:" + pgn.lastMoveLoaded, 0);
      if (prevPgnData.Moves.length < pgn.lastMoveLoaded)
      {
         setTimeout(function() { updateAll(); }, 100);
         return;
      }
      else if (parseFloat(prevPgnData.Headers.Round) != parseFloat(pgn.Headers.Round))
      {
         setTimeout(function() { updateAll(); }, 100);
         return;
      }
   }

   if (prevPgnData)
   {
      _.each(pgn.Moves, function(move, key) {
         if (typeof move.Moveno != 'undefined' && parseInt(move.Moveno) > 0)
         {
            if (!prevPgnData.Moves[key])
            {
               prevPgnData.Moves.push(pgn.Moves[key]);
            }
         }
      });
      prevPgnData.BlackEngineOptions = pgn.BlackEngineOptions;
      prevPgnData.WhiteEngineOptions = pgn.WhiteEngineOptions;
      prevPgnData.Headers = pgn.Headers;
      prevPgnData.Users = pgn.Users;
      pgn = prevPgnData;
      loadedPgn = prevPgnData;
   }
   else
   {
      if (typeof pgn.Moves != 'undefined') 
      {
         prevPgnData = pgn;
      }
   }

   if (typeof pgn.Moves != 'undefined') 
   {
      currentPlyCount = pgn.Moves.length;
   }

  if (typeof pgn.Headers != 'undefined') {
     if (typeof pgn.Moves != 'undefined' && pgn.Moves.length > 0) {
       currentPosition = pgn.Moves[pgn.Moves.length-1].fen;
       moveFrom = pgn.Moves[pgn.Moves.length-1].from;
       moveTo = pgn.Moves[pgn.Moves.length-1].to;
   
       currentGameActive = (pgn.Headers.Termination == 'unterminated');
       whiteToPlay = (currentPlyCount % 2 == 0);
     }
  }
   
  if (!currentGameActive) {
    stopClock('white');
    stopClock('black');
  }

  if (currentGameActive) {
    if (whiteToPlay) {
      stopClock('black');
    } else {
      stopClock('white');
    }
  }

  plog ("XXX: loadedPlies: " + loadedPlies + " ,currentPlyCount:" + currentPlyCount + 
        " ,currentGameActive:" + currentGameActive + " ,gameActive:" + gameActive + " :gamechanged:" + pgn.gameChanged , 0);
  if (loadedPlies == currentPlyCount && (currentGameActive == gameActive)) {
    return;
  }

  if (timeDiffRead > 0)
  {
     timeDiff = 0; 
  }

  let previousPlies = loadedPlies;

  loadedPlies = currentPlyCount;
  gameActive = currentGameActive;

  if (activePly == 0) {
    activePly = currentPlyCount;
    viewingActiveMove = true;
  }
  if (activePly == currentPlyCount) {
    viewingActiveMove = true;
    $('#newmove').addClass('d-none');
    newMovesCount = 0;
    $('#newmove').attr('data-count', 0);
    board.clearAnnotation();
  }
   if (viewingActiveMove && activePly != currentPlyCount) {
      activePly = currentPlyCount;
      if (playSound)
      {
         $('#move_sound')[0].play();
      }
  }

  if (previousPlies > currentPlyCount) {
    initializeCharts();
    standTableInitialized = false;
    updateStandtable();
  }

  var whiteEval = {};
  var blackEval = {};

  eval = getEvalFromPly(pgn.Moves.length - 1);

  activeFen = pgn.Moves[pgn.Moves.length - 1].fen;
  if (viewingActiveMove) {
    currentMove = pgn.Moves[pgn.Moves.length - 1];
    lastMove = currentMove.to;
    setMoveMaterial(currentMove.material, 0);
  }

  if (!whiteToPlay) {
    whiteEval = eval;
  } else {
    blackEval = eval;
  }

  clockCurrentMove = currentMove;
  clockPreviousMove = '';

  if (pgn.Moves.length > 1) {
    eval = getEvalFromPly(pgn.Moves.length-2);

    selectedMove = pgn.Moves[pgn.Moves.length-2];
    clockPreviousMove = selectedMove;

    if (whiteToPlay) {
      whiteEval = eval;
    } else {
      blackEval = eval;
    }
  }

  if (viewingActiveMove) {
    updateMoveValues(whiteToPlay, whiteEval, blackEval);
    findDiffPv(whiteEval.pv, blackEval.pv);
    updateEnginePv('white', whiteToPlay, whiteEval.pv);
    updateEnginePv('black', whiteToPlay, blackEval.pv);
  }

  var TC = pgn.Headers.TimeControl.split("+");
  var base = Math.round(TC[0] / 60);
  TC = base + "'+" + TC[1] + '"';
  pgn.Headers.TimeControl = TC;

  defaultStartTime = (base * 60 * 1000);

  if (currentGameActive) 
  {
     if (whiteToPlay) 
     {
        startClock('white', clockCurrentMove, clockPreviousMove);
     } 
     else 
     {
        startClock('black', clockCurrentMove, clockPreviousMove);
     }
  }
  else 
  {
     stopClock('white');
     stopClock('black');
  }

  if (viewingActiveMove) {
    if (pgn.Moves.length > 0) {
      boardEl.find('.' + squareClass).removeClass(highlightClass);
      boardEl.find('.square-' + moveFrom).addClass(highlightClass);
      boardEl.find('.square-' + moveTo).addClass(highlightClass);
      squareToHighlight = moveTo;
    }
    board.position(currentPosition, false);
  }

  if (typeof pgn.Headers == 'undefined') {
    plog ("XXX: Returning here because headers not defined", 0);
    return;
  }

  listPosition();

  var title = "TCEC - Live Computer Chess Broadcast";
  if (pgn.Moves.length > 0) {
    title = pgn.Headers.White + ' vs. ' + pgn.Headers.Black + ' - ' + title;
    if (pgn.Moves.PlyCount % 2 == 0 || pgn.Headers.Termination != 'unterminated') {
      $("#favicon").attr("href", "img/favicon.ico");
    } else {
      $("#favicon").attr("href", "img/faviconb.ico");
    }
  }

  $(document).attr("title", title);

  var termination = pgn.Headers.Termination;
  if (pgn.Moves.length > 0) {
    var adjudication = pgn.Moves[pgn.Moves.length - 1].adjudication;
    var piecesleft = listPosition();
    pgn.Headers.piecesleft = piecesleft;
    if (eventNameHeader == 0)
    {
       eventNameHeader = pgn.Headers.Event;
       if (eventTmp = eventNameHeader.match(/TCEC Season (.*)/))
       {
          plog (eventTmp[1], 0);
          pgn.Headers.Event = "S" + eventTmp[1]; 
          eventNameHeader = pgn.Headers.Event;
       }
    }
    else
    {
       pgn.Headers.Event = eventNameHeader;
    }
    if (termination == 'unterminated' && typeof adjudication != 'undefined') {
      termination = '-';
      var movesToDraw = 50;
      var movesToResignOrWin = 50;
      var movesTo50R = 50;

      if (Math.abs(adjudication.Draw) <= 10 && pgn.Moves.length > 58) 
      {
         movesToDraw = Math.max(Math.abs(adjudication.Draw), 69 - pgn.Moves.length);
      }

      if (Math.abs(adjudication.ResignOrWin) < 11) 
      {
         movesToResignOrWin = Math.abs(adjudication.ResignOrWin);
      }

      if (adjudication.FiftyMoves < 51) 
      {
         movesTo50R = adjudication.FiftyMoves;
      }

      if (movesTo50R < 50 && movesTo50R < movesToResignOrWin) 
      {
         if(movesTo50R == 1) 
         {
            termination = movesTo50R + ' move 50mr'
         } 
         else 
         {
            termination = movesTo50R + ' moves 50mr'
         }
         pgn.Headers.movesTo50R = movesTo50R;
      }

      if (movesToResignOrWin < 50 && movesToResignOrWin < movesToDraw && movesToResignOrWin < movesTo50R) 
      {
         if(movesToResignOrWin == 1) 
         {
            termination = movesToResignOrWin + ' ply win';
         } 
         else 
         {
            termination = movesToResignOrWin + ' plies win';
         }
         pgn.Headers.movesToResignOrWin = movesToResignOrWin;
      }

      if (movesToDraw < 50 && movesToDraw <= movesTo50R && movesToDraw <= movesToResignOrWin) 
      {
         if (movesToDraw == 1) 
         {
            termination = movesToDraw + ' ply draw';
         } 
         else 
         {
            termination = movesToDraw + ' plies draw';
         }
         pgn.Headers.movesToDraw = movesToDraw + 'p';
      }

      $('#event-overview').bootstrapTable('hideColumn', 'Termination');
      $('#event-overview').bootstrapTable('showColumn', 'movesToDraw');
      $('#event-overview').bootstrapTable('showColumn', 'movesToResignOrWin');
      $('#event-overview').bootstrapTable('showColumn', 'movesTo50R');
    } else {
      pgn.Headers.Termination = pgn.Headers.TerminationDetails;
      plog ("pgn.Headers.Termination: yes" + pgn.Headers.Termination, 0);
      if ((pgn.Headers.Termination == 'undefined') ||
          (pgn.Headers.Termination == undefined))  
      {
         $('#event-overview').bootstrapTable('hideColumn', 'Termination');
         $('#event-overview').bootstrapTable('showColumn', 'movesToDraw');
         $('#event-overview').bootstrapTable('showColumn', 'movesToResignOrWin');
         $('#event-overview').bootstrapTable('showColumn', 'movesTo50R');
      }
      else
      {
         $('#event-overview').bootstrapTable('showColumn', 'Termination');
         $('#event-overview').bootstrapTable('hideColumn', 'movesToDraw');
         $('#event-overview').bootstrapTable('hideColumn', 'movesToResignOrWin');
         $('#event-overview').bootstrapTable('hideColumn', 'movesTo50R');
      }
    }
  }

  $('#event-overview').bootstrapTable('load', [pgn.Headers]);
  setUsersMain(pgn.Users); 
  $('#event-name').html(pgn.Headers.Event);

  if (viewingActiveMove) {
    setInfoFromCurrentHeaders();
  }

  updateChartData();

  $('#engine-history').html('');
  _.each(pgn.Moves, function(move, key) {
    ply = key + 1;
    if (key % 2 == 0) {
      number = (key / 2) + 1;
      var numlink = "<a class='numsmall'>" + number + ". </a>";
      $('#engine-history').append(numlink);
    }
    var linkClass = "";
    if (activePly == ply) {
      linkClass = "active-move"
    }

    if (move.book == true)
    {
       linkClass += " green";
       bookmove = ply;  
    }

    var moveNotation = move.m;
    if (moveNotation.length != 2) {
      moveNotation = move.m.charAt(0) + move.m.slice(1);
    }

    from = move.to;

    var link = "<a href='#' ply='" + ply + "' fen='" + move.fen + "' from='" + move.from + "' to='" + move.to + "' class='change-move " + linkClass + "'>" + moveNotation + "</a>";
    $('#engine-history').append(link + ' ');
  });
  $('#engine-history').append(pgn.Headers.Result);
  $("#engine-history").scrollTop($("#engine-history")[0].scrollHeight);
  if (pgn.gameChanged)
  {
     plog ("Came to setpgn need to reread dataa at end", 0);
  }
}

function copyFenAnalysis()
{
   var clip = new ClipboardJS('.btn', {
      text: function(trigger) {
         return analysFen;
      }
   });
   return false;
}

function copyFenWhite()
{
   var clip = new ClipboardJS('.btn', {
      text: function(trigger) {
         return currentPositionWhite;
      }
   });
   return false;
}

function copyFenBlack()
{
   var clip = new ClipboardJS('.btn', {
      text: function(trigger) {
         return currentPositionBlack;
      }
   });
   return false;
}

function copyFen()
{
   var clip = new ClipboardJS('.btn', {
      text: function(trigger) {
         return currentPosition;
      }
   });
   return false;
}

function getShortEngineName(engine)
{
   var name = engine;
   if (engine.indexOf(' ') > 0)
   {
      name = engine.substring(0, engine.indexOf(' '));
   }
   return name;
}

function setInfoFromCurrentHeaders()
{
  var header = loadedPgn.Headers.White;
  var name = header;
  if (header.indexOf(' ') > 0) {
    name = header.substring(0, header.indexOf(' '))
  }
  $('.white-engine-name').html(name);
  $('.white-engine-name-full').html(header);
  whiteEngineFull = header;
  var imgsrc = 'img/engines/' + name + '.jpg';
  $('#white-engine').attr('src', imgsrc);
  $('#white-engine').attr('alt', header);
  $('#white-engine-chessprogramming').attr('href', 'https://www.chessprogramming.org/' + name);
  header = loadedPgn.Headers.Black;
  name = header;
  blackEngineFull = header;
  if (header.indexOf(' ') > 0) {
    name = header.substring(0, header.indexOf(' '))
  }
  $('.black-engine-name').html(name);
  $('.black-engine-name-full').html(header);
  var imgsrc = 'img/engines/' + name + '.jpg';
  $('#black-engine').attr('src', imgsrc);
  $('#black-engine').attr('alt', header);
  $('#black-engine-chessprogramming').attr('href', 'https://www.chessprogramming.org/' + name);
}

function getMoveFromPly(ply)
{
   return loadedPgn.Moves[ply];
}

function fixedDeci(value)
{
   return value.toFixed(1);
}

function getNodes(nodes)
{
   if (nodes > 1000000 * 1000)
   {
      nodes = fixedDeci(parseFloat(nodes / (1000000 * 1000))) + 'B';
   }
   else if (nodes > 1000000) 
   {
      nodes = fixedDeci(parseFloat(nodes / (1000000 * 1))) + 'M';
   } 
   else 
   {
      nodes = fixedDeci(parseFloat(nodes / (1000* 1))) + 'K';
   }
   return nodes;
}

function getTBHits(tbhits)
{
   var tbHits = 'N/A';

   if (!isNaN(tbhits))
   {
      if (tbhits < 1000)
      {
         tbHits = tbhits;
      } 
      else if (tbhits < 1000000)
      {
         tbHits = fixedDeci(parseFloat(tbhits/ (1000* 1))) + 'K';
      } 
      else 
      {
         tbHits = fixedDeci(parseFloat(tbhits/ (1000000* 1))) + 'M';
      }
   }
   return tbHits;
}

function getEvalFromPly(ply)
{
  selectedMove = loadedPgn.Moves[ply];

  side = 'White';
  if (whiteToPlay) {
    side = 'Black';
  }

  if (ply < 0) 
  {
     return {
       'side': side,
       'eval': "n/a",
       'pv': {},
       'speed': "n/a",
       'nodes': "n/a",
       'mtime': "n/a",
       'depth': "n/a",
       'tbhits': "n/a",
       'timeleft': "n/a"
     };
  } 

  //arun
  if (ply < bookmove || (typeof selectedMove == 'undefined') || (typeof (selectedMove.pv) == 'undefined'))
  {
     return {
       'side': side,
       'eval': "book",
       'pv': {},
       'speed': "book",
       'nodes': "book",
       'mtime': "book",
       'depth': "book",
       'tbhits': "book",
       'timeleft': "book"
     };
  } 

  if (typeof selectedMove == 'undefined') {
    return '';
  }
  clockPreviousMove = selectedMove;
  speed = selectedMove.s;
  if (speed < 1000000) {
    speed = Math.round(speed / 1000) + ' knps';
  } else {
    speed = Math.round(speed / 1000000) + ' Mnps';
  }

  nodes = getNodes(selectedMove.n);

  var depth = selectedMove.d + '/' + selectedMove.sd;
  var tbHits = 0;
  tbHits = getTBHits(selectedMove.tb);

  var evalRet = '';

  if (!isNaN(selectedMove.wv))  
  {
     evalRet = parseFloat(selectedMove.wv).toFixed(2);
  }
  else
  {
     evalRet = selectedMove.wv;
  }

  return {
    'side': side,
    'eval': evalRet,
    'pv': selectedMove.pv.Moves,
    'speed': speed,
    'nodes': nodes,
    'mtime': secFormatNoH(selectedMove.mt),
    'depth': depth,
    'tbhits': tbHits,
    'timeleft': secFormat(selectedMove.tl),
  };
}

function getScorePct(reverse, engineName, draEval, winEval, egEval)
{
   var retStr = engineName;
   retStr = retStr + ' ' + egEval + ' ';

   if (!reverse)
   {
      if (winEval == 0)
      {
         retStr += " [" + draEval + "% D]";
      }
      else
      {
         retStr += " [" + winEval + "% W | " + draEval + "% D]";
      }
   }
   else
   {
      if (winEval == 0)
      {
         retStr += " [" + draEval + "% D]";
      }
      else
      {
         retStr += " [" + winEval + "% B | " + draEval + "% D]";
      }
   }

   return retStr;
}

function getNNPct(engineName, egEval)
{
   var reverse = 0;
   var whiteWinPct = (((((Math.atan((egEval * 100)/290.680623072))/3.096181612)+0.5) * 100)-50);
   if (egEval < 0)
   {
      reverse = 1;
      whiteWinPct = -whiteWinPct;
   }
   var winEval = parseFloat(Math.max(0, whiteWinPct * 2)).toFixed(1);
   var losEval = 0;
   var draEval = parseFloat(100 - Math.max(winEval, losEval)).toFixed(1);
   var retStr = getScorePct(reverse, engineName, draEval, winEval, egEval);
   return (retStr);
}

function getABPct(engineName, egEval)
{
   var reverse = 0;
   var whiteWinPct = (50 - (100/(1 + Math.pow(10, egEval/4))));
   if (egEval <= 0)
   {
      reverse = 1;
      whiteWinPct = -whiteWinPct;
   }
   var winEval = parseFloat(Math.max(0, whiteWinPct * 2)).toFixed(1);
   var losEval = 0;
   var draEval = parseFloat(100 - Math.max(winEval, losEval)).toFixed(1);
   var retStr = getScorePct(reverse, engineName, draEval, winEval, egEval);
   return (retStr);
}

function getPct(engineName, eval)
{
   var shortName = getShortEngineName(engineName);

   if (isNaN(eval)) {
      return (engineName + ' ' + eval);
      }

   if (shortName == "LCZero")              
   {
      return (getNNPct(shortName, eval));
   }
   else
   {
      return (getABPct(shortName, eval));
   }
}

function updateMoveValues(whiteToPlay, whiteEval, blackEval)
{
   /* Ben: Not sure why we need to update only if we are not viewing active move */
   if (!viewingActiveMove) 
   {
      $('.white-time-used').html(whiteEval.mtime);
      $('.black-time-used').html(blackEval.mtime);
      $('.white-time-remaining').html(whiteEval.timeleft);
      $('.black-time-remaining').html(blackEval.timeleft);
   }
   else
   {
      if (whiteToPlay)
      {
         $('.black-time-remaining').html(blackEval.timeleft);
         $('.black-time-used').html(blackEval.mtime);
      }
      else
      {
         $('.white-time-used').html(whiteEval.mtime);
         $('.white-time-remaining').html(whiteEval.timeleft);
      }
   }

   $('.white-engine-eval').html(whiteEval.eval);

   var blackEvalPt = getPct(loadedPgn.Headers.Black, blackEval.eval);
   var whiteEvalPt = getPct(loadedPgn.Headers.White, whiteEval.eval);
   $('.black-engine-name-full-new').html(blackEvalPt);
   $('.white-engine-name-full-new').html(whiteEvalPt);
   //$(eval a=(((((Math.atan(($(query)100)/290.680623072))/3.096181612)+0.5)100)-50); 
   //lose=Math.max(0,a-2); draw=(100-Math.max(win,lose)).toFixed(2); win=win.toFixed(2); lose=lose.toFixed(2); 
   $('.white-engine-speed').html(whiteEval.speed);
   $('.white-engine-nodes').html(whiteEval.nodes);
   $('.white-engine-depth').html(whiteEval.depth);
   $('.white-engine-tbhits').html(whiteEval.tbhits);
   findDiffPv(whiteEval.pv, blackEval.pv);
   updateEnginePv('white', whiteToPlay, whiteEval.pv);

   $('.black-engine-eval').html(blackEval.eval);
   $('.black-engine-speed').html(blackEval.speed);
   $('.black-engine-nodes').html(blackEval.nodes);
   $('.black-engine-depth').html(blackEval.depth);
   $('.black-engine-tbhits').html(blackEval.tbhits);
   updateEnginePv('black', whiteToPlay, blackEval.pv);
}

function updateEnginePv(color, whiteToPlay, moves)
{
   var classhigh = '';
  if (typeof moves != 'undefined') {

    currentMove = Math.floor(activePly / 2);

    if (color == 'white') {
      whitePv = moves;
      //activePv = whitePv.slice();
      //setPvFromKey(0, 'white', 0);
    } else {
      blackPv = moves;
      //activePv = blackPv.slice();
      //setPvFromKey(0, 'black', 0);
    }

    keyOffset = 0;
    if (color == 'black' && !whiteToPlay) {
      currentMove -= 2;
      // keyOffset = 1;
    }

    if (!whiteToPlay) {
      currentMove++;
    }
    if (!whiteToPlay && color == "black") {
      currentMove++;
    }
    setpvmove = -1;
    $('#' + color + '-engine-pv').html('');
    $('.' + color + '-engine-pv').html('');
    _.each(moves, function(move, key) {
      classhigh = "";
      effectiveKey = key + keyOffset;
      pvMove = currentMove + Math.floor(effectiveKey / 2);
      pvMoveNofloor = currentMove + effectiveKey;
      if (whiteToPlay)
      {
         if (color == "white" && (highlightpv == key))
         {
            plog ("Need to highlight:" + pvMove + ", move is :" + move.m, 1);
            classhigh = "active-pv-move";
            setpvmove = effectiveKey;
         }
         if (color == "black" && key == 0) 
         {
            pvMoveNofloor = pvMoveNofloor + 1;
         }
         if (color == "black" && (highlightpv == key + 1))
         {
            plog ("Need to highlight:" + pvMove + ", move is :" + move.m, 1);
            classhigh = "active-pv-move";
            setpvmove = effectiveKey;
         }
      }
      else
      {
         if (color == "white" && (highlightpv - 1 == key))
         {
            plog ("Need to highlight:" + pvMove + ", move is :" + move.m, 1);
            classhigh = "active-pv-move";
            setpvmove = effectiveKey;
         }
         if (color == "black" && (highlightpv == key))
         {
            plog ("Need to highlight:" + pvMove + ", move is :" + move.m, 1);
            classhigh = "active-pv-move";
            setpvmove = effectiveKey;
         }
      }
      var atsymbol = '';
      if (setpvmove > -1 && effectiveKey == setpvmove)
      {
         pvMove = ' @ ' + pvMove;
         //console.log ("pvMove is : " + pvMove + " setpvmove:" + setpvmove + ", effectiveKey:" + effectiveKey);
         atsymbol = ' @ ';
      }
      if (color == "white")
      {
         if (effectiveKey % 2 == 0 ) 
         {
            $('#' + color + '-engine-pv').append(pvMove + '. ');
            $('#' + color + '-engine-pv2').append(pvMove + '. ');
            $('#' + color + '-engine-pv3').append(pvMove + '. ');
         }
         else if (effectiveKey % 2 != 0 ) 
         {
            $('#' + color + '-engine-pv').append(atsymbol);
            $('#' + color + '-engine-pv2').append(atsymbol);
            $('#' + color + '-engine-pv3').append(atsymbol);
         }
      }
      
      if (color == "black" && effectiveKey % 2 != 0 ) {
        $('#' + color + '-engine-pv3').append(pvMove + '. ');
        $('#' + color + '-engine-pv').append(pvMove + '. ');
        $('#' + color + '-engine-pv2').append(pvMove + '. ');
      }

      if (color == "black")
      {
         if (color == "black" && key == 0 ) 
         {
            $('#' + color + '-engine-pv').append(pvMove + '. ');
            $('#' + color + '-engine-pv2').append(pvMove + '. ');
            $('#' + color + '-engine-pv3').append(pvMove + '. ');
            $('#' + color + '-engine-pv').append(' .. ');
            $('#' + color + '-engine-pv2').append(' .. ');
            $('#' + color + '-engine-pv3').append(' .. ');
            currentMove++;
         }
         else if (effectiveKey % 2 == 0 )
         {
            $('#' + color + '-engine-pv3').append(atsymbol);
            $('#' + color + '-engine-pv').append(atsymbol);
            $('#' + color + '-engine-pv2').append(atsymbol);
         }
      }
      plog ("classhigh: " + classhigh, 1);
      if (color == 'black')
      {
         classhigh += ' blue';
      }
      $('#' + color + '-engine-pv').append("<a href='#' id='" + color + '-' + key + "' class='set-pv-board " + classhigh + "' move-key='" + key + "' color='" + color + "'>" + move.m + '</a> ');
      $('#' + color + '-engine-pv2').append("<a href='#' id='" + color + '-' + key + "' class='set-pv-board " + classhigh + "' move-key='" + key + "' color='" + color + "'>" + move.m + '</a> ');
      $('#' + color + '-engine-pv3').append("<a href='#' id='c" + color + '-' + key + "' class='set-pv-board " + classhigh + "' move-key='" + key + "' color='" + color + "'>" + move.m + '</a> ');
      });

    plog ("highlightpv is :" + highlightpv);
    if (highlightpv == 0)
    {
       setpvmove = 0;
    }
   if (color == 'white') 
   {
      whitePv = moves;
      if (whitePv.length > 0)
      {
         if (plyDiff == 2)
         {
            setpvmove = whitePv.length - 1;
            plog ("plyDiff in white:" + whitePv.length);
         }
         activePv = whitePv.slice();
         setPvFromKey(setpvmove, 'white');
      }
   } 
   else 
   {
      blackPv = moves;
      if (blackPv.length > 0)
      {
         activePv = blackPv.slice();
         if (plyDiff == 2)
         {
            setpvmove = blackPv.length - 1; 
         }
         setPvFromKey(setpvmove, 'black');
      }
   }
  } else {
    $('#' + color + '-engine-pv').html('');
    $('.' + color + '-engine-pv').html('');
  }
}

function setPlyDiv(plyDiffL)
{
   plyDiff = plyDiffL;
   findDiffPv(whitePv, blackPv);
   updateEnginePv('white', whiteToPlay, whitePv);
   updateEnginePv('black', whiteToPlay, blackPv);
   localStorage.setItem('tcec-ply-div', plyDiff);
   $('input[value=ply'+plyDiffL+']').prop('checked', true);
}

function setPlyDivDefault()
{
   var plyDiffL = localStorage.getItem('tcec-ply-div');
   plyDiff = 0;
   if (plyDiffL != 'undefined')
   {
      plyDiff = plyDiffL;
   }
   plyDiff = parseInt(plyDiff);
   $('input[value=ply'+plyDiff+']').prop('checked', true);
}

function findDiffPv(whitemoves, blackmoves)
{
   highlightpv = 0;

   if (plyDiff == 0)
   {
      highlightpv = 0;
      plog ("returning here:" + plyDiff);
      return;
   }

   if (typeof whitemoves != 'undefined') 
   {
      currentMove = Math.floor(activePly / 2);
 
      if (!whiteToPlay) 
      {
         currentMove++;
      }
      
      _.each(whitemoves, function(move, key) 
      {
         pvMove = currentMove + key;
         if (whiteToPlay)
         {
            if (!highlightpv && blackmoves && blackmoves[key - 1] && (blackmoves[key - 1].m != whitemoves[key].m))
            {
               plog ("Need to color this pvmove is :" + key + ", pv:" + whitemoves[key].m + ", black: " + blackmoves[key - 1].m, 1);
               highlightpv = key;
            }
         }
         else
         {
            if (!highlightpv && blackmoves && blackmoves[key + 1] && (blackmoves[key + 1].m != whitemoves[key].m))
            {
               plog ("Need to color this pvmove is :" + key + ", pv:" + whitemoves[key].m + ", black: " + blackmoves[key + 1].m, 1);
               highlightpv = key + 1;
            }
         }
      });
   }
}

$(document).on('click', '.change-move', function(e) {
  clickedPly = $(this).attr('ply');
  clickedFen = $(this).attr('fen');
  moveFrom = $(this).attr('from');
  moveTo = $(this).attr('to');

  viewingActiveMove = false;

  $('.active-move').removeClass('active-move');
  $(this).addClass('active-move');

  boardEl.find('.' + squareClass).removeClass(highlightClass);
  boardEl.find('.square-' + moveFrom).addClass(highlightClass);
  boardEl.find('.square-' + moveTo).addClass(highlightClass);
  squareToHighlight = moveTo;

  board.position(clickedFen, false);
  currentPosition = clickedFen;
  activePly = clickedPly;
  e.preventDefault();
  listPosition();

  if (clickedPly == loadedPlies)
  {
    viewingActiveMove = true;
    $('#newmove').addClass('d-none');
    newMovesCount = 0;
    $('#newmove').attr('data-count', 0);
   }

   handlePlyChange(false);

   return false;
});

$(document).on('click', '#board-to-first', function(e) {
  activePly = 1;
  handlePlyChange();
  e.preventDefault();
});

$(document).on('click', '#board-previous', function(e) {
  if (activePly > 1) {
    activePly--;
  }
  handlePlyChange();
  e.preventDefault();

  return false;
});

var isAutoplay = false;

$(document).on('click', '#board-autoplay', function(e) {
  e.preventDefault();
  if (isAutoplay) {
    isAutoplay = false;
    $('#board-autoplay i').removeClass('fa-pause');
    $('#board-autoplay i').addClass('fa-play');
  } else {
    isAutoplay = true;
    $('#board-autoplay i').removeClass('fa-play')
    $('#board-autoplay i').addClass('fa-pause');
    boardAutoplay();
  }

  return false;
});

function boardAutoplay()
{
  if (isAutoplay && activePly >= 1 && activePly < loadedPlies) {
    activePly++;
    handlePlyChange();
    setTimeout(function() { boardAutoplay(); }, 750);
  } else {
    isAutoplay = false;
    $('#board-autoplay i').removeClass('fa-pause');
    $('#board-autoplay i').addClass('fa-play');
  }
}

$(document).on('click', '#board-next', function(e) {
  if (activePly < loadedPlies) {
    activePly++;
  } else {
    viewingActiveMove = true;
  }
  handlePlyChange();
  e.preventDefault();

  return false;
});

function onLastMove()
{
  activePly = loadedPlies;
  viewingActiveMove = true;
  handlePlyChange();
}

$(document).on('click', '#board-to-last', function(e) {
  onLastMove();
  e.preventDefault();

  return false;
});

$(document).on('click', '#board-reverse', function(e) {
  board.flip();

  newOrientation = board.orientation();

  if (board.orientation() == 'black') {
    oldOrientation = 'white';
  } else {
    oldOrientation = 'black';
  }

  $('.board-bottom-engine-eval.' + oldOrientation + '-engine-name').removeClass(oldOrientation + '-engine-name').addClass(newOrientation + '-engine-name');
  $('.board-bottom-engine-eval.' + oldOrientation + '-time-remaining').removeClass(oldOrientation + '-time-remaining').addClass(newOrientation + '-time-remaining');
  $('.board-bottom-engine-eval.' + oldOrientation + '-time-used').removeClass(oldOrientation + '-time-used').addClass(newOrientation + '-time-used');
  $('.board-bottom-engine-eval.' + oldOrientation + '-engine-eval').removeClass(oldOrientation + '-engine-eval').addClass(newOrientation + '-engine-eval');

  $('.board-top-engine-eval.' + newOrientation + '-engine-name').removeClass(newOrientation + '-engine-name').addClass(oldOrientation + '-engine-name');
  $('.board-top-engine-eval.' + newOrientation + '-time-remaining').removeClass(newOrientation + '-time-remaining').addClass(oldOrientation + '-time-remaining');
  $('.board-top-engine-eval.' + newOrientation + '-time-used').removeClass(newOrientation + '-time-used').addClass(oldOrientation + '-time-used');
  $('.board-top-engine-eval.' + newOrientation + '-engine-eval').removeClass(newOrientation + '-engine-eval').addClass(oldOrientation + '-engine-eval');
  $('#board-top-engine-eval').addClass(oldOrientation + 'Fill');
  $('#board-top-engine-eval').removeClass(newOrientation + 'Fill');
  $('#board-bottom-engine-eval').addClass(newOrientation + 'Fill');
  $('#board-bottom-engine-eval').removeClass(oldOrientation + 'Fill');

  setInfoFromCurrentHeaders();
  handlePlyChange(false);

  e.preventDefault();

  return false;
});

function handlePlyChange(handleclick) 
{
   selectedId = 0;
   if (typeof handleclick == 'undefined')
   {
      handleclick = true;
   }

   whiteToPlay = (activePly % 2 == 0);

   whiteEval = blackEval = '';

   /* Ben: since index starts at 0, active ply should be -1 and -2 to be correct */
   if (whiteToPlay) {
      whiteEval = getEvalFromPly(activePly - 2);
      blackEval = getEvalFromPly(activePly - 1);
   } else {
      blackEval = getEvalFromPly(activePly - 2);
      whiteEval = getEvalFromPly(activePly - 1);
   }

   /* Arun: we should get move from ply - 1 as index starts at 0 */
   currentMove = getMoveFromPly(activePly - 1);

   var prevMove = getMoveFromPly(activePly - 2);
   for (var yy = 1 ; yy <= livePVHist.length ; yy ++)
   {
      if (livePVHist[yy])
      {
         for (var xx = 0 ; xx < livePVHist[yy].moves.length ; xx ++)
         {
            if (parseInt(livePVHist[yy].moves[xx].ply) == activePly)
            {
               livePVHist[yy].moves[xx].engine = livePVHist[yy].engine;
               updateLiveEvalData(livePVHist[yy].moves[xx], 0, prevMove.fen, yy, 0);
               break;
            }
         }
      }
   }

   /* Arun: why do we need to keep swappging the pieces captured */
   if (typeof currentMove != 'undefined') {
    setMoveMaterial(currentMove.material, 0);
   }

   updateMoveValues(whiteToPlay, whiteEval, blackEval);

   if (handleclick)
   {
      $('a[ply=' + activePly + ']').click();
   }
}

$(document).on('click', '.set-pv-board', function(e) {
   selectedId = $(this).closest('div').attr('id')
   moveKey = $(this).attr('move-key') * 1;
   pvColor = $(this).attr('color');
   if (pvColor == 'live')
   {
      $('#v-pills-pv-analys-tab').click();
   }
   else
   {
      if (hideDownPv == 0)
      {
         $('#v-pills-pv-tab').click();
      }
   }

  activePvColor = pvColor;

  if (pvColor == 'white') {
    activePv = whitePv.slice();
    setPvFromKey(moveKey, pvColor);
  } else if (pvColor == 'black') {
    activePv = blackPv.slice();
    setPvFromKey(moveKey, pvColor);
  } else {
    liveKey = $(this).attr('engine');
    plog ("liveKey is :" + liveKey);
    activePv = livePvs[liveKey];
    setPvFromKey(moveKey, pvColor, activePv);
    // pvBoard.orientation('white');
  }

  e.preventDefault(); 

  return false;
});

function setActiveKey(pvColor, value)
{
    if (pvColor == undefined || pvColor == 'white')
    {
      activePvKey[0] = value;
    }
    else if (pvColor == 'black')
    {
       activePvKey[1] = value;
    }
    else if (pvColor == 'live')
    {
       activePvKey[2] = value;
       plog ("setting live to:" + value, 1);
    }
}

function scrollDiv(container, element)
{
   $(container).scrollTop(
         $(element).offset().top - $(container).offset().top + $(container).scrollTop()
      );
}

var choosePv;

function setPvFromKey(moveKey, pvColor, choosePvx)
{
  var activePv;

  if (pvColor == undefined || pvColor == 'white')
  {
    activePv  = whitePv.slice();
  }
  else if (pvColor == 'black')
  {
    activePv  = blackPv.slice();
    plog ("choosePvx is :" + strx(activePv));
  }
  else if (pvColor == 'live')
  {
    if (choosePvx != undefined)
    {
       activePv = choosePvx;
       plog ("choosePvx is :" + strx(choosePvx));
       choosePv = choosePvx;
    }
    else
    {
       activePv = choosePv;
       plog ('live choseny:' + activePv.length + " ,moveKey:" + moveKey, 1);
    }
  }

  if (activePv.length < 1) {
    setActiveKey(pvColor, 0);
    return;
  }

  if (moveKey >= activePv.length) {
     return;
     }
  setActiveKey(pvColor, moveKey);

  moveFromPv = activePv[moveKey].from;
  moveToPv = activePv[moveKey].to;
  fen = activePv[moveKey].fen;
  game.load(fen);
  var pvBoardElbL = null;

   $('.active-pv-move').removeClass('active-pv-move');
   if (pvColor == 'white')
   {
      if (pvBoardw != undefined)
      {
         pvBoardL = pvBoardw;
         pvBoardElbL = pvBoardElw;
         $('#white-engine-pv').find('#'+pvColor+'-'+moveKey).addClass('active-pv-move');
         $('#white-engine-pv2').find('#'+pvColor+'-'+moveKey).addClass('active-pv-move');
         $('#white-engine-pv3').find('#c'+pvColor+'-'+moveKey).addClass('active-pv-move');
         $('#black-engine-pv').find('#black-'+activePvKey[1]).addClass('active-pv-move');
         $('#black-engine-pv2').find('#black-'+activePvKey[1]).addClass('active-pv-move');
         $('#black-engine-pv3').find('#cblack-'+activePvKey[1]).addClass('active-pv-move');
         scrollDiv('#white-engine-pv3', '#c'+pvColor+'-'+moveKey);
         scrollDiv('#white-engine-pv2', '#'+pvColor+'-'+moveKey);
         scrollDiv('#white-engine-pv', '#'+pvColor+'-'+moveKey);
         currentPositionWhite = fen;
      }
      moveFromPvW = moveFromPv;
      moveToPvW = moveToPv;
   }
   else if (pvColor == 'black')
   {
      pvBoardL = pvBoardb;
      pvBoardElbL = pvBoardElb;
      $('#black-engine-pv').find('#'+pvColor+'-'+moveKey).addClass('active-pv-move');
      $('#black-engine-pv2').find('#'+pvColor+'-'+moveKey).addClass('active-pv-move');
      $('#black-engine-pv3').find('#c'+pvColor+'-'+moveKey).addClass('active-pv-move');
      $('#white-engine-pv').find('#white-'+activePvKey[0]).addClass('active-pv-move');
      $('#white-engine-pv2').find('#white-'+activePvKey[0]).addClass('active-pv-move');
      $('#white-engine-pv3').find('#cwhite-'+activePvKey[0]).addClass('active-pv-move');
      scrollDiv('#black-engine-pv', '#'+pvColor+'-'+moveKey);
      scrollDiv('#black-engine-pv3', '#c'+pvColor+'-'+moveKey);
      scrollDiv('#black-engine-pv2', '#'+pvColor+'-'+moveKey);
      currentPositionBlack = fen;
      moveFromPvB = moveFromPv;
      moveToPvB = moveToPv;
   }
   else if (pvColor == 'live')
   {
      pvBoardL = pvBoarda;
      pvBoardElbL = pvBoardEla;
      //$('#black-engine-pv').addClass('active-pv-move');
      //$('#black-engine-pv').find('#'+pvColor+'-'+moveKey).addClass('active-pv-move');
      //$('#white-engine-pv').find('#white-'+activePvKey[0]).addClass('active-pv-move');
      //scrollDiv('#black-engine-pv', '#'+pvColor+'-'+moveKey);
      moveFromPvL = moveFromPv;
      moveToPvL = moveToPv;
   }

  if (pvBoardElbL == null)
  {
     return;
  }
  analysFen = fen;
  pvBoardElbL.find('.' + squareClass).removeClass(highlightClassPv);
  pvBoardElbL.find('.square-' + moveFromPv).addClass(highlightClassPv);
  pvBoardElbL.find('.square-' + moveToPv).addClass(highlightClassPv);
  pvSquareToHighlight = moveToPv;

  pvBoardL.position(fen, false);
  if (pvColor == 'white')
  {
     pvBoardL = pvBoardwc;
     pvBoardElbL = pvBoardElwc;
     pvBoardElbL.find('.' + squareClass).removeClass(highlightClassPv);
     pvBoardElbL.find('.square-' + moveFromPv).addClass(highlightClassPv);
     pvBoardElbL.find('.square-' + moveToPv).addClass(highlightClassPv);
     pvBoardL.position(fen, false);
  }
  if (pvColor == 'black')
  {
     pvBoardL = pvBoardbc;
     pvBoardElbL = pvBoardElbc;
     pvBoardElbL.find('.' + squareClass).removeClass(highlightClassPv);
     pvBoardElbL.find('.square-' + moveFromPv).addClass(highlightClassPv);
     pvBoardElbL.find('.square-' + moveToPv).addClass(highlightClassPv);
     pvBoardL.position(fen, false);
  }
}

$('#pv-board-black').click(function(e) {
  activePv = blackPv;
  setPvFromKey(0, 'live', blackPv);
  e.preventDefault();
  return false;
});

$('#pv-board-white').click(function(e) {
  activePv = whitePv;
  setPvFromKey(0, 'live', whitePv);
  e.preventDefault();
  return false;
});

$('#pv-board-live1').click(function(e) {
  setPvFromKey(0, 'live', livePvs[1]);
  e.preventDefault();
  return false;
});

$('#pv-board-live2').click(function(e) {
  setPvFromKey(0, 'live', livePvs[2]);
  e.preventDefault();
  return false;
});

$('#pv-board-to-first').click(function(e) {
  setPvFromKey(0, 'live');
  e.preventDefault();
  return false;
});

$('#pv-board-previous').click(function(e) {
  if (activePvKey[2] > 0) {
    setPvFromKey(activePvKey[2] - 1, 'live');
  }
  e.preventDefault();

  return false;
});

$('#pv-board-next').click(function(e) {
  if (activePvKey[2] < choosePv.length) {
    setPvFromKey(activePvKey[2] + 1, 'live');
  }
  e.preventDefault();

  return false;
});

$('.pv-board-to-first1').click(function(e) {
  setPvFromKey(0, 'white');
  e.preventDefault();
  return false;
});

$('.pv-board-to-first2').click(function(e) {
  setPvFromKey(0, 'black');
  e.preventDefault();
  return false;
});

$('.pv-board-previous1').click(function(e) {
  if (activePvKey[0] > 0) {
    setPvFromKey(activePvKey[0] - 1, 'white');
  }
  e.preventDefault();

  return false;
});

$('.pv-board-previous2').click(function(e) {
  if (activePvKey[1] > 0) {
    setPvFromKey(activePvKey[1] - 1, 'black');
  }
  e.preventDefault();

  return false;
});

var isPvAutoplay = [];
isPvAutoplay[1] = false;
isPvAutoplay[0] = false;

$('.pv-board-autoplay1').click(function(e) {
  if (isPvAutoplay[0]) {
    isPvAutoplay[0] = false;
    $('.pv-board-autoplay1 i').removeClass('fa-pause');
    $('.pv-board-autoplay1 i').addClass('fa-play');
  } else {
    isPvAutoplay[0] = true;
    $('.pv-board-autoplay1 i').removeClass('fa-play')
    $('.pv-board-autoplay1 i').addClass('fa-pause');
    pvBoardautoplay(0, 'white', whitePv);
  }
  e.preventDefault();

  return false;
});

$('.pv-board-autoplay2').click(function(e) {
  if (isPvAutoplay[1]) {
    isPvAutoplay[1] = false;
    $('.pv-board-autoplay2 i').removeClass('fa-pause');
    $('.pv-board-autoplay2 i').addClass('fa-play');
  } else {
    isPvAutoplay[1] = true;
    $('.pv-board-autoplay2 i').removeClass('fa-play')
    $('.pv-board-autoplay2 i').addClass('fa-pause');
    pvBoardautoplay(1, 'black', blackPv);
  }
  e.preventDefault();

  return false;
});

//hack

function pvBoardautoplay(value, color, activePv)
{
  if (isPvAutoplay[value] && activePvKey[value] >= 0 && activePvKey[value] < activePv.length - 1) {
    setPvFromKey(activePvKey[value] + 1, color);
    setTimeout(function() { pvBoardautoplay(value, color, activePv); }, 750);
  } else {
    isPvAutoplay[value] = false;
    if (value == 0)
    {
       $('.pv-board-autoplay1 i').removeClass('fa-pause');
       $('.pv-board-autoplay1 i').addClass('fa-play');
    }
    else
    {
       $('.pv-board-autoplay2 i').removeClass('fa-pause');
       $('.pv-board-autoplay2 i').addClass('fa-play');
    }
  }
}

$('.pv-board-next1').click(function(e) {
  if (activePvKey[0] < whitePv.length) {
    setPvFromKey(activePvKey[0] + 1, 'white');
  }
  e.preventDefault();
  return false;
});

$('.pv-board-next2').click(function(e) {
  if (activePvKey[1] < blackPv.length) {
    setPvFromKey(activePvKey[1] + 1, 'black');
  }
  e.preventDefault();
  return false;
});

$('.pv-board-to-last1').click(function(e) {
  setPvFromKey(whitePv.length - 1, 'white');
  e.preventDefault();
  return false;
});

$('.pv-board-to-last2').click(function(e) {
  setPvFromKey(blackPv.length - 1, 'black');
  e.preventDefault();
  return false;
});

$('.pv-board-reverse1').click(function(e) {
  pvBoardw.flip();
  pvBoardwc.flip();
  e.preventDefault();
  return false;
});

$('.pv-board-reverse2').click(function(e) {
  pvBoardb.flip();
  pvBoardbc.flip();
  e.preventDefault();
  return false;
});

$('#pv-board-reverse').click(function(e) {
  pvBoarda.flip();
  e.preventDefault();
  return false;
});

function setMoveMaterial(material, whiteToPlay)
{
  _.forOwn(material, function(value, key) {
    setPieces(key, value, whiteToPlay);
  })
}

function setPieces(piece, value, whiteToPlay) {
  var target = 'black-material';
  var color = 'b';
  if ((whiteToPlay && value < 0) || (!whiteToPlay && value > 0)) {
    target = 'white-material';
    color = 'w';
  }
  
  value = Math.abs(value);

  $('#white-material span.' + piece).html('');
  $('#black-material span.' + piece).html('');

  for (i = 0; i < value; i++) {
    imgPath = 'img/chesspieces/wikipedia/' + color + piece.toUpperCase() + '.png';
    $('#' + target + ' span.' + piece).append('<img src="' + imgPath + '" class="engine-material" />');
  }
}

function getLinkArch(gameNumber) 
{
   var retLink;

   retLink = "http://tcec.chessdom.com/archive.php";

   return (retLink);
}

function openCross(gamen)
{
   var link = "http://legacy-tcec.chessdom.com/archive.php";
   var season = 1;
   var div = "di";
   var divno = 1;

   _.each(tourInfo, function(engine, key) {
      if (key == "season")
      {
         season = parseInt(engine);
      }
      if (key == "type")
      {
         div = engine;
      }
   });
   link = link + "?se=" + season + "&" + div + "&ga=" + gamen;
   window.open(link,'_blank');
}

function openLinks(link)
{
   window.open(link,'_blank');
}

var gameArrayClass = ['#39FF14', 'red', 'whitesmoke', 'orange'];

function setDarkMode(value)
{
   darkMode = value;
   if (!darkMode)
   {
      gameArrayClass = ['red', 'darkgreen', '#696969', 'darkblue'];
   }
   else
   {
      gameArrayClass = ['red', '#39FF14', 'whitesmoke', 'orange'];
   }
}

function crossFormatter(value, row, index, field) {
   plog ("Came here:", 0);
   if (!value.hasOwnProperty("Score")) // true
   {
      return value;
   } 

   var retStr = '';
   var valuex = _.get(value, 'Score');
   var countGames = 0;

   _.each(valuex, function(engine, key) 
   {
      var gameX = parseInt(countGames/2);
      var gameXColor = parseInt(gameX%3);

      if (engine.Result == "0.5")
      {
         engine.Result = '&frac12'
         gameXColor = 2;
      }
      else
      {
         gameXColor = parseInt(engine.Result);
      }
      if (retStr == '')
      {
         retStr = '<a title="' + engine.Game + '" style="cursor:pointer; color: ' + gameArrayClass[gameXColor] + ';"onclick="openCross(' + engine.Game + ')">' + engine.Result + '</a>';
      }
      else
      {
         retStr += ' ' + '<a title="' + engine.Game + '" style="cursor:pointer; color: ' + gameArrayClass[gameXColor] + ';"onclick="openCross(' + engine.Game + ')">' + engine.Result + '</a>';
      }
      countGames = countGames + 1;
      if (countGames%10 == 0)
      {
         retStr += '<br />';
      }
   });
  return retStr;
}

function formatter(value, row, index, field) {
   if (!value.hasOwnProperty("Score")) // true
   {
      return value;
   } 

   var retStr = '';
   var valuex = _.get(value, 'Score');
   var countGames = 0;

   _.each(valuex, function(engine, key) 
   {
      var gameX = parseInt(countGames/2);
      var gameXColor = parseInt(gameX%3);

      if (engine.Result == "0.5")
      {
         engine.Result = '&frac12'
         gameXColor = 2;
      }
      else
      {
         gameXColor = parseInt(engine.Result);
      }
      if (retStr == '')
      {
         retStr = '<a title="' + engine.Game + '" style="cursor:pointer; color: ' + gameArrayClass[gameXColor] + ';"onclick="openCross(' + engine.Game + ')">' + engine.Result + '</a>';
      }
      else
      {
         retStr += ' ' + '<a title="' + engine.Game + '" style="cursor:pointer; color: ' + gameArrayClass[gameXColor] + ';"onclick="openCross(' + engine.Game + ')">' + engine.Result + '</a>';
      }
      countGames = countGames + 1;
      if (countGames%10 == 0)
      {
         retStr += '<br />';
      }
   });
  return retStr;
}

function crossCellformatter(value, row, index, field) 
{
   if (row.crashes >= 3)
   {
      return {classes: 'strike'};
   }
   return {classes: 'normal'};
}

function cellformatter(value, row, index, field) {
   if (!value.hasOwnProperty("Score")) // true
   {
      return {classes: 'black'};
   } 
   return {classes: 'monofont'};
}

var engineScores = [];

function getRating(engine, engName)
{
   var elo = 0;
   var engNameL = null;

   if (engName != undefined)
   {
      engNameL = engName;
   }

   _.each(engGlobData.ratings, function(engine, key) {
      if (getShortEngineName(engNameL) == getShortEngineName(engine.name))
      {
         elo = engine.elo;
         return true;
      }
   });

   if (elo == 0)
   {
      elo = engine.Rating;
   }
   
   return elo;
}

function findEloDiffOld (whiteEngine, blackEngine, whiteEngName, blackEngName, score)
{
   var k = 10;
   var b_rating = blackEngine.Rating;
   var w_rating = whiteEngine.Rating;
   var expected_score = 1 / (1 + Math.pow(10, (b_rating - w_rating) / 400 )); 
   var rating_diff = k * (score - expected_score);
   return rating_diff;
}

function findEloDiff(whiteEngine, blackEngine, whiteEngName, blackEngName, score1, score2, gameno)
{
   var k = 10;
   var r1 = Math.pow(10, (whiteEngine.Rating/400));
   var r2 = Math.pow(10, (blackEngine.Rating/400));
   var e1 = r1/(r1+r2);
   var e2 = r2/(r1+r2);
   var w_rating = whiteEngine.Rating + k * (score1 - e1);
   var b_rating = blackEngine.Rating + k * (score2 - e2);
    
   whiteEngine.Rating = w_rating;
   blackEngine.Rating = b_rating;
}

function getOverallElo(data)
{
   var eloDiff = 0;

   _.each(crosstableData.Table, function(engine, key) {
      engine.Rating = getRating(engine, key); 
      });

   _.each(crosstableData.Table, function(engine, key) {
      eloDiff = 0;
      engine.OrigRating = engine.Rating;
      _.each(engine.Results, function(oppEngine, oppkey)
      {
         plog ("Opp engine is " + oppkey + " ,oppEngine is " + crosstableData.Table[oppkey].Rating, 1);
         var blackEngine = crosstableData.Table[oppkey];
         var strText = oppEngine.Text;
         var blackRating = blackEngine.Rating;
         for (var i = 0; i < strText.length; i++) 
         {
            plog ("strText.charAt(i): " + strText.charAt(i));
            if (strText.charAt(i) == '0')
            {
               findEloDiff (engine, blackEngine, key, oppkey, 0, 1, i);
            }
            else if (strText.charAt(i) == '1')
            {
               findEloDiff (engine, blackEngine, key, oppkey, 1, 0, i);
            }
            else if (strText.charAt(i) == '=')
            {
               findEloDiff (engine, blackEngine, key, oppkey, 0.5, 0.5, i);
            }
         }
         eloDiff = engine.Rating - engine.OrigRating;
         blackEngine.Rating = blackRating;
      }); 
      engine.Rating = engine.OrigRating;
      engine.eloDiff = eloDiff;
      plog ("Final eloDiff: " + eloDiff + " ,fscore: " + parseInt(engine.Rating + eloDiff), 1);
   });
}

function sleep(ms)
{
  return new Promise(resolve => setTimeout(resolve, ms));
}

var crash_re = /^(?:TCEC|Syzygy|TB pos|in progress|(?:White|Black) resigns|(?:White|Black) mates|Stale|Insuff|Fifty|3-[fF]old)/; // All possible valid terminations (hopefully).                      

function getEngRecSched(data, engineName)
{
   var resultData = {
      name: engineName,
      LossAsBlack: 0,
      WinAsBlack: 0,
      LossAsWhite: 0,
      LossAsStrike: 0,
      WinAsWhite: 0,
      Games: 0,
      Score: 0
   };

   _.each(data, function (engine, key)
   {
      if (typeof engine.Moves == 'undefined')
      {
         return false;
      }
      var dQ = engineDisqualified(engineName);
      if (dQ)
      {
         resultData.LossAsStrike = dQ;
      }
      else if (getShortEngineName(engineName) == getShortEngineName(engine.Black))
      {
         if (!engineDisqualified(engine.White))
         {
            if (engine.Result == "1-0")
            {
               if (!crash_re.test(engine.Termination))
               {
                  resultData.LossAsStrike = parseInt(resultData.LossAsStrike) + 1;
               }
               resultData.LossAsBlack = parseInt(resultData.LossAsBlack) + 1;
            }
            else if (engine.Result == "0-1")
            {
               resultData.WinAsBlack = parseInt(resultData.WinAsBlack) + 1;
               resultData.Score = resultData.Score + 1;
            }
            else
            {
               resultData.Score = resultData.Score + 0.5;
            }
            resultData.Games = resultData.Games + 1;
         }
      }
      else if (getShortEngineName(engineName) == getShortEngineName(engine.White))
      {
         if (!engineDisqualified(engine.Black))
         {
            if (engine.Result == "0-1")
            {
               if (!crash_re.test(engine.Termination))
               {
                  resultData.LossAsStrike = parseInt(resultData.LossAsStrike) + 1;
                  engine.LossAsStrike = engine.LossAsStrike + 1; 
               }
               resultData.LossAsWhite = parseInt(resultData.LossAsWhite) + 1;
            }
            else if (engine.Result == "1-0")
            {
               resultData.WinAsWhite = parseInt(resultData.WinAsWhite) + 1;
               resultData.Score = resultData.Score + 1;
            }
            else
            {
               resultData.Score = resultData.Score + 0.5;
            }
            resultData.Games = resultData.Games + 1;
         }
      }
   });
   return resultData;
}

function updateResData(engineName)
{
   _.each(crosstableData.Table, function (value, key)
   {
      if (key == engineName)
      {
         value.Strikes = parseInt(value.Strikes) + 1;
         plog ("value is " + engineName + ",key is :" + key, 1);
      }
      if (value.Strikes > 2)
      {
         value.Score = 0;
      }
   });
}

function engineDisqualified(engineName)
{
   var crashed = 0;

   _.each(crosstableData.Table, function (value, key)
   {
      if (key == engineName)
      {
         if (value.Strikes > 2)
         {
            crashed = value.Strikes;
            return true;
         }
      }
   });

   if (crashed)
   {
      plog ("engineName crashed:" + engineName + ":" + crashed, 1);
   }
   if (!crossCrash)
   {
      crashed = 0;
   }
   return crashed;
}

function eliminateCrash(data)
{
   var innerData = data;

   _.each(data, function (engine, key)
   {
      if (typeof engine.Moves == 'undefined')
      {
         return false;
      }

      if (!crash_re.test(engine.Termination))
      {
         if (engine.Result == "0-1")
         {
            plog ("Calling updateResData for " + engine.Black + "white:" + engine.White + " , engine.Result:" + engine.Result + ":term:" + engine.Termination, 1);
            updateResData(engine.White);
         }
         if (engine.Result == "1-0")
         {
            plog ("Calling updateResData for " + engine.Black + "white:" + engine.White + " , engine.Result:" + engine.Result + ":term:" + engine.Termination, 1);
            updateResData(engine.Black);
         }
      }
   });
}

function updateScoreHeadersData()
{
   var data = crosstableData;
   whiteScore = 0;
   blackScore = 0;

   _.each(crosstableData.Table, function(engine, key) {
      _.each(engine.Results, function(oppEngine, oppkey)
      {
         if (whiteEngineFull != null && key == whiteEngineFull)
         {
            if (oppkey == blackEngineFull)
            {
               $('#white-engine-elo').html(data.Table[key].Rating);
               $('#black-engine-elo').html(data.Table[oppkey].Rating);
               var strText = oppEngine.Text;
               for (var i = 0; i < strText.length; i++) 
               {
                  plog ("strText.charAt(i): " + strText.charAt(i), 1);
                  plog ("Whitescore: " + whiteScore + ", blakcScore:" + blackScore + ",oppEngine.Text:" + oppEngine.Text, 1);
                  if (strText.charAt(i) == '0')
                  {
                     blackScore = blackScore + 1;
                  }
                  else if (strText.charAt(i) == '1')
                  {
                     whiteScore = whiteScore + 1;
                  }
                  else if (strText.charAt(i) == '=')
                  {
                     blackScore = blackScore + 0.5;
                     whiteScore = whiteScore + 0.5;
                  }
               } 
               $('.white-engine-score').html(whiteScore.toFixed(1));
               $('.black-engine-score').html(blackScore.toFixed(1));
            }
         }
      }); 
   });
   plog ("Updated png elo:, whiteEngineFull:" + whiteEngineFull + " ,blackEngineFull:" + blackEngineFull, 0);
   
   prevwhiteEngineFull = whiteEngineFull;
   prevblackEngineFull = blackEngineFull;                                                                                                                                                        

   return 0;
}

function fixOrder()
{
   var crossData = crosstableData;
   var arr = [];
   var count = 0;

   _.each(crosstableData.Table, function(engine, key) {
      arr [count] = engine.Score;
      count = count + 1;
      engine.Rank = 0;
      });

   var sorted = arr.slice().sort(function(a,b){return b-a})
   var ranks = arr.slice().map(function(v){ return sorted.indexOf(v)+1 });
   plog ("Ranks is :" + ranks, 0);
   count = 0;
   var tiePoints = 0;

   _.each(crosstableData.Table, function(engine, key) {
      engine.Rank = ranks[count];
      count = count + 1;
      });

   count = 0;
   _.each(crosstableData.Table, function(engine, key) {
      engine.Neustadtl = 0;
      tiePoints = 0;
      
      _.each(crosstableData.Table, function(iengine, ikey) {
         if (ikey != key)
         {
            var sbCount = 0;
            for (var i = 0; i < engine.Results[ikey].Text.length ; i++)
            {
               if (engine.Results[ikey].Text[i] == '=')
               {
                  sbCount = sbCount + 0.5;
               }
               else if (engine.Results[ikey].Text[i] == '0')
               {
                  sbCount = sbCount + 0;
               }
               else
               {
                  sbCount = sbCount + 1;
               }
            }
            if (!engineDisqualified(key))
            {
               engine.Neustadtl = engine.Neustadtl + sbCount * iengine.Score;
            }
            else
            {
               engine.Neustadtl = 0;
            }

            plog ("iengine.Rank:" + iengine.Rank + ikey + ",engine.Rank:" + engine.Rank + key, 1);
            if (parseInt(iengine.Rank) && parseInt(engine.Rank) == parseInt(iengine.Rank))
            {
               if (engine.Strikes)
               {
                  tiePoints = tiePoints + -engine.Strikes;
               }
               else
               {
                  plog ("engine.Strikes: " + engine.Results[ikey].Text, 1);
                  if (sbCount > engine.Results[ikey].Text.length/2)
                  {
                     plog ("key won:" + key, 0);
                     tiePoints = tiePoints + 1/100; 
                  }
                  else if (sbCount < engine.Results[ikey].Text.length/2)
                  {
                     plog ("key lost:" + key, 0);
                     tiePoints = tiePoints + 0/100; 
                  }
                  else
                  {
                     plog ("key drew:" + key, 0);
                     tiePoints = tiePoints + 0.5/100; 
                  }
               }
            }
         }
      });
      tiePoints = tiePoints + engine.Wins/(100 * 100);
      tiePoints = tiePoints + engine.WinAsBlack/(100 * 100 * 100);
      tiePoints = tiePoints + engine.Neustadtl/(100 * 100 * 1000);
      tiePoints = tiePoints + engine.Rating/(100 * 100 * 1000 * 1000);
      plog ("tiePoints is :" + tiePoints, 0);
      arr[count] = engine.Score + tiePoints/10;
      count = count + 1;
   });

   var sorted = arr.slice().sort(function(b,a){return a-b})
   var ranks = arr.slice().map(function(v){ return sorted.indexOf(v)+1 });
   count = 0;

   _.each(crosstableData.Table, function(engine, key) {
      engine.Rank = ranks[count];
      count = count + 1;
      crosstableData.Order[engine.Rank-1] = key;
      });
}

async function updateCrosstableData(data) 
{
   crosstableData = data;
   plog ("Updating crosstable:", 0);
   var abbreviations = [];
   var standings = [];
   var sleepCount = 0;
   var retryScore = 0;

   while (oldSchedData == null)
   {
      sleepCount = sleepCount + 1;
      await sleep(500);
      if (sleepCount > 20)
      {
         break;
      }
   }

   eliminateCrash(oldSchedData);

   if (tcecElo)
   {
      getOverallElo(data);
   }

   _.each(crosstableData.Order, function(engine, key) {
      engineDetails = _.get(crosstableData.Table, engine);
      var getEngRes = getEngRecSched(oldSchedData, engine);
      wins = (getEngRes.WinAsWhite + getEngRes.WinAsBlack);
      var loss = 0;
      if (getEngRes)
      {
         loss = (getEngRes.LossAsWhite + getEngRes.LossAsBlack);
      }
      engineDetails.Score = getEngRes.Score;
      engineDetails.Strikes = getEngRes.LossAsStrike;
      engineDetails.Wins = wins;
      engineDetails.WinAsBlack = getEngRes.WinAsBlack;
      });

   fixOrder();

   _.each(crosstableData.Order, function(engine, key) {
      plog ("ADding entry:" + engine, 0);
      engineDetails = _.get(crosstableData.Table, engine);
      var getEngRes = getEngRecSched(oldSchedData, engine);
      wins = (getEngRes.WinAsWhite + getEngRes.WinAsBlack);
      var loss = 0;
      if (getEngRes)
      {
         loss = (getEngRes.LossAsWhite + getEngRes.LossAsBlack);
      }
      if (engineDetails.eloDiff)
      {
         plog ("engine.eloDiff is defined:" + engineDetails.eloDiff, 1);
         elo = Math.round(engineDetails.eloDiff);
      }
      else
      {
         elo = Math.round(engineDetails.Elo);
      }
      eloDiff = engineDetails.Rating + elo;
      var dQ = engineDisqualified(engine);
      if (dQ)
      {
         engine = '<div class="right-align strike"><img class="right-align-pic" src="img/engines/'+ getShortEngineName(engine) +'.jpg" />' + '<a class="right-align-name">' + engine + '</a></div>';
      }
      else
      {
         engine = '<div class="right-align"><img class="right-align-pic" src="img/engines/'+ getShortEngineName(engine) +'.jpg" />' + '<a class="right-align-name">' + engine + '</a></div>';
      }
      wins = wins + ' [' + getEngRes.WinAsWhite + '/' + getEngRes.WinAsBlack + ']';
      //loss = loss + ' [' + getEngRes.LossAsWhite + '/' + getEngRes.LossAsBlack + '/' + getEngRes.LossAsStrike + ']';
      loss = loss + ' [' + getEngRes.LossAsWhite + '/' + getEngRes.LossAsBlack + ']';
      engineDetails.Score = getEngRes.Score;
      if (dQ)
      {
         engineDetails.Neustadtl = 0;
      }

      var entry = {
         rank: engineDetails.Rank,
         name: engine,
         games: getEngRes.Games,
         points: getEngRes.Score,
         wins: wins,
         loss: loss,
         crashes: getEngRes.LossAsStrike,
         sb: parseFloat(engineDetails.Neustadtl).toFixed(2),
         elo: engineDetails.Rating,
         elo_diff: elo + ' [' + eloDiff + ']'
         };
        standings = _.union(standings, [entry]);
      });

   if (!crossTableInitialized) {
     columns = [
       {
         field: 'rank',
         title: 'Rank'
        ,sortable: true
        ,width: '4%'
        ,cellStyle: crossCellformatter
       },
       {
         field: 'name',
         title: 'Engine'
        ,sortable: true
        ,width: '28%'
        ,cellStyle: crossCellformatter
       },
       {
         field: 'games',
         title: '# Games'
        ,sortable: true
        ,width: '4%'
        ,cellStyle: crossCellformatter
       },
       {
         field: 'points',
         title: 'Points'
        ,sortable: true
        ,width: '7%'
        ,cellStyle: crossCellformatter
       },
       {
         field: 'crashes',
         title: 'Crashes'
        ,sortable: true
        ,width: '4%'
        ,cellStyle: crossCellformatter
       },
       {
         field: 'wins',
         title: 'Wins [W/B]'
        ,width: '10%'
        ,cellStyle: crossCellformatter
       },
       {
         field: 'loss',
         title: 'Loss [W/B]'
        ,width: '10%'
        ,cellStyle: crossCellformatter
       },
       {
         field: 'sb',
         title: 'SB'
        ,sortable: true
        ,cellStyle: crossCellformatter
        ,width: '4%'
       },
       {
         field: 'elo',
         title: 'Elo'
        ,cellStyle: crossCellformatter
        ,sortable: true
        ,width: '5%'
       },
       {
         field: 'elo_diff',
         title: 'Diff [Live]'
        ,width: '7%'
        ,cellStyle: crossCellformatter
       }
     ];

     $('#crosstable').bootstrapTable({
       classes: 'table table-striped table-no-bordered',
       columns: columns,
       sortName: 'rank'
     });
     crossTableInitialized = true;
   }
   $('#crosstable').bootstrapTable('load', standings);

   retryScore = updateScoreHeadersData();
   oldSchedData = null;
   updateStandtableData(crosstableData);
}

function updateEngRatingData(data)
{
   engGlobData = data;
}

function updateTourInfo(data)
{
   tourInfo = data;
}

function readTourInfo()
{
   axios.get('tournament.json')
   .then(function (response)
   {
      updateTourInfo(response.data);
   })
   .catch(function (error) 
   {
      plog(error, 0);
   });
}

function updateEngRating()
{
   axios.get('enginerating.json')
   .then(function (response)
   {
      updateEngRatingData(response.data);
   })
   .catch(function (error) 
   {
      plog(error, 0);
   });
}

function updateCrosstable() 
{
   axios.get('crosstable.json')
   .then(function (response)
   {
      updateCrosstableData(response.data);
   })
   .catch(function (error) 
   {
      // handle error
      plog(error, 0);
   });
}

function strx(json)
{
   return JSON.stringify(json);
}

function shallowCopy(data)
{
   return JSON.parse(JSON.stringify(data));
}

function updateH2hData(h2hdataip) 
{
   if (h2hRetryCount < 10 &&
       ((prevwhiteEngineFullSc != null &&
         prevwhiteEngineFullSc == whiteEngineFull) &&
        (prevblackEngineFullSc != null &&
         blackEngineFull == prevblackEngineFullSc)))
   {
      plog ("H2h did not get updated, lets retry later: prevwhiteEngineFull:" + 
            prevwhiteEngineFullSc + 
            " ,whiteEngineFull:" + whiteEngineFull + 
            " ,h2hRetryCount:" + h2hRetryCount +
            " ,prevblackEngineFull:" + prevblackEngineFullSc + " ,blackEngineFull:" + blackEngineFull, 0);
      h2hRetryCount = h2hRetryCount + 1;
      setTimeout(function() { updateH2hData(h2hdataip); }, 5000);
      return;
   }
   else
   {
      plog ("H2h got updated", 0);
   }

   h2hRetryCount = 0;
   prevwhiteEngineFullSc = whiteEngineFull;
   prevblackEngineFullSc = blackEngineFull;

   var h2hdata = [];
   var prevDate = 0;
   var momentDate = 0;
   var diff = 0;
   var gameDiff = 0;
   var timezoneDiff = moment().utcOffset() * 60 * 1000 - 3600 * 1000;
   var h2hrank = 0;
   var schedEntry = {};
   var data = shallowCopy(h2hdataip);

   _.each(data, function(engine, key) 
   {
      engine.Gamesort = engine.Game;
      if (engine.Start)
      {
         momentDate = moment(engine.Start, 'HH:mm:ss on YYYY.MM.DD');
         if (prevDate)
         {
            diff = diff + momentDate.diff(prevDate);
            gameDiff = diff/(engine.Game-1);
         }
         momentDate.add(timezoneDiff);
         engine.Start = momentDate.format('HH:mm:ss on YYYY.MM.DD');
         prevDate = momentDate;
         var CurrentDate1 = moment().unix();
         var CurrentDate2 = moment(engine.Start, 'HH:mm:ss on YYYY.MM.DD').unix();
         //plog ("diff is :" + (CurrentDate2 - CurrentDate1), 0);
      }
      else
      {
         if (gameDiff)
         {
            prevDate.add(gameDiff + timezoneDiff);
            engine.Start = "Estd: " + prevDate.format('HH:mm:ss on YYYY.MM.DD');
         }
      }
      if (typeof engine.Moves != 'undefined')
      {
         gamesDone = engine.Game;
         engine.Game = '<a title="TBD" style="cursor:pointer; color: ' + gameArrayClass[3] + ';"onclick="openCross(' + engine.Game + ')">' + engine.Game + '</a>';
      }
      engine.FixWhite = engine.White;
      engine.FixBlack = engine.Black;
 
      if (engine.Result != undefined)
      {
         if (engine.Result == "1/2-1/2")
         {
            /* do nothing */
         }
         else if (engine.Result == "1-0")
         {
            engine.FixWhite = '<div style="color:' + gameArrayClass[1] + '">' + engine.White + '</div>';
            engine.FixBlack = '<div style="color:' + gameArrayClass[0] + '">' + engine.Black + '</div>';
         }
         else if (engine.Result == "0-1")
         {
            engine.FixWhite = '<div style="color:' + gameArrayClass[0] + '">' + engine.White + '</div>';
            engine.FixBlack = '<div style="color:' + gameArrayClass[1] + '">' + engine.Black + '</div>';
         }
      }
      if ((engine.Black == blackEngineFull && engine.White == whiteEngineFull) ||
          (engine.Black == whiteEngineFull && engine.White == blackEngineFull))
      {
         engine.h2hrank = engine.Game;
         if (engine.Result != undefined)
         {
            h2hrank += 1;
            if (h2hrank%2 == 0)
            {
               engine.h2hrank = engine.Game + ' (R)';
            }
         }
         h2hdata = _.union(h2hdata, [engine]);
      }
   });

   $('#h2h').bootstrapTable('load', h2hdata);
}

function updateScheduleData(scdatainput) 
{
   plog ("Updating schedule:", 0);
   var scdata = [];
   var prevDate = 0;
   var momentDate = 0;
   var diff = 0;
   var gameDiff = 0;
   var timezoneDiff = moment().utcOffset() * 60 * 1000 - 3600 * 1000;
   var schedEntry = {};
   oldSchedData = shallowCopy(scdatainput);
   var data = shallowCopy(scdatainput);

   _.each(data, function(engine, key) 
   {
      engine.Gamesort = engine.Game;
      if (engine.Start)
      {
         momentDate = moment(engine.Start, 'HH:mm:ss on YYYY.MM.DD');
         if (prevDate)
         {
            diff = diff + momentDate.diff(prevDate);
            gameDiff = diff/(engine.Game-1);
         }
         momentDate.add(timezoneDiff);
         engine.Start = momentDate.format('HH:mm:ss on YYYY.MM.DD');
         prevDate = momentDate;
      }
      else
      {
         if (gameDiff)
         {
            prevDate.add(gameDiff + timezoneDiff);
            engine.Start = "Estd: " + prevDate.format('HH:mm:ss on YYYY.MM.DD');
         }
      }
      if (typeof engine.Moves != 'undefined')
      {
         gamesDone = engine.Game;
         engine.Game = '<a title="TBD" style="cursor:pointer; color: ' + gameArrayClass[3] + ';"onclick="openCross(' + engine.Game + ')">' + engine.Game + '</a>';
      }
      engine.FixWhite = engine.White;
      engine.FixBlack = engine.Black;
 
      if (engine.Result != undefined)
      {
         if (engine.Result == "1/2-1/2")
         {
            /* do nothing */
         }
         else if (engine.Result == "1-0")
         {
            engine.FixWhite = '<div style="color:' + gameArrayClass[1] + '">' + engine.White + '</div>';
            engine.FixBlack = '<div style="color:' + gameArrayClass[0] + '">' + engine.Black + '</div>';
         }
         else if (engine.Result == "0-1")
         {
            engine.FixWhite = '<div style="color:' + gameArrayClass[0] + '">' + engine.White + '</div>';
            engine.FixBlack = '<div style="color:' + gameArrayClass[1] + '">' + engine.Black + '</div>';
         }
      }
      scdata = _.union(scdata, [engine]);
   });

   $('#schedule').bootstrapTable('load', scdata);
   var options = $('#schedule').bootstrapTable('getOptions');
   pageNum = parseInt(gamesDone/options.pageSize) + 1;
   $('#schedule').bootstrapTable('selectPage', pageNum);
}

function updateWinnersData(winnerData) 
{
   plog ("Updating winners:", 0);
   var scdata = [];
   var prevDate = 0;
   var momentDate = 0;
   var diff = 0;
   var gameDiff = 0;
   var timezoneDiff = moment().utcOffset() * 60 * 1000 - 3600 * 1000;
   var schedEntry = {};
   var data = shallowCopy(winnerData);

   _.each(data, function(engine, key) 
   {
      var redColor = 'darkred';
      var link = "\'" + engine.link + "\'";
      engine.name = '<a title="TBD" style="cursor:pointer; color: ' + gameArrayClass [0] + ';"onclick="openLinks(' + link + ')">' + engine.name + '</a>';
      scdata = _.union(scdata, [engine]);
   });

   $('#winner').bootstrapTable('load', scdata);
}

function updateWinners() 
{
    axios.get('winners.json')
    .then(function (response) 
    {
      updateWinnersData(response.data);
    })
    .catch(function (error) {
      // handle error
      plog(error, 0);
    });
}

function updateSchedule() 
{
    axios.get('schedule.json')
    .then(function (response) 
    {
      updateScheduleData(response.data);
      updateH2hData(response.data);
    })
    .catch(function (error) {
      // handle error
      plog(error, 0);
    });
}

function pad(pad, str) {
  if (typeof str === 'undefined') 
    return pad;
  return (pad + str).slice(-pad.length);
}

var game = new Chess();

var onDragStart = function(source, piece, position, orientation) 
{
   if (game.game_over() === true ||
         (game.turn() === 'w' && piece.search(/^b/) !== -1) ||
         (game.turn() === 'b' && piece.search(/^w/) !== -1)) 
   {
      return false;
   }
};
  
var onDragMove = function(newLocation, oldLocation, source,
                          piece, position, orientation) 
{
   var move = game.move({
      from: newLocation,
      to: oldLocation,
      promotion: 'q' // NOTE: always promote to a queen for example simplicity
   });

   // illegal move
   if (move === null) return 'snapback';

   var pvLen = activePvKey[2] + 1;
   var fen = ChessBoard.objToFen(position);
   if (activePvKey[2] == 0)
   {
      activePv[0] = {};
      activePv[0].fen = fen; 
   }
   var moveFrom = oldLocation;
   var moveTo = newLocation;
   if (newLocation == oldLocation)
   {
      return;
   }

   var str = newLocation + '-' + oldLocation;+ '-' + newLocation;
   pvBoarda.move(str);
   fen = pvBoarda.fen();
   activePv[pvLen] = {};
   activePv[pvLen].fen = fen;
   activePv[pvLen].from = oldLocation;
   activePv[pvLen].to = newLocation;
   $(this).addClass('active-pv-move');
   pvBoardEla.find('.' + squareClass).removeClass(highlightClassPv);
   pvBoardEla.find('.square-' + moveFrom).addClass(highlightClassPv);
   pvBoardEla.find('.square-' + moveTo).addClass(highlightClassPv);
   pvSquareToHighlight = moveTo;
   activePvKey[2] = pvLen;
   analysFen = fen;
};

function drawGivenBoardDrag(cont, boardNotation)
{
   var newBoard =  ChessBoard(cont, {
      pieceTheme: window[ptheme + "_piece_theme"],
      showNotation: boardNotation,
      position: 'start',
      onMoveEnd: onMoveEnd,
      moveSpeed: 1,
      appearSpeed: 1,
      draggable: true,
      onDragStart: onDragStart,
      onDrop: onDragMove,   
      boardTheme: window[btheme + "_board_theme"],
      overlay: true
   });
   return newBoard;
}

function drawGivenBoard(cont, boardNotation)
{
   var newBoard =  ChessBoard(cont, {
      pieceTheme: window[ptheme + "_piece_theme"],
      showNotation: boardNotation,
      position: 'start',
      onMoveEnd: onMoveEnd,
      moveSpeed: 1,
      appearSpeed: 1,
      boardTheme: window[btheme + "_board_theme"],
      overlay: true
   });
   return newBoard;
}

function setBoardInit()
{
   var boardTheme = localStorage.getItem('tcec-board-theme');
   var pieceTheme = localStorage.getItem('tcec-piece-theme');

   if (boardTheme != undefined)
   {
      btheme = boardTheme;
   }

   if (pieceTheme != undefined)
   {
      ptheme = pieceTheme;
   }

   pvBoarda = drawGivenBoardDrag('pv-boarda', boardNotationPv);
   board = drawGivenBoard('board', boardNotation);
   
   if (!boardArrows) {
    board.clearAnnotation();
   }

   pvBoardw = drawGivenBoard('pv-boardw', boardNotationPv);
   pvBoardb = drawGivenBoard('pv-boardb', boardNotationPv);
   pvBoardwc = drawGivenBoard('pv-boardwc', boardNotationPv);
   pvBoardbc = drawGivenBoard('pv-boardbc', boardNotationPv);

   localStorage.setItem('tcec-board-theme', btheme);
   localStorage.setItem('tcec-piece-theme', ptheme);
   $('input[value='+btheme+'b]').prop('checked', true);
   $('input[value='+ptheme+'p]').prop('checked', true);

   return {board, pvBoardw, pvBoardb, pvBoarda, pvBoardwc, pvBoardbc};
}

function setBoard()
{
   var fen = board.fen();
   board = drawGivenBoard('board', boardNotation);
   board.position(fen, false);

   fen = pvBoardb.fen();
   pvBoardb = drawGivenBoard('pv-boardb', boardNotationPv);
   pvBoardb.position(fen, false);

   fen = pvBoardw.fen();
   pvBoardw = drawGivenBoard('pv-boardw', boardNotationPv);
   pvBoardw.position(fen, false);

   fen = pvBoarda.fen();
   pvBoarda = drawGivenBoardDrag('pv-boarda', boardNotationPv);
   pvBoarda.position(fen, false);

   fen = pvBoardwc.fen();
   pvBoardwc = drawGivenBoardDrag('pv-boardwc', boardNotationPv);
   pvBoardwc.position(fen, false);

   fen = pvBoardbc.fen();
   pvBoardbc = drawGivenBoardDrag('pv-boardbc', boardNotationPv);
   pvBoardbc.position(fen, false);

   localStorage.setItem('tcec-board-theme', btheme);
   localStorage.setItem('tcec-piece-theme', ptheme);

   $('input[value='+btheme+'b]').prop('checked', true);
   $('input[value='+ptheme+'p]').prop('checked', true);

   if (prevPgnData && prevPgnData.Moves.length > 0) 
   {
      boardEl.find('.' + squareClass).removeClass(highlightClass);
      boardEl.find('.square-' + moveFrom).addClass(highlightClass);
      boardEl.find('.square-' + moveTo).addClass(highlightClass);
      if (moveFromPvB)
      {
         pvBoardElb.find('.' + squareClass).removeClass(highlightClassPv);
         pvBoardElb.find('.square-' + moveFromPvB).addClass(highlightClassPv);
         pvBoardElb.find('.square-' + moveToPvB).addClass(highlightClassPv);
      }
      if (moveFromPvW)
      {
         pvBoardElw.find('.' + squareClass).removeClass(highlightClassPv);
         pvBoardElw.find('.square-' + moveFromPvW).addClass(highlightClassPv);
         pvBoardElw.find('.square-' + moveToPvW).addClass(highlightClassPv);
      }
      if (moveFromPvL)
      {
         pvBoardEla.find('.' + squareClass).removeClass(highlightClassPv);
         pvBoardEla.find('.square-' + moveFromPvL).addClass(highlightClassPv);
         pvBoardEla.find('.square-' + moveToPvL).addClass(highlightClassPv);
      }
   }
}

function updateTables()
{
  updateEngRating();
  updateSchedule();
  standTableInitialized = false;
  updateCrosstable();
  updateStandtable();
  readTourInfo();
  setTimeout(function() 
  { 
     updateCrosstable();
     eventCrosstableWrap();
  }, 3000);
}

function setTwitchChatUrl(darkmode)
{
  if (darkmode) {
    $('#chatright').attr('src', twitchChatUrl + '?darkpopout');
  } else {
    $('#chatright').attr('src', twitchChatUrl);
  }
}

function setTwitchBackgroundInit(backg)
{
   var setValue = 0;
   if (backg == 1)
   {
      setTwitchChatUrl(false);
      setValue = 1;
   }
   else if (backg == 2)
   {
      setTwitchChatUrl(true);
      setValue = 2;
   }
   else
   {
      var darkMode = localStorage.getItem('tcec-dark-mode');
      if (darkMode == 20)
      {
         setTwitchChatUrl(true);
         setValue = 2;
      }
      else
      {
         setTwitchChatUrl(false);
         setValue = 1;
      }
   }
   localStorage.setItem('tcec-twitch-back-mode', setValue);
}

function setTwitchBackground(backg)
{
   var setValue = 0;
   var darkMode = localStorage.getItem('tcec-twitch-back-mode');
   if (darkMode != undefined)
   {
      if (darkMode == 1)
      {
         setTwitchChatUrl(false);
         setValue = 1;
      }
      else if (darkMode == 2)
      {
         setTwitchChatUrl(true);
         setValue = 2;
      }
      else if (darkMode == 0)
      {
         if (backg == 1)
         {
            setTwitchChatUrl(false);
         }
         else
         {
            setTwitchChatUrl(true);
         }
      }
   }
   else
   {
      if (backg == 1)
      {
         setTwitchChatUrl(false);
      }
      else
      {
         setTwitchChatUrl(true);
      }
   }
   localStorage.setItem('tcec-twitch-back-mode', setValue);
   $('input[value='+setValue+']').prop('checked', true);
}

function setDark()
{
  $('.toggleDark').find('i').removeClass('fa-moon');
  $('.toggleDark').find('i').addClass('fa-sun');
  $('body').addClass('dark');
  setTwitchBackground(2);
  setTwitchChatUrl(true)
  $('#info-frame').attr('src', 'info.html?body=dark');
  $('#crosstable').addClass('table-dark');
  $('#schedule').addClass('table-dark');
  $('#winner').addClass('table-dark');
  $('#standtable').addClass('table-dark');
  $('#infotable').addClass('table-dark');
  $('#h2h').addClass('table-dark');
  $('#themecheck').prop('checked', false);
  setDarkMode(1);
}

function setLight()
{
  $('body').removeClass('dark');
  $('.toggleDark').find('i').addClass('fa-moon');
  $('.toggleDark').find('i').removeClass('fa-sun');
  $('input.toggleDark').prop('checked', false);
  $('#crosstable').removeClass('table-dark');
  $('#schedule').removeClass('table-dark');
  setTwitchBackground(1);
  $('#info-frame').attr('src', 'info.html?body=light');
  $('#standtable').removeClass('table-dark');
  $('#winner').removeClass('table-dark');
  $('#infotable').removeClass('table-dark');
  $('#h2h').removeClass('table-dark');
  $('#themecheck').prop('checked', true);
  setDarkMode(0);
}

function setDefaults()
{
   setSound();
   showTabDefault();
   setHighlightDefault();
   setHighlightDefaultPv();
   setDefaultThemes();
   setliveEngine();
   setDefaultEnginecolor();
   setNotationDefault();
   setNotationPvDefault();
   setMoveArrowsDefault();
   setBoard();
   setCrash();
   loadBoardMiddle();
}

function setDefaultThemes()
{
   var darkMode = localStorage.getItem('tcec-dark-mode');

   if (darkMode == 20) 
   {
      setDark();
   } 
   else 
   {
      setLight();
   }
   setPlyDivDefault();
}

function setBoardUser(boardTheme)
{
   if (boardTheme != undefined)
   {
      btheme = boardTheme;
   }
   setBoard();
}

function setPieceUser(pTheme)
{
   if (pTheme != undefined)
   {
      ptheme = pTheme;
   }
   setBoard();
}

function setDefaultEnginecolor()
{
   var color = localStorage.getItem('tcec-engine-color');
   if (color == undefined)
   {
      color = 0;
   }
   engine2colorno = color;
   color = 'engcolor'+color;
   $('input[value='+color+']').prop('checked', true);
   drawEval();
   updateChartData();
}

function setEngineColor(color)
{
   engine2colorno = color; 
   localStorage.setItem('tcec-engine-color', color);
   drawEval();
   updateChartData(); 
}

function updateLiveEvalInit()
{
      $('#live-eval').bootstrapTable({
          classes: 'table table-striped table-no-bordered',
          columns: [
          {
              field: 'engine',
              title: 'Eng',
              width: '30'
          },
          {
              field: 'eval',
              title: 'Eval',
              width: '20'
          },
          {
              field: 'pv',
              title: 'PV',
              width: '290'
          },
          {
              field: 'depth',
              title: 'Depth',
              width: '20'
          },
          {
              field: 'speed',
              title: 'Speed',
              width: '20'
          },
          {
              field: 'nodes',
              title: 'Nodes',
              width: '20'
          },
          {
              field: 'tbhits',
              title: 'TB',
              width: '20'
          }
        ]
      });
}

function updateLiveEvalDataHistory(engineDatum, fen, container, contno)
{
   var engineData = [];
   livePvs[contno] = [];
   var livePvsC = livePvs[contno];
   var score = 0;
   datum = engineDatum;
   var tbhits = datum.tbhits;

   if (!isNaN(datum.eval))
   {
      score = parseFloat(datum.eval);
   }
   else
   {
      score = datum.eval;
   }

   if (datum.pv.search(/.*\.\.\..*/i) == 0)
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

   pvs = [];

   if (datum.pv.length > 0 && datum.pv.trim() != "no info")
   {
    var chess = new Chess(fen);
    var currentFen = fen;

    datum.pv = datum.pv.replace("...", ". .. ");
    _.each(datum.pv.split(' '), function(move) {
        if (isNaN(move.charAt(0)) && move != '..') {
          moveResponse = chess.move(move);

          if (!moveResponse || typeof moveResponse == 'undefined') {
               plog("undefine move" + move);
          } else {
            currentFen = chess.fen();
            newPv = {
              'from': moveResponse.from,
              'to': moveResponse.to,
              'm': moveResponse.san,
              'fen': currentFen
            };

            currentLastMove = move.slice(-2);

            pvs = _.union(pvs, [newPv]);
          }
        }
    });
   }

   if (pvs.length > 0) {
    livePvsC = _.union(livePvsC, [pvs]);
   }

   if (score > 0) {
    score = '+' + score;
   }

   datum.eval = score;
   datum.tbhits = getTBHits(datum.tbhits);
   datum.nodes = getNodes(datum.nodes);

   if (datum.pv.length > 0 && datum.pv != "no info") {
    engineData = _.union(engineData, [datum]);
   }

  board.clearAnnotation();
  $(container).html('');
  _.each(engineData, function(engineDatum) {
    if (engineDatum.engine == '')
    {
       engineDatum.engine = datum.engine;
    }
    
    parseScore = 0.00;
    if (isNaN(engineDatum.eval)) {
      parseScore = engineDatum.eval;
    } else {
      parseScore = (engineDatum.eval * 1).toFixed(2);
    }
    
    var evalStr = getPct(engineDatum.engine, parseScore);
    $(container).append('<h6>' + evalStr + ' PV(A) ' + '</h6><small>[D: ' + engineDatum.depth + ' | TB: ' + engineDatum.tbhits + ' | Sp: ' + engineDatum.speed + ' | N: ' + engineDatum.nodes +']</small>');
    var moveContainer = [];
    if (livePvsC.length > 0) {
      _.each(livePvsC, function(livePv, pvKey) {
        var moveCount = 0;
        _.each(engineDatum.pv.split(' '), function(move) {
          if (isNaN(move.charAt(0)) && move != '..') {
            pvLocation = livePvsC[pvKey][moveCount];
            if (pvLocation) {
               moveContainer = _.union(moveContainer, ["<a href='#' class='set-pv-board' live-pv-key='" + pvKey +
                                                       "' move-key='" + moveCount +
                                                       "' engine='" + (contno) +
                                                       "' color='live'>" + pvLocation.m +
                                                       '</a>']);
               }
            else
            {
               plog ("pvlocation not defined");
            }
            moveCount++;
          } else {
            moveContainer = _.union(moveContainer, [move]);
          }
        });

        if (boardArrows) {
          if (pvKey == 0) {
            color = 'blue';
          } else {
            color = 'orange';
          }
          board.addArrowAnnotation(livePvsC[pvKey][0].from, livePvsC[pvKey][0].to, color, board.orientation());
        }
      });
    }
    $(container).append('<div class="engine-pv engine-pv-live alert alert-dark">' + moveContainer.join(' ') + '</div>');
    livePvs[contno] = livePvsC[0];
  });

   // $('#live-eval').bootstrapTable('load', engineData);
   // handle success
}

var clearedAnnotation = 0;
function updateLiveEvalData(datum, update, fen, contno, initial)
{
   var container = '#live-eval-cont' + contno;

   if (contno == 1 && !showLivEng1)
   {
      $(container).html(''); 
      return;
   }
   if (contno == 2 && !showLivEng2)
   {
      $(container).html(''); 
      return;
   }

   if (!initial && (contno == 1))
   {
      board.clearAnnotation();
      clearedAnnotation = 1;
   }

   plog ("Annotation did not get cleared" + clearedAnnotation + ",contno:" + contno, 1);
   if ((clearedAnnotation < 1) && (contno == 2))
   {
      board.clearAnnotation();
   }

   if (contno == 2)
   {
      clearedAnnotation = 0;
   }
   var engineData = [];
   livePvs[contno] = [];
   var livePvsC = livePvs[contno];
   var score = 0;
   var tbhits = datum.tbhits;

   if (update && !viewingActiveMove)
   {
      return;
   }

   if (!update)
   {
      updateLiveEvalDataHistory(datum, fen, container, contno);
      return;
   }

   if (!isNaN(datum.eval))
   {
      score = parseFloat(datum.eval);
   }
   else
   {
      score = datum.eval;
   }

   if (datum.pv.search(/.*\.\.\..*/i) == 0)
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

   pvs = [];

   if (datum.pv.length > 0 && datum.pv.trim() != "no info")
   {
    var chess = new Chess(activeFen);

    var currentFen = activeFen;

    datum.pv = datum.pv.replace("...", ". .. ");
    _.each(datum.pv.split(' '), function(move) {
        if (isNaN(move.charAt(0)) && move != '..') {
          moveResponse = chess.move(move);

          if (!moveResponse || typeof moveResponse == 'undefined') {
               plog("undefine move" + move);
          } else {
            currentFen = chess.fen();
            newPv = {
              'from': moveResponse.from,
              'to': moveResponse.to,
              'm': moveResponse.san,
              'fen': currentFen
            };

            currentLastMove = move.slice(-2);

            pvs = _.union(pvs, [newPv]);
          }
        }
    });
   }

   if (pvs.length > 0) {
    livePvsC = _.union(livePvsC, [pvs]);
   }

   if (score > 0) {
    score = '+' + score;
   }

   datum.eval = score;
   datum.tbhits = getTBHits(datum.tbhits);
   datum.nodes = getNodes(datum.nodes);

   if (datum.pv.length > 0 && datum.pv != "no info") {
    engineData = _.union(engineData, [datum]);
   }

  $(container).html('');

  _.each(engineData, function(engineDatum) {
    if (engineDatum.engine == '')
    {
       engineDatum.engine = datum.engine;
    }
    
    parseScore = 0.00;
    if (isNaN(engineDatum.eval)) {
      parseScore = engineDatum.eval;
    } else {
      parseScore = (engineDatum.eval * 1).toFixed(2);
    }
   
    var evalStr = getPct(engineDatum.engine, parseScore);
    
    $(container).append('<h6>' + evalStr + ' PV(A) ' + '</h6><small>[D: ' + engineDatum.depth + ' | TB: ' + engineDatum.tbhits + ' | Sp: ' + engineDatum.speed + ' | N: ' + engineDatum.nodes +']</small>');
    var moveContainer = [];
    if (livePvsC.length > 0) {
      _.each(livePvsC, function(livePv, pvKey) {
        var moveCount = 0;
        _.each(engineDatum.pv.split(' '), function(move) {
          if (isNaN(move.charAt(0)) && move != '..') {
            pvLocation = livePvsC[pvKey][moveCount];
            if (pvLocation) {
               moveContainer = _.union(moveContainer, ["<a href='#' class='set-pv-board' live-pv-key='" + pvKey +
                                                       "' move-key='" + moveCount +
                                                       "' engine='" + (contno) +
                                                       "' color='live'>" + pvLocation.m +
                                                       '</a>']);
               }
            else
            {
               plog ("pvlocation not defined");
            }
            moveCount++;
          } else {
            moveContainer = _.union(moveContainer, [move]);
          }
        });
        
        if (boardArrows) {
          if (pvKey == 0) {
            color = 'blue';
          } else {
            color = 'orange';
          }
          if (contno == 2)
          {
             color = 'reds';
          }
          else
          {
             color = 'blues';
          }
          board.addArrowAnnotation(livePv[0].from, livePv[0].to, color, board.orientation());
        }
      });
    }
    $(container).append('<div class="engine-pv engine-pv-live alert alert-dark">' + moveContainer.join(' ') + '</div>');
    livePvs[contno] = livePvsC[0];
  });


   // $('#live-eval').bootstrapTable('load', engineData);
   // handle success
}

var engine2LiveData = undefined;

function updateLiveEval() {
   axios.get('data.json?no-cache' + (new Date()).getTime())
   .then(function (response)
   {
      updateLiveEvalData(response.data, 1, null, 1, 1);
      updateLiveEvalData(engine2LiveData, 1, null, 2, 1);
   })
   .catch(function (error) {
      // handle error
      plog(error);
   });
   axios.get('data1.json?no-cache' + (new Date()).getTime())
   .then(function (response)
   {
      engine2LiveData = response.data;
   })
   .catch(function (error) {
      // handle error
      plog(error);
   });
}

function updateLiveChartData(data, contno) 
{
   if (typeof data.moves != 'undefined') 
   {
      if (contno == 1)
      {
         liveEngineEval1 = data.moves;
         livePVHist[contno] = data;
      }
      else
      {
         liveEngineEval2 = data.moves;
         livePVHist[contno] = data;
      }
      updateChartData();
   } else {
      if (contno == 1)
      {
         liveEngineEval1 = [];
      }
      if (contno == 2)
      {
         liveEngineEval2 = [];
      }
   }
}

function updateLiveChart() 
{
   axios.get('liveeval.json')
   .then(function (response) {
      updateLiveChartData(response.data, 1);
   })
   .catch(function (error) {
      // handle error
      plog(error, 0);
   });
   axios.get('liveeval1.json')
   .then(function (response) {
      updateLiveChartData(response.data, 2);
   })
   .catch(function (error) {
      // handle error
      console.log(error);
   });
}

function updateStandtableData(data) 
{
   plog ("Updating standtable:", 0);
   var standtableData = data;

   var abbreviations = [];
   var standings = [];

   _.each(standtableData.Table, function(engine, key) {
     abbreviations = _.union(abbreviations, [{abbr: engine.Abbreviation, name: key}]);
   });

   _.each(standtableData.Order, function(engine, key) {
     engineDetails = _.get(standtableData.Table, engine);

     wins = (engineDetails.WinsAsBlack + engineDetails.WinsAsWhite);
     elo = Math.round(engineDetails.Elo);
     eloDiff = engineDetails.Rating + elo;

     engine = '<div class="right-align"><img class="right-align-pic" src="img/engines/'+ getShortEngineName(engine) +'.jpg" />' + '<a class="right-align-name">' + engine + '</a></div>';

     var entry = {
       rank: engineDetails.Rank,
       name: engine,
       points: engineDetails.Score.toFixed(1)
     };

     _.each(abbreviations, function (abbreviation) {
       var score2 = '';
       engineName = abbreviation.name;
       engineAbbreviation = abbreviation.abbr;

       engineCount = standtableData.Order.length;
       if (engineCount < 1) {
         engineCount = 1;
       }

       rounds = Math.floor(engineDetails.Games / engineCount) + 1;

       if (engineDetails.Abbreviation == engineAbbreviation) {
         for (i = 0; i < rounds; i++) {
           score2 = '';
         }
       } else {
         resultDetails = _.get(engineDetails, 'Results');
         matchDetails = _.get(resultDetails, engineName);
         score2 = 
            {
               Score: matchDetails.Scores,
               Text: matchDetails.Text
            }
       }
       _.set(entry, engineAbbreviation, score2);
     });

     standings = _.union(standings, [entry]);
   });

   if (!standTableInitialized) {
      columns = [
     {
       field: 'rank',
       title: 'Rank'
      ,sortable: true
      ,width: '4%'
     },
     {
       field: 'name',
       title: 'Engine'
      ,sortable: true
      ,width: '18%'
     },
     {
       field: 'points',
       title: 'Points'
      ,sortable: true
      ,width: '7%'
     }
   ];
   _.each(standtableData.Order, function(engine, key) {
     engineDetails = _.get(standtableData.Table, engine);
     columns = _.union(columns, [{field: engineDetails.Abbreviation, title: engineDetails.Abbreviation, 
                                  formatter: formatter, cellStyle: cellformatter}]);
   });

   $('#standtable').bootstrapTable({
     columns: columns,
     classes: 'table table-striped table-no-bordered',
     sortName: 'rank'
   });
     
     standTableInitialized = true;
   }
   $('#standtable').bootstrapTable('load', standings);
}

function updateStandtable() 
{
   axios.get('crosstable.json')
   .then(function (response)
   {
      //updateStandtableData(response.data);
   })
   .catch(function (error) 
   {
      // handle error
      console.log(error);
   });
}

function setLastMoveTime(data)
{
   plog ("Setting last move time:" + data, 0);
}

function checkTwitch(checkbox)
{
   if (checkbox.checked)
   {
      $('iframe#twitchvid').hide();
      localStorage.setItem('tcec-twitch-video', 1);
   }
   else
   {
      $('iframe#twitchvid').attr('src', twitchSRCIframe);
      $('iframe#twitchvid').show();
      localStorage.setItem('tcec-twitch-video', 0);
   }
}

function setTwitch()
{
   var getVideoCheck = localStorage.getItem('tcec-twitch-video');        
   if (getVideoCheck == undefined || getVideoCheck == 0)
   {
      $('iframe#twitchvid').attr('src', twitchSRCIframe);
      $('iframe#twitchvid').show();
      $('#twitchcheck').prop('checked', false);
   }
   else
   {
      $('iframe#twitchvid').hide();
      $('#twitchcheck').prop('checked', true);
   }
}

function showEvalCont()
{
   var evalcont = '#evalcont';
   if (showLivEng1 || showLivEng2)
   {
      $(evalcont).show();
   }
   else
   {
      $(evalcont).hide();
   }

   if (showLivEng1)
   {
      $('#pills-eval-tab1').addClass('active');
      $('#pills-eval-tab2').removeClass('active');
      $('#pills-eval-tab1').addClass('show');
      $('#pills-eval1').addClass('active');
      $('#pills-eval2').removeClass('active');
      $('#pills-eval1').addClass('show');
   }
   else if (showLivEng2)
   {
      $('#pills-eval-tab2').addClass('active');
      $('#pills-eval-tab2').addClass('show');
      $('#pills-eval-tab1').removeClass('active');
      $('#pills-eval2').addClass('active');
      $('#pills-eval2').addClass('show');
      $('#pills-eval1').removeClass('active');
   }
}

function liveEngine(checkbox, checknum)
{
   var config = 'tcec-live-engine' + checknum;
   var evalcont = '#evalcont';

   if (checkbox.checked)
   {
      localStorage.setItem(config, 1);
      if (checknum == 1)
      {
         showLivEng1 = 1;
      }
      else
      {
         showLivEng2 = 1;
      }
   }
   else
   {
      localStorage.setItem(config, 0);
      if (checknum == 1)
      {
         showLivEng1 = 0;
      }
      else
      {
         showLivEng2 = 0;
      }
   }

   showEvalCont();
   updateLiveEval();
   updateChartData();
}

function setliveEngineInit(value)
{
   var config = 'tcec-live-engine' + value;
   var getlive = localStorage.getItem(config);
   var cont = '#liveenginecheck' + value;
   var checknum = value;
   var evalcont = '#evalcont';

   if (getlive == undefined || getlive == 1)
   {
      if (checknum == 1)
      {
         showLivEng1 = 1;
         $('#pills-tab a[href="#pills-eval' + 1 + '"]').tab('show');
      }
      else
      {
         showLivEng2 = 1;
         if (!showLivEng1)
         {
            $('#pills-tab a[href="#pills-eval' + 2 + '"]').tab('show');
         }
      }
      $(cont).prop('checked', true);
   }
   else
   {
      if (checknum == 1)
      {
         showLivEng1 = 0;
      }
      else
      {
         showLivEng2 = 0;
      }
      $(cont).prop('checked', false);
   }
}

function setliveEngine()
{
   setliveEngineInit(1);
   setliveEngineInit(2);
   showEvalCont();
}

function checkSort(checkbox)
{
   if (checkbox.checked)
   {
      localStorage.setItem('tcec-cross-crash', 1);
      crossCrash = 0;
   }
   else
   {
      localStorage.setItem('tcec-cross-crash', 0);
      crossCrash = 1;
   }
   updateTables();
}

function checkSound(checkbox)
{
   if (checkbox.checked)
   {
      localStorage.setItem('tcec-sound-video', 1);
      playSound = 0;
   }
   else
   {
      localStorage.setItem('tcec-sound-video', 0);
      playSound = 1;
   }
}

function setCrash()
{
   var getSound = localStorage.getItem('tcec-cross-crash');        
   var cont = '#crosscheck';
   if (getSound == undefined || getSound == 0)
   {
      crossCrash = 1;
      $(cont).prop('checked', false);
   }
   else
   {
      crossCrash = 0;
      $(cont).prop('checked', true);
   }
}

function setSound()
{
   var getSound = localStorage.getItem('tcec-sound-video');        
   var cont = '#soundcheck';
   if (getSound == undefined || getSound == 0)
   {
      playSound = 1;
      $(cont).prop('checked', false);
   }
   else
   {
      playSound = 0;
      $(cont).prop('checked', true);
   }
}

function setNotationPvDefault()
{
   var getHighL = localStorage.getItem('tcec-notation-pvx');        
   var cont = '#nottcheckpv';

   if (getHighL == undefined || getHighL == 0)
   {
      boardNotationPv = false;
      $(cont).prop('checked', true);
    }
   else
   {
      boardNotationPv = true;
      $(cont).prop('checked', false);
   }
}

function setNotationDefault()
{
   var getHighL = localStorage.getItem('tcec-notation');        
   var cont = '#nottcheck';

   if (getHighL == undefined || getHighL == 0)
   {
      boardNotation = true;
      $(cont).prop('checked', false);
   }
   else
   {
      boardNotation = false;
      $(cont).prop('checked', true);
   }
}

function setNotationPv(checkbox)
{
   if (!checkbox.checked)
   {
      localStorage.setItem('tcec-notation-pvx', 1);
      boardNotationPv = true;
   }
   else
   {
      localStorage.setItem('tcec-notation-pvx', 0);
      boardNotationPv = false;
   }
   setBoard();
}

function setNotation(checkbox)
{
   if (checkbox.checked)
   {
      localStorage.setItem('tcec-notation', 1);
      boardNotation = false;
   }
   else
   {
      localStorage.setItem('tcec-notation', 0);
      boardNotation = true;
   }
   setBoard();
}

function setHighLightMainPv(getHighL)
{
   if (getHighL == 0)
   {
      highlightClassPv = 'highlight-white highlight-none';
   }
   else
   {
      highlightClassPv = 'highlight-white highlight-' + getHighL;
   }
}

function setHighlightDefaultPv()
{
   var getHighL = localStorage.getItem('tcec-highlight-pv');        

   if (getHighL == undefined)
   {
      getHighL = 2;
   }

   setHighLightMainPv(getHighL);

   $('input[value=highlightPvRadio'+getHighL+']').prop('checked', true);
}

function setHighlightPv(value)
{
   localStorage.setItem('tcec-highlight-pv', value);
   setHighLightMainPv(value);
   setBoard();
}

function setHighLightMain(getHighL)
{
   if (getHighL == 0)
   {
      highlightClass = 'highlight-white highlight-none';
   }
   else
   {
      highlightClass = 'highlight-white highlight-' + getHighL;
   }
}

function setHighlightDefault()
{
   var getHighL = localStorage.getItem('tcec-highlight');        

   if (getHighL == undefined)
   {
      getHighL = 2;
   }

   setHighLightMain(getHighL);

   $('input[value=highlightRadio'+getHighL+']').prop('checked', true);
}

function setHighlight(value)
{
   localStorage.setItem('tcec-highlight', value);
   setHighLightMain(value);
   setBoard();
}

function setMoveArrowsDefault()
{
   var getHighL = localStorage.getItem('tcec-move-arrows');     
   var cont = '#notacheck';

   if (getHighL == undefined || getHighL == 1)
   {
      boardArrows = true;
      $(cont).prop('checked', false);
   }
   else
   {
      boardArrows = false;
      $(cont).prop('checked', true);
   }
}

function setMoveArrows(checkbox)
{
   if (checkbox.checked)
   {
      localStorage.setItem('tcec-move-arrows', 0);
      boardArrows = false;
   }
   else
   {
      localStorage.setItem('tcec-move-arrows', 1);
      boardArrows = true;
   } 
   setBoard();
}

function goMoveFromChart(chartx, evt)
{
   var activePoints = chartx.getElementAtEvent(evt);
   var firstPoint = activePoints[0];
   var plyNum = chartx.data.datasets[firstPoint._datasetIndex].data[firstPoint._index].ply;
   if (plyNum != undefined)
   {
      $('a[ply=' + plyNum + ']').click();
   }
}

document.getElementById("eval-graph").onclick = function(evt)
{
   goMoveFromChart(evalChart, evt);
};

document.getElementById("time-graph").onclick = function(evt)
{
   goMoveFromChart(timeChart, evt);
};

document.getElementById("speed-graph").onclick = function(evt)
{
   goMoveFromChart(speedChart, evt);
};

document.getElementById("tbhits-graph").onclick = function(evt)
{
   goMoveFromChart(tbHitsChart, evt);
};

document.getElementById("depth-graph").onclick = function(evt)
{
   goMoveFromChart(depthChart, evt);
};

function addToolTip(divx, divimg)
{
   var htmlx = '<table class="table table-dark table-striped table-dark">' + $(divx).html() + '</table>';
   $(divimg).tooltipster('content', htmlx);
}

var columnsEng = [
{
   field: 'Name'
},
{
   field: 'Value'
}
];

function updateEngineInfo(divx, divimg, data) 
{
   $(divx).bootstrapTable('load', data);
   addToolTip(divx, divimg);
}

function addToolTipInit(divx, divimg, direction)
{
   $(divimg).tooltipster({
      contentAsHTML: true,
      interactive: true,
      side: [direction],
      theme: 'tooltipster-shadow',
      trigger: 'hover',
      delay: [500, 200],
      contentCloning: true,
      delayTouch: [10, 2000],
      trigger: 'custom',
         triggerOpen: {
            mouseenter: true,
            click: true,
            touchstart: true,
            tap: true
         },
         triggerClose: {
            mouseleave: true,
            click: true,
            touchleave: true,
            tap: true,
            originClick: true
         }
   });
}

function initToolTip()
{
   $('#whiteenginetable').bootstrapTable({
      columns: columnsEng,
      showHeader: false
   });
   $('#blackenginetable').bootstrapTable({
      columns: columnsEng,
      showHeader: false
   });
   addToolTipInit('#whiteenginetable', '#white-engine-info', 'right');
   addToolTipInit('#blackenginetable', '#black-engine-info', 'left');
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

function firstButtonMain()
{
  activePly = 1;
  handlePlyChange();
};

function firstButton()
{
   if (selectedId == 0)
   {
      firstButtonMain();
   }
   else
   {
      if (selectedId == 'white-engine-pv')
      {
         $('.pv-board-to-first1').click();
      }
      else if (selectedId == 'black-engine-pv')
      {
         $('.pv-board-to-first2').click();
      }
   }
};

function backButtonMain()
{
  if (activePly > 1) {
    activePly--;
  }
  handlePlyChange();

  return false;
};

function backButton()
{
   if (selectedId == 0)
   {
      backButtonMain();
   }
   else
   {
      if (selectedId == 'white-engine-pv')
      {
         $('.pv-board-previous1').click();
      }
      else if (selectedId == 'black-engine-pv')
      {
         $('.pv-board-previous2').click();
      }
   }
}

function forwardButtonMain()
{
  if (activePly < loadedPlies) {
    activePly++;
  } else {
    viewingActiveMove = true;
  }
  handlePlyChange();

  return false;
}

function forwardButton()
{
   if (selectedId == 0)
   {
      forwardButtonMain();
   }
   else
   {
      if (selectedId == 'white-engine-pv')
      {
         $('.pv-board-next1').click();
      }
      else if (selectedId == 'black-engine-pv')
      {
         $('.pv-board-next2').click();
      }
   }
}

function endButtonMain()
{
  onLastMove();
}

function endButton()
{
   if (selectedId == 0)
   {
      endButtonMain();
   }
   else
   {
      if (selectedId == 'white-engine-pv')
      {
         $('.pv-board-to-last1').click();
      }
      else if (selectedId == 'black-engine-pv')
      {
         $('.pv-board-to-last2').click();
      }
   }
};

function tcecHandleKey(e) 
{
    var keycode, oldPly, oldVar, colRow, colRowList;
    if (!e) 
    {
        e = window.event
    }
    keycode = e.keyCode;
    if (e.altKey || e.ctrlKey || e.metaKey) {
        return !0
    }

    switch (keycode)
    {  
        case 37:
            backButton();
            break;
        case 38:
            firstButton();
            break;
        case 39:
            forwardButton();
            break;
        case 40:
            endButton();
            break;
        default:
            return !0
    }
    return stopEvProp(e)
}

function simpleAddEvent(obj, evt, cbk) 
{
   if (obj.addEventListener) 
   {
      obj.addEventListener(evt, cbk, !1)
   } 
   else if (obj.attachEvent) 
   {
      obj.attachEvent("on" + evt, cbk)
   }
}
simpleAddEvent(document, "keydown", tcecHandleKey);

function schedSorted(a,b)
{
   if (a < b) return -1;
   if (a > b) return 1;
   return 0;
}

function crossSorted(a,b)
{
   if (a < b) return -1;
   if (a > b) return 1;
   return 0;
}

function initTables()
{
   $('#event-overview').bootstrapTable({
     classes: 'table table-striped table-no-bordered',
     columns: [
       {
           field: 'TimeControl',
           title: 'TC'
       },
       {
           field: 'Termination',
           title: 'Adj Rule'
       },
       {
           field: 'movesTo50R',
           title: '50'
       },
       {
           field: 'movesToDraw',
           title: 'Draw'
       },
       {
           field: 'movesToResignOrWin',
           title: 'Win'
       },
       {
           field: 'piecesleft',
           title: 'TB'
       },
       {
           field: 'Result',
           title: 'Result'
       },
       {
           field: 'Round',
           title: 'Round'
       },
       {
           field: 'Opening',
           title: 'Opening'
       },
       {
           field: 'ECO',
           title: 'ECO'
       },
       {
           field: 'Event',
           title: 'Event'
       },
       {
           field: 'Viewers',
           title: 'Viewers'
       }
     ]
   });

   $('#h2h').bootstrapTable({
       classes: 'table table-striped table-no-bordered',
       pagination: true,
       paginationLoop: true,
       striped: true,
       smartDisplay: true,
       sortable: true,
       pageList: [10,20,50,100],
       pageSize:10,
       rememberOrder: true,
       columns: [
       {
           field: 'Gamesort',
           title: 'sortnumber',
           visible: false 
       },
       {
           field: 'h2hrank',
           title: 'Game#'
           ,sortable: true
           ,sorter: schedSorted
           ,sortName: 'Gamesort'
           ,align: 'left'
       },
       {
           field: 'FixWhite',
           title: 'White'
           ,sortable: true
       }, 
       {
         field: 'WhiteEv',
         title: 'W.Ev'
           ,sortable: true
       },
       {
         field: 'BlackEv',
         title: 'B.Ev'
           ,sortable: true
       },
       {
           field: 'FixBlack',
           title: 'Black'
           ,sortable: true
       },
       {
         field: 'Result',
         title: 'Result'
           ,sortable: true
       },
       {
         field: 'Moves',
         title: 'Moves'
           ,sortable: true
       },
       {
         field: 'Duration',
         title: 'Duration'
           ,sortable: true
       },
       {
         field: 'Opening',
         title: 'Opening',
         sortable: true,
         align: 'left'
       },
       {
         field: 'Termination',
         title: 'Termination'
           ,sortable: true
       },
       {
         field: 'ECO',
         title: 'ECO'
           ,sortable: true
       },
       {
         field: 'FinalFen',
         title: 'Final Fen',
         align: 'left'
       },
       {
         field: 'Start',
         title: 'Start'
       }
     ]
   });

   $('#schedule').bootstrapTable({
       classes: 'table table-striped table-no-bordered',
       pagination: true,
       paginationLoop: true,
       striped: true,
       smartDisplay: true,
       sortable: true,
       pageList: [10,20,50,100],
       pageSize:10,
       rememberOrder: true,
       search: true,   
       columns: [
       {
           field: 'Gamesort',
           title: 'sortnumber',
           visible: false 
       },
       {
           field: 'Game',
           title: 'Game#'
           ,sortable: true
           ,sorter: schedSorted
           ,sortName: 'Gamesort'
       },
       {
           field: 'FixWhite',
           title: 'White'
           ,sortable: true
       }, 
       {
         field: 'WhiteEv',
         title: 'Ev'
           ,sortable: true
       },
       {
           field: 'FixBlack',
           title: 'Black'
           ,sortable: true
       },
       {
         field: 'BlackEv',
         title: 'Ev'
           ,sortable: true
       },
       {
         field: 'Result',
         title: 'Result'
           ,sortable: true
       },
       {
         field: 'Moves',
         title: 'Moves'
           ,sortable: true
       },
       {
         field: 'Duration',
         title: 'Duration'
           ,sortable: true
       },
       {
         field: 'Opening',
         title: 'Opening',
         sortable: true,
         align: 'left'
       },
       {
         field: 'Termination',
         title: 'Termination'
           ,sortable: true
       },
       {
         field: 'ECO',
         title: 'ECO'
           ,sortable: true
       },
       {
         field: 'FinalFen',
         title: 'Final Fen',
         align: 'left'
       },
       {
         field: 'Start',
         title: 'Start'
       }
     ]
   });

   $('#winner').bootstrapTable({
       classes: 'table table-striped table-no-bordered',
       pagination: true,
       paginationLoop: true,
       striped: true,
       smartDisplay: true,
       sortable: true,
       pageList: [10,20,50,100],
       pageSize:10,
       rememberOrder: true,
       search: true,   
       columns: [
       {
           field: 'name',
           title: 'S#',
           visible: true
       },
       {
           field: 'winner',
           title: 'Champion',
           sortable: true
       },
       {
           field: 'runner',
           title: 'Runner-up',
           sortable: true
       }, 
       {
           field: 'score',
           title: 'Score',
           sortable: true
       }, 
       {
         field: 'date',
         title: 'Date',
         sortable: false
       }
     ]
   });
}

function removeClassEngineInfo(cont)
{
   $(cont).removeClass('d-sm-none d-md-none d-lg-none d-xl-none');
}

function addClassEngineInfo(cont)
{
   $(cont).addClass('d-sm-none d-md-none d-lg-none d-xl-none');
}

function showEngInfo()
{
   hideDownPv = 1;
   for (var i = 1 ; i < 5 ; i++)
   {
      removeClassEngineInfo('#boardinfod2' + i);
      removeClassEngineInfo('#boardinfod1' + i);
   }
   localStorage.setItem('tcec-top-tab', 2);
}

function hideEngInfo()
{
   hideDownPv = 0;
   for (var i = 1 ; i < 5 ; i++)
   {
      addClassEngineInfo('#boardinfod2' + i);
      addClassEngineInfo('#boardinfod1' + i);
   }
   localStorage.setItem('tcec-top-tab', 1);
}

function showTabDefault()
{
   var topTab = localStorage.getItem('tcec-top-tab');
   if (topTab == undefined || topTab == 1)
   {
      $('#v-pills-gameinfo-tab').click();
   }
   else
   {
      $('#v-pills-pv-top-tab').click();
   }
}

function toggleTheme()
{
   var darkMode = localStorage.getItem('tcec-dark-mode');
   if (darkMode == 20) {
     localStorage.setItem('tcec-dark-mode', 10);
   } else {
     localStorage.setItem('tcec-dark-mode', 20);
   }
   setDefaultThemes();
   updateTables();
   $(".navbar-toggle").click();
}

function hideBanner(timeDispl)
{
   if (timeDispl == undefined)
   {
      timeDispl = 30000;
   }

   setTimeout(function() 
   { 
      close = document.getElementById("close");
      note = document.getElementById("note");
      note.style.display = 'none';
   }, timeDispl);
}

function showBanner(data)
{
   close = document.getElementById("close");
   note = document.getElementById("note");
   note.style.display = 'inline';
   document.getElementById("notetext").textContent = data.message;
   if (data.timeout == undefined)
   {
      data.timeout = 30000;
   }
   else
   {
      data.timeout = data.timeout * 1000;
   }
   hideBanner(data.timeout);
}

function setCheckBoardMiddle(value, id)
{
   if (value)
   {
      $('#middle-data-column').addClass('order-first');
      $(id).prop('checked', true);
      localStorage.setItem('tcec-board-middle', 1);
   }
   else
   {
      $('#middle-data-column').removeClass('order-first');
      $(id).prop('checked', false);
      localStorage.setItem('tcec-board-middle', 0);
   }
}

function checkBoardMiddle(checkbox)
{
   if (checkbox.checked)
   {
      setCheckBoardMiddle(1, '#middlecheck');
   }
   else
   {
      setCheckBoardMiddle(0, '#middlecheck');
   }
}

function loadBoardMiddle()
{
   var midd = localStorage.getItem('tcec-board-middle');

   if ((midd == undefined) || (midd == 0))
   {
      setCheckBoardMiddle(0, '#middlecheck');
   }
   else
   {
      setCheckBoardMiddle(1, '#middlecheck');
   }
}

function eventCrosstableWrap()
{
   if (0 && tourInfo)
   {
      if (tourInfo.cup != 1)
      {
         $('#eventdiv').hide();
         $('#bracketdiv').hide();
         $('.nav-pills a[href="#pills-stand"]').tab('show')
         return;
      }
   }

   axios.get('Eventcrosstable.json?no-cache' + (new Date()).getTime())
   .then(function (responsetemp)
   {
      console.log ("XXX: Came to bracketDataMain");
      bracketDataMain(responsetemp.data);
   })
   .catch(function (error) {
      // handle error
      bracketDataMain(null);
      plog(error);
   });
}

function bracketDataMain(data)
{
   if (data)
   {
      bigData.teams = data.teams;
      roundResults = data.matchresults;
      bigData.results = data.results;
   }
   for (var i = roundResults.length + 1; i <= 32; i++)
   {
      roundResults[i-1] = [{lead:-1, score: -1}, {lead:-1, score: -1}];
   }
   for (var i = bigData.teams.length + 1; i <= 16; i++)
   {
      bigData.teams[i-1] = [{name: getSeededName(teamsx[i-1][0][0]), flag: getShortEngineName(teamsx[i-1][0][0]),
                             score: -1, rank: '1', date: '', lead: 0},
                            {name: getSeededName(teamsx[i-1][1][0]), flag: getShortEngineName(teamsx[i-1][1][0]),
                             score: -1, rank: '2', date: '', lead: 0}];
   }

   drawBracket1();
   eventCrosstable(data.EventTable);
}

function drawBracket1()
{
   plog ("Came to drawBracket");
   var roundNox = 2;
   getDateRound();

   function onClick(data)
   {
      //alert(data);
   }
   /* Edit function is called when team label is clicked */
   function edit_fn1(container, data, doneCb) {
     var input = $('<input type="text">')
     input.val(data ? data.flag + ':' + data.name : '')
     container.html(input)
     input.focus()
     input.blur(function() {
       var inputValue = input.val()
       if (inputValue.length === 0) {
         doneCb(null); // Drop the team and replace with BYE
       } else {
         var flagAndName = inputValue.split(':') // Expects correct input
         doneCb({flag: flagAndName[0], name: flagAndName[1]})
       }
     })
   }
   function edit_fn(container, data, doneCb) {
      return;
   }

   function render_fn2(container, data, score, state) {
        var localRound = parseInt(roundNox/2) - 1;
        var isFirst = roundNox%2;
        var dataName = 0;

        //plog ("Came to round: " + roundNox + " data.name is: " + data.name, 1);
        roundNox ++;
        if (data && data.name)
        {
           data.origname = data.name;
           dataName = getSeededName(data.name);
        } 

        switch(state) {
          case "empty-bye":
            container.append("No team")
            return;
          case "empty-tbd":
            if (roundNox%2 == 1)
            {
               var befStr = '<div class="labelbracket"> <a class="roundleft"> #' + (localRound + 1) + '</a> ';
               befStr = befStr + '</div>';
               $(befStr).insertBefore(container);
            }
            container.append("TBD")
            return;

          case "entry-no-score":
          case "entry-default-win":
          case "entry-complete":
            if (roundResults[localRound][isFirst].name != undefined)
            {
               if (getShortEngineName(roundResults[localRound][isFirst].name) != getShortEngineName(data.origname))
               {
                  if (isFirst)
                  {
                     isFirst = 0;
                  }
                  else
                  {
                     isFirst = 1;
                  }
               }
            }
            var scoreL = roundResults[localRound][isFirst].score;

            if (scoreL >= 0)
            {
               var appendStr = '';
               var lead = roundResults[localRound][isFirst].lead;
               var manual = roundResults[localRound][isFirst].manual;
               if (manual == 1)
               {
                  appendStr = '<div class="bracket-name"> <a> ' + dataName + '</a> </div>' +
                              '<div class="bracket-score orange"> <a> (' + scoreL + ')</a> </div>'
                  $(container).parent().addClass('bracket-name-orange');
               }
               else if (lead == 0)
               {
                  appendStr = '<div class="bracket-name"> <a> ' + dataName + '</a> </div>' +
                              '<div class="bracket-score redb "> <a> (' + scoreL + ')</a> </div>'
                  $(container).parent().addClass('bracket-name-red');
               }
               else if (lead == 1)
               {
                  appendStr = '<div class="bracket-name"> <a> ' + dataName + '</a> </div>' +
                              '<div class="bracket-score green"> <a> (' + scoreL + ')</a> </div>'
                  $(container).parent().addClass('bracket-name-green');
               }
               else
               {
                  appendStr = '<div class="bracket-name"> <a> ' + dataName + '</a> </div>' +
                              '<div class="bracket-score"> <a> (' + scoreL + ')</a> </div>'
                  $(container).parent().addClass('bracket-name-current');
               }
               if (roundNox%2 == 1)
               {
                  var befStr = '<div class="labelbracket"> <a class="roundleft"> #' + (localRound + 1) + '</a> ';
                  if (roundDate[localRound] != undefined)
                  {
                     //befStr = befStr + '<a> ' + roundDate[localRound] + '</a> </div>';
                     befStr = befStr + '</div>';
                  }
                  else
                  {
                     befStr = befStr + '</div>';
                  }
                  $(befStr).insertBefore(container);
               }
               container.append('<img class="bracket-material" src="img/engines/'+ data.flag +'.jpg" />').append(appendStr);
            }
            else
            {
               if (roundNox%2 == 1)
               {
                  var befStr = '<div class="labelbracket"> <a class="roundleft"> #' + (localRound + 1) + '</a> ';
                  befStr = befStr + '</div>';
                  $(befStr).insertBefore(container);
               }
               container.append('<img class="bracket-material" src="img/engines/'+data.flag+'.jpg" />').append('<div class="bracket-name"> <a> ' + data.name + '</a> </div>')
            }

            if (roundNox > 64)
            {
               $(container).parent().append('<div class="bubblex third">3rd</div>');
            }
            return;
        }
   }

   var direction = 'lr';
   try {
      $(function () {
         $('#bracket').bracket({
            centerConnectors: true,
            dir: direction,
            teamWidth: 220,
            scoreWidth: 35,
            matchMargin: 45,
            roundMargin: 18,
            init: bigData,
            //skipConsolationRound: true,
            decorator: {edit: edit_fn,
                        render: render_fn2}
         });
      });
   }
   catch (err)
   {
      console.log ("error in bracket us :" + err);
   }
   console.log ("Drawn brackets");
}

function getSeededName(name)
{
   var engineName = 0;
   _.each(teamsx, function(engine, key) {
      if (getShortEngineName(engine[0][0]).toUpperCase() == getShortEngineName(name).toUpperCase())
      {
         //engineName = "S#" + engine[0][1] + " " + engine[0][0];
         engineName = engine[0][0];
         engineName = "#" + engine[0][1] + " " + engine[0][0];
         if (engineName.length > 24)
         {
            engineName = engineName.substring(0,22) + "..";
         }
         return false;
      }
      else if (getShortEngineName(engine[1][0]).toUpperCase() == getShortEngineName(name).toUpperCase())
      {
         //engineName = "S#" + engine[1][1] + " " + engine[1][0];
         engineName = engine[1][0];
         engineName = "#" + engine[1][1] + " " + engine[1][0];
         if (engineName.length > 24)
         {
            engineName = engineName.substring(0,22) + "..";
         }
         return false;
      }
   });
   if (engineName == 0)
   {
      engineName = name;
   }
   return engineName;
}

function getDateRound()
{
   roundDate = [];
   var diffData = 0;

   for (var x = 0 ; x <= totalEvents; x++)
   {
      if (roundDateMan[x])
      {
         roundDate[x] = getCurrDate(roundDateMan[x], 0);
      }
      else
      {
         var y = x + 1;
         if (diffData)
         {
            if (y%2 == 1)
            {
               roundDate[x] = getCurrDate(startDateR1, 1440 * (parseInt(y/2)));
            }
            else
            {
               roundDate[x] = getCurrDate(startDateR2, 1440 * (parseInt((y-1)/2)));
            }
         }
         else
         {
            var gameDiffL = gameDiff * 8 / (60 * 1000);
            //gameDiffL = gameDiffL/1.5;
            roundDate[x] = getCurrDate(startDateR1, gameDiffL * (x/2));
         }
      }
   }
}

function getCurrDate(currdate, mins)
{
   var timezoneDiff = moment().utcOffset() * 60 * 1000 + mins * 60 * 1000;
   momentDate = moment(currdate, 'HH:mm:ss on YYYY.MM.DD');
   momentDate.add(timezoneDiff);
   return momentDate.format('MMM DD YYYY, HH:mm');
}

async function eventCrosstable(data)
{
   var divname = '#crosstableevent';
   var startVar = 1;
   var standings = [];

   plog ("Camee tp eventCrosstable", 0);

   $(divname).bootstrapTable({
        classes: 'table table-striped table-no-bordered',
        columns: columnsEvent,
        sortName: 'rank',
        sortOrder: 'desc'
      });

   let round = 1;
   _.each(data, function(matchdum, key) {
      matchdum.match = round;
      matchdum.Winner = getImg(matchdum.Winner);
      matchdum.Runner = getImg(matchdum.Runner);
      standings.push(matchdum);
      if (eventCross[round - 1] != undefined)
      {
         eventCross[round] = eventCross[round - 1] + parseInt(matchdum.Games);
      }
      else
      {
         eventCross[round] = parseInt(matchdum.Games);
      }
      round ++;
   });

   plog ("drawing standings", 0);
   $(divname).bootstrapTable('load', standings);
}

function eventCrosstableMainCooked(data)
{
   var myLocalData = dummyCross;
   var myLocalDataStr = JSON.stringify(myLocalData);
   plog("JSON is " + myLocalDataStr, 1);
   myLocalData.skipDecide = 1;
   updateCrosstableDataNew(data.match, myLocalData);
   tablesLoaded[data.match] = 1;
}

function eventCrosstableMain(ii, filename)
{
   //filename = filename + '?no-cache' + (new Date()).getTime();
   plog ("trying to read file " + filename);
   axios.get(filename)
   .then(function (r)
   {
      updateCrosstableDataNew(ii, r.data);
      tablesLoaded[ii] = 1;
      plog ("after trying to read file " + filename, 0);
   })
   .catch(function (error)
   {
      plog(error);
      plog ("failed trying to read file " + filename + ", error: " + error, 0);
      tablesLoaded[ii] = 0;
   });
}

function formatterEvent(value, row, index, field) {
   var retStr = '';
   var countGames = 0;
   var gameArray =  row.Gamesno.split(","); 

   _.each(value, function(engine, key)
   {
      var gameX = parseInt(countGames/2);
      var gameXColor = parseInt(gameX%3);

      if (engine == "=")
      {
         engine = '&frac12'
         gameXColor = 2;
      }
      else
      {
         gameXColor = parseInt(engine);
      }
      var gameNum = gameArray[key];
      if (retStr == '')
      {
         retStr = '<a title="' + gameNum + '" style="cursor:pointer; color: ' + gameArrayClass[gameXColor] + ';"onclick="openCross(' + index + ',' + gameNum + ')">' + engine + '</a>';
      }
      else
      {
         retStr += ' ' + '<a title="' + gameNum + '" style="cursor:pointer; color: ' + gameArrayClass[gameXColor] + ';"onclick="openCross(' +  index + ',' + gameNum + ')">' + engine + '</a>';
      }
      countGames = countGames + 1;
      if (countGames%8 == 0)
      {
         retStr += '<br />';
      }
   });
  return retStr;
}

