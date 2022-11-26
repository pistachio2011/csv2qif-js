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
			if (!tx.payee && this.config.payee) {
				let entry = Object.entries(this.config.payee).filter(function(key) {
					return memo.indexOf(key[0]) >= 0;
				});
				if (entry[0]) {
					tx.payee = entry[0][1];
				}
			}
			if (!tx.payee && this.config.payeePatterns) {
				this.config.payeePatterns.forEach(pattern => {
					let regex = new RegExp(pattern, 'g');
					let p = regex.exec(memo);
					if (p) tx.payee = p[1].trim();
				});
			}
		}
		if (!tx.category && this.config.bankCategories) {
			let entry = Object.entries(this.config.bankCategories).filter(function(key) {
				return memo.indexOf(key[0]) >= 0;
			});
			if (entry[0]) {
				tx.category = entry[0][1];
			}
		}
		if (!tx.action && this.config.investment) {
			let entry = Object.entries(this.config.investment).filter(function(key) {
				return memo.indexOf(key[0]) >= 0;
			});
			if (entry[0]) {
				tx.action = entry[0][1];
			}
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
					let value = transaction[`${this.config.csv.columns[key]}`];
					if (value) {
						tx[`${key}`] = value.trim();
					}
				}
				tx.date = this.getSafeDate(tx.date);
				if (tx.amount) {
					tx.amount = `${tx.amount.replace(/\$/, '')}`;
				}
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