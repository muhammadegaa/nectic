"""
Dataset loading and processing for Nectic AI opportunity report training.

This module handles loading JSONL datasets and converting them to Tinker's
Datum format for supervised fine-tuning.
"""

import json
from typing import List, Dict, Any, Optional
from pathlib import Path

try:
    from tinker import types
    from tinker_cookbook import renderers
except ImportError as e:
    raise ImportError(
        "Tinker SDK not installed. Please run: pip install -r requirements.txt"
    ) from e


def load_jsonl_dataset(path: str) -> List[Dict[str, Any]]:
    """
    Load a JSONL dataset file.
    
    Each line should be a JSON object with a 'messages' field containing
    a list of chat messages with 'role' and 'content' fields.
    
    Args:
        path: Path to the JSONL file
        
    Returns:
        List of example dictionaries
        
    Raises:
        FileNotFoundError: If the dataset file doesn't exist
        ValueError: If the file format is invalid
    """
    dataset_path = Path(path)
    if not dataset_path.exists():
        raise FileNotFoundError(
            f"Dataset file not found: {path}. "
            "Please create a dataset file or check the path."
        )
    
    examples = []
    with open(dataset_path, "r", encoding="utf-8") as f:
        for line_num, line in enumerate(f, 1):
            line = line.strip()
            if not line:
                continue
            
            try:
                example = json.loads(line)
                if "messages" not in example:
                    raise ValueError(
                        f"Line {line_num}: Missing 'messages' field. "
                        "Each example must have a 'messages' array."
                    )
                examples.append(example)
            except json.JSONDecodeError as e:
                raise ValueError(f"Line {line_num}: Invalid JSON - {e}") from e
    
    if not examples:
        raise ValueError(f"Dataset file is empty: {path}")
    
    return examples


def process_example(
    messages: List[Dict[str, str]],
    renderer: Any,
) -> types.Datum:
    """
    Process a single example (list of messages) into a Tinker Datum.
    
    Uses the renderer to build supervised tokens and weights, then shifts
    for next-token prediction.
    
    Args:
        messages: List of message dicts with 'role' and 'content'
        renderer: Tinker renderer instance (from tinker_cookbook.renderers)
        
    Returns:
        Datum object ready for training
    """
    # Build supervised example using renderer
    # This should return (tokens, weights) where weights=1 for assistant tokens
    tokens, weights = renderer.build_supervised_example(messages)
    
    # Shift for next-token prediction
    # input_tokens = tokens[:-1], target_tokens = tokens[1:]
    input_tokens = tokens[:-1]
    target_tokens = tokens[1:]
    target_weights = weights[1:]
    
    # Create Datum
    datum = types.Datum(
        model_input=types.ModelInput.from_ints(tokens=input_tokens),
        loss_fn_inputs={
            "weights": target_weights,
            "target_tokens": target_tokens,
        },
    )
    
    return datum


def build_dataset(
    path: str,
    renderer: Any,
) -> List[types.Datum]:
    """
    Build a complete dataset from a JSONL file.
    
    Args:
        path: Path to JSONL dataset file
        renderer: Tinker renderer instance
        
    Returns:
        List of Datum objects ready for training
    """
    examples = load_jsonl_dataset(path)
    dataset = []
    
    for example in examples:
        messages = example["messages"]
        datum = process_example(messages, renderer)
        dataset.append(datum)
    
    return dataset


def sample_batch(
    dataset: List[types.Datum],
    batch_size: int,
) -> List[types.Datum]:
    """
    Randomly sample a batch from the dataset.
    
    Args:
        dataset: List of Datum objects
        batch_size: Number of examples to sample
        
    Returns:
        List of sampled Datum objects
    """
    import random
    
    if len(dataset) <= batch_size:
        return dataset
    
    return random.sample(dataset, batch_size)

