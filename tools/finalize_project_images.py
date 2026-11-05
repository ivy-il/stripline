"""Save the selected generated architectural images and update the three projects."""
from pathlib import Path
from PIL import Image
import json
import shutil

root = Path(__file__).resolve().parents[1]
generated = Path('C:/Users/liron/.codex/generated_images/01a0e7d7-bf93-7b83-9ca1-0feb3216e894')
originals = root / 'output/imagegen/project-images'
public = root / 'site/public/images/projects'
originals.mkdir(parents=True, exist_ok=True)
public.mkdir(parents=True, exist_ok=True)

# Main image and one genuinely different gallery view per project.
assets = {
    'villa-caesarea': {
        'hero': ('exec-699db4b0-f73b-44e3-8450-98dfc8a535de.png', 'Caesarea villa living room opening to a garden and pool, slim linear ceiling diffusers, warm limestone and oak.'),
        'gallery': ('exec-28204e36-3a8d-43ff-a6eb-69721e3b35ca.png', 'Different view of the same villa concept: kitchen and dining room, garden glazing, continuous ceiling diffuser slots.'),
    },
    'penthouse-tel-aviv': {
        'hero': ('exec-dfcaec21-05d8-4324-8803-d94dea9e8962.png', 'Tel Aviv penthouse living room at sunset, walnut TV wall with a flush black linear air grille, city skyline.'),
        'gallery': ('exec-c4e7fee5-15fa-4d5f-9cad-0c044350eb64.png', 'Different dining-room view of the same penthouse concept at blue hour, matching walnut TV wall and black linear grille.'),
    },
    'offices-herzliya': {
        'hero': ('exec-06ace8e5-571b-42f0-b1f1-245f9c8744ec.png', 'Herzliya high-tech office open workspace, glazing, oak desks and subtle square swirl ceiling diffusers.'),
        'gallery': ('exec-9445a256-0d73-4566-8934-e7e6e5847abb.png', 'Different meeting-room view of the same office concept, continuous ceiling slots and open workspace beyond glass.'),
    },
}
data_path = root / 'site/src/data/projects.json'
projects = json.loads(data_path.read_text(encoding='utf-8'))
assert set(assets) == {p['slug'] for p in projects}
manifest = []
for project in projects:
    slug = project['slug']
    urls = {}
    for role, (source_name, prompt_summary) in assets[slug].items():
        source = generated / source_name
        assert source.is_file(), source
        original = originals / f'{slug}-{role}-v1.png'
        site_image = public / f'{slug}-{role}-v1.webp'
        shutil.copy2(source, original)
        with Image.open(original) as image:
            assert image.width >= 1500 and image.height >= 900, original
            image.convert('RGB').save(site_image, 'WEBP', quality=92, method=6)
            dimensions = [image.width, image.height]
        urls[role] = f'/images/projects/{site_image.name}'
        manifest.append({'project': slug, 'role': role, 'original': str(original.relative_to(root)), 'site_asset': urls[role], 'dimensions': dimensions, 'prompt': 'Photorealistic architectural editorial visualization; ' + prompt_summary + ' No people, logos, lettering, watermarks or implausible HVAC geometry.'})
    project['image'] = urls['hero']
    project['gallery'] = [urls['gallery']]

data_path.write_text(json.dumps(projects, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
(originals / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print('Saved six project images and updated three project records.')
