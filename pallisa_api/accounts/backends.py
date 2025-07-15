import ssl
import smtplib
from django.core.mail.backends.smtp import EmailBackend as BaseEmailBackend


class CustomEmailBackend(BaseEmailBackend):
    """
    Custom email backend that handles SSL certificate verification issues.
    This is primarily for development environments where SSL verification
    may fail due to certificate issues.
    """
    
    def __init__(self, host=None, port=None, username=None, password=None,
                 use_tls=None, fail_silently=False, use_ssl=None, timeout=None,
                 ssl_keyfile=None, ssl_certfile=None, **kwargs):
        super().__init__(host, port, username, password, use_tls, fail_silently, 
                        use_ssl, timeout, ssl_keyfile, ssl_certfile, **kwargs)
    
    def open(self):
        """
        Ensure an open connection to the email server with SSL certificate verification disabled.
        """
        if self.connection:
            return False

        connection_params = {}
        if self.timeout is not None:
            connection_params['timeout'] = self.timeout
            
        try:
            if self.use_ssl:
                # Use SSL with unverified context
                context = ssl.create_default_context()
                context.check_hostname = False
                context.verify_mode = ssl.CERT_NONE
                self.connection = smtplib.SMTP_SSL(
                    self.host, self.port, context=context, **connection_params
                )
            else:
                # Use regular SMTP
                self.connection = smtplib.SMTP(self.host, self.port, **connection_params)
                
                if self.use_tls:
                    self.connection.ehlo()
                    context = ssl.create_default_context()
                    context.check_hostname = False
                    context.verify_mode = ssl.CERT_NONE
                    self.connection.starttls(context=context)
                    self.connection.ehlo()
                    
            if self.username and self.password:
                self.connection.login(self.username, self.password)
            return True
        except (smtplib.SMTPException, OSError):
            if not self.fail_silently:
                raise 