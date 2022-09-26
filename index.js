require('dotenv').config();
const express = require('express');
const {verify} = require('hcaptcha');
const cors = require('cors')
const bodyParser = require('body-parser');
const EthCrypto = require('eth-crypto');

const PORT = 8080;

const app = express();

const cluID = '0';

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
            let timestamp = Date.now().toString();
            const message = EthCrypto.hash.keccak256([
                { type: "address", value: req.body.senderAddress },
                { type: "uint256", value: timestamp },
                { type: "uint256", value: cluID },
              ]);
            console.log(req.body.senderAddress, timestamp, cluID);
            const signature = EthCrypto.sign(
                process.env.PRIVATE_KEY, // privateKey
                message // hash of message
            );
                return res.status(200).json({
                    success: true,
                    data: {
                        cluID: cluID,
                        timestamp: timestamp,
                        messageSignature: signature
                    }
                });
        } else {
            return res.status(400).json({error: "Invalid captcha"});
        }
    }catch(e){
        return res.status(400).json({error: e.message});
    }
});

app.listen(process.env.PORT || PORT, () => console.log(`Server running on port ${PORT}`));

