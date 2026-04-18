# PantryPal
Group #3 - Capstone Project - PROG8950 - Computer Applications Development (Winter 2026) - Conestoga College

# Timeline

## 8-Week Development Timeline (5-Person Team)
Team Size: 5 developers

Duration: 8 weeks (February - April 2026)

Tech Stack: React, Node.js, PostgreSQL, LLM/AI for receipt scanning (TBD)

Methodology: Agile with 2-week sprints

## Sprint Breakdown
### Sprint 0: Project Setup & Planning (Week 1: Feb 10-16)
Goals: Foundation and architecture setup

Sprint Deliverable: ✅ Working dev environment, deployed skeleton app, auth working

### Sprint 1: Core Inventory & User Management (Weeks 2-3: Feb 17 - Mar 2)
Goals: Users can manage inventory

Sprint Deliverable: ✅ Users can sign up, log in, add/manage inventory
Testing Focus: Unit tests for API endpoints, component tests for forms

### Sprint 2: Recipe Search & Matching (Weeks 4-5: Mar 3-16)
Goals: Users can find recipes based on inventory

Sprint Deliverable: ✅ Full recipe discovery workflow: inventory → search → view → shopping list
Testing Focus: Integration tests for recipe matching, E2E tests for search flow

### Sprint 3: Receipt Scanning (LLM Integration) (Weeks 6-7: Mar 17-30)
Goals: Automate inventory entry via receipt scanning
⚠️ HIGH PRIORITY SPRINT - All hands on deck for critical feature

Sprint Deliverable: ✅ Receipt scanning works with 80%+ accuracy on common grocery receipts
Critical Success Factors:

Choose LLM early (recommend: Claude 3.5 Sonnet or GPT-4 Vision)
- Build robust error handling from day 1
- Always provide manual override option
- Focus on common grocery store formats first
- Test with real receipts continuously

Risk Mitigation:
- Parallel track: Keep manual entry as primary method
- Budget for LLM API costs (~-100 for testing phase)
- Have fallback to manual entry if parsing fails
- Don't block other features on receipt scanning success


### Sprint 4: Community Features & Expiration Tracking (Week 8: Mar 31 - Apr 6) (IF TIME PERMITS)
Goals: Social features and waste reduction tools 

Sprint Deliverable: ✅ Users can share recipe results, get expiration alerts, browse community feed
Testing Focus: E2E tests for complete user journeys, performance testing

### Sprint 5: Polish, Testing & Documentation (Week 9-10: Apr 7-20)
Goals: Production-ready application with comprehensive documentation
ALL TEAM - Focus on Quality
Week 9: Testing & Bug Fixes
Week 10: Documentation & Deployment

Sprint Deliverable: ✅ Production-ready app, complete documentation, presentation materials

## Run Locally

```bash
npm install
npm run dev
```

This UI proxies API calls to two local Node servers:

```bash
npm run dev:api
```

```bash
npm run dev:user
```

## AWS Bedrock Vision Setup (Key Hidden on Server)

Feature flow:
- Open `Scan Receipt` tab.
- Upload an image (receipt, grocery photo, pantry/spice rack).
- Click `Analyze with AWS`.
- Review and edit extracted `name` and `quantity`.
- Save to pantry.
- JSON extraction is shown in the scan results panel.

Create a `.env` file in project root:

```bash
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
AWS_REGION=us-east-1
BEDROCK_MODEL_ID=amazon.nova-lite-v1:0
PORT=8787
```

Run two terminals in project root:

```bash
npm run dev:api
```

```bash
npm run dev
```

## Spoonacular Setup (Recipes/Videos)

Create a `.env` file in project root:

```bash
SPOONACULAR_API_BASE_URL=https://api.spoonacular.com
SPOONACULAR_API_KEYS=your_spoonacular_key_1,your_spoonacular_key_2
USER_DATA_PORT=8788
```

Start the proxy server:

```bash
npm run dev:user
```
