# Kepler-III → Vault Theta repair

This is a local salvage edit of the two supplied, previously AI-generated OpenArt videos. No generation calls, OpenArt credits, or paid services were used for this repair. No additional scenery was generated.

## Files and use

- `index.html`: self-contained page component with relative media URLs. Open in a normal browser to preview, or serve the folder from your website. Click **Begin descent** to play with the original audio; **Go to the vault** and **Skip journey** reveal the destination immediately. Reduced-motion visitors receive the static destination. Replay is available.
- `kepler-to-vault.mp4`: 1280×720, H.264, 24 fps, AAC, fast-start, 19.708 seconds. Contains the original descent through frame 352, followed by a five-second composite including a final hold. There is no fade to black and the video must not loop.
- `hatch-transition.mp4`: five-second, silent, 1280×720 transition only. Its first image is the last usable descent frame. To append this version yourself, retain exactly frames 0–352 of the descent (353 frames, 14.708333 seconds at 24 fps).
- `vault-theta-final.png` / `.webp`: clean 1280×720 background, without text or links. WebP is the lighter website asset.
- `arrival-source.png`: unretouched descent frame 352 at 14.666667 seconds.
- `extension-salvage.png`: unretouched extension frame 100 at 4.166667 seconds, used for the tunnel crop.
- `canopy.png` / `cockpit-sill.png`: transparent canopy layer and lower cockpit layer used in the composite.
- `inspection/`: every source frame appears in a contact sheet, plus key transition frames. The descent pages cover frames 0–329; `descent-every-frame.jpg` covers 330–360. Extension sheet covers 0–120.
- CSV audits contain per-frame time, mean brightness and difference from the preceding decoded frame; `provenance.json` records crop and edit decisions; `verification.json` records output checks.

## Website integration

Copy this folder to your website, keeping the relative paths together, or adapt the `<section class="stage">`, styles and script into your existing Rewards page. All media is local to this package; it makes no third-party requests. No framework or build step is needed.

Change the two navigation destinations in `index.html` from `/rewards` and `/hall-of-fame` to your actual application routes. These routes are sensible defaults, not verified existing pages. Deployment and integration into a live website have not been performed.

The page reveals navigation at 17.45 seconds, just after the hatch fully opens at approximately 17.408 seconds. It transitions to the matching still while fading the navigation in over one second. The still remains indefinitely. Navigation is real HTML, keyboard accessible and not baked into the MP4. The video itself contains no Rewards/Hall of Fame titles or clickable links; use the HTML for the complete experience.

The original descent audio is retained and faded out between 13.7 and 14.708 seconds. The composite and held ending are silent; no new mechanical sound effects were invented. Playback begins after a user gesture. Add your own licensed hatch sound if desired. Mobile layouts use `object-fit: cover`, which crops the wide composition; change this to `contain` to retain the full frame with letterboxing.

## Frame inspection and editorial decisions

Both files are 1280×720 at 24 fps. Descent has 361 decoded frames; extension has 121. All 482 frames were decoded, measured and reviewed in consecutive frame contact sheets. This is a visual contact-sheet inspection, not a claim that every frame was examined individually at full resolution.

The descent shows the launch bay, ice descent and blue-lit underground tunnel. Frames 353–360 are almost black. Frame 352 is the last usable arrival, so the cut is after frame 352, not at the nominal 15-second endpoint.

The extension shows icy exterior frames 0–16, cuts back to the launch bay at frame 17, and returns to an arrival-like tunnel view by roughly frames 60–64. Its latter section is largely static. Neither supplied MP4 contains a finished pod-hatch opening, Rewards page, named Vault Theta facade, or visible end-credit title card. The extension's early discontinuous sequence was excluded.

## What is composited and what is source imagery

The repaired opening is an editorial 2D canopy-and-sill retraction: a glass-clearing dissolve, upward canopy movement, and downward cockpit sill movement. It is a stylized interpretation of a pod exit, not recovered footage of a mechanically accurate hatch. Its straight layer boundary and limited perspective are compromises of using existing stills. No new architectural Vault Theta facade has been fabricated.

The final view is the extension's existing tunnel, designated as the Vault Theta approach by the HTML title. It is an enlarged 464×261 crop, rectangle `(408,78)` to `(872,339)`, from extension frame 100. It has been resized with Lanczos to 1280×720, without generative enhancement or added texture. Output dimensions are 720p, but the tunnel's effective detail remains that of the smaller crop; some glass haze and softness remain. It cannot honestly be presented as a newly rendered high-detail vault exterior.

## Verification and limits

The final MP4 decodes to 473 frames, 1280×720. No output frames are black. The join between decoded frames 352 and 353 has mean absolute RGB error approximately 0.033 on a 0–255 scale. The final encoded frame differs from the PNG by approximately 1.32 RGB levels on average because of lossy video compression. Source imagery is held unchanged for the final approximately 2.3 seconds; compressed decoded frames may vary slightly.

JavaScript syntax and all referenced local media paths were checked. Transition keyframes were visually reviewed. An interactive browser smoke test was not completed: the preview tool blocked local `file:` URLs. Playback, focus behavior, mobile framing and final routes should be checked in your target browser before deployment. No claim is made that this is already integrated into your live site.

## Original inputs

Descent: https://cdn.openart.ai/openart-ai/production/2026-10/create-video/I42k5Ykm2l0Kz5PiBqjJ/cgt-20261018051507-v057y_1792271887741_39a4b1fb.mp4

Extension: https://cdn.openart.ai/openart-ai/production/2026-10/create-video/I42k5Ykm2l0Kz5PiBqjJ/cgt-20261018053038-8vx7j_1792272825340_bfb4df44.mp4
