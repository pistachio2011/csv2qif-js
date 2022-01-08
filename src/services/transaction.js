const fs = require('fs')
const path = require('path')
const parser = require('fast-csv')
const filter = require('stream-filter')
const moment = require('moment')

// QIF Spec http://www.respmech.com/mym2qifw/qif_new.htm

const convert = function (results) {
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

    const bankTx = transactions.filter(tx => isBankTx(tx))
    const investTx = transactions.filter(tx => !isBankTx(tx))

    return {
        "bankTX": bankTx,
        "investTx": investTx
    };
}

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



module.exports = convert