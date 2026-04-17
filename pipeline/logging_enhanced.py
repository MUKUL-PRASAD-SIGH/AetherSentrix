"""Structured logging configuration."""

import logging
import json
import os
from logging.handlers import RotatingFileHandler
from pythonjsonlogger import jsonlogger
from datetime import datetime


class StructuredLogger:
    """Structured logging with JSON format."""

    def __init__(self, name: str, log_level: str = "INFO"):
        """Initialize structured logger."""
        self.logger = logging.getLogger(name)
        self.logger.setLevel(log_level)
        
        # Create logs directory
        os.makedirs('logs', exist_ok=True)
        
        # Console handler (INFO and above)
        console_handler = logging.StreamHandler()
        console_handler.setLevel(log_level)
        console_formatter = jsonlogger.JsonFormatter(
            fmt='%(timestamp)s %(level)s %(name)s %(message)s'
        )
        console_handler.setFormatter(console_formatter)
        
        # File handler with rotation
        file_handler = RotatingFileHandler(
            'logs/aether.log',
            maxBytes=10485760,  # 10MB
            backupCount=5
        )
        file_handler.setLevel(log_level)
        file_handler.setFormatter(console_formatter)
        
        # Add handlers
        self.logger.addHandler(console_handler)
        self.logger.addHandler(file_handler)

    def log_event(self, level: str, message: str, **context):
        """Log event with structured context."""
        log_method = getattr(self.logger, level.lower(), self.logger.info)
        
        # Add timestamp to context
        context['timestamp'] = datetime.utcnow().isoformat()
        
        log_method(message, extra=context)

    def info(self, message: str, **context):
        """Log info level."""
        self.log_event('info', message, **context)

    def warning(self, message: str, **context):
        """Log warning level."""
        self.log_event('warning', message, **context)

    def error(self, message: str, **context):
        """Log error level."""
        self.log_event('error', message, **context)

    def debug(self, message: str, **context):
        """Log debug level."""
        self.log_event('debug', message, **context)

    def critical(self, message: str, **context):
        """Log critical level."""
        self.log_event('critical', message, **context)


# Global logger instances
_loggers = {}


def get_logger(name: str) -> StructuredLogger:
    """Get or create logger by name."""
    if name not in _loggers:
        log_level = os.getenv('LOG_LEVEL', 'INFO')
        _loggers[name] = StructuredLogger(name, log_level)
    return _loggers[name]


# Configure root logger
def setup_logging(log_level: str = "INFO"):
    """Setup root logging configuration."""
    os.makedirs('logs', exist_ok=True)
    
    root_logger = logging.getLogger()
    root_logger.setLevel(log_level)
    
    # JSON formatter
    formatter = jsonlogger.JsonFormatter(
        fmt='%(timestamp)s %(level)s %(name)s %(message)s'
    )
    
    # Console handler
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)
    root_logger.addHandler(console_handler)
    
    # File handler
    file_handler = RotatingFileHandler(
        'logs/aether.log',
        maxBytes=10485760,
        backupCount=5
    )
    file_handler.setFormatter(formatter)
    root_logger.addHandler(file_handler)
