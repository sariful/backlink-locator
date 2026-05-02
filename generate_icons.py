from PIL import Image, ImageDraw

def create_icon(size, filename):
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Background circle (blue)
    margin = max(1, size // 12)
    draw.ellipse([margin, margin, size - margin, size - margin], fill=(0, 123, 255))
    
    # White "L" shape (using lines to avoid font dependencies)
    stroke = max(2, size // 10)
    # Vertical part
    draw.line([size//2.5, size//4, size//2.5, 3*size//4], fill="white", width=stroke)
    # Horizontal part
    draw.line([size//2.5, 3*size//4, size//1.5, 3*size//4], fill="white", width=stroke)
    
    # Small orange locator dot at bottom right
    dot_radius = max(2, size // 6)
    draw.ellipse([size - dot_radius*2, size - dot_radius*2, size - dot_radius, size - dot_radius], fill=(255, 87, 34))

    img.save(filename)

create_icon(16, 'icon16.png')
create_icon(48, 'icon48.png')
create_icon(128, 'icon128.png')
print("Icons generated successfully")
