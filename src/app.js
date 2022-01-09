const fs = require('fs')
const path = require('path')
const QIFGenerator = require('./converter/qif-generator')
const TransactionMapper = require('./services/transaction-mapper');
const parser = require('fast-csv')

const args = process.argv.slice(2);
const config = JSON.parse(fs.readFileSync(path.normalize(args[0])));

const folderPath = path.normalize(args[1]);
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

let txMapper = new TransactionMapper(config);
if (!csvfiles || csvfiles.length == 0) {
  console.log("No .csv file found under " + folderPath + ", check again?")
}

csvfiles.forEach(file => {
  console.log('Processing ' + file);
  const results = [];
  const qif = new QIFGenerator();
  fs.createReadStream(file)
    .pipe(parser.parse({ skipLines: `${config.csv.skipLines}`, ignoreEmpty: true }))
    .on('data', (data) => { data.length > 1 ? results.push(data) : {}; })
    .on('end', () => {
      const transactions = txMapper.map2tx(results);
      qif.save2File(transactions, file);
    });
})
