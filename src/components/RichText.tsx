/** **kalın** ve *italik* destekleyen küçük metin biçimlendirici */
export function RichText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g)
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith('**') ? (
          <b key={i}>{p.slice(2, -2)}</b>
        ) : p.startsWith('*') && p.length > 2 ? (
          <i key={i}>{p.slice(1, -1)}</i>
        ) : (
          p
        ),
      )}
    </>
  )
}
