/* ==========================================================================
   Smart Water Guardian — Icon Library
   Inline SVG sprite (no external icon dependency).
   Usage: SVG.icon('droplet')  ->  <svg class="icon">...</svg>
   ========================================================================== */
(function (global) {
  'use strict';

  var PATHS = {
    /* --- brand / water --- */
    droplet: '<path d="M12 2.7s6.5 7.1 6.5 11.4A6.5 6.5 0 0 1 5.5 14.1C5.5 9.8 12 2.7 12 2.7Z"/>',
    dropletCheck: '<path d="M12 2.7s6.5 7.1 6.5 11.4A6.5 6.5 0 0 1 5.5 14.1C5.5 9.8 12 2.7 12 2.7Z"/><path d="m9 13.6 2.2 2.2L15.4 11"/>',
    waves: '<path d="M2 8.5c2.2-2 4.4-2 6.6 0s4.4 2 6.6 0 4.4-2 6.6 0"/><path d="M2 14c2.2-2 4.4-2 6.6 0s4.4 2 6.6 0 4.4-2 6.6 0"/>',
    gauge: '<path d="M12 21a9 9 0 1 0-9-9"/><path d="M12 12l4.2-4.2"/><circle cx="12" cy="12" r="1.4"/>',
    /* --- auth --- */
    mail: '<rect x="2.5" y="4.5" width="19" height="15" rx="2.5"/><path d="m3 6.5 9 6.5 9-6.5"/>',
    lock: '<rect x="4" y="10.5" width="16" height="10.5" rx="2.5"/><path d="M8 10.5V7.6a4 4 0 0 1 8 0v2.9"/>',
    user: '<circle cx="12" cy="8" r="3.6"/><path d="M4.8 20a7.2 7.2 0 0 1 14.4 0"/>',
    users: '<circle cx="9" cy="8" r="3.2"/><path d="M2.8 19.5a6.2 6.2 0 0 1 12.4 0"/><path d="M16.2 5.2a3.2 3.2 0 0 1 0 5.9"/><path d="M17.6 14.4a6.2 6.2 0 0 1 3.6 5.1"/>',
    eye: '<path d="M2.2 12S5.8 5.6 12 5.6 21.8 12 21.8 12 18.2 18.4 12 18.4 2.2 12 2.2 12Z"/><circle cx="12" cy="12" r="3"/>',
    eyeOff: '<path d="M9.6 5.9A9.6 9.6 0 0 1 12 5.6c6.2 0 9.8 6.4 9.8 6.4a17 17 0 0 1-2.9 3.8"/><path d="M6.2 7.6A17.2 17.2 0 0 0 2.2 12S5.8 18.4 12 18.4a9.4 9.4 0 0 0 3.9-.8"/><path d="m3 3 18 18"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
    shield: '<path d="M12 2.7 4.6 5.8v5.4c0 4.5 3.1 8.7 7.4 10.1 4.3-1.4 7.4-5.6 7.4-10.1V5.8Z"/>',
    shieldCheck: '<path d="M12 2.7 4.6 5.8v5.4c0 4.5 3.1 8.7 7.4 10.1 4.3-1.4 7.4-5.6 7.4-10.1V5.8Z"/><path d="m8.8 11.8 2.2 2.2 4.2-4.3"/>',
    logout: '<path d="M9.5 20.5H6a2.5 2.5 0 0 1-2.5-2.5V6A2.5 2.5 0 0 1 6 3.5h3.5"/><path d="M15.5 16.5 20 12l-4.5-4.5"/><path d="M20 12H9.5"/>',
    chevronRight: '<path d="m9.5 5.5 6.5 6.5-6.5 6.5"/>',
    chevronDown: '<path d="m5.5 9 6.5 6.5L18.5 9"/>',
    arrowRight: '<path d="M4 12h16"/><path d="m14 6 6 6-6 6"/>',
    arrowUp: '<path d="M12 19V5"/><path d="m6 11 6-6 6 6"/>',
    arrowDown: '<path d="M12 5v14"/><path d="m6 13 6 6 6-6"/>',
    check: '<path d="m4.5 12.5 5 5 10-11"/>',
    checkCircle: '<circle cx="12" cy="12" r="9"/><path d="m8.2 12.2 2.6 2.6 5-5.4"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    alert: '<path d="M12 3.4 1.9 20.6h20.2Z"/><path d="M12 9.6v4.6"/><circle cx="12" cy="17.4" r="0.9" fill="currentColor" stroke="none"/>',
    alertCircle: '<circle cx="12" cy="12" r="9"/><path d="M12 7.6v5"/><circle cx="12" cy="16" r="0.9" fill="currentColor" stroke="none"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 16.4V11"/><circle cx="12" cy="7.8" r="0.9" fill="currentColor" stroke="none"/>',

    /* --- navigation --- */
    grid: '<rect x="3.5" y="3.5" width="7" height="7" rx="1.6"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.6"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.6"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.6"/>',
    map: '<path d="m9 3.5-5.5 2.2v14.8L9 18.3l6 2.2 5.5-2.2V3.5L15 5.7Z"/><path d="M9 3.5v14.8"/><path d="M15 5.7v14.8"/>',
    activity: '<path d="M2.5 12h4l3-8 5 16 3-8h4"/>',
    bell: '<path d="M18 8.8a6 6 0 1 0-12 0c0 6.3-2.5 8.2-2.5 8.2h17S18 15.1 18 8.8Z"/><path d="M13.7 20.5a2 2 0 0 1-3.4 0"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/>',
    fileText: '<path d="M14 3.5H7a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8.5Z"/><path d="M14 3.5v5h5"/><path d="M8.8 13h6.4"/><path d="M8.8 16.5h4.4"/>',
    chart: '<path d="M3.5 3.5v17h17"/><rect x="7" y="12" width="3" height="5"/><rect x="12" y="8" width="3" height="9"/><rect x="17" y="10.5" width="3" height="6.5"/>',
    pieChart: '<path d="M21 12A9 9 0 1 1 12 3v9Z"/><path d="M15.5 3.6A9 9 0 0 1 20.4 8.5h-4.9Z"/>',
    helpCircle: '<circle cx="12" cy="12" r="9"/><path d="M9.6 9.4a2.5 2.5 0 0 1 4.9.6c0 1.7-2.5 2.5-2.5 2.5"/><circle cx="12" cy="16.4" r="0.9" fill="currentColor" stroke="none"/>',
    refresh: '<path d="M20.5 11.5a8.5 8.5 0 1 0-1.9 6.4"/><path d="M20.5 5.5v6h-6"/>',
    filter: '<path d="M3.5 5.5h17l-6.6 7.8v5.6l-3.8 2v-7.6Z"/>',
    download: '<path d="M12 3.5v11.5"/><path d="m7.5 10.5 4.5 4.5 4.5-4.5"/><path d="M4.5 19.5h15"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    trash: '<path d="M4.5 6.5h15"/><path d="M9.5 6.5V5a1.5 1.5 0 0 1 1.5-1.5h2A1.5 1.5 0 0 1 14.5 5v1.5"/><path d="M6.5 6.5 7.4 19a1.6 1.6 0 0 0 1.6 1.5h6a1.6 1.6 0 0 0 1.6-1.5l.9-12.5"/>',
    edit: '<path d="M12 20.5h8.5"/><path d="M16.2 4.3a2.1 2.1 0 0 1 3 3L9.3 17.2l-4 1 1-4Z"/>',
    clipboard: '<rect x="7.5" y="4" width="9" height="3.4" rx="1.2"/><path d="M16.5 5.5h1.8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5.7a2 2 0 0 1-2-2v-12a2 2 0 0 1 2-2h1.8"/><path d="M8.8 12.5h6.4M8.8 16h4"/>',
    building: '<rect x="4" y="3" width="16" height="18" rx="1.8"/><path d="M8.5 7h2M13.5 7h2M8.5 11h2M13.5 11h2M8.5 15h2M13.5 15h2"/>',
    home: '<path d="M4 10.5 12 4l8 6.5V19a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z"/><path d="M9.5 21v-6h5v6"/>',
    flask: '<path d="M9.5 3v6.2L4.3 18a2 2 0 0 0 1.7 3h12a2 2 0 0 0 1.7-3l-5.2-8.8V3"/><path d="M8 3h8"/><path d="M7.2 14.5h9.6"/>',
    utensils: '<path d="M6 3v7a2.5 2.5 0 0 0 5 0V3"/><path d="M8.5 10.5V21"/><path d="M17 3c-1.5 1.5-2 3.2-2 5.5s.7 3.5 2 3.5V21"/>',
    tree: '<path d="M12 21v-5"/><path d="M12 16 6.5 9h3L7 5.5h10L14.5 9h3Z"/>',
    bath: '<path d="M3.5 12.5h17v3a4 4 0 0 1-4 4h-9a4 4 0 0 1-4-4Z"/><path d="M6.5 12.5V6a2 2 0 0 1 3.6-1.2"/><path d="M7 19.5l-1 2M17 19.5l1 2"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.2 5.2l1.4 1.4M17.4 17.4l1.4 1.4M18.8 5.2l-1.4 1.4M6.6 17.4l-1.4 1.4"/>',
    zap: '<path d="M13.5 2.5 4 14h7l-.5 7.5L20 10h-7Z"/>',
    thermometer: '<path d="M14 14.8V5a2 2 0 0 0-4 0v9.8a4 4 0 1 0 4 0Z"/>',
    bug: '<path d="M8 7a4 4 0 0 1 8 0"/><rect x="7" y="7" width="10" height="13" rx="5"/><path d="M3.5 11h3.5M17 11h3.5M3.5 17h3.5M17 17h3.5M6 4.5 8 6.5M18 4.5 16 6.5"/>',
    recycle: '<path d="m7.5 8.5-3 5.2a2 2 0 0 0 1.7 3h6.2"/><path d="m10.5 3.5 3 5.2a2 2 0 0 1-1.7 3H5.6"/><path d="m16.5 19.5 3-5.2a2 2 0 0 0-1.7-3h-6.2"/>',
    calculator: '<rect x="4.5" y="2.5" width="15" height="19" rx="2"/><path d="M8 6.5h8"/><path d="M8.5 11h.01M12 11h.01M15.5 11h.01M8.5 14.5h.01M12 14.5h.01M15.5 14.5h.01M8.5 18h.01M12 18h.01M15.5 18h.01"/>',
    calendar: '<rect x="3.5" y="5" width="17" height="16" rx="2"/><path d="M8 3v4M16 3v4M3.5 10h17"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5.3l3.3 2"/>',
    star: '<path d="m12 3.2 2.7 5.6 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1L3.2 9.7l6.1-.9Z"/>',
    fire: '<path d="M12 21c3.6 0 6.5-2.7 6.5-6.2 0-4.6-4.2-6.3-4.2-9.3 0-1-.3-1.9-.9-2.5-2.6 1.6-4.6 4.3-4.6 7.6 0 1.4-.7 2-1.4 2-1 0-1.6-.8-1.6-2.2-1.6 1.5-2.9 3.6-2.9 6C3 18.3 8 21 12 21Z"/>',
    wallet: '<path d="M3.5 7.5A2 2 0 0 1 5.5 5.5h13a2 2 0 0 1 2 2"/><rect x="3.5" y="7.5" width="17" height="12" rx="2"/><circle cx="16.5" cy="13.5" r="1.3" fill="currentColor" stroke="none"/>',
    sparkle: '<path d="M12 2.5 13.8 9l6.5 1.8-6.5 1.8L12 19l-1.8-6.4L3.7 10.8 10.2 9Z"/><path d="M18.5 2.5v3M20 4h-3"/>',
    send: '<path d="M21 3 10.5 13.5"/><path d="M21 3 14.4 21l-3.9-7.5L3 9.6Z"/>',
    phone: '<path d="M21 16.5v3a2 2 0 0 1-2.2 2 19.6 19.6 0 0 1-8.5-3 19.3 19.3 0 0 1-6-6 19.6 19.6 0 0 1-3-8.6A2 2 0 0 1 3.3 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L7.4 9.7a16 16 0 0 0 6 6l1.1-1.1a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.6 1.7Z"/>',
    key: '<circle cx="8" cy="15" r="4.5"/><path d="m11.5 12 8-8"/><path d="m16.5 7 2.5 2.5"/><path d="m14 9.5 2.5 2.5"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18Z"/>',
    layers: '<path d="m12 2.8 9 4.7-9 4.7-9-4.7Z"/><path d="m3 12.5 9 4.7 9-4.7"/><path d="m3 17 9 4.7 9-4.7"/>'
  };

  var SVG = {
    /**
     * Build an inline SVG string for the given icon name.
     * @param {string} name  key in PATHS
     * @param {object} [opts] { className, size }
     */
    icon: function (name, opts) {
      opts = opts || {};
      var body = PATHS[name] || PATHS.info;
      var cls = 'icon' + (opts.className ? ' ' + opts.className : '');
      var style = opts.size ? ' style="width:' + opts.size + 'px;height:' + opts.size + 'px"' : '';
      return '<svg class="' + cls + '"' + style + ' viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + body + '</svg>';
    },
    has: function (name) {
      return Object.prototype.hasOwnProperty.call(PATHS, name);
    }
  };

  global.SVG = SVG;
})(window);
