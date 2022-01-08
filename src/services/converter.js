const fs = require('fs')
const path = require('path')
const parser = require('fast-csv')
const filter = require('stream-filter')
const moment = require('moment')
const transaction = require('./transaction')

// QIF Spec http://www.respmech.com/mym2qifw/qif_new.htm

const convert = function (file) {
    const results = [];
    fs.createReadStream(file)
        .pipe(parser.parse({ skipLines: `${config.csv.skipLines}`, ignoreEmpty: true }))
        .on('data', (data) => { data.length > 1 ? results.push(data) : {} })
        .on('end', () => {
            const transactions = transaction.convert(results);
            if (transactions.bankTx) {

                const bankTX = transactions.bankTx.map(transaction => { return formatBankTx(transaction) })
                    .join('\n\n');
                fs.writeFile(file + '.bank.qif', '!Type:Bank\n' + bankTx,
                    (err) => {
                        if (err) console.log(err)
                        console.log(file + '.bank.qif created.')
                    });
            }
            if (transaction.investTx) {
                const investTx = transactions.investTx
                    .filter(tx => !isBankTx(tx))
                    .map(transaction => { return formatInvestTx(transaction) })
                    .join('\n\n');
                fs.writeFile(csvfile + '.invest.qif', '!Type:Invst\n' + investTx,
                    (err) => {
                        if (err) console.log(err)
                        console.log(csvfile + '.bank.qif created.')
                    });
            }
        });
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


module.exports = convert