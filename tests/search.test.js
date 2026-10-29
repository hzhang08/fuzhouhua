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
