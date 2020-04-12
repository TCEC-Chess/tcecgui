/**************** Extra functions *****************/
function fixOrder()
{
   var crossData = crosstableData;
   var arr = [];
   var count = 0;
   var debug = 1;

   _.each(crosstableData.Table, function(engine, key) {
      arr [count] = engine.Score;
      count = count + 1;
      engine.Rank = 0;
   });

   var sorted = arr.slice().sort(function(a,b){return b-a})
   var ranks = arr.slice().map(function(v){ return sorted.indexOf(v)+1 });
   plog ("Ranks is :" + ranks, debug);
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

            plog ("iengine.Rank:" + iengine.Rank + ikey + ",engine.Rank:" + engine.Rank + key, debug);
            if (parseInt(iengine.Rank) && parseInt(engine.Rank) == parseInt(iengine.Rank))
            {
               if (engine.Strikes)
               {
                  tiePoints = tiePoints + -engine.Strikes;
               }
               else
               {
                  plog ("engine.Strikes: " + engine.Results[ikey].Text, debug);
                  if (sbCount > engine.Results[ikey].Text.length/2)
                  {
                     plog ("key won:" + key, debug);
                     tiePoints = tiePoints + 1/100;
                  }
                  else if (sbCount < engine.Results[ikey].Text.length/2)
                  {
                     plog ("key lost:" + key, debug);
                     tiePoints = tiePoints + 0/100;
                  }
                  else
                  {
                     plog ("key drew:" + key, debug);
                     tiePoints = tiePoints + 0.5/100;
                  }
               }
            }
         }
      });
      tiePoints = tiePoints + (engine.WinsAsBlack + engine.WinsAsWhite)/(100 * 100);
      plog ("tiePoints is :" + tiePoints + ", count is :" + arr[count] + " , name is :" + key + ", score:" + engine.Score, debug);
      //tiePoints = tiePoints + engine.WinAsBlack/(100 * 100 * 100);
      tiePoints = tiePoints + engine.Neustadtl/(100 * 100 * 1000);
      tiePoints = tiePoints + engine.Rating/(100 * 100 * 1000 * 1000);
      tiePoints = tiePoints + count/(100 * 100 * 1000 * 1000 * 1000);
      arr[count] = parseFloat(parseFloat(engine.Score) + parseFloat(tiePoints/10));
      count = count + 1;
   });

   var sorted = arr.slice().sort(function(b,a){return a-b})
   var ranks = arr.slice().map(function(v){ return sorted.indexOf(v)+1 });
   count = 0;
   plog ("rank kenght us :" + ranks.length, debug);
   plog ("Ranks is :" + ranks, debug);
   //crosstableData.Order = ranks;

   _.each(crosstableData.Table, function(engine, key) {
      engine.Rank = ranks[count];
      plog ("engine.Rank-1 is :" + ranks[count] + " ,count:" + count, 1);
      count = count + 1;
      crosstableData.Order[engine.Rank-1] = key;
   });
}

function updateLiveEvalDataOld(datum, update, fen, contno, initial)
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

   plog ("Annotation did not get cleared" + clearedAnnotation + ",contno:" + contno, 0);
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
}

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

function findEloDiffOld (whiteEngine, blackEngine, whiteEngName, blackEngName, score)
{
   var k = 10;
   var b_rating = blackEngine.Rating;
   var w_rating = whiteEngine.Rating;
   var expected_score = 1 / (1 + Math.pow(10, (b_rating - w_rating) / 400 ));
   var rating_diff = k * (score - expected_score);
   return rating_diff;
}

function getRating(engine, engName)
{
   if (engineRatingGlobalData)
   {
      return engineRatingGlobalData[engName].elo;
   }

   return engine.elo;
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

   for (let i = 0 ; i < crosstableData.Order.length ; i ++) {
      let engName = crosstableData.Order[i];
      let engDetails = crosstableData.Table[engName];
      //crosstableData.Table[engName].Rating = getRating(engDetails, engName);
   }

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
      engine.elo = eloDiff;
      plog ("Final eloDiff: " + eloDiff + " ,fscore: " + parseInt(engine.Rating + eloDiff), 1);
   });
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

function updateResData(engineName)
{
   _.each(crosstableData.Table, function (value, key)
   {
      if (value.OrigStrikes == undefined || value.OrigStrikes == 'undefined')
      {
         value.OrigStrikes = value.Strikes;
      }
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

function newUpdateStandNoData()
{
   newUpdateStandData(crosstableData);
}

function newUpdateStandDataTimeout(data)
{
   crosstableData = data;
   crossTimeout = setTimeout(function(){ newUpdateStandData(data); }, 7000);
}
/********************************* End Extra functions *****************************/
