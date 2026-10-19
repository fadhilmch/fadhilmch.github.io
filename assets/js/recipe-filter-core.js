// Pure filter rules for the After Work recipe lists. No DOM access, so it is unit tested in Node.
// A selection maps a group id to the values picked in it: { origin: ['Indonesia'], method: [] }.
// A recipe is shown when, for every group that has picks, it carries at least one of them.
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.RecipeFilterCore = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var VISIBLE_OPTIONS = 6;
  var SEARCH_THRESHOLD = 8;

  function picks(selection, group) { return (selection && selection[group]) || []; }

  function matches(selection, recipe) {
    return Object.keys(selection).every(function (group) {
      var wanted = picks(selection, group);
      if (!wanted.length) return true;
      var have = (recipe && recipe[group]) || [];
      return wanted.some(function (value) { return have.indexOf(value) > -1; });
    });
  }

  function toggle(selection, group, value) {
    var next = {};
    Object.keys(selection).forEach(function (key) { next[key] = selection[key].slice(); });
    var list = next[group] || (next[group] = []);
    var at = list.indexOf(value);
    if (at > -1) list.splice(at, 1); else list.push(value);
    return next;
  }

  function total(selection) {
    return Object.keys(selection).reduce(function (sum, group) { return sum + selection[group].length; }, 0);
  }

  function parseValues(attribute) { return attribute ? attribute.split('|').filter(Boolean) : []; }

  function summary(selection, group) {
    var list = picks(selection, group);
    if (!list.length) return 'Any';
    return list.length === 1 ? list[0] : list[0] + ' +' + (list.length - 1);
  }

  function countLabel(count) {
    return count === 1 ? '1 recipe' : count + ' recipes';
  }

  return { VISIBLE_OPTIONS: VISIBLE_OPTIONS, SEARCH_THRESHOLD: SEARCH_THRESHOLD, matches: matches, toggle: toggle, total: total, parseValues: parseValues, summary: summary, countLabel: countLabel };
});
