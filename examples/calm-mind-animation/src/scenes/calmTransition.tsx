import {Circle, Line, makeScene2D, Rect, Txt} from '@motion-canvas/2d';
import {
  all,
  chain,
  createRef,
  createRefArray,
  easeInOutCubic,
  easeOutCubic,
  remap,
  spawn,
  useScene,
  Vector2,
  waitFor,
} from '@motion-canvas/core';

const PARTICLE_COUNT = 48;
const WAVE_COUNT = 6;

export default makeScene2D(function* (view) {
  view.fill('#0a0e14');

  const bg = createRef<Rect>();
  const title = createRef<Txt>();
  const subtitle = createRef<Txt>();
  const calmTitle = createRef<Txt>();
  const calmSubtitle = createRef<Txt>();
  const closing = createRef<Txt>();
  const particles = createRefArray<Circle>();
  const waves = createRefArray<Line>();

  view.add(
    <Rect
      ref={bg}
      width={'100%'}
      height={'100%'}
      fill={'#1a1028'}
      zIndex={-2}
    />,
  );

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const angle = (i / PARTICLE_COUNT) * Math.PI * 6;
    const radius = 40 + (i / PARTICLE_COUNT) * 220;
    const size = 4 + (i % 5) * 1.2;
    const opacity = 0.35 + (i % 7) * 0.08;

    view.add(
      <Circle
        ref={particles}
        x={Math.cos(angle) * radius * 0.35}
        y={Math.sin(angle) * radius * 0.35}
        width={size}
        height={size}
        fill={`hsl(${260 + (i % 12) * 8}, 55%, ${52 + (i % 4) * 6}%)`}
        opacity={opacity}
        zIndex={1}
      />,
    );
  }

  for (let i = 0; i < WAVE_COUNT; i++) {
    const y = -80 + i * 32;
    view.add(
      <Line
        ref={waves}
        points={buildWavePoints(-520, 520, y, 18, 0.012)}
        stroke={`hsl(${198 + i * 4}, 48%, ${58 + i * 3}%)`}
        lineWidth={2.2 - i * 0.15}
        opacity={0}
        zIndex={0}
      />,
    );
  }

  view.add(
    <Txt
      ref={title}
      text={'Agitation mentale'}
      fontFamily={'Inter, system-ui, sans-serif'}
      fontWeight={500}
      fontSize={52}
      fill={'#e8e4f0'}
      opacity={0}
      y={-300}
      zIndex={10}
    />,
  );

  view.add(
    <Txt
      ref={subtitle}
      text={'Comme un tourbillon qui emporte vos pensées'}
      fontFamily={'Inter, system-ui, sans-serif'}
      fontWeight={400}
      fontSize={26}
      fill={'#9b93ab'}
      opacity={0}
      y={-248}
      zIndex={10}
    />,
  );

  view.add(
    <Txt
      ref={closing}
      text={"Vers un calme plat, comme l'océan au repos"}
      fontFamily={'Inter, system-ui, sans-serif'}
      fontWeight={400}
      fontSize={28}
      fill={'#b8dce8'}
      opacity={0}
      y={280}
      zIndex={10}
    />,
  );

  // Phase 1 — tourbillon
  yield* all(
    title().opacity(1, 1.2, easeOutCubic),
    subtitle().opacity(1, 1.4, easeOutCubic),
  );

  spawn(function* () {
    const duration = 5.5;
    const start = useScene().playback.time;

    while (useScene().playback.time - start < duration) {
      const t = useScene().playback.time - start;
      const p = easeInOutCubic(remap(0, duration, 0, 1, t));
      const speed = remap(0, 1, 2.8, 0.15, p);
      const chaos = remap(0, 1, 1, 0.2, p);

      particles.forEach((particle, i) => {
        const baseAngle =
          (i / PARTICLE_COUNT) * Math.PI * 6 + t * speed * (1.2 + (i % 5) * 0.15);
        const radius = (40 + (i / PARTICLE_COUNT) * 220) * chaos;
        const wobble = Math.sin(t * 3.5 + i) * 12 * chaos;
        particle.position(
          new Vector2(
            Math.cos(baseAngle) * radius * 0.35 + wobble,
            Math.sin(baseAngle) * radius * 0.35 + wobble * 0.6,
          ),
        );
        particle.opacity(remap(chaos, 0.2, 1, 0.08, 0.55 + (i % 7) * 0.08));
      });

      yield;
    }
  });

  yield* waitFor(5.5);

  // Phase 2 — transition
  yield* all(
    title().text('La transition', 1.2, easeInOutCubic),
    subtitle().text('Ralentir. Observer. Laisser retomber.', 1.2, easeInOutCubic),
    bg().fill('#0c1a2e', 2.5, easeInOutCubic),
  );

  spawn(function* () {
    const duration = 4;
    const start = useScene().playback.time;
    const startPositions = particles.map(p => p.position());

    while (useScene().playback.time - start < duration) {
      const t = useScene().playback.time - start;
      const progress = easeInOutCubic(remap(0, duration, 0, 1, t));

      particles.forEach((particle, i) => {
        const targetY = -60 + (i % 8) * 18 + Math.sin(i) * 6;
        const targetX = remap(0, PARTICLE_COUNT - 1, -420, 420, i);
        const from = startPositions[i];
        const to = new Vector2(targetX, targetY);
        particle.position(Vector2.lerp(from, to, progress));
        particle.opacity(remap(progress, 0, 1, particle.opacity(), 0.12 + (i % 3) * 0.04));
        particle.scale(remap(progress, 0.6, 1, 1, 0.6));
      });

      yield;
    }
  });

  yield* waitFor(4);

  // Phase 3 — océan calme
  yield* chain(
    title().opacity(0, 0.8, easeInOutCubic),
    subtitle().opacity(0, 0.8, easeInOutCubic),
  );

  yield* all(
    bg().fill('#0a2538', 2, easeInOutCubic),
    ...waves.map((wave, i) => wave.opacity(0.25 + (i % 3) * 0.08, 2, easeOutCubic)),
    closing().opacity(1, 2, easeOutCubic),
  );

  view.add(
    <Txt
      ref={calmTitle}
      text={'Calme intérieur'}
      fontFamily={'Inter, system-ui, sans-serif'}
      fontWeight={500}
      fontSize={52}
      fill={'#dff3f8'}
      opacity={0}
      y={-300}
      zIndex={10}
    />,
  );

  yield* calmTitle().opacity(1, 1.5, easeOutCubic);

  view.add(
    <Txt
      ref={calmSubtitle}
      text={"Comme l'océan plat après la tempête"}
      fontFamily={'Inter, system-ui, sans-serif'}
      fontWeight={400}
      fontSize={26}
      fill={'#7eb8cc'}
      opacity={0}
      y={-248}
      zIndex={10}
    />,
  );

  yield* calmSubtitle().opacity(1, 1.5, easeOutCubic);

  spawn(function* () {
    const duration = 6;
    const start = useScene().playback.time;

    while (useScene().playback.time - start < duration) {
      const t = useScene().playback.time - start;

      waves.forEach((wave, i) => {
        wave.points(
          buildWavePoints(-520, 520, -80 + i * 32, 10 - i * 0.8, 0.008, t * 0.6 + i * 0.4),
        );
      });

      particles.forEach((particle, i) => {
        const baseX = remap(0, PARTICLE_COUNT - 1, -420, 420, i);
        const baseY = -60 + (i % 8) * 18;
        particle.position(
          new Vector2(baseX, baseY + Math.sin(t * 0.8 + i * 0.3) * 3),
        );
      });

      yield;
    }
  });

  yield* waitFor(6);

  yield* all(
    calmTitle().opacity(0, 1.2, easeInOutCubic),
    calmSubtitle().opacity(0, 1.2, easeInOutCubic),
    closing().opacity(0, 1.2, easeInOutCubic),
    ...waves.map(wave => wave.opacity(0, 1.2, easeInOutCubic)),
  );

  yield* waitFor(0.5);
});

function buildWavePoints(
  fromX: number,
  toX: number,
  baseY: number,
  amplitude: number,
  frequency: number,
  phase = 0,
): Vector2[] {
  const points: Vector2[] = [];
  const steps = 80;

  for (let i = 0; i <= steps; i++) {
    const x = remap(0, steps, fromX, toX, i);
    const y = baseY + Math.sin(x * frequency + phase) * amplitude;
    points.push(new Vector2(x, y));
  }

  return points;
}
