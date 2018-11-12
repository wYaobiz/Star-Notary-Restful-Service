# Private Blockchain Notary Service

Notarizing ownership of digital assets by building a Star Registry

## Project Overview
Data stored on a blockchain can vary from digital assets (e.g. documents, media) to copyrights and patent ownership. These pieces of data need to be reliably secured, and we require a way to prove they exist — this is where signing and validation are key. In this project you will build a private blockchain notary service to validate and provide proof of existence for your favorite star in the universe.

The goal is to allow users to notarize star ownership using their blockchain identity:

| Feature | Description |
| ------- | ----------- |
| Notarize | Users will be able to notarize star ownership using their blockchain identity. |
| Verify Wallet Address | This will provide a message to users allowing them to verify their wallet address with a message signature. |
| Register a Star |	Once a user verifies their wallet address, they have the right to register the star. |
| Share a Story | Once registered, each star has the ability to share a story. |
| Star Lookup | Users will be able to look up their star by hash, block height, or wallet address. |

### Requirements
* Node
* Node Package Manager (npm)

### Install & Run
```bash
$ npm install
```
After installing please run app in terminal:
```bash
$ node app.js
```

### Code Organization 
```console
├── app.js
├── db
│   └── levelSandbox.js
├── domain
│   └── block.js
│   └── messageQueue.js
│   └── simpleChain.js
│   └── star.js
├── routes
│   └── blocks.js
│   └── routes.js
│   └── stars.js
│   └── validation.js
└── services
    ├── star.js
    └── validation.js

4 directories, 12 files
```


## Functionality and Testing

#### 1. Blockchain ID Validation Routine

>**Validating User Request**
```bash
curl -X "POST" "http://localhost:8000/requestValidation" \
     -H 'Content-Type: application/json; charset=utf-8' \
     -d $'{
  "address": "1DSY2Wzjt2uRqJAjfFzBhJhkkFCVQJrELZ"
  }'
```
>Response
```JSON
{
    "address": "1DSY2Wzjt2uRqJAjfFzBhJhkkFCVQJrELZ",
    "requestTimeStamp": "1541985782",
    "message": "1DSY2Wzjt2uRqJAjfFzBhJhkkFCVQJrELZ:1541985782:starRegistry",
    "validationWindow": 300
}
```
>**Verifying User Message Signature**
```bash
curl -X "POST" "http://localhost:8000/message-signature/validate" \
     -H 'Content-Type: application/json; charset=utf-8' \
     -d $'{
  "address": "1DSY2Wzjt2uRqJAjfFzBhJhkkFCVQJrELZ",
  "signature": "IDkUkjNMoTPko4rb+8BMksHhrPBFUK1G4Yw8a6TRJja5L6lmyqevbtJw568en9+8hJrbisx3bX/87A9vin4Rd8k="
}'
```
>Response
```JSON
{
    "registerStar": true,
    "status": {
        "address": "1DSY2Wzjt2uRqJAjfFzBhJhkkFCVQJrELZ",
        "requestTimeStamp": "1541985782",
        "message": "1DSY2Wzjt2uRqJAjfFzBhJhkkFCVQJrELZ:1541985782:starRegistry",
        "validationWindow": 228,
        "messageSignature": "valid"
    }
}
```

#### 2. Star Registration Endpoint

>**Request Star Register**
```bash
curl -X "POST" "http://localhost:8000/block" \
     -H 'Content-Type: application/json; charset=utf-8' \
     -d $'{
  "address": "1DSY2Wzjt2uRqJAjfFzBhJhkkFCVQJrELZ",
  "star": {
    "dec": "-26° 29' 24.9",
    "ra": "16h 29m 1.0s",
    "story": "Found star using https://www.google.com/sky/"
  }
}'
```
>Response
```JSON
{
    "hash": "dc8d7afe27066b251693fb7ddb01bbf709fc0845f3b6ae0da7f1627390ca9d44",
    "height": 1,
    "body": {
        "address": "1DSY2Wzjt2uRqJAjfFzBhJhkkFCVQJrELZ",
        "star": {
            "dec": "-26° 29' 24.9",
            "ra": "16h 29m 1.0s",
            "story": "466f756e642073746172207573696e672068747470733a2f2f7777772e676f6f676c652e636f6d2f736b792f"
        }
    },
    "time": "1541985890",
    "previousBlockHash": "81bfedb42088439c8d33d1e1891735bf201089b68a4d2ff49e18a0a44b97fee3"
}
```

#### 3. Star Lookup

>**Lookup by Blockchain ID (Wallet Address)**
```bash
curl "http://localhost:8000/stars/address:1DSY2Wzjt2uRqJAjfFzBhJhkkFCVQJrELZ"
```
>Response
```JSON
[
    {
        "hash": "dc8d7afe27066b251693fb7ddb01bbf709fc0845f3b6ae0da7f1627390ca9d44",
        "height": 1,
        "body": {
            "address": "1DSY2Wzjt2uRqJAjfFzBhJhkkFCVQJrELZ",
            "star": {
                "dec": "-26° 29' 24.9",
                "ra": "16h 29m 1.0s",
                "story": "466f756e642073746172207573696e672068747470733a2f2f7777772e676f6f676c652e636f6d2f736b792f",
                "storyDecoded": "Found star using https://www.google.com/sky/"
            }
        },
        "time": "1541985890",
        "previousBlockHash": "81bfedb42088439c8d33d1e1891735bf201089b68a4d2ff49e18a0a44b97fee3"
    }
]
```
>**Lookup by Block Hash**
```bash
curl "http://localhost:8000/stars/hash:dc8d7afe27066b251693fb7ddb01bbf709fc0845f3b6ae0da7f1627390ca9d44"
```
>Response
```JSON
{
    "hash": "dc8d7afe27066b251693fb7ddb01bbf709fc0845f3b6ae0da7f1627390ca9d44",
    "height": 1,
    "body": {
        "address": "1DSY2Wzjt2uRqJAjfFzBhJhkkFCVQJrELZ",
        "star": {
            "dec": "-26° 29' 24.9",
            "ra": "16h 29m 1.0s",
            "story": "466f756e642073746172207573696e672068747470733a2f2f7777772e676f6f676c652e636f6d2f736b792f",
            "storyDecoded": "Found star using https://www.google.com/sky/"
        }
    },
    "time": "1541985890",
    "previousBlockHash": "81bfedb42088439c8d33d1e1891735bf201089b68a4d2ff49e18a0a44b97fee3"
}
```
>**Lookup by Block Height**
```bash
curl "http://localhost:8000/block/1"
```
>Response
```JSON
{
    "hash": "dc8d7afe27066b251693fb7ddb01bbf709fc0845f3b6ae0da7f1627390ca9d44",
    "height": 1,
    "body": {
        "address": "1DSY2Wzjt2uRqJAjfFzBhJhkkFCVQJrELZ",
        "star": {
            "dec": "-26° 29' 24.9",
            "ra": "16h 29m 1.0s",
            "story": "466f756e642073746172207573696e672068747470733a2f2f7777772e676f6f676c652e636f6d2f736b792f",
            "storyDecoded": "Found star using https://www.google.com/sky/"
        }
    },
    "time": "1541985890",
    "previousBlockHash": "81bfedb42088439c8d33d1e1891735bf201089b68a4d2ff49e18a0a44b97fee3"
}
```

## Built With

* [BitcoinJS](https://www.npmjs.com/package/bitcoinjs-lib) - Used for validating message signatures
* [CryptoJS](https://www.npmjs.com/package/crypto-js) - Used to generate SHA256 block hash address
* [Express](https://expressjs.com/) - The web framework used
* [Joi](https://github.com/hapijs/joi) - Object schema validation
* [JSONPath](https://www.npmjs.com/package/jsonpath) - Query JavaScript objects with JSONPath expressions
* [Level](https://github.com/Level/level) - A Node.js-style LevelDB wrapper to persist blockchain