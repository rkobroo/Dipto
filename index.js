
const axios = require('axios');

const download = async (url) => {
  if (!url) {
    throw new Error('URL is required');
  }

  // Try multiple API endpoints with different approaches
  const apiEndpoints = [
    {
      url: `https://api.tiklydown.eu.org/api/download?url=${encodeURIComponent(url)}`,
      method: 'GET',
      name: 'TiklyDown'
    },
    {
      url: `https://api16-normal-c-useast1a.tiktokv.com/aweme/v1/feed/?aweme_id=${extractTikTokId(url)}`,
      method: 'GET',
      name: 'TikTok Official',
      headers: {
        'User-Agent': 'com.ss.android.ugc.trill/494+TikTok+27.7.3+user_agent_hash',
      }
    },
    {
      url: 'https://api.cobalt.tools/api/json',
      method: 'POST',
      name: 'Cobalt',
      data: {
        url: url,
        vCodec: "h264",
        vQuality: "720",
        aFormat: "mp3",
        isAudioOnly: false
      }
    },
    {
      url: `https://www.noobs-api.rf.gd/download?url=${encodeURIComponent(url)}`,
      method: 'GET',
      name: 'Noobs API'
    },
    {
      url: 'https://tikwm.com/api/',
      method: 'POST',
      name: 'TikWM',
      data: {
        url: url,
        hd: 1
      }
    }
  ];

  // Function to extract TikTok video ID
  function extractTikTokId(url) {
    const match = url.match(/\/video\/(\d+)/);
    return match ? match[1] : null;
  }

  for (let i = 0; i < apiEndpoints.length; i++) {
    const endpoint = apiEndpoints[i];
    
    try {
      console.log(`🔄 Trying API ${i + 1}/${apiEndpoints.length}: ${endpoint.name}`);
      
      let response;
      const config = {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
          ...endpoint.headers
        }
      };

      if (endpoint.method === 'POST') {
        config.headers['Content-Type'] = 'application/json';
        response = await axios.post(endpoint.url, endpoint.data, config);
      } else {
        response = await axios.get(endpoint.url, config);
      }
      
      console.log(`✅ ${endpoint.name} API responded successfully`);
      
      // Check if response has meaningful data
      if (response.data && (
        response.data.video_url || 
        response.data.download_url || 
        response.data.data || 
        response.data.aweme_list ||
        response.data.url
      )) {
        return {
          data: response.data,
          contentType: response.headers['content-type'],
          apiUsed: endpoint.name,
          status: response.status
        };
      } else {
        console.log(`⚠️ ${endpoint.name} returned empty or invalid data`);
        if (i === apiEndpoints.length - 1) {
          return {
            data: response.data,
            contentType: response.headers['content-type'],
            apiUsed: endpoint.name,
            status: response.status,
            warning: 'API responded but data structure may be unexpected'
          };
        }
      }
      
    } catch (error) {
      const statusCode = error.response?.status;
      const errorMsg = error.response?.data?.message || error.message;
      
      console.log(`❌ ${endpoint.name} failed: ${statusCode || 'Network Error'} - ${errorMsg}`);
      
      if (i === apiEndpoints.length - 1) {
        throw new Error(`All ${apiEndpoints.length} API endpoints failed. Most recent error: ${statusCode || 'Network Error'} - ${errorMsg}. The video URL might be private, expired, or the APIs are temporarily down.`);
      }
    }
  }
};

// Simple server setup with port checking
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  
  // Serve static files
  if (pathname === '/' || pathname === '/index.html') {
    try {
      const htmlPath = path.join(__dirname, 'public', 'index.html');
      console.log(`📄 Serving static file: ${htmlPath}`);
      const htmlContent = fs.readFileSync(htmlPath, 'utf8');
      res.writeHead(200, { 
        'Content-Type': 'text/html',
        'Cache-Control': 'no-cache'
      });
      res.end(htmlContent);
    } catch (error) {
      console.error(`❌ Error serving static file:`, error.message);
      res.writeHead(404, { 'Content-Type': 'text/html' });
      res.end('<h1>404 - Page not found</h1><p>Please check if the public/index.html file exists.</p>');
    }
    return;
  }
  
  // API endpoint for downloading videos
  if (pathname === '/api/download' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', async () => {
      try {
        const { url: videoUrl } = JSON.parse(body);
        
        if (!videoUrl) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'URL is required' }));
          return;
        }
        
        console.log(`🔍 Testing URL: ${videoUrl}`);
        const result = await download(videoUrl);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          url: videoUrl,
          contentType: result.contentType,
          apiUsed: result.apiUsed,
          data: result.data
        }));
        
      } catch (error) {
        console.error('❌ API Error:', error.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          error: error.message,
          success: false 
        }));
      }
    });
    return;
  }
  
  // Default API status
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ message: 'API Server Running', status: 'OK' }));
});

const PORT = process.env.PORT || 5000;

const startServer = (port) => {
  server.listen(port, '0.0.0.0', () => {
    console.log(`✅ Server successfully started on port ${port}`);
    console.log(`🌐 Web interface available at: https://${process.env.REPL_SLUG}-${process.env.REPL_OWNER}.replit.app`);
    console.log(`🔗 Local access: http://0.0.0.0:${port}`);
  }).on('error', (err) => {
    console.error(`❌ Server error on port ${port}:`, err.message);
    if (err.code === 'EADDRINUSE') {
      console.log(`🔄 Port ${port} is busy, trying ${port + 1}`);
      startServer(port + 1);
    } else {
      console.error('❌ Failed to start server:', err);
      process.exit(1);
    }
  });
};

startServer(PORT);

module.exports = { download };
