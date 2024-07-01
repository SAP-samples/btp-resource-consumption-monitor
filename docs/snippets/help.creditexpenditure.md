# Credit Expenditure

This application displays the history of charges on your CPEA contract. It is meant as a high-level sanity-check of your account.

### Columns
- **Estimated Cost**: The cost that is expected (estimated) to be charged on your account, based on the sum of all consumption of the different services and applications being used in your account.
    - **Estimated Credits**: Part of the *Estimated Cost* which is expected to be covered by available CPEA credits in your account
    - **Pay Go Cost**: Part of the *Estimated Cost* which is expected to be billed in excess of your CPEA credits
- **Final Credits**: Final amount of CPEA credits that have been deducted from your contract balance for the specified month. This is the invoiced amount.
- **Difference**: The difference between *Estimated Credits* and *Final Credits*. This should be (close to) zero as it shows that the monthly billing is aligned with the final invoice.
- **Assessment**: Depending on the *Difference*, this can show the following values:
    - *Aligned* (green): This is the ideal scenario, as the difference is (close to) zero. A small margin of error is possible due to currency conversions etc.
    - *Reduced Charge* (blue): The invoiced amount is less than expected. This can be due to a contract top-up, reflected in a negative *Final Credits*.
    - *Discrepancy* (orange): The invoiced amount is more than expected. If the reason is unclear, you can reach out to SAP (SAPBalanceStatement@sap.com) using the provided button.
- **Contract Value**: (hidden by default) Shows the initial value of your CPEA contract.

### Things to keep in mind
- The application should be loaded with enough **history** to calculate the values correctly. For past months that are not loaded, the values will be incorrect. Loading (refreshing) historic data can be done in the *Billing Verification* application: `Data Management` > `Load Historic Data`.
- In a multi-Global Account setup where **currency conversion** is enabled, all values are converted to the target currency using the fixed exchange rate. This can lead to small variations to the official monthly invoice.
- The values for the **previous month** are still estimated until the invoice has been generated. This typically happens within the first week after month-end. Before making conclusions based on the numbers shown, it is best to refresh the application with the previous month's history.