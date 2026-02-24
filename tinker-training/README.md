# Nectic Tinker Training

This subproject contains scripts for training LoRA adapters to generate AI opportunity reports using the [Tinker platform](https://tinker.ai).

## Overview

Nectic uses fine-tuned language models to generate structured AI automation opportunity reports from business context. This training pipeline:

1. Loads a curated dataset of business context → opportunity report examples
2. Trains a LoRA adapter on a base model (e.g., Llama-3.2-1B)
3. Exports checkpoints that can be used for inference

## Requirements

- **Python 3.11+**
- **Tinker API Key** (set as `TINKER_API_KEY` environment variable)
- Dependencies listed in `requirements.txt`

## Setup

1. **Navigate to the training directory:**
   ```bash
   cd tinker-training
   ```

2. **Create a virtual environment:**
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set your Tinker API key:**
   ```bash
   export TINKER_API_KEY=your_api_key_here
   ```
   
   Or create a `.env` file:
   ```bash
   echo "TINKER_API_KEY=your_api_key_here" > .env
   ```

## Dataset Format

The dataset is a JSONL file where each line is a JSON object with a `messages` array:

```json
{
  "messages": [
    {"role": "system", "content": "You are an AI consultant..."},
    {"role": "user", "content": "Business Context: ..."},
    {"role": "assistant", "content": "# AI Opportunity Report\n\n## Executive Summary\n..."}
  ]
}
```

The default dataset is `data/nectic_examples.jsonl` with 5 toy examples. Replace this with real business data for production training.

## Training

Run the training script:

```bash
python train_nectic_opportunity_model.py \
  --dataset data/nectic_examples.jsonl \
  --base-model meta-llama/Llama-3.2-1B \
  --rank 32 \
  --num-steps 500 \
  --batch-size 128 \
  --checkpoint-prefix nectic-v1
```

### Arguments

- `--dataset`: Path to JSONL dataset (default: `data/nectic_examples.jsonl`)
- `--base-model`: Base model name (default: `meta-llama/Llama-3.2-1B`)
- `--rank`: LoRA rank (default: 32)
- `--learning-rate`: Learning rate (optional; auto-computed if not provided)
- `--num-steps`: Number of training steps (default: 500)
- `--batch-size`: Batch size (default: 128)
- `--checkpoint-prefix`: Checkpoint name prefix (default: `nectic-v1`)
- `--save-every`: Save checkpoint every N steps (default: 100)
- `--eval-every`: Run evaluation every N steps (default: 50)

### Training Output

The script will:
- Save state checkpoints every `--save-every` steps
- Save weight checkpoints that can be used for sampling
- Print training loss every 10 steps
- Run evaluation samples periodically

At the end, it prints the final checkpoint name for use in sampling.

## Sampling / Inference

Generate an AI opportunity report from business context:

```bash
python sample_nectic_model.py \
  --checkpoint-name nectic-v1_weights_final \
  --business-context "A restaurant uses paper menus and phone orders. They have 50 daily orders and spend 3 hours on phone calls."
```

Or read from stdin:

```bash
echo "A restaurant uses paper menus..." | \
  python sample_nectic_model.py --checkpoint-name nectic-v1_weights_final
```

### Arguments

- `--model-path`: Direct model path (alternative to `--checkpoint-name`)
- `--checkpoint-name`: Checkpoint name from training (e.g., `nectic-v1_weights_final`)
- `--base-model`: Base model name (default: same as training)
- `--business-context`: Business context prompt (or read from stdin)
- `--max-tokens`: Maximum tokens to generate (default: 512)
- `--temperature`: Sampling temperature (default: 0.7)
- `--top-p`: Top-p sampling (default: 1.0)

## Example Workflow

1. **Train a model:**
   ```bash
   python train_nectic_opportunity_model.py \
     --dataset data/nectic_examples.jsonl \
     --num-steps 500
   ```

2. **Test the trained model:**
   ```bash
   python sample_nectic_model.py \
     --checkpoint-name nectic-v1_weights_final \
     --business-context "A small retail store uses Excel for inventory and email for customer support."
   ```

## Integration with Nectic

The trained model can be integrated into Nectic's opportunity generation pipeline:

1. **Replace the current AI service** (`src/infrastructure/services/perplexity-ai.service.ts`) with a Tinker-based service
2. **Load the checkpoint** via Tinker's sampling client
3. **Format business context** from assessment results into the expected prompt format
4. **Generate opportunities** using the fine-tuned model

Future work:
- Replace toy dataset with real business data from Firestore
- Add evaluation metrics (BLEU, ROUGE, human evaluation)
- Implement continuous fine-tuning as new data arrives
- Add support for multi-turn conversations

## Troubleshooting

### "Tinker SDK not installed"
Run: `pip install -r requirements.txt`

### "TINKER_API_KEY environment variable is required"
Set your API key: `export TINKER_API_KEY=your_key`

### "Dataset file not found"
Check that `data/nectic_examples.jsonl` exists, or provide a different path with `--dataset`

### "Failed to load tokenizer"
Ensure the base model name is correct and accessible via Tinker

## Files

- `train_nectic_opportunity_model.py`: Main training script
- `sample_nectic_model.py`: Inference/sampling script
- `dataset.py`: Dataset loading and processing utilities
- `config.py`: Configuration constants and helpers
- `data/nectic_examples.jsonl`: Toy dataset (5 examples)
- `requirements.txt`: Python dependencies

## License

Part of the Nectic project. See main repository LICENSE file.

