const fs = require('fs')
const path = require('path')
const QIFGenerator = require('./converter/qif-generator')
const TransactionMapper = require('./services/transaction-mapper');

const args = process.argv.slice(2);
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

// use relative path to the project root
const mapping = JSON.parse(fs.readFileSync(path.normalize('./src/config/mapping.json')));

console.log('Mapping file content: ' + JSON.stringify(mapping));
csvfiles.forEach((file, index) => {
  const fileName = path.basename(file, '.csv');

  const configFile = Object.keys(mapping).
    find(key => fileName.startsWith(key))
    ? mapping[Object.keys(mapping).find(key => fileName.startsWith(key))]
    : null;

  if (configFile) {
    const config = JSON.parse(fs.readFileSync(path.normalize("./src/config/" + configFile)));
    const bankname=path.basename(configFile, '.json').split('.')[0];
    
    let txMapper = new TransactionMapper(config);
    console.log('Processing ' + file + 'with config ' + configFile);
    const qif = new QIFGenerator();
    let transaction = txMapper.extractTx(file)
      .then((transactions) => {
        qif.save2File(transactions, file + '.' + bankname);
      });
  } else {
    console.log(`No config found for ${fileName}, skipping.`);
  }
});
