from openai import OpenAI
from app.core.config import settings
from datetime import date

client = OpenAI(api_key=settings.OPENAI_API_KEY)


def get_daily_recommendation(user_name: str, checkin_data: dict, planned_workout: str = None):
    """Generate AI coaching recommendation based on check-in data"""

    # Build context from check-in data
    context = f"""You are a knowledgeable running and badminton coach. Your athlete {user_name} has completed their morning check-in.

Today's metrics:
- Sleep: {checkin_data.get('sleep_hours', 'N/A')} hours, quality {checkin_data.get('sleep_quality', 'N/A')}/5
- HRV: {checkin_data.get('hrv', 'N/A')} ms
- Resting HR: {checkin_data.get('rhr', 'N/A')} bpm
- Energy level: {checkin_data.get('energy_level', 'N/A')}/5
- Soreness level: {checkin_data.get('soreness_level', 'N/A')}/5
- Notes: {checkin_data.get('notes', 'None')}

Planned workout: {planned_workout or 'Threshold run: 6-8 × 800m @ 3:20-3:25, jog rest 200m'}

Based on these recovery metrics, provide a brief recommendation (2-3 sentences):
1. Should they do the planned workout, modify it, or rest?
2. Any specific adjustments needed (intensity, volume, etc.)?
3. Brief reasoning based on the metrics.

Keep it concise and actionable."""

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system",
                 "content": "You are an experienced endurance coach specializing in running and badminton training."},
                {"role": "user", "content": context}
            ],
            max_tokens=200,
            temperature=0.7
        )

        return response.choices[0].message.content
    except Exception as e:
        return f"Error getting recommendation: {str(e)}"