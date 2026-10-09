import { WordPiece } from './wordpiece.ts';

/**
 * Starbucks 2-layer / 32-dim query and document encoder (see scripts/export_starbucks.py).
 * The same ONNX model and tokenizer run at build time (onnxruntime-node) and in the
 * browser (onnxruntime-web), so document and query vectors are comparable.
 */

export const MODEL_DIR = '/models/starbucks-2l-32';
export const MODEL_FILE = `${MODEL_DIR}/model.int8.onnx`;
export const VOCAB_FILE = `${MODEL_DIR}/vocab.txt`;
export const EMBED_DIM = 32;

/** The subset of the onnxruntime API used here (shared by -node and -web). */
export interface OrtLike {
  Tensor: new (type: 'int64', data: BigInt64Array, dims: number[]) => unknown;
}
export interface SessionLike {
  run(feeds: Record<string, unknown>): Promise<Record<string, { data: unknown }>>;
}

export class Encoder {
  private ort: OrtLike;
  private session: SessionLike;
  private tokenizer: WordPiece;

  constructor(ort: OrtLike, session: SessionLike, tokenizer: WordPiece) {
    this.ort = ort;
    this.session = session;
    this.tokenizer = tokenizer;
  }

  async embed(text: string): Promise<number[]> {
    const encoded = this.tokenizer.encode(text);
    const tensor = (values: number[]) => new this.ort.Tensor('int64', BigInt64Array.from(values, BigInt), [1, values.length]);
    const output = await this.session.run({
      input_ids: tensor(encoded.inputIds),
      attention_mask: tensor(encoded.attentionMask),
      token_type_ids: tensor(encoded.tokenTypeIds),
    });
    return Array.from(output.embedding.data as Float32Array);
  }
}
