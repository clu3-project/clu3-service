require('dotenv').config();
const express = require('express');
const {verify} = require('hcaptcha');
const cors = require('cors')
const bodyParser = require('body-parser');
const { ethers } = require("ethers");


const PORT = 8080;

const app = express();

const cluID = '0';

let wallet = new ethers.Wallet(process.env.PRIVATE_KEY);


if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
  }

function logger(req, res, next) {
  console.log('Request received');
  next();
}

app.use(logger);
app.use(bodyParser.json())
app.use(cors())

app.post('/verify', async (req, res) => {

    if(!req.body.token) {
        return res.status(400).json({error: 'No token provided'});
    }

    try{
        const {success} = await verify(process.env.hcaptchaSecret, req.body.token);

        if(success) {
            let signedMessage = await wallet.signMessage(req.body.senderAddress+'-'+req.body.timeStamp+'-'+ cluID);
                return res.status(200).json({
                    success: true,
                    data: {
                        cluID: cluID,
                        timeStamp: req.body.timeStamp,
                        signedMessage: signedMessage
                    }
                });
        } else {
            return res.status(400).json({error: "Invalid captcha"});
        }
    }catch(e){
        return res.status(400).json({error: e.message});
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

