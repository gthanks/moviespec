export async function generateImage({ prompt, negativePrompt, media, seed }) {
  return {
    outputs: {
      placeholder: 'stub',
      note: 'No real backend call was made.'
    },
    run: {
      seed: typeof seed === 'undefined' ? null : seed,
      media
    },
    prompt: {
      positive: prompt,
      negative: negativePrompt ?? ''
    }
  };
}
