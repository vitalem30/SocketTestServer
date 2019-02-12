var net = require('net');

var sess_list = [];  //holding all client sessions
var server = net.createServer();
var rport;

server.on('close', function () {
    console.log('Server closed !');
});

// emitted when new client connects
server.on('connection', function (socket) {

    console.log('---------server details -----------------');

    var address = server.address();
    var port = address.port;
    var family = address.family;
    var ipaddr = address.address;
    console.log('Server is listening at port ' + port);
    //console.log('Server ip :' + ipaddr);
    //console.log('Server is IP4/IP6 : ' + family);

    //var lport = socket.localPort;
    //var laddr = socket.localAddress;
    //console.log('Server is listening at LOCAL port' + lport);
    //console.log('Server LOCAL ip :' + laddr);

    //console.log('------------remote client info --------------');
    rport = socket.remotePort;
    var raddr = socket.remoteAddress;
    var rfamily = socket.remoteFamily;

    console.log('REMOTE Socket is listening at port' + rport);
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
        //console.log('Socket ended from other end!');
        console.log('End data : ' + data);
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

server.maxConnections = 100;
server.listen(8080);


setInterval(checkSocketExpired, 60000);
//setTimeout(function () {
//    server.close();
//}, 5000000);


function process_incoming(data) {
    var word = data.split('@');
    var action = word[1];
    console.log('action:' + action);
    switch (action) {
        case "START":
            console.log('Add MAC to list:' + word[0]);
            var sess = new Object();
            sess["mac"] = word[0];
            sess["start"] = new Date();
            sess["port"] = rport;
            sess_list.push(sess);                        
            break;
        case "STOP":
            console.log('Remove MAC to list:' + word[0]);
            delete_from_list(word[0]);
            break;
        default:
            console.log('dont know what to do with:' + word[1]+'.');
            break;
    }
}

function delete_from_list(mac) {
    console.log('delete:' + mac);
    for (i in sess_list) {
        if (sess_list[i].mac == mac) {
            sess_list.splice(i, 1);
            console.log('Remaining:' + sess_list.length);
            return;
        }        
    } 
}

function print_list() {
    console.log('print_list:' + sess_list.length);
    for (i in sess_list) {
        console.log('mac=' + sess_list[i].mac + ',ip:' + sess_list[i].ip);
    } 
}

function checkSocketExpired()
{
    var now = new Date();
    if (!sess_list.length) {
        console.log('no active sessions');
        return;
    }
    console.log('expired');
    for (i in sess_list) {
        var elapsed = Math.round(now - sess_list[i].start)/1000;
        if (elapsed > 320) {
            console.error('SOCKET ISSUE DETECTED FOR ' + sess_list[i].mac + '(Remaining:' + sess_list.length-1 + ')');
            sess_list.splice(i,1);
        }
    }     
}
