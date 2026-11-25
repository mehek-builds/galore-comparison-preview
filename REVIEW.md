# Galore preview review

The preview was checked at desktop 1280px and phone widths 390px and 320px. The document width matched each viewport. The page background computed to `rgb(0, 4, 18)`, main text to `rgb(232, 238, 242)`, and the main action to `rgb(43, 240, 138)`. The font computed to Geist. Images and logos loaded; the only empty image elements are deliberately hidden platform placeholders.

| Comparison point | Implementation | Check |
| --- | --- | --- |
| Immediate plain-language entry | The hero begins with an idea and explains the next step in two sentences. | Read and viewed on desktop and phone. |
| One obvious action | The aurora waitlist action leads the hero, header, story, and closing. | Opened the sheet from the phone header. |
| One continuing example | The electricity belief carries the explanation through connections, checks, and watch. | Viewed and switched all three story panels. |
| Short causal explanation | Each connection has a short reason beside it. | Read the rows in both desktop and stacked phone layouts. |
| Risks before action | The second story panel asks what supports or weakens the belief and how it compared historically. | Switched by click and keyboard ArrowRight. |
| Social context | Creator records and public people sit alongside the idea flow. | Viewed the feature sections and photos on phone. |
| A legible product view | Home, Explore, Portfolio, and Watchlist show the organization without fabricated returns. | Switched tabs by click and keyboard End on desktop and phone. |
| Open section rhythm | Rules and spacing separate modules; compact examples are used only where the interface needs them. | Reviewed hero, story, product, FAQ, and closing. |
| Three-color focus | Black canvas, ice-white type, and green actions and selected states. | Checked computed colors in the deployed browser. |
| Mobile and control clarity | The phone menu, readable submit button, sticky action, FAQ, and tab panels are sized for touch. | Checked 390px and 320px, menu state, sticky action, FAQ, and form validation. |

The waitlist form was submitted with a disposable test address. It showed the preview-only receipt and saved nothing. A direct `/waitlist` visit opened the sheet. About, Pricing, Contact, and the static dashboard page rendered. No production Galore deployment was changed.

## Active motion inventory

| Motion | Timing and behavior | Check |
| --- | --- | --- |
| Background water | Continuous canvas flow, kept faint behind content. | Viewed on desktop and phone. |
| Hero entry | The hero copy and console rise once over 1.2 seconds on load. | Inspected computed active animation and initial render. |
| Market tape | Two continuous linear rows, 68 and 92 seconds per cycle; they continue through hover and focus. | Both tracks computed as running after reload. |
| Input prompt | Placeholder types at roughly 62 to 132 ms per character, erases at 22 ms, and restarts after 500 ms when idle. | Watched the text change on phone; code timing checked. |
| Feature records | Public call badges replay every 7.6 seconds; the badge entrance lasts 1 second. | Confirmed active `play` state in the deployed DOM. |
| Watchlist example | Types at 46 ms per character after 500 ms; supporting steps follow at 0.5, 1.3, and 2.1 seconds after typing; repeats every 11.5 seconds. | Observed stage classes advance to the final state. |
| Post to idea example | Stages appear at 1, 2.1, and 3.2 seconds; platform emphasis moves every 1.45 seconds; the cycle repeats every 9 seconds. | Observed stage classes advance to the final state. |
| Story and dashboard tabs | Selected underline changes immediately; new panel enters for 0.25 seconds and remains until another tab is chosen. | Tested click and keyboard controls in both groups. |
| Mobile menu | Opens once over 0.45 seconds and settles on an opaque black panel. | Viewed opening and settled states; sticky CTA hides while open. |
| Waitlist sheet | The sheet translates for 0.42 seconds, backdrop for 0.32 seconds; a downward grip drag dismisses it. | Opened and dismissed by grip drag on phone; submitted a simulated signup. |
| FAQ disclosure | The answer expands or contracts over 0.5 seconds and closes the previously open item. | Tested the paper trading question. |
| Button press and invalid belief | Press scales to 0.97 over 0.16 seconds; invalid input gets a 0.42-second shake plus visible error text. | Tested the invalid belief message and inspected computed timing. |
| Example result | The explanatory panel enters for 0.35 seconds and shows no generated performance figures. | Opened a sample belief after the final deploy. |

`prefers-reduced-motion: reduce` removes CSS animations and shortens transitions in the inherited stylesheet; the preview's custom tab entrances and canvas flow are also disabled. This was checked in source, since the browser viewport control does not offer a reduced-motion override.
