from django.conf import settings
from django.core.serializers import serialize
from django.contrib import messages
from django.shortcuts import get_object_or_404
from users.models import MyAccount, Skills, Roles
from packages.models import Package

def user_context(request):

    skill_names = []
    role_names = []

    try:
        this_user = MyAccount.objects.get(email=request.user)
        user_package = Package.objects.get(tier=this_user.package_tier)
        full_name = this_user.first_name + " " + this_user.last_name
        full_name_title = full_name.title()
        free_account = this_user.package_tier is 1
        
        # Return all skills and user skills
        skills = Skills.objects.all().order_by('skill_name')
        for skill in skills:
            skill_names.append(skill.skill_name)
        user_skills = this_user.skills
        if not user_skills:
            user_skills = ""

        # Return all roles and user role
        roles = Roles.objects.all().order_by('role_name')
        for role in roles: 
            role_names.append(role.role_name)

        context = {
            'this_user': this_user,
            'user_package': user_package,
            'profile_image': this_user.profile_image.url,
            'full_name': full_name_title,
            'skills': skill_names,
            'user_skills': user_skills,
            'user_ind': this_user.industry,
            'all_roles': role_names,
            'user_role': this_user.job_role,
            'free_account': free_account,
        }
        return context
    except Exception as e:
        context = {
            'this_user': "Anonymous",
            'profile_image': "",
            'full_name': ""
        }
        return context
