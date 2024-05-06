// index.js
require('dotenv').config();
const { Livepeer } = require('livepeer');
const tus = require('tus-js-client');
const fs = require('fs');
const path = require('path');

const apiKey = process.env.LIVEPEER_API_KEY;
const fileName = process.env.FILE_NAME;

if (!apiKey || !fileName) {
  console.error('Please ensure LIVEPEER_API_KEY and FILE_NAME are set in your .env file');
  process.exit(1);
}

const filePath = path.join(__dirname, fileName);
const file = fs.createReadStream(filePath);
const fileSize = fs.statSync(filePath).size;

const livepeer = new Livepeer({ apiKey });

const assetData = {
  name: fileName,
};

livepeer
  .asset.create(assetData)
  .then((response) => {
    console.log('Asset upload request:', response);
    const { tusEndpoint } = response.data;

    if (!tusEndpoint) {
      console.error('Error: TUS endpoint not found in the asset upload response');
      return;
    }

    const upload = new tus.Upload(file, {
      endpoint: tusEndpoint,
      metadata: {
        filename: fileName,
        filetype: 'video/mp4',
      },
      uploadSize: fileSize,
      onError: (error) => {
        console.error('Error uploading via tus:', error);
      },
      onProgress: (bytesUploaded, bytesTotal) => {
        const percentage = ((bytesUploaded / bytesTotal) * 100).toFixed(2);
        console.log(`Uploaded ${bytesUploaded} of ${bytesTotal} bytes (${percentage}%)`);
      },
      onSuccess: () => {
        console.log('Upload finished:', upload.url);
      },
    });

    upload.start();
  })
  .catch((error) => {
    console.error('Error requesting asset upload:', error);
  });
