# # works with both python 2 and 3
# from __future__ import print_function
# import os

# import africastalking

# username = os.getenv('AFRICASTALKING_USERNAME')
# api_key = os.getenv('AFRICASTALKING_API_KEY')

# def send_sms(user, otp):
#     recipients = [user.phone_number]
#     message = f"Your EDUMAS verification code is: {otp}. This code will expire in 10 minutes."
#     sender = "EDUMAS"
#     africastalking.initialize(username, api_key)
#     # Get the SMS service
#     sms = africastalking.SMS
#     try:
#         # Thats it, hit send and we'll take care of the rest.
#         response = sms.send(message, recipients, sender)
#         print (response)
#     except Exception as e:
#         print ('Encountered an error while sending: %s' % str(e))


