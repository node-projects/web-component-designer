# SVG shape library

The local palette merges the static MIT-licensed SVG path libraries from
SVG-Edit and Method Draw, retaining category names and removing duplicate shapes
within each category. Source revisions are recorded in `library.json`; copyright
and permission notices are in `THIRD_PARTY_NOTICES.txt`. Only path data is reused,
not either editor runtime. No remote requests are needed while using the palette.

The palette loads on demand. Shapes are ordinary SVG paths with a viewBox, so
object resizing, node editing, paint properties and undo use the Designer model.
