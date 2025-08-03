
import { download } from './index.js';

async function testTikTokVideo() {
  try {
    // Test with TikTok URL
    const tiktokUrl = 'https://vt.tiktok.com/ZSB3dx7rq/';
    console.log('Testing TikTok URL...');
    console.log('URL:', tiktokUrl);
    console.log('---');
    
    const result = await download(tiktokUrl);
    
    console.log('✅ API Response received!');
    console.log('Content Type:', result.contentType);
    console.log('API Used:', result.apiUsed || 'Unknown');
    console.log('---');
    console.log('Full API Response:');
    console.log(JSON.stringify(result.data, null, 2));
    console.log('---');
    
    // Check for common video response fields
    if (result.data) {
      console.log('Response Analysis:');
      if (result.data.video_url) {
        console.log('- Video URL found:', result.data.video_url);
      }
      if (result.data.download_url) {
        console.log('- Download URL found:', result.data.download_url);
      }
      if (result.data.title) {
        console.log('- Title:', result.data.title);
      }
      if (result.data.author) {
        console.log('- Author:', result.data.author);
      }
      if (result.data.duration) {
        console.log('- Duration:', result.data.duration);
      }
    }
    
  } catch (error) {
    console.error('❌ Failed to process TikTok URL:', error.message);
    console.error('Full error:', error);
  }
}

// Example with other platforms
async function testMultiplePlatforms() {
  const urls = [
    'https://www.facebook.com/reel/476447884956946?mibextid=rS40aB7S9Ucbxw6v',
    // Add more URLs here for testing
  ];
  
  for (const url of urls) {
    console.log(`\nTesting: ${url}`);
    try {
      const result = await download(url);
      console.log('✅ Success:', result.data ? 'Data received' : 'No data');
    } catch (error) {
      console.log('❌ Error:', error.message);
    }
  }
}

// Run the TikTok test
testTikTokVideo();
