-- 0016_song_ngu.sql — M26a: từ vựng PHỤ (Trung ↔ Anh) + dạng bài near_synonym (Design.m26.md §2).
-- Idempotent (MB-11). Cột NULLABLE: 678 từ cũ chưa có dữ liệu; NOT NULL đặt ở 0017 (M26d) SAU khi bổ sung đủ.
-- Ngôn ngữ của từ phụ KHÔNG lưu — suy ra: lang='zh' ⇒ phụ là 'en' và ngược lại.
alter table vocab add column if not exists secondary_word        text;  -- "review; revise" — nghĩa ĐẦU là nghĩa chính
alter table vocab add column if not exists secondary_phonetic    text;  -- IPA (phụ en) hoặc pinyin (phụ zh)
alter table vocab add column if not exists secondary_collocation text;
alter table vocab add column if not exists secondary_example     text;
alter table vocab add column if not exists secondary_note        text;  -- ghi chú phân biệt, tuỳ chọn

-- Dạng 18. ADD VALUE chạy được trong transaction (PG ≥ 12) miễn KHÔNG dùng giá trị mới trong cùng transaction.
alter type exercise_type add value if not exists 'near_synonym';
