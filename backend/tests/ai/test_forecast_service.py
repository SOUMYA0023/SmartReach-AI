import pytest

from app.services.forecast_service import ForecastService


@pytest.fixture
def service():
    return ForecastService()


CHANNELS = ["whatsapp", "email", "sms", "rcs"]
SEGMENTS = ["VIP", "Loyal", "Potential Loyalist", "At Risk", "Dormant", "New"]
CAMPAIGN_TYPES = ["winback", "loyalty", "upsell", "cross_sell", "retention"]


@pytest.mark.parametrize("channel", CHANNELS)
@pytest.mark.parametrize("segment", SEGMENTS)
def test_forecast_all_channel_segment_combinations(service, channel, segment):
    result = service.calculate(channel=channel, segment=segment, campaign_type="retention", audience_size=1000)
    assert result["open_rate"] > 0
    assert result["ctr"] > 0
    assert result["conversion"] > 0
    assert result["revenue"] >= 0
    assert result["audience_size"] == 1000


@pytest.mark.parametrize("campaign_type", CAMPAIGN_TYPES)
def test_forecast_campaign_types(service, campaign_type):
    result = service.calculate(channel="email", segment="Loyal", campaign_type=campaign_type, audience_size=500)
    assert result["revenue"] >= 0


def test_vip_multiplier_higher_than_dormant(service):
    vip = service.calculate("whatsapp", "VIP", "retention", 1000)
    dormant = service.calculate("whatsapp", "Dormant", "retention", 1000)
    assert vip["open_rate"] > dormant["open_rate"]
    assert vip["ctr"] > dormant["ctr"]
