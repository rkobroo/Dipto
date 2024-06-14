const axios = require('axios');

const download = async (url) => {
  if (!url) {
    throw new Error('URL is required');
  }

  try {
    const response = await axios.get(`https://nobs-api.onrender.com/dipto/alldl?url=${encodeURIComponent(url)}`);
    return {
      data: response.data,
      contentType: response.headers['content-type']
    };
  } catch (error) {
    throw new Error('Failed to fetch data from NOBS API');
  }
};

module.exports = { download };