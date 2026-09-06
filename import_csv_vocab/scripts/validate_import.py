#!/usr/bin/env python3
"""
validate_import.py — Kiểm tra 1 file JSON import VocaBloom trước khi giao cho người dùng.

Cách dùng:
    python3 validate_import.py path/to/file.json [path/to/file2.json ...]

Thoát code 0 nếu tất cả file hợp lệ, khác 0 nếu có lỗi (để dùng trong CI/script tự động).
"""
import json
import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

VALID_TYPES = {
    "flashcard", "grammar", "matching", "selection", "audio_recognition", "fast_decision",
    "translate", "select_dialog", "listen_fill", "select_on_describe",
    "fill_dialog", "select_sentence", "arrange_words", "trans_collocation",
    "make_sentence", "trans_sentence", "complete_situation",
}

NO_PAYLOAD_TYPES = {
    "flashcard", "matching", "translate", "listen_fill", "make_sentence", "trans_collocation",
}

# type -> (required top-level payload keys, exact list count nếu có)
PAYLOAD_REQUIRED_FIELDS = {
    "grammar": {"content_target", "pinyin", "content_vi"},
    "selection": {"distractors"},
    "audio_recognition": {"distractors"},
    "fast_decision": {"wrong_meaning"},
    "select_on_describe": {"description", "distractors"},
    "select_sentence": {"correct_sentence", "wrong_sentences"},
    "arrange_words": {"tokens"},
    "trans_sentence": {"vietnamese_sentence"},
    "complete_situation": {"situation_vi", "given_sentence_zh", "given_sentence_pinyin"},
    "select_dialog": {"dialog_a", "dialog_b", "blank_a_answer", "blank_b_vocab_id", "distractors"},
    "fill_dialog": {"dialog_a", "dialog_b", "blank_a_answer", "blank_b_vocab_id"},
}

# type -> (field chứa list, độ dài bắt buộc)
LIST_LENGTH_RULES = {
    "selection": ("distractors", 3),
    "audio_recognition": ("distractors", 3),
    "select_on_describe": ("distractors", 3),
    "select_dialog": ("distractors", 2),
}

VOCAB_REQUIRED_FIELDS = {
    "temp_id", "word", "pinyin", "meaning_vi",
    "collocation", "collocation_pinyin", "collocation_meaning_vi",
    "example_sentence", "example_meaning_vi", "lang",
}

RECOMMENDED_COVERAGE = {
    "grammar", "selection", "audio_recognition", "fast_decision",
    "select_on_describe", "select_sentence", "arrange_words",
    "trans_sentence", "complete_situation",
}


def validate_file(path):
    errors = []
    warnings = []

    try:
        with open(path, encoding="utf-8") as f:
            data = json.load(f)
    except json.JSONDecodeError as e:
        return [f"JSON không hợp lệ: {e}"], []
    except FileNotFoundError:
        return [f"Không tìm thấy file: {path}"], []

    # --- Cấu trúc khung ngoài ---
    # Lưu ý: "dialogue" về mặt schema thật của app là TÙY CHỌN (có thể vắng/null).
    # Quy trình skill này luôn sinh dialogue (xem SKILL.md Bước 3.4) nên không có ở đây
    # vẫn là dấu hiệu bất thường đáng cảnh báo, nhưng KHÔNG phải lỗi cấu trúc app thật.
    for key in ("topic", "vocab", "exercises"):
        if key not in data:
            errors.append(f"Thiếu key bắt buộc ở cấp cao nhất: '{key}'")
    if "dialogue" not in data or data.get("dialogue") is None:
        warnings.append("Thiếu 'dialogue' — schema thật cho phép vắng mặt, nhưng quy trình skill này luôn nên sinh đủ")
    if errors:
        return errors, warnings

    vocab_list = data["vocab"]
    exercises = data["exercises"]
    dialogue_lines = (data.get("dialogue") or {}).get("lines", [])

    if not data["topic"].get("name"):
        errors.append("topic.name rỗng hoặc thiếu")

    # --- Vocab ---
    temp_ids = set()
    for i, v in enumerate(vocab_list):
        missing = VOCAB_REQUIRED_FIELDS - v.keys()
        if missing:
            errors.append(f"vocab[{i}] (temp_id={v.get('temp_id')}) thiếu field: {sorted(missing)}")
        tid = v.get("temp_id")
        if not tid:
            errors.append(f"vocab[{i}] thiếu temp_id")
        elif tid in temp_ids:
            errors.append(f"temp_id trùng lặp trong vocab: '{tid}'")
        else:
            temp_ids.add(tid)
        if v.get("lang") not in ("zh", "en"):
            errors.append(f"vocab[{i}] (temp_id={tid}) có lang không hợp lệ: {v.get('lang')!r} (chỉ nhận 'zh'/'en')")

    # --- Exercises ---
    coverage = {tid: set() for tid in temp_ids}
    for i, e in enumerate(exercises):
        etype = e.get("type")
        vtid = e.get("vocab_temp_id")
        label = f"exercises[{i}] (type={etype}, vocab_temp_id={vtid})"

        if etype not in VALID_TYPES:
            errors.append(f"{label}: type không hợp lệ")
            continue
        if etype in NO_PAYLOAD_TYPES:
            # LỖI (không phải cảnh báo) — app thật CHẶN CỨNG 6 dạng này trong mảng exercises
            # (field exercises[].type chỉ nhận đúng 11 giá trị, xem payload-schemas.md mục 2-3)
            errors.append(f"{label}: type='{etype}' KHÔNG được phép có record trong exercises — app thật sẽ reject cả file")
            continue
        if vtid not in temp_ids:
            errors.append(f"{label}: vocab_temp_id không tồn tại trong vocab")
            continue

        payload = e.get("payload", {})
        required = PAYLOAD_REQUIRED_FIELDS.get(etype, set())
        missing = required - payload.keys()
        if missing:
            errors.append(f"{label}: payload thiếu field {sorted(missing)}")

        if etype in LIST_LENGTH_RULES:
            field, n = LIST_LENGTH_RULES[etype]
            val = payload.get(field)
            if isinstance(val, list) and len(val) != n:
                errors.append(f"{label}: payload.{field} phải có đúng {n} phần tử, hiện có {len(val)}")

        if etype == "select_sentence":
            ws = payload.get("wrong_sentences")
            if isinstance(ws, list) and len(ws) != 3:
                errors.append(f"{label}: payload.wrong_sentences phải có đúng 3 phần tử, hiện có {len(ws)}")

        # Cross-reference blank_b_vocab_id
        if etype in ("select_dialog", "fill_dialog"):
            b_id = payload.get("blank_b_vocab_id")
            if b_id not in temp_ids:
                errors.append(f"{label}: blank_b_vocab_id='{b_id}' không tồn tại trong vocab")

        if vtid in coverage:
            coverage[vtid].add(etype)

    # --- Dialogue ---
    if not (7 <= len(dialogue_lines) <= 10):
        warnings.append(f"dialogue.lines có {len(dialogue_lines)} câu (khuyến nghị 7-10 câu)")
    for i, line in enumerate(dialogue_lines):
        for vid in line.get("highlight_vocab_temp_ids", []):
            if vid not in temp_ids:
                errors.append(f"dialogue.lines[{i}]: highlight_vocab_temp_ids chứa temp_id không tồn tại: '{vid}'")

    # --- Coverage check (warning, không phải lỗi cứng) ---
    for v in vocab_list:
        tid = v.get("temp_id")
        if tid not in coverage:
            continue
        missing_types = RECOMMENDED_COVERAGE - coverage[tid]
        if missing_types:
            warnings.append(f"Từ '{v.get('word')}' (temp_id={tid}) thiếu dạng bài: {sorted(missing_types)}")

    return errors, warnings


def main():
    if len(sys.argv) < 2:
        print("Cách dùng: python3 validate_import.py file1.json [file2.json ...]")
        sys.exit(1)

    exit_code = 0
    for path in sys.argv[1:]:
        errors, warnings = validate_file(path)
        print(f"\n=== {path} ===")
        if errors:
            exit_code = 1
            print(f"❌ {len(errors)} LỖI:")
            for e in errors:
                print(f"  - {e}")
        else:
            print("✅ Không có lỗi cấu trúc")
        if warnings:
            print(f"⚠️  {len(warnings)} cảnh báo:")
            for w in warnings:
                print(f"  - {w}")

    sys.exit(exit_code)


if __name__ == "__main__":
    main()
