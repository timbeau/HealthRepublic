# src/surveys/router.py
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..users.models import User
from . import models, schemas, services

router = APIRouter()


@router.get("/questions", response_model=List[schemas.SurveyQuestion])
def get_survey_questions():
    """
    Return a static list of survey questions for the UI to render.
    """
    return [
        schemas.SurveyQuestion(
            id="expected_primary_care_visits",
            label="How many primary care visits do you expect per year?",
            type="int",
            min=0,
            max=20,
        ),
        schemas.SurveyQuestion(
            id="expected_specialist_visits",
            label="How many specialist visits do you expect per year?",
            type="int",
            min=0,
            max=20,
        ),
        schemas.SurveyQuestion(
            id="expected_er_urgent_visits",
            label="How many ER or urgent care visits do you expect per year?",
            type="int",
            min=0,
            max=10,
        ),
        schemas.SurveyQuestion(
            id="mental_health_priority",
            label="How important is mental health coverage?",
            help_text="0 = not important, 10 = extremely important",
            type="int",
            min=0,
            max=10,
        ),
        schemas.SurveyQuestion(
            id="telehealth_priority",
            label="How important is telehealth access?",
            help_text="0 = not important, 10 = extremely important",
            type="int",
            min=0,
            max=10,
        ),
        schemas.SurveyQuestion(
            id="monthly_rx_spend",
            label="What is your estimated monthly prescription drug spend (USD)?",
            type="float",
            min=0,
            max=2000,
        ),
        schemas.SurveyQuestion(
            id="brand_drug_flexibility",
            label="How flexible are you about brand-name vs generic drugs?",
            type="select",
            options=[
                schemas.SurveyQuestionOption(
                    value="prefer_generics", label="I prefer generics to save money"
                ),
                schemas.SurveyQuestionOption(
                    value="no_preference", label="No strong preference"
                ),
                schemas.SurveyQuestionOption(
                    value="brand_only", label="I prefer brand-name drugs"
                ),
            ],
        ),
        schemas.SurveyQuestion(
            id="risk_tolerance",
            label="Which best describes your ideal plan design?",
            type="select",
            options=[
                schemas.SurveyQuestionOption(
                    value="low_premium",
                    label="Lowest possible monthly premium (ok with higher deductible)",
                ),
                schemas.SurveyQuestionOption(
                    value="balanced",
                    label="Balanced premium and out-of-pocket costs",
                ),
                schemas.SurveyQuestionOption(
                    value="low_deductible",
                    label="Higher premium but low deductible & predictable costs",
                ),
            ],
        ),
        schemas.SurveyQuestion(
            id="preferred_network_type",
            label="What type of network do you prefer?",
            type="select",
            options=[
                schemas.SurveyQuestionOption(value="HMO", label="HMO (lower cost, smaller network)"),
                schemas.SurveyQuestionOption(value="PPO", label="PPO (more freedom, higher cost)"),
                schemas.SurveyQuestionOption(value="EPO", label="EPO (in-between, limited out-of-network)"),
                schemas.SurveyQuestionOption(value="HDHP", label="High-deductible plan (HDHP)"),
            ],
        ),
        schemas.SurveyQuestion(
            id="wants_hsa",
            label="Do you want to be eligible for a Health Savings Account (HSA)?",
            type="boolean",
        ),
        schemas.SurveyQuestion(
            id="needs_maternity",
            label="Do you anticipate maternity coverage needs in the next 2 years?",
            type="boolean",
        ),
        schemas.SurveyQuestion(
            id="needs_chronic_care_management",
            label="Do you need ongoing chronic care management?",
            type="boolean",
        ),
    ]


@router.post(
    "/responses",
    response_model=schemas.SurveyResponseOut,
    status_code=status.HTTP_201_CREATED,
)
def submit_survey_response(
    payload: schemas.SurveyResponseCreate,
    db: Session = Depends(get_db),
):
    """
    Create or update survey responses for a given user_id (no auth for now).
    """
    user = db.query(User).filter(User.id == payload.user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with id {payload.user_id} not found",
        )

    # Reuse the base part (excluding user_id)
    base = schemas.SurveyResponseBase(
        **payload.model_dump(exclude={"user_id"}, exclude_unset=True)
    )

    sr = services.upsert_survey_response(db=db, user=user, data=base)
    return sr


@router.get(
    "/responses/{user_id}",
    response_model=schemas.SurveyResponseOut,
)
def get_survey_response(
    user_id: int,
    db: Session = Depends(get_db),
):
    sr = (
        db.query(models.SurveyResponse)
        .filter(models.SurveyResponse.user_id == user_id)
        .first()
    )
    if not sr:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Survey response not found for this user",
        )
    return sr
