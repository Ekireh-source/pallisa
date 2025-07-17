# Generated manually to add NonStaffMember model only

import django.db.models.deletion
import members.models
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0002_setupsteps_school_campus_role_school_and_more"),
        ("members", "0006_salaryallowance_salarydeduction_salarypayment_and_more"),
    ]

    operations = [
        migrations.CreateModel(
            name="NonStaffMember",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "employee_id",
                    models.CharField(db_index=True, max_length=20, unique=True),
                ),
                (
                    "hire_date",
                    models.DateField(default=members.models.get_current_date),
                ),
                (
                    "qualification",
                    models.CharField(blank=True, max_length=200, null=True),
                ),
                (
                    "specialization",
                    models.CharField(blank=True, max_length=200, null=True),
                ),
                ("years_of_experience", models.PositiveIntegerField(default=0)),
                ("previous_experience", models.TextField(blank=True, null=True)),
                (
                    "employment_type",
                    models.CharField(
                        choices=[
                            ("full_time", "Full Time"),
                            ("part_time", "Part Time"),
                            ("contract", "Contract"),
                            ("temporary", "Temporary"),
                            ("volunteer", "Volunteer"),
                        ],
                        default="full_time",
                        max_length=20,
                    ),
                ),
                (
                    "salary",
                    models.DecimalField(
                        blank=True, decimal_places=2, max_digits=10, null=True
                    ),
                ),
                ("is_active", models.BooleanField(default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "user_profile",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="non_staff_profile",
                        to="accounts.userprofile",
                    ),
                ),
            ],
            options={
                "verbose_name_plural": "Non-Staff Members",
            },
        ),
        migrations.AddIndex(
            model_name="nonstaffmember",
            index=models.Index(
                fields=["employee_id"], name="members_non_employe_64c200_idx"
            ),
        ),
        migrations.AddIndex(
            model_name="nonstaffmember",
            index=models.Index(
                fields=["employment_type", "is_active"],
                name="members_non_employm_bf51b1_idx",
            ),
        ),
        migrations.AddIndex(
            model_name="nonstaffmember",
            index=models.Index(
                fields=["hire_date"], name="members_non_hire_da_ae3bdd_idx"
            ),
        ),
    ] 