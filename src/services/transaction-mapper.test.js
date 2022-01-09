const TransactionMapper = require('./transaction-mapper');
const pnc = require ('../config/pnc-bank.json');
const usbank = require('../config/usbank-bank.json');
const myrillLynch = require('../config/ml-invest.json');

test('convert a pnc bank export to transaction json objects', () => {
	
	let results = [
		["12/01/2021","DEPOSIT                              XXXXX1111 ","","$500.00","Deposits","$500.00"],
		['12/11/2021','POS PURCHASE          POS99999999  WALGREENS STOR','$19.24','','Healthcare','$335.36'],
		['12/11/2021','INTERNATIONAL POS FEE  VIS 2222              GB ','$1.33','','Service Charges + Fees','$354.60']
	];
	let txMapper = new TransactionMapper(pnc);
	console.log(txMapper.map2tx(results));
	expect(txMapper.map2tx(results).bankTx.length).toBe(3);

});

test('convert a USBank export to transaction json objects', () => {
	
	let results = [
//		["Date","Transaction","Name","Memo","Amount"],
		["2021-12-01","DEBIT","WEB AUTHORIZED PMT DUKE ENERGY OH","Download from usbank.com.","-200.00"],
		["2021-12-15","DEBIT","MONTHLY MAINTENANCE FEE","Download from usbank.com.","-6.95"],
		["2021-12-15","CREDIT","MONTHLY MAINTENANCE FEE WAIVED","Download from usbank.com.","6.95"],
		["2021-12-20","DEBIT","ELECTRONIC WITHDRAWAL INS CO","Download from usbank.com.","-1000.00"],
		["2021-12-31","CREDIT","ELECTRONIC DEPOSIT US INC","Download from usbank.com.","10000.00"],
		["2022-01-03","DEBIT","WEB AUTHORIZED PMT CARDMEMBER SVC","Download from usbank.com.","-5000.00"],
		["2022-01-03","1001","CHECK","Download from usbank.com.","-20.00"]
	];
	let txMapper = new TransactionMapper(usbank);
	console.log(txMapper.map2tx(results));
	expect(txMapper.map2tx(results).bankTx.length).toBe(7);

});


test('convert a Merrill Lynch investment account export to transaction json objects', () => {
	
	let results = [
	//	["Trade Date" ,"Settlement Date" ,"Account" ,"Description" ,"Type" ,"Symbol/ CUSIP" ,"Quantity" ,"Price" ,"Amount" ," " ],
		["12/31/2021" ,"12/31/2021" ,"CMA-Edge 50X-12345" ,"Bank Interest ML DIRECT DEPOSIT PROGRM FROM 11/30 THRU 12/31" ,"" ,"990111111" ,"" ,"" ,"$0.50" ,"" ],
		["12/28/2021" ,"12/28/2021" ,"CMA-Edge 50X-12345" ,"Funds Received PNC Bk NA" ,"" ,"" ,"" ,"" ,"$10,000.00" ,"" ],
		["12/06/2021" ,"12/08/2021" ,"CMA-Edge 50X-12345" ,"Purchase  PROCTER & GAMBLE CO ACTUAL PRICES, REMUNERATION AND THE CAPACITY IN WHICH ML ACTED ARE AVAILABLE UPON REQUEST. CLIENT ENTERED." ,"" ,"PG" ,"300" ,"$151.89" ,"-$45,566.20" ,"" ],
		["11/15/2021" ,"11/15/2021" ,"CMA-Edge 50X-12345" ,"Dividend PROCTER & GAMBLE CO HOLDING 350.0000 PAY DATE 11/15/2021" ,"" ,"PG" ,"" ,"" ,"$304.43" ,"" ],
	];
	let txMapper = new TransactionMapper(myrillLynch);
	console.log(txMapper.map2tx(results));
	expect(txMapper.map2tx(results).bankTx.length).toBe(2);

});
