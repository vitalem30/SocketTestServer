var net = require('net');

var sess_list = [];  //holding all client sessions
var server = net.createServer();

//emitted when server closes ...not emitted until all connections closes.
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
    console.log('Server is listening at port' + port);
    console.log('Server ip :' + ipaddr);
    console.log('Server is IP4/IP6 : ' + family);

    var lport = socket.localPort;
    var laddr = socket.localAddress;
    console.log('Server is listening at LOCAL port' + lport);
    console.log('Server LOCAL ip :' + laddr);

    console.log('------------remote client info --------------');
    var rport = socket.remotePort;
    var raddr = socket.remoteAddress;
    var rfamily = socket.remoteFamily;

    console.log('REMOTE Socket is listening at port' + rport);
    console.log('REMOTE Socket ip :' + raddr);
    console.log('REMOTE Socket is IP4/IP6 : ' + rfamily);

    console.log('--------------------------------------------')
    //var no_of_connections =  server.getConnections(); // sychronous version
    server.getConnections(function (error, count) {
        console.log('Number of concurrent connections to the server : ' + count);
    });

    socket.setEncoding('utf8');
    
    socket.setTimeout(10*60*1000, function () {
        // called after timeout -> same as socket.on('timeout')
        // it just tells that soket timed out => its ur job to end or destroy the socket.
        // socket.end() vs socket.destroy() => end allows us to send final data and allows some i/o activity to finish before destroying the socket
        // whereas destroy kills the socket immediately irrespective of whether any i/o operation is goin on or not...force destry takes place
        console.log('Socket timed out');
    });


    socket.on('data', function (data) {
        //var bread = socket.bytesRead;
        //var bwrite = socket.bytesWritten;
        ////console.log('Bytes read : ' + bread);
        //console.log('Bytes written : ' + bwrite);
        console.log('Data received : ' + data);
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
        console.err('socket Error : ' + error);
        console.err('socket remortport: ' + socket.remotePort);       
    });

    socket.on('timeout', function () {
        console.log('Socket timed out !');
        socket.end('Timed out!');
    });

    socket.on('end', function (data) {
        console.log('Socket ended from other end!');
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
    console.log('word0:' + word[0]);
    console.log('word1:' + word[1]);
    console.log('word2:' + word[2]);
    var action = word[1].toString();
    console.log('action:' + action);

    switch (action) {
        case "START":
            //process mac
            console.log('Add MAC to list:' + word[0]);
            var sess = new Object();
            sess["mac"] = word[0];
            sess["start"] = new Date();
            //sess["ip"] = raddr;
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
            console.log('mac found , deleted!');
            delete sess_list[i];
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
//test();
function test() {

    //var item = { "mac": 'jccods', "start": '13:43', "ip": '192.168.2.11' };
    //sess_list.push(item);
    //item = { "mac": 'j1234', "start": '17:43', "ip": '3333.168.2.11' };
    //sess_list.push(item);
    //print_list();
    //delete_from_list('jccods');
    //print_list();

    //process_incoming('FP00112A217D97@10:09@START');
    process_incoming('FP00112A217D97@10:09@STOP');
}

function checkSocketExpired()
{
    var now = new Date();
    if (!sess_list) {
        console.log('no active sessions');
        return;
    }
    for (i in sess_list) {
        var elapsed = Math.round(now - sess_list[i].start)/1000;
        if (elapsed > 300) {
            console.err('SOCKET ISSUE DETECTED FOR ' + sess_list[i].mac);
            delete sess_list[i];            
        }
        else
            console.info('still ok for ' + sess_list[i].mac+'(elapsed '+elapsed+'s');
    }     
}