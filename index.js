const fs = require('fs')
const path = require('path')
const parser = require('fast-csv')
const filter = require('stream-filter')
const moment = require('moment')

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
  fs.createReadStream(file)
    .pipe(parser.parse({ skipLines: `${config.csv.skipLines}`, ignoreEmpty: true }))
    .on('data', (data) => { data.length > 1 ? results.push(data) : {} })
    .on('end', () => {
      const transactions = results
        .map(transaction => {
          let tx = {};
          for (const key in config.csv.columns) {
            tx[`${key}`] = transaction[`${config.csv.columns[key]}`];
          }
          tx.date = getSafeDate(tx.date)
          tx.amount = `${tx.amount.replace(/\$/, '')}`
          tx = guess(tx.memo, tx)
          return tx
        });

      const bankTx = transactions
        .filter(tx => isBankTx(tx))
        .map(transaction => { return formatBankTx(transaction) })
        .join('\n\n');
      fs.writeFile(file + '.bank.qif', '!Type:Bank\n' + bankTx,
        (err) => {
          if (err) console.log(err)
          console.log(file + '.bank.qif created.')
        });

      if (config.csv.type.includes("investment")) {
        const investTx = transactions
          .filter(tx => !isBankTx(tx))
          .map(transaction => { return formatInvestTx(transaction) })
          .join('\n\n');
        fs.writeFile(csvfile + '.invest.qif', '!Type:Invst\n' + investTx,
          (err) => {
            if (err) console.log(err)
            console.log(csvfile + '.bank.qif created.')
          });
      }
    })
})

const getSafeDate = function (dateStr) {
  if (dateStr && config.csv.dateFormat) {
    const tradeDate = moment(dateStr, `${config.csv.dateFormat}`)
    return tradeDate.format("MM/DD/YYYY")
  }
  return dateStr;
}

const guess = function (memo, tx) {
  if (!tx.category && config.transfer) {
    const translated = config.transfer[`${memo}`]
    if (translated) {
      tx.category = `[${translated}]`
    }
  }
  if (!tx.payee && config.payee) {
    const translated = config.transfer[`${memo}`]
    if (translated) { tx.payee = translated }
    if (tx.payee == undefined && config.payeePatterns) {
      config.payeePatterns.forEach(pattern => {
        let regex = new RegExp(pattern, 'g')
        let p = regex.exec(memo)
        if (p) tx.payee = p[1].trim();
      })
    }
  } 
  if (!tx.category && config.bankCategories) {
    tx.category = config.bankCategories[memo.toUpperCase().replace(/ .*/, '')]
  } 
  if (!tx.action && config.investment) {
    tx.action = config.investment[memo.toUpperCase().replace(/ .*/, '')]
  }
  return tx
}

const isBankTx = function (tx) {
  return config.csv.type.includes("bank") || tx.category
}

const formatBankTx = function (tx) {
  let qifText = ''
  if (tx.date) qifText += `\nD${tx.date}`;
  if (tx.checknum) qifText += `\nN${tx.checknum}`
  if (tx.withdrawls) {
    qifText += `\nT${tx.withdrawls.replace(/\$/, '').replace(/,/, '') * -1}`
  } else if (tx.amount) {
    qifText += `\nT${tx.amount}`
  }
  if (tx.payee) qifText += `\nP${tx.payee}`
  if (tx.category) qifText += `\nL${tx.category}`
  if (tx.memo) qifText += `\nM${tx.memo}`
  if (qifText.length > 0) qifText += `\n^\n`

  return qifText.trim()
};

const formatInvestTx = function (tx) {
  let qifText = ''
  if (tx.date) qifText += `\nD${tx.date}`;
  if (tx.action) qifText += `\nN${tx.action}`
  if (tx.security) qifText += `\nY${tx.security}`
  if (tx.quantity) qifText += `\nQ${tx.quantity}`
  if (tx.amount) qifText += `\nT${tx.amount}`
  if (tx.payee) qifText += `\nP${tx.payee}`
  if (tx.memo) qifText += `\nM${tx.memo}`
  if (tx.commission) qifText += `\nO${tx.commission}`
  if (tx.account) qifText += `\nL${tx.account}`
  if (qifText.length > 0) qifText += `\n^\n`
  return qifText.trim()
}

