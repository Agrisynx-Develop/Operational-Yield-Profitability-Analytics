#!/usr/bin/env python3
"""
Operational Yield & Profitability Analytics Engine
Calculates rolling shrinkage, yields, prime/secondary/tertiary/trimming cut segmentations,
and brand-level quality benchmarks.
"""

import sys
import json
import math
from datetime import datetime
from typing import Dict, List, Any, Optional

STANDARD_CUT_SEGMENTS = ["Prime Cuts", "Secondary Cuts", "Tertiary Cuts", "Trimming"]

def parse_iso(dt_str: Optional[str]) -> Optional[datetime]:
    if not dt_str:
        return None
    try:
        clean = dt_str.replace("Z", "+00:00")
        return datetime.fromisoformat(clean)
    except Exception:
        try:
            return datetime.strptime(dt_str[:19], "%Y-%m-%dT%H:%M:%S")
        except Exception:
            return None

def calculate_yield_metrics(payload: Dict[str, Any]) -> Dict[str, Any]:
    items: List[Dict[str, Any]] = payload.get("items", [])
    segments: List[Dict[str, Any]] = payload.get("segments", [])
    target_margin: float = float(payload.get("targetMarginPercent", 20.0))
    purchase_price: float = float(payload.get("purchasePricePerKg", 95000.0))
    op_cost: float = float(payload.get("operationalCostPerKg", 2500.0))

    # 1. Thawing Analytics
    completed_thawing = [
        i for i in items 
        if i.get("weightAfterThawing") is not None and float(i.get("weightBeforeThawing", 0)) > 0
    ]

    thawing_losses: List[float] = []
    brand_stats: Dict[str, Dict[str, Any]] = {}
    batch_stats: Dict[str, Dict[str, Any]] = {}

    total_raw_kg = 0.0
    total_thawed_kg = 0.0

    for it in completed_thawing:
        raw_w = float(it.get("weightBeforeThawing", 0.0))
        thawed_w = float(it.get("weightAfterThawing", raw_w))
        loss_kg = max(0.0, raw_w - thawed_w)
        loss_pct = (loss_kg / raw_w * 100.0) if raw_w > 0 else 0.0
        thawing_losses.append(loss_pct)

        total_raw_kg += raw_w
        total_thawed_kg += thawed_w

        # Brand Quality Aggregation
        brand = it.get("brand") or "General / Unspecified"
        if brand not in brand_stats:
            brand_stats[brand] = {
                "brand": brand,
                "sampleCount": 0,
                "totalRawKg": 0.0,
                "totalThawedKg": 0.0,
                "totalLossKg": 0.0,
                "lossRates": []
            }
        b_entry = brand_stats[brand]
        b_entry["sampleCount"] += 1
        b_entry["totalRawKg"] += raw_w
        b_entry["totalThawedKg"] += thawed_w
        b_entry["totalLossKg"] += loss_kg
        b_entry["lossRates"].append(loss_pct)

        # Batch Aggregation
        batch_id = it.get("batchId") or "Batch Default"
        batch_purpose = it.get("batchPurpose") or it.get("openingPurpose") or "Display Siang"
        if batch_id not in batch_stats:
            batch_stats[batch_id] = {
                "batchId": batch_id,
                "batchPurpose": batch_purpose,
                "batchStatus": it.get("batchStatus") or "OPEN",
                "itemCount": 0,
                "totalRawKg": 0.0,
                "totalThawedKg": 0.0,
                "totalLossKg": 0.0,
                "startTime": it.get("thawingStartTime"),
                "endTime": it.get("thawingEndTime")
            }
        bt = batch_stats[batch_id]
        bt["itemCount"] += 1
        bt["totalRawKg"] += raw_w
        bt["totalThawedKg"] += thawed_w
        bt["totalLossKg"] += loss_kg

    # Calculate Brand Quality Score
    final_brand_analysis = []
    for b_name, b_val in brand_stats.items():
        avg_loss = sum(b_val["lossRates"]) / len(b_val["lossRates"]) if b_val["lossRates"] else 0.0
        yield_rate = max(0.0, 100.0 - avg_loss)
        
        # Rating based on thawing stability
        if avg_loss <= 2.0:
            quality_grade = "Grade A (Optimal Yield)"
        elif avg_loss <= 3.5:
            quality_grade = "Grade B (Standard Yield)"
        else:
            quality_grade = "Grade C (High Shrinkage)"

        final_brand_analysis.append({
            "brand": b_name,
            "sampleCount": b_val["sampleCount"],
            "totalRawKg": round(b_val["totalRawKg"], 3),
            "totalThawedKg": round(b_val["totalThawedKg"], 3),
            "averageShrinkagePercent": round(avg_loss, 2),
            "effectiveYieldPercent": round(yield_rate, 2),
            "qualityGrade": quality_grade
        })
    final_brand_analysis.sort(key=lambda x: x["averageShrinkagePercent"])

    # 2. Rolling Shrinkage Calculation
    sample_count = len(thawing_losses)
    overall_avg_shrinkage = sum(thawing_losses) / sample_count if sample_count > 0 else 2.5
    rolling_3 = sum(thawing_losses[-3:]) / len(thawing_losses[-3:]) if sample_count >= 3 else overall_avg_shrinkage
    rolling_7 = sum(thawing_losses[-7:]) / len(thawing_losses[-7:]) if sample_count >= 7 else overall_avg_shrinkage

    active_shrinkage_rate = rolling_3 if sample_count >= 3 else overall_avg_shrinkage

    # 3. Cut Segmentation Analytics (Prime Cuts, Secondary Cuts, Tertiary Cuts, Trimming)
    segment_analytics: Dict[str, Dict[str, Any]] = {
        cut: {
            "cutCategory": cut,
            "totalWeightKg": 0.0,
            "salesKg": 0.0,
            "portionPercent": 0.0,
            "count": 0
        }
        for cut in STANDARD_CUT_SEGMENTS
    }

    total_cut_weight = 0.0
    for seg in segments:
        cat = seg.get("cutCategory") or seg.get("segmentCategory") or "Secondary Cuts"
        # Normalize into standard 4 cuts
        cat_lower = str(cat).lower()
        if "prime" in cat_lower or "has" in cat_lower or "sirloin" in cat_lower or "tenderloin" in cat_lower:
            norm_cat = "Prime Cuts"
        elif "tertiary" in cat_lower or "tertier" in cat_lower or "iga" in cat_lower or "rawon" in cat_lower or "shank" in cat_lower:
            norm_cat = "Tertiary Cuts"
        elif "trim" in cat_lower or "tetelan" in cat_lower or "giling" in cat_lower or "lemak" in cat_lower:
            norm_cat = "Trimming"
        else:
            norm_cat = "Secondary Cuts"

        w = float(seg.get("actualWeight", 0.0))
        sales = float(seg.get("salesKg", 0.0))
        total_cut_weight += w

        segment_analytics[norm_cat]["totalWeightKg"] += w
        segment_analytics[norm_cat]["salesKg"] += sales
        segment_analytics[norm_cat]["count"] += 1

    cut_breakdown_list = []
    for c_name, c_data in segment_analytics.items():
        pct = (c_data["totalWeightKg"] / total_cut_weight * 100.0) if total_cut_weight > 0 else 0.0
        c_data["portionPercent"] = round(pct, 2)
        c_data["totalWeightKg"] = round(c_data["totalWeightKg"], 3)
        c_data["salesKg"] = round(c_data["salesKg"], 3)
        cut_breakdown_list.append(c_data)

    # 4. Profitability & Dynamic HPP Recommendation
    effective_yield_pct = max(1.0, 100.0 - active_shrinkage_rate)
    real_cost_basis = purchase_price / (effective_yield_pct / 100.0)
    real_hpp_per_kg = real_cost_basis + op_cost
    hidden_loss_per_kg = max(0.0, real_hpp_per_kg - (purchase_price + op_cost))

    # Min Selling Price for targeted profit margin
    margin_decimal = max(0.01, min(0.95, target_margin / 100.0))
    min_selling_price = real_hpp_per_kg / (1.0 - margin_decimal)
    commercial_recommendation = math.ceil(min_selling_price / 500.0) * 500.0

    # Efficiency Status
    if active_shrinkage_rate <= 2.0:
        efficiency_status = "OPTIMAL"
        risk_level = "Low Risk - Target Margin Secured"
    elif active_shrinkage_rate <= 3.5:
        efficiency_status = "WARNING"
        risk_level = "Moderate - Watch Thawing Temperature & Chiller Loss"
    else:
        efficiency_status = "CRITICAL"
        risk_level = "High Risk - Immediate Price Adjustment or Yield Audit Required"

    return {
        "status": "success",
        "engine": "Operational Yield & Profitability Analytics (Python 3.10)",
        "timestamp": datetime.now().isoformat(),
        "thawingAnalytics": {
            "samplesProcessed": sample_count,
            "totalRawKg": round(total_raw_kg, 3),
            "totalThawedKg": round(total_thawed_kg, 3),
            "totalLossKg": round(total_raw_kg - total_thawed_kg, 3),
            "activeShrinkagePercent": round(active_shrinkage_rate, 2),
            "rolling3AveragePercent": round(rolling_3, 2),
            "rolling7AveragePercent": round(rolling_7, 2),
            "overallAveragePercent": round(overall_avg_shrinkage, 2),
            "effectiveYieldPercent": round(effective_yield_pct, 2),
            "efficiencyStatus": efficiency_status,
            "riskLevel": risk_level
        },
        "pricingAnalytics": {
            "purchasePricePerKg": purchase_price,
            "operationalCostPerKg": op_cost,
            "nominalCostPerKg": purchase_price + op_cost,
            "realHppPerKg": round(real_hpp_per_kg, 2),
            "hiddenLossPerKg": round(hidden_loss_per_kg, 2),
            "targetMarginPercent": target_margin,
            "minSellingPricePerKg": round(min_selling_price, 2),
            "recommendedSellingPricePerKg": commercial_recommendation
        },
        "cutSegmentationBreakdown": cut_breakdown_list,
        "brandQualityRankings": final_brand_analysis,
        "batchSummaries": list(batch_stats.values())
    }

def main():
    if len(sys.argv) > 1 and sys.argv[1] == "--test":
        test_payload = {
            "items": [
                {"weightBeforeThawing": 100.0, "weightAfterThawing": 97.5, "brand": "Swift", "batchId": "BATCH-01", "openingPurpose": "Penjualan Malam"},
                {"weightBeforeThawing": 50.0, "weightAfterThawing": 48.0, "brand": "Teys", "batchId": "BATCH-01", "openingPurpose": "Penjualan Malam"},
                {"weightBeforeThawing": 80.0, "weightAfterThawing": 76.8, "brand": "Kilcoy", "batchId": "BATCH-02", "openingPurpose": "Display Siang"}
            ],
            "segments": [
                {"cutCategory": "Prime Cuts", "actualWeight": 45.0, "salesKg": 30.0},
                {"cutCategory": "Secondary Cuts", "actualWeight": 95.0, "salesKg": 60.0},
                {"cutCategory": "Tertiary Cuts", "actualWeight": 50.0, "salesKg": 25.0},
                {"cutCategory": "Trimming", "actualWeight": 25.0, "salesKg": 10.0}
            ],
            "targetMarginPercent": 22.0,
            "purchasePricePerKg": 98000.0,
            "operationalCostPerKg": 3000.0
        }
        res = calculate_yield_metrics(test_payload)
        print(json.dumps(res, indent=2))
        return

    try:
        raw_input = sys.stdin.read()
        if not raw_input.strip():
            sys.exit(0)
        data = json.loads(raw_input)
        result = calculate_yield_metrics(data)
        print(json.dumps(result))
    except Exception as e:
        err_res = {"status": "error", "message": str(e)}
        print(json.dumps(err_res))
        sys.exit(1)

if __name__ == "__main__":
    main()
