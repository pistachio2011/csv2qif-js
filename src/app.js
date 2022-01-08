const fs = require('fs')
const path = require('path')
const converter = require('./serivces/converter')

// QIF Spec http://www.respmech.com/mym2qifw/qif_new.htm

const args = process.argv.slice(2);
const config = JSON.parse(fs.readFileSync(path.normalize(args[0])));

const folderPath = path.normalize(args[1]);
const stats = fs.statSync(folderPath)
let csvfiles = []
if (stats.isDirectory) {
  fs.readdirSync(folderPath)
    .filter(function (elm) { return elm.match(/.*\.(csv$)/ig); })
    .forEach(file => {
      let csvfile = path.join(folderPath, file);
      csvfiles.push(csvfile)
    })
} else {
  csvfiles.push(folderPath)
}

const results = [];
csvfiles.forEach(file => {
  console.log("Processing " + file);
  converter.convert(file);
});


