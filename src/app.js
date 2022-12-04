const fs = require('fs')
const path = require('path')
const QIFGenerator = require('./converter/qif-generator')
const TransactionMapper = require('./services/transaction-mapper');

const args = process.argv.slice(2);
const config = JSON.parse(fs.readFileSync(path.normalize(args[1])));

const folderPath = path.normalize(args[0]);
const stats = fs.statSync(folderPath);
let csvfiles = [];
if (stats.isDirectory()) {
  fs.readdirSync(folderPath)
    .filter(function (elm) { return elm.match(/.*\.(csv$)/ig); })
    .forEach(file => {
      let csvfile = path.join(folderPath, file);
      csvfiles.push(csvfile);
    });
} else {
  csvfiles.push(folderPath);
}

if (!csvfiles || csvfiles.length == 0) {
  console.log("No .csv file found under " + folderPath + ", check again?")
}

let txMapper = new TransactionMapper(config);
csvfiles.forEach(file => {
  console.log('Processing ' + file);
  const qif = new QIFGenerator();
  let transaction = txMapper.extractTx(file)
  .then((transactions) => {
    qif.save2File(transactions, file);
  });
})
