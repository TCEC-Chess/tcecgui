var roundDate = [];
/* All times in GST, maintain proper formatting, if date is not decide just put 0 */
var roundDateMan = [
0, /* 1 */
0, /* 2 */
0, /* 3 */
0, /* 4 */
0, /* 5 */
0, /* 6 */
0, /* 7 */
0, /* 8 */
0, /* 9 */
0, /* 10 */
0, /* 11 */
0, /* 12 */
0, /* 13 */
0, /* 14 */
0, /* 15 */
0, /* 16 */
0, /* 17 */
0, /* 18 */
0, /* 19 */
0, /* 20 */
0, /* 15 */
0, /* 16 */
0, /* 17 */
0, /* 18 */
0, /* 19 */
0, /* 19 */
0, /* 27 */
0, /* 28 */
0, /* 29 */
0, /* 30 */
0, /* 30 */
0, /* 32 */
0, /* 30 */
0, /* 34 */
];

var startDateR1 = '17:00:00 on 2019.01.21';
var startDateR2 = 0;
var roundNo = 2;

var teamsx = 
 [[["", 1], ["", 32]],
 [["", 16], ["", 17]],
 [["", 9], ["", 24]],
 [["", 8], ["",25]],
 [["", 4], ["", 29]],
 [["", 13], ["", 20]],
 [["", 12], ["", 21]],
 [["", 5], ["", 28]],
 [["", 2], ["", 31]],
 [["", 15], ["", 18]],
 [["", 10], ["", 23]],
 [["", 7], ["", 26]],
 [["", 3], ["", 30]],
 [["", 14], ["", 19]],
 [["", 11], ["", 22]],
 [["", 6], ["", 27]]
];

var bigData = {           
 teams : [            
 ],            
 results : [[ /* WINNER BRACKET */          
 [[0,0, "empty-bye"], [0,0], [0,0], [0,0], [0,0], [0,0], [0,0], [0,0], [0,0, "arun"], [0,0], [0,0], [0,0], [0,0], [0,0], [0,0], [0,0]],
 [[0,0, "arun"], [0,0], [0,0], [0,0], [0,0], [0,0], [0,0], [0,0]],        
 [[0,0], [0,0], [0,0], [0,0]],          
 [[0,0], [0,0]],           
 [[0,0],           
  [0,0]]            
 ]            
 ]            
}            

var roundResults = []

var dummyCross = 
{
	"Event" : "",
	"Order" : [
		"Engine1",
		"Engine2"
	],
	"Table" : {
		"Engine1" : {
			"Abbreviation" : "E1",
			"Elo" : 0,
			"Games" : 0,
			"GamesAsBlack" : 0,
			"GamesAsWhite" : 0,
			"Neustadtl" : 0,
			"Performance" : 0,
			"Rank" : 1,
			"Rating" : 0,
			"Results" : {
				"Engine2" : {
					"Scores" : [],
					"Text" : ""
				}
			},
			"Score" : 0,
			"Strikes" : 0,
			"WinsAsBlack" : 0,
			"WinsAsWhite" : 0
		},
		"Engine2" : {
			"Abbreviation" : "E2",
			"Elo" : 0,
			"Games" : 0,
			"GamesAsBlack" : 0,
			"GamesAsWhite" : 0,
			"Neustadtl" : 0,
			"Performance" : 0,
			"Rank" : 2,
			"Rating" : 0,
			"Results" : {
				"Engine1" : {
					"Scores" : [],
					"Text" : ""
				}
			},
			"Score" : 0,
			"Strikes" : 0,
			"WinsAsBlack" : 0,
			"WinsAsWhite" : 0
		}
	}
}

var gamesEachMatch = [];
var columnsEvent = [
     {
       field: 'match',
       title: 'Round',
       width: '4%'
       ,sortable: true
     },
     {
       field: 'Winner',
       title: 'Winner'
     },
     {
       field: 'Points',
       title: 'Points'
     },
     {
       field: 'Runner',
       title: 'Runnerup'
     },
     {
       field: 'Games',
       title: '# Games'
     },
     {
       field: 'Score',
       title: 'Score'
      ,formatter: 'formatterEvent'
      ,cellStyle: 'cellformatterEvent'
     }
   ];

