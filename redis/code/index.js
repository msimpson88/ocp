const express = require('express');
const app = express();
var RedisSMQ = require('rsmq');
const port = 3000;

app.use(express.json());

// var redis         = require('redis');
var redisPort = process.env.REDISPORT;
var redisHost = process.env.REDISHOST;
var redisPass = process.env.REDISPASS; // Default from original installation

var activeQueues;

console.log('Using redisPort: ' + redisPort);
console.log('Using redisHost: ' + redisHost);

console.log('Setting up RedisSMQ');
var rsmq = new RedisSMQ({
    host: redisHost,
    port: redisPort,
    ns: 'rsmq',
    realtime: true,
    password: redisPass,
});

// List the queues
rsmq.listQueues(function (err, queues) {
    if (err) {
        console.error(err);
        return;
    }
    activeQueues = queues;
    console.log(queues);

    if (!queues.includes('test-queue')) {
        console.log("test-queue doesn't exist, creating it");
        rsmq.createQueue({ qname: 'test-queue' }, (err, resp) => {
            if (err) {
                console.log(err);
                return;
            }

            if (resp === 1) {
                console.log('test-queue created');
            }
        });
    } else {
        console.log('test-queue already exists');
    }
});

// send response message func
const sendResponse = (qname, message) => {
    return new Promise((resolve, reject) => {
        rsmq.sendMessage({ qname: qname, message: message }, (err, resp) => {
            if (err) {
                reject(err);
            }
            resolve(resp);
        });
    });
};

const receiveMessage = (qname) => {
    return new Promise((resolve, reject) => {
        rsmq.receiveMessage({ qname: qname }, function (err, resp) {
            if (err) {
                reject(err)
            }

            if (resp.id) {
                resolve(resp)
            } else {
                resolve("No messages for me...")
            }
        });
    });
};

app.get('/', (req, res) => {
    res.send(`
    <h1>Common Control Plane - Redis Test Server</h1> 
    <h>Send POST /send?queue=myqueue to send a message to myqueue</h>
    <p>Active queues in ${redisHost}:${redisPort}</p>
    <p>${activeQueues}</p>
    `);
});

app.get('/messages', (req, res) => {
    receiveMessage('test-queue')
    .then((result) => {
        res.send(result)
    })
    .catch((err) => {
        res.status(400).send(err);
    })
})

app.post('/send', async (req, res) => {
    var queue = req.query.queue;
    var message = JSON.stringify(req.body);
    var ts = new Date();
    console.log('----------------------------------------------------')
    console.log({
        time: ts.toLocaleString(),
        transactionId: req.body.transactionId,
        service: req.body.service,
        requestType: req.body.requestType,
    })

    sendResponse(queue, message)
        .then((result) => {
            console.log('To: ' + queue)
            console.log('Message Sent ID: ' + result);
            console.log('----------------------------------------------------')
            res.send({
                status: 'Message Sent',
                id: result,
            });
        })
        .catch((err) => {
            console.log(err)
            console.log('----------------------------------------------------')
            res.status(400).send(err);
        });
});

app.listen(port, () => console.log(`Server is listening at http://localhost:${port}`));
