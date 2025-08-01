"""
Utility functions for database operations with retry logic
"""
import time
import logging
from functools import wraps
from django.db import transaction, OperationalError
from django.db.utils import DatabaseError
from rest_framework.response import Response
from rest_framework import status

logger = logging.getLogger(__name__)


def retry_on_db_lock(max_retries=3, retry_delay=0.5):
    """
    Decorator to retry database operations on lock errors
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            for attempt in range(max_retries):
                try:
                    return func(*args, **kwargs)
                except (OperationalError, DatabaseError) as e:
                    if 'database is locked' in str(e).lower() and attempt < max_retries - 1:
                        # Wait before retrying with exponential backoff
                        wait_time = retry_delay * (2 ** attempt)
                        logger.warning(f"Database locked, retrying in {wait_time}s (attempt {attempt + 1}/{max_retries})")
                        time.sleep(wait_time)
                        continue
                    else:
                        # Log the error and re-raise
                        logger.error(f"Database error after {attempt + 1} attempts: {str(e)}")
                        raise
            return func(*args, **kwargs)  # Final attempt
        return wrapper
    return decorator


def safe_delete_with_relations(obj, related_fields=None):
    """
    Safely delete an object with retry logic and relation checking
    
    Args:
        obj: The object to delete
        related_fields: List of related field names to check before deletion
    
    Returns:
        tuple: (success: bool, error_message: str or None)
    """
    if related_fields:
        for field_name in related_fields:
            if hasattr(obj, field_name):
                related_objects = getattr(obj, field_name).all()
                if related_objects.exists():
                    return False, f"Cannot delete {obj.__class__.__name__}. It has {related_objects.count()} {field_name} associated with it."
    
    @retry_on_db_lock()
    def _delete_with_retry():
        with transaction.atomic():
            obj.delete()
    
    try:
        _delete_with_retry()
        return True, None
    except (OperationalError, DatabaseError) as e:
        logger.error(f"Database error deleting {obj.__class__.__name__} {obj.pk}: {str(e)}")
        return False, "Database error occurred while deleting. Please try again."
    except Exception as e:
        logger.error(f"Unexpected error deleting {obj.__class__.__name__} {obj.pk}: {str(e)}")
        return False, "An unexpected error occurred while deleting."


def create_error_response(message, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR):
    """
    Create a standardized error response
    """
    return Response({'error': message}, status=status_code) 