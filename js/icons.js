// Small, locally rendered symbols. No icon font or external image requests.
const ICON_PATHS = {
  spark: '<path d="m12 3 2.6 6.4L21 12l-6.4 2.6L12 21l-2.6-6.4L3 12l6.4-2.6Z"/>',
  target: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><path d="m12 12 8-8m-5 0h5v5"/>',
  timer: '<circle cx="12" cy="14" r="7"/><path d="M9 3h6m-3 0v4m0 7 3-3m3-5 2 2"/>',
  layers: '<path d="m12 3 9 5-9 5-9-5Zm-9 9 9 5 9-5M3 16l9 5 9-5"/>',
  review: '<path d="M3 11a9 9 0 1 1 2.8 7M3 5v6h6m3-4v5l3 2"/>',
  arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
  book: '<path d="M12 5v15M3 4h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5v15h-5a4 4 0 0 0-4 2 4 4 0 0 0-4-2H3Z"/>',
  chart: '<path d="M4 4v16h16M8 16v-4m5 4V8m5 8V5"/>',
  flag: '<path d="M5 21V3m0 1c4-3 8 3 14 0v10c-6 3-10-3-14 0"/>',
  theme: '<circle cx="12" cy="12" r="8"/><path d="M12 4a8 8 0 0 1 0 16Z"/>',
  branch: '<circle cx="6" cy="5" r="2"/><circle cx="18" cy="6" r="2"/><circle cx="6" cy="19" r="2"/><path d="M6 7v10m0-4h5a7 7 0 0 0 7-5"/>',
  check: '<path d="m5 12 4 4L19 6"/>'
};
function icon(name, extraClass = '') {
  return `<svg class="icon ${extraClass}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${ICON_PATHS[name] || ICON_PATHS.spark}</svg>`;
}
function reasoningIllustration() {
  return '<svg class="hero-orbit" viewBox="0 0 240 180" fill="none" aria-hidden="true" focusable="false"><circle cx="120" cy="90" r="66" stroke="currentColor" stroke-opacity=".25" stroke-dasharray="4 7"/><path d="M53 95 111 41l69 75-66 28Z" stroke="currentColor" stroke-opacity=".45" stroke-width="1.5"/><rect class="orbit-node" x="26" y="70" width="50" height="50" rx="15" fill="#f1bd64"/><path d="m40 96 8 8 15-18" stroke="#183b3a" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><rect class="orbit-node" x="86" y="16" width="50" height="50" rx="15" fill="#b6dad1"/><path d="m111 27 4 10 10 4-10 4-4 10-4-10-10-4 10-4Z" stroke="#183b3a" stroke-width="2"/><rect class="orbit-node" x="155" y="91" width="50" height="50" rx="15" fill="#ef9d86"/><path d="M167 127v-7m12 7v-15m12 15v-24" stroke="#183b3a" stroke-width="3" stroke-linecap="round"/><circle cx="114" cy="144" r="8" fill="#bcb0e0"/></svg>';
}
export { icon, reasoningIllustration };
