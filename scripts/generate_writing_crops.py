from PIL import Image, ImageChops

def autocrop(im, border=25):
    # Detect background color from corners
    bg = Image.new(im.mode, im.size, (255, 255, 255))
    diff = ImageChops.difference(im, bg)
    bbox = diff.getbbox()
    if bbox:
        left = max(0, bbox[0] - border)
        top = max(0, bbox[1] - border)
        right = min(im.size[0], bbox[2] + border)
        bottom = min(im.size[1], bbox[3] + border)
        return im.crop((left, top, right, bottom))
    return im

configs = [
    (30, 1180, 2220, "public/uploads/writing/test-15-writing-task1.png"),
    (52, 1180, 2220, "public/uploads/writing/test-16-writing-task1.png"),
    (73, 1200, 2220, "public/uploads/writing/test-17-writing-task1.png"),
    (95, 1210, 2230, "public/uploads/writing/test-18-writing-task1.png"),
]

for p_num, y0, y1, out_path in configs:
    im = Image.open(f"docs/cambridge_21_split/pdf_extract/renders/page_{p_num:03d}.png")
    # Horizontal range: 50 to 1600 (full width minus margins)
    cropped = im.crop((50, y0, im.size[0] - 50, y1))
    tight = autocrop(cropped)
    tight.save(out_path)
    print(f"Saved {out_path}: {tight.size}")
