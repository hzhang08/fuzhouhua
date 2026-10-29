"""Rebuild the runtime index from portable, reviewed video captions."""
import argparse
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def timestamp(seconds):
    ms = round(seconds * 1000)
    return f'{ms // 3600000:02}:{ms // 60000 % 60:02}:{ms // 1000 % 60:02},{ms % 1000:03}'


def build():
    videos = json.loads((ROOT / 'captions/videos.json').read_text())
    ids = [v['id'] for v in videos]
    assert len(ids) == len(set(ids)), 'Duplicate video ID'
    existing = json.loads((ROOT / 'subtitles.json').read_text())
    result = [r for r in existing if r['videoid'] not in ids]
    for video in videos:
        vid = video['id']
        assert video['url'] == f'https://www.youtube.com/watch?v={vid}'
        cues = json.loads((ROOT / f'captions/{vid}/{vid}.zh-Hans.json').read_text())
        assert len(cues) == video['cue_count'], vid
        last_end = 0
        for cue in cues:
            start, end = cue['start'], cue['end']
            assert math.isfinite(start) and math.isfinite(end)
            assert last_end <= start < end <= video['duration'], (vid, cue)
            assert isinstance(cue['text'], str) and cue['text'].strip()
            result.append(dict(index=0, start=timestamp(start), end=timestamp(end),
                               content=cue['text'], videoid=vid))
            last_end = end
    for index, row in enumerate(result, 1):
        row['index'] = index
    return result


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    result = build()
    path = ROOT / 'subtitles.json'
    if args.check:
        assert json.loads(path.read_text()) == result, 'Run scripts/build_captions.py'
        print(f'Validated {len(result)} captions across {len({r["videoid"] for r in result})} videos')
    else:
        path.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
