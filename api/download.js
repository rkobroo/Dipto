
import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  // Resolve shortened TikTok URLs to full URLs
  async function resolveUrl(shortUrl) {
    try {
      if (shortUrl.includes('vt.tiktok.com') || shortUrl.includes('vm.tiktok.com')) {
        console.log(`🔗 Resolving shortened URL: ${shortUrl}`);
        const response = await axios.head(shortUrl, {
          maxRedirects: 0,
          validateStatus: status => status === 302 || status === 301
        });
        const resolvedUrl = response.headers.location;
        console.log(`✅ Resolved to: ${resolvedUrl}`);
        return resolvedUrl || shortUrl;
      }
      return shortUrl;
    } catch (error) {
      console.log(`⚠️ Could not resolve URL, using original: ${shortUrl}`);
      return shortUrl;
    }
  }

  const resolvedUrl = await resolveUrl(url);

  // Function to extract TikTok video ID
  function extractTikTokId(url) {
    const match = url.match(/\/video\/(\d+)/);
    return match ? match[1] : null;
  }

  // Detect platform type
  function detectPlatform(url) {
    if (url.includes('tiktok.com')) return 'tiktok';
    if (url.includes('facebook.com') || url.includes('fb.watch')) return 'facebook';
    if (url.includes('instagram.com')) return 'instagram';
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
    if (url.includes('twitter.com') || url.includes('x.com')) return 'twitter';
    return 'universal';
  }

  const platform = detectPlatform(resolvedUrl);
  console.log(`🎯 Detected platform: ${platform}`);

  // Try multiple API endpoints with different approaches
  const apiEndpoints = [
    // Universal downloaders (work with multiple platforms)
    {
      url: 'https://api.cobalt.tools/api/json',
      method: 'POST',
      name: 'Cobalt (Universal)',
      data: {
        url: resolvedUrl,
        vCodec: "h264",
        vQuality: "720",
        aFormat: "mp3",
        isAudioOnly: false
      },
      platforms: ['universal', 'tiktok', 'facebook', 'instagram', 'youtube', 'twitter']
    },
    {
      url: `https://api.fdownloader.net/api`,
      method: 'POST',
      name: 'FDownloader (Universal)',
      data: {
        url: resolvedUrl
      },
      platforms: ['universal', 'facebook', 'instagram', 'youtube', 'tiktok']
    },
    {
      url: `https://api.savetubeapp.com/download`,
      method: 'POST',
      name: 'SaveTube (Universal)',
      data: {
        url: resolvedUrl,
        quality: "720"
      },
      platforms: ['universal', 'facebook', 'instagram', 'youtube', 'tiktok']
    },
    // TikTok specific APIs
    {
      url: `https://api.tiklydown.eu.org/api/download?url=${encodeURIComponent(resolvedUrl)}`,
      method: 'GET',
      name: 'TiklyDown',
      platforms: ['tiktok']
    },
    {
      url: 'https://tikwm.com/api/',
      method: 'POST',
      name: 'TikWM',
      data: {
        url: resolvedUrl,
        hd: 1
      },
      platforms: ['tiktok']
    },
    // Facebook/Instagram specific
    {
      url: `https://api.down-fb.com/download`,
      method: 'POST',
      name: 'DownFB',
      data: {
        url: resolvedUrl
      },
      platforms: ['facebook', 'instagram']
    },
    // Fallback APIs
    {
      url: `https://www.noobs-api.rf.gd/download?url=${encodeURIComponent(resolvedUrl)}`,
      method: 'GET',
      name: 'Noobs API',
      platforms: ['universal']
    }
  ];

  // Filter APIs based on platform
  const relevantApis = apiEndpoints.filter(api => 
    api.platforms.includes(platform) || api.platforms.includes('universal')
  );

  for (let i = 0; i < relevantApis.length; i++) {
    const endpoint = relevantApis[i];
    
    try {
      console.log(`🔄 Trying API ${i + 1}/${relevantApis.length}: ${endpoint.name}`);
      
      let response;
      const config = {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
          'Accept-Language': 'en-US,en;q=0.9',
          'Referer': 'https://www.google.com/',
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
      
      // Check if response has meaningful data (expanded checks for different platforms)
      if (response.data && (
        response.data.video_url || 
        response.data.download_url || 
        response.data.data || 
        response.data.aweme_list ||
        response.data.url ||
        response.data.links ||
        response.data.medias ||
        response.data.video ||
        response.data.downloadUrl ||
        response.data.success
      )) {
        return res.status(200).json({
          success: true,
          originalUrl: url,
          resolvedUrl: resolvedUrl,
          contentType: response.headers['content-type'],
          apiUsed: endpoint.name,
          data: response.data
        });
      } else {
        console.log(`⚠️ ${endpoint.name} returned empty or invalid data`);
        if (i === relevantApis.length - 1) {
          return res.status(200).json({
            success: true,
            originalUrl: url,
            resolvedUrl: resolvedUrl,
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
      
      if (i === relevantApis.length - 1) {
        return res.status(500).json({
          error: `All ${relevantApis.length} relevant API endpoints failed for ${platform} platform. Most recent error: ${statusCode || 'Network Error'} - ${errorMsg}. The video URL might be private, expired, or the APIs are temporarily down.`,
          success: false,
          platform: platform,
          originalUrl: url,
          resolvedUrl: resolvedUrl
        });
      }
    }
  }
}
