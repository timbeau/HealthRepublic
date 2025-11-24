# src/users/enums.py

from enum import Enum


class IndustryEnum(str, Enum):
    healthcare = "Healthcare"
    manufacturing = "Manufacturing"
    construction = "Construction"
    education = "Education"
    technology = "Technology"
    finance = "Finance"
    nonprofit = "Nonprofit"
    retail = "Retail"
    consulting= "Business Consulting"
    energy= "Oil and Gas"
    other = "Other"


class AgeRangeEnum(str, Enum):
    age_18_25 = "18–25"
    age_26_34 = "26–34"
    age_35_44 = "35–44"
    age_45_54 = "45–54"
    age_55_64 = "55–64"
    age_65_plus = "65+"


class RoleEnum(str, Enum):
    member = "Member"
    supplier = "Insurance Supplier"
    provider= "Healthcare Provider"
    admin = "admin"


class UserTypeEnum(str, Enum):
    consumer = "consumer"
    employer = "employer"
    provider_admin = "provider_admin"
