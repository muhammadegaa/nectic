#!/usr/bin/env python3
"""
Nectic AI Opportunity Report Model Training Script

This script trains a LoRA adapter on a small dataset of business context
→ AI opportunity report examples using Tinker's supervised fine-tuning.

How this fits into Nectic:
- Nectic is an AI automation opportunities platform
- This subproject fine-tunes a model to generate structured AI opportunity reports
- The trained model can later be integrated into Nectic's opportunity generation pipeline
- Currently uses a toy dataset; future iterations will use real business data from Firestore

Usage:
    python train_nectic_opportunity_model.py --dataset data/nectic_examples.jsonl
"""

import argparse
import os
import sys
from typing import Optional

# Add error handling for imports
try:
    from tinker import ServiceClient, types
    from tinker_cookbook import renderers, tokenizer_utils
except ImportError as e:
    print(
        "ERROR: Tinker SDK not installed.\n"
        "Please install dependencies: pip install -r requirements.txt",
        file=sys.stderr,
    )
    sys.exit(1)

from config import (
    get_tinker_api_key,
    get_learning_rate,
    DEFAULT_BASE_MODEL,
    DEFAULT_LORA_RANK,
    DEFAULT_BATCH_SIZE,
    DEFAULT_NUM_STEPS,
    DEFAULT_SAVE_EVERY,
    DEFAULT_CHECKPOINT_PREFIX,
    DEFAULT_DATASET_PATH,
)
from dataset import build_dataset, sample_batch


def parse_args():
    """Parse command-line arguments."""
    parser = argparse.ArgumentParser(
        description="Train a LoRA adapter for Nectic AI opportunity reports"
    )
    parser.add_argument(
        "--dataset",
        type=str,
        default=DEFAULT_DATASET_PATH,
        help=f"Path to JSONL dataset (default: {DEFAULT_DATASET_PATH})",
    )
    parser.add_argument(
        "--base-model",
        type=str,
        default=DEFAULT_BASE_MODEL,
        help=f"Base model name (default: {DEFAULT_BASE_MODEL})",
    )
    parser.add_argument(
        "--rank",
        type=int,
        default=DEFAULT_LORA_RANK,
        help=f"LoRA rank (default: {DEFAULT_LORA_RANK})",
    )
    parser.add_argument(
        "--learning-rate",
        type=float,
        default=None,
        help="Learning rate (if not provided, will be computed automatically)",
    )
    parser.add_argument(
        "--num-steps",
        type=int,
        default=DEFAULT_NUM_STEPS,
        help=f"Number of training steps (default: {DEFAULT_NUM_STEPS})",
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=DEFAULT_BATCH_SIZE,
        help=f"Batch size (default: {DEFAULT_BATCH_SIZE})",
    )
    parser.add_argument(
        "--checkpoint-prefix",
        type=str,
        default=DEFAULT_CHECKPOINT_PREFIX,
        help=f"Checkpoint name prefix (default: {DEFAULT_CHECKPOINT_PREFIX})",
    )
    parser.add_argument(
        "--save-every",
        type=int,
        default=DEFAULT_SAVE_EVERY,
        help=f"Save checkpoint every N steps (default: {DEFAULT_SAVE_EVERY})",
    )
    parser.add_argument(
        "--eval-every",
        type=int,
        default=50,
        help="Run evaluation every N steps (default: 50)",
    )
    return parser.parse_args()


def setup_training_client(
    api_key: str,
    base_model: str,
    rank: int,
) -> tuple:
    """
    Initialize Tinker service client and training client.
    
    Returns:
        Tuple of (service_client, training_client)
    """
    print(f"Initializing Tinker service client...")
    service_client = ServiceClient(api_key=api_key)
    
    print(f"Creating LoRA training client (base_model={base_model}, rank={rank})...")
    training_client = service_client.create_lora_training_client(
        base_model=base_model,
        rank=rank,
    )
    
    return service_client, training_client


def setup_tokenizer_and_renderer(base_model: str):
    """
    Get tokenizer and renderer for the base model.
    
    Returns:
        Tuple of (tokenizer, renderer)
    """
    print(f"Loading tokenizer for {base_model}...")
    try:
        tokenizer = tokenizer_utils.get_tokenizer(base_model)
    except Exception as e:
        print(
            f"WARNING: Could not load tokenizer via utils. "
            f"Trying direct import. Error: {e}",
            file=sys.stderr,
        )
        # Fallback: try to get tokenizer directly
        try:
            from transformers import AutoTokenizer
            tokenizer = AutoTokenizer.from_pretrained(base_model)
        except Exception as e2:
            raise RuntimeError(
                f"Failed to load tokenizer: {e2}. "
                "Please ensure the model name is correct and tokenizer is available."
            ) from e2
    
    print("Setting up chat renderer...")
    try:
        # Use chat_sl style renderer (supervised learning with chat format)
        renderer = renderers.get_renderer("chat_sl", tokenizer)
    except Exception as e:
        print(
            f"WARNING: Could not get renderer 'chat_sl'. "
            f"Trying alternative. Error: {e}",
            file=sys.stderr,
        )
        # Fallback: try other renderer names
        try:
            renderer = renderers.get_renderer("chat", tokenizer)
        except Exception:
            raise RuntimeError(
                f"Failed to get renderer. Please check tinker-cookbook installation."
            ) from e
    
    return tokenizer, renderer


def compute_loss_approximation(logprobs, weights, target_tokens):
    """
    Compute approximate loss from logprobs and weights.
    
    This is a simplified loss computation for logging purposes.
    """
    import numpy as np
    
    # Extract logprobs for target tokens
    # This is a simplified version - actual loss computation may differ
    try:
        losses = []
        for i, target_token in enumerate(target_tokens):
            if i < len(logprobs) and weights[i] > 0:
                # Get logprob for the target token
                token_logprob = logprobs[i].get(target_token, -10.0)  # Default to low prob if not found
                losses.append(-token_logprob * weights[i])
        
        if losses:
            return np.mean(losses)
        return 0.0
    except Exception:
        # If computation fails, return a placeholder
        return 0.0


def run_evaluation(
    training_client,
    renderer,
    tokenizer,
    dataset,
    base_model: str,
):
    """Run a simple evaluation by sampling from a test example."""
    if not dataset:
        return
    
    # Use first example as test
    test_example = dataset[0]
    
    # Build a simple prompt (this is a simplified version)
    # In practice, you'd reconstruct the messages from the test example
    print("\n--- Evaluation Sample ---")
    try:
        # Get sampling client from training client
        sampling_client = training_client.save_weights_and_get_sampling_client(
            name="eval_temp"
        )
        
        # Create a test prompt
        messages = [
            {"role": "system", "content": "You are an AI consultant that identifies AI automation opportunities for businesses."},
            {"role": "user", "content": "Business Context: A small retail store uses manual inventory tracking and email for customer support."},
        ]
        
        # Sample response
        response = sampling_client.sample(
            prompt=messages,
            max_tokens=256,
            temperature=0.7,
            top_p=1.0,
        )
        
        # Decode and print
        if hasattr(response, "text"):
            print(response.text)
        elif hasattr(response, "tokens"):
            decoded = tokenizer.decode(response.tokens)
            print(decoded)
        else:
            print("Response:", response)
    except Exception as e:
        print(f"Evaluation failed (this is okay for MVP): {e}")
    print("--- End Evaluation ---\n")


def main():
    """Main training loop."""
    args = parse_args()
    
    # Get API key
    try:
        api_key = get_tinker_api_key()
    except ValueError as e:
        print(f"ERROR: {e}", file=sys.stderr)
        sys.exit(1)
    
    # Setup clients
    service_client, training_client = setup_training_client(
        api_key=api_key,
        base_model=args.base_model,
        rank=args.rank,
    )
    
    # Setup tokenizer and renderer
    tokenizer, renderer = setup_tokenizer_and_renderer(args.base_model)
    
    # Load dataset
    print(f"\nLoading dataset from {args.dataset}...")
    try:
        dataset = build_dataset(args.dataset, renderer)
        print(f"Loaded {len(dataset)} examples")
    except Exception as e:
        print(f"ERROR: Failed to load dataset: {e}", file=sys.stderr)
        sys.exit(1)
    
    # Get learning rate
    lr = get_learning_rate(args.base_model, args.learning_rate)
    print(f"Using learning rate: {lr}")
    
    # Setup optimizer
    adam_params = types.AdamParams(learning_rate=lr)
    
    # Training loop
    print(f"\nStarting training for {args.num_steps} steps...")
    print(f"Batch size: {args.batch_size}, Save every: {args.save_every} steps\n")
    
    for step in range(1, args.num_steps + 1):
        # Sample batch
        batch = sample_batch(dataset, args.batch_size)
        
        # Forward-backward pass
        try:
            # Use async pattern if available, otherwise sync
            if hasattr(training_client, "forward_backward_async"):
                fwd_future = training_client.forward_backward_async(
                    batch, loss_fn="cross_entropy"
                )
                opt_future = training_client.optim_step_async(adam_params)
                
                # Wait for both
                fwd_result = fwd_future.result() if hasattr(fwd_future, "result") else fwd_future
                opt_result = opt_future.result() if hasattr(opt_future, "result") else opt_future
            else:
                # Sync version
                fwd_result = training_client.forward_backward(
                    batch, loss_fn="cross_entropy"
                )
                opt_result = training_client.optim_step(adam_params)
            
            # Compute approximate loss for logging
            # This is simplified - actual implementation may vary
            loss = 0.0
            if hasattr(fwd_result, "loss"):
                loss = fwd_result.loss
            elif hasattr(fwd_result, "logprobs"):
                # Try to compute from logprobs
                # This is a placeholder - adjust based on actual API
                loss = compute_loss_approximation(
                    fwd_result.logprobs,
                    [1.0] * len(batch),  # Simplified weights
                    [],  # Would need target tokens
                )
            
            # Log progress
            if step % 10 == 0 or step == 1:
                print(f"Step {step}/{args.num_steps} | Loss: {loss:.4f}")
        
        except Exception as e:
            print(f"ERROR at step {step}: {e}", file=sys.stderr)
            # Continue training despite errors (for MVP)
            continue
        
        # Checkpointing
        if step % args.save_every == 0:
            checkpoint_name_state = f"{args.checkpoint_prefix}_state_step_{step}"
            checkpoint_name_weights = f"{args.checkpoint_prefix}_weights_step_{step}"
            
            print(f"\nSaving checkpoint at step {step}...")
            try:
                training_client.save_state(checkpoint_name_state)
                sampling_client = training_client.save_weights_and_get_sampling_client(
                    name=checkpoint_name_weights
                )
                print(f"  ✓ Saved state: {checkpoint_name_state}")
                print(f"  ✓ Saved weights: {checkpoint_name_weights}")
            except Exception as e:
                print(f"  ✗ Checkpoint save failed: {e}", file=sys.stderr)
        
        # Evaluation
        if step % args.eval_every == 0:
            try:
                run_evaluation(
                    training_client,
                    renderer,
                    tokenizer,
                    dataset,
                    args.base_model,
                )
            except Exception as e:
                print(f"Evaluation skipped: {e}")
    
    # Final checkpoint
    print(f"\nTraining complete! Saving final checkpoint...")
    try:
        final_state_name = f"{args.checkpoint_prefix}_state_final"
        final_weights_name = f"{args.checkpoint_prefix}_weights_final"
        
        training_client.save_state(final_state_name)
        sampling_client = training_client.save_weights_and_get_sampling_client(
            name=final_weights_name
        )
        
        print(f"✓ Final state: {final_state_name}")
        print(f"✓ Final weights: {final_weights_name}")
        print(f"\nTo use this model, run:")
        print(f"  python sample_nectic_model.py --checkpoint-name {final_weights_name}")
    except Exception as e:
        print(f"ERROR: Final checkpoint failed: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()

