/* ==========================================================================
   Smart Water Guardian — Session Storage
   Three-tier fallback so the prototype works even when the page is opened
   directly from disk (file://), where localStorage can be unavailable:
     1. localStorage   2. sessionStorage   3. document.cookie
   All tiers are plain strings, so nothing is lost between page navigations.
   ========================================================================== */
(function (global) {
  'use strict';

  var KEY = 'swg.session';

  function readCookie(name) {
    try {
      var all = document.cookie || '';
      var parts = all.split(';');
      for (var i = 0; i < parts.length; i++) {
        var pair = parts[i].trim();
        if (pair.indexOf(name + '=') === 0) {
          return decodeURIComponent(pair.slice(name.length + 1));
        }
      }
    } catch (e) {}
    return null;
  }

  function writeCookie(name, value) {
    try {
      document.cookie = name + '=' + encodeURIComponent(value) +
        '; path=/; max-age=' + (60 * 60 * 24 * 7) + '; SameSite=Lax';
    } catch (e) {}
  }

  function removeCookie(name) {
    try {
      document.cookie = name + '=; path=/; max-age=0; SameSite=Lax';
    } catch (e) {}
  }

  var Store = {
    KEY: KEY,

    /** @returns {object|null} the stored session, or null. */
    get: function () {
      var raw = null;

      try {
        if (global.localStorage) {
          raw = global.localStorage.getItem(KEY);
          if (raw) return JSON.parse(raw);
        }
      } catch (e) {}

      try {
        if (global.sessionStorage) {
          raw = global.sessionStorage.getItem(KEY);
          if (raw) return JSON.parse(raw);
        }
      } catch (e) {}

      raw = readCookie(KEY);
      if (raw) {
        try { return JSON.parse(raw); } catch (e) { return null; }
      }

      return null;
    },

    /** Persist a session object across all available tiers. */
    set: function (session) {
      var raw = JSON.stringify(session);

      try { if (global.localStorage) global.localStorage.setItem(KEY, raw); } catch (e) {}
      try { if (global.sessionStorage) global.sessionStorage.setItem(KEY, raw); } catch (e) {}
      writeCookie(KEY, raw);

      return session;
    },

    /** Remove the session from every tier. */
    remove: function () {
      try { if (global.localStorage) global.localStorage.removeItem(KEY); } catch (e) {}
      try { if (global.sessionStorage) global.sessionStorage.removeItem(KEY); } catch (e) {}
      removeCookie(KEY);
    }
  };

  global.Store = Store;
})(window);
