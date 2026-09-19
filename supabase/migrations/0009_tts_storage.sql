-- 0009_tts_storage.sql — hạ tầng TTS (M6c, SPECIFICATION §9 + DEC-15).
--
-- ⚠️ SỬA LỖI TÀI LIỆU: Google KHÔNG có giọng `cmn-CN-Neural2-*` (kiểm thật 2026-09-18:
--    "Voice 'cmn-CN-Neural2-C' does not exist"). Tiếng Trung chỉ có Standard / Wavenet / Chirp3-HD.
--    Chốt dùng Wavenet, trùng chữ cái A..D nên lựa chọn cũ của người dùng được giữ nguyên.
--
-- Idempotent: chạy lại nhiều lần không đổi kết quả và KHÔNG ghi đè lựa chọn người dùng.

-- 1) Bucket audio — công khai ĐỌC (mp3 phát âm không nhạy cảm, audio_url là URL tĩnh vĩnh viễn)
insert into storage.buckets (id, name, public) values ('audio', 'audio', true)
on conflict (id) do update set public = true;

-- 2) Ghi/sửa/xoá chỉ cho authenticated. Đọc không cần policy vì bucket đã public.
drop policy if exists "audio_write" on storage.objects;
create policy "audio_write" on storage.objects
  for all to authenticated
  using (bucket_id = 'audio')
  with check (bucket_id = 'audio');

-- 3) Sửa DỮ LIỆU đang sai trong settings (giọng không tồn tại ⇒ mọi lời gọi TTS trả 400)
update settings
   set value = to_jsonb(replace(value #>> '{}', 'Neural2', 'Wavenet'))
 where key = 'tts_voice' and value #>> '{}' like 'cmn-CN-Neural2-%';

-- 4) 2 key mới (§11 mở rộng): khoá Google TTS + giọng tiếng Anh riêng
insert into settings (key, value) values
  ('google_tts_api_key', 'null'),
  ('tts_voice_en',       '"en-US-Neural2-C"')
on conflict (key) do nothing;
