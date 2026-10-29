/* ==========================================================================
   Smart Water Guardian — Dashboard Application
   Renders the post-login views from the simulation engine data.
   ========================================================================== */
(function (global) {
  'use strict';

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function esc(str) {
    return String(str === undefined || str === null ? '' : str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function fmt(n) { return Number(n).toLocaleString('en-IN'); }

  /* ---------------------------------------------------------------------
     Session (delegates to the shared Store helper)
     --------------------------------------------------------------------- */
  function loadSession() {
    return Store.get();
  }

  function clearSession() {
    Store.remove();
  }

  function initials(name) {
    if (!name) return 'SW';
    return name.trim().split(/\s+/).slice(0, 2)
      .map(function (w) { return w.charAt(0).toUpperCase(); }).join('') || 'SW';
  }

  /* ---------------------------------------------------------------------
     Toast
     --------------------------------------------------------------------- */
  function toast(title, body, kind) {
    var stack = $('.toast-stack');
    if (!stack) {
      stack = document.createElement('div');
      stack.className = 'toast-stack';
      stack.setAttribute('role', 'status');
      stack.setAttribute('aria-live', 'polite');
      document.body.appendChild(stack);
    }

    var iconName = kind === 'error' ? 'alertCircle' : kind === 'success' ? 'checkCircle' : 'info';
    var el = document.createElement('div');
    el.className = 'toast toast--' + (kind || 'info');
    el.innerHTML =
      '<span class="toast__icon">' + SVG.icon(iconName) + '</span>' +
      '<div><div class="toast__title"></div><div class="toast__body"></div></div>';
    el.querySelector('.toast__title').textContent = title;
    if (body) el.querySelector('.toast__body').textContent = body;
    stack.appendChild(el);

    setTimeout(function () {
      el.classList.add('is-leaving');
      setTimeout(function () {
        if (el.parentNode) el.parentNode.removeChild(el);
      }, 260);
    }, 3800);
  }

  /* ---------------------------------------------------------------------
     Shared partials
     --------------------------------------------------------------------- */
  function statCard(cfg) {
    var trendHtml = '';
    if (cfg.trend) {
      var dir = cfg.trend.dir || 'flat';
      var icon = dir === 'up' ? 'arrowUp' : dir === 'down' ? 'arrowDown' : 'chevronRight';
      trendHtml = '<span class="trend trend--' + dir + '">' + SVG.icon(icon) + esc(cfg.trend.text) + '</span>';
    }

    return '' +
      '<article class="stat" style="--stat-accent:' + cfg.accent + ';--stat-icon-bg:' + cfg.iconBg + '">' +
        '<div class="stat__head">' +
          '<span class="stat__label">' + esc(cfg.label) + '</span>' +
          '<span class="stat__icon">' + SVG.icon(cfg.icon) + '</span>' +
        '</div>' +
        '<div class="stat__value">' + esc(cfg.value) +
          (cfg.unit ? '<span class="stat__unit">' + esc(cfg.unit) + '</span>' : '') +
        '</div>' +
        '<div class="stat__foot">' + trendHtml + '<span>' + esc(cfg.foot) + '</span></div>' +
      '</article>';
  }

  function deviationCell(zone) {
    var dev = zone.deviation;
    var pct = Math.min(Math.abs(dev), 100);
    var cls = zone.status === 'critical' ? ' deviation__fill--danger'
            : zone.status === 'warning'  ? ' deviation__fill--warning' : '';
    var sign = dev > 0 ? '+' : '';

    return '' +
      '<div class="deviation">' +
        '<div class="deviation__track">' +
          '<div class="deviation__fill' + cls + '" style="width:' + pct + '%"></div>' +
          '<span class="deviation__mark" aria-hidden="true"></span>' +
        '</div>' +
        '<span class="deviation__value">' + sign + dev + '%</span>' +
      '</div>';
  }

  function statusBadge(status) {
    if (status === 'critical') {
      return '<span class="badge badge--danger"><span class="badge__dot"></span>Critical</span>';
    }
    if (status === 'warning') {
      return '<span class="badge badge--warning"><span class="badge__dot"></span>Warning</span>';
    }
    return '<span class="badge badge--success"><span class="badge__dot"></span>Normal</span>';
  }


  /* ---------------------------------------------------------------------
     Views
     --------------------------------------------------------------------- */
  var Views = {};

  /* ---------------- Dashboard ---------------- */
  Views.dashboard = function () {
    var s = Engine.summary();
    var anomalies = Engine.anomalies();
    var series = Engine.weeklySeries();
    var reuse = Engine.reuse();

    var stats = [
      statCard({
        label: 'Campus conservation score', icon: 'gauge',
        value: s.conservationScore, unit: '/100',
        accent: 'var(--navy-700)', iconBg: 'var(--navy-50)',
        trend: { dir: 'up', text: '+4 pts' }, foot: 'vs. last cycle'
      }),
      statCard({
        label: 'Water saved this month', icon: 'dropletCheck',
        value: fmt(s.waterSavedMonthly), unit: 'L',
        accent: 'var(--success-500)', iconBg: 'var(--success-50)',
        trend: { dir: 'up', text: '+12%' }, foot: 'reused + prevented'
      }),
      statCard({
        label: 'Total daily consumption', icon: 'activity',
        value: fmt(s.currentTotal), unit: 'L/day',
        accent: 'var(--aqua-600)', iconBg: 'var(--aqua-100)',
        trend: { dir: 'up', text: '+' + s.deviationPct + '%' },
        foot: 'baseline ' + fmt(s.baselineTotal) + ' L/day'
      }),
      statCard({
        label: 'Active alerts', icon: 'alert',
        value: s.criticalCount + s.warningCount,
        accent: 'var(--danger-500)', iconBg: 'var(--danger-50)',
        trend: { dir: 'flat', text: s.criticalCount + ' critical' },
        foot: 'across ' + s.zoneCount + ' monitored zones'
      })
    ].join('');

    /* Zone rows */
    var rows = s.zones.map(function (z) {
      return '<tr>' +
        '<td><span class="zonename"><span class="zoneicon">' + SVG.icon(z.icon) + '</span>' + esc(z.name) + '</span></td>' +
        '<td><span class="badge badge--neutral">' + esc(z.category) + '</span></td>' +
        '<td class="zonetable__num">' + fmt(z.baseline) + '</td>' +
        '<td class="zonetable__num">' + fmt(z.current) + '</td>' +
        '<td>' + deviationCell(z) + '</td>' +
        '<td class="zonetable__num">' + z.tankLevel + '%</td>' +
        '<td>' + statusBadge(z.status) + '</td>' +
      '</tr>';
    }).join('');

    /* Anomaly feed */
    var feed = anomalies.slice(0, 4).map(function (a) {
      var meta = Engine.ANOMALY_TYPES[a.type] || Engine.ANOMALY_TYPES.anomaly;
      var tone = a.severity === 'critical' ? 'danger' : 'warning';
      return '<li class="feeditem">' +
        '<span class="feeditem__icon feeditem__icon--' + tone + '">' + SVG.icon(meta.icon) + '</span>' +
        '<div class="feeditem__body">' +
          '<div class="feeditem__title">' + esc(a.title) + '</div>' +
          '<div class="feeditem__meta">' + esc(a.detail) + '</div>' +
        '</div>' +
        '<div class="feeditem__side">' +
          '<span class="badge badge--' + tone + '">' + esc(meta.label) + '</span>' +
          '<span class="feeditem__meta">' + esc(a.time) + '</span>' +
        '</div>' +
      '</li>';
    }).join('');

    /* Weekly chart */
    var max = Math.max.apply(null, series.map(function (d) { return d.value; }));
    var chart = series.map(function (d) {
      var h = Math.round((d.value / max) * 100);
      var over = d.value > d.baseline;
      return '<div class="chart__col">' +
        '<div class="chart__bar' + (over ? '' : ' chart__bar--alt') + '" style="height:' + h + '%" title="' + fmt(d.value) + ' L/day"></div>' +
        '<span class="chart__bar-label">' + esc(d.label) + '</span>' +
      '</div>';
    }).join('');

    /* Conservation score ring */
    var pct = s.conservationScore;
    var circ = 2 * Math.PI * 52;
    var offset = circ - (pct / 100) * circ;
    var breakdown = Engine.scoreBreakdown().map(function (r) {
      return '<div class="score__row">' +
        '<div class="score__row-head">' +
          '<span class="score__row-label">' + esc(r.label) + '</span>' +
          '<span class="score__row-value">' + r.value + '%</span>' +
        '</div>' +
        '<div class="score__bar"><div class="score__bar-fill" style="width:' + r.value + '%"></div></div>' +
      '</div>';
    }).join('');

    return '' +
    '<div class="pagehead">' +
      '<div>' +
        '<h2 class="pagehead__title">Campus Water Overview</h2>' +
        '<p class="pagehead__sub">Monitoring ' + s.zoneCount + ' zones across ' + s.sensorCount + ' simulated sensors &middot; live simulation</p>' +
      '</div>' +
      '<div class="pagehead__actions">' +
        '<button class="btn btn--secondary btn--sm" type="button" data-refresh>' + SVG.icon('refresh') + 'Refresh</button>' +
        '<button class="btn btn--aqua btn--sm" type="button" data-go="report">' + SVG.icon('plus') + 'Report issue</button>' +
      '</div>' +
    '</div>' +

    '<div class="statgrid">' + stats + '</div>' +

    '<div class="panelgrid panelgrid--wide">' +
      '<section class="card">' +
        '<div class="card__header">' +
          '<div><h3 class="card__title">Zone monitoring</h3><p class="card__subtitle">Expected vs. actual daily consumption per zone</p></div>' +
          '<button class="btn btn--ghost btn--sm" type="button" data-go="zones">View all' + SVG.icon('chevronRight') + '</button>' +
        '</div>' +
        '<div class="card__body" style="padding:0">' +
          '<div class="table-wrap">' +
            '<table class="zonetable">' +
              '<thead><tr>' +
                '<th scope="col">Zone</th><th scope="col">Type</th>' +
                '<th scope="col">Baseline (L/day)</th><th scope="col">Current (L/day)</th>' +
                '<th scope="col">Deviation</th><th scope="col">Tank</th><th scope="col">Status</th>' +
              '</tr></thead>' +
              '<tbody>' + rows + '</tbody>' +
            '</table>' +
          '</div>' +
        '</div>' +
      '</section>' +

      '<section class="card">' +
        '<div class="card__header">' +
          '<div><h3 class="card__title">Conservation score</h3><p class="card__subtitle">Composite campus efficiency</p></div>' +
        '</div>' +
        '<div class="card__body">' +
          '<div class="score">' +
            '<div class="score__ring">' +
              '<svg viewBox="0 0 120 120" aria-hidden="true">' +
                '<defs>' +
                  '<linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">' +
                    '<stop offset="0%" stop-color="#17B3C4"/><stop offset="100%" stop-color="#002060"/>' +
                  '</linearGradient>' +
                '</defs>' +
                '<circle class="score__track" cx="60" cy="60" r="52"></circle>' +
                '<circle class="score__progress" cx="60" cy="60" r="52" stroke-dasharray="' + circ.toFixed(1) + '" stroke-dashoffset="' + offset.toFixed(1) + '"></circle>' +
              '</svg>' +
              '<div class="score__center">' +
                '<span class="score__value">' + pct + '</span>' +
                '<span class="score__max">out of 100</span>' +
              '</div>' +
            '</div>' +
            '<div class="score__breakdown">' + breakdown + '</div>' +
          '</div>' +
        '</div>' +
      '</section>' +
    '</div>' +

    '<div class="panelgrid panelgrid--wide">' +
      '<section class="card">' +
        '<div class="card__header">' +
          '<div><h3 class="card__title">Weekly consumption</h3><p class="card__subtitle">Campus-wide litres per day</p></div>' +
        '</div>' +
        '<div class="card__body">' +
          '<div class="chart">' + chart + '</div>' +
          '<div class="chart__legend">' +
            '<span class="chart__legend-item"><span class="chart__legend-swatch" style="background:var(--aqua-500)"></span>Above baseline</span>' +
            '<span class="chart__legend-item"><span class="chart__legend-swatch" style="background:var(--navy-600)"></span>Within baseline</span>' +
          '</div>' +
        '</div>' +
      '</section>' +

      '<section class="card">' +
        '<div class="card__header">' +
          '<div><h3 class="card__title">Reuse &amp; savings</h3><p class="card__subtitle">RO reject recovery flow</p></div>' +
        '</div>' +
        '<div class="card__body">' +
          '<div class="reuse">' +
            '<div class="reuse__flow">' +
              '<div class="reuse__stage reuse__stage--source">' +
                '<div class="reuse__stage-label">Reject</div>' +
                '<div class="reuse__stage-value">' + reuse.rejectWater + '</div>' +
                '<div class="reuse__stage-sub">L/day</div>' +
              '</div>' +
              '<div class="reuse__stage reuse__stage--reuse">' +
                '<div class="reuse__stage-label">Reused</div>' +
                '<div class="reuse__stage-value">' + reuse.reused + '</div>' +
                '<div class="reuse__stage-sub">L/day &rarr; irrigation</div>' +
              '</div>' +
              '<div class="reuse__stage reuse__stage--saved">' +
                '<div class="reuse__stage-label">Fresh saved</div>' +
                '<div class="reuse__stage-value">' + reuse.freshWaterSaved + '</div>' +
                '<div class="reuse__stage-sub">L/day (' + reuse.savedPct + '%)</div>' +
              '</div>' +
            '</div>' +
            '<p class="feeditem__meta">' +
              'Recovering RO reject water for irrigation avoids re-pumping fresh water. ' +
              'Monthly campus saving estimate: <strong>' + fmt(s.waterSavedMonthly) + ' L</strong>.' +
            '</p>' +
          '</div>' +
        '</div>' +
      '</section>' +
    '</div>' +
    '<section class="card" style="margin-bottom:var(--space-6)">' +
      '<div class="card__header">' +
        '<div><h3 class="card__title">Wastage alerts</h3><p class="card__subtitle">Detected anomalies ranked by priority</p></div>' +
        '<button class="btn btn--ghost btn--sm" type="button" data-go="anomalies">Open alerts' + SVG.icon('chevronRight') + '</button>' +
      '</div>' +
      '<div class="card__body" style="padding:0">' +
        '<ul class="feed">' + feed + '</ul>' +
      '</div>' +
    '</section>';
  };

  /* ---------------- Zones ---------------- */
  Views.zones = function () {
    var s = Engine.summary();
    var rows = s.zones.map(function (z) {
      return '<tr>' +
        '<td><span class="zonename"><span class="zoneicon">' + SVG.icon(z.icon) + '</span>' + esc(z.name) + '</span></td>' +
        '<td><span class="badge badge--neutral">' + esc(z.category) + '</span></td>' +
        '<td class="zonetable__num">' + fmt(z.baseline) + '</td>' +
        '<td class="zonetable__num">' + fmt(z.current) + '</td>' +
        '<td>' + deviationCell(z) + '</td>' +
        '<td class="zonetable__num">' + z.tankLevel + '%</td>' +
        '<td class="zonetable__num">' + z.sensors + '</td>' +
        '<td>' + statusBadge(z.status) + '</td>' +
      '</tr>';
    }).join('');

    var cards = s.zones.map(function (z) {
      var tone = z.status === 'critical' ? 'var(--danger-500)'
               : z.status === 'warning'  ? 'var(--warning-500)'
               : 'var(--success-500)';
      return '<article class="card card--padded">' +
        '<div class="stat__head">' +
          '<span class="zonename"><span class="zoneicon">' + SVG.icon(z.icon) + '</span>' + esc(z.name) + '</span>' +
          statusBadge(z.status) +
        '</div>' +
        '<div class="stat__value" style="font-size:var(--text-2xl)">' + fmt(z.current) +
          '<span class="stat__unit">L/day</span></div>' +
        '<div class="stat__foot">' +
          '<span>Baseline ' + fmt(z.baseline) + ' L/day</span>' +
          '<span class="trend trend--' + (z.deviation > 0 ? 'up' : 'flat') + '" style="margin-left:auto">' +
            (z.deviation > 0 ? '+' : '') + z.deviation + '%</span>' +
        '</div>' +
        '<div class="score__bar" style="margin-top:var(--space-4)">' +
          '<div class="score__bar-fill" style="width:' + z.tankLevel + '%;background:' + tone + '"></div>' +
        '</div>' +
        '<div class="stat__foot"><span>Tank level ' + z.tankLevel + '%</span>' +
          '<span style="margin-left:auto">' + z.sensors + ' sensors</span></div>' +
      '</article>';
    }).join('');

    return '' +
    '<div class="pagehead">' +
      '<div>' +
        '<h2 class="pagehead__title">Water Zones</h2>' +
        '<p class="pagehead__sub">Every monitored area of the campus, with baseline and deviation tracking</p>' +
      '</div>' +
      '<div class="pagehead__actions">' +
        '<button class="btn btn--secondary btn--sm" type="button" data-export>' + SVG.icon('download') + 'Export</button>' +
      '</div>' +
    '</div>' +

    '<div class="statgrid" style="grid-template-columns:repeat(auto-fit,minmax(280px,1fr))">' + cards + '</div>' +

    '<section class="card">' +
      '<div class="card__header">' +
        '<div><h3 class="card__title">All zones</h3><p class="card__subtitle">Baseline vs. current consumption</p></div>' +
        '<span class="badge badge--navy">' + s.zoneCount + ' zones</span>' +
      '</div>' +
      '<div class="card__body" style="padding:0">' +
        '<div class="table-wrap">' +
          '<table class="zonetable">' +
            '<thead><tr>' +
              '<th scope="col">Zone</th><th scope="col">Type</th>' +
              '<th scope="col">Baseline (L/day)</th><th scope="col">Current (L/day)</th>' +
              '<th scope="col">Deviation</th><th scope="col">Tank</th><th scope="col">Sensors</th><th scope="col">Status</th>' +
            '</tr></thead>' +
            '<tbody>' + rows + '</tbody>' +
          '</table>' +
        '</div>' +
      '</div>' +
    '</section>';
  };


  /* ---------------- Anomalies / Wastage alerts ---------------- */
  Views.anomalies = function () {
    var list = Engine.anomalies();

    var items = list.map(function (a) {
      var meta = Engine.ANOMALY_TYPES[a.type] || Engine.ANOMALY_TYPES.anomaly;
      var tone = a.severity === 'critical' ? 'danger' : 'warning';
      return '<li class="feeditem">' +
        '<span class="feeditem__icon feeditem__icon--' + tone + '">' + SVG.icon(meta.icon) + '</span>' +
        '<div class="feeditem__body">' +
          '<div class="feeditem__title">' + esc(a.title) + '</div>' +
          '<div class="feeditem__meta">' + esc(a.detail) + '</div>' +
          '<div class="alert alert--' + tone + '" style="margin-top:var(--space-3)">' +
            SVG.icon('sparkle') +
            '<span><strong>Recommended action:</strong> ' + esc(a.action) + '</span>' +
          '</div>' +
        '</div>' +
        '<div class="feeditem__side">' +
          '<span class="badge badge--' + tone + '">' + esc(meta.label) + '</span>' +
          '<span class="feeditem__meta">' + esc(a.time) + '</span>' +
          '<button class="btn btn--secondary btn--sm" type="button" data-ticket="' + esc(a.id) + '">Create ticket</button>' +
        '</div>' +
      '</li>';
    }).join('');

    return '' +
    '<div class="pagehead">' +
      '<div>' +
        '<h2 class="pagehead__title">Wastage Alerts</h2>' +
        '<p class="pagehead__sub">Anomalies detected by comparing simulated readings against configured baselines</p>' +
      '</div>' +
      '<div class="pagehead__actions">' +
        '<button class="btn btn--secondary btn--sm" type="button" data-refresh>' + SVG.icon('refresh') + 'Re-run detection</button>' +
      '</div>' +
    '</div>' +

    '<div class="alert alert--info" style="margin-bottom:var(--space-5)">' +
      SVG.icon('info') +
      '<span>Detection thresholds: warning at <strong>' + Engine.THRESHOLDS.warning + '%</strong> above baseline, critical at <strong>' + Engine.THRESHOLDS.critical + '%</strong>, overflow risk at <strong>' + Engine.THRESHOLDS.overflow + '%</strong> tank level.</span>' +
    '</div>' +

    '<section class="card">' +
      '<div class="card__header">' +
        '<div><h3 class="card__title">' + list.length + ' open alerts</h3><p class="card__subtitle">Ranked by severity</p></div>' +
      '</div>' +
      '<div class="card__body" style="padding:0">' +
        '<ul class="feed">' + items + '</ul>' +
      '</div>' +
    '</section>';
  };

  /* ---------------- Report issue ---------------- */
  Views.report = function () {
    var zoneOptions = Engine.zones().map(function (z) {
      return '<option value="' + esc(z.name) + '">' + esc(z.name) + '</option>';
    }).join('');

    var issueTypes = ['Leak / pipe burst', 'Running tap or flush', 'Overflow / tank issue',
                      'Irrigation overwatering', 'Unauthorised usage', 'Other'].map(function (t) {
      return '<option value="' + esc(t) + '">' + esc(t) + '</option>';
    }).join('');

    return '' +
    '<div class="pagehead">' +
      '<div>' +
        '<h2 class="pagehead__title">Report an Issue</h2>' +
        '<p class="pagehead__sub">Manual reports complement automatic detection — each report enters a trackable repair workflow</p>' +
      '</div>' +
    '</div>' +

    '<div class="panelgrid panelgrid--wide">' +
      '<section class="card">' +
        '<div class="card__header">' +
          '<div><h3 class="card__title">New report</h3><p class="card__subtitle">Report &rarr; repair &rarr; resolve</p></div>' +
        '</div>' +
        '<div class="card__body">' +
          '<form id="report-form" novalidate>' +
            '<div class="reportgrid">' +
              '<div class="field">' +
                '<label class="field__label" for="report-zone">Water zone</label>' +
                '<div class="field__control">' +
                  '<select class="input" id="report-zone">' + zoneOptions + '</select>' +
                '</div>' +
              '</div>' +
              '<div class="field">' +
                '<label class="field__label" for="report-type">Issue type</label>' +
                '<div class="field__control">' +
                  '<select class="input" id="report-type">' + issueTypes + '</select>' +
                '</div>' +
              '</div>' +
            '</div>' +

            '<div class="field">' +
              '<label class="field__label" for="report-location">Exact location</label>' +
              '<div class="field__control">' +
                '<span class="field__icon" aria-hidden="true">' + SVG.icon('map') + '</span>' +
                '<input class="input input--with-icon" type="text" id="report-location" placeholder="e.g. Hostel A — 2nd floor, Block 3" />' +
              '</div>' +
              '<p class="field__error">' + SVG.icon('alertCircle') + '<span></span></p>' +
            '</div>' +

            '<div class="field">' +
              '<label class="field__label" for="report-notes">Description</label>' +
              '<div class="field__control">' +
                '<textarea class="input" id="report-notes" rows="4" ' +
                  'style="height:auto;padding:var(--space-3) var(--space-4);resize:vertical" ' +
                  'placeholder="Describe what you observed — dripping tap, continuous flow, overflow from the tank…"></textarea>' +
              '</div>' +
            '</div>' +

            '<div class="field">' +
              '<span class="field__label">Severity</span>' +
              '<div class="segmented" role="radiogroup" aria-label="Severity">' +
                '<label class="segmented__option">' +
                  '<input type="radio" name="severity" value="Low" />' +
                  '<span class="segmented__icon" aria-hidden="true">' + SVG.icon('info') + '</span>' +
                  '<span class="segmented__text"><span class="segmented__title">Low</span>' +
                  '<span class="segmented__desc">Can wait for routine maintenance</span></span>' +
                '</label>' +
                '<label class="segmented__option">' +
                  '<input type="radio" name="severity" value="Medium" checked />' +
                  '<span class="segmented__icon" aria-hidden="true">' + SVG.icon('alert') + '</span>' +
                  '<span class="segmented__text"><span class="segmented__title">Medium</span>' +
                  '<span class="segmented__desc">Needs attention soon</span></span>' +
                '</label>' +
              '</div>' +
            '</div>' +

            '<button class="btn btn--primary" type="submit">' + SVG.icon('send') + 'Submit report</button>' +
          '</form>' +
        '</div>' +
      '</section>' +

      '<section class="card">' +
        '<div class="card__header">' +
          '<div><h3 class="card__title">My reports</h3><p class="card__subtitle">Trackable repair workflow</p></div>' +
          '<span class="badge badge--navy" id="report-count">0</span>' +
        '</div>' +
        '<div class="card__body" id="report-list">' +
          '<div class="empty">' +
            '<span class="empty__icon">' + SVG.icon('clipboard') + '</span>' +
            '<p class="empty__title">No reports yet</p>' +
            '<p class="empty__text">Submitted reports will appear here with their repair status.</p>' +
          '</div>' +
        '</div>' +
      '</section>' +
    '</div>';
  };

  /* ---------------- Reuse & savings ---------------- */
  Views.reuse = function () {
    var reuse = Engine.reuse();
    var s = Engine.summary();

    return '' +
    '<div class="pagehead">' +
      '<div>' +
        '<h2 class="pagehead__title">Reuse &amp; Savings</h2>' +
        '<p class="pagehead__sub">Turning recovered water into measurable fresh-water savings</p>' +
      '</div>' +
    '</div>' +

    '<div class="statgrid">' +
      statCard({
        label: 'Fresh water saved / month', icon: 'dropletCheck',
        value: fmt(s.waterSavedMonthly), unit: 'L',
        accent: 'var(--success-500)', iconBg: 'var(--success-50)',
        trend: { dir: 'up', text: '+12%' }, foot: 'campus estimate'
      }) +
      statCard({
        label: 'RO reject recovered', icon: 'recycle',
        value: reuse.rejectWater, unit: 'L/day',
        accent: 'var(--aqua-600)', iconBg: 'var(--aqua-100)',
        foot: 'generated by campus RO units'
      }) +
      statCard({
        label: 'Reused for irrigation', icon: 'tree',
        value: reuse.reused, unit: 'L/day',
        accent: 'var(--success-500)', iconBg: 'var(--success-50)',
        trend: { dir: 'up', text: reuse.savedPct + '%' }, foot: 'of total reject water'
      }) +
      statCard({
        label: 'Fresh water avoided', icon: 'gauge',
        value: reuse.freshWaterSaved, unit: 'L/day',
        accent: 'var(--navy-700)', iconBg: 'var(--navy-50)',
        foot: 'no re-pumping required'
      }) +
    '</div>' +

    '<div class="panelgrid panelgrid--wide">' +
      '<section class="card">' +
        '<div class="card__header">' +
          '<div><h3 class="card__title">Reuse flow</h3><p class="card__subtitle">RO reject &rarr; irrigation &rarr; saved fresh water</p></div>' +
        '</div>' +
        '<div class="card__body">' +
          '<div class="reuse">' +
            '<div class="reuse__flow">' +
              '<div class="reuse__stage reuse__stage--source">' +
                '<div class="reuse__stage-label">Reject water</div>' +
                '<div class="reuse__stage-value">' + reuse.rejectWater + ' L</div>' +
                '<div class="reuse__stage-sub">per day</div>' +
              '</div>' +
              '<div class="reuse__stage reuse__stage--reuse">' +
                '<div class="reuse__stage-label">Routed</div>' +
                '<div class="reuse__stage-value">' + reuse.reused + ' L</div>' +
                '<div class="reuse__stage-sub">to gardens &amp; sports</div>' +
              '</div>' +
              '<div class="reuse__stage reuse__stage--saved">' +
                '<div class="reuse__stage-label">Fresh saved</div>' +
                '<div class="reuse__stage-value">' + reuse.freshWaterSaved + ' L</div>' +
                '<div class="reuse__stage-sub">per day</div>' +
              '</div>' +
            '</div>' +
            '<div class="alert alert--success">' + SVG.icon('checkCircle') +
              '<span>Routing RO reject water to irrigation removes <strong>' + reuse.freshWaterSaved +
              ' L/day</strong> of demand from the fresh-water supply — the single largest reuse opportunity in the current prototype.</span>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</section>' +

      '<section class="card">' +
        '<div class="card__header">' +
          '<div><h3 class="card__title">Savings model</h3><p class="card__subtitle">How the estimate is derived</p></div>' +
        '</div>' +
        '<div class="card__body">' +
          '<ul class="feed">' +
            '<li class="feeditem">' +
              '<span class="feeditem__icon feeditem__icon--aqua">' + SVG.icon('droplet') + '</span>' +
              '<div class="feeditem__body"><div class="feeditem__title">Daily reuse</div>' +
              '<div class="feeditem__meta">' + reuse.reused + ' L/day recovered &times; 30 days</div></div>' +
              '<div class="feeditem__side"><span class="zonetable__num">' + fmt(reuse.reused * 30) + ' L</span></div>' +
            '</li>' +
            '<li class="feeditem">' +
              '<span class="feeditem__icon feeditem__icon--success">' + SVG.icon('shieldCheck') + '</span>' +
              '<div class="feeditem__body"><div class="feeditem__title">Leak prevention</div>' +
              '<div class="feeditem__meta">Hostel A excess over baseline avoided</div></div>' +
              '<div class="feeditem__side"><span class="zonetable__num">' + fmt(4500 * 30) + ' L</span></div>' +
            '</li>' +
            '<li class="feeditem">' +
              '<span class="feeditem__icon feeditem__icon--aqua">' + SVG.icon('tree') + '</span>' +
              '<div class="feeditem__body"><div class="feeditem__title">Irrigation tuning</div>' +
              '<div class="feeditem__meta">Schedule correction across open areas</div></div>' +
              '<div class="feeditem__side"><span class="zonetable__num">' + fmt(550 * 30) + ' L</span></div>' +
            '</li>' +
          '</ul>' +
          '<div style="margin-top:var(--space-5);padding-top:var(--space-4);border-top:1px solid var(--border-subtle);' +
            'display:flex;align-items:center;justify-content:space-between">' +
            '<span class="feeditem__meta">Total monthly saving estimate</span>' +
            '<span class="stat__value" style="font-size:var(--text-xl)">' + fmt(s.waterSavedMonthly) + ' L</span>' +
          '</div>' +
        '</div>' +
      '</section>' +
    '</div>';
  };

  /* ---------------- Analytics ---------------- */
  Views.analytics = function () {
    var s = Engine.summary();
    var series = Engine.weeklySeries();
    var breakdown = Engine.scoreBreakdown().map(function (r) {
      return '<div class="score__row">' +
        '<div class="score__row-head">' +
          '<span class="score__row-label">' + esc(r.label) + '</span>' +
          '<span class="score__row-value">' + r.value + '%</span>' +
        '</div>' +
        '<div class="score__bar"><div class="score__bar-fill" style="width:' + r.value + '%"></div></div>' +
      '</div>';
    }).join('');
    var max = Math.max.apply(null, series.map(function (d) { return d.value; }));

    var chart = series.map(function (d) {
      var h = Math.round((d.value / max) * 100);
      var over = d.value > d.baseline;
      return '<div class="chart__col">' +
        '<div class="chart__bar' + (over ? '' : ' chart__bar--alt') + '" style="height:' + h + '%" title="' + fmt(d.value) + ' L/day"></div>' +
        '<span class="chart__bar-label">' + esc(d.label) + '</span>' +
      '</div>';
    }).join('');

    /* Ranked zones by deviation */
    var ranked = s.zones.slice().sort(function (a, b) { return b.deviation - a.deviation; });
    var rankItems = ranked.map(function (z, i) {
      var tone = z.status === 'critical' ? 'danger' : z.status === 'warning' ? 'warning' : 'success';
      return '<li class="feeditem">' +
        '<span class="feeditem__icon feeditem__icon--' + tone + '">' + SVG.icon(z.icon) + '</span>' +
        '<div class="feeditem__body">' +
          '<div class="feeditem__title">' + (i + 1) + '. ' + esc(z.name) + '</div>' +
          '<div class="feeditem__meta">' + esc(z.category) + ' &middot; baseline ' + fmt(z.baseline) + ' L/day</div>' +
        '</div>' +
        '<div class="feeditem__side">' +
          '<span class="badge badge--' + tone + '">' + (z.deviation > 0 ? '+' : '') + z.deviation + '%</span>' +
          '<span class="feeditem__meta">' + fmt(z.current) + ' L/day</span>' +
        '</div>' +
      '</li>';
    }).join('');


    return '' +
    '<div class="pagehead">' +
      '<div>' +
        '<h2 class="pagehead__title">Analytics</h2>' +
        '<p class="pagehead__sub">Consumption trends, deviation ranking and efficiency breakdown</p>' +
      '</div>' +
      '<div class="pagehead__actions">' +
        '<button class="btn btn--secondary btn--sm" type="button" data-export>' + SVG.icon('download') + 'Export report</button>' +
      '</div>' +
    '</div>' +

    '<div class="statgrid">' +
      statCard({
        label: 'Average daily use', icon: 'activity',
        value: fmt(Math.round(s.currentTotal / s.zoneCount)), unit: 'L',
        accent: 'var(--aqua-600)', iconBg: 'var(--aqua-100)',
        foot: 'per zone per day'
      }) +
      statCard({
        label: 'Campus deviation', icon: 'pieChart',
        value: (s.deviationPct > 0 ? '+' : '') + s.deviationPct, unit: '%',
        accent: 'var(--warning-500)', iconBg: 'var(--warning-50)',
        trend: { dir: 'up', text: 'vs baseline' }, foot: 'current vs expected'
      }) +
      statCard({
        label: 'Zones within baseline', icon: 'checkCircle',
        value: s.normalCount, unit: 'of ' + s.zoneCount,
        accent: 'var(--success-500)', iconBg: 'var(--success-50)',
        foot: 'no action required'
      }) +
      statCard({
        label: 'Sensors reporting', icon: 'layers',
        value: s.sensorCount,
        accent: 'var(--navy-700)', iconBg: 'var(--navy-50)',
        foot: 'simulated IoT points'
      }) +
    '</div>' +

    '<div class="panelgrid panelgrid--wide">' +
      '<section class="card">' +
        '<div class="card__header">' +
          '<div><h3 class="card__title">Seven-day consumption</h3><p class="card__subtitle">Litres per day, campus-wide</p></div>' +
        '</div>' +
        '<div class="card__body">' +
          '<div class="chart">' + chart + '</div>' +
          '<div class="chart__legend">' +
            '<span class="chart__legend-item"><span class="chart__legend-swatch" style="background:var(--aqua-500)"></span>Above baseline</span>' +
            '<span class="chart__legend-item"><span class="chart__legend-swatch" style="background:var(--navy-600)"></span>Within baseline</span>' +
          '</div>' +
        '</div>' +
      '</section>' +

      '<section class="card">' +
        '<div class="card__header">' +
          '<div><h3 class="card__title">Efficiency breakdown</h3><p class="card__subtitle">Inputs to the campus score</p></div>' +
        '</div>' +
        '<div class="card__body">' +
          '<div class="score__breakdown">' + breakdown + '</div>' +
          '<div class="alert alert--info" style="margin-top:var(--space-5)">' + SVG.icon('info') +
            '<span>The score is a composite prototype metric for demonstration only.</span></div>' +
        '</div>' +
      '</section>' +
    '</div>' +

    '<section class="card">' +
      '<div class="card__header">' +
        '<div><h3 class="card__title">Deviation ranking</h3><p class="card__subtitle">Zones ordered by how far they sit above baseline</p></div>' +
      '</div>' +
      '<div class="card__body" style="padding:0">' +
        '<ul class="feed">' + rankItems + '</ul>' +
      '</div>' +
    '</section>';
  };

  /* ---------------- Settings ---------------- */
  Views.settings = function () {
    var session = loadSession() || {};

    return '' +
    '<div class="pagehead">' +
      '<div>' +
        '<h2 class="pagehead__title">Settings</h2>' +
        '<p class="pagehead__sub">Account details, detection thresholds and simulation preferences</p>' +
      '</div>' +
    '</div>' +

    '<div class="panelgrid panelgrid--wide">' +
      '<section class="card">' +
        '<div class="card__header">' +
          '<div><h3 class="card__title">Profile</h3><p class="card__subtitle">Your platform identity</p></div>' +
        '</div>' +
        '<div class="card__body">' +
          '<div class="field">' +
            '<label class="field__label" for="set-name">Full name</label>' +
            '<div class="field__control">' +
              '<span class="field__icon" aria-hidden="true">' + SVG.icon('user') + '</span>' +
              '<input class="input input--with-icon" type="text" id="set-name" value="' + esc(session.name || '') + '" />' +
            '</div>' +
          '</div>' +
          '<div class="field">' +
            '<label class="field__label" for="set-email">Email address</label>' +
            '<div class="field__control">' +
              '<span class="field__icon" aria-hidden="true">' + SVG.icon('mail') + '</span>' +
              '<input class="input input--with-icon" type="email" id="set-email" value="' + esc(session.email || '') + '" />' +
            '</div>' +
          '</div>' +
          '<div class="field">' +
            '<label class="field__label" for="set-role">Role</label>' +
            '<div class="field__control">' +
              '<select class="input" id="set-role">' +
                '<option' + (session.role === 'Student / Reporter' ? ' selected' : '') + '>Student / Reporter</option>' +
                '<option' + (session.role !== 'Student / Reporter' ? ' selected' : '') + '>Facility Administrator</option>' +
              '</select>' +
            '</div>' +
          '</div>' +
          '<button class="btn btn--primary" type="button" data-save-profile>' + SVG.icon('check') + 'Save changes</button>' +
        '</div>' +
      '</section>' +

      '<section class="card">' +
        '<div class="card__header">' +
          '<div><h3 class="card__title">Detection thresholds</h3><p class="card__subtitle">Rules used by the anomaly engine</p></div>' +
        '</div>' +
        '<div class="card__body">' +
          '<div class="field">' +
            '<label class="field__label" for="set-warning">Warning threshold' +
              '<span class="field__hint">' + Engine.THRESHOLDS.warning + '%</span></label>' +
            '<div class="field__control">' +
              '<input class="input" type="range" id="set-warning" min="5" max="40" value="' + Engine.THRESHOLDS.warning + '" />' +
            '</div>' +
          '</div>' +
          '<div class="field">' +
            '<label class="field__label" for="set-critical">Critical threshold' +
              '<span class="field__hint">' + Engine.THRESHOLDS.critical + '%</span></label>' +
            '<div class="field__control">' +
              '<input class="input" type="range" id="set-critical" min="20" max="70" value="' + Engine.THRESHOLDS.critical + '" />' +
            '</div>' +
          '</div>' +
          '<div class="field">' +
            '<label class="field__label" for="set-overflow">Overflow level threshold' +
              '<span class="field__hint">' + Engine.THRESHOLDS.overflow + '%</span></label>' +
            '<div class="field__control">' +
              '<input class="input" type="range" id="set-overflow" min="70" max="100" value="' + Engine.THRESHOLDS.overflow + '" />' +
            '</div>' +
          '</div>' +
          '<button class="btn btn--primary" type="button" data-save-thresholds>' + SVG.icon('check') + 'Apply thresholds</button>' +
        '</div>' +
      '</section>' +
    '</div>';
  };

  /* ---------------------------------------------------------------------
     Router + bootstrap
     --------------------------------------------------------------------- */
  var TITLES = {
    dashboard: 'Dashboard',
    zones: 'Water Zones',
    analytics: 'Analytics',
    anomalies: 'Wastage Alerts',
    report: 'Report Issue',
    reuse: 'Reuse & Savings',
    settings: 'Settings'
  };

  var App = {
    current: 'dashboard',
    reports: [],

    init: function () {
      var self=this;
      fetch('/api/auth/session',{credentials:'same-origin'}).then(function(response){
        if (!response.ok) throw new Error('Session expired.');
        return response.json();
      }).then(function(data){
        Store.set(data.user);
        fetch('/api/settings',{credentials:'same-origin'}).then(function(r){return r.ok ? r.json() : null;}).then(function(settings){if(settings && settings.thresholds) Object.assign(Engine.THRESHOLDS,settings.thresholds);});
        self.renderUser(data.user); self.bindNav(); self.bindUserMenu(); self.bindGlobalActions();
        var hash=(window.location.hash || '').replace('#','');
        self.go(TITLES[hash] ? hash : 'dashboard',true);
      }).catch(function(){ Store.remove(); window.location.replace('index.html'); });
    },

    renderUser: function (session) {
      var name = session.name || 'Campus User';
      var role = session.role || 'Facility Administrator';

      var set = function (sel, text) { var el = $(sel); if (el) el.textContent = text; };
      set('#user-name', name);
      set('#user-role', role);
      set('#user-panel-name', name);
      set('#user-panel-email', session.email || '—');
      set('#user-avatar', initials(name));
    },

    bindNav: function () {
      var self = this;
      $$('[data-nav]').forEach(function (link) {
        link.addEventListener('click', function (e) {
          e.preventDefault();
          self.go(link.getAttribute('data-nav'));
        });
      });

      window.addEventListener('hashchange', function () {
        var hash = (window.location.hash || '').replace('#', '');
        if (TITLES[hash] && hash !== self.current) self.go(hash, true);
      });
    },

    go: function (view, skipHash) {
      if (!Views[view]) view = 'dashboard';
      this.current = view;

      var root = $('#view-root');
      if (!root) return;
      root.innerHTML = Views[view]();
      var title = $('#page-title');
      if (title) title.textContent = TITLES[view];
      $$('[data-nav]').forEach(function (link) { link.classList.toggle('is-active', link.getAttribute('data-nav') === view); });
      if (!skipHash) { try { history.replaceState(null, '', '#' + view); } catch (e) {} }
      var count = $('#alert-count');
      if (count) { var summary = Engine.summary(); count.textContent = summary.criticalCount + summary.warningCount; }
      this.bindViewActions(view);
      if (window.Segmented) Segmented.sync(root);
      var main = $('#main-content');
      if (main) main.scrollTop = 0;
    },

    bindViewActions: function (view) {
      var self = this;

      $$('[data-go]', $('#view-root')).forEach(function (btn) {
        btn.addEventListener('click', function () { self.go(btn.getAttribute('data-go')); });
      });

      $$('[data-refresh]', $('#view-root')).forEach(function (btn) {
        btn.addEventListener('click', function () {
          self.go(self.current, true);
          toast('Simulation refreshed', 'Latest simulated readings loaded.', 'info');
        });
      });

      $$('[data-export]', $('#view-root')).forEach(function (btn) {
        btn.addEventListener('click', function () { self.exportCsv(); });
      });

      $$('[data-ticket]', $('#view-root')).forEach(function (btn) {
        btn.addEventListener('click', function () {
          toast('Repair ticket created', 'Ticket ' + btn.getAttribute('data-ticket') + ' queued for the maintenance team.', 'success');
        });
      });

      if (view === 'report') { this.bindReportForm(); this.loadReports(); }
      if (view === 'settings') this.bindSettings();
    },

    bindReportForm: function () {
      var self=this, form=$('#report-form'); if (!form) return;
      form.addEventListener('submit',function(e){
        e.preventDefault();
        var location=$('#report-location'), field=location.closest('.field'), error=field.querySelector('.field__error span');
        if (!location.value.trim()) { field.classList.add('field--invalid'); if(error) error.textContent='Please specify where the issue is located.'; location.focus(); return; }
        field.classList.remove('field--invalid'); if(error) error.textContent='';
        var severity=$('input[name="severity"]:checked',form);
        fetch('/api/reports',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({zone:$('#report-zone').value,type:$('#report-type').value,location:location.value.trim(),notes:$('#report-notes').value,severity:severity ? severity.value : 'Medium'})})
          .then(function(r){return r.json().then(function(data){if(!r.ok) throw new Error(data.error || 'Could not submit report.');return data;});})
          .then(function(data){self.reports.unshift(data.report);location.value='';$('#report-notes').value='';self.renderReports();toast('Report submitted','Your issue has been logged for maintenance.','success');})
          .catch(function(err){toast('Report failed',err.message,'error');});
      });
    },

    loadReports: function () {
      var self=this;
      fetch('/api/reports',{credentials:'same-origin'}).then(function(r){if(!r.ok)throw new Error('Could not load reports.');return r.json();})
        .then(function(data){self.reports=data.reports || [];self.renderReports();})
        .catch(function(){toast('Reports unavailable','The server could not load saved reports.','error');});
    },

    renderReports: function () {
      var list = $('#report-list');
      var count = $('#report-count');
      if (!list) return;

      if (count) count.textContent = this.reports.length;
      if (!this.reports.length) {
        list.innerHTML = '<div class="empty">' + '<span class="empty__icon">' + SVG.icon('clipboard') + '</span>' + '<p class="empty__title">No reports yet</p>' + '<p class="empty__text">Submitted reports will appear here with their repair status.</p>' + '</div>';
        return;
      }
      list.innerHTML = '<ul class="feed">' + this.reports.map(function (r) {
        var tone = r.severity === 'High' ? 'danger' : r.severity === 'Medium' ? 'warning' : 'neutral';
        return '<li class="feeditem">' + '<span class="feeditem__icon feeditem__icon--' + tone + '">' + SVG.icon('clipboard') + '</span>' + '<div class="feeditem__body"><div class="feeditem__title">' + esc(r.type) + ' &mdash; ' + esc(r.zone) + '</div><div class="feeditem__meta">' + esc(r.location) + '</div></div>' + '<div class="feeditem__side"><span class="badge badge--' + tone + '">' + esc(r.severity) + '</span><span class="badge badge--navy">' + esc(r.status) + '</span><span class="feeditem__meta">' + esc(r.time) + '</span></div>' + '</li>';
      }).join('') + '</ul>';
    },

    bindUserMenu: function () {
      var trigger = $('#user-trigger');
      var panel = $('#user-panel');
      if (!trigger || !panel) return;

      var close = function () {
        panel.classList.remove('is-open');
        trigger.setAttribute('aria-expanded', 'false');
      };

      trigger.addEventListener('click', function (e) {
        e.stopPropagation();
        var open = panel.classList.toggle('is-open');
        trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
      });

      document.addEventListener('click', function (e) {
        if (!panel.contains(e.target) && e.target !== trigger) close();
      });

      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') close();
      });

      var logout = $('[data-logout]', panel);
      if (logout) {
        logout.addEventListener('click', function () {
          fetch('/api/auth/logout',{method:'POST',credentials:'same-origin'}).catch(function(){});
          clearSession();
          toast('Signed out', 'Returning to the sign-in screen.', 'info');
          setTimeout(function () { window.location.replace('index.html'); }, 600);
        });
      }

      var settings = $('[data-settings]', panel);
      if (settings) {
        settings.addEventListener('click', function () { this.go('settings'); }.bind(this));
      }

      var profile = $('[data-profile]', panel);
      if (profile) {
        profile.addEventListener('click', function () { this.go('settings'); }.bind(this));
      }
    },

    bindGlobalActions: function () {
      var self = this;

      var bell = $('[data-notifications]');
      if (bell) {
        bell.addEventListener('click', function () {
          var s = Engine.summary();
          toast('Notifications', s.criticalCount + ' critical and ' + s.warningCount +
                ' warning alerts need attention.', 'info');
        });
      }

      var search = $('#global-search');
      if (search) {
        search.addEventListener('keydown', function (e) {
          if (e.key !== 'Enter') return;
          var q = search.value.trim().toLowerCase();
          if (!q) return;

          var match = Engine.zones().filter(function (z) {
            return z.name.toLowerCase().indexOf(q) !== -1 || z.category.toLowerCase().indexOf(q) !== -1;
          })[0];

          if (match) {
            self.go('zones');
            toast('Found zone', match.name + ' — highlighted in Water Zones.', 'success');
          } else {
            toast('No match', 'No zone matches "' + search.value.trim() + '".', 'error');
          }
        });
      }
    },

    bindSettings: function () {
      var self = this;

      $$('.field__hint', $('#view-root')).forEach(function (hint, i) {
        var input = $('#view-root').querySelectorAll('input[type="range"]')[i];
        if (!input) return;
        input.addEventListener('input', function () {
          hint.textContent = input.value + '%';
        });
      });

      var saveProfile = $('[data-save-profile]', $('#view-root'));
      if (saveProfile) saveProfile.addEventListener('click',function(){
        var profile={name:$('#set-name').value.trim(),email:$('#set-email').value.trim(),role:$('#set-role').value};
        fetch('/api/profile',{method:'PATCH',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify(profile)})
          .then(function(r){return r.json().then(function(data){if(!r.ok)throw new Error(data.error || 'Could not save profile.');return data;});})
          .then(function(data){Store.set(data.user);self.renderUser(data.user);toast('Profile updated','Your details have been saved.','success');})
          .catch(function(error){toast('Profile not saved',error.message,'error');});
      });

      var saveThresholds = $('[data-save-thresholds]', $('#view-root'));
      if (saveThresholds) saveThresholds.addEventListener('click',function(){
        var values={warning:Number($('#set-warning').value),critical:Number($('#set-critical').value),overflow:Number($('#set-overflow').value)};
        fetch('/api/settings',{method:'PUT',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify(values)})
          .then(function(r){return r.json().then(function(data){if(!r.ok)throw new Error(data.error || 'Could not save thresholds.');return data;});})
          .then(function(data){Object.assign(Engine.THRESHOLDS,data.thresholds);toast('Thresholds applied','Detection rules updated.','success');self.go(self.current,true);})
          .catch(function(error){toast('Thresholds not saved',error.message,'error');});
      });
    },

    exportCsv: function () {    },

    exportCsv: function () {
      var zones = Engine.zones();
      var rows = [['Zone', 'Category', 'Baseline (L/day)', 'Current (L/day)', 'Deviation (%)', 'Tank (%)', 'Status']];

      zones.forEach(function (z) {
        rows.push([z.name, z.category, z.baseline, z.current, z.deviation, z.tankLevel, z.status]);
      });

      var csv = rows.map(function (r) {
        return r.map(function (c) { return '"' + String(c) + '"'; }).join(',');
      }).join('\n');

      var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'smart-water-guardian-zones.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast('Export ready', 'Zone data downloaded as CSV.', 'success');
    }
  };

  /* Auto-boot */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { App.init(); });
  } else {
    App.init();
  }

  global.App = App;
})(window);
