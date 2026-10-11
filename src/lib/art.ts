// Cartoon placeholder used when a child has no photo. Also used in link-preview images.
const PALETTES = [
  ['#FFD23F', '#C70F37', '#5A3218'],
  ['#9FD3FF', '#147A39', '#E0A43A'],
  ['#FFC2CF', '#1B4FD1', '#2B1A10'],
  ['#C9F2D6', '#6B2FB3', '#B5562B'],
]

export function kidSvg(index: number): string {
  const [bg, hat, hair] = PALETTES[index % PALETTES.length]
  return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'><rect width='200' height='200' fill='${bg}'/><circle cx='100' cy='122' r='54' fill='#F2B48C' stroke='#17131F' stroke-width='5'/><path d='M48 112 Q56 62 100 66 Q144 62 152 112 Q132 88 100 90 Q68 88 48 112Z' fill='${hair}' stroke='#17131F' stroke-width='5' stroke-linejoin='round'/><path d='M100 12 L74 72 L126 72Z' fill='${hat}' stroke='#17131F' stroke-width='5' stroke-linejoin='round'/><path d='M84 50 L116 50 M80 60 L120 60' stroke='#FFD23F' stroke-width='5'/><circle cx='100' cy='12' r='9' fill='#FFFFFF' stroke='#17131F' stroke-width='4'/><circle cx='82' cy='120' r='6' fill='#17131F'/><circle cx='118' cy='120' r='6' fill='#17131F'/><circle cx='68' cy='140' r='8' fill='#F07B8C'/><circle cx='132' cy='140' r='8' fill='#F07B8C'/><path d='M78 142 Q100 164 122 142' fill='none' stroke='#17131F' stroke-width='5' stroke-linecap='round'/></svg>`
}

export const kidSvgDataUri = (index: number) => 'data:image/svg+xml,' + encodeURIComponent(kidSvg(index))
