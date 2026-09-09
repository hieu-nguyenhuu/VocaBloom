-- 0007_import_topic.sql — Import 1 file JSON = 1 topic (SPECIFICATION.md §10, DEC-21).
--
-- "1 transaction, tất cả-hoặc-không" (§10.4): supabase-js KHÔNG có transaction phía
-- client, nên toàn bộ 7 bước gói trong 1 hàm plpgsql. Gọi qua rpc() thì bản thân lời
-- gọi hàm đã là một transaction => raise exception ở bất kỳ bước nào là rollback sạch.
--
-- KHÔNG khai security definer: chạy bằng quyền người gọi (authenticated, đã có GRANT
-- từ M1). Nhờ vậy không tái tạo lỗ hổng RPC đã gặp ở 0005 (MB-13/3).
--
-- Chốt Q4 (2026-09-09): LUÔN tạo topic mới, không bao giờ merge/ghi đè — nhất quán DEC-21.

create or replace function import_topic(du_lieu jsonb) returns jsonb
language plpgsql
as $fn$
declare
  v_topic_id  uuid;
  v_id        uuid;
  map         jsonb := '{}'::jsonb;   -- temp_id -> uuid dạng text
  phan_tu     jsonb;
  pl          jsonb;
  v_noi_dung  jsonb;
  so_tu       int := 0;
  so_bai      int := 0;
  so_dong     int := 0;
begin
  if du_lieu -> 'topic' ->> 'name' is null then
    raise exception 'topic.name bắt buộc phải có';
  end if;

  -- B1. Topic — luôn tạo mới (Q4)
  insert into topics (name, description)
  values (du_lieu -> 'topic' ->> 'name', du_lieu -> 'topic' ->> 'description')
  returning id into v_topic_id;

  -- B2-B4. Vocab -> map temp_id->uuid -> word_state -> vocab_topics
  for phan_tu in select * from jsonb_array_elements(coalesce(du_lieu -> 'vocab', '[]'::jsonb))
  loop
    insert into vocab (word, pinyin, meaning_vi, collocation, collocation_pinyin,
                       collocation_meaning_vi, example_sentence, example_meaning_vi, lang)
    values (phan_tu ->> 'word', phan_tu ->> 'pinyin', phan_tu ->> 'meaning_vi',
            phan_tu ->> 'collocation', phan_tu ->> 'collocation_pinyin',
            phan_tu ->> 'collocation_meaning_vi', phan_tu ->> 'example_sentence',
            phan_tu ->> 'example_meaning_vi', phan_tu ->> 'lang')
    returning id into v_id;

    map := map || jsonb_build_object(phan_tu ->> 'temp_id', v_id::text);

    -- next_review_date = NULL: vào hàng đợi chờ, cron nhỏ giọt sau (DEC-16, §3.1).
    -- Thiếu bước này thì từ mới không bao giờ được kích hoạt.
    insert into word_state (vocab_id, stage, next_review_date) values (v_id, 'new', null);
    insert into vocab_topics (vocab_id, topic_id) values (v_id, v_topic_id);

    so_tu := so_tu + 1;
  end loop;

  -- B5. Exercises — dịch temp_id -> uuid ở CẢ HAI chỗ: vocab_temp_id và payload.blank_b_vocab_id
  for phan_tu in select * from jsonb_array_elements(coalesce(du_lieu -> 'exercises', '[]'::jsonb))
  loop
    if not (map ? (phan_tu ->> 'vocab_temp_id')) then
      raise exception 'exercises: vocab_temp_id "%" không có trong mảng vocab',
                      phan_tu ->> 'vocab_temp_id';
    end if;

    pl := coalesce(phan_tu -> 'payload', '{}'::jsonb);

    -- blank_b_vocab_id nằm LỒNG trong payload. Quên dịch thì Player không tìm ra
    -- "từ B" của Select/Fill Dialog (systemPatterns.md §7.2).
    if pl ? 'blank_b_vocab_id' then
      if not (map ? (pl ->> 'blank_b_vocab_id')) then
        raise exception 'exercises: payload.blank_b_vocab_id "%" không có trong mảng vocab',
                        pl ->> 'blank_b_vocab_id';
      end if;
      pl := jsonb_set(pl, '{blank_b_vocab_id}', to_jsonb(map ->> (pl ->> 'blank_b_vocab_id')));
    end if;

    insert into exercises (vocab_id, type, payload)
    values ((map ->> (phan_tu ->> 'vocab_temp_id'))::uuid,
            (phan_tu ->> 'type')::exercise_type, pl);

    so_bai := so_bai + 1;
  end loop;

  -- B6. Hội thoại — vừa dịch giá trị vừa ĐỔI TÊN KHOÁ:
  -- file import dùng highlight_vocab_temp_ids, schema §2 quy định highlight_vocab_ids (uuid).
  if du_lieu -> 'dialogue' -> 'lines' is not null then
    select jsonb_build_object('lines', coalesce(jsonb_agg(
        case when dong ? 'highlight_vocab_temp_ids'
          then jsonb_set(dong - 'highlight_vocab_temp_ids', '{highlight_vocab_ids}',
                 (select coalesce(jsonb_agg(map ->> t), '[]'::jsonb)
                    from jsonb_array_elements_text(dong -> 'highlight_vocab_temp_ids') t))
          else dong end
        order by thu_tu
      ), '[]'::jsonb))
    into v_noi_dung
    from jsonb_array_elements(du_lieu -> 'dialogue' -> 'lines') with ordinality as x(dong, thu_tu);

    so_dong := jsonb_array_length(v_noi_dung -> 'lines');

    if so_dong > 0 then
      insert into topic_dialogues (topic_id, content) values (v_topic_id, v_noi_dung);
    end if;
  end if;

  -- B7.
  return jsonb_build_object('topic_id', v_topic_id, 'so_tu', so_tu,
                            'so_bai_tap', so_bai, 'so_dong_hoi_thoai', so_dong);
end $fn$;
