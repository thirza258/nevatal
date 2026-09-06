"""
Message building shared by the two OpenAI-compatible clients.

Both OpenAI and OpenRouter talk to LangChain's chat interface, so the mapping
from this app's role-tagged turns to LangChain messages lives here rather than
being written twice and drifting.
"""

from typing import Optional

from langchain_core.messages import AIMessage, HumanMessage, SystemMessage


def build_messages(
    instruction: str,
    conversation: Optional[list[dict[str, str]]],
    prompt: str,
) -> list:
    """
    The system instruction, then the thread so far, then the new prompt.

    Replaying earlier turns as real assistant and user messages is what gives
    the model the thread's context; folding them into one prompt string would
    lose the roles the model reasons about.
    """
    messages = [SystemMessage(content=instruction)]

    for turn in conversation or []:
        if turn.get("role") == "assistant":
            messages.append(AIMessage(content=turn.get("content", "")))
        else:
            messages.append(HumanMessage(content=turn.get("content", "")))

    messages.append(HumanMessage(content=prompt))
    return messages
