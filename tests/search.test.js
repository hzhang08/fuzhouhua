// Exercise the actual browser search code without loading Vue or YouTube.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
const root = path.join(__dirname, '..');
const context = vm.createContext({
    Vue: function (options) { return { ...options.data, ...options.methods }; }
});
vm.runInContext(fs.readFileSync(path.join(root, 'js/search.js'), 'utf8'), context);
const rows = JSON.parse(fs.readFileSync(path.join(root, 'subtitles.json')));
context.vue.fuzhou1Json = rows;
assert.equal(context.convertToSeconds('01:02:03,750'), 3723.75);
assert.equal(context.convertToSeconds('00:00:05,500'), 5.5);
assert.equal(context.splitStringByKeyword('test', '').length, 1);
assert.equal(context.keywordSearch(0, rows[0].content).index, 1);
assert.equal(context.keywordSearch(rows.length, '讲'), null);
assert.equal(context.keywordSearch(0, 'NO_SUCH_CAPTION_123'), null);
const videos = JSON.parse(fs.readFileSync(path.join(root, 'captions/videos.json')));
for (const video of videos) {
    const imported = rows.filter(r => r.videoid === video.id);
    assert.equal(imported.length, video.cue_count);
    for (const row of imported) {
        const found = context.keywordSearch(row.index - 1, row.content);
        assert.equal(found.index, row.index);
        assert.equal(found.videoid, video.id);
        assert.ok(Number.isFinite(context.convertToSeconds(found.start)));
    }
}
// Following returned one-based indices must visit every match without repeats.
let offset = 0;
const matches = [];
for (;;) {
    const found = context.keywordSearch(offset, '福州');
    if (!found) break;
    assert.ok(found.index > offset);
    matches.push(found.index);
    offset = found.index;
}
assert.equal(matches.length, rows.filter(r => r.content.includes('福州')).length);
console.log(`Search, navigation offsets, all imported captions, and fractional timing passed (${rows.length} rows).`);

// Pause/resume must preserve the current position rather than reload the clip.
const playbackCalls = [];
context.vue.togglePlayback(); // Safe before the player is created.
context.vue.player = {
    pauseVideo() { playbackCalls.push('pause'); },
    playVideo() { playbackCalls.push('play'); },
    loadVideoById() { playbackCalls.push('load'); }
};
context.vue.togglePlayback(); // Safe while the iframe is still loading.
assert.deepEqual(playbackCalls, []);
context.vue.playerReady = true;
context.vue.togglePlayback();
assert.equal(context.vue.isPaused, true);
context.vue.togglePlayback();
assert.equal(context.vue.isPaused, false);
assert.deepEqual(playbackCalls, ['pause', 'play']);

// Embedded player controls and new clips keep the custom button synchronized.
let playerOptions;
context.YT = {
    PlayerState: { UNSTARTED: -1, ENDED: 0, PLAYING: 1, PAUSED: 2, BUFFERING: 3, CUED: 5 },
    Player: function (element, options) {
        playerOptions = options;
        return context.vue.player;
    }
};
context.onYouTubeIframeAPIReady();
assert.equal(playerOptions.events.onStateChange, context.onPlayerStateChange);
for (const state of [2, 1, 2, 3, 2, 5, 2, 0, 2, -1]) {
    playerOptions.events.onStateChange({ data: state });
    assert.equal(context.vue.isPaused, state === 2);
}
context.vue.playerReady = false;
playerOptions.events.onReady({ target: context.vue.player });
assert.equal(context.vue.playerReady, true);
assert.deepEqual(playbackCalls.slice(-2), ['load', 'play']);
console.log('Pause/resume, readiness guards, and YouTube state synchronization passed.');
