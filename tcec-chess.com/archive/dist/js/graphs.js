var evalChart;
var timeChart;
var speedChart;
var nodesChart = null;
var depthChart;
var tbHitsChart;
var engine2colorno = 0;
var engine2color = '#FF0000';
engine2color = '#66CC00';
engine2color = '#A44BC0';
var evalChartData = {};
var engineColorArray = ['darkred', 'red', 'green', 'darkgreen', 'yellow', 'purple', 'orange'];
var evalconstant = 10.0;
var eng1L = 'Blueleela';
var eng2L = '7Fish';

function setevalChartData()
{
   engine2color = engineColorArray[engine2colorno];
   evalChartData = {
     labels: [],
     datasets: [{
       label: 'White',
       lineTension: 0,
       borderColor: '#EFEFEF',
       backgroundColor: '#EFEFEF',
       fill: false,
       data: [
       ]
     }, {
       label: 'Black',
       lineTension: 0,
       borderColor: '#000000',
       backgroundColor: '#000000',
       fill: false,
       data: [
       ]
     }, {
       label: eng1L,
       lineTension: 0,
       borderColor: '#007bff',
       backgroundColor: '#007bff',
       fill: false,
       data: [
       ]
     }, {
       label: eng2L,
       lineTension: 0,
       borderColor: engine2color,
       backgroundColor: engine2color,
       fill: false,
       data: [
       ]
     }
     ]
   };
}
setevalChartData();

var timeChartData = {
  labels: [],
  datasets: [{
    label: 'White Engine Time',
    lineTension: 0,
    borderColor: '#EFEFEF',
    backgroundColor: '#EFEFEF',
    fill: false,
    data: [
    ]
  }, {
    label: 'Black Engine Time',
    lineTension: 0,
    borderColor: '#000000',
    backgroundColor: '#000000',
    fill: false,
    data: [
    ]
  }]
};

var speedChartData = {
  labels: [],
  datasets: [{
    label: 'White Engine Speeds',
    lineTension: 0,
    borderColor: '#EFEFEF',
    backgroundColor: '#EFEFEF',
    fill: false,
    data: [
    ],
    yAxisID: 'y-axis-1',
  }, {
    label: 'Black Engine Speed',
    lineTension: 0,
    borderColor: '#000000',
    backgroundColor: '#000000',
    fill: false,
    data: [
    ],
    yAxisID: 'y-axis-2'
  }]
};

var depthChartData = {
  labels: [],
  datasets: [{
    label: 'White Depth',
    lineTension: 0,
    borderColor: '#EFEFEF',
    backgroundColor: '#EFEFEF',
    fill: false,
    data: [
    ]
  }, {
    label: 'Black Depth',
    lineTension: 0,
    borderColor: '#1a1a1a',
    backgroundColor: '#1a1a1a',
    borderDash: [10,5],
    fill: false,
    data: [
    ]
  }, {
    label: 'W. Sel Depth',
    lineTension: 0,
    borderColor: '#b1b1b1',
    backgroundColor: '#b1b1b1',
    fill: false,
    data: [
    ]
  }, {
    label: 'B. Sel Depth',
    lineTension: 0,
    borderColor: '#7e7e7e',
    backgroundColor: '#7e7e7e',
    borderDash: [10,5],
    fill: false,
    data: [
    ]
  }]
};

var tbHitsChartData = {
  labels: [],
  datasets: [{
    label: 'White Engine TB Hits',
    lineTension: 0,
    borderColor: '#EFEFEF',
    backgroundColor: '#EFEFEF',
    fill: false,
    yAxisID: 'tb-y-axis-1',
    data: [
    ]
  }, {
    label: 'Black Engine TB Hits',
    lineTension: 0,
    borderColor: '#000000',
    backgroundColor: '#000000',
    fill: false,
    yAxisID: 'tb-y-axis-2',
    data: [
    ]
  }]
};

var nodesChartData = {
  labels: [],
  datasets: [{
    label: 'White Engine Speeds',
    lineTension: 0,
    borderColor: '#EFEFEF',
    backgroundColor: '#EFEFEF',
    fill: false,
    data: [
    ],
    yAxisID: 'y-axis-1',
  }, {
    label: 'Black Engine Speed',
    lineTension: 0,
    borderColor: '#000000',
    backgroundColor: '#000000',
    fill: false,
    data: [
    ],
    yAxisID: 'y-axis-2'
  }]
};

function drawEval()
{
   setevalChartData();
	evalChart = Chart.Line($('#eval-graph'), {
	  data: evalChartData,
	  options: {
        animation: {
           duration: 0, // general animation time
           },
        hover: {
           animationDuration: 0, // duration of animations when hovering an item
           },
       responsiveAnimationDuration: 0, // animation duration after a resize
	    responsive: true,
	    bezierCurve: false,
	    hoverMode: 'index',
	    stacked: false,
	    legend: {
	      display: true,
         position: 'bottom',     
         fontSize: 5,
         labels: {
            boxWidth: 1
         },
	    },
	    title: {
	      display: false
	    },
        tooltips: {
	      callbacks: {
	            label: function(tooltipItem, data) {
	            	evalL = [];
	            	if (typeof data.datasets[0].data[tooltipItem.index] != 'undefined') {
	            		evalL = _.union(evalL, ['White Eval: ' + data.datasets[0].data[tooltipItem.index].evalL]);
	            	}
	            	if (typeof data.datasets[1].data[tooltipItem.index] != 'undefined') {
	            		evalL = _.union(evalL, ['Black Eval: ' + data.datasets[1].data[tooltipItem.index].evalL]);
	            	}
	            	if (typeof data.datasets[2].data[tooltipItem.index] != 'undefined') {
	            		evalL = _.union(evalL, ['Live Eval: ' + data.datasets[2].data[tooltipItem.index].evalL]);
	            	}
	               return evalL;
	            }
	      } // end callbacks:
	    },
	    scales: {
	      yAxes: [{
	        type: 'linear', // only linear but allow scale type registration. This allows extensions to exist solely for log scale for instance
	        display: true,
	        position: 'left',
	        id: 'e-y-axis-1',
	      }],
	      xAxes: [{
	      	ticks: {
		        autoSkip: true,
		        maxTicksLimit: 25
		    }
	      }]
	    }
	  }
	});
}

$(function() {
   drawEval();
   initializeCharts();
});

function initializeCharts()
{
	timeChart = Chart.Line($('#time-graph'), {
	  data: timeChartData,
	  options: {
	    responsive: true,
	    hoverMode: 'index',
	    stacked: false,
	    legend: {
	      display: false
	    },
	    title: {
	      display: false
	    },
	    scales: {
	      yAxes: [{
	        type: 'linear', // only linear but allow scale type registration. This allows extensions to exist solely for log scale for instance
	        display: true,
	        position: 'left',
	        id: 't-y-axis-1',
	      }],
	      xAxes: [{
	      	ticks: {
		        autoSkip: true,
		        maxTicksLimit: 25
		    }
	      }]
	    }
	  }
	});

   var nodeChartIs = document.getElementById("nodes-graph");
   if (nodeChartIs)
   {
	   nodesChart = Chart.Line($('#nodes-graph'), {
	     data: nodesChartData,
	     options: {
	       responsive: true,
	       hoverMode: 'index',
	       stacked: false,
	       legend: {
	         display: false
	       },
	       title: {
	         display: false
	       },
           tooltips: {
	         callbacks: {
	               label: function(tooltipItem, data) {
	   			  	var nodes = parseInt(data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index].nodes);
	                   if (nodes >= 1000000000) {
	   		  			nodes = Math.round (nodes / 100000000) / 10;
	   			  		nodes += 'B'
	   			  	} else {
	   			  		nodes = Math.round (nodes / 100000) / 10;
	   			  		nodes += 'M'
	   			  	}
	   			    return ' (' + nodes + ' nodes)';
	               }
	         } // end callbacks:
	       },
	       scales: {
	         yAxes: [{
	           type: 'linear', // only linear but allow scale type registration. This allows extensions to exist solely for log scale for instance
	           display: true,
	           position: 'left',
	           id: 'y-axis-1',
	           ticks: {
	   		  callback: function(value, index, values) {
	   		  	if (value >= (1000000*1000)) {
	   		  		value = Math.round (value / (100000 * 1000)) / 10;
	   		  		value += 'B';
	   		  	} else if ((value >= (1000000*1))) {
	   		  		value = Math.round (value / 100000) / 10;
	   		  		value += 'M'
	   		  	} else {
	   		  		value = Math.round (value / 100) / 10;
	   		  		value += 'K'
	   		  	}
	   		    return value;
	   		  }
	   		}
	         }, {
	           type: 'linear', // only linear but allow scale type registration. This allows extensions to exist solely for log scale for instance
	           display: true,
	           position: 'right',
	           id: 'y-axis-2',

	           // grid line settings
	           gridLines: {
	             drawOnChartArea: false, // only want the grid lines for one axis to show up
	           },
	           ticks: {
	   		  callback: function(value, index, values) {
	   		  	if (value >= 1000000*1000) {
	   		  		value = Math.round (value / (100000 * 1000)) / 10;
	   		  		value += 'B'
	   		  	} else if ((value >= (1000000*1))) {
	   		  		value = Math.round (value / 100000) / 10;
	   		  		value += 'M'
	   		  	} else {
	   		  		value = Math.round (value / 100) / 10;
	   		  		value += 'K'
	   		  	}
	   		    return value;
	   		  }
	   		}
	         }],
	         xAxes: [{
	         	ticks: {
	   	        autoSkip: true,
	   	        maxTicksLimit: 25
	   	    }
	         }]
	       }
	     }
	   });
   }

	speedChart = Chart.Line($('#speed-graph'), {
	  data: speedChartData,
	  options: {
	    responsive: true,
	    hoverMode: 'index',
	    stacked: false,
	    legend: {
	      display: false
	    },
	    title: {
	      display: false
	    },
        tooltips: {
	      callbacks: {
	            label: function(tooltipItem, data) {
	                var value = parseInt(data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index].y);
	                if (value >= 1000000) {
			  			value = Math.round (value / 10000) / 100;
				  		value += 'Mnps'
				  	} else {
				  		value = Math.round (value / 10) / 100;
				  		value += 'Knps'
				  	}

				  	var nodes = parseInt(data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index].nodes);
	                if (nodes >= 1000000000) {
			  			nodes = Math.round (nodes / 100000000) / 10;
				  		nodes += 'B'
				  	} else {
				  		nodes = Math.round (nodes / 100000) / 10;
				  		nodes += 'M'
				  	}
				    return value + ' (' + nodes + ' nodes)';
	            }
	      } // end callbacks:
	    },
	    scales: {
	      yAxes: [{
	        type: 'linear', // only linear but allow scale type registration. This allows extensions to exist solely for log scale for instance
	        display: true,
	        position: 'left',
	        id: 'y-axis-1',
	        ticks: {
			  callback: function(value, index, values) {
			  	if (value >= 1000000) {
			  		value = Math.round (value / 100000) / 10;
			  		value += 'M'
			  	} else {
			  		value = Math.round (value / 100) / 10;
			  		value += 'K'
			  	}
			    return value;
			  }
			}
	      }, {
	        type: 'linear', // only linear but allow scale type registration. This allows extensions to exist solely for log scale for instance
	        display: true,
	        position: 'right',
	        id: 'y-axis-2',

	        // grid line settings
	        gridLines: {
	          drawOnChartArea: false, // only want the grid lines for one axis to show up
	        },
	        ticks: {
			  callback: function(value, index, values) {
			  	if (value >= 1000000) {
			  		value = Math.round (value / 100000) / 10;
			  		value += 'M'
			  	} else {
			  		value = Math.round (value / 100) / 10;
			  		value += 'K'
			  	}
			    return value;
			  }
			}
	      }],
	      xAxes: [{
	      	ticks: {
		        autoSkip: true,
		        maxTicksLimit: 25
		    }
	      }]
	    }
	  }
	});

	depthChart = Chart.Line($('#depth-graph'), {
	  data: depthChartData,
	  options: {
	    responsive: true,
	    hoverMode: 'index',
	    stacked: false,
	    legend: {
	      display: true,
         position: 'bottom',     
         fontSize: 5,
         labels: {
            boxWidth: 1
         },
	    },
	    title: {
	      display: false
	    },
	    scales: {
	      yAxes: [{
	        type: 'linear', // only linear but allow scale type registration. This allows extensions to exist solely for log scale for instance
	        display: true,
	        position: 'left',
	        id: 'd-y-axis-1',
	      }],
	      xAxes: [{
	      	ticks: {
		        autoSkip: true,
		        maxTicksLimit: 25
		    }
	      }]
	    }
	  }
	});

	tbHitsChart = Chart.Line($('#tbhits-graph'), {
	  data: tbHitsChartData,
	  options: {
	    responsive: true,
	    hoverMode: 'index',
	    stacked: false,
	    legend: {
	      display: false
	    },
	    title: {
	      display: false
	    },
	    scales: {
	      yAxes: [{
	        type: 'linear', // only linear but allow scale type registration. This allows extensions to exist solely for log scale for instance
	        display: true,
	        position: 'left',
	        id: 'tb-y-axis-1',
	        ticks: {
			  callback: function(value, index, values) {
			  	if (value >= 1000000) {
			  		value = Math.round (value / 100000) / 10;
			  		value += 'M'
			  	} else {
			  		value = Math.round (value / 100) / 10;
			  		value += 'K'
			  	}
			    return value;
			  }
			}
	      }, {
	        type: 'linear', // only linear but allow scale type registration. This allows extensions to exist solely for log scale for instance
	        display: true,
	        position: 'right',
	        id: 'tb-y-axis-2',
	        // grid line settings
	        gridLines: {
	          drawOnChartArea: false, // only want the grid lines for one axis to show up
	        },
	        ticks: {
			  callback: function(value, index, values) {
			  	if (value >= 1000000) {
			  		value = Math.round (value / 100000) / 10;
			  		value += 'M'
			  	} else {
			  		value = Math.round (value / 100) / 10;
			  		value += 'K'
			  	}
			    return value;
			  }
			}
	      }],
	      xAxes: [{
	      	ticks: {
		        autoSkip: true,
		        maxTicksLimit: 25
		    }
	      }]
	    }
	  }
	});
}

function updateChartData()
{
   setevalChartData();
	evalChart.data.labels = [];
	evalChart.data.datasets[0].data = [];
	evalChart.data.datasets[1].data = [];

	timeChart.data.labels = [];
	timeChart.data.datasets[0].data = [];
	timeChart.data.datasets[1].data = [];

	speedChart.data.labels = [];
	speedChart.data.datasets[0].data = [];
	speedChart.data.datasets[1].data = [];

   if (nodesChart)
   {
	   nodesChart.data.labels = [];
   	nodesChart.data.datasets[0].data = [];
	   nodesChart.data.datasets[1].data = [];
   }

	depthChart.data.labels = [];
	depthChart.data.datasets[0].data = [];
	depthChart.data.datasets[1].data = [];
	depthChart.data.datasets[2].data = [];
	depthChart.data.datasets[3].data = [];

	tbHitsChart.data.labels = [];
	tbHitsChart.data.datasets[0].data = [];
	tbHitsChart.data.datasets[1].data = [];
	
	evalLabels = [];
	labels = [];

	whiteEval = [];
	blackEval = [];
	liveEval1 = [];
	liveEval2 = [];

	whiteTime = [];
	blackTime = [];

	whiteSpeed = [];
	blackSpeed = [];

	whiteNodes = [];
	blackNodes = [];

	whiteDepth = [];
	blackDepth = [];

	whiteSelDepth = [];
	blackSelDepth = [];

	whiteTBHits = [];
	blackTBHits = [];

   var plyNum = 0;

	_.each(loadedPgn.Moves, function(move, key) {
		if (!move.book &&
         (!(move.book == undefined || move.book == 'undefined'))) {
			moveNumber = Math.round(key / 2) + 1;

			if (key % 2 != 0) {
            plyNum = key + 1;
				moveNumber--;
			}
         else
         {
            plyNum = key + 1;
         }

			depth = move.d;
			if (move.sd > depth) {
            //arun
				//depth = move.sd;
			}

         //arun: cap moves at evalconstant
         if (move.wv == undefined && move.ev)
         {
            move.wv = move.ev;
         }
         move.cwv = move.wv;
         if (!isNaN(move.wv)) 
         {
            if (move.wv > evalconstant) 
            {
               move.cwv = evalconstant;
            } 
            else if (move.wv < -evalconstant) 
            {
               move.cwv = -evalconstant;
            }
         } 
         else 
         {
            if (move.wv && move.wv.substring(0,1) == '-') 
            {
               move.cwv = -evalconstant;
            } 
            else 
            {
               move.cwv = evalconstant;
            }
         }
         evalL = [
				{
					'x': moveNumber,
					'y': move.cwv,
					'ply': plyNum,
					'eval': move.wv
				}
			];

			time = [
				{
					'x': moveNumber,
					'y': Math.round(move.mt / 1000),
					'ply': plyNum
				}
			];

			speed = [
				{
					'x': moveNumber,
					'y': move.s,
					'nodes': move.n,
					'ply': plyNum
				}
			];

			depth = [
				{
					'x': moveNumber,
					'y': depth,
					'ply': plyNum
				}
			];

         seldepth = [
				{
					'x': moveNumber,
					'y': move.sd,
					'ply': plyNum
				}
			];

			tbHits = [
				{
					'x': moveNumber,
					'y': move.tb,
					'ply': plyNum
				}
			];

			nodes = [
				{
					'x': moveNumber,
					'y': move.n,
					'nodes': move.n,
					'ply': plyNum
				}
			];

			if (key % 2 == 0) {
				labels = _.union(labels, [moveNumber]);
				// evalLabels = _.union(evalLabels, [moveNumber]);

				whiteEval = _.union(whiteEval, evalL);
				// whiteEval = _.union(whiteEval, [{'x': moveNumber + 0.5, 'y': move.wv, 'eval': evaluation}]);
				whiteTime = _.union(whiteTime, time);
				whiteSpeed = _.union(whiteSpeed, speed);
				whiteNodes = _.union(whiteNodes, nodes);
				whiteDepth = _.union(whiteDepth, depth);
            whiteSelDepth = _.union(whiteSelDepth, seldepth);
				whiteTBHits = _.union(whiteTBHits, tbHits);

				evalObject = getLiveEval(key, moveNumber, false, 1);

				if (evalObject != -1) {
					liveEval1 = _.union(liveEval1, evalObject);
				}
            evalObject = -1;
				evalObject = getLiveEval(key, moveNumber, false, 2);

				if (evalObject != -1) {
					liveEval2 = _.union(liveEval2, evalObject);
				}


			} else {
				// evalLabels = _.union(evalLabels, [moveNumber + 0.5]);

				blackEval = _.union(blackEval, evalL);
				// blackEval = _.union(blackEval, [{'x': moveNumber + 0.5, 'y': move.wv, 'eval': evaluation}]);
				blackTime = _.union(blackTime, time);
				blackSpeed = _.union(blackSpeed, speed);
				blackNodes = _.union(blackNodes, nodes);
				blackDepth = _.union(blackDepth, depth);
            blackSelDepth = _.union(blackSelDepth, seldepth);
				blackTBHits = _.union(blackTBHits, tbHits);

				// evalObject = getLiveEval(key, moveNumber, true);

				// if (evalObject != -1) {
				// 	liveEval = _.union(liveEval, evalObject);
				// }
			}
		}
	});

	evalChart.data.labels = labels;
	evalChart.data.datasets[0].data = whiteEval;
	evalChart.data.datasets[1].data = blackEval;
   if (showLivEng1)
   {
	   evalChart.data.datasets[2].data = liveEval1;
   }
   else
   {
      evalChart.data.datasets[2].data = [];
   }
   if (showLivEng2)
   {
	   evalChart.data.datasets[3].data = liveEval2;
   }
   else
   {
      evalChart.data.datasets[3].data = [];
   }

	timeChart.data.labels = labels;
	timeChart.data.datasets[0].data = whiteTime;
	timeChart.data.datasets[1].data = blackTime;

	speedChart.data.labels = labels;
	speedChart.data.datasets[0].data = whiteSpeed;
	speedChart.data.datasets[1].data = blackSpeed;

   if (nodesChart)
   {
	   nodesChart.data.labels = labels;
   	nodesChart.data.datasets[0].data = whiteNodes;
	   nodesChart.data.datasets[1].data = blackNodes;
   }

	depthChart.data.labels = labels;
	depthChart.data.datasets[0].data = whiteDepth;
	depthChart.data.datasets[1].data = blackDepth;
	depthChart.data.datasets[2].data = whiteSelDepth;
	depthChart.data.datasets[3].data = blackSelDepth;

	tbHitsChart.data.labels = labels;
	tbHitsChart.data.datasets[0].data = whiteTBHits;
	tbHitsChart.data.datasets[1].data = blackTBHits;

    evalChart.update();
    timeChart.update();
    speedChart.update();
    var nodeChartIs = document.getElementById("nodes-graph");
    if (nodeChartIs)
    {
       nodesChart.update();
    }
    depthChart.update();
    tbHitsChart.update();
}

function getLiveEval(key, moveNumber, isBlack, contno)
{
	key++;
   var engineEval = null;

   if (contno == 1)
   {
      engineEval = liveEngineEval1;
   }
   else
   {
      engineEval = liveEngineEval2;
   }

	evalObject = _.find(engineEval, function(ev) {
		return ev.ply == key;
	});

	if (_.isObject(evalObject)) {
		evalL = evalObject.eval;
		if (!isNaN(evalObject.eval)) {
	        if (evalObject.eval > evalconstant) {
	        	evalObject.eval = evalconstant;
	        } else if (evalObject.eval < -evalconstant) {
	        	evalObject.eval = -evalconstant;
	        }
	    } else {
	    	if (evalObject.eval.substring(0,1) == '-') {
	    		evalObject.eval = -evalconstant;
	    	} else {
	    		evalObject.eval = evalconstant;
	    	}
	    }

	    if (isBlack) {
	    	// moveNumber = moveNumber + 0.5;
	    }

	    return [
				{
					'x': moveNumber,
					'y': evalObject.eval,
					'eval': evalL
				}
			];
	}

	return -1;
}
