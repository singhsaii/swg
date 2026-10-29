/* ==========================================================================
   Smart Water Guardian — Simulation Engine
   Deterministic data model seeded from the project blueprint
   ("SMART WATER GUARDIAN.pptx", slides 6-9).

   All figures below are ILLUSTRATIVE prototype values taken directly from
   the supplied blueprint — they are not measured campus performance data.
   ========================================================================== */
(function (global) {
  'use strict';

  /* ---------------------------------------------------------------------
     Zone registry — slide 4: "Water zones include academic blocks, hostels,
     canteen, laboratories, gardens/sports areas and washrooms."
     --------------------------------------------------------------------- */
  var ZONES = [
    {
      id: 'hostel-a', name: 'Hostel A', category: 'Hostel', icon: 'home',
      baseline: 8000, current: 12500, tankLevel: 62, sensors: 4, status: 'critical'
    },
    {
      id: 'academic-block-1', name: 'Academic Block 1', category: 'Academic', icon: 'building',
      baseline: 11000, current: 11450, tankLevel: 78, sensors: 6, status: 'normal'
    },
    {
      id: 'canteen', name: 'Central Canteen', category: 'Canteen', icon: 'utensils',
      baseline: 6500, current: 7900, tankLevel: 41, sensors: 3, status: 'warning'
    },
    {
      id: 'research-labs', name: 'Research Labs', category: 'Labs', icon: 'flask',
      baseline: 5200, current: 4980, tankLevel: 86, sensors: 5, status: 'normal'
    },
    {
      id: 'gardens', name: 'Gardens & Sports', category: 'Open Areas', icon: 'tree',
      baseline: 4300, current: 4760, tankLevel: 55, sensors: 3, status: 'warning'
    },
    {
      id: 'washrooms', name: 'Washroom Block', category: 'Washrooms', icon: 'bath',
      baseline: 3600, current: 3350, tankLevel: 92, sensors: 4, status: 'normal'
    }
  ];

  /* ---------------------------------------------------------------------
     Thresholds for the detection logic (slide 6: "Anomaly & risk
     detection — leak / overflow / irrigation")
     --------------------------------------------------------------------- */
  var THRESHOLDS = {
    warning: 15,   // % deviation above baseline
    critical: 30,  // % deviation above baseline
    overflow: 95   // tank level % considered overflow risk
  };

  var ANOMALY_TYPES = {
    leak:      { label: 'Probable Leak',      icon: 'bug',         severity: 'critical' },
    overflow:  { label: 'Tank Overflow Risk', icon: 'droplet',     severity: 'warning'  },
    irrigation:{ label: 'Irrigation Overrun', icon: 'tree',        severity: 'warning'  },
    anomaly:   { label: 'Consumption Anomaly',icon: 'activity',    severity: 'warning'  },
    normal:    { label: 'Within Baseline',    icon: 'checkCircle', severity: 'normal'   }
  };

  /* ---------------------------------------------------------------------
     Utility helpers
     --------------------------------------------------------------------- */
  function round(value, dp) {
    var f = Math.pow(10, dp === undefined ? 0 : dp);
    return Math.round(value * f) / f;
  }

  function deviationPct(zone) {
    if (!zone.baseline) return 0;
    return ((zone.current - zone.baseline) / zone.baseline) * 100;
  }

  function classify(zone) {
    var dev = deviationPct(zone);
    if (dev >= THRESHOLDS.critical) return 'critical';
    if (dev >= THRESHOLDS.warning) return 'warning';
    return 'normal';
  }


  /* ---------------------------------------------------------------------
     Engine
     --------------------------------------------------------------------- */
  var Engine = {
    THRESHOLDS: THRESHOLDS,
    ANOMALY_TYPES: ANOMALY_TYPES,

    /** Fresh copy of the blueprint seed data with computed fields. */
    zones: function () {
      return ZONES.map(function (z) {
        return Object.assign({}, z, {
          deviation: round(deviationPct(z), 1),
          status: classify(z)
        });
      });
    },

    /** Campus-level roll-up used by the dashboard stat cards. */
    summary: function () {
      var zones = Engine.zones();
      var baseline = 0;
      var current = 0;

      zones.forEach(function (z) {
        baseline += z.baseline;
        current += z.current;
      });

      var critical = zones.filter(function (z) { return z.status === 'critical'; }).length;
      var warning  = zones.filter(function (z) { return z.status === 'warning'; }).length;

      return {
        zones: zones,
        zoneCount: zones.length,
        baselineTotal: baseline,
        currentTotal: current,
        deviationPct: round(((current - baseline) / baseline) * 100, 1),
        criticalCount: critical,
        warningCount: warning,
        normalCount: zones.length - critical - warning,
        sensorCount: zones.reduce(function (sum, z) { return sum + z.sensors; }, 0),
        // Blueprint slide 7: "campus score 76/100 and 25,000 L/month water saved"
        conservationScore: 76,
        waterSavedMonthly: 25000,
        // Blueprint slide 7: RO reject 500 L/day, 400 L/day reused for irrigation
        reuse: { rejectWater: 500, reused: 400, freshWaterSaved: 400, savedPct: 80 }
      };
    },

    /** Conservation-score breakdown shown in the score ring panel. */
    scoreBreakdown: function () {
      return [
        { label: 'Consumption control', value: 82 },
        { label: 'Leak & overflow detection', value: 74 },
        { label: 'Reuse coverage', value: 80 },
        { label: 'Reporting response', value: 68 }
      ];
    },

    /**
     * Seven-day usage series used by the consumption chart.
     * Deterministic — derived from the campus daily reading.
     */
    weeklySeries: function () {
      var labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      var total = Engine.summary().currentTotal;
      /* Fractions shape a realistic weekday/weekend profile. */
      var profile = [1.04, 1.06, 1.02, 1.08, 1.0, 0.86, 0.82];

      return labels.map(function (label, i) {
        return {
          label: label,
          value: Math.round((total * profile[i]) / 7),
          baseline: Math.round((total / 7) * (i < 5 ? 1.02 : 0.92))
        };
      });
    },

    /**
     * Ranked anomaly feed derived from the zone readings.
     * Each entry maps to a cause hypothesis + recommended corrective action.
     */
    anomalies: function () {
      var zones = Engine.zones();
      var events = [];

      zones.forEach(function (z) {
        var dev = z.deviation;

        if (z.status === 'critical') {
          events.push({
            id: z.id + '-leak',
            zone: z.name,
            category: z.category,
            type: 'leak',
            severity: 'critical',
            title: 'Probable leak detected in ' + z.name,
            detail: 'Current usage ' + z.current.toLocaleString() + ' L/day against a baseline of ' +
                     z.baseline.toLocaleString() + ' L/day (' + (dev > 0 ? '+' : '') + dev + '% deviation).',
            action: 'Inspect riser pipelines and valve seals; log a repair ticket and isolate the line if confirmed.',
            time: '12 min ago'
          });
        } else if (z.status === 'warning') {
          events.push({
            id: z.id + '-overuse',
            zone: z.name,
            category: z.category,
            type: z.category === 'Open Areas' ? 'irrigation' : 'anomaly',
            severity: 'warning',
            title: (z.category === 'Open Areas' ? 'Irrigation overrun in ' : 'Above-baseline usage in ') + z.name,
            detail: 'Consumption ' + z.current.toLocaleString() + ' L/day, ' + (dev > 0 ? '+' : '') +
                     dev + '% against the configured baseline of ' + z.baseline.toLocaleString() + ' L/day.',
            action: z.category === 'Open Areas'
              ? 'Review the irrigation schedule and reduce the zone timer for the current cycle.'
              : 'Compare shift-wise readings against the baseline and check for a stuck or slow-draining fixture.',
            time: '1 hr ago'
          });
        }
      });

      /* Overflow risk is a level-based signal, independent of consumption. */
      zones.forEach(function (z) {
        if (z.tankLevel >= THRESHOLDS.overflow) {
          events.push({
            id: z.id + '-overflow',
            zone: z.name,
            category: z.category,
            type: 'overflow',
            severity: 'warning',
            title: 'Tank overflow risk in ' + z.name,
            detail: 'Tank level at ' + z.tankLevel + '% with no active draw-down detected.',
            action: 'Open the overflow discharge valve and notify the facility supervisor for a level reset.',
            time: '2 hr ago'
          });
        }
      });

      var order = { critical: 0, warning: 1, normal: 2 };
      return events.sort(function (a, b) { return order[a.severity] - order[b.severity]; });
    },

    /** Reuse-module figures from blueprint slide 7. */
    reuse: function () {
      return Engine.summary().reuse;
    },

    /** Monthly water-saved estimate from blueprint slide 7. */
    monthlySaving: function () {
      return Engine.summary().waterSavedMonthly;
    },

    /** Round helper exposed for views. */
    round: round
  };

  global.Engine = Engine;
})(window);
