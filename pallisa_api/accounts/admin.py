from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from . models import CustomUser, Role, Permission, Document, UserProfile, EmailVerificationToken, PermissionCategory, UserPermission, PasswordResetToken, School, Campus, SetupSteps
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
admin.site.register(School)
admin.site.register(Campus)
admin.site.register(SetupSteps)
