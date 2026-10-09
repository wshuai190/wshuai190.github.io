/**
 * BERT uncased WordPiece tokenizer (same behaviour as HuggingFace BertTokenizer with
 * do_lower_case=true), so the browser and the build produce identical model inputs.
 */

const CJK = /[一-鿿㐀-䶿\u{20000}-\u{2A6DF}\u{2A700}-\u{2B73F}\u{2B740}-\u{2B81F}\u{2B820}-\u{2CEAF}豈-﫿\u{2F800}-\u{2FA1F}]/u;
const CONTROL = /[\p{Cc}\p{Cf}]/u;
const PUNCT = /[\p{P}!-\/:-@\[-`{-~]/u;
const MAX_WORD_CHARS = 100;

export interface Encoded {
  inputIds: number[];
  attentionMask: number[];
  tokenTypeIds: number[];
}

export class WordPiece {
  private vocab = new Map<string, number>();

  constructor(vocabText: string) {
    vocabText.split('\n').forEach((token, id) => {
      if (token) this.vocab.set(token, id);
    });
  }

  private id(token: string): number {
    return this.vocab.get(token) ?? this.vocab.get('[UNK]')!;
  }

  /** Lowercase, strip accents, isolate CJK characters and punctuation. */
  basicTokens(text: string): string[] {
    let cleaned = '';
    for (const ch of text) {
      const code = ch.codePointAt(0)!;
      if (code === 0 || code === 0xfffd || (CONTROL.test(ch) && !/[\t\n\r]/.test(ch))) continue;
      cleaned += /\s/.test(ch) ? ' ' : CJK.test(ch) ? ` ${ch} ` : ch;
    }
    const tokens: string[] = [];
    for (const word of cleaned.split(' ')) {
      if (!word) continue;
      const normalised = word.toLowerCase().normalize('NFD').replace(/\p{Mn}/gu, '');
      let current = '';
      for (const ch of normalised) {
        if (PUNCT.test(ch)) {
          if (current) tokens.push(current);
          tokens.push(ch);
          current = '';
        } else {
          current += ch;
        }
      }
      if (current) tokens.push(current);
    }
    return tokens;
  }

  /** Greedy longest-match-first WordPiece split of one basic token. */
  wordPieces(word: string): string[] {
    const chars = [...word];
    if (chars.length > MAX_WORD_CHARS) return ['[UNK]'];
    const pieces: string[] = [];
    let start = 0;
    while (start < chars.length) {
      let end = chars.length;
      let piece: string | null = null;
      while (start < end) {
        const candidate = (start > 0 ? '##' : '') + chars.slice(start, end).join('');
        if (this.vocab.has(candidate)) {
          piece = candidate;
          break;
        }
        end -= 1;
      }
      if (piece === null) return ['[UNK]'];
      pieces.push(piece);
      start = end;
    }
    return pieces;
  }

  tokenize(text: string): string[] {
    return this.basicTokens(text).flatMap((word) => this.wordPieces(word));
  }

  /** [CLS] tokens [SEP], truncated to maxLength. */
  encode(text: string, maxLength = 256): Encoded {
    const pieces = this.tokenize(text).slice(0, maxLength - 2);
    const inputIds = [this.id('[CLS]'), ...pieces.map((p) => this.id(p)), this.id('[SEP]')];
    return { inputIds, attentionMask: inputIds.map(() => 1), tokenTypeIds: inputIds.map(() => 0) };
  }
}
