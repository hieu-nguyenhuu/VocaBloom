-- 0004_seed_settings.sql — 5 key mặc định (SPECIFICATION.md §11, DEC-17).
--
-- "on conflict do nothing" là BẮT BUỘC: chạy lại migration không được ghi đè
-- openrouter_api_key / model mà người dùng đã nhập ở màn Cài đặt.

insert into settings (key, value) values
  ('openrouter_api_key',      'null'),
  ('openrouter_model',        'null'),
  ('new_words_per_day',       '5'),
  ('tts_voice',               '"cmn-CN-Neural2-A"'),
  ('low_queue_alert_enabled', 'true')
on conflict (key) do nothing;
