const { download } = require('./index');
async function fetchData() {
  try {
    const url = 'https://www.facebook.com/reel/476447884956946?mibextid=rS40aB7S9Ucbxw6v';
    const result = await download(url);
    console.log('Downloaded Data:', result.data);
    console.log('Content Type:', result.contentType);
  } catch (error) {
    console.error('Failed to download data:', error.message);
  }
}
fetchData();