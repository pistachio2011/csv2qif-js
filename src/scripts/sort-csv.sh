filename=$1
tempfile=$(mktemp)
cat "$filename"|grep -v 'Date downloaded '|grep '20'|sed 's/, //g' | cut -d',' -f2,3|sort|uniq|tr ' ' '-'|tr -d '"' > "$tempfile"
cat "$tempfile"
 for accountLine in $(less "$tempfile"); do
    accountName=$(echo "$accountLine" | cut -d',' -f1|tr -d '-'|tr -d '.')
    account=$(echo "$accountLine" | cut -d',' -f2)
    outputFile="Accounts_History.$accountName.$account.csv"
    echo "Account: $account, Name: $accountName, Output File: $outputFile"
    echo "Run Date,Account,Account Number,Action,Symbol,Description,Type,Exchange Quantity,Exchange Currency,Currency,Price,Quantity,Exchange Rate,Commission,Fees,Accrued Interest,Amount,Settlement Date" > $outputFile
    less "$filename" | grep "$account" >> $outputFile
 done
