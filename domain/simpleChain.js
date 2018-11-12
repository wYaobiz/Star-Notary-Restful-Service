/* ===== SHA256 with Crypto-js ===============================
|  Learn more: Crypto-js: https://github.com/brix/crypto-js  |
|  =========================================================*/
const SHA256 = require('crypto-js/sha256');
const levelDB = require('../db/levelSandbox')('data/chaindata', 'json');
const jp = require('jsonpath');
const Block = require('./block');
const HexDecoder = require('../utils/hexDecoder');


/* ===== Blockchain Class ==========================
|  Class with a constructor for new blockchain 		|
|  ================================================*/

class Blockchain {
  constructor() {
    this.errorLog = [];
    this.blockHeight = -1;

    let $this = this;
    this.getBlockHeight().then(function (height) {
      if (height == -1) {
        $this.addBlock(new Block("First block in the chain - Genesis block")).then(result => {
          if (result == "success")
            console.log("Genesis block created with height = " + $this.blockHeight);
          else
            console.log("Something went wrong while creating genesis block!");
        });
      }
      else
        $this.blockHeight = height; //caching block height result in blockHeight
    });
  }

  //Empty Blockchain
  _deleteAllBlocks() {
    let i = 0;
    levelDB.createReadStream().on('data', function (data) {
      levelDB._deleteLevelDBData(i);
      console.log('Deleted Block#', i)
      i++;
    }).on('error', function (err) {
      return console.log('Unable to read data stream!', err)
    });
  }

  _printAllBlocks() {
    levelDB.createReadStream()
      .on('data', function (data) {
        console.log("Block#" + data.key + ": " + data.value);
      }).on('error', function (err) {
        return console.log('Unable to read data stream!', err)
      });
  }

  // Add new block  
  addBlock(newBlock) {
    if (this.blockHeight > -1) {
      let $this = this;
      return new Promise((resolve, reject) => {
        $this.getBlock($this.blockHeight)
          .then(function (currentBlock) {
            newBlock.previousBlockHash = currentBlock.hash;
            newBlock.time = new Date().getTime().toString().slice(0, -3);
            newBlock.height = ++$this.blockHeight;
            newBlock.hash = SHA256(JSON.stringify(newBlock)).toString();
            levelDB._addLevelDBData($this.blockHeight, newBlock).then((result) => {
              resolve(result);
            }).catch(err => console.log(err));

          })
          .catch(function (err) { console.log(err) })
      });
    }
    else {
      return new Promise((resolve, reject) => {
        newBlock.previousBlockHash = "";
        newBlock.time = new Date().getTime().toString().slice(0, -3);
        newBlock.height = ++this.blockHeight;
        newBlock.hash = SHA256(JSON.stringify(newBlock)).toString();
        levelDB._addLevelDBData(this.blockHeight, newBlock).then((result) => {
          resolve(result);
        }).catch(err => console.log(err));
      }).catch(function (err) { console.log(err); });
    }
  }

  // Get Block by block height
  getBlock(blockHeight) {
    return levelDB._getLevelDBData(blockHeight);
  }

  //Get Blocks by body content
  getBlocksByBodyContent(searchValue, pathExpression) {
    let result = [];
    return new Promise(function (resolve) {
      levelDB.createReadStream()
        .on('data', function (data) {
          const jsonObject = data.value;
          const val = jp.query(jsonObject, pathExpression);
          if (val[0] === searchValue){
            if (jsonObject.body.star.story) {
              jsonObject.body.star.storyDecoded = HexDecoder(jsonObject.body.star.story);
            }
            result.push(jsonObject);
          }
          // if (val[0] === searchValue)
          //   result.push(jsonObject);
        }).on('close', function (err) {
          resolve(result);
        }).on('end', function (err) {
        }).on('error', function (err) {
          return console.log('Unable to read data stream!', err);
        });
    });
  }

  getBlockByHash(hash) {
    return new Promise(function (resolve) {
      levelDB.createReadStream()
        .on('data', function (data) {
          const jsonObject = data.value;
          if (jsonObject.hash === hash)
            resolve(jsonObject);
        }).on('close', function (err) {
        }).on('end', function (err) {
        }).on('error', function (err) {
          return console.log('Unable to read data stream!', err);
        });
    });
  }

  // Get current block height 
  getBlockHeight() {
    let i = -1;
    return new Promise(function (resolve) {
      levelDB.createReadStream()
        .on('data', function (data) {
          i++;
        }).on('close', function (err) {
          console.log("Block Height is: " + i);
          resolve(i);
        }).on('end', function (err) {
        }).on('error', function (err) {
          return console.log('Unable to read data stream!', err)
        });
    });
  }

  // validate block
  validateBlock(blockHeight) {
    // get block object
    let block = this.getBlock(blockHeight);
    // get block hash
    return block.then(function (blockObject) {
      let blockHash = blockObject.hash;
      blockObject.hash = '';
      // generate block hash
      let validBlockHash = SHA256(JSON.stringify(blockObject)).toString();

      if (blockHash === validBlockHash) {
        return true;
      } else {
        console.log('Block #' + blockHeight + ' invalid hash:\n' + blockHash + '<>' + validBlockHash);
        return false;
      }

    });
  }

  // Validate blockchain
  validateChain() {
    let $this = this;

    levelDB.createReadStream().on('data', function (data) {

      new Promise(function (resolve, reject) {
        resolve($this.validateBlock(data.key));
      }).then(function (IsValid) {
        if (!IsValid) $this.errorLog.push(data.key);
      }).catch(function (err) {
        console.log(err);
      });

      if (data.key > 0) {
        new Promise(function (resolve, reject) {
          resolve($this.getBlock(data.key - 1));
        })
          .then(function (prevBlockObject) {
            let currentBlock = data.value;
            if (currentBlock.previousBlockHash !== prevBlockObject.hash)
              $this.errorLog.push(data.key);
          })
          .catch(function (err) {
            console.log(err);
          });
      }
    }).on('error', function (err) {
      return console.log('Unable to read data stream!', err)
    });
  }

  //Printing Error Log After Validating Chain
  printErrorLog() {
    if (this.errorLog.length > 0) {
      console.log('Block errors = ' + this.errorLog.length);
      console.log('Blocks: ' + this.errorLog);
    } else {
      console.log('No errors detected');
    }
  }

  // Generate 10 Blocks
  generateBlocks() {
    let $this = this;
    (function theLoop(i) {
      setTimeout(function () {
        $this.addBlock(new Block('Testing data ' + i));
        if (--i) theLoop(i);
      }, 100);
    })(10);
  }


  // Induced errors 
  induceErrors(inducedErrorBlocks) {
    let $this = this;

    (function theLoop($this, inducedErrorBlocks, i) {
      setTimeout(function () {

        $this.getBlock(inducedErrorBlocks[i])
          .then(function (resultBlock) {
            resultBlock.body = 'induced chain error';
            levelDB._deleteLevelDBData(inducedErrorBlocks[i]);
            levelDB._addLevelDBData(inducedErrorBlocks[i], resultBlock);
          })
          .then(function () {
            if (--i >= 0) theLoop($this, inducedErrorBlocks, i);
          })
          .catch(function (err) { });

      }, 100);
    })($this, inducedErrorBlocks, inducedErrorBlocks.length - 1);
  }
}

module.exports = Blockchain;