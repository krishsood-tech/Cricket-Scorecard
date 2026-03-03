// ===================================================
//  CricScore Pro - script.js
//  Fixed: inputs no longer lose focus on each keypress
// ===================================================

let currentInnings = 1;
let isLive = true;
let isLight = false;
let innings = {
  1: { batsmen: [], bowlers: [] },
  2: { batsmen: [], bowlers: [] }
};

const DISMISSALS = ['batting', 'not out', 'bowled', 'caught', 'lbw', 'run out', 'stumped', 'hit wicket'];

// ===== INIT =====
function init() {
  for (let i = 0; i < 3; i++) addBatsmanSilent();
  for (let i = 0; i < 2; i++) addBowlerSilent();
  renderBatting();
  renderBowling();
  updateSummary();
}

// ===== ADD ROWS (silent = no re-render of table, just push data) =====
function addBatsmanSilent() {
  innings[currentInnings].batsmen.push({ name:'', dismissal:'batting', bowler:'', runs:0, balls:0, fours:0, sixes:0 });
}
function addBowlerSilent() {
  innings[currentInnings].bowlers.push({ name:'', overs:0, maidens:0, runs:0, wickets:0 });
}

function addBatsman() {
  addBatsmanSilent();
  renderBatting();
  updateSummary();
}
function addBowler() {
  addBowlerSilent();
  renderBowling();
  updateSummary();
}

// ===== REMOVE ROWS =====
function removeBat(i) {
  innings[currentInnings].batsmen.splice(i, 1);
  renderBatting();
  updateSummary();
}
function removeBowl(i) {
  innings[currentInnings].bowlers.splice(i, 1);
  renderBowling();
  updateSummary();
}

// ===================================================
//  UPDATE DATA FROM INPUTS
//  These only update the data object + summary stats.
//  They do NOT re-render the tables (no flicker/focus loss).
// ===================================================
function updateBat(i, field, val) {
  innings[currentInnings].batsmen[i][field] = (field === 'runs' || field === 'balls' || field === 'fours' || field === 'sixes') ? (+val || 0) : val;
  // Only update the strike rate cell for this row, not the whole table
  if (field === 'runs' || field === 'balls') {
    const b = innings[currentInnings].batsmen[i];
    const sr = b.balls > 0 ? ((b.runs / b.balls) * 100).toFixed(1) : '0.0';
    const srCell = document.querySelector('#battingBody tr:nth-child(' + (i+1) + ') .calc-cell');
    if (srCell) srCell.textContent = sr;
  }
  updateSummary();
}

function updateBowl(i, field, val) {
  innings[currentInnings].bowlers[i][field] = (field === 'overs' || field === 'maidens' || field === 'runs' || field === 'wickets') ? (+val || 0) : val;
  // Only update the economy cell for this row
  if (field === 'overs' || field === 'runs') {
    const b = innings[currentInnings].bowlers[i];
    const econ = b.overs > 0 ? (b.runs / b.overs).toFixed(2) : '0.00';
    const econCell = document.querySelector('#bowlingBody tr:nth-child(' + (i+1) + ') .calc-cell');
    if (econCell) econCell.textContent = econ;
  }
  updateSummary();
}

// Triggered by team name inputs
function updateAll() { updateSummary(); }

// ===================================================
//  FULL TABLE RENDERS (called only when rows added/removed/switched)
// ===================================================
function getTopScorerIdx() {
  const bats = innings[currentInnings].batsmen;
  if (!bats.length) return -1;
  return bats.reduce((mi, b, i, a) => b.runs > a[mi].runs ? i : mi, 0);
}
function getBestBowlerIdx() {
  const bwls = innings[currentInnings].bowlers;
  if (!bwls.length) return -1;
  return bwls.reduce((mi, b, i, a) => {
    if (b.wickets > a[mi].wickets) return i;
    if (b.wickets === a[mi].wickets && b.runs < a[mi].runs) return i;
    return mi;
  }, 0);
}

function renderBatting() {
  const tbody = document.getElementById('battingBody');
  const bats = innings[currentInnings].batsmen;
  tbody.innerHTML = '';
  bats.forEach((b, i) => {
    const sr = b.balls > 0 ? ((b.runs / b.balls) * 100).toFixed(1) : '0.0';
    const row = document.createElement('tr');
    const options = DISMISSALS.map(d =>
      '<option value="' + d + '"' + (b.dismissal === d ? ' selected' : '') + '>' + d + '</option>'
    ).join('');
    row.innerHTML =
      '<td class="row-num">' + (i+1) + '</td>' +
      '<td><input type="text" placeholder="Player name" value="' + escVal(b.name) + '" onchange="updateBat(' + i + ',\'name\',this.value)"/></td>' +
      '<td><select class="dismissal-select" onchange="updateBat(' + i + ',\'dismissal\',this.value)">' + options + '</select></td>' +
      '<td><input type="text" placeholder="Bowler" value="' + escVal(b.bowler) + '" onchange="updateBat(' + i + ',\'bowler\',this.value)"/></td>' +
      '<td><input type="number" min="0" placeholder="0" value="' + (b.runs||'') + '" onchange="updateBat(' + i + ',\'runs\',this.value)"/></td>' +
      '<td><input type="number" min="0" placeholder="0" value="' + (b.balls||'') + '" onchange="updateBat(' + i + ',\'balls\',this.value)"/></td>' +
      '<td><input type="number" min="0" placeholder="0" value="' + (b.fours||'') + '" onchange="updateBat(' + i + ',\'fours\',this.value)"/></td>' +
      '<td><input type="number" min="0" placeholder="0" value="' + (b.sixes||'') + '" onchange="updateBat(' + i + ',\'sixes\',this.value)"/></td>' +
      '<td class="calc-cell">' + sr + '</td>' +
      '<td><button class="btn-remove" onclick="removeBat(' + i + ')">&#x2715;</button></td>';
    tbody.appendChild(row);
  });
  refreshHighlights();
}

function renderBowling() {
  const tbody = document.getElementById('bowlingBody');
  const bwls = innings[currentInnings].bowlers;
  tbody.innerHTML = '';
  bwls.forEach((b, i) => {
    const econ = b.overs > 0 ? (b.runs / b.overs).toFixed(2) : '0.00';
    const row = document.createElement('tr');
    row.innerHTML =
      '<td class="row-num">' + (i+1) + '</td>' +
      '<td><input type="text" placeholder="Bowler name" value="' + escVal(b.name) + '" onchange="updateBowl(' + i + ',\'name\',this.value)"/></td>' +
      '<td><input type="number" min="0" step="0.1" placeholder="0" value="' + (b.overs||'') + '" onchange="updateBowl(' + i + ',\'overs\',this.value)"/></td>' +
      '<td><input type="number" min="0" placeholder="0" value="' + (b.maidens||'') + '" onchange="updateBowl(' + i + ',\'maidens\',this.value)"/></td>' +
      '<td><input type="number" min="0" placeholder="0" value="' + (b.runs||'') + '" onchange="updateBowl(' + i + ',\'runs\',this.value)"/></td>' +
      '<td><input type="number" min="0" max="10" placeholder="0" value="' + (b.wickets||'') + '" onchange="updateBowl(' + i + ',\'wickets\',this.value)"/></td>' +
      '<td class="calc-cell">' + econ + '</td>' +
      '<td><button class="btn-remove" onclick="removeBowl(' + i + ')">&#x2715;</button></td>';
    tbody.appendChild(row);
  });
}

// Update only highlight classes without rebuilding rows
function refreshHighlights() {
  const bats = innings[currentInnings].batsmen;
  const topIdx = getTopScorerIdx();
  document.querySelectorAll('#battingBody tr').forEach((row, i) => {
    row.classList.toggle('top-performer', i === topIdx && bats[i] && bats[i].runs > 0);
  });
  const bwls = innings[currentInnings].bowlers;
  const bestIdx = getBestBowlerIdx();
  document.querySelectorAll('#bowlingBody tr').forEach((row, i) => {
    row.classList.toggle('top-performer', i === bestIdx && bwls[i] && bwls[i].wickets > 0);
  });
}

// Escape values for HTML attribute use
function escVal(str) {
  return String(str || '').replace(/"/g, '&quot;');
}

// ===================================================
//  SUMMARY UPDATE (lightweight, no DOM rebuilds)
// ===================================================
function updateSummary() {
  const bats = innings[currentInnings].batsmen;
  const bwls = innings[currentInnings].bowlers;

  const totalRuns  = bats.reduce((s,b) => s+(b.runs||0), 0);
  const wickets    = bats.filter(b => !['batting','not out'].includes(b.dismissal)).length;
  const totalOvers = bwls.reduce((s,b) => s+(b.overs||0), 0);
  const rr         = totalOvers > 0 ? (totalRuns/totalOvers).toFixed(2) : '0.00';
  const fours      = bats.reduce((s,b) => s+(b.fours||0), 0);
  const sixes      = bats.reduce((s,b) => s+(b.sixes||0), 0);
  const topRuns    = bats.length ? Math.max(...bats.map(b => b.runs||0)) : 0;

  if (currentInnings === 1) {
    document.getElementById('scoreA').textContent = totalRuns + '/' + wickets;
    document.getElementById('oversA').textContent = totalOvers.toFixed(1) + ' overs';
  } else {
    document.getElementById('scoreB').textContent = totalRuns + '/' + wickets;
    document.getElementById('oversB').textContent = totalOvers.toFixed(1) + ' overs';
  }

  document.getElementById('rrA').textContent  = rr;
  document.getElementById('wktA').textContent = wickets;

  const ti = getTopScorerIdx();
  document.getElementById('topScorer').textContent =
    (ti >= 0 && bats[ti] && bats[ti].name) ? bats[ti].name + ' ' + (bats[ti].runs||0) : '-';

  const bi = getBestBowlerIdx();
  document.getElementById('bestBowler').textContent =
    (bi >= 0 && bwls[bi] && bwls[bi].name) ? bwls[bi].name + ' ' + (bwls[bi].wickets||0) + '/' + (bwls[bi].runs||0) : '-';

  document.getElementById('sumRuns').textContent  = totalRuns;
  document.getElementById('sumWkts').textContent  = wickets;
  document.getElementById('sumOvers').textContent = totalOvers.toFixed(1);
  document.getElementById('sumRR').textContent    = rr;
  document.getElementById('sumBound').textContent = fours + sixes;
  document.getElementById('sumTop').textContent   = topRuns;

  refreshHighlights();
}

// ===== INNINGS SWITCH =====
function switchInnings(n, el) {
  currentInnings = n;
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  renderBatting();
  renderBowling();
  updateSummary();
}

// ===== THEME =====
function toggleTheme() {
  isLight = !isLight;
  document.body.classList.toggle('light', isLight);
  showToast(isLight ? 'Light mode on' : 'Dark mode on');
}

// ===== STATUS =====
function toggleStatus() {
  isLive = !isLive;
  const badge = document.getElementById('statusBadge');
  badge.textContent = isLive ? '● LIVE' : '✓ COMPLETED';
  badge.className = 'status-badge ' + (isLive ? 'status-live' : 'status-completed');
  showToast(isLive ? 'Match set to LIVE' : 'Match marked COMPLETED');
}

// ===== SAVE =====
function saveToLocal() {
  localStorage.setItem('crickscore_data', JSON.stringify({
    teamA: document.getElementById('teamA').value,
    teamB: document.getElementById('teamB').value,
    innings, isLive
  }));
  showToast('Scorecard saved!');
}

// ===== LOAD =====
function loadFromLocal() {
  const raw = localStorage.getItem('crickscore_data');
  if (!raw) { showToast('No saved data found'); return; }
  const data = JSON.parse(raw);
  document.getElementById('teamA').value = data.teamA || 'Team India';
  document.getElementById('teamB').value = data.teamB || 'Team Australia';
  innings = data.innings;
  isLive  = data.isLive;
  const badge = document.getElementById('statusBadge');
  badge.textContent = isLive ? '● LIVE' : '✓ COMPLETED';
  badge.className = 'status-badge ' + (isLive ? 'status-live' : 'status-completed');
  renderBatting();
  renderBowling();
  updateSummary();
  showToast('Scorecard loaded!');
}

// ===== RESET =====
function resetMatch() {
  if (!confirm('Reset the entire match? This cannot be undone.')) return;
  innings = { 1: { batsmen: [], bowlers: [] }, 2: { batsmen: [], bowlers: [] } };
  document.getElementById('teamA').value = 'Team India';
  document.getElementById('teamB').value = 'Team Australia';
  document.getElementById('scoreA').textContent = '0/0';
  document.getElementById('scoreB').textContent = '0/0';
  document.getElementById('oversA').textContent = '0.0 overs';
  document.getElementById('oversB').textContent = '0.0 overs';
  currentInnings = 1;
  document.querySelectorAll('.tab').forEach((t, i) => t.classList.toggle('active', i === 0));
  init();
  showToast('Match reset!');
}

// ===== PDF =====
function downloadPDF() {
  const teamA = document.getElementById('teamA').value;
  const teamB = document.getElementById('teamB').value;
  const bats  = innings[currentInnings].batsmen;
  const bwls  = innings[currentInnings].bowlers;

  let battingRows = bats.map((b, i) => {
    const sr = b.balls > 0 ? ((b.runs / b.balls) * 100).toFixed(1) : '0.0';
    return '<tr><td>'+(i+1)+'</td><td>'+(b.name||'-')+'</td><td>'+b.dismissal+'</td><td>'+(b.bowler||'-')+'</td><td>'+b.runs+'</td><td>'+b.balls+'</td><td>'+b.fours+'</td><td>'+b.sixes+'</td><td>'+sr+'</td></tr>';
  }).join('');

  let bowlingRows = bwls.map((b, i) => {
    const econ = b.overs > 0 ? (b.runs / b.overs).toFixed(2) : '0.00';
    return '<tr><td>'+(i+1)+'</td><td>'+(b.name||'-')+'</td><td>'+b.overs+'</td><td>'+b.maidens+'</td><td>'+b.runs+'</td><td>'+b.wickets+'</td><td>'+econ+'</td></tr>';
  }).join('');

  const html = '<html><head><title>Cricket Scorecard</title>'
    + '<style>body{font-family:Arial,sans-serif;padding:28px;color:#111}h1{color:#007a5e;border-bottom:2px solid #007a5e;padding-bottom:8px}h2{color:#333;margin-top:22px}p{color:#555;font-size:13px;margin-bottom:16px}table{width:100%;border-collapse:collapse}th{background:#007a5e;color:#fff;padding:9px 10px;text-align:left;font-size:12px}td{padding:8px 10px;border-bottom:1px solid #ddd;font-size:12px}tr:nth-child(even){background:#f4faf8}</style>'
    + '</head><body>'
    + '<h1>Cricket Scorecard</h1><p><strong>'+teamA+'</strong> vs <strong>'+teamB+'</strong> | Innings '+currentInnings+' | '+(isLive?'LIVE':'COMPLETED')+'</p>'
    + '<h2>Batting</h2><table><thead><tr><th>#</th><th>Batsman</th><th>Dismissal</th><th>Bowler</th><th>R</th><th>B</th><th>4s</th><th>6s</th><th>SR</th></tr></thead><tbody>'+battingRows+'</tbody></table>'
    + '<h2>Bowling</h2><table><thead><tr><th>#</th><th>Bowler</th><th>O</th><th>M</th><th>R</th><th>W</th><th>ECON</th></tr></thead><tbody>'+bowlingRows+'</tbody></table>'
    + '</body></html>';

  const win = window.open('', '_blank');
  win.document.write(html);
  win.document.close();
  win.print();
  showToast('PDF ready to save!');
}

// ===== TOAST =====
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

// ===== START =====
init();