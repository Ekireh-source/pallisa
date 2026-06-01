from rest_framework_simplejwt.authentication import JWTAuthentication
from django.conf import settings

class JWTCookieAuthentication(JWTAuthentication):
    def authenticate(self, request):
        header = self.get_header(request)
        
        # If no authorization header is present in the request, try to read from cookies
        if header is None:
            raw_token = request.COOKIES.get(settings.SIMPLE_JWT.get('AUTH_COOKIE', 'access_token'))
            if raw_token is None:
                return None
            
            validated_token = self.get_validated_token(raw_token)
            return self.get_user(validated_token), validated_token
            
        return super().authenticate(request)
