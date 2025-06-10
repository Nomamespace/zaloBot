const express = require('express');
const fs = require('fs');
// const { startBotWechat } = require('./botwechat');
const {startZaloBot} = require('./botZalo');


const app = express();
const PORT = 3000;

// startBotWechat();
startZaloBot();


app.get('/', (req, res) => {
    res.send('Server và WechatFerry đang chạy!');
});

app.listen(PORT, () => {
    console.log(
        '===>  App is running at http://localhost:%d in %s mode',
        app.get('port'),
        app.get('env')
    );
    console.log('  Press CTRL-C to stop\n');
});


