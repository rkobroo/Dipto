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
        name: 'TiklyDown'
      },
      {
        url: 'https://tikwm.com/api/',
        method: 'POST',
        name: 'TikWM',
        data: {
          url: resolvedUrl,
          hd: 1
        }
      },
      {
        url: 'https://api.cobalt.tools/api/json',
        method: 'POST',
        name: 'Cobalt',
        data: {
          url: resolvedUrl,
          vCodec: "h264",
          vQuality: "720",
          aFormat: "mp3",
          isAudioOnly: false
        }
      }
    ];
  } else if (platform === 'facebook' || platform === 'instagram') {
    apiEndpoints = [
      {
        url: 'https://api.cobalt.tools/api/json',
        method: 'POST',
        name: 'Cobalt',
        data: {
          url: resolvedUrl,
          vCodec: "h264",
          vQuality: "720",
          aFormat: "mp3",
          isAudioOnly: false
        }
      },
      {
        url: 'https://snapsave.app/action.php',
        method: 'POST',
        name: 'SnapSave',
        isFormData: true,
        data: {
          url: resolvedUrl,
          action: 'get_data'
        }
      },
      {
        url: 'https://fdown.net/download',
        method: 'POST',
        name: 'FDown',
        isFormData: true,
        data: {
          URLz: resolvedUrl
        }
      }
    ];
  } else if (platform === 'youtube') {
    apiEndpoints = [
      {
        url: 'https://api.cobalt.tools/api/json',
        method: 'POST',
        name: 'Cobalt',
        data: {
          url: resolvedUrl,
          vCodec: "h264",
          vQuality: "720",
          aFormat: "mp3",
          isAudioOnly: false
        }
      },
      {
        url: 'https://y2mate.nu/api/convert',
        method: 'POST',
        name: 'Y2Mate',
        isFormData: true,
        data: {
          url: resolvedUrl,
          format: 'mp4',
          quality: 'best'
        }
      }
    ];
  } else if (platform === 'twitter') {
    apiEndpoints = [
      {
        url: 'https://api.cobalt.tools/api/json',
        method: 'POST',
        name: 'Cobalt',
        data: {
          url: resolvedUrl,
          vCodec: "h264",
          vQuality: "720",
          aFormat: "mp3",
          isAudioOnly: false
        }
      },
      {
        url: 'https://ssstwitter.com/api',
        method: 'POST',
        name: 'SSSTwitter',
        isFormData: true,
        data: {
          id: resolvedUrl,
          locale: 'en'
        }
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
        timeout: 20000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': '*/*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Sec-Fetch-Dest': 'empty',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'cross-site'
        }
      };

      if (endpoint.method === 'POST') {
        if (endpoint.isFormData) {
          // Use form data for specific APIs
          const formData = new URLSearchParams();
          Object.keys(endpoint.data).forEach(key => {
            formData.append(key, endpoint.data[key]);
          });

          config.headers['Content-Type'] = 'application/x-www-form-urlencoded';

          if (endpoint.name === 'SnapSave') {
            config.headers['Referer'] = 'https://snapsave.app/';
            config.headers['Origin'] = 'https://snapsave.app';
          } else if (endpoint.name === 'FDown') {
            config.headers['Referer'] = 'https://fdown.net/';
            config.headers['Origin'] = 'https://fdown.net';
          } else if (endpoint.name === 'SSSTwitter') {
            config.headers['Referer'] = 'https://ssstwitter.com/';
            config.headers['Origin'] = 'https://ssstwitter.com';
          }

          response = await axios.post(endpoint.url, formData, config);
        } else {
          // Use JSON for APIs like Cobalt, TikWM
          config.headers['Content-Type'] = 'application/json';
          response = await axios.post(endpoint.url, endpoint.data, config);
        }
      } else {
        response = await axios.get(endpoint.url, config);
      }

      console.log(`✅ ${endpoint.name} API responded with status: ${response.status}`);

      // Check if response has meaningful data
      const hasValidData = response.data && (
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
        response.data.title ||
        response.data.thumbnail ||
        response.data.duration ||
        response.data.uploader ||
        response.data.webpage_url ||
        response.data.requested_downloads ||
        response.data.play ||
        response.data.wmplay ||
        response.data.hdplay ||
        (response.data.status && (response.data.status === 'success' || response.data.status === 'stream')) ||
        (Array.isArray(response.data) && response.data.length > 0) ||
        (typeof response.data === 'string' && (response.data.includes('download') || response.data.includes('http')))
      );

      if (hasValidData) {
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
        console.log(`⚠️ ${endpoint.name} returned response but no valid download data found`);

        // If this is the last API, still return the response for debugging
        if (i === apiEndpoints.length - 1) {
          return res.status(200).json({
            success: false,
            originalUrl: url,
            resolvedUrl: resolvedUrl,
            platform: platform,
            contentType: response.headers['content-type'],
            apiUsed: endpoint.name,
            data: response.data,
            warning: 'API responded but no download links found in response'
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
            "The video might be private, age-restricted, or deleted",
            "Try using the direct video page URL instead of share links",
            "Some platforms have anti-bot measures that may block API requests",
            "The video URL might have expired or been modified"
          ],
          testedApis: apiEndpoints.map(api => api.name),
          troubleshooting: {
            tiktok: "Use full tiktok.com URLs. Private accounts or deleted videos won't work.",
            facebook: "Facebook videos must be public. Private posts and pages are often blocked.",
            instagram: "Instagram videos must be from public accounts. Stories and private posts won't work.",
            youtube: "Use full YouTube URLs. Age-restricted, private, or region-blocked videos may fail.",
            twitter: "Use full Twitter/X URLs. Protected accounts and deleted tweets won't work."
          }
        });
      }
    }
  }
}
