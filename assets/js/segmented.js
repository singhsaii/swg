/* ==========================================================================
   Smart Water Guardian — Segmented Control Sync
   Toggles `is-selected` on the wrapping label whenever a radio inside it
   changes. The CSS also uses :has(), but this keeps the selected state
   visible in browsers without :has() support.
   ========================================================================== */
(function (global) {
  'use strict';

  function sync(scope) {
    var root = scope || document;
    var groups = root.querySelectorAll('.segmented');

    Array.prototype.forEach.call(groups, function (group) {
      var options = group.querySelectorAll('.segmented__option');

      Array.prototype.forEach.call(options, function (option) {
        var input = option.querySelector('input[type="radio"]');
        if (!input) return;

        option.classList.toggle('is-selected', input.checked);

        /* Avoid stacking duplicate listeners across re-renders. */
        if (input.dataset.synced === '1') return;
        input.dataset.synced = '1';

        input.addEventListener('change', function () {
          Array.prototype.forEach.call(options, function (opt) {
            var inp = opt.querySelector('input[type="radio"]');
            opt.classList.toggle('is-selected', !!(inp && inp.checked));
          });
        });
      });
    });
  }

  global.Segmented = { sync: sync };
})(window);
