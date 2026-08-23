from collections import defaultdict
from typing import Callable


class EventDispatcher:

    def __init__(self):
        self._handlers = defaultdict(list)

    def register(
        self,
        event_type,
        handler: Callable,
    ):
        self._handlers[event_type].append(
            handler
        )

    def dispatch(
        self,
        event,
    ):
        event_type = type(event)

        for handler in self._handlers[event_type]:
            handler(event)