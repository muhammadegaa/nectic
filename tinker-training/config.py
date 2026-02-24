"""
Configuration constants for Nectic Tinker training.

This module contains default values and configuration helpers for training
the AI opportunity report generation model.
"""

import os
from typing import Optional

# Default model configuration
DEFAULT_BASE_MODEL = "meta-llama/Llama-3.2-1B"
DEFAULT_LORA_RANK = 32
DEFAULT_BATCH_SIZE = 128
DEFAULT_LEARNING_RATE: Optional[float] = None  # Will be computed if None
DEFAULT_NUM_STEPS = 500
DEFAULT_SAVE_EVERY = 100
DEFAULT_EVAL_EVERY = 50

# Dataset defaults
DEFAULT_DATASET_PATH = "data/nectic_examples.jsonl"

# Checkpoint naming
DEFAULT_CHECKPOINT_PREFIX = "nectic-v1"

# Environment variable names
TINKER_API_KEY_ENV = "TINKER_API_KEY"


def get_tinker_api_key() -> str:
    """Get Tinker API key from environment."""
    api_key = os.getenv(TINKER_API_KEY_ENV)
    if not api_key:
        raise ValueError(
            f"{TINKER_API_KEY_ENV} environment variable is required. "
            "Please set it before running training scripts."
        )
    return api_key


def get_learning_rate(base_model: str, provided_lr: Optional[float] = None) -> float:
    """
    Get learning rate for training.
    
    If provided_lr is given, use it. Otherwise, try to get from Tinker's
    hyperparam utils, or fall back to a sensible default.
    """
    if provided_lr is not None:
        return provided_lr
    
    # Try to import Tinker's hyperparam utils
    try:
        from tinker_cookbook import hyperparam_utils
        if hasattr(hyperparam_utils, "get_lr"):
            return hyperparam_utils.get_lr(base_model)
    except (ImportError, AttributeError):
        pass
    
    # Fallback defaults based on model family
    if "Llama-3.2-1B" in base_model or "llama-3.2" in base_model.lower():
        return 1e-3  # LoRA LR for small Llama models
    elif "Qwen" in base_model or "qwen" in base_model.lower():
        return 8e-4  # Slightly lower for Qwen
    else:
        # Generic default
        return 1e-3

