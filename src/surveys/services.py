# src/surveys/services.py
from sqlalchemy.orm import Session

from . import models, schemas
from ..users.models import User


def upsert_survey_response(
    db: Session,
    user: User,
    data: schemas.SurveyResponseBase,
) -> models.SurveyResponse:
    existing = (
        db.query(models.SurveyResponse)
        .filter(models.SurveyResponse.user_id == user.id)
        .first()
    )

    if existing:
        # update in place
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(existing, field, value)
        db.add(existing)
        db.commit()
        db.refresh(existing)
        return existing

    # create new
    sr = models.SurveyResponse(
        user_id=user.id,
        **data.model_dump(exclude_unset=True),
    )
    db.add(sr)
    db.commit()
    db.refresh(sr)
    return sr
