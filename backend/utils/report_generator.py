from __future__ import annotations

from io import BytesIO
from typing import Any, Dict, List

from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import ListFlowable, ListItem, PageBreak, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle


def generate_pdf_report(payload: Dict[str, Any]) -> bytes:
    """
    Full structured report: query, summary, evidence table, synthesis, risks, confidence, defense.
    """
    from reportlab.lib import colors

    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        title="Research War Room — Evidence Report",
    )
    styles = getSampleStyleSheet()
    story: List[Any] = []

    story.append(Paragraph("AI Research — Evidence-Locked Report", styles["Title"]))
    story.append(Spacer(1, 8))
    if payload.get("evidence_guarantee"):
        story.append(Paragraph(f"<b>Traceability</b>: {payload.get('evidence_guarantee', '')}", styles["BodyText"]))
    story.append(Spacer(1, 10))

    q = payload.get("query") or ""
    story.append(Paragraph("Query", styles["Heading2"]))
    story.append(Paragraph(_escape(q), styles["BodyText"]))

    subq = (payload.get("query_decomposition") or {}).get("sub_questions") or []
    if subq:
        story.append(Paragraph("Sub-questions (planner)", styles["Heading2"]))
        story.append(_bullets([str(s) for s in subq[:8]], styles))

    story.append(Paragraph("Executive summary (synthesizer)", styles["Heading2"]))
    summary = (payload.get("synthesis") or {}).get("executive_summary") if isinstance(payload.get("synthesis"), dict) else None
    story.append(Paragraph(_escape(summary or payload.get("final_answer") or ""), styles["BodyText"]))

    story.append(Paragraph("Confidence & risk", styles["Heading2"]))
    story.append(Paragraph(f"Model confidence (0-1): {_escape(str(payload.get('confidence')))}", styles["BodyText"]))
    story.append(Paragraph(f"Risk label: {_escape(str(payload.get('risk') or ''))}", styles["BodyText"]))

    cb = payload.get("confidence_breakdown") or {}
    if isinstance(cb, dict) and cb.get("blended_0_100") is not None:
        story.append(Paragraph(f"Blended 0-100: {_escape(str(cb.get('blended_0_100')))}", styles["BodyText"]))
    if isinstance(payload.get("deterministic_confidence"), dict):
        story.append(
            Paragraph(
                f"Deterministic engine: {_escape(str((payload.get('deterministic_confidence') or {}).get('confidence_score')))} — "
                f"{_escape(str((payload.get('deterministic_confidence') or {}).get('confidence_breakdown')))}",
                styles["BodyText"],
            )
        )
    ad = payload.get("answer_defense")
    if isinstance(ad, dict):
        story.append(Paragraph("How to verify", styles["Heading3"]))
        for x in (ad.get("how_to_verify") or [])[:12]:
            story.append(Paragraph(f"– {_escape(str(x))}", styles["BodyText"]))
        story.append(Paragraph("Where the system can be wrong", styles["Heading3"]))
        for x in (ad.get("where_system_might_be_wrong") or [])[:8]:
            story.append(Paragraph(f"– {_escape(str(x))}", styles["BodyText"]))

    story.append(Paragraph("Critic (structured)", styles["Heading2"]))
    c = payload.get("critique")
    if isinstance(c, dict):
        for label, k in (("Weaknesses", "weaknesses"), ("Risks", "risks")):
            arr = c.get(k) or []
            if not arr:
                continue
            story.append(Paragraph(label, styles["Heading3"]))
            for item in arr[:20]:
                if isinstance(item, dict) and item.get("text"):
                    s = f"{item.get('text')}"
                    if item.get("paper_ids"):
                        s += f" [ids: {item.get('paper_ids')}]"
                else:
                    s = str(item)
                story.append(Paragraph(f"– {_escape(s)}", styles["BodyText"]))
        if c.get("readable_summary"):
            story.append(Paragraph("Summary", styles["Heading3"]))
            story.append(Paragraph(_escape(str(c["readable_summary"])), styles["BodyText"]))
    else:
        story.append(Paragraph(_escape(str(c or "—")), styles["BodyText"]))

    ev = payload.get("evidence_table") or []
    if ev:
        story.append(PageBreak())
        story.append(Paragraph("Evidence table (corpus)", styles["Heading2"]))
        data = [[_escape("paper_id"), "Title (trunc.)", "Year", "Citations", "url"]]
        for row in ev[:25]:
            data.append(
                [
                    _escape(str((row or {}).get("paper_id", ""))[:20]),
                    _escape(str((row or {}).get("title", ""))[:70]),
                    _escape(str((row or {}).get("year", ""))[:4]),
                    _escape(str((row or {}).get("citations", ""))[:6]),
                    _escape(str((row or {}).get("url", ""))[:40]),
                ]
            )
        t = Table(data, repeatRows=1, colWidths=[68, 160, 36, 50, 130])
        t.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1e293b")),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                    ("FONTSIZE", (0, 0), (-1, -1), 7),
                ]
            )
        )
        story.append(t)
        story.append(Spacer(1, 12))

    kf = (payload.get("synthesis") or {}).get("key_findings") if isinstance(payload.get("synthesis"), dict) else None
    if not kf:
        kf = payload.get("key_points") or []
    story.append(Paragraph("Key findings (cited in synthesis)", styles["Heading2"]))
    if isinstance(kf, list) and kf and isinstance(kf[0], dict):
        for it in kf[:20]:
            story.append(
                Paragraph(
                    f"– {_escape(str((it or {}).get('text','')))} " f"[{ _escape(str((it or {}).get('paper_ids','')) )}]",
                    styles["BodyText"],
                )
            )
    else:
        story.append(_bullets([str(x) for x in (kf or []) if x], styles))

    gaps = payload.get("gaps")
    if gaps:
        story.append(Paragraph("Gaps (consensus)", styles["Heading2"]))
        if isinstance(gaps, list):
            story.append(_bullets([str(x) for x in gaps[:20]], styles))
        else:
            story.append(Paragraph(_escape(str(gaps)[:4000]), styles["BodyText"]))

    doc.build(story)
    return buffer.getvalue()


def _bullets(items: List[str], styles) -> ListFlowable:
    lis: List = []
    for it in items:
        lis.append(ListItem(Paragraph(_escape(str(it)), styles["BodyText"])))
    return ListFlowable(lis, bulletType="bullet", leftIndent=10)


def _escape(s: str) -> str:
    return (s or "").replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
