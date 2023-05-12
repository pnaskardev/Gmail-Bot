const { google } = require('googleapis');
const base64url = require('base64url');

const now = new Date();
// 1 hour in milliseconds
const oneHourAgo = new Date(now.getTime() - 3600000); 