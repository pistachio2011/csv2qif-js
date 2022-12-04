const TransactionMapper = require('./transaction-mapper');

const fidelityBrokerage = require('../config/fidelity-brokerage.json');
const fidelityIRA = require('../config/fidelity-ira.json');
const fidelityVisa = require('../config/fidelity-visa.json');
const mlBoAHSA = require('../config/ml-boa-hsa.json');
const mlBrokerage = require('../config/ml-invest.json');
const pnc = require('../config/pnc-bank.json');
const usbank = require('../config/usbank-bank.json');

test('convert a Fidelity Brokerage (non-retirement) account export to transaction json objects', () => {
	return new TransactionMapper(fidelityBrokerage)
		.extractTx(__dirname + '/../test-config/fidelity-brokerage.csv')
		.then((txs) => {	
			expect(txs.bankTx.length).toBe(3);
			expect(txs.investTx.length).toBe(5);
		});
  });

test('convert a Fidelity IRA (both tranditioanl and ROTH) account export to transaction json objects', () => {
	return new TransactionMapper(fidelityIRA)
		.extractTx(__dirname + '/../test-config/fidelity-ira.csv')
		.then((txs) => {	
			expect(txs.bankTx.length).toBe(2);
			expect(txs.investTx.length).toBe(1);
		});
  });

test('convert a Fidelity Visa Signature account export to transaction json objects', () => {
	return new TransactionMapper(fidelityVisa)
		.extractTx(__dirname + '/../test-config/fidelity-visa.csv')
		.then((txs) => {	expect(txs.bankTx.length).toBe(3); 	});
  });

test('convert a Merrill Lynch (Bank of America) HSA account export to transaction json objects', () => {
	return new TransactionMapper(mlBoAHSA)
		.extractTx(__dirname + '/../test-config/ml-boa-hsa.csv')
		.then((txs) => {	expect(txs.bankTx.length).toBe(2); 	});
  });
  
test('convert a Merrill Lynch investment account export to transaction json objects', () => {
  return new TransactionMapper(mlBrokerage)
  	.extractTx(__dirname + '/../test-config/ml-investment.csv')
  	.then((txs) => {	
		expect(txs.bankTx.length).toBe(3); 	
	 	expect(txs.investTx.length).toBe(3); 	
	
	});
});

test('convert a PNC bank export to transaction json objects', () => {
  return new TransactionMapper(pnc)
	.extractTx(__dirname + '/../test-config/pncbank.csv')
	.then((txs) => {  expect(txs.bankTx.length).toBe(5); });
});

test('convert a US Bank export to transaction json objects', () => {
  return new TransactionMapper(usbank)
  	.extractTx(__dirname + '/../test-config/usbank.csv')
  	.then ( (txs) => { expect(txs.bankTx.length).toBe(7); });
});

test('get a category from a memo', () => {
  const memo = 'DIRECT DEPOSIT ELAN CARDSVCRedemption (Cash)';
  let test = Object.entries(fidelityInv.bankCategories).filter(function (t) {
    return memo.indexOf(t[0]) >= 0;
  });
  let category = test[0][1];
  console.log(category);
  expect(category).toBe('Other Income : Percent Rebate');
});
