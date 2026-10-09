"""Export the 2-layer, 32-dim Starbucks encoder used by site search.

Takes the first 2 BERT layers of ielabgroup/Starbucks-msmarco (Starbucks: Improved Training
for 2D Matryoshka Embeddings), uses the first 32 dims of the CLS vector (the (2, 32)
layer-dimension pair it was trained for), keeps the first VOCAB WordPiece tokens (BERT's
vocabulary is roughly frequency ordered, so ids are unchanged and rare words fall back to
smaller pieces), and writes an int8-quantized ONNX model plus vocab.txt.

Needs torch, transformers, onnx and onnxruntime (not needed for the site build):
  python3 scripts/export_starbucks.py
"""

import os
from pathlib import Path

import torch
from onnxruntime.quantization import QuantType, quantize_dynamic
from transformers import AutoConfig, AutoModel, BertTokenizerFast

NAME, LAYERS, DIM, VOCAB = "ielabgroup/Starbucks-msmarco", 2, 32, 10000
OUT = Path(__file__).resolve().parent.parent / "public" / "models" / "starbucks-2l-32"


class CLSEmbedding(torch.nn.Module):
    def __init__(self, model):
        super().__init__()
        self.model = model

    def forward(self, input_ids, attention_mask, token_type_ids):
        hidden = self.model(input_ids=input_ids, attention_mask=attention_mask, token_type_ids=token_type_ids).last_hidden_state
        return hidden[:, 0, :DIM]


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    vocab = BertTokenizerFast.from_pretrained(NAME).vocab
    tokens = [token for token, _ in sorted(vocab.items(), key=lambda item: item[1])][:VOCAB]
    (OUT / "vocab.txt").write_text("\n".join(tokens) + "\n")

    config = AutoConfig.from_pretrained(NAME, num_hidden_layers=LAYERS)
    model = AutoModel.from_pretrained(NAME, config=config).eval()
    full = model.embeddings.word_embeddings
    model.embeddings.word_embeddings = torch.nn.Embedding.from_pretrained(full.weight.data[:VOCAB].clone(), freeze=True)
    model.config.vocab_size = VOCAB

    tokenizer = BertTokenizerFast(vocab_file=str(OUT / "vocab.txt"), do_lower_case=True)
    sample = tokenizer(["hello world"], return_tensors="pt")
    fp32 = OUT / "model.onnx"
    names = ["input_ids", "attention_mask", "token_type_ids"]
    torch.onnx.export(
        CLSEmbedding(model), tuple(sample[n] for n in names), str(fp32),
        input_names=names, output_names=["embedding"],
        dynamic_axes={**{n: {0: "batch", 1: "seq"} for n in names}, "embedding": {0: "batch"}},
        opset_version=17, dynamo=False,
    )
    quantize_dynamic(str(fp32), str(OUT / "model.int8.onnx"), op_types_to_quantize=["MatMul", "Gather"], weight_type=QuantType.QUInt8)
    os.remove(fp32)
    print(f"wrote {OUT} ({(OUT / 'model.int8.onnx').stat().st_size / 1e6:.1f} MB)")


if __name__ == "__main__":
    main()
