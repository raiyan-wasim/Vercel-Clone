const { exec } = require('child_process');
const path  = require('path');
const fs  = require('fs');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const mime = require('mime-types'); 
const Redis = require('ioredis');



const publisher = new Redis('rediss://default:AVNS_9HyNJjf8hK4kvuXtH2U@valkey-3591714-cloneup-1.j.aivencloud.com:13991');



// const Valkey = require("ioredis");
// const serviceUri = "rediss://default:AVNS_9HyNJjf8hK4kvuXtH2U@valkey-3591714-cloneup-1.j.aivencloud.com:13991"
// const valkey = new Valkey(serviceUri);

// valkey.set("key", "hello world");

// valkey.get("key").then(function (result) {
//     console.log(`The value of key is: ${result}`);
//     valkey.disconnect();
// });



const client = new S3Client({
    region: 'ap-south-1',
    credentials: {
        accessKeyId: 'AKIAW5BDQYMNQALYGAVS',
        secretAccessKey: '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'
    }
});



const PROJECT_ID = process.env.PROJECT_ID;

function publishLog(log){
    publisher.publish(`logs:${PROJECT_ID}`, JSON.stringify({log}))
}

async function init() {
    console.log('Executing script.js');
    publishLog('Build started...');
    const outDirPath = path.join(__dirname, 'output');

    const p = exec(`cd ${outDirPath} && npm install && npm run build`);
    p.stdout.on('data', function(data) {
        console.log(data.toString());
        publishLog(data.toString());
    });

    p.stderr?.on('data', function(data) {
        console.error('Error:', data.toString());
        publishLog(`Error: ${data.toString()}`);
    });

    p.on('close', async function() {
        console.log('Build Complete');
        publishLog('Build Complete');
        const distFolderPath = path.join(__dirname, 'output', 'dist');
        const distFolderContents = fs.readdirSync(distFolderPath, { recursive: true });

        publishLog('Starting to upload...')
        for (const file of distFolderContents) {
            const filePath = path.join(distFolderPath, file);

            if (fs.lstatSync(filePath).isDirectory()) continue;

            console.log('uploading', filePath);
            publishLog(`Uploading ${file}`);

            
            const command = new PutObjectCommand({
                Bucket: 'vercel-clone-rynwsm',
                Key: `__outputs/${PROJECT_ID}/${file}`,
                Body: fs.createReadStream(filePath),
                ContentType: mime.lookup(filePath) || 'application/octet-stream'
            });

            await client.send(command);
            publishLog(`Uploaded ${file}`);
            console.log('uploaded', filePath);
        }
        publishLog('Done...');
        console.log('Done...');
    });
}

init();
