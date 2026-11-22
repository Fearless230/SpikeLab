# Film analysis benchmark

Measures how accurate the Film analysis is, against clips where the right answer is known.

The app's own 3D player (the rig in `js/player-data.js`) is filmed by a fixed virtual camera, like a phone on a
tripod. Every frame comes with the true 2D position of each joint, and the true flight time comes from when the
rendered feet leave and touch the floor. Compression and sensor noise are added so the clips look like phone video.

```
python3 -m http.server 8765                                    # from the repo root
python3 tests/film-bench/render_clips.py                       # renders the clips into tests/film-bench/out (slow: software 3D)
python3 tests/film-bench/evaluate.py 8765 block60               # runs the app's analysis on one clip and prints the errors
```

Needs Playwright for Python and ffmpeg. `CHROME=/path/to/chrome` picks the browser.

## Results (this release vs the previous one)

Position error is the average distance between tracked and true joints, as a percentage of body height. Angle errors
are the average absolute difference in the knee, hip and elbow angles seen in the picture.

| Clip | Version | Position error | Knee | Hip | Elbow | Flight time (true) | Jump height (true) |
|---|---|---|---|---|---|---|---|
| Block jump, 60 fps | new | 2.2% | 2.7° | 8.4° | 3.6° | 555 ms (556) | 37.8 cm (37.9) |
| | old | 16.5% | 42.7° | 15.3° | 23.1° | 953 ms | 111.4 cm, and saved as the vertical |
| Block jump, portrait 30 fps | new | 2.6% | 2.9° | 9.4° | 4.8° | 581 ms (579) | 41.3 cm (41.1) |
| | old | 17.8% | 23.5° | 18.3° | 26.6° | 940 ms | 108.2 cm |
| Spike approach, 30 fps | new | 2.6% | 3.6° | 9.9° | 8.5° | 741 ms (742) | 67.4 cm (67.5) |
| | old | 55.0% | 29.8° | 46.2° | 46.6° | not found | not found |
| Set, 30 fps | new | 2.2% | 4.0° | 7.3° | 5.6° | 445 ms (449) | 24.2 cm (24.7) |
| | old | 29.5% | 60.0° | 19.5° | 55.5° | not found | not found |
| Jump-float serve, 60 fps | new | 15.4% | 7.5° | 16.4° | 32.1° | 498 ms (574) | 30.5 cm (40.5) |
| | old | 79.5% | 36.9° | 25.8° | 40.7° | not found | not found |

The jump-float serve is the hard case: at the top of the serve the model loses the fast hitting arm, and the athlete
runs close to the edge of the frame. The hip angle error is similar on every clip, which suggests the cartoon body's hip joint
sits slightly differently from where the model expects a real hip.

Caveats: these are rendered clips of one stylised character; real video has more varied people, clothing, light
and backgrounds. Flight time combines two estimates that bracket the truth on these clips (threshold crossing, which
runs slightly long, and extending the foot's path to the floor, which runs slightly short), so check it against the
by-hand air time on your own clips.
