import resolve from "./packrattle/resolve";

resolve.build = resolve;

// for backward compatibility, put everything on the default exported function.

import * as combiners from "./packrattle/combiners";
for (const k in combiners) resolve[k] = combiners[k];

import * as parser from "./packrattle/parser";
for (const k in parser) resolve[k] = parser[k];

import * as parser_state from "./packrattle/parser_state";
for (const k in parser_state) resolve[k] = parser_state[k];

import PriorityQueue from "./packrattle/priority_queue";
resolve.PriorityQueue = PriorityQueue;

import * as simple from "./packrattle/simple";
for (const k in simple) resolve[k] = simple[k];

// export "default": babel can't do this anymore.
module.exports = resolve;
