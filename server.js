'use strict';
const fs = require('fs');
var net = require('net');
const readline = require('readline');
var sess_list = [];  //holding all client sessions
var server = net.createServer();
var rport;
var raddr;
var cntStop = 0, cntStart = 0, cntNok = 0;

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: 'SOCKET> '
});


server.on('close', function () {
    console.log('Server closed !');
});

// emitted when new client connects
server.on('connection', function (socket) {

   // console.log('---------server details -----------------');

    var address = server.address();
    var port = address.port;
    var family = address.family;
    var ipaddr = address.address;
    //console.log('Server is listening at port ' + port);
    //console.log('Server ip :' + ipaddr);
    //console.log('Server is IP4/IP6 : ' + family);

    //var lport = socket.localPort;
    //var laddr = socket.localAddress;
    //console.log('Server is listening at LOCAL port' + lport);
    //console.log('Server LOCAL ip :' + laddr);

    //console.log('------------remote client info --------------');
    rport = socket.remotePort;
    raddr = socket.remoteAddress;
    var rfamily = socket.remoteFamily;

    //console.log('REMOTE Socket is listening at port' + rport);
    //console.log('REMOTE Socket ip :' + raddr);
    //console.log('REMOTE Socket is IP4/IP6 : ' + rfamily);

    //console.log('--------------------------------------------')
    server.getConnections(function (error, count) {
        console.log('Number of concurrent connections to the server : ' + count);
    });

    socket.setEncoding('utf8');
    
    //socket.setTimeout(10*60*1000, function () {
    //    // called after timeout -> same as socket.on('timeout')
    //    // it just tells that soket timed out => its ur job to end or destroy the socket.
    //    // socket.end() vs socket.destroy() => end allows us to send final data and allows some i/o activity to finish before destroying the socket
    //    // whereas destroy kills the socket immediately irrespective of whether any i/o operation is goin on or not...force destry takes place
    //    console.log('Socket timed out');
    //});


    socket.on('data', function (data) {
        //var bread = socket.bytesRead;
        //var bwrite = socket.bytesWritten;
        ////console.log('Bytes read : ' + bread);
        //console.log('Bytes written : ' + bwrite);
        //console.log('Data received : ' + data);
        process_incoming(data);
        //echo data
        //var is_kernel_buffer_full = socket.write('Data ::' + data);
        //if (is_kernel_buffer_full) {
        //    console.log('Data was flushed successfully from kernel buffer i.e written successfully!');
        //} else {
        //    socket.pause();
        //}
        
    });

    socket.on('drain', function () {
        console.log('write buffer is empty now .. u can resume the writable stream');
        socket.resume();
    });

    socket.on('error', function (error) {
        console.error('socket Error : ' + error);
        console.error('socket remortport: ' + socket.remotePort);       
    });

    socket.on('timeout', function () {
        console.log('Socket timed out !');
        socket.end('Timed out!');
    });

    socket.on('end', function (data) {
        console.log('Socket ended from other end!');
        //console.log('End data : ' + data);
    });

    socket.on('close', function (error) {
        //var bread = socket.bytesRead;
        //var bwrite = socket.bytesWritten;
        //console.log('Bytes read : ' + bread);
        //console.log('Bytes written : ' + bwrite);
        console.log('Socket closed!');
        if (error) {
            console.log('Socket was closed coz of transmission error');
        }
    });

    //setTimeout(function () {
    //    var isdestroyed = socket.destroyed;
    //    console.log('Socket destroyed:' + isdestroyed);
    //    socket.destroy();
    //}, 1200000);

});

// emits when any error occurs -> calls closed event immediately after this.
server.on('error', function (error) {
    console.log('Server Error: ' + error);  
});

//emits when server is bound with server.listen
server.on('listening', function () {
    console.log('Server is listening!');
});

server.maxConnections = 500;
server.listen(8080);
//setTimeout(function () {
//    server.close();
//}, 5000000);


//setInterval(checkSocketExpired, 60000);


function process_incoming(data) {
    var word = data.split('@');
    var mac = word[0];
    var action = word[1];
    var interval = word[2];
    //console.log('action:' + action + ' of mac '+ mac );
    switch (action) {
        case "START":
            if (!find_in_list(mac)) 
                create_new_session(mac, interval);
            else 
                update_session(mac, interval)

            cntStart++;
            console.log('Start ' + interval + ' interval for MAC:' + mac + '(Status: ' + cntStop +'/'+ cntStart+')');
            break;
        case "STOP":
            //delete_from_list(word[0]);
            update_session(mac, interval);
            cntStop++;
            console.log('Stop ' + interval + 'interval for MAC:' + mac + '(Status: ' + cntStop + '/' + cntStart + ')');
            break;
        default:
            console.error('dont know what to do with:' + action);
            break;
    }
}

function create_new_session(mac, interval) {
    console.log('create_new_session: ' + mac + ',interval:' + interval);
    var sess = new Object();
    sess["mac"] = mac;
    sess["start"] = new Date();
    sess["port"] = rport;
    sess["rip"] = raddr;
    sess["1"] = 0;
    sess["2"] = 0;
    sess["3"] = 0;
    sess["4"] = 0;
    sess["5"] = 0;
    sess["6"] = 0;
    sess["7"] = 0;

    update_interval(sess, interval, 1);
    sess_list.push(sess);
}

function update_interval(sess,interval, value){
    switch (interval) {
        case '1':
            sess["1"] = value;
            break;
        case '2':
            sess["2"] = value;
            break;
        case '3':
            sess["3"] = value;
            break;
        case '4':
            sess["4"] = value;
            break;
        case '5':
            sess["5"] = value;
            break;
        case '6':
            sess["6"] = value;
            break;
        case '7':
            sess["7"] = value;
            break;
        default:
            console.error('unknown interval received:' + interval);
    }
}


function delete_from_list(mac) {
    //console.log('delete:' + mac);
    for (var i in sess_list) {
        if (sess_list[i].mac == mac) {
            sess_list.splice(i, 1);
            //console.log('Remaining:' + sess_list.length);
            return;
        }        
    } 
}

function print_list() {   
    console.log("sessions:" + JSON.stringify(sess_list));
}

function update_session(mac, interval) {

    for (var i in sess_list) {
        //console.log('now looking at ' + sess_list[i].mac);
        if (sess_list[i].mac == mac) {
            update_interval(sess_list[i], interval, 2);
            //console.log('found');
            return;
        }
    }
    return;
}

function find_in_list(mac) {
    //console.log('find_in_list:' + mac);
    if (!sess_list.length) {
        console.log('list empty');
        return null;
    }
    for (var i in sess_list) {
    //    console.log('now looking at ' + sess_list[i].mac);
        if (sess_list[i].mac == mac) {
      //      console.log('found');
            return i;
        }
    }
    return null;
}
function checkSocketExpired()
{
    var now = new Date();
    if (!sess_list.length) {
        console.log('no active sessions');
        return;
    }
    console.log('time:'+now);
    for (var i in sess_list) {
        var elapsed = Math.round(now - sess_list[i].start)/1000;
        if (elapsed > 320) {
            cntNok++
            console.error('SOCKET ISSUE DETECTED FOR ' + sess_list[i].mac);
            sess_list.splice(i, 1);
        }
    }
    console.error('Remaining:' + sess_list.length + ',Total:'+cntStart+',OK:'+cntStop+',NOK:'+cntNok);        
}


rl.on('line', (input) => {
    //console.log(`Received: ${input}`);
    if (input === 'p')
        print_list();
    else if (input === 's')
        fs.writeFileSync('sessions.json', JSON.stringify(sess_list));
});

