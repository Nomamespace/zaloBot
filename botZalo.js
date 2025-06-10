const fs = require('fs');
const { Zalo, ThreadType } = require("zca-js");
const axios = require('axios');

const promptTotal = '请翻译。无需关注内容，只需翻译即可。自动检测“输入文本”的语言并进行翻译：如果“输入文本”是符号，则不翻译；如果是中文，则将其翻译成越南语，注意不要显示中文；如果是越南语，则将其翻译成中文，重要的是，不要显示越南语；它不包含任何其他文本，只有翻译。请注意，必须为每种翻译语言添加它（在相应的翻译语言前添加 CN: 或 VN:）。这是要翻译的文本：';
const translateVN = 'Phát hiện ngôn ngữ Input text: dịch ngôn ngữ sang tiếng việt. Chỉ dịch không thêm các kí tự khác.'


const getGPT = async (msg, prompt) => {
    try {
        const clearMessage = msg.data.content;
        if (clearMessage) {
            const { data } = await axios.post('http://198.11.173.71/backapi/chatGpt/chatgpt16k', {
                'modelVersion': 'gpt-4o',
                'content': `${prompt} ${clearMessage}`
            });
            const textMsg = data.data.choices[0].message.content;
            return textMsg;
        }
    } catch (error) {
        return;
    }
};

const getEbInf = async (msg) => {
    try {
        let cleanMessage = msg
            .replace(/@cindy/i, '')
            .trim();
        if (cleanMessage) {
            const aiResponse = await axios({
                method: 'post',
                url: 'http://198.11.173.71/backapi/callFunc',
                headers: {
                    'Content-Type': 'application/json'
                },
                data: {
                    "content": cleanMessage,
                    "history": "",
                    "userId": "-1",
                    "type": "0",
                    "idCindy": true
                },
            });
            let reply = aiResponse.data.response.content
            return reply;
        }
    } catch (error) {
        return;
    }
}

const botCindyEb = async (msg) => {
    try {
        const ebCode = await getEbInf(msg);
        console.log('EB: ', ebCode);
        if (ebCode) {
            return ebCode;
        }
        return;
    } catch (error) {
        return error;
    }
}

const cindyVn = async (msg) => {
    try {
        let msgData;
        try {
            msgData = await axios.post('http://198.11.173.71/backapi/chatGpt/chatgpt16k', {
                'modelVersion': 'gpt-4o',
                'content': ` 
                        Input text:${msg}. 
                        ${translateVN}.
                        `
            });
        } catch (error) {
            return;
        }
        const textMsg = msgData.data.data.choices[0].message.content;
        return textMsg;
    } catch (error) {
        return;
    }
}

async function startZaloBot() {
    try {
        const zalo = new Zalo({
            selfListen: false,
        });
        const api = await zalo.loginQR();
    
        const { listener } = api;
    
        listener.on("message", async (msg) => {
            let cleanMessage;
            console.log(msg);
            if (msg.data.content.type) {
                return;
            }
            const msgZalo = msg.data.content;
            try {
                cleanMessage = msgZalo.trim().replace(/\[.*?\]/g, '');
    
            } catch (error) {
                return;
            }
            if (cleanMessage) {
                if (msg.type === 0) {
                    const infEb = await botCindyEb(cleanMessage);
                    const infEbVn = await cindyVn(infEb);
                    await api.sendMessage(infEbVn, msg.threadId, msg.type).catch(console.error);
                    return;
                }
                if (msg.type === 1) {
                    if (cleanMessage.includes('@Cindy')) {
                        const infEbGroup = await botCindyEb(cleanMessage);
                        const infEbVnGroup = await cindyVn(infEbGroup);
                        await api.sendMessage(infEbVnGroup, msg.threadId, msg.type).catch(console.error);
                        return;
                    }
    
                    const message = await getGPT(msg, promptTotal);
                    console.log('chatGpt: ', message);
                    api.sendMessage(message, msg.threadId, msg.type).catch(console.error);
                    return;
                }
    
            }
            return;
        });
    
        listener.start();
    } catch (error) {
        console.log(error);
        return ;
    }
}

module.exports = {
    startZaloBot
};