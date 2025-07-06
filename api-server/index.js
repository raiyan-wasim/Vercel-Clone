const express = require('express');
const { generateSlug } = require('random-word-slugs');
const { Server } = require('socket.io');
const Redis = require('ioredis');
const { ECSClient, RunTaskCommand } = require('@aws-sdk/client-ecs');

const app = express();
const PORT = 9000;

// Redis client for subscribing to logs
const subscriber = new Redis('rediss://default:AVNS_9HyNJjf8hK4kvuXtH2U@valkey-3591714-cloneup-1.j.aivencloud.com:13991');

// Start socket server
const io = new Server({ cors: { origin: '*' } }); // allow all origins (in dev)

io.on('connection', socket => {
    // Listen for 'subscribe' event
    socket.on('subscribe', channel => {
        socket.join(channel); // join the room
        socket.emit('message', `Joined ${channel}`); // confirm to client
    });
});

io.listen(9002, () => {
    console.log('Socket server running on port 9002');
});

// AWS ECS setup for launching tasks
const ecsClient = new ECSClient({
    region: 'ap-south-1',
    credentials: {
        accessKeyId: 'AKIAW5BDQYMNQALYGAVS',
        secretAccessKey: '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'
    }
});

const config = {
    CLUSTER: 'arn:aws:ecs:ap-south-1:474668385051:cluster/builder-cluster',
    TASK: 'arn:aws:ecs:ap-south-1:474668385051:task-definition/builder-task-rynwsm'
};

app.use(express.json());

app.post('/project', async (req, res) => {
    const { gitURL, slug } = req.body;
    const projectSlug = slug ? slug :  generateSlug(); // generate a unique slug

    // now, spin the container on ECS
    const command = new RunTaskCommand({
        cluster: config.CLUSTER,
        taskDefinition: config.TASK,
        launchType: 'FARGATE',
        count: 1,
        networkConfiguration: {
            awsvpcConfiguration: {
                assignPublicIp: 'ENABLED',
                subnets: [
                    'subnet-005d46f14c49f1016',
                    'subnet-036fd0f998d74477c',
                    'subnet-05c25dce8789443c5'
                ],
                securityGroups: ['sg-0aa917a87bf2d236b']
            }
        },
        overrides: {
            containerOverrides: [
                {
                    name: 'builder-image-rynwsm',
                    environment: [
                        { name: 'GIT_REPOSITORY__URL', value: gitURL },
                        { name: 'PROJECT_ID', value: projectSlug }
                    ]
                }
            ]
        }
    });

    await ecsClient.send(command);

    return res.json({
        status: 'queued',
        data: { projectSlug },
        url: `http://${projectSlug}.localhost:8000`
    });
});

// Subscribe to Redis pattern logs:* and emit to corresponding socket rooms
async function initRedisSubscribe() {
    console.log('Subscribed to logs...');
    await subscriber.psubscribe('logs:*');
    subscriber.on('pmessage', (pattern, channel, message) => {
        io.to(channel).emit('message', message);
    });
}

initRedisSubscribe();

// Start API server
app.listen(PORT, () => console.log(`API server running on port ${PORT}`));
