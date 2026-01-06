// Profit/Loss Service for Business Reports
// Calculates profit/loss from orders, expenses, and product costs

export interface ProfitFromSale {
  sellingPrice: number;
  purchasePrice: number;
  deliveryPrice: number;
  profit: number;
}

export interface ProfitLossSummary {
  profitFromSale: ProfitFromSale;
  otherIncome: number;
  otherExpense: number;
  totalProfitLoss: number;
  orderCount: number;
  expenseCount: number;
  incomeCount: number;
}

export interface ProfitLossDetail {
  id: string;
  date: string;
  type: 'sale' | 'expense' | 'income';
  description: string;
  amount: number;
  category?: string;
}

const API_BASE = 'https://systemnextit.com';

function buildUrl(path: string, params?: Record<string, string | number | boolean | undefined>) {
  const url = new URL(path, API_BASE);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    });
  }
  return url.toString();
}

export const ProfitLossService = {
  /**
   * Get profit/loss summary for a date range
   */
  async getSummary(opts: { from?: string; to?: string; tenantId?: string } = {}): Promise<ProfitLossSummary> {
    const url = buildUrl('/api/profit-loss/summary', opts);
    const res = await fetch(url);
    if (!res.ok) {
      // Return default values if API not available
      return {
        profitFromSale: {
          sellingPrice: 0,
          purchasePrice: 0,
          deliveryPrice: 0,
          profit: 0,
        },
        otherIncome: 0,
        otherExpense: 0,
        totalProfitLoss: 0,
        orderCount: 0,
        expenseCount: 0,
        incomeCount: 0,
      };
    }
    return res.json();
  },

  /**
   * Get detailed profit/loss transactions
   */
  async getDetails(opts: { from?: string; to?: string; type?: 'sale' | 'expense' | 'income'; tenantId?: string; page?: number; pageSize?: number } = {}): Promise<{ items: ProfitLossDetail[]; total: number }> {
    const url = buildUrl('/api/profit-loss/details', opts);
    const res = await fetch(url);
    if (!res.ok) {
      return { items: [], total: 0 };
    }
    return res.json();
  },

  /**
   * Calculate profit/loss locally from provided data (for offline/mock usage)
   */
  calculateFromData(
    orders: Array<{ amount: number; deliveryCharge?: number; status: string; productCost?: number }>,
    expenses: Array<{ amount: number; status?: string }>,
    incomes: Array<{ amount: number; status?: string }>
  ): ProfitLossSummary {
    // Filter only completed/delivered orders
    const validOrders = orders.filter(o => 
      ['Delivered', 'Confirmed', 'Shipped', 'Pending'].includes(o.status)
    );

    // Calculate selling prices (total order amounts minus delivery)
    const sellingPrice = validOrders.reduce((sum, o) => sum + (o.amount - (o.deliveryCharge || 0)), 0);
    
    // Calculate purchase prices (product costs)
    const purchasePrice = validOrders.reduce((sum, o) => sum + (o.productCost || 0), 0);
    
    // Calculate delivery charges collected
    const deliveryPrice = validOrders.reduce((sum, o) => sum + (o.deliveryCharge || 0), 0);
    
    // Profit from sales = Selling - Purchase (delivery is pass-through)
    const profitFromSale = sellingPrice - purchasePrice;

    // Other income (from income records)
    const otherIncome = incomes
      .filter(i => !i.status || i.status === 'Published')
      .reduce((sum, i) => sum + i.amount, 0);

    // Other expenses
    const otherExpense = expenses
      .filter(e => !e.status || e.status === 'Published')
      .reduce((sum, e) => sum + e.amount, 0);

    // Total Profit/Loss
    const totalProfitLoss = profitFromSale + otherIncome - otherExpense;

    return {
      profitFromSale: {
        sellingPrice,
        purchasePrice,
        deliveryPrice,
        profit: profitFromSale,
      },
      otherIncome,
      otherExpense,
      totalProfitLoss,
      orderCount: validOrders.length,
      expenseCount: expenses.length,
      incomeCount: incomes.length,
    };
  },

  /**
   * Export profit/loss report as CSV
   */
  exportToCSV(summary: ProfitLossSummary, dateRange: { from: string; to: string }): string {
    const rows = [
      ['Profit/Loss Report', `${dateRange.from} to ${dateRange.to}`],
      [''],
      ['PROFIT FROM SALE'],
      ['Selling Price', summary.profitFromSale.sellingPrice.toFixed(2)],
      ['Purchase Price', summary.profitFromSale.purchasePrice.toFixed(2)],
      ['Delivery Price', summary.profitFromSale.deliveryPrice.toFixed(2)],
      ['Profit from Sale', summary.profitFromSale.profit.toFixed(2)],
      [''],
      ['OTHER INCOME'],
      ['Gross Income', summary.otherIncome.toFixed(2)],
      [''],
      ['OTHER EXPENSE'],
      ['Total Expense', summary.otherExpense.toFixed(2)],
      [''],
      ['TOTAL PROFIT/LOSS', summary.totalProfitLoss.toFixed(2)],
    ];

    return rows.map(row => row.join(',')).join('\n');
  },

  /**
   * Download report as CSV file
   */
  downloadReport(summary: ProfitLossSummary, dateRange: { from: string; to: string }): void {
    const csv = this.exportToCSV(summary, dateRange);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `profit-loss-report-${dateRange.from}-to-${dateRange.to}.csv`;
    link.click();
  },

  /**
   * Print report
   */
  printReport(summary: ProfitLossSummary, dateRange: { from: string; to: string }): void {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const formatCurrency = (amount: number) => `৳${amount.toLocaleString('en-BD', { minimumFractionDigits: 2 })}`;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Profit/Loss Report</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { text-align: center; }
          .date-range { text-align: center; color: #666; margin-bottom: 30px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
          th { background: #f5f5f5; }
          .section-header { background: #e8e8e8; font-weight: bold; }
          .amount { text-align: right; }
          .total { font-size: 1.2em; font-weight: bold; }
          .profit { color: green; }
          .loss { color: red; }
          @media print {
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <h1>Profit / Loss Report</h1>
        <p class="date-range">${dateRange.from} - ${dateRange.to}</p>
        
        <table>
          <tr class="section-header">
            <td colspan="2">PROFIT FROM SALE</td>
          </tr>
          <tr>
            <td>Selling Price</td>
            <td class="amount">${formatCurrency(summary.profitFromSale.sellingPrice)}</td>
          </tr>
          <tr>
            <td>Purchase Price</td>
            <td class="amount">${formatCurrency(summary.profitFromSale.purchasePrice)}</td>
          </tr>
          <tr>
            <td>Delivery Price</td>
            <td class="amount">${formatCurrency(summary.profitFromSale.deliveryPrice)}</td>
          </tr>
          
          <tr class="section-header">
            <td colspan="2">OTHER INCOME</td>
          </tr>
          <tr>
            <td>Gross Income</td>
            <td class="amount">${formatCurrency(summary.otherIncome)}</td>
          </tr>
          
          <tr class="section-header">
            <td colspan="2">OTHER EXPENSE</td>
          </tr>
          <tr>
            <td>Total Expense</td>
            <td class="amount">${formatCurrency(summary.otherExpense)}</td>
          </tr>
          
          <tr class="total">
            <td>TOTAL PROFIT / LOSS</td>
            <td class="amount ${summary.totalProfitLoss >= 0 ? 'profit' : 'loss'}">
              ${formatCurrency(summary.totalProfitLoss)}
            </td>
          </tr>
        </table>
        
        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  }
};
