
import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  // Resolve shortened URLs and normalize Facebook URLs
  async function resolveUrl(shortUrl) {
    try {
      // Handle TikTok shortened URLs
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
      
      // Normalize Facebook URLs
      if (shortUrl.includes('facebook.com/share/r/')) {
        // Convert share URLs to more compatible format
        const shareMatch = shortUrl.match(/facebook\.com\/share\/r\/([a-zA-Z0-9]+)/);
        if (shareMatch) {
          console.log(`🔗 Converting Facebook share URL: ${shortUrl}`);
          // This is a basic conversion - actual Facebook URLs are more complex
          return shortUrl;
        }
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
    if (url.includes('pinterest.com')) return 'pinterest';
    if (url.includes('snapchat.com')) return 'snapchat';
    if (url.includes('reddit.com')) return 'reddit';
    if (url.includes('linkedin.com')) return 'linkedin';
    if (url.includes('vimeo.com')) return 'vimeo';
    if (url.includes('twitch.tv')) return 'twitch';
    if (url.includes('dailymotion.com')) return 'dailymotion';
    return 'universal';
  }

  const platform = detectPlatform(resolvedUrl);
  console.log(`🎯 Detected platform: ${platform}`);

  // Try multiple API endpoints with different approaches
  const apiEndpoints = [
    // Universal downloaders (work with multiple platforms) - Primary tier
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
    // Facebook specific APIs
    {
      url: `https://www.noobs-api.rf.gd/download?url=${encodeURIComponent(resolvedUrl)}`,
      method: 'GET',
      name: 'Noobs API (Facebook)',
      platforms: ['facebook', 'universal']
    },
    // TikTok specific APIs - Enhanced
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
    // YouTube specific - Most reliable for YouTube
    {
      url: `https://www.youtube.com/oembed?url=${encodeURIComponent(resolvedUrl)}&format=json`,
      method: 'GET',
      name: 'YouTube oEmbed',
      platforms: ['youtube']
    },
    // Additional Facebook fallback
    {
      url: 'https://api.savefrom.net/getinfo',
      method: 'GET',
      name: 'SaveFrom.net',
      platforms: ['facebook', 'youtube', 'universal']
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
        // For GET requests with parameters, append URL if needed
        let requestUrl = endpoint.url;
        if (endpoint.data && endpoint.method === 'GET') {
          const params = new URLSearchParams(endpoint.data);
          requestUrl += (requestUrl.includes('?') ? '&' : '?') + params.toString();
        }
        response = await axios.get(requestUrl, config);
      }

      // Check if response is actually JSON
      const contentType = response.headers['content-type'] || '';
      if (!contentType.includes('application/json') && !contentType.includes('text/json')) {
        console.log(`⚠️ ${endpoint.name} returned non-JSON response: ${contentType}`);
        // Try to parse anyway in case the content-type header is wrong
        try {
          if (typeof response.data === 'string') {
            response.data = JSON.parse(response.data);
          }
        } catch (parseError) {
          console.log(`❌ ${endpoint.name} response is not valid JSON`);
          if (i === relevantApis.length - 1) {
            throw new Error('All APIs returned non-JSON responses');
          }
          continue;
        }
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
        response.data.success ||
        response.data.formats ||
        response.data.entries ||
        response.data.result ||
        response.data.download ||
        response.data.media ||
        (response.data.status && response.data.status === 'success') ||
        (Array.isArray(response.data) && response.data.length > 0)
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
      const errorData = error.response?.data;
      
      console.log(`❌ ${endpoint.name} failed: ${statusCode || 'Network Error'} - ${errorMsg}`);
      
      // If this is the last API and all failed, return detailed error info
      if (i === relevantApis.length - 1) {
        // Return 200 with error details instead of 500 to avoid frontend issues
        return res.status(200).json({
          success: false,
          error: `All ${relevantApis.length} relevant API endpoints failed for ${platform} platform.`,
          lastError: {
            api: endpoint.name,
            status: statusCode || 'Network Error',
            message: errorMsg,
            data: errorData
          },
          platform: platform,
          originalUrl: url,
          resolvedUrl: resolvedUrl,
          suggestions: [
            "The video might be private or age-restricted",
            "The video URL might have expired or been removed", 
            "Try using the direct video page URL instead of share links",
            "Some APIs may be temporarily down",
            "For Facebook, try copying the URL from the address bar while viewing the video"
          ],
          testedApis: relevantApis.map(api => api.name),
          troubleshooting: {
            facebook: "Facebook videos are often restricted. Try public posts only.",
            tiktok: "Use full tiktok.com URLs, not shortened vt.tiktok.com links",
            youtube: "Ensure the video is public and not age-restricted",
            instagram: "Instagram videos may require the post to be public"
          }
        });
      }
    }
  }
}
