## Multi-Program Paywall Catalog Design

- Scope: make all six programs sellable with temporary real prices, while keeping the paywall targeted to the questionnaire recommendation.
- RevenueCat shape: keep one current `main` offering and attach six one-time packages to it.
- Visibility rules:
  - `six_day_reset` recommendation shows `six_day_reset` and `ninety_day_transform`
  - every other recommendation shows only its matching program
  - completed or archived `six_day_reset` still narrows to `ninety_day_transform`
- Temporary test-store prices:
  - short programs: `six_day_reset`, `sleep_disorder_reset` at `$4.99`
  - full programs: `ninety_day_transform`, `age_reversal`, `energy_vitality`, `male_sexual_health` at `$19.99`
- App changes:
  - expand the RevenueCat catalog and program access types to all six slugs
  - make paywall filtering recommendation-aware through `profiles.recommended_program`
  - replace remaining two-program assumptions in Home/Program/Profile and progress length logic so newly purchased programs remain usable
