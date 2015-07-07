"use strict";

const parser = require("./parser");
const util = require("util");

/*
 * chain together parsers p1 & p2 such that if p1 matches, p2 is executed on
 * the following state. if both match, `combiner` is called with the two
 * matched objects, to create a single match result.
 */
function chain(p1, p2, combiner) {
  return parser.newParser("chain", {
    children: [ p1, p2 ],
    describe: (list) => `${list[0]} then ${list[1]}`,
  }, (state, results, p1, p2) => {
    state.schedule(p1).then(match1 => {
      if (!match1.ok) {
        results.add(match1);
      } else {
        match1.state.schedule(p2).then(match2 => {
          if (!match2.ok) {
            // no backtracking if the left match was commit()'d.
            if (match1.commit) match2.abort = true;
            results.add(match2);
          } else {
            const newState = match2.state.merge(match1.state);
            const value = combiner(match1.value, match2.value);
            results.add(match1.commit || match2.commit ? newState.commitSuccess(value) : newState.success(value));
          }
        });
      }
    });
  });
}

/*
 * chain together a series of parsers as in 'chain'. the match value is an
 * array of non-null match values from the inner parsers.
 */
function seq(...parsers) {
  return parser.newParser("seq", {
    children: parsers,
    describe: list => list.join(" then ")
  }, (state, results, ...parsers) => {
    const rv = [];
    let commit = false;

    function next(state) {
      if (parsers.length == 0) return results.add(commit ? state.commitSuccess(rv) : state.success(rv));
      const p = parsers.shift();
      state.schedule(p).then(match => {
        // no backtracking if we commit()'d in this chain.
        if (!match.ok) return results.add(commit ? match.toAbort() : match);
        if (match.commit) commit = true;
        if (match.value != null) rv.push(match.value);
        next(state.merge(match.state));
      });
    }

    next(state);
  });
}

/*
 * try each of these parsers, in order (starting from the same position),
 * looking for the first match.
 */
function alt(...parsers) {
  return parser.newParser("alt", {
    children: parsers,
    describe: list => list.join(" or ")
  }, (state, results, ...parsers) => {
    let aborting = false;
    parsers.forEach(p => {
      state.schedule(p).then(match => {
        if (aborting) return;
        if (match.abort) aborting = true;
        results.add(match);
      });
    });
  });
}

/*
 * throw away the match value, equivalent to `onMatch(null)`.
 */
function drop(p) {
  return parser.newParser("drop", { wrap: p }, (state, results, p) => {
    state.schedule(p).then(match => {
      results.add(match.ok ? match.withValue(null) : match);
    });
  });
}

/*
 * allow a parser to fail, and instead return a default value (the empty string
 * if no other value is provided).
 */
function optional(p, defaultValue="") {
  return parser.newParser("optional", { wrap: p }, (state, results, p) => {
    state.schedule(p).then(match => {
      results.add(
        match.ok || match.abort ?
        match :
        (match.commit ? state.commitSuccess(defaultValue) : state.success(defaultValue))
      );
    });
  });
}

/*
 * check that this parser matches, but don't advance our position in the
 * string. (perl calls this a zero-width lookahead.)
 */
function check(p) {
  return parser.newParser("check", { wrap: p }, (state, results, p) => {
    state.schedule(p).then(match => {
      results.add(match.ok ? match.withState(state) : match);
    });
  });
}


exports.alt = alt;
exports.chain = chain;
exports.check = check;
exports.drop = drop;
exports.optional = optional;
exports.seq = seq;
