CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  new_profile_id uuid;
BEGIN
  IF (NEW.raw_user_meta_data->>'kind') = 'kid' THEN
    RETURN NEW;
  END IF;
  INSERT INTO public.profiles (user_id, role, name, emoji)
  VALUES (NEW.id, 'parent', COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)), '👤')
  RETURNING id INTO new_profile_id;

  -- Seed the parent's own "Me" tab with the same starter tasks kids get.
  -- Keep this list in sync with INITIAL_KID_TASKS in src/lib/kids.functions.ts.
  INSERT INTO public.tasks
    (parent_id, assignee_id, title, title_ru, category, coins, frequency, days_of_week, schedule_type)
  VALUES
    (new_profile_id, new_profile_id,
     'Early wake-up (6–7 AM)', 'Ранний подъём (6–7 утра)',
     'Hygiene', 10, 'daily', '{1,2,3,4,5,6,7}', 'always'),
    (new_profile_id, new_profile_id,
     'Workout or morning exercise', 'Тренировка или зарядка',
     'Sports', 10, 'daily', '{1,2,3,4,5,6,7}', 'always'),
    (new_profile_id, new_profile_id,
     'Book notes / summary of today''s reading', 'Конспект прочитанного за день',
     'Reading', 15, 'daily', '{1,2,3,4,5,6,7}', 'always'),
    (new_profile_id, new_profile_id,
     'Home responsibility (chore around the house)', 'Домашняя обязанность',
     'Chores', 10, 'daily', '{1,2,3,4,5,6,7}', 'always'),
    (new_profile_id, new_profile_id,
     'Creative project (make something by hand)', 'Творческий проект своими руками',
     'Creative', 15, 'daily', '{1,2,3,4,5,6,7}', 'always');

  RETURN NEW;
END; $function$;