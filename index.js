const express=require('express');
const path = require('path');
const process = require('process');
const { authenticate } = require('@google-cloud/local-auth');
const { google } = require('googleapis');


const { loadSavedCredentialsIfExist, saveCredentials } = require('./utils/auth_utils.js');
const {getRandomInterval}=require('./utils/utils.js');
const SCOPES = ['https://www.googleapis.com/auth/gmail.modify'];
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');




const app=express();


/**
 * Load or request or authorization to call APIs.
 *
 */
async function authorize() {
    let client = await loadSavedCredentialsIfExist();
    if (client) {
      return client;
    }
    client = await authenticate({
      scopes: SCOPES,
      keyfilePath: CREDENTIALS_PATH,
    });
    if (client.credentials) {
      await saveCredentials(client);
    }
    return client;
  }
  
  
  /**
   * Lists the labels in the user's account.
   *
   * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
   */
  async function listLabels(auth) {
    const gmail = google.gmail({ version: 'v1', auth });
    const res = await gmail.users.labels.list({
      userId: 'me',
    });
    const labels = res.data.labels;
    if (!labels || labels.length === 0) {
      console.log('No labels found.');
      return;
    }
    console.log('Labels:');
    labels.forEach((label) => {
      console.log(`- ${label.name}`);
    });
  }


function executeFunction() 
{
    authorize()
      .then((auth) => processNewEmails(auth).then(listLabels(auth)))
      .catch(console.error);
}

app.use('/',(req,res,next)=>
{
  res.send('GMAIL Bot up and running');
});



app.listen(3000,()=>
{
    console.log('Server is running');
    setInterval(executeFunction, getRandomInterval);
})