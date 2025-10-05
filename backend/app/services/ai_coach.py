from openai import OpenAI
from app.core.config import settings
from datetime import date, datetime, timedelta
import json

client = OpenAI(api_key=settings.OPENAI_API_KEY)


def get_daily_recommendation(user_name: str, checkin_data: dict, planned_workout: str = None):
    """Generate AI coaching recommendation based on check-in data"""

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


def generate_weekly_training_plan(user_profile: dict, start_date: date = None):
    """
    Generate a complete weekly training plan based on detailed user profile

    Args:
        user_profile: Dict with badminton_sessions, running details, preferences, constraints
        start_date: Start date for the plan (defaults to next Monday)

    Returns:
        Dict with daily workouts for the week
    """

    if start_date is None:
        today = date.today()
        days_until_monday = (7 - today.weekday()) % 7
        start_date = today + timedelta(days=days_until_monday if days_until_monday > 0 else 7)

    # Extract all profile data
    badminton_sessions = user_profile.get('badminton_sessions', [])
    primary_sport = user_profile.get('primary_sport', 'both')
    running_goal = user_profile.get('running_goal', 'general fitness')
    target_race = user_profile.get('target_race')
    weekly_volume = user_profile.get('weekly_run_volume_target', 180)
    running_exp = user_profile.get('running_experience', {})
    preferred_run_days = user_profile.get('preferred_run_days', [])
    avoid_run_days = user_profile.get('avoid_run_days', [])
    injuries = user_profile.get('current_injuries', [])
    sleep_avg = user_profile.get('sleep_average')
    other_commitments = user_profile.get('other_commitments')

    # Build badminton schedule description
    badminton_desc = ""
    if badminton_sessions:
        session_list = []
        for session in badminton_sessions:
            day = session.get('day', 'unknown')
            duration = session.get('duration_minutes', 0)
            intensity = session.get('intensity', 'moderate')
            session_type = session.get('type', 'training')
            session_list.append(f"{day}: {duration}min {intensity} {session_type}")
        badminton_desc = "\n".join(session_list)
    else:
        badminton_desc = "No badminton scheduled"

    # Build running experience description
    exp_desc = ""
    if running_exp:
        exp_parts = []
        if running_exp.get('years_running'):
            exp_parts.append(f"{running_exp['years_running']} years running")
        if running_exp.get('current_weekly_volume'):
            exp_parts.append(f"currently {running_exp['current_weekly_volume']}min/week")
        if running_exp.get('longest_run'):
            exp_parts.append(f"longest run: {running_exp['longest_run']}min")
        if running_exp.get('recent_race_times'):
            times = ", ".join([f"{dist}: {time}" for dist, time in running_exp['recent_race_times'].items()])
            exp_parts.append(f"recent times: {times}")
        exp_desc = ", ".join(exp_parts) if exp_parts else "beginner runner"
    else:
        exp_desc = "experience level not specified"

    # Build injury description
    injury_text = "No current injuries"
    if injuries and len(injuries) > 0:
        injury_list = [f"{inj.get('area', 'unknown')} ({inj.get('severity', 'unknown')})"
                       for inj in injuries]
        injury_text = f"Current injuries: {', '.join(injury_list)}"

    # Build constraints
    constraints = []
    if preferred_run_days:
        constraints.append(f"Prefers to run on: {', '.join(preferred_run_days)}")
    if avoid_run_days:
        constraints.append(f"Cannot run on: {', '.join(avoid_run_days)}")
    if sleep_avg:
        constraints.append(f"Average sleep: {sleep_avg} hours")
    if other_commitments:
        constraints.append(f"Other commitments: {other_commitments}")

    constraints_text = "\n".join(constraints) if constraints else "No specific constraints"

    context = f"""Create a weekly training plan for an athlete with the following detailed profile:

BADMINTON SCHEDULE:
{badminton_desc}

RUNNING PROFILE:
- Primary focus: {primary_sport}
- Goal: {running_goal}
{f"- Target race: {target_race}" if target_race else ""}
- Weekly run volume target: {weekly_volume} minutes
- Experience: {exp_desc}

CONSTRAINTS & PREFERENCES:
{constraints_text}

RECOVERY STATUS:
{injury_text}

CRITICAL REQUIREMENTS:
1. Account for badminton load - if they have hard/long badminton sessions, adjust running accordingly
2. Running volume should match their target ({weekly_volume}min total for the week)
3. For experienced runners, include proper workout variety (easy, tempo, intervals)
4. For beginners, focus on building aerobic base with mostly easy running
5. Respect preferred/avoid days for running
6. Never schedule hard running the day before or after hard/competition badminton
7. If they have specific race goals, structure workouts toward that distance and pace
8. If injuries exist, suggest appropriate modifications or alternative training
9. Include rest/recovery days - don't just fill every day with training
10. Include 2 strength/core sessions per week on easy running days or rest days
11. Strength sessions should be 30-45 minutes, focusing on injury prevention and performance
12. Core sessions could be on easy running days or rest days

WORKOUT INTENSITY GUIDELINES:
- Easy runs should be 60-120 minutes for experienced runners, 20-45 for beginners
- Tempo/threshold work: 20-40 minutes at effort
- Intervals: Total session 45-75 minutes including warmup/cooldown
- Long runs: 90-150 minutes depending on experience

Return ONLY a valid JSON object with this exact structure:
{{
  "monday": {{"type": "type": "run|badminton|rest|strength|cross-training", "workout": "detailed description", "duration_minutes": number, "notes": "rationale/modifications"}},
  "tuesday": {{"type": "...", "workout": "...", "duration_minutes": ..., "notes": "..."}},
  "wednesday": {{"type": "...", "workout": "...", "duration_minutes": ..., "notes": "..."}},
  "thursday": {{"type": "...", "workout": "...", "duration_minutes": ..., "notes": "..."}},
  "friday": {{"type": "...", "workout": "...", "duration_minutes": ..., "notes": "..."}},
  "saturday": {{"type": "...", "workout": "...", "duration_minutes": ..., "notes": "..."}},
  "sunday": {{"type": "...", "workout": "...", "duration_minutes": ..., "notes": "..."}}
}}

Do not include any markdown formatting, just the JSON object."""

    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system",
                 "content": "You are an expert coach creating personalized training plans. Always return valid JSON only."},
                {"role": "user", "content": context}
            ],
            max_tokens=1500,
            temperature=0.7
        )

        plan_json = response.choices[0].message.content.strip()

        # Remove markdown code blocks if present
        if plan_json.startswith("```"):
            plan_json = plan_json.split("```")[1]
            if plan_json.startswith("json"):
                plan_json = plan_json[4:]
            plan_json = plan_json.strip()

        plan = json.loads(plan_json)

        # Add dates to each day
        days_of_week = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        for i, day in enumerate(days_of_week):
            if day in plan:
                plan[day]['date'] = (start_date + timedelta(days=i)).isoformat()

        return plan

    except json.JSONDecodeError as e:
        raise Exception(f"Failed to parse AI response as JSON: {str(e)}")
    except Exception as e:
        raise Exception(f"Error generating training plan: {str(e)}")