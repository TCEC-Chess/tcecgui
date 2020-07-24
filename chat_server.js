// chat_server.js
// @authors octopoulo <polluxyz@gmail.com>, Aloril <aloril@iki.fi>
/*
globals
console, exports, require
*/
'use strict';

let Module = require('./js/chess-wasm.js'),
    Net = require('net');

let frc = false,
    LS = console.log,
    port = 8090,
    server = new Net.Server();

server.listen(port, () => {
    LS(`Server listening for connection requests on socket localhost:${port}.`);
});

let chess,
    voting = {}; //indexed by fen, supports 1-2 clients

/**
 * Load chess-wasm
 */
async function load_wasm() {
    let instance = await Module();
    chess = new instance.Chess();
    LS('chess library loaded');
}

function vote(data)
{
    LS('vote, data=' + JSON.stringify(data));
    if (typeof data.fen == "string") { //needed because fen string here don't match fen strings in Python
	let lst = data.fen.split(" ");
	data.fen = lst[0] + " " + lst[1] + " " + lst[5];
    }
    if (!(data.fen in voting) || typeof data.move != "string" || data.move.length > 5) {
	LS('Not found');
	return;
    }
    let entry = voting[data.fen],
	move = data.move;
    LS('entry: ' + JSON.stringify(entry.votes) + ' ' + JSON.stringify(entry.byIP));
    if (!(move in entry.votes)) {
	entry.votes[move] = 0;
    }
    if (data.ip in entry.byIP) {
	if (entry.byIP[data.ip] == move) {
	    LS("Same move as earlier: " + move);
	    return;
	}
	LS(`Reduce vote: ${entry.byIP[data.ip]} by ${data.ip}`);
	entry.votes[entry.byIP[data.ip]]--;
    }
    entry.votes[move]++;
    entry.byIP[data.ip] = move;
    let msg = JSON.stringify({
        fen: data.fen,
        votes: Object.entries(entry.votes),
    });
    LS(`Sending data: ${msg}.`);
    LS('---');
    entry.socket.write(msg.length.toString().padStart(4, " ") + msg);
};

server.on('connection', async socket => {
    let ip = socket.remoteAddress;
    LS(`A new connection has been established: ${ip}.`);
    if (ip != '::ffff:127.0.0.1') {
        LS('Not local connection, closing');
        socket.destroy();
        return;
    }

    if (!chess)
        await load_wasm();

    socket.on('data', chunk => {
	// CHECK THIS: FIX: handle 2 messages in one packet or incomplete packets:
	// Error can triggered by "go movetime 100" for example. Could use same method as chat_engine.read_votes does.
        LS('data');
        let data, text;
        try {
            text = chunk.toString();
            data = JSON.parse(text);
        }
        catch (e) {
            LS(`bad data: ${data}, text: ${text}`);
            LS(e);
            return;
        }

        if (data.voting != undefined) {
	    if (data.voting) {
		voting[data.fen] = {
		    votes:  {},
		    byIP: {},
		    socket: socket
		};
		LS("created empty voting");
	    } else if ( data.fen in voting ) {
		delete voting[data.fen];
		LS("deleted voting");
	    }
        }
	LS(`Data received from client: ${text}`);
    });

    socket.on('end', () => {
        LS('Closing connection with the client');
    });

    socket.on('error', err => {
        LS(`Error: ${err}`);
    });
});

exports.vote = vote;
