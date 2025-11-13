from openai import OpenAI
from app.core.config import settings
from datetime import date, datetime, timedelta
import json

client = OpenAI(api_key=settings.OPENAI_API_KEY)


def get_daily_recommendation(user_name: str, checkin_data: dict, planned_workout: str = None):
    """Generate AI coaching recommendation based on check-in data"""

    planned_text = f"Planned workout: {planned_workout}" if planned_workout else "No workout planned for today."

    context = f"""You are a knowledgeable running and badminton coach. Your athlete {user_name} has completed their morning check-in.

Today's recovery metrics:
- Sleep: {checkin_data.get('sleep_hours', 'N/A')} hours, quality {checkin_data.get('sleep_quality', 'N/A')}/5
- HRV: {checkin_data.get('hrv', 'N/A')} ms
- Resting HR: {checkin_data.get('rhr', 'N/A')} bpm
- Energy level: {checkin_data.get('energy_level', 'N/A')}/5
- Soreness level: {checkin_data.get('soreness_level', 'N/A')}/5
- Notes: {checkin_data.get('notes', 'None')}

{planned_text}

Based on these recovery metrics, provide a recommendation (2-3 sentences):

DECISION FRAMEWORK:
- Green light (good recovery): Confirm the planned workout as-is
- Yellow flag (moderate fatigue): Suggest modifications (reduce volume/intensity by 20-30%)
- Red flag (poor recovery): Recommend rest or very easy active recovery

Your recommendation should:
1. State whether to do the planned workout, modify it, or rest
2. If modifying, give specific adjustments (e.g., "reduce to 30min easy instead of 45min tempo")
3. Brief reasoning based on the key metrics

Keep it concise, actionable, and coach-like in tone."""

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system",
                 "content": "You are an experienced endurance coach specializing in running and badminton training. You prioritize athlete health and smart training decisions."},
                {"role": "user", "content": context}
            ],
            max_tokens=250,
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

CRITICAL REQUIREMENTS
1.	Account for badminton load – if user has hard/long/competition badminton sessions, adjust running so no hard runs occur right before or after. Easy jogs or full rest are allowed if recovery is sufficient.
2.	Running volume must align with weekly_volume_min target – stay within ±5–10% of goal, respecting recent training history.
3.	Experienced runners – must have weekly variety: at least 1 easy run, 1 threshold/tempo or cruise intervals, 1 long run. Add intervals if total volume and recovery allow.
4.	Beginners – focus on building aerobic base: mostly Z2 easy runs, optional strides, long run progression. Minimal structured intensity until consistent.
5.	Respect user constraints – honor preferred/avoid run days, daily time availability, and total weekly schedule.
6.	Hard badminton protection – never schedule tempo/intervals the day before or after hard/competition badminton. On those days: only rest or optional 20–30min Z1–Z2.
7.	Race-goal alignment – include at least one workout per week that trains the specific demand of the goal event (tempo for 5k/10k, intervals for 800/1500, long aerobic for half/marathon). Progress toward specificity as race nears.
8.	Injury adjustments – replace high-impact runs with bike, elliptical, or aqua-jog; emphasize rehab and mobility on affected areas. Reduce volume/intensity.
9.	Strength training (30–45min) – 2 sessions per week on easy run or rest days. Avoid strength on hard badminton or interval days.
10.	Strength balance – one session should be lighter maintenance (mobility, activation, stability), one should be harder (compound lifts, plyometrics).
11.	Core training (10–20min) – 3× per week on easy run or rest days. Mix stability (planks, bird dogs) with dynamic (twists, V-ups).
12. Every 3-4 weeks, include a recovery week: reduce volume by 20-30%, keep intensity days but shorter, prioritize sleep and mobility.
13. Progressive overload: Increase volume by max 10% per week. Add intensity before adding volume. Respect fatigue signals.


WORKOUT INTENSITY GUIDELINES
- Easy runs (Z2): Beginners 20–45 min, HR 65–75% HRmax (conversational). Experienced 45–90 min (can extend to 120 if well-trained).
- Tempo / Threshold: 20–40 min total at comfortably hard effort. Continuous (e.g., 20min at LT pace) or broken (e.g., 3×10min with jog rest). Pace = around 10k/HM effort, HR ~80–88% HRmax, RPE 6–7.
- Intervals (VO2 focus): Session length with warm-up/cooldown 45–75 min. Work 12–24 min total, reps of 2–5min (e.g., 6–8×800m). Rest 90–120s jog or equal time. Pace = around 3–5k effort, HR ~90–95% HRmax by rep end.
- Long runs: Beginners 50–80 min. Experienced 70–120 min (150 max only for marathon prep). Effort Z2 steady, HR 65–75% HRmax, RPE 3–4.

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


def generate_single_day_workout(user_profile: dict, day: str, date_str: str, existing_plan: dict = None):
    """
    Regenerate a single day's workout

    Args:
        user_profile: Dict with user's training profile
        day: Day of week (e.g., "monday")
        date_str: ISO date string for this day
        existing_plan: The current week's plan to maintain consistency

    Returns:
        Dict with workout for the specified day
    """

    badminton_sessions = user_profile.get('badminton_sessions', [])
    primary_sport = user_profile.get('primary_sport', 'both')
    running_goal = user_profile.get('running_goal', 'general fitness')
    weekly_volume = user_profile.get('weekly_run_volume_target', 180)
    running_exp = user_profile.get('running_experience', {})
    injuries = user_profile.get('current_injuries', [])

    # Build context about the week
    week_context = ""
    if existing_plan:
        other_days = []
        days_order = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        for d in days_order:
            if d != day and d in existing_plan:
                workout = existing_plan[d]
                other_days.append(f"{d.capitalize()}: {workout.get('type')} - {workout.get('workout', 'N/A')}")
        week_context = "REST OF THE WEEK:\n" + "\n".join(other_days)

    # Build badminton info for this specific day
    badminton_today = None
    for session in badminton_sessions:
        if session.get('day', '').lower() == day:
            badminton_today = session
            break

    badminton_info = "No badminton today"
    if badminton_today:
        duration = badminton_today.get('duration_minutes', 0)
        intensity = badminton_today.get('intensity', 'moderate')
        session_type = badminton_today.get('type', 'training')
        badminton_info = f"Badminton today: {duration}min {intensity} {session_type}"

    # Build injury description
    injury_text = "No current injuries"
    if injuries and len(injuries) > 0:
        injury_list = [f"{inj.get('area', 'unknown')} ({inj.get('severity', 'unknown')})" for inj in injuries]
        injury_text = f"Current injuries: {', '.join(injury_list)}"

    context = f"""Regenerate a single day's workout for {day.capitalize()}:

ATHLETE PROFILE:
- Primary focus: {primary_sport}
- Running goal: {running_goal}
- Weekly run volume target: {weekly_volume} minutes
- Experience: {running_exp}
- {injury_text}

TODAY'S CONTEXT ({day.upper()}):
{badminton_info}

{week_context}

REQUIREMENTS:
1. The workout should complement the rest of the week shown above
2. Account for badminton load if scheduled today
3. Avoid repeating similar workouts from adjacent days
4. Maintain appropriate recovery between hard sessions
5. Keep total weekly volume close to target
6. If badminton today is hard/long, make running easy or suggest rest
7. Include strength/core sessions on appropriate days (30-45min)
8. Make the workout different from what was there before (user wants variety)

Return ONLY a valid JSON object with this structure:
{{
  "type": "run|badminton|rest|strength|cross-training",
  "workout": "detailed workout description",
  "duration_minutes": number,
  "notes": "rationale and any modifications",
  "date": "{date_str}"
}}

Do not include any markdown formatting, just the JSON object."""

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system",
                 "content": "You are an expert coach creating personalized workouts. Always return valid JSON only."},
                {"role": "user", "content": context}
            ],
            max_tokens=500,
            temperature=0.8  # Higher temperature for more variety
        )

        workout_json = response.choices[0].message.content.strip()

        # Remove markdown code blocks if present
        if workout_json.startswith("```"):
            workout_json = workout_json.split("```")[1]
            if workout_json.startswith("json"):
                workout_json = workout_json[4:]
            workout_json = workout_json.strip()

        workout = json.loads(workout_json)

        # Ensure date is set
        workout['date'] = date_str

        return workout

    except json.JSONDecodeError as e:
        raise Exception(f"Failed to parse AI response as JSON: {str(e)}")
    except Exception as e:
        raise Exception(f"Error generating workout: {str(e)}")


def adjust_todays_workout(current_workout: dict, checkin_data: dict, recommendation: str = None):
    """
    Adjust today's workout based on recovery metrics

    Args:
        current_workout: The originally planned workout for today
        checkin_data: Today's check-in data (sleep, HRV, energy, etc.)
        recommendation: Optional AI recommendation text for context

    Returns:
        Dict with adjusted workout
    """

    # Build recovery assessment
    recovery_notes = []

    sleep_hours = checkin_data.get('sleep_hours', 0)
    sleep_quality = checkin_data.get('sleep_quality', 0)
    hrv = checkin_data.get('hrv')
    energy = checkin_data.get('energy_level', 0)
    soreness = checkin_data.get('soreness_level', 0)

    if sleep_hours and sleep_hours < 6:
        recovery_notes.append("significantly under-slept")
    if sleep_quality and sleep_quality <= 2:
        recovery_notes.append("poor sleep quality")
    if energy and energy <= 2:
        recovery_notes.append("low energy")
    if soreness and soreness >= 4:
        recovery_notes.append("high soreness")

    recovery_status = ", ".join(recovery_notes) if recovery_notes else "recovery looks acceptable"

    context = f"""You are adjusting a training session based on athlete recovery data.

ORIGINAL PLANNED WORKOUT:
Type: {current_workout.get('type', 'unknown')}
Workout: {current_workout.get('workout', 'N/A')}
Duration: {current_workout.get('duration_minutes', 0)} minutes
Notes: {current_workout.get('notes', 'N/A')}

TODAY'S RECOVERY METRICS:
- Sleep: {sleep_hours} hours, quality {sleep_quality}/5
- HRV: {hrv if hrv else 'not provided'} ms
- Energy level: {energy}/5
- Soreness level: {soreness}/5
- Additional notes: {checkin_data.get('notes', 'None')}
- Assessment: {recovery_status}

{f"AI COACH RECOMMENDATION: {recommendation}" if recommendation else ""}

ADJUSTMENT RULES:
1. If recovery is poor (low sleep, low energy, high soreness, low HRV):
   - For hard workouts (tempo, intervals): Convert to easy aerobic or suggest rest
   - For easy runs: Reduce duration by 25-40% or suggest active recovery
   - For strength: Make it mobility/activation only, skip heavy lifts

2. If recovery is moderate (some flags but not terrible):
   - For hard workouts: Reduce intensity (tempo→cruise, intervals→fartlek) or volume by 20-30%
   - For easy runs: Reduce by 10-20% or keep as-is
   - For strength: Proceed but monitor energy

3. If recovery is good:
   - Proceed with original workout
   - Maybe even slightly increase if athlete feeling strong

4. Always prioritize long-term health over one session

5. If original workout is already rest/easy, minimal changes needed

Return ONLY a valid JSON object with adjusted workout:
{{
  "type": "run|badminton|rest|strength|cross-training",
  "workout": "adjusted workout description with reasoning",
  "duration_minutes": adjusted_number,
  "notes": "explanation of changes made and why",
  "date": "{current_workout.get('date', date.today().isoformat())}"
}}

Do not include any markdown formatting, just the JSON object."""

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system",
                 "content": "You are a smart training coach who adjusts workouts based on recovery. You err on the side of caution and prioritize athlete health. Always return valid JSON only."},
                {"role": "user", "content": context}
            ],
            max_tokens=500,
            temperature=0.7
        )

        workout_json = response.choices[0].message.content.strip()

        # Remove markdown code blocks if present
        if workout_json.startswith("```"):
            workout_json = workout_json.split("```")[1]
            if workout_json.startswith("json"):
                workout_json = workout_json[4:]
            workout_json = workout_json.strip()

        adjusted_workout = json.loads(workout_json)

        # Ensure date is set
        adjusted_workout['date'] = current_workout.get('date', date.today().isoformat())

        return adjusted_workout

    except json.JSONDecodeError as e:
        raise Exception(f"Failed to parse AI response as JSON: {str(e)}")
    except Exception as e:
        raise Exception(f"Error adjusting workout: {str(e)}")