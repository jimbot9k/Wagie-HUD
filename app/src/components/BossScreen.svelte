<script lang="ts">
  interface Props {
    onReturn: () => void;
  }

  let { onReturn }: Props = $props();

  const cols = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

  const rows: (string | number)[][] = [
    [
      'Department',
      'Q1 Budget',
      'Q1 Actual',
      'Q2 Budget',
      'Q2 Actual',
      'Q3 Budget',
      'Q3 Actual',
      'Q4 Budget',
      'YTD Total',
      '% of Budget',
      'Forecast',
      'Notes',
    ],
    [
      'Sales',
      245000,
      238450,
      260000,
      271200,
      255000,
      249800,
      280000,
      1039450,
      97.8,
      1319450,
      'On track',
    ],
    [
      'Marketing',
      85000,
      91200,
      90000,
      87500,
      88000,
      92100,
      95000,
      358800,
      102.5,
      453800,
      'Over budget',
    ],
    [
      'Engineering',
      320000,
      315600,
      335000,
      341800,
      330000,
      327500,
      350000,
      1284900,
      98.4,
      1634900,
      'Under review',
    ],
    ['HR', 62000, 59800, 65000, 63200, 64000, 66100, 68000, 252100, 98.1, 320100, 'Approved'],
    [
      'Operations',
      180000,
      188400,
      190000,
      185600,
      187000,
      191200,
      195000,
      753200,
      101.9,
      948200,
      'Monitor',
    ],
    ['Finance', 45000, 43500, 47000, 48200, 46000, 45800, 49000, 180500, 97.0, 229500, 'On track'],
    [
      'Legal',
      95000,
      97800,
      98000,
      94500,
      96000,
      99200,
      102000,
      389500,
      101.2,
      491500,
      'Within limits',
    ],
    [
      'IT',
      210000,
      205400,
      220000,
      224800,
      218000,
      213600,
      225000,
      866800,
      99.1,
      1091800,
      'Approved',
    ],
    [
      'Product',
      155000,
      161200,
      162000,
      158900,
      160000,
      164800,
      168000,
      648900,
      102.0,
      816900,
      'Over budget',
    ],
    ['Support', 70000, 68300, 73000, 74500, 72000, 71200, 75000, 287000, 99.0, 362000, 'On track'],
    [
      'Research',
      285000,
      279600,
      295000,
      301400,
      290000,
      288100,
      305000,
      1168100,
      98.8,
      1473100,
      'Under review',
    ],
    [],
    [
      'TOTAL',
      '=SUM(B2:B13)',
      '=SUM(C2:C13)',
      '=SUM(D2:D13)',
      '=SUM(E2:E13)',
      '=SUM(F2:F13)',
      '=SUM(G2:G13)',
      '=SUM(H2:H13)',
      '=SUM(I2:I13)',
      '',
      '',
      '',
    ],
  ];

  let selectedCell = $state('B2');

  const _formulaMap: Record<number, string> = {
    13: '=SUM(B2:B13)',
  };

  function cellLabel(col: string, rowIdx: number) {
    return `${col}${rowIdx + 1}`;
  }

  function fmt(v: string | number): string {
    if (typeof v === 'number') {
      if (v > 1000) return v.toLocaleString('en-US', { minimumFractionDigits: 0 });
      return v.toFixed(1) + '%';
    }
    return v;
  }

  function isHeader(rowIdx: number) {
    return rowIdx === 0;
  }
  function isTotalRow(rowIdx: number) {
    return rowIdx === rows.length - 1;
  }
  function isNumeric(v: string | number) {
    return typeof v === 'number';
  }
</script>

<div class="boss-screen" role="application" aria-label="Spreadsheet">
  <!-- Title bar -->
  <div class="title-bar">
    <div class="title-bar-left">
      <span class="app-icon">📊</span>
      <span class="title-text">Budget_Analysis_2026.csv — Spreadsheet</span>
    </div>
    <div class="title-bar-controls">
      <button class="wm-btn minimize" aria-label="Minimize" tabindex="-1">─</button>
      <button class="wm-btn maximize" aria-label="Maximize" tabindex="-1">□</button>
      <button class="wm-btn close" onclick={onReturn} aria-label="Close Excel">✕</button>
    </div>
  </div>

  <!-- Menu bar -->
  <div class="menu-bar">
    {#each ['File', 'Edit', 'View', 'Insert', 'Page Layout', 'Formulas', 'Data', 'Review', 'Help'] as menu (menu)}
      <button class="menu-item" tabindex="-1">{menu}</button>
    {/each}
  </div>

  <!-- Ribbon (simplified) -->
  <div class="ribbon">
    <div class="ribbon-group">
      <button class="ribbon-btn" tabindex="-1" title="Paste">📋</button>
      <button class="ribbon-btn" tabindex="-1" title="Cut">✂️</button>
      <button class="ribbon-btn" tabindex="-1" title="Copy">📄</button>
    </div>
    <div class="ribbon-sep"></div>
    <div class="ribbon-group">
      <select class="ribbon-font" tabindex="-1"
        ><option>Calibri</option><option>Arial</option></select
      >
      <select class="ribbon-size" tabindex="-1"
        ><option>11</option><option>12</option><option>14</option></select
      >
    </div>
    <div class="ribbon-sep"></div>
    <div class="ribbon-group">
      <button class="ribbon-btn fmt-bold" tabindex="-1" title="Bold">B</button>
      <button class="ribbon-btn fmt-italic" tabindex="-1" title="Italic">I</button>
      <button class="ribbon-btn fmt-underline" tabindex="-1" title="Underline">U̲</button>
    </div>
    <div class="ribbon-sep"></div>
    <div class="ribbon-group">
      <button class="ribbon-btn" tabindex="-1" title="Align Left">≡</button>
      <button class="ribbon-btn" tabindex="-1" title="Center">≡</button>
      <button class="ribbon-btn" tabindex="-1" title="Align Right">≡</button>
    </div>
    <div class="ribbon-sep"></div>
    <div class="ribbon-group">
      <button class="ribbon-btn currency" tabindex="-1" title="Currency">$</button>
      <button class="ribbon-btn" tabindex="-1" title="Percent">%</button>
      <button class="ribbon-btn" tabindex="-1" title="Comma">,</button>
    </div>
    <div class="ribbon-spacer"></div>
    <button class="back-btn" onclick={onReturn}>⬅ Back to Work</button>
  </div>

  <!-- Formula bar -->
  <div class="formula-bar">
    <div class="cell-ref">{selectedCell}</div>
    <div class="formula-sep">fx</div>
    <input
      class="formula-input"
      value={selectedCell === 'B15' ? '=SUM(B2:B13)' : ''}
      readonly
      tabindex="-1"
    />
  </div>

  <!-- Spreadsheet grid -->
  <div class="grid-wrapper">
    <table class="grid">
      <thead>
        <tr>
          <th class="row-num-header"></th>
          {#each cols as col (col)}
            <th class="col-header">{col}</th>
          {/each}
        </tr>
      </thead>
      <tbody>
        {#each rows as row, ri (ri)}
          <tr class:header-row={isHeader(ri)} class:total-row={isTotalRow(ri)}>
            <td class="row-num">{ri + 1}</td>
            {#each cols as col, ci (ci)}
              {@const val = row[ci] ?? ''}
              <td
                class="cell"
                class:cell-header={isHeader(ri)}
                class:cell-total={isTotalRow(ri)}
                class:cell-numeric={!isHeader(ri) && !isTotalRow(ri) && isNumeric(val)}
                class:cell-positive={typeof val === 'number' && val > 100 && !isHeader(ri)}
                class:cell-formula={typeof val === 'string' && val.startsWith('=')}
                onclick={() => (selectedCell = cellLabel(col, ri))}
              >
                {typeof val === 'string' && val.startsWith('=') ? '' : val !== '' ? fmt(val) : ''}
              </td>
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  <!-- Status bar -->
  <div class="status-bar">
    <span>Ready</span>
    <span class="status-mid">Sheet1 / Sheet2 / Sheet3</span>
    <span class="status-right">Average: 348,294 &nbsp; Count: 84 &nbsp; Sum: 8,229,750</span>
  </div>
</div>

<style>
  .boss-screen {
    position: fixed;
    inset: 0;
    z-index: 1000;
    display: flex;
    flex-direction: column;
    font-family: 'Segoe UI', Arial, sans-serif;
    font-size: 13px;
    background: #fff;
    color: #000;
  }

  /* Title bar */
  .title-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: #217346; /* Excel green */
    color: #fff;
    padding: 4px 0 4px 8px;
    flex-shrink: 0;
    user-select: none;
  }

  .title-bar-left {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
  }

  .app-icon {
    font-size: 16px;
  }

  .title-bar-controls {
    display: flex;
  }

  .wm-btn {
    background: none;
    border: none;
    color: #fff;
    padding: 4px 14px;
    font-size: 13px;
    cursor: pointer;
    line-height: 1;
    box-shadow: none;
    border-radius: 0;
    font-family: 'Segoe UI', Arial, sans-serif;
  }

  .wm-btn:hover {
    background: rgba(255, 255, 255, 0.15);
  }
  .wm-btn.close:hover {
    background: #e81123;
  }

  /* Menu bar */
  .menu-bar {
    display: flex;
    align-items: center;
    background: #f3f3f3;
    border-bottom: 1px solid #d0d0d0;
    flex-shrink: 0;
  }

  .menu-item {
    background: none;
    border: none;
    box-shadow: none;
    padding: 4px 10px;
    font-size: 13px;
    cursor: pointer;
    color: #333;
    border-radius: 0;
    font-family: 'Segoe UI', Arial, sans-serif;
  }

  .menu-item:hover {
    background: #e8e8e8;
  }

  /* Ribbon */
  .ribbon {
    display: flex;
    align-items: center;
    background: #f3f3f3;
    border-bottom: 1px solid #bbb;
    padding: 4px 8px;
    gap: 4px;
    flex-shrink: 0;
    flex-wrap: nowrap;
    overflow: hidden;
  }

  .ribbon-group {
    display: flex;
    align-items: center;
    gap: 2px;
  }

  .ribbon-sep {
    width: 1px;
    height: 24px;
    background: #ccc;
    margin: 0 4px;
    flex-shrink: 0;
  }

  .ribbon-spacer {
    flex: 1;
  }

  .ribbon-btn {
    background: none;
    border: 1px solid transparent;
    box-shadow: none;
    padding: 3px 7px;
    font-size: 13px;
    cursor: pointer;
    border-radius: 3px;
    color: #333;
    font-family: 'Segoe UI', Arial, sans-serif;
    line-height: 1.4;
  }

  .ribbon-btn:hover {
    background: #e0e0e0;
    border-color: #bbb;
  }
  .fmt-bold {
    font-weight: bold;
  }
  .fmt-italic {
    font-style: italic;
  }
  .currency {
    font-weight: bold;
    color: #217346;
  }

  .ribbon-font {
    font-size: 12px;
    padding: 2px 4px;
    border: 1px solid #ccc;
    border-radius: 3px;
    width: 90px;
    background: #fff;
  }

  .ribbon-size {
    font-size: 12px;
    padding: 2px 4px;
    border: 1px solid #ccc;
    border-radius: 3px;
    width: 44px;
    background: #fff;
  }

  .back-btn {
    background: #217346;
    color: #fff;
    border: none;
    box-shadow: none;
    padding: 5px 14px;
    font-size: 13px;
    cursor: pointer;
    border-radius: 4px;
    font-family: 'Segoe UI', Arial, sans-serif;
    flex-shrink: 0;
    white-space: nowrap;
  }

  .back-btn:hover {
    background: #185c37;
  }

  /* Formula bar */
  .formula-bar {
    display: flex;
    align-items: center;
    border-bottom: 1px solid #ccc;
    background: #fff;
    flex-shrink: 0;
  }

  .cell-ref {
    width: 60px;
    padding: 3px 8px;
    font-size: 13px;
    border-right: 1px solid #ccc;
    text-align: center;
    flex-shrink: 0;
    font-family: 'Segoe UI', Arial, sans-serif;
  }

  .formula-sep {
    padding: 3px 10px;
    color: #888;
    font-size: 12px;
    border-right: 1px solid #ccc;
    flex-shrink: 0;
    font-style: italic;
  }

  .formula-input {
    flex: 1;
    border: none;
    outline: none;
    padding: 3px 8px;
    font-size: 13px;
    font-family: 'Segoe UI', Arial, sans-serif;
    background: #fff;
  }

  /* Grid */
  .grid-wrapper {
    flex: 1;
    overflow: auto;
    background: #fff;
  }

  .grid {
    border-collapse: collapse;
    min-width: 100%;
    table-layout: fixed;
  }

  .row-num-header {
    width: 40px;
    background: #f3f3f3;
    border: 1px solid #d0d0d0;
    position: sticky;
    top: 0;
    left: 0;
    z-index: 3;
  }

  .col-header {
    background: #f3f3f3;
    border: 1px solid #d0d0d0;
    padding: 3px 6px;
    text-align: center;
    font-weight: 600;
    font-size: 12px;
    user-select: none;
    position: sticky;
    top: 0;
    z-index: 2;
    min-width: 90px;
  }

  .col-header:first-of-type {
    min-width: 120px;
  }

  .row-num {
    background: #f3f3f3;
    border: 1px solid #d0d0d0;
    padding: 2px 6px;
    text-align: center;
    font-size: 12px;
    color: #555;
    user-select: none;
    position: sticky;
    left: 0;
    z-index: 1;
    width: 40px;
  }

  .cell {
    border: 1px solid #d0d0d0;
    padding: 2px 6px;
    white-space: nowrap;
    cursor: cell;
    min-width: 90px;
    max-width: 160px;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 13px;
  }

  .cell:first-of-type {
    min-width: 120px;
  }

  .cell:focus,
  .cell:hover {
    background: #e8f4fd;
    outline: none;
  }

  .cell-header {
    background: #217346;
    color: #fff;
    font-weight: 700;
    text-align: center;
    cursor: default;
  }

  .cell-header:hover {
    background: #185c37;
  }

  .cell-numeric {
    text-align: right;
  }

  .cell-positive {
    color: #c00000;
  }

  .cell-total {
    background: #e2efda;
    font-weight: 700;
    text-align: right;
    font-style: italic;
  }

  .cell-formula {
    color: #0563c1;
    text-align: right;
  }

  .header-row {
  }

  .total-row td {
    border-top: 2px solid #217346;
  }

  /* Status bar */
  .status-bar {
    display: flex;
    align-items: center;
    background: #217346;
    color: #fff;
    padding: 2px 10px;
    font-size: 12px;
    flex-shrink: 0;
    gap: 1rem;
  }

  .status-mid {
    flex: 1;
    text-align: center;
  }
  .status-right {
    margin-left: auto;
  }
</style>
