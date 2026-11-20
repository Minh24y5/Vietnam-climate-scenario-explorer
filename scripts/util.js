'use strict';
/* Shared helpers: DOM lookups, averages, constants used across the page. */

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const mean = a => a.reduce((x, y) => x + y, 0) / a.length;
const N_YEARS = 151;
const REAL_URL = 'data/vietnam_cmip6.json';
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const DASHES = ['', '6 3', '2 3', '8 3 2 3', '4 4 1 4', '1 3', '10 4'];
