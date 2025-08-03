
import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  // Function to extract TikTok video ID
  function extractTikTokId(url) {
    const match = url.match(/\/video\/(\d+)/);
    return match ? match[1] : null;
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
        return res.status(200).json({
          success: true,
          url: url,
          contentType: response.headers['content-type'],
          apiUsed: endpoint.name,
          data: response.data
        });
      } else {
        console.log(`⚠️ ${endpoint.name} returned empty or invalid data`);
        if (i === apiEndpoints.length - 1) {
          return res.status(200).json({
            success: true,
            url: url,
            contentType: response.headers['content-type'],
            apiUsed: endpoint.name,
            data: response.data,
            warning: 'API responded but data structure may be unexpected'
          });
        }
      }
      
    } catch (error) {
      const statusCode = error.response?.status;
      const errorMsg = error.response?.data?.message || error.message;
      
      console.log(`❌ ${endpoint.name} failed: ${statusCode || 'Network Error'} - ${errorMsg}`);
      
      if (i === apiEndpoints.length - 1) {
        return res.status(500).json({
          error: `All ${apiEndpoints.length} API endpoints failed. Most recent error: ${statusCode || 'Network Error'} - ${errorMsg}. The video URL might be private, expired, or the APIs are temporarily down.`,
          success: false
        });
      }
    }
  }
}
