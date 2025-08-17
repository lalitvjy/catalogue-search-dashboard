export async function computeImageEmbedding(imageUrl: string): Promise<number[]> {
  // This project doesn't handle embeddings - they're done externally
  // This function is kept for compatibility but should not be called
  throw new Error('Embeddings are handled by external service. This function should not be called.')
}
