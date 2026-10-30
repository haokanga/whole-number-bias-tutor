# Watch Your Steps — review iteration 3.0

This standalone Ocean Adventure activity asks the learner to inspect decimal sequences before continuing a route. Flint’s recorded climb introduces a shortcut that succeeds on earlier examples and fails when 1.9 is followed by 1.11. Bellum then guides the learner through identifying the decrease and rejecting continuation.

The activity uses the same stair setting for the recorded example and the two practice cases. A persistent entry summary identifies Flint’s chosen number. The separate number-line panel shows the actual numerical positions while the stair scene remains visible.

The learner selects one answer and then submits the decision through **Check my choice**. Specter’s entrance holds the portrait at full size before the portrait shrinks into the transmission panel. **Pause**, **Resume**, and animation-skip controls remain available. **Restart** is the single control for starting the activity again.

## Practice decisions

- For **1.96, 1.98, 1.100**, reject continuation: 1.100 equals 1.1, which is smaller than 1.98.
- For **1.096, 1.098, 1.100**, enter **1.102**, continuing by 0.002.

An incorrect submitted decision receives comparison feedback and allows a retry. In the practice cases, blank or malformed input receives a validation prompt and does not count as a submitted decision. The response export preserves the first submitted decision as well as later attempts. These practice cases are instructional activities.

## Use and review

Serve this folder with a static web server, then open `index.html`. For example:

```sh
python3 -m http.server 8770 --bind 127.0.0.1
```

The interface supports portrait and landscape layouts, with document scrolling when the content needs more space. The text-size target is at least 16 CSS pixels, with larger section headings. Review the rendered text at the target viewports rather than reducing type to fit a fixed-height frame.

**Save responses** downloads a JSON file containing decisions, attempts, feedback, and activity events. Responses remain in browser memory until the activity is restarted or reloaded. This preview does not connect to a production research-logging service.

## Review

The twelve numerical checks cover the recorded routes, the decrease in the trap route, exact decimal comparison, the corrected route, both practice decisions, equivalent trailing zeros, and malformed inputs. Run the checks with:

```sh
node --test tests/lesson.test.cjs tests/practice.test.cjs
```

The browser checker is `tests/v3-review.py` and requires Python Playwright. Set `UPSTAIRS_URL` to the hosted preview or local server, and set `CHROME_EXECUTABLE` when an installed Chrome needs to be selected. For example:

```sh
UPSTAIRS_URL=http://127.0.0.1:8770/ python3 tests/v3-review.py
```

The browser review page is `tests/v3-review.html`. The review covers these viewport sizes:

| Layout | Viewports |
| --- | --- |
| Tablet portrait | 768 × 1024; 820 × 1180; 834 × 1194 |
| Tablet landscape | 1024 × 768; 1180 × 820; 1194 × 834 |
| Compact browser | 800 × 600; 640 × 480; 825 × 722; 1063 × 722 |
| Narrow browser | 390 × 844; 319 × 723 |

Browser checks can verify displayed values, submitted decisions, responsive layouts, animation behavior, and exported records. Learner comprehension and learning effects require learner evaluation.
