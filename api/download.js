import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  // Resolve shortened URLs
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
    return 'unsupported';
  }

  const platform = detectPlatform(resolvedUrl);
  console.log(`🎯 Detected platform: ${platform}`);

  // Platform-specific API endpoints
  let apiEndpoints = [];

  if (platform === 'tiktok') {
    apiEndpoints = [
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
      {
        url: 'https://api.cobalt.tools/api/json',
        method: 'POST',
        name: 'Cobalt (TikTok)',
        data: {
          url: resolvedUrl,
          vCodec: "h264",
          vQuality: "720",
          aFormat: "mp3",
          isAudioOnly: false
        },
        platforms: ['tiktok']
      }
    ];
  } else if (platform === 'facebook' || platform === 'instagram') {
    apiEndpoints = [
      {
        url: 'https://api.cobalt.tools/api/json',
        method: 'POST',
        name: 'Cobalt (FB/IG)',
        data: {
          url: resolvedUrl,
          vCodec: "h264",
          vQuality: "720",
          aFormat: "mp3",
          isAudioOnly: false
        },
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        platforms: ['facebook', 'instagram']
      },
      {
        url: 'https://snapsave.app/action.php',
        method: 'POST',
        name: 'SnapSave',
        data: {
          url: resolvedUrl,
          action: 'get_data'
        },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'X-Requested-With': 'XMLHttpRequest',
          'Referer': 'https://snapsave.app/'
        },
        platforms: ['facebook', 'instagram']
      },
      {
        url: 'https://api.savefrom.net/ajax',
        method: 'POST',
        name: 'SaveFrom',
        data: {
          url: resolvedUrl,
          quality: 'max'
        },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Referer': 'https://savefrom.net/',
          'X-Requested-With': 'XMLHttpRequest'
        },
        platforms: ['facebook', 'instagram']
      },
      {
        url: 'https://www.downloadvideosfrom.com/wp-json/aio-dl/video-data',
        method: 'POST',
        name: 'DownloadVideosFrom',
        data: {
          url: resolvedUrl,
          token: 'aio-dl'
        },
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Referer': 'https://www.downloadvideosfrom.com/'
        },
        platforms: ['facebook', 'instagram']
      },
      {
        url: 'https://fdown.net/download',
        method: 'POST',
        name: 'FDown',
        data: {
          URLz: resolvedUrl
        },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Referer': 'https://fdown.net/',
          'Origin': 'https://fdown.net'
        },
        platforms: ['facebook', 'instagram']
      }
    ];
  } else if (platform === 'youtube') {
    apiEndpoints = [
      {
        url: 'https://www.ssyoutube.com/api/convert',
        method: 'POST',
        name: 'SSYouTube',
        data: {
          url: resolvedUrl,
          format: 'mp4',
          quality: 'best'
        },
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Referer': 'https://www.ssyoutube.com/',
          'Origin': 'https://www.ssyoutube.com'
        },
        platforms: ['youtube']
      },
      {
        url: `https://www.y2mate.com/mates/en/analyze/ajax`,
        method: 'POST',
        name: 'Y2Mate',
        data: {
          url: resolvedUrl,
          q_auto: 1,
          ajax: 1
        },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'X-Requested-With': 'XMLHttpRequest',
          'Referer': 'https://www.y2mate.com/'
        },
        platforms: ['youtube']
      }
    ];
  } else if (platform === 'twitter') {
    apiEndpoints = [
      {
        url: 'https://api.cobalt.tools/api/json',
        method: 'POST',
        name: 'Cobalt (Twitter)',
        data: {
          url: resolvedUrl,
          vCodec: "h264",
          vQuality: "720",
          aFormat: "mp3",
          isAudioOnly: false
        },
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        platforms: ['twitter']
      },
      {
        url: 'https://twitsave.com/info',
        method: 'POST',
        name: 'TwitSave',
        data: {
          url: resolvedUrl
        },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Referer': 'https://twitsave.com/',
          'Origin': 'https://twitsave.com'
        },
        platforms: ['twitter']
      },
      {
        url: 'https://ssstwitter.com/en',
        method: 'POST',
        name: 'SSSTwitter',
        data: {
          id: resolvedUrl,
          locale: 'en',
          tt: ''
        },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Referer': 'https://ssstwitter.com/',
          'X-Requested-With': 'XMLHttpRequest'
        },
        platforms: ['twitter']
      }
    ];
  } else {
    return res.status(200).json({
      success: false,
      error: `Platform not supported. Only TikTok, Facebook, Instagram, YouTube, and Twitter/X are supported.`,
      platform: platform,
      originalUrl: url,
      resolvedUrl: resolvedUrl,
      supportedPlatforms: ['TikTok', 'Facebook', 'Instagram', 'YouTube', 'Twitter/X']
    });
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
          'Accept': 'application/json, text/html, */*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Referer': 'https://www.google.com/',
          ...endpoint.headers
        }
      };

      if (endpoint.method === 'POST') {
        if (endpoint.name === 'SnapSave') {
          // SnapSave expects form data
          const formData = new URLSearchParams();
          formData.append('url', resolvedUrl);
          formData.append('action', 'get_data');

          response = await axios.post(endpoint.url, formData, config);
        } else if (endpoint.name === 'Y2Mate') {
          // Y2Mate expects form data
          const formData = new URLSearchParams();
          formData.append('url', resolvedUrl);
          formData.append('q_auto', '1');
          formData.append('ajax', '1');

          response = await axios.post(endpoint.url, formData, config);
        } else if (endpoint.name === 'SaveFrom') {
          // SaveFrom expects form data
          const formData = new URLSearchParams();
          formData.append('url', resolvedUrl);
          formData.append('quality', 'max');

          response = await axios.post(endpoint.url, formData, config);
        } else if (endpoint.name === 'FDown') {
          // FDown expects form data
          const formData = new URLSearchParams();
          formData.append('URLz', resolvedUrl);

          response = await axios.post(endpoint.url, formData, config);
        } else if (endpoint.name === 'TwitSave') {
          // TwitSave expects form data
          const formData = new URLSearchParams();
          formData.append('url', resolvedUrl);

          response = await axios.post(endpoint.url, formData, config);
        } else if (endpoint.name === 'SSSTwitter') {
          // SSSTwitter expects form data
          const formData = new URLSearchParams();
          formData.append('id', resolvedUrl);
          formData.append('locale', 'en');
          formData.append('tt', '');

          response = await axios.post(endpoint.url, formData, config);
        } else {
          // Other APIs expect JSON
          config.headers['Content-Type'] = 'application/json';
          response = await axios.post(endpoint.url, endpoint.data, config);
        }
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
        response.data.url ||
        response.data.links ||
        response.data.medias ||
        response.data.video ||
        response.data.downloadUrl ||
        response.data.success ||
        response.data.formats ||
        response.data.result ||
        response.data.download ||
        response.data.media ||
        (response.data.status && response.data.status === 'success') ||
        (Array.isArray(response.data) && response.data.length > 0) ||
        (typeof response.data === 'string' && response.data.includes('download'))
      )) {
        return res.status(200).json({
          success: true,
          originalUrl: url,
          resolvedUrl: resolvedUrl,
          platform: platform,
          contentType: response.headers['content-type'],
          apiUsed: endpoint.name,
          data: response.data
        });
      } else {
        console.log(`⚠️ ${endpoint.name} returned empty or invalid data`);
        if (i === apiEndpoints.length - 1) {
          return res.status(200).json({
            success: true,
            originalUrl: url,
            resolvedUrl: resolvedUrl,
            platform: platform,
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
      if (i === apiEndpoints.length - 1) {
        return res.status(200).json({
          success: false,
          error: `All ${apiEndpoints.length} API endpoints failed for ${platform} platform.`,
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
            "Some APIs may be temporarily down"
          ],
          testedApis: apiEndpoints.map(api => api.name),
          troubleshooting: {
            facebook: "Facebook videos are often restricted. Try public posts only.",
            tiktok: "Use full tiktok.com URLs, not shortened vt.tiktok.com links",
            instagram: "Instagram videos may require the post to be public",
            youtube: "Use full YouTube URLs. Age-restricted or private videos may not work.",
            twitter: "Use full Twitter/X URLs. Protected tweets and accounts may not work."
          }
        });
      }
    }
  }
                     }
