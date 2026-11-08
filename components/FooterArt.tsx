// Antonietta Brandeis, Il Foro Romano: https://commons.wikimedia.org/wiki/File:Antonietta_Brandeis_Il_Foro_Romano.jpg
export function FooterArt() {
  return (
    <svg className="footer-scape" viewBox="0 0 2000 800" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
      <defs>
        {[
          { ink: "lime", seed: 11, density: 1, shift: true },
          { ink: "ultra", seed: 3, density: 0.92, shift: false },
        ].map(({ ink, seed, density, shift }) => (
          <filter key={ink} id={`forum-${ink}`} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
            <feColorMatrix values={`0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  ${-density} 0 0 0 ${density}`} result="tone" />
            <feTurbulence type="fractalNoise" baseFrequency=".5" numOctaves="2" seed={seed} />
            <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1 0 0 0 0" result="noise" />
            <feComposite in="tone" in2="noise" operator="arithmetic" k2="1" k3="2" k4="-1" />
            <feComponentTransfer result="grain"><feFuncA type="table" tableValues="0 0 0 1 1 1" /></feComponentTransfer>
            <feComponentTransfer in="tone"><feFuncA type="linear" slope="6" /></feComponentTransfer>
            <feComposite in="grain" operator="in" result="dots" />
            {shift && <feOffset dx="4" dy="3" result="dots" />}
            <feFlood className={`riso-${ink}`} />
            <feComposite in2="dots" operator="in" />
          </filter>
        ))}
      </defs>
      <image href="/riso/forum-lime.webp" width="2000" height="1050" filter="url(#forum-lime)" />
      <image className="riso-overprint" href="/riso/forum-ultra.webp" width="2000" height="1050" filter="url(#forum-ultra)" />
    </svg>
  );
}
