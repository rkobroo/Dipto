
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
    {
      url: 'https://api.savefrom.net/info/',
      method: 'GET',
      name: 'SaveFrom.net (Universal)',
      data: {
        url: resolvedUrl,
        lang: 'en'
      },
      platforms: ['universal', 'youtube', 'facebook', 'instagram', 'tiktok', 'twitter']
    },
    {
      url: 'https://api.snapinsta.app/v1/video-downloader',
      method: 'POST',
      name: 'SnapInsta (Universal)',
      data: {
        url: resolvedUrl,
        quality: 'hd'
      },
      platforms: ['universal', 'instagram', 'facebook', 'youtube', 'tiktok', 'twitter']
    },
    {
      url: 'https://api.y2mate.com/convert',
      method: 'POST',  
      name: 'Y2Mate (Universal)',
      data: {
        url: resolvedUrl,
        format: 'mp4',
        quality: '720p'
      },
      platforms: ['universal', 'youtube', 'facebook', 'instagram', 'tiktok']
    },
    {
      url: 'https://api.downloadvideo.net/api/video',
      method: 'POST',
      name: 'DownloadVideo.net (Universal)',
      data: {
        url: resolvedUrl,
        format: 'mp4'
      }, 
      platforms: ['universal', 'youtube', 'facebook', 'instagram', 'tiktok', 'twitter']
    },
    {
      url: 'https://api.alltubedownload.net/download',
      method: 'POST',
      name: 'AllTube (Universal)',
      data: {
        url: resolvedUrl,
        format: "best"
      },
      platforms: ['universal', 'youtube', 'facebook', 'instagram', 'twitter']
    },
    {
      url: 'https://loader.to/api/button/',
      method: 'POST',
      name: 'Loader.to (Universal)',
      data: {
        url: resolvedUrl,
        f: "720",
        lang: "en"
      },
      platforms: ['universal', 'youtube', 'facebook', 'instagram']
    },
    {
      url: 'https://api.yt1s.com/api/button/mp4',
      method: 'POST',
      name: 'YT1S (Universal)',
      data: {
        url: resolvedUrl,
        f: '720'
      },
      platforms: ['universal', 'youtube', 'facebook', 'instagram', 'tiktok']
    },
    {
      url: 'https://api.downloadgram.org/media',
      method: 'POST',
      name: 'DownloadGram (Universal)',
      data: {
        url: resolvedUrl,
        type: 'video'
      },
      platforms: ['universal', 'instagram', 'facebook', 'youtube', 'tiktok']
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
    {
      url: 'https://www.tikwm.com/api/',
      method: 'POST',
      name: 'TikWM Alternative',
      data: {
        url: resolvedUrl,
        count: 12,
        cursor: 0,
        web: 1,
        hd: 1
      },
      platforms: ['tiktok']
    },
    {
      url: 'https://api.tiktokv.com/aweme/v1/multi/aweme/detail/',
      method: 'GET',
      name: 'TikTok API Direct',
      data: {
        aweme_ids: `[${extractTikTokId(resolvedUrl)}]`
      },
      platforms: ['tiktok']
    },
    {
      url: 'https://api.ssstik.io/abc',
      method: 'POST',
      name: 'SSSTik',
      data: {
        url: resolvedUrl,
        lang: 'en'
      },
      platforms: ['tiktok']
    },
    {
      url: 'https://musicaldown.com/download',
      method: 'POST', 
      name: 'MusicalDown',
      data: {
        url: resolvedUrl,
        hd: 1
      },
      platforms: ['tiktok']
    },

    // YouTube specific - Enhanced
    {
      url: 'https://youtube-dl-api-olive.vercel.app/api/download',
      method: 'POST',
      name: 'YouTube DL API',
      data: {
        url: resolvedUrl,
        quality: "720p"
      },
      platforms: ['youtube']
    },
    {
      url: 'https://api.youtubedl.org/api/info',
      method: 'GET',
      name: 'YouTubeDL.org',
      data: {
        url: resolvedUrl,
        format: 'best[height<=720]'
      },
      platforms: ['youtube']
    },
    {
      url: 'https://youtube-api-download.herokuapp.com/dl',
      method: 'POST',
      name: 'YouTube API Download',
      data: {
        url: resolvedUrl,
        format: 'mp4',
        quality: '720p'
      },
      platforms: ['youtube']
    },
    {
      url: 'https://api.ytdl.org/youtube/search',
      method: 'POST',
      name: 'YTDL API',
      data: {
        url: resolvedUrl,
        format: 'best'
      },
      platforms: ['youtube']
    },

    // Instagram specific - Enhanced  
    {
      url: 'https://instagram-downloader-download-instagram-videos-stories.p.rapidapi.com/index',
      method: 'GET',
      name: 'Instagram Downloader',
      headers: {
        'X-RapidAPI-Key': 'demo-key',
        'X-RapidAPI-Host': 'instagram-downloader-download-instagram-videos-stories.p.rapidapi.com'
      },
      platforms: ['instagram']
    },
    {
      url: 'https://api.instagram-downloader.com/media',
      method: 'POST',
      name: 'Instagram Downloader API',
      data: {
        url: resolvedUrl,
        type: 'video'
      },
      platforms: ['instagram']
    },
    {
      url: 'https://instasave.io/api/media',
      method: 'POST',
      name: 'InstaSave',
      data: {
        url: resolvedUrl,
        format: 'mp4'
      },
      platforms: ['instagram']
    },
    {
      url: 'https://api.saveinsta.app/download',
      method: 'POST',
      name: 'SaveInsta',
      data: {
        url: resolvedUrl,
        quality: 'hd'
      },
      platforms: ['instagram']
    },

    // Facebook specific - Enhanced
    {
      url: 'https://facebook-reel-and-video-downloader.p.rapidapi.com/app/main.php',
      method: 'GET',
      name: 'Facebook Downloader',
      headers: {
        'X-RapidAPI-Key': 'demo-key',
        'X-RapidAPI-Host': 'facebook-reel-and-video-downloader.p.rapidapi.com'
      },
      platforms: ['facebook']
    },
    {
      url: 'https://api.fbdown.net/download',
      method: 'POST',
      name: 'FBDown',
      data: {
        url: resolvedUrl,
        quality: 'hd'
      },
      platforms: ['facebook']
    },
    {
      url: 'https://getfvid.com/downloader',
      method: 'POST',
      name: 'GetFVid',
      data: {
        url: resolvedUrl,
        format: 'mp4'
      },
      platforms: ['facebook']
    },
    {
      url: 'https://api.savefb.net/download-video',
      method: 'POST',
      name: 'SaveFB',
      data: {
        url: resolvedUrl,
        type: 'video'
      },
      platforms: ['facebook']
    },

    // Twitter/X specific - Enhanced
    {
      url: 'https://api.twittervideodownloader.com/download',
      method: 'POST',
      name: 'Twitter Video Downloader',
      data: {
        url: resolvedUrl,
        quality: 'best'
      },
      platforms: ['twitter']
    },
    {
      url: 'https://twitsave.com/api/download',
      method: 'POST',
      name: 'TwitSave',
      data: {
        url: resolvedUrl,
        format: 'mp4'
      },
      platforms: ['twitter']
    },
    {
      url: 'https://api.twittervid.com/download',
      method: 'POST',
      name: 'TwitterVid',
      data: {
        url: resolvedUrl,
        type: 'video'
      },
      platforms: ['twitter']
    },

    // Pinterest specific - New
    {
      url: 'https://api.pinterestdownloader.com/download',
      method: 'POST',
      name: 'Pinterest Downloader',
      data: {
        url: resolvedUrl,
        format: 'mp4'
      },
      platforms: ['pinterest']
    },

    // Snapchat specific - New
    {
      url: 'https://api.snapchatdownloader.com/download',
      method: 'POST',
      name: 'Snapchat Downloader',
      data: {
        url: resolvedUrl,
        quality: 'original'
      },
      platforms: ['snapchat']
    },

    // Reddit specific - New
    {
      url: 'https://api.redditvideo.download/download',
      method: 'POST',
      name: 'Reddit Video Downloader',
      data: {
        url: resolvedUrl,
        format: 'mp4'
      },
      platforms: ['reddit']
    },

    // LinkedIn specific - New
    {
      url: 'https://api.linkedindownloader.com/video',
      method: 'POST',
      name: 'LinkedIn Downloader',
      data: {
        url: resolvedUrl,
        quality: 'hd'
      },
      platforms: ['linkedin']
    },

    // Vimeo specific - New
    {
      url: 'https://api.vimeodownloader.com/download',
      method: 'POST',
      name: 'Vimeo Downloader',
      data: {
        url: resolvedUrl,
        format: 'mp4',
        quality: '720p'
      },
      platforms: ['vimeo']
    },

    // Twitch specific - New
    {
      url: 'https://api.twitchdownloader.com/download',
      method: 'POST',
      name: 'Twitch Downloader',
      data: {
        url: resolvedUrl,
        format: 'mp4'
      },
      platforms: ['twitch']
    },

    // Dailymotion specific - New
    {
      url: 'https://api.dailymotiondownloader.com/download',
      method: 'POST',
      name: 'Dailymotion Downloader',
      data: {
        url: resolvedUrl,
        quality: '720p'
      },
      platforms: ['dailymotion']
    },

    // New APIs from recommended websites
    {
      url: 'https://api.allinonedownloader.com/download',
      method: 'POST',
      name: 'AllInOneDownloader',
      data: {
        url: resolvedUrl,
        format: 'mp4',
        quality: 'best'
      },
      platforms: ['universal', 'youtube', 'facebook', 'instagram', 'tiktok', 'twitter']
    },
    {
      url: 'https://api.publer.com/v1/video/download',
      method: 'POST',
      name: 'Publer API',
      data: {
        url: resolvedUrl,
        type: 'video'
      },
      platforms: ['universal', 'facebook', 'instagram', 'youtube', 'twitter', 'linkedin']
    },
    {
      url: 'https://ssvid.net/api/download',
      method: 'POST',
      name: 'SSvid.net',
      data: {
        url: resolvedUrl,
        format: 'mp4',
        quality: 'hd'
      },
      platforms: ['universal', 'youtube', 'facebook', 'instagram', 'tiktok']
    },
    {
      url: 'https://www.duplichecker.com/api/video-downloader',
      method: 'POST',
      name: 'DupliChecker Video Downloader',
      data: {
        url: resolvedUrl,
        download_type: 'video'
      },
      platforms: ['universal', 'youtube', 'facebook', 'instagram', 'tiktok', 'twitter']
    },
    {
      url: 'https://retatube.com/api/download',
      method: 'POST',
      name: 'RetaTube',
      data: {
        url: resolvedUrl,
        format: 'mp4',
        quality: '720p'
      },
      platforms: ['universal', 'youtube', 'facebook', 'instagram', 'tiktok']
    },

    // Generic/Fallback APIs - Enhanced
    {
      url: `https://api.vevioz.com/api/button/fetch?url=${encodeURIComponent(resolvedUrl)}`,
      method: 'GET',
      name: 'Vevioz API',
      platforms: ['universal']
    },
    {
      url: 'https://api.9xbuddy.com/download',
      method: 'POST',
      name: '9xBuddy',
      data: {
        url: resolvedUrl,
        format: 'mp4'
      },
      platforms: ['universal']
    },
    {
      url: 'https://api.keepvid.com/download',
      method: 'POST',
      name: 'KeepVid',
      data: {
        url: resolvedUrl,
        quality: 'best'
      },
      platforms: ['universal']
    },
    {
      url: 'https://api.videodownloader.so/api/video',
      method: 'POST',
      name: 'VideoDownloader.so',
      data: {
        url: resolvedUrl,
        format: 'mp4'
      },
      platforms: ['universal']
    },
    {
      url: 'https://api.savemp4.red/download',
      method: 'POST',
      name: 'SaveMP4',
      data: {
        url: resolvedUrl,
        quality: 'hd'
      },
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
        // For GET requests with parameters, append URL if needed
        let requestUrl = endpoint.url;
        if (endpoint.data && endpoint.method === 'GET') {
          const params = new URLSearchParams(endpoint.data);
          requestUrl += (requestUrl.includes('?') ? '&' : '?') + params.toString();
        }
        response = await axios.get(requestUrl, config);
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
      
      console.log(`❌ ${endpoint.name} failed: ${statusCode || 'Network Error'} - ${errorMsg}`);
      
      if (i === relevantApis.length - 1) {
        return res.status(500).json({
          error: `All ${relevantApis.length} relevant API endpoints failed for ${platform} platform. Most recent error: ${statusCode || 'Network Error'} - ${errorMsg}`,
          success: false,
          platform: platform,
          originalUrl: url,
          resolvedUrl: resolvedUrl,
          suggestions: [
            "The video might be private or age-restricted",
            "The video URL might have expired", 
            "Try using a different platform's URL format",
            "Some APIs may be temporarily down",
            "For TikTok, try using the full tiktok.com URL instead of shortened links"
          ],
          testedApis: relevantApis.map(api => api.name)
        });
      }
    }
  }
}
