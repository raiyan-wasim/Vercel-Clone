// This code sets up a reverse proxy server using Express and http-proxy.
// It serves files from an S3 bucket based on the subdomain of the request.
// The S3 bucket is expected to contain files organized by subdomain, and the server defaults
// to serving `index.html` if no specific file is requested.
// The server listens on port 8000 and uses the `http-proxy` library to
// forward requests to the appropriate S3 URL based on the subdomain and requested file.
// The S3 bucket is expected to be structured with files under the path `__outputs/{subdomain}`.
// For example, a request to `http://subdomain.example.com/somefile.html` would
// be proxied to `https://vercel-clone-rynwsm.s3.ap-south-1.amazonaws.com/__outputs/subdomain/somefile.html`.

const express = require('express');
const httpProxy = require('http-proxy');

const app = express();
const PORT = 8000; //running our reverse proxy on port 8000


const BASE_PATH = 'https://vercel-clone-rynwsm.s3.ap-south-1.amazonaws.com/__outputs';

const proxy = httpProxy.createProxy();

app.use((req, res) => {
    const hostname = req.hostname;
    const subdomain = hostname.split('.')[0]; // Extract subdomain from hostname

    let file = req.url;
    if (file === '/') { //if a user hasm't specified a file, we will default to index.html
        file = '/index.html'; 
    }

    const resolvesTo = `${BASE_PATH}/${subdomain}${file}`;
    return proxy.web(req, res, {
        target: resolvesTo,
        changeOrigin: true,
        ignorePath: true
    });
});

app.listen(PORT, () => console.log(`reverse proxy running on port ${PORT}`));
