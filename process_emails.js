const { google } = require('googleapis');
const base64url = require('base64url');

const now = new Date();
// 1 hour in milliseconds
const oneHourAgo = new Date(now.getTime() - 3600000); 


async function processNewEmails(auth) 
{
    const gmail = google.gmail({ version: 'v1', auth });

    // Get all messages from inbox with `is:unread` filter
    const res = await gmail.users.messages.list({ 
        userId: 'me', 
        q: `is:unread after:${oneHourAgo.toISOString().split('T')[0]}`, 
        labelIds: ['UNREAD', 'CATEGORY_PERSONAL'], 
    });
    if(res.data["resultSizeEstimate"]===0)
    {
        console.log('No mails have been found');
        return;
    }
    // For each message
    for (let i = 0; i < res.data.messages.length; i++) {
        const message = res.data.messages[i];
        const messageId = message.id;

        // Get the thread ID for the message
        const messageData = await gmail.users.messages.get({ userId: 'me', id: messageId });
        const threadId = messageData.data.threadId;

        // Check if the "From" header contains "noreply || donotreply"
        const fromHeader = messageData.data.payload.headers.find(h => h.name === 'From').value;
        if (fromHeader.includes('noreply') || fromHeader.includes('donotreply')) {
            console.log(`Skipping message from "${fromHeader}".`);
            continue;
        }

        // Check if the thread has any messages sent by the authenticated user
        const threadData = await gmail.users.threads.get({ userId: 'me', id: threadId });
        const messagesInThread = threadData.data.messages;
        let hasSentMessage = false;
        for (let j = 0; j < messagesInThread.length; j++) {
            const messageInThread = messagesInThread[j];
            if (messageInThread.payload.headers.find(h => h.name === 'From' && h.value === 'me')) {
                hasSentMessage = true;
                break;
            }
        }


        // If the thread doesn't have any messages sent by the authenticated user, send a reply
        if (!hasSentMessage) 
        {
                // Create the reply email
                const replySubject = `${messageData.data.payload.headers.find(h => h.name === 'Subject').value}`;
                const replyTo = messageData.data.payload.headers.find(h => h.name === 'Reply-To' || h.name === 'From').value;
                const emailBody = `[THIS IS AN AUTOREPLY] Thanks for your email. I am on a vacation right now I will get back to you as soon as possible.`;
                // const email = `From: "Priyanshu Naskar" priyanshunaskar89@gmail.com\r\n` +
                //     `To: ${replyTo}\r\n` +
                //     `Subject: ${replySubject}\r\n` +
                //     `\r\n` +
                //     `${emailBody}`;
                const email = `From: "Priyanshu Naskar" priyanshunaskar89@gmail.com\r\n` +
                        `To: ${replyTo}\r\n` +
                        `In-Reply-To: ${messageId}\r\n` +
                        `References: ${messageId}\r\n` +
                        `Subject: ${replySubject}\r\n` +
                        `\r\n` +
                        `${emailBody}`;

                // Send the reply email
                const res = await gmail.users.messages.send
                ({ 
                    userId: 'me',
                    requestBody: 
                    { 
                        raw: base64url.encode(email),
                        threadId:threadId,  
                    } 
                });


            // Add a label to the email
            const labelName = 'vacation-reply';
            const labelsRes = await gmail.users.labels.list({ userId: 'me' });
            const label = labelsRes.data.labels.find(l => l.name === labelName);
            const labelId = label ? label.id : (await gmail.users.labels.create({ userId: 'me', requestBody: { name: labelName } })).data.id;
            await gmail.users.messages.modify({ userId: 'me', id: messageId, requestBody: { addLabelIds: [labelId] } });

            console.log(`Sent a vacation reply to "${messageData.data.payload.headers.find(h => h.name === 'From').value}".`);
        }
    }
}

module.exports = { processNewEmails };