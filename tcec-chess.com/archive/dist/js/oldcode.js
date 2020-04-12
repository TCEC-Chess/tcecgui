async function updateCrosstableDataOld(data)
{
   crosstableData = data;
   if (globalCup)
   {
      return;
   }
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
   noEngines = crosstableData.Order.length;

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
      //engineDetails.Strikes = getEngRes.LossAsStrike;
      engineDetails.Wins = wins;
      engineDetails.WinAsBlack = getEngRes.WinAsBlack;
      });

   fixOrder();

   _.each(crosstableData.Order, function(engine, key) {
      plog ("ADding entry:" + engine, 1);
