from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from . models import CustomUser, Role, Permission, Document, UserProfile, EmailVerificationToken, PermissionCategory, UserPermission, PasswordResetToken
from django.utils.translation import gettext_lazy as _
from django.contrib.auth.models import Group

admin.site.register(Permission)
admin.site.register(PermissionCategory)
admin.site.register(CustomUser)
admin.site.register(Role)
admin.site.register(Document)
admin.site.register(UserProfile)
admin.site.register(EmailVerificationToken)
admin.site.register(UserPermission)
admin.site.register(PasswordResetToken)
