const fs = require('fs');

// QIF Spec http://www.respmech.com/mym2qifw/qif_new.htm

class QIFGenerator {

	save2File(transactions, filenamePrefix) {
		if (transactions.bankTx && transactions.bankTx.length > 0) {
			const lastTx = transactions.bankTx.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
			
			if (lastTx.balance) {
				// get the last part of the filenamePrefix as the account name
				const acctname = filenamePrefix.split('.').pop();
				const blanceTx = { date: lastTx.date,
					 amount: 0.001,
					 payee: '******BALANCE*****',
					 category: 'A Do Not Count - Exp',
					 memo: acctname + ' balance at ' + lastTx.date +': $' + lastTx.balance };
				transactions.bankTx.push(blanceTx);
				console.log('Adding balance record to ' + filenamePrefix + ': ' + JSON.stringify(blanceTx));
			}
			const bankTxString = transactions.bankTx.map(transaction => { return this.formatBankTx(transaction); })
				.join('\n\n');
			
			fs.writeFile(filenamePrefix + '.bank.qif', '!Type:Bank\n' + bankTxString,
				(err) => {
					if (err) console.log(err);
					console.log(transactions.bankTx.length + " bank records generated in " + filenamePrefix + '.bank.qif created.');
				});

		}

		if (transactions.investTx && transactions.investTx.length > 0) {
			const investTx = transactions.investTx
				.map(transaction => { return this.formatInvestTx(transaction); })
				.join('\n\n');
			fs.writeFile(filenamePrefix + '.invest.qif', '!Type:Invst\n' + investTx,
				(err) => {
					if (err) console.log(err);
					console.log(transactions.investTx.length + " investment records generated in " + filenamePrefix + '.bank.qif created.');
				});
			
		}
	};

	formatBankTx(tx) {
		let qifText = '';
		if (tx.date) qifText += `\nD${tx.date}`;
		if (tx.checknum) qifText += `\nN${tx.checknum}`;
		if (tx.withdrawls) {
			qifText += `\nT${tx.withdrawls.replace(/\$/, '').replace(/,/, '') * -1}`;
		} else if (tx.amount) {
			qifText += `\nT${tx.amount}`;
		}
		if (tx.payee) qifText += `\nP${tx.payee}`;
		if (tx.category) qifText += `\nL${tx.category}`;
		if (tx.memo) qifText += `\nM${tx.memo}`;
		if (qifText.length > 0) qifText += '\n^\n';

		return qifText.trim();
	};

	formatInvestTx(tx) {
		let qifText = '';
		if (tx.date) qifText += `\nD${tx.date}`;
		if (tx.action) qifText += `\nN${tx.action}`;
		if (tx.security) qifText += `\nY${tx.security}`;
		if (tx.quantity) qifText += `\nQ${tx.quantity}`;
		if (tx.amount) qifText += `\nT${tx.amount}`;
		if (tx.payee) qifText += `\nP${tx.payee}`;
		if (tx.memo) qifText += `\nM${tx.memo}`;
		if (tx.commission) qifText += `\nO${tx.commission}`;
		if (tx.account) qifText += `\nL${tx.account}`;
		if (qifText.length > 0) qifText += '\n^\n';
		return qifText.trim();
	};

}

module.exports = QIFGenerator;