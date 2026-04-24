/**
 * Universal Tunnel Script (KiranaIQ)
 * 
 * This script runs a proxy server on port 9000 that routes:
 * - /agent/* -> FastAPI (Port 8000)
 * - /api/*   -> Node.js (Port 5001)
 * 
 * Now your Flutter app can use ONE ngrok URL for everything!
 */

const express = require('express');
const axios = require('axios');
const ngrok = require('ngrok');
const cors = require('cors');
require('dotenv').config();

const PROXY_PORT = 9000;
const NODE_PORT = 5001;
const FASTAPI_PORT = 8000;

// 1. Start the Node backend logic (it will listen on its own port 5001)
// require('./server');

// 2. Setup the Proxy Server on port 9000
const http = require('http');

const proxy = http.createServer((clientReq, clientRes) => {
    // Set CORS headers
    clientRes.setHeader('Access-Control-Allow-Origin', '*');
    clientRes.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    clientRes.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (clientReq.method === 'OPTIONS') {
        clientRes.writeHead(204);
        clientRes.end();
        return;
    }

    // Route logic based on path
    const targetPort = clientReq.url.startsWith('/agent') ? FASTAPI_PORT : NODE_PORT;
    console.log(`[Proxy] ${clientReq.method} ${clientReq.url} -> localhost:${targetPort}`);
    
    const options = {
        hostname: 'localhost',
        port: targetPort,
        path: clientReq.url,
        method: clientReq.method,
        headers: {
            ...clientReq.headers,
            host: `localhost:${targetPort}`,
            connection: 'close',  // Force close so pipe ends properly
        },
    };

    const proxyReq = http.request(options, (proxyRes) => {
        console.log(`[Proxy] <- ${proxyRes.statusCode} from localhost:${targetPort}`);
        const chunks = [];
        proxyRes.on('data', (chunk) => chunks.push(chunk));
        proxyRes.on('end', () => {
            const body = Buffer.concat(chunks);
            clientRes.writeHead(proxyRes.statusCode, {
                'content-type': proxyRes.headers['content-type'] || 'application/json',
                'access-control-allow-origin': '*',
                'connection': 'close',
            });
            clientRes.end(body);
        });
    });

    proxyReq.on('error', (err) => {
        console.error(`[Proxy Error] ${err.message} -> localhost:${targetPort}${clientReq.url}`);
        clientRes.writeHead(502, { 'Content-Type': 'application/json' });
        clientRes.end(JSON.stringify({
            error: 'Backend unreachable',
            message: "Ensure both your Python (8000) and Node (5001) servers are running locally."
        }));
    });

    // Pipe the request body directly to the backend (no parsing/re-serialization)
    clientReq.pipe(proxyReq, { end: true });
});

const { spawn } = require('child_process');

async function start() {
    // Start Proxy
    proxy.listen(PROXY_PORT, () => {
        console.log(`\n🚀 Universal Gateway running on port ${PROXY_PORT}`);
    });

    console.log('\n' + '='.repeat(60));
    console.log('🌟 STARTING UNIVERSAL TUNNEL...');
    console.log('='.repeat(60));
    console.log(`\nStarting ngrok on port ${PROXY_PORT}...`);

    // Use npx to run ngrok directly - much more reliable on Windows
    const ngrokProcess = spawn('npx', ['ngrok', 'http', PROXY_PORT], { 
        shell: true,
        stdio: 'inherit' // This shows the ngrok UI directly in your terminal
    });

    ngrokProcess.on('error', (err) => {
        console.error('Failed to start ngrok:', err.message);
    });
}

start();
