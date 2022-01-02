const fs = require('fs')
const path = require('path')
const parser = require('fast-csv')
const filter = require('stream-filter')
const moment = require('moment')

// QIF Spec http://www.respmech.com/mym2qifw/qif_new.htm

const args = process.argv.slice(2);
const config = JSON.parse(fs.readFileSync(path.normalize(args[0])));
const folderPath = path.normalize(args[1]);

const results = [];
fs.readdirSync(folderPath)
  .filter(function (elm) { return elm.match(/.*\.(csv$)/ig); })
  .forEach(file => {
    let csvfile = path.join(folderPath, file);
    console.log("Processing " + csvfile);
    fs.createReadStream(csvfile)
      .pipe(parser.parse({ skipLines: `${config.csv.skipLines}`, ignoreEmpty: true }))
      .on('data', (data) => { data.length > 1 ? results.push(data) : {} })
      .on('end', () => {
        const transactions = results
          .map(transaction => {
            const tx = {};
            for (const key in config.csv.columns) {
              tx[`${key}`] = transaction[`${config.csv.columns[key]}`];
            }
            tx.date = getSafeDate(tx.date)
            tx.amount = `${tx.amount.replace(/\$/, '')}`
            tx.category = calcCategory(tx.memo)
            if (config.csv.type.includes("investment")) {
              tx.action = calcAction(tx.memo);
            }
            return tx
          });

        const bankTx = transactions
          .filter(tx => isBankTx(tx))
          .map(transaction => { return formatBankTx(transaction) })
          .join('\n\n');
        fs.writeFile(csvfile + '.bank.qif', '!Type:Bank\n' + bankTx,
          (err) => {
            if (err) console.log(err)
            console.log(csvfile + '.bank.qif created.')
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

    const calcCategory = function (str) {
      return config.bankCategories[str.toUpperCase().replace(/ .*/, '')];
    }

    const calcAction = function (str) {
      return config.investment[str.toUpperCase().replace(/ .*/, '')]
    }
    const isBankTx = function (tx) {
      return config.csv.type.includes("bank") || tx.category
    }

    const formatBankTx = function (tx) {
      if (config.csv.type.includes("bank") && tx.category && tx.category.includes('Interest') && !tx.payee) {
        tx.payee = `${config.interestPayee}`
      }
      let qifText = ''
      if (tx.date) qifText += `\nD${tx.date}`;
      if (tx.checknum) qifText += `\nN${tx.checknum}`
      if (tx.withdrawls) {
        qifText += `\nT${tx.withdrawls.replace(/\$/,'').replace(/,/,'') * -1}`
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

