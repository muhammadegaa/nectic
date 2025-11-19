#!/usr/bin/env python3
"""
Nectic AI Opportunity Report Model Sampling Script

This script loads a trained LoRA checkpoint and generates AI opportunity
reports from business context prompts.

Usage:
    python sample_nectic_model.py --checkpoint-name nectic-v1_weights_final --business-context "A restaurant uses paper menus and phone orders..."
    
    OR read from stdin:
    echo "A restaurant uses paper menus..." | python sample_nectic_model.py --checkpoint-name nectic-v1_weights_final
"""

import argparse
import sys
from typing import Optional

try:
    from tinker import ServiceClient
    from tinker_cookbook import renderers, tokenizer_utils
except ImportError as e:
    print(
        "ERROR: Tinker SDK not installed.\n"
        "Please install dependencies: pip install -r requirements.txt",
        file=sys.stderr,
    )
    sys.exit(1)

from config import get_tinker_api_key, DEFAULT_BASE_MODEL


def parse_args():
    """Parse command-line arguments."""
    parser = argparse.ArgumentParser(
        description="Sample from a trained Nectic AI opportunity report model"
    )
    parser.add_argument(
        "--model-path",
        type=str,
        default=None,
        help="Direct model path (alternative to --checkpoint-name)",
    )
    parser.add_argument(
        "--checkpoint-name",
        type=str,
        default=None,
        help="Checkpoint name (as saved by training script)",
    )
    parser.add_argument(
        "--base-model",
        type=str,
        default=DEFAULT_BASE_MODEL,
        help=f"Base model name (default: {DEFAULT_BASE_MODEL})",
    )
    parser.add_argument(
        "--business-context",
        type=str,
        default=None,
        help="Business context prompt (if not provided, reads from stdin)",
    )
    parser.add_argument(
        "--max-tokens",
        type=int,
        default=512,
        help="Maximum tokens to generate (default: 512)",
    )
    parser.add_argument(
        "--temperature",
        type=float,
        default=0.7,
        help="Sampling temperature (default: 0.7)",
    )
    parser.add_argument(
        "--top-p",
        type=float,
        default=1.0,
        help="Top-p sampling (default: 1.0)",
    )
    return parser.parse_args()


def resolve_model_path(
    model_path: Optional[str],
    checkpoint_name: Optional[str],
) -> str:
    """
    Resolve the model path from either direct path or checkpoint name.
    
    Returns:
        Resolved model path string
    """
    if model_path:
        return model_path
    
    if checkpoint_name:
        # Construct path based on how training script saves checkpoints
        # Adjust this based on actual Tinker path structure
        return checkpoint_name
    
    raise ValueError(
        "Either --model-path or --checkpoint-name must be provided"
    )


def get_business_context(args) -> str:
    """Get business context from args or stdin."""
    if args.business_context:
        return args.business_context
    
    # Read from stdin
    print("Reading business context from stdin...", file=sys.stderr)
    context = sys.stdin.read().strip()
    if not context:
        raise ValueError("No business context provided (via --business-context or stdin)")
    return context


def main():
    """Main sampling function."""
    args = parse_args()
    
    # Get API key
    try:
        api_key = get_tinker_api_key()
    except ValueError as e:
        print(f"ERROR: {e}", file=sys.stderr)
        sys.exit(1)
    
    # Resolve model path
    try:
        model_path = resolve_model_path(args.model_path, args.checkpoint_name)
    except ValueError as e:
        print(f"ERROR: {e}", file=sys.stderr)
        sys.exit(1)
    
    # Get business context
    try:
        business_context = get_business_context(args)
    except ValueError as e:
        print(f"ERROR: {e}", file=sys.stderr)
        sys.exit(1)
    
    # Initialize service client
    print(f"Initializing Tinker service client...", file=sys.stderr)
    service_client = ServiceClient(api_key=api_key)
    
    # Create sampling client
    print(f"Loading model from: {model_path}", file=sys.stderr)
    try:
        sampling_client = service_client.create_sampling_client(model_path=model_path)
    except Exception as e:
        print(
            f"ERROR: Failed to create sampling client: {e}\n"
            f"Make sure the checkpoint name/path is correct.",
            file=sys.stderr,
        )
        sys.exit(1)
    
    # Setup tokenizer and renderer (for prompt formatting)
    print(f"Loading tokenizer for {args.base_model}...", file=sys.stderr)
    try:
        tokenizer = tokenizer_utils.get_tokenizer(args.base_model)
        renderer = renderers.get_renderer("chat_sl", tokenizer)
    except Exception as e:
        print(f"WARNING: Could not load renderer: {e}", file=sys.stderr)
        tokenizer = None
        renderer = None
    
    # Build prompt
    messages = [
        {
            "role": "system",
            "content": (
                "You are an AI consultant that identifies AI automation opportunities "
                "for businesses. Analyze the business context and provide a structured "
                "opportunity report with: Executive Summary, Key Opportunities, "
                "Implementation Risks, and Next Steps."
            ),
        },
        {
            "role": "user",
            "content": f"Business Context: {business_context}",
        },
    ]
    
    # Generate
    print(f"\nGenerating AI opportunity report...\n", file=sys.stderr)
    print("=" * 80)
    
    try:
        # Sample from the model
        response = sampling_client.sample(
            prompt=messages,
            max_tokens=args.max_tokens,
            temperature=args.temperature,
            top_p=args.top_p,
            stop=["\n\nUser:", "END", "---"],  # Stop sequences
        )
        
        # Decode response
        if hasattr(response, "text"):
            generated_text = response.text
        elif hasattr(response, "tokens") and tokenizer:
            generated_text = tokenizer.decode(response.tokens)
        elif hasattr(response, "content"):
            generated_text = response.content
        else:
            # Fallback: try to extract text from response
            generated_text = str(response)
            if tokenizer and hasattr(response, "token_ids"):
                generated_text = tokenizer.decode(response.token_ids)
        
        print(generated_text)
        print("=" * 80)
        
    except Exception as e:
        print(f"ERROR: Generation failed: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()

