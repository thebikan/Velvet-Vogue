# Asset provenance

All assets are stored in `Front-end/assets/`; no third-party image/font request is needed at runtime.

## Original generated imagery

Generated with the built-in imagegen tool, not the API/CLI fallback. Originals remain in the tool's output directory; project copies are saved here:

- `assets/campaign.png`: original campaign photograph.
- `assets/knit.png`: original knitwear editorial photograph.

Campaign prompt: “Use case: photorealistic-natural. Asset type: wide hero photograph for a contemporary fashion label Velvet Vogue. Create a premium fashion editorial photograph, wide landscape 3:2 composition. Two adult fashion models on the RIGHT two thirds of the composition, a brunette woman in an oversized ivory linen blazer and cream tailored trousers with a simple ivory tank, a man in soft stone grey relaxed tailoring and white tee. Both standing naturally in sunlight, looking confidently slightly away from camera, candid understated fashion campaign, realistic hands, authentic skin texture. Warm limestone courtyard, sculptural pale beige wall and deep architectural shadows, muted warm neutral palette, natural afternoon sunlight. LEFT third should be largely empty pale warm stone wall with subtle shadow, suitable for large black HTML headline overlay. Full or three-quarter bodies visible, distinct premium editorial art direction, beautiful fabric detail, minimal not glamorous. No text, no lettering, no brand marks, no logos, no watermark, no UI. Not a collage. Original people.”

Knit prompt: “Use case: photorealistic-natural. Asset type: portrait fashion editorial/product look for a minimal luxury clothing website. Original adult woman in an oversized oatmeal beige textured knit sweater with a soft high collar, dark brown shoulder-length hair tucked back, minimal natural makeup, off-white trousers partly visible. Three-quarter length portrait, relaxed pose with one hand gently touching the sweater collar, looking just away from camera. Plain warm pale grey studio wall, beautiful diffuse natural daylight, understated Scandinavian fashion photography, realistic tactile knit texture and skin, premium editorial quality. Vertical 2:3 composition, generous space around model, head fully within image, sweater fully visible. No text, no logos, no watermark, no other props. Neutral desaturated colors.”

## Editorial reference photography

These are illustrative Unsplash photographs, not Velvet Vogue supplier product records. Retain this provenance when replacing them with actual product photography.

- `blazer.jpg`: [Alina Matveycheva — oversized beige blazer](https://unsplash.com/photos/MNwRn2MMHPM), image `photo-1747815065172-a3234582223e`.
- `blazer-alt.jpg`: [Alina Matveycheva — oversized blazer](https://unsplash.com/photos/ipwSbsAjzLo), image `photo-1747817330507-3d008dc5b324`.
- `coat.jpg`: [Taras Chernus — man in brown coat](https://unsplash.com/photos/iIjResyhhW0), image `photo-1619603364904-c0498317e145`.
- `men.jpg`: [Sirio — man wearing brown coat](https://unsplash.com/photos/iQssRbf3S0k), image `photo-1575863061765-a8968c8c073c`.
- `bag.jpg`: [Fujiphilm — black bag on white chair](https://unsplash.com/photos/qNpYxFtCXxU), image `photo-1695733216485-73b78110ca51`.

Photo licensing: https://unsplash.com/license . Before commercial launch, review suitability/releases for the actual intended product/advertising use and replace illustrative photographs with approved product assets.

## Typography and icons

`dm-sans.woff2` is DM Sans, distributed under the SIL Open Font License via the Fontsource package (`@fontsource-variable/dm-sans`). The accompanying license is `assets/DM-Sans-LICENSE.txt`. Georgia is a system-font fallback for editorial headings. Icons and the SVG favicon were authored as code for this project.
