---
# noobs-api(1.0.4)
-
## Description
The `noobs-api` npm package allows you to download data from a specified URL using the NOBS API.

## Installation

To use `noobs-api`, install it via npm:

```bash
npm install noobs-api
```

## Usage

Import the package in your Node.js application:

```javascript
const { download } = require('noobs-api');
```

### `download(url)`

Asynchronously fetches data from a given URL using the NOOBS API.

#### Parameters

- `url` (string): The URL from which to download data.

#### Returns

A promise that resolves to an object containing:
- `data` (any): The downloaded data.
- `contentType` (string): The content type of the downloaded data.

#### Example

```javascript
const { download } = require('noobs-api');

async function fetchData() {
  try {
    const url = 'https://example.com/some-data.json';
    const result = await download(url);
    console.log('Downloaded Data:', result.data);
    console.log('Content Type:', result.contentType);
  } catch (error) {
    console.error('Failed to download data:', error.message);
  }
}

fetchData();
```

Replace `'https://example.com/some-data.json'` with the actual URL you want to fetch data from.

---

This `README.md` file provides concise instructions on how to install and use the `noobs-api` package, focusing on the `download` function. Users can easily understand how to integrate this package into their Node.js applications by following these examples and explanations.
