const moment = require('moment');

// QIF Spec http://www.respmech.com/mym2qifw/qif_new.htm
class TransactionMapper {

	constructor(config) {
		this.config = config
	}


	getSafeDate(dateStr) {
		if (dateStr && this.config.csv.dateFormat) {
			const tradeDate = moment(dateStr, `${this.config.csv.dateFormat}`);
			return tradeDate.format('MM/DD/YYYY');
		}
		return dateStr;
	};

	guess(memo, tx) {
		if (!tx.category && this.config.transfer) {
			const translated = this.config.transfer[`${memo}`];
			if (translated) {
				tx.category = `[${translated}]`;
			}
		}
		if (!tx.payee && this.config.payee) {
			const translated = this.config.transfer[`${memo}`];
			if (translated) { tx.payee = translated; }
			if (tx.payee == undefined && this.config.payeePatterns) {
				this.config.payeePatterns.forEach(pattern => {
					let regex = new RegExp(pattern, 'g');
					let p = regex.exec(memo);
					if (p) tx.payee = p[1].trim();
				});
			}
		}
		if (!tx.category && this.config.bankCategories) {
			tx.category = this.config.bankCategories[memo.toUpperCase().replace(/ .*/, '')];
		}
		if (!tx.action && this.config.investment) {
			tx.action = this.config.investment[memo.toUpperCase().replace(/ .*/, '')];
		}
		return tx;
	};

	isBankTx(tx) {
		return this.config.csv.type.includes('bank') || tx.category;
	};

	map2tx(results) {
		const transactions = results
			.map(transaction => {
				let tx = {};
				for (const key in this.config.csv.columns) {
					tx[`${key}`] = transaction[`${this.config.csv.columns[key]}`];
				}
				tx.date = this.getSafeDate(tx.date);
				tx.amount = `${tx.amount.replace(/\$/, '')}`;
				tx = this.guess(tx.memo, tx);
				return tx;
			});

		const bankTx = transactions.filter(tx => this.isBankTx(tx));
		const investTx = transactions.filter(tx => !this.isBankTx(tx));

		return {
			'bankTx': bankTx,
			'investTx': investTx
		};
	};

}

module.exports = TransactionMapper