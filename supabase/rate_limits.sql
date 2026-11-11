-- Giới hạn số lần gọi API theo IP (chạy một lần trong Supabase > SQL Editor)
create table if not exists public.rate_limits (
  key          text primary key,
  count        integer not null default 0,
  window_start timestamptz not null default now()
);

-- Bật RLS, không tạo policy: chỉ service role (server) đọc/ghi được
alter table public.rate_limits enable row level security;

-- Trả về true nếu key đã vượt quá p_limit lần trong p_window_seconds giây gần nhất
create or replace function public.hit_rate_limit(p_key text, p_limit integer, p_window_seconds integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
  v_cutoff timestamptz := now() - make_interval(secs => p_window_seconds);
begin
  insert into rate_limits (key, count, window_start)
  values (p_key, 1, now())
  on conflict (key) do update
    set count        = case when rate_limits.window_start < v_cutoff then 1 else rate_limits.count + 1 end,
        window_start = case when rate_limits.window_start < v_cutoff then now() else rate_limits.window_start end
  returning count into v_count;

  -- Thỉnh thoảng dọn các key cũ hơn 1 ngày
  if random() < 0.01 then
    delete from rate_limits where window_start < now() - interval '1 day';
  end if;

  return v_count > p_limit;
end;
$$;

revoke all on function public.hit_rate_limit(text, integer, integer) from public, anon, authenticated;
