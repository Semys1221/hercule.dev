# Animation calme — tourbillon → océan

Exemple [Motion Canvas](https://motioncanvas.io/) : transition visuelle de l'agitation mentale (tourbillon) vers le calme (océan plat).

## Lancer l'éditeur

```bash
cd examples/calm-mind-animation
npm install
npm start
```

## Exporter la vidéo

1. Lancer `npm start`
2. Ouvrir http://localhost:9000/
3. Choisir **Video (FFmpeg)** dans les réglages
4. Cliquer **Render**

Les exports sont écrits dans `output/` :

- `output/project.mp4` — vidéo complète (~22 s, 1920×1080)
- `output/frames/` — images clés des 3 phases

## Structure de l'animation

| Phase | Durée approx. | Visuel |
|-------|---------------|--------|
| Agitation | 0–6 s | Particules en tourbillon, fond violet sombre |
| Transition | 6–10 s | Ralentissement, particules qui se posent |
| Calme | 10–22 s | Vagues horizontales douces, fond bleu océan |
