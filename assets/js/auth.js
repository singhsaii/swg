/* ==========================================================================
   Smart Water Guardian — Authentication Controller
   Client-side prototype: validates input, simulates a network round-trip,
   persists the session, and hands control to the dashboard shell.
   ========================================================================== */
(function (global) {
  'use strict';

  /* ---------------------------------------------------------------------
     Tiny DOM helpers
     --------------------------------------------------------------------- */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  function show(el, visible) {
    if (!el) return;
    el.hidden = !visible;
  }

  function setInvalid(field, message) {
    if (!field) return;
    var errEl = $('.field__error', field);
    var span = errEl ? errEl.querySelector('span') : null;

    if (message) {
      field.classList.add('field--invalid');
      field.classList.remove('field--valid');
      if (span) span.textContent = message;
    } else {
      field.classList.remove('field--invalid');
      if (span) span.textContent = '';
    }
  }

  function fieldOf(input) { return input.closest('.field'); }

  /* ---------------------------------------------------------------------
     Validation rules
     --------------------------------------------------------------------- */
  var VALIDATORS = {
    email: function (value) {
      if (!value.trim()) return 'Email address is required.';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim())) {
        return 'Enter a valid email address (e.g. name@gniot.net.in).';
      }
      return '';
    },
    password: function (value) {
      if (!value) return 'Password is required.';
      if (value.length < 8) return 'Password must be at least 8 characters long.';
      return '';
    },
    name: function (value) {
      if (!value.trim()) return 'Full name is required.';
      if (value.trim().length < 3) return 'Enter your full name (at least 3 characters).';
      return '';
    },
    role: function (value) {
      if (!value) return 'Select the role you will use on the platform.';
      return '';
    }
  };

  /* ---------------------------------------------------------------------
     Password strength — 0..4
     --------------------------------------------------------------------- */
  var STRENGTH_LABELS = ['Too short', 'Weak', 'Fair', 'Good', 'Strong'];
  var STRENGTH_CLASS = ['is-on-weak', 'is-on-fair', 'is-on-good', 'is-on-strong'];

  function scorePassword(pwd) {
    if (!pwd) return 0;
    var score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    /* Normalise 0..5 raw signals down to a 0..4 scale. */
    if (score <= 1) return 1;
    if (score === 2) return 2;
    if (score === 3) return 3;
    if (score === 4) return 4;
    return 4;
  }

  function updateStrength(input) {
    var field = fieldOf(input);
    if (!field) return;
    var meter = $('.strength', field);
    if (!meter) return;

    var score = scorePassword(input.value);
    var bars = $$('.strength__bar', meter);
    var label = $('.strength__label', meter);

    bars.forEach(function (bar, i) {
      bar.className = 'strength__bar';
      if (i < score && score > 0) {
        bar.classList.add(STRENGTH_CLASS[Math.min(score, 4) - 1]);
      }
    });

    if (label) {
      label.textContent = input.value ? 'Strength: ' + STRENGTH_LABELS[score] : '';
    }
  }


  /* ---------------------------------------------------------------------
     Session storage (delegates to the shared Store helper, which falls
     back to sessionStorage and then cookies when localStorage is
     unavailable — e.g. when the page is opened directly from disk).
     --------------------------------------------------------------------- */
  function saveSession(user) {
    return Store.set(user);
  }

  function loadSession() {
    return Store.get();
  }

  function clearSession() {
    Store.remove();
  }

  /* ---------------------------------------------------------------------
     Toast helper (self-contained so it works on any page)
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

    var iconName = kind === 'error' ? 'alertCircle'
                 : kind === 'success' ? 'checkCircle'
                 : 'info';

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
     Controller
     --------------------------------------------------------------------- */
  var Auth = {
    init: function () {
      var root = $('#auth');
      if (!root) return;

      this.tabs = $$('.tabs__btn', root);
      this.loginForm = $('#login-form');
      this.signupForm = $('#signup-form');

      this.bindTabs();
      this.bindPasswordToggles(root);
      this.bindLiveValidation(root);
      this.bindSubmit();
      this.bindDemoAccess();

      /* Sync the segmented role picker (also the :has() fallback). */
      if (window.Segmented) Segmented.sync(root);

      /* Pre-fill the demo credentials for the prototype flow. */
      var demoEmail = $('#login-email');
      var demoPass = $('#login-password');
      if (demoEmail && !demoEmail.value) demoEmail.value = 'demo@gniot.net.in';
      if (demoPass && !demoPass.value) demoPass.value = 'Water@1234';
    },

    /* --- tab switching (Login <-> Sign Up) --- */
    bindTabs: function () {
      var self = this;
      this.tabs.forEach(function (btn) {
        btn.addEventListener('click', function () {
          var mode = btn.getAttribute('data-mode');
          self.switchMode(mode);
        });
      });
    },

    switchMode: function (mode) {
      var self = this;
      this.tabs.forEach(function (btn) {
        var active = btn.getAttribute('data-mode') === mode;
        btn.setAttribute('aria-selected', active ? 'true' : 'false');
      });

      var isLogin = mode === 'login';
      show(this.loginForm, isLogin);
      show(this.signupForm, !isLogin);

      var title = $('#auth-title');
      var sub = $('#auth-sub');
      if (title) title.textContent = isLogin ? 'Welcome back' : 'Create your account';
      if (sub) {
        sub.innerHTML = isLogin
          ? 'Sign in to continue monitoring campus water usage.'
          : 'Join the platform to monitor, report and reduce campus water waste.';
      }

      /* Move focus to the first field of the newly visible form. */
      var target = $(isLogin ? '#login-email' : '#signup-name');
      if (target) setTimeout(function () { target.focus(); }, 60);

      try {
        history.replaceState(null, '', '#' + mode);
      } catch (e) {}
    },

    /* --- show / hide password --- */
    bindPasswordToggles: function (root) {
      $$('.field__action[data-toggle-password]', root).forEach(function (btn) {
        btn.addEventListener('click', function () {
          var input = document.getElementById(btn.getAttribute('data-toggle-password'));
          if (!input) return;
          var isHidden = input.type === 'password';
          input.type = isHidden ? 'text' : 'password';
          btn.innerHTML = SVG.icon(isHidden ? 'eyeOff' : 'eye');
          btn.setAttribute('aria-label', isHidden ? 'Hide password' : 'Show password');
          btn.setAttribute('aria-pressed', isHidden ? 'true' : 'false');
          input.focus();
        });
      });
    },

    /* --- validate on blur / input --- */
    bindLiveValidation: function (root) {
      $$('[data-validate]', root).forEach(function (input) {
        var rule = input.getAttribute('data-validate');
        var validator = VALIDATORS[rule];
        if (!validator) return;

        input.addEventListener('blur', function () {
          if (!input.value) return;
          setInvalid(fieldOf(input), validator(input.value));
        });

        input.addEventListener('input', function () {
          var field = fieldOf(input);
          if (field && field.classList.contains('field--invalid')) {
            setInvalid(field, validator(input.value));
          }
          if (rule === 'password') updateStrength(input);
        });
      });
    },

    /* --- submit handling --- */
    bindSubmit: function () {
      var self = this;

      if (this.loginForm) {
        this.loginForm.addEventListener('submit', function (e) {
          e.preventDefault();
          self.handleLogin();
        });
      }

      if (this.signupForm) {
        this.signupForm.addEventListener('submit', function (e) {
          e.preventDefault();
          self.handleSignup();
        });
      }
    },

    validateForm: function (form) {
      var ok = true;
      $$('[data-validate]', form).forEach(function (input) {
        var rule = input.getAttribute('data-validate');
        var msg = VALIDATORS[rule](input.value);
        setInvalid(fieldOf(input), msg);
        if (msg) ok = false;
      });

      /* Role radio group (sign-up only). */
      var roleInput = $('input[name="role"]:checked', form);
      if ($('input[name="role"]', form) && !roleInput) {
        var roleField = fieldOf($('input[name="role"]', form));
        setInvalid(roleField, VALIDATORS.role(''));
        ok = false;
      }
      return ok;
    },

    setBusy: function (btn, busy, busyLabel) {
      if (!btn) return;
      if (busy) {
        btn.dataset.label = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<span class="btn__spinner"></span><span>' + busyLabel + '</span>';
      } else {
        btn.disabled = false;
        if (btn.dataset.label) btn.innerHTML = btn.dataset.label;
      }
    },

    /**
     * Derive a display name from the email local-part.
     * "demo@gniot.net.in"  ->  "Demo"
     * "priyanshu.kumar@…"   ->  "Priyanshu Kumar"
     */
    displayName: function (email) {
      if (!email) return 'Campus User';
      var local = email.split('@')[0] || '';
      if (!local) return 'Campus User';

      var parts = local.split(/[._-]+/).filter(Boolean);
      if (!parts.length) return 'Campus User';

      return parts.map(function (w) {
        return w.charAt(0).toUpperCase() + w.slice(1);
      }).join(' ');
    },

    handleLogin: async function () {
      var form = this.loginForm;
      if (!this.validateForm(form)) { toast('Check your details','Please correct the highlighted fields.','error'); return; }
      var btn = $('button[type="submit"]', form);
      this.setBusy(btn,true,'Signing in…');
      try {
        var result = await api('/api/auth/login',{ email:$('#login-email').value.trim(), password:$('#login-password').value });
        saveSession(result.user);
        toast('Signed in successfully','Loading your campus dashboard…','success');
        setTimeout(function(){ window.location.href='dashboard.html'; },400);
      } catch (error) { toast('Sign-in failed',error.message,'error'); }
      finally { this.setBusy(btn,false); }
    },

    handleSignup: async function () {
      var form=this.signupForm;
      if (!this.validateForm(form)) { toast('Check your details','Please correct the highlighted fields.','error'); return; }
      if ($('#signup-password').value !== $('#signup-confirm').value) {
        setInvalid(fieldOf($('#signup-confirm')),'Passwords do not match.');
        toast('Check your details','Passwords do not match.','error'); return;
      }
      setInvalid(fieldOf($('#signup-confirm')),'');
      var btn=$('button[type="submit"]',form), role=$('input[name="role"]:checked',form);
      this.setBusy(btn,true,'Creating account…');
      try {
        var result=await api('/api/auth/signup',{ name:$('#signup-name').value.trim(), email:$('#signup-email').value.trim(), password:$('#signup-password').value, role:role ? role.value : 'Facility Administrator' });
        saveSession(result.user);
        toast('Account created','Welcome to Smart Water Guardian.','success');
        setTimeout(function(){ window.location.href='dashboard.html'; },400);
      } catch(error) { toast('Could not create account',error.message,'error'); }
      finally { this.setBusy(btn,false); }
    },

    /* --- one-click demo login --- */
    bindDemoAccess: function () {
      var btn = $('[data-demo-login]');
      if (!btn) return;

      btn.addEventListener('click', function () {
        var email = $('#login-email');
        var pass = $('#login-password');

        if (email) email.value = 'demo@gniot.net.in';
        if (pass) pass.value = 'Water@1234';

        setInvalid(fieldOf(email), '');
        setInvalid(fieldOf(pass), '');

        var loginBtn = $('#login-form button[type="submit"]');
        if (loginBtn) loginBtn.click();
      });
    },

    /* --- public helpers --- */
    toast: toast,
    saveSession: saveSession,
    loadSession: loadSession,
    clearSession: clearSession
  };

  /* Auto-boot */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { Auth.init(); });
  } else {
    Auth.init();
  }

  global.Auth = Auth;
})(window);
