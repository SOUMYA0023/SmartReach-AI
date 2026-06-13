class ForecastService:
    """
    Heuristic forecast model v1.0.
    Assumptions (document these explicitly):
      - WhatsApp: 95% delivery, 75% open, 25% click, 4% conversion
      - Email: 80% delivery, 30% open, 8% click, 2% conversion
      - SMS: 90% delivery, 50% open, 15% click, 3% conversion
      - RCS: 85% delivery, 45% open, 20% click, 3.5% conversion
    Segment multipliers:
      - VIP: 1.3x all rates
      - Loyal: 1.15x
      - Potential Loyalist: 1.0x
      - At Risk: 0.8x
      - Dormant: 0.6x
      - New: 0.9x
    Average order value assumptions by campaign type:
      - winback: ₹800
      - loyalty: ₹1200
      - upsell: ₹1500
      - cross_sell: ₹600
      - retention: ₹900
    """

    CHANNEL_RATES = {
        "whatsapp": {"delivery": 0.95, "open": 0.75, "click": 0.25, "conversion": 0.04},
        "email": {"delivery": 0.80, "open": 0.30, "click": 0.08, "conversion": 0.02},
        "sms": {"delivery": 0.90, "open": 0.50, "click": 0.15, "conversion": 0.03},
        "rcs": {"delivery": 0.85, "open": 0.45, "click": 0.20, "conversion": 0.035},
    }

    SEGMENT_MULTIPLIERS = {
        "VIP": 1.3,
        "Loyal": 1.15,
        "Potential Loyalist": 1.0,
        "At Risk": 0.8,
        "Dormant": 0.6,
        "New": 0.9,
    }

    AOV_BY_TYPE = {
        "winback": 800,
        "loyalty": 1200,
        "upsell": 1500,
        "cross_sell": 600,
        "retention": 900,
    }

    def calculate(
        self,
        channel: str,
        segment: str,
        campaign_type: str,
        audience_size: int,
    ) -> dict:
        rates = self.CHANNEL_RATES.get((channel or "email").lower(), self.CHANNEL_RATES["email"])
        multiplier = self.SEGMENT_MULTIPLIERS.get(segment, 1.0)
        aov = self.AOV_BY_TYPE.get(campaign_type.lower(), 900)

        open_rate = min(rates["open"] * multiplier, 0.99)
        ctr = min(rates["click"] * multiplier, 0.99)
        conversion_rate = min(rates["conversion"] * multiplier, 0.99)

        delivered = int(audience_size * rates["delivery"])
        opened = int(delivered * open_rate)
        clicked = int(opened * ctr)
        converted = int(clicked * conversion_rate)
        expected_revenue = round(
            audience_size * rates["delivery"] * open_rate * ctr * conversion_rate * aov, 2
        )

        return {
            "open_rate": round(open_rate * 100, 2),
            "ctr": round(ctr * 100, 2),
            "conversion_rate": round(conversion_rate * 100, 2),
            "conversion": round(conversion_rate * 100, 2),
            "revenue": round(expected_revenue, 2),
            "expected_revenue": round(expected_revenue, 2),
            "audience_size": audience_size,
            "delivered": delivered,
            "opened": opened,
            "clicked": clicked,
            "converted": converted,
        }
